import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/data/db'
import { catalog, nutrientsFor } from '@/data/foodDb'
import { addNutrients, emptyNutrients, type Nutrients } from '@/data/nutrients'
import type { CustomFood, DiaryEntry, Food, FoodRef, MealId, Profile, Targets } from '@/data/types'
import { computeTargets } from '@/lib/nutrition'
import { addDays, dateKey, startOfWeek, weekdayIndex } from '@/lib/dates'

/** Perfil: undefined = cargando, null = no existe */
export function useProfile(): Profile | null | undefined {
  return useLiveQuery(async () => (await db.profile.get('me')) ?? null, [])
}

export function useTargets(profile?: Profile | null): Targets | null {
  return useMemo(() => (profile ? computeTargets(profile) : null), [profile])
}

/** Catálogo de alimentos cargado (USDA + curados + personalizados) */
export function useCatalogReady(): boolean {
  const ready = useSyncExternalStore(cb => catalog.subscribe(cb), () => catalog.loaded)
  useEffect(() => { catalog.load() }, [])
  // Sincroniza alimentos personalizados
  const custom = useLiveQuery(() => db.customFoods.toArray(), [])
  useEffect(() => { if (custom && catalog.loaded) catalog.setCustom(custom) }, [custom, ready])
  return ready
}

/** Alimentos propios y ajustes del usuario (registros en bruto) */
export function useCustomFoods(): CustomFood[] | undefined {
  const list = useLiveQuery(() => db.customFoods.toArray(), [])
  return list?.filter(c => !c.deletedAt)
}

/** Versión del catálogo que cambia cuando se añaden alimentos personalizados */
export function useCatalogVersion(): number {
  const [v, setV] = useState(0)
  useEffect(() => catalog.subscribe(() => setV(x => x + 1)), [])
  return v
}

export function useDiary(date: string): DiaryEntry[] | undefined {
  return useLiveQuery(() => db.diary.where('date').equals(date).sortBy('order'), [date])
}

export function useRecipes() {
  return useLiveQuery(() => db.recipes.orderBy('uses').reverse().toArray(), [])
}

export function usePlans() {
  return useLiveQuery(() => db.plans.orderBy('updatedAt').reverse().toArray(), [])
}

export function useActivePlan() {
  return useLiveQuery(async () => (await db.plans.filter(p => p.isActive).first()) ?? null, [])
}

export function useUsage() {
  return useLiveQuery(() => db.usage.toArray(), [])
}

/** kcal por día de la semana que contiene `date` (lunes→domingo) */
export function useWeekKcal(date: string, ready: boolean): number[] | undefined {
  const start = startOfWeek(date)
  const end = addDays(start, 6)
  const entries = useLiveQuery(() => db.diary.where('date').between(start, end, true, true).toArray(), [start, end])
  useCatalogVersion()
  return useMemo(() => {
    if (!entries || !ready) return undefined
    const out = [0, 0, 0, 0, 0, 0, 0]
    for (const e of entries) out[weekdayIndex(e.date)] += nutrientsOfRef(e).kcal
    return out
  }, [entries, ready])
}

/** Alimentos más usados en una comida concreta (últimos 90 días) */
export function useMealFrequent(meal: MealId | undefined, limit = 10): Food[] {
  const since = addDays(dateKey(), -90)
  const entries = useLiveQuery(() => (meal ? db.diary.where('meal').equals(meal).and(e => e.date >= since).toArray() : Promise.resolve([] as DiaryEntry[])), [meal, since])
  useCatalogVersion()
  return useMemo(() => {
    if (!entries) return []
    const count = new Map<string, number>()
    for (const e of entries) count.set(e.foodId, (count.get(e.foodId) ?? 0) + 1)
    return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => catalog.get(id)).filter(Boolean).slice(0, limit) as Food[]
  }, [entries, limit])
}

export function useDayExtras(date: string) {
  return useLiveQuery(async () => (await db.extras.where('date').equals(date).first()) ?? null, [date])
}

export function useWeights() {
  return useLiveQuery(() => db.extras.filter(e => e.weightKg != null).sortBy('date'), [])
}

// ───────────── Cálculos ─────────────

export function nutrientsOfRef(ref: FoodRef): Nutrients {
  const food = catalog.get(ref.foodId)
  if (!food) return emptyNutrients()
  return addNutrients(emptyNutrients(), nutrientsFor(food, ref.state), ref.grams / 100)
}

export function sumRefs(refs: FoodRef[]): Nutrients {
  let total = emptyNutrients()
  for (const r of refs) total = addNutrients(total, nutrientsOfRef(r))
  return total
}

export interface ResolvedItem extends DiaryEntry { food: Food | undefined; nutrients: Nutrients }

export interface DaySummary {
  total: Nutrients
  byMeal: Record<MealId, { items: ResolvedItem[]; nutrients: Nutrients }>
}

export function useDaySummary(date: string, ready: boolean): DaySummary | undefined {
  const entries = useDiary(date)
  useCatalogVersion()
  return useMemo(() => {
    if (!entries || !ready) return undefined
    const byMeal = {} as DaySummary['byMeal']
    for (const m of ['desayuno', 'media-manana', 'comida', 'merienda', 'cena'] as MealId[]) byMeal[m] = { items: [], nutrients: emptyNutrients() }
    let total = emptyNutrients()
    for (const e of entries) {
      const food = catalog.get(e.foodId)
      const n = nutrientsOfRef(e)
      byMeal[e.meal].items.push({ ...e, food, nutrients: n })
      byMeal[e.meal].nutrients = addNutrients(byMeal[e.meal].nutrients, n)
      total = addNutrients(total, n)
    }
    return { total, byMeal }
  }, [entries, ready])
}

/** Alimentos que chocan con las intolerancias del perfil */
export function foodConflicts(food: Food | undefined, profile: Profile | null | undefined): string[] {
  if (!food || !profile) return []
  const out: string[] = []
  for (const a of food.allergens) if (profile.intolerances.includes(a)) out.push(a)
  const text = `${food.name} ${food.aliases.join(' ')} ${food.nameEn ?? ''}`.toLowerCase()
  for (const kw of profile.customIntolerances) if (kw && text.includes(kw.toLowerCase())) out.push(kw)
  return out
}
