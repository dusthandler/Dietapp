import { catalog, hasVariants, nutrientsFor } from '@/data/foodDb'
import { MEAL_TEMPLATES, TEMPLATE_BY_ID, type MealTemplate } from '@/data/mealTemplates'
import { uid } from '@/data/db'
import { emptyNutrients, addNutrients, type Nutrients } from '@/data/nutrients'
import type { Complexity, Food, MealId, Plan, PlanDay, PlanMeal, PortionState, Profile, RecipeIngredient, Targets, Variety } from '@/data/types'
import { foodConflicts, sumRefs } from '@/store/hooks'
import { roundGrams, solveAndRound, solveDay, type MealDraft } from './planSolver'

export interface GenParams { complexity: Complexity; variety: Variety; mealsPerDay: 3 | 4 | 5; /** ids de alimentos que deben aparecer en la dieta */ mustHave?: string[] }

/** Reparto de kcal por comida según número de comidas */
export function mealSplit(mealsPerDay: 3 | 4 | 5): Partial<Record<MealId, number>> {
  if (mealsPerDay === 3) return { desayuno: 0.27, comida: 0.40, cena: 0.33 }
  if (mealsPerDay === 4) return { desayuno: 0.25, comida: 0.37, merienda: 0.10, cena: 0.28 }
  return { desayuno: 0.22, 'media-manana': 0.08, comida: 0.35, merienda: 0.08, cena: 0.27 }
}

const COMPLEXITY_RANK: Record<Complexity, number> = { easy: 0, medium: 1, complex: 2 }
const MEAL_ORDER: MealId[] = ['desayuno', 'media-manana', 'comida', 'merienda', 'cena']

function seededRandom(seed: number) {
  let s = Math.floor(Math.abs(seed)) % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

export function templateAllowed(t: MealTemplate, profile: Profile): boolean {
  for (const it of t.items) {
    const food = catalog.get(`es:${it.f}`)
    if (!food) return false
    if (foodConflicts(food, profile).length > 0 && !it.fixed) return false
    if (profile.dislikedFoodIds.includes(food.id)) return false
  }
  return true
}

/**
 * Borrador de una plantilla escalada en bloque a unas kcal (punto de partida del optimizador).
 * `base` guarda la receta a ese tamaño: el optimizador procura no alejarse mucho de ella.
 */
function draftFromTemplate(t: MealTemplate, meal: MealId, kcalTarget: number): MealDraft {
  const items: RecipeIngredient[] = t.items.map(it => ({ id: uid(), foodId: `es:${it.f}`, grams: it.g, state: it.s, portionLabel: it.label }))
  const fixed = t.items.map(it => !!it.fixed)
  const kcalOf = (r: RecipeIngredient) => sumRefs([r]).kcal
  const fixedKcal = items.reduce((s, r, i) => s + (fixed[i] ? kcalOf(r) : 0), 0)
  const scalableKcal = items.reduce((s, r, i) => s + (fixed[i] ? 0 : kcalOf(r)), 0)
  const factor = scalableKcal > 0 ? clamp((kcalTarget - fixedKcal) / scalableKcal, 0.6, 1.7) : 1
  const scaled = items.map((r, i) => (fixed[i] ? r : { ...r, grams: r.grams * factor, portionLabel: Math.abs(factor - 1) < 0.08 ? r.portionLabel : undefined }))
  return { meal: { id: uid(), meal, title: t.name, emoji: t.emoji, items: scaled, templateId: t.id }, fixed, base: scaled.map(r => r.grams) }
}

/** Macros de una comida a partir de su parte de las kcal del día */
function mealTargets(targets: Targets, share: number): Targets {
  return { ...targets, kcal: targets.kcal * share, protein: targets.protein * share, carbs: targets.carbs * share, fat: targets.fat * share, micros: {} }
}

/** Instancia una plantilla ajustada a una comida concreta (kcal y macros de su parte del día) */
export function instantiateTemplate(t: MealTemplate, meal: MealId, kcalTarget: number, _proteinTarget?: number, targets?: Targets): PlanMeal {
  const draft = draftFromTemplate(t, meal, kcalTarget)
  if (targets) solveAndRound([draft], mealTargets(targets, kcalTarget / targets.kcal))
  else draft.meal.items = draft.meal.items.map((it, i) => (draft.fixed[i] ? it : { ...it, grams: roundGrams(it.grams) }))
  return draft.meal
}

// ───────────── Alimentos base ("lo que tengo en la nevera") ─────────────

/** Comidas preferidas para colocar un alimento según su rol */
const ROLE_SLOTS: Record<string, MealId[]> = {
  protein: ['comida', 'cena', 'desayuno'],
  carb: ['desayuno', 'comida', 'cena', 'merienda'],
  dairy: ['desayuno', 'merienda', 'media-manana', 'cena'],
  fruit: ['media-manana', 'merienda', 'desayuno'],
  veg: ['comida', 'cena'],
  nut: ['merienda', 'media-manana', 'desayuno'],
  fat: ['comida', 'cena', 'desayuno'],
  other: ['comida', 'cena'],
}

/** En qué días de la semana debe aparecer cada alimento base (repartidos; con poca variedad, todos los días) */
export function mustHaveSchedule(mustHave: string[], variety: Variety): string[][] {
  const days: string[][] = Array.from({ length: 7 }, () => [])
  mustHave.forEach((id, i) => {
    if (variety === 'low') { for (const d of days) d.push(id); return }
    const times = 3
    for (let k = 0; k < times; k++) days[(i * 2 + k * Math.ceil(7 / times)) % 7].push(id)
  })
  return days
}

const SIGNIFICANT = (name: string) => name.toLowerCase().replace(/\(.*?\)/g, '').split(/[\s/]+/).filter(w => w.length > 3 && !['para', 'tipo', 'sin', 'con', 'natural', 'fresco', 'fresca', 'crudo'].includes(w))

const titleMentions = (title: string, food: Food | undefined) => !!food && SIGNIFICANT(food.name).some(w => new RegExp(`\\b${w}\\b`, 'i').test(title))

/** Renombra el plato si el ingrediente sustituido aparece en su nombre ("Lomo a la plancha…" → "Hígado de pollo a la plancha…"); si no, el nombre se mantiene */
function retitle(title: string, oldFood: Food | undefined, newFood: Food): string {
  const newShort = newFood.name.split(/[(/]/)[0].trim()
  if (oldFood) {
    for (const w of SIGNIFICANT(oldFood.name)) {
      const re = new RegExp(`\\b${w}\\b`, 'i')
      if (re.test(title)) return title.replace(re, m => (m[0] === m[0].toUpperCase() ? newShort : newShort.toLowerCase()))
    }
  }
  return title
}

/**
 * Garantiza que los alimentos base programados para el día aparezcan: sustituye un ingrediente
 * del mismo rol en la comida más adecuada (misma energía) o, si no hay ninguno, lo añade como extra.
 */
function injectMustHave(meals: MealDraft[], foodIds: string[], profile: Profile) {
  for (const id of foodIds) {
    const food = catalog.get(id)
    if (!food || foodConflicts(food, profile).length) continue
    if (meals.some(m => m.meal.items.some(it => it.foodId === id))) continue
    const per100 = nutrientsFor(food, food.portions[0]?.state)
    const state = hasVariants(food) ? (food.portions[0]?.state ?? 'raw') : undefined
    const prefs = ROLE_SLOTS[food.role] ?? ROLE_SLOTS.other
    const ordered = [...meals].sort((a, b) => (prefs.indexOf(a.meal.meal) + 1 || 99) - (prefs.indexOf(b.meal.meal) + 1 || 99))
    let placed = false
    for (const m of ordered) {
      // Candidatos del mismo rol: preferimos el que da nombre al plato y, si no, el más energético
      const cands = m.meal.items.map((it, i) => ({ it, i })).filter(({ it, i }) => !m.fixed[i] && catalog.get(it.foodId)?.role === food.role && !foodIds.includes(it.foodId))
      if (!cands.length) continue
      const named = cands.find(c => titleMentions(m.meal.title, catalog.get(c.it.foodId)))
      const idx = (named ?? cands.sort((a, b) => sumRefs([b.it]).kcal - sumRefs([a.it]).kcal)[0]).i
      const old = m.meal.items[idx]
      const oldFood = catalog.get(old.foodId)
      const kcal = sumRefs([old]).kcal
      const grams = per100.kcal > 0 ? clamp(kcal / per100.kcal * 100, 20, 400) : (food.portions[0]?.g ?? 100)
      m.meal.items[idx] = { id: uid(), foodId: id, grams: roundGrams(grams), state }
      m.base[idx] = grams
      m.meal.title = retitle(m.meal.title, oldFood, food)
      placed = true
      break
    }
    if (!placed) {
      const m = ordered[0]
      if (!m) continue
      const g = food.portions[0]?.g ?? 100
      m.meal.items.push({ id: uid(), foodId: id, grams: g, state, portionLabel: food.portions[0]?.label })
      m.fixed.push(false)
      m.base.push(g)
      m.meal.title = `${m.meal.title} con ${food.name.split(/[(/]/)[0].trim().toLowerCase()}`
    }
  }
}

// ───────────── Acompañamientos ─────────────

/**
 * En lugar de meter "refuerzos" dentro del plato (sardinas en un lomo con puré, salmón en un
 * sándwich…), los micronutrientes que faltan se cubren con acompañamientos que tienen sentido
 * por sí solos y se muestran aparte: una pieza de fruta de postre, una ensalada, un yogur, un
 * vaso de leche o un puñado de frutos secos. Solo se añaden si mejoran el día de verdad.
 */
interface Side { id: string; title: string; emoji: string; slots: MealId[]; items: { f: string; g: number; s?: PortionState; label?: string }[] }
const SIDES: Side[] = [
  { id: 'side-kiwi', title: 'Postre: kiwi', emoji: '🥝', slots: ['comida', 'cena', 'desayuno'], items: [{ f: 'kiwi', g: 150, label: '2 kiwis' }] },
  { id: 'side-naranja', title: 'Postre: naranja', emoji: '🍊', slots: ['comida', 'cena', 'desayuno'], items: [{ f: 'naranja', g: 150, label: '1 naranja' }] },
  { id: 'side-mandarinas', title: 'Postre: mandarinas', emoji: '🍊', slots: ['comida', 'cena'], items: [{ f: 'mandarina', g: 160, label: '2 mandarinas' }] },
  { id: 'side-fresas', title: 'Postre: fresas', emoji: '🍓', slots: ['comida', 'cena'], items: [{ f: 'fresas', g: 150, label: 'Un bol' }] },
  { id: 'side-yogur', title: 'Postre: yogur natural', emoji: '🥛', slots: ['comida', 'cena'], items: [{ f: 'yogur-natural', g: 125, label: '1 yogur' }] },
  { id: 'side-skyr', title: 'Postre: yogur griego 0 % (skyr)', emoji: '🥛', slots: ['comida', 'cena', 'desayuno', 'merienda', 'media-manana'], items: [{ f: 'yogur-griego-0', g: 125, label: '1 yogur' }] },
  { id: 'side-ensalada', title: 'Ensalada de tomate, lechuga y zanahoria', emoji: '🥗', slots: ['comida', 'cena'],
    items: [{ f: 'lechuga', g: 60 }, { f: 'tomate', g: 125, label: '1 tomate' }, { f: 'zanahoria', g: 50, s: 'raw', label: '½ zanahoria' }, { f: 'aceite-oliva', g: 5, label: '1 cucharadita' }] },
  { id: 'side-leche', title: 'Vaso de leche', emoji: '🥛', slots: ['desayuno', 'media-manana', 'merienda'], items: [{ f: 'leche-semi', g: 200, label: '1 vaso' }] },
  { id: 'side-almendras', title: 'Puñado de almendras', emoji: '🌰', slots: ['media-manana', 'merienda', 'desayuno'], items: [{ f: 'almendras', g: 20, label: 'Un puñado' }] },
]

const sideAllowed = (s: Side, profile: Profile) => s.items.every(it => {
  const f = catalog.get(`es:${it.f}`)
  return !!f && !foodConflicts(f, profile).length && !profile.dislikedFoodIds.includes(f.id)
})

interface DayDraft { drafts: MealDraft[]; sides: (Side | null)[] }

/** Añade hasta dos acompañamientos (uno por comida) si bajan el coste del día de forma clara */
function addSides(day: DayDraft, targets: Targets, profile: Profile, mealKcal: number[], editable?: Set<number>) {
  const sideItems = (s: Side): RecipeIngredient[] => s.items.map(it => ({ id: uid(), foodId: `es:${it.f}`, grams: it.g, state: it.s, portionLabel: it.label }))
  for (let round = 0; round < 2; round++) {
    const current = solveDay(cloneDrafts(day.drafts), targets, { mealKcal, sweeps: 60 })
    let best: { m: number; side: Side; cost: number } | null = null
    day.drafts.forEach((d, m) => {
      if (day.sides[m] || (editable && !editable.has(m))) return
      const present = new Set(d.meal.items.map(it => it.foodId))
      for (const s of SIDES) {
        if (!s.slots.includes(d.meal.meal) || !sideAllowed(s, profile)) continue
        if (s.items.some(it => present.has(`es:${it.f}`))) continue
        if (day.sides.some(x => x?.id === s.id)) continue
        const trial = cloneDrafts(day.drafts)
        trial[m].meal.items.push(...sideItems(s))
        trial[m].fixed.push(...s.items.map(() => true))
        trial[m].base.push(...s.items.map(it => it.g))
        const cost = solveDay(trial, targets, { mealKcal, sweeps: 60 })
        if (!best || cost < best.cost) best = { m, side: s, cost }
      }
    })
    if (!best || (best as { cost: number }).cost > current - 0.02) break
    const { m, side } = best as { m: number; side: Side; cost: number }
    const d = day.drafts[m]
    d.meal.items.push(...sideItems(side))
    d.fixed.push(...side.items.map(() => true))
    d.base.push(...side.items.map(it => it.g))
    day.sides[m] = side
  }
}

function cloneDrafts(drafts: MealDraft[]): MealDraft[] {
  return drafts.map(d => ({ meal: { ...d.meal, items: d.meal.items.map(it => ({ ...it })) }, fixed: [...d.fixed], base: [...d.base], hard: d.hard }))
}

/** Separa los acompañamientos (que viajan dentro del borrador mientras se optimiza) en su propio plato */
function splitSides(day: DayDraft): PlanMeal[] {
  const out: PlanMeal[] = []
  day.drafts.forEach((d, m) => {
    const side = day.sides[m]
    if (!side) { out.push(d.meal); return }
    const n = side.items.length
    const items = d.meal.items
    out.push({ ...d.meal, items: items.slice(0, items.length - n) })
    out.push({ id: uid(), meal: d.meal.meal, title: side.title, emoji: side.emoji, items: items.slice(items.length - n), templateId: side.id })
  })
  return out
}

export function dayNutrients(day: PlanDay): Nutrients {
  let total = emptyNutrients()
  for (const m of day.meals) total = addNutrients(total, sumRefs(m.items))
  return total
}

/** Alimento principal de proteína de un plato (para no repetir pollo en comida y cena) */
function mainProtein(t: MealTemplate): string | undefined {
  let best: { f: string; p: number } | undefined
  for (const it of t.items) {
    const p = sumRefs([{ foodId: `es:${it.f}`, grams: it.g, state: it.s }]).protein
    if (!best || p > best.p) best = { f: it.f, p }
  }
  return best && best.p >= 12 ? best.f : undefined
}

/**
 * Genera un plan semanal.
 *  - complexity: usa plantillas hasta ese nivel (las fáciles siempre entran; con "elaborada" se priorizan las complejas)
 *  - variety: low = mismo plato cada día; medium = 3 rotando; high = todos distintos
 * Cómo elige: ordena los platos de cada comida por lo bien que encajan con tu reparto de macros,
 * prueba sustituciones plato a plato y se queda con la combinación cuyos días, una vez optimizadas
 * las cantidades, quedan más cerca de tus objetivos de kcal, proteína, carbohidratos, grasa y micros.
 */
export function generatePlan(profile: Profile, targets: Targets, params: GenParams, seed = Date.now()): PlanDay[] {
  const rnd = seededRandom(seed)
  const split = mealSplit(params.mealsPerDay)
  const slots = MEAL_ORDER.filter(s => split[s])
  const maxRank = COMPLEXITY_RANK[params.complexity]
  const mustHave = (params.mustHave ?? []).filter(id => catalog.get(id))
  const mustSet = new Set(mustHave.map(id => id.replace(/^es:/, '')))
  const schedule = mustHaveSchedule(mustHave, params.variety)
  const n = params.variety === 'low' ? 1 : params.variety === 'medium' ? 3 : 7
  const mealKcal = slots.map(s => targets.kcal * (split[s] ?? 0.25))

  // Reparto de macros objetivo (fracción de kcal) para ordenar los platos por encaje
  const tP = targets.protein * 4 / targets.kcal, tC = targets.carbs * 4 / targets.kcal, tF = targets.fat * 9 / targets.kcal
  const fitScore = (t: MealTemplate) => {
    const nn = sumRefs(t.items.map(it => ({ foodId: `es:${it.f}`, grams: it.g, state: it.s })))
    if (nn.kcal <= 0) return 9
    const p = nn.protein * 4 / nn.kcal, c = nn.carbs * 4 / nn.kcal, f = nn.fat * 9 / nn.kcal
    let s = Math.abs(p - tP) * 1.4 + Math.abs(c - tC) + Math.abs(f - tF)
    if (params.complexity === 'complex' && t.complexity !== 'easy') s -= 0.15
    s -= t.items.filter(i => mustSet.has(i.f)).length * 0.4
    return s
  }
  const pools: MealTemplate[][] = slots.map(slot => {
    const pool = MEAL_TEMPLATES.filter(t => t.meals.includes(slot) && COMPLEXITY_RANK[t.complexity] <= maxRank && templateAllowed(t, profile))
    const scored = pool.map(t => ({ t, s: fitScore(t) + rnd() * 0.35 }))
    scored.sort((a, b) => a.s - b.s)
    return scored.map(x => x.t)
  })
  const choices: string[][] = pools.map(pool => pool.slice(0, Math.min(n, pool.length)).map(t => t.id))

  const assemble = (d: number, ch: string[][]): (string | null)[] => {
    const used = new Set<string>()
    return slots.map((_, si) => {
      const list = ch[si]
      if (!list.length) return null
      let id = list[d % list.length]
      if (used.has(id)) id = list.find(x => !used.has(x)) ?? pools[si].find(t => !used.has(t.id))?.id ?? id
      used.add(id)
      return id
    })
  }
  const buildDay = (d: number, ids: (string | null)[]): DayDraft => {
    const drafts: MealDraft[] = []
    ids.forEach((id, si) => { if (id) drafts.push(draftFromTemplate(TEMPLATE_BY_ID.get(id)!, slots[si], mealKcal[si])) })
    if (schedule[d].length) injectMustHave(drafts, schedule[d], profile)
    return { drafts, sides: drafts.map(() => null) }
  }
  const kcalFor = (ids: (string | null)[]) => ids.map((id, si) => (id ? mealKcal[si] : undefined)).filter((x): x is number => x !== undefined)
  const cache = new Map<string, number>()
  const dayScore = (d: number, ids: (string | null)[]) => {
    const key = `${schedule[d].length ? d : ''}|${ids.join(',')}`
    const hit = cache.get(key)
    if (hit !== undefined) return hit
    const day = buildDay(d, ids)
    let cost = solveDay(day.drafts, targets, { mealKcal: kcalFor(ids), sweeps: 50 })
    // Penaliza repetir la misma proteína principal en dos comidas del día
    const mains = ids.map(id => (id ? mainProtein(TEMPLATE_BY_ID.get(id)!) : undefined)).filter(Boolean)
    cost += (mains.length - new Set(mains).size) * 0.04
    cache.set(key, cost)
    return cost
  }
  const weekScore = (ch: string[][]) => { let s = 0; for (let d = 0; d < 7; d++) s += dayScore(d, assemble(d, ch)); return s }

  // Búsqueda local: cambia platos de uno en uno mientras mejore la semana
  let best = weekScore(choices)
  for (let pass = 0; pass < 2; pass++) {
    let improved = false
    slots.forEach((_, si) => {
      const cands = pools[si].slice(0, 14)
      for (let j = 0; j < choices[si].length; j++) {
        for (const c of cands) {
          if (choices[si].includes(c.id)) continue
          const trial = choices.map(x => [...x])
          trial[si][j] = c.id
          const s = weekScore(trial)
          if (s < best - 1e-4) { best = s; choices[si] = trial[si]; improved = true }
        }
      }
    })
    if (!improved) break
  }

  // Días definitivos: cantidades optimizadas + acompañamientos que de verdad aporten + redondeo
  const days: PlanDay[] = []
  for (let d = 0; d < 7; d++) {
    const ids = assemble(d, choices)
    const day = buildDay(d, ids)
    const mk = kcalFor(ids)
    addSides(day, targets, profile, mk)
    solveAndRound(day.drafts, targets, { mealKcal: mk })
    days.push({ meals: splitSides(day) })
  }
  return days
}

/**
 * "Recalcular el resto del día": lo ya comido (`eaten`) se mantiene fijo y se generan de nuevo
 * las comidas de `slots` para que el día completo cuadre con los objetivos (kcal, macros, micros).
 * Si lo comido ya se pasa, las comidas nuevas salen ligeras pero nunca desaparecen: cada ingrediente
 * tiene un mínimo razonable.
 */
export function regenerateRest(profile: Profile, targets: Targets, params: GenParams, eaten: PlanMeal[], slots: MealId[], seed = Date.now()): PlanMeal[] {
  const rnd = seededRandom(seed)
  const maxRank = COMPLEXITY_RANK[params.complexity]
  const split = mealSplit(params.mealsPerDay)
  const eatenN = eaten.reduce((t, m) => addNutrients(t, sumRefs(m.items)), emptyNutrients())
  const eatenFoods = new Set(eaten.flatMap(m => m.items.map(i => i.foodId)))
  const restKcal = Math.max(0, targets.kcal - eatenN.kcal)
  const weights = slots.map(s => split[s] ?? (s === 'comida' || s === 'cena' || s === 'desayuno' ? 0.3 : 0.1))
  const wsum = weights.reduce((a, b) => a + b, 0) || 1
  const minKcal = (s: MealId) => (s === 'media-manana' || s === 'merienda' ? 120 : 300)
  const kcalOfSlot = slots.map((s, i) => Math.max(minKcal(s), restKcal * weights[i] / wsum))

  const fixedDrafts: MealDraft[] = eaten.map(m => ({ meal: m, fixed: m.items.map(() => true), base: m.items.map(i => i.grams), hard: true }))
  const tP = targets.protein * 4 / targets.kcal, tC = targets.carbs * 4 / targets.kcal, tF = targets.fat * 9 / targets.kcal

  const fresh: MealDraft[] = []
  slots.forEach((slot, i) => {
    const pool = MEAL_TEMPLATES.filter(t => t.meals.includes(slot) && COMPLEXITY_RANK[t.complexity] <= maxRank && templateAllowed(t, profile))
    if (!pool.length) return
    const usedNow = new Set([...eatenFoods, ...fresh.flatMap(m => m.meal.items.map(x => x.foodId))])
    // Probamos varios platos y nos quedamos con el que mejor cuadra el día completo
    const ranked = shuffle(pool, rnd)
      .map(t => {
        const nn = sumRefs(t.items.map(it => ({ foodId: `es:${it.f}`, grams: it.g, state: it.s })))
        const fit = nn.kcal > 0 ? Math.abs(nn.protein * 4 / nn.kcal - tP) + Math.abs(nn.carbs * 4 / nn.kcal - tC) + Math.abs(nn.fat * 9 / nn.kcal - tF) : 9
        const overlap = t.items.filter(x => usedNow.has(`es:${x.f}`) && !x.fixed).length
        return { t, s: fit + overlap * 0.25 + rnd() * 0.3 }
      })
      .sort((a, b) => a.s - b.s)
      .slice(0, 6)
    let bestT = ranked[0].t, bestCost = Infinity
    for (const { t } of ranked) {
      const trial = [...cloneDrafts(fixedDrafts), ...cloneDrafts(fresh), draftFromTemplate(t, slot, kcalOfSlot[i])]
      const mk = [...fixedDrafts.map(() => undefined), ...fresh.map((_, k) => kcalOfSlot[slots.indexOf(fresh[k].meal.meal)]), kcalOfSlot[i]]
      const c = solveDay(trial, targets, { mealKcal: mk, sweeps: 50 })
      if (c < bestCost) { bestCost = c; bestT = t }
    }
    fresh.push(draftFromTemplate(bestT, slot, kcalOfSlot[i]))
  })
  if (!fresh.length) return []
  const all = [...fixedDrafts, ...fresh]
  const mk: number[] = [...fixedDrafts.map(() => 0), ...fresh.map(f => kcalOfSlot[slots.indexOf(f.meal.meal)])]
  const day: DayDraft = { drafts: all, sides: all.map(() => null) }
  const editable = new Set(fresh.map((_, k) => fixedDrafts.length + k))
  addSides(day, targets, profile, mk, editable)
  solveAndRound(day.drafts, targets, { mealKcal: mk })
  return splitSides(day).filter(m => !eaten.some(e => e.id === m.id))
}

/** Vuelve a elegir una plantilla distinta para una comida concreta, ya ajustada a su parte del día */
export function reshuffleMeal(profile: Profile, targets: Targets, params: GenParams, current: PlanMeal, excludeIds: string[] = []): PlanMeal | null {
  const split = mealSplit(params.mealsPerDay)
  const pool = MEAL_TEMPLATES.filter(t => t.meals.includes(current.meal) && COMPLEXITY_RANK[t.complexity] <= COMPLEXITY_RANK[params.complexity] && templateAllowed(t, profile) && t.id !== current.templateId && !excludeIds.includes(t.id))
  if (pool.length === 0) return null
  const t = pool[Math.floor(Math.random() * pool.length)]
  const share = split[current.meal] ?? 0.25
  return instantiateTemplate(t, current.meal, targets.kcal * share, undefined, targets)
}

/**
 * Sustitución de un ingrediente por otro equivalente: mismo rol, sin
 * intolerancias, kcal ajustadas para mantener el aporte energético.
 */
export function substitutes(ref: RecipeIngredient, profile: Profile, limit = 6): { food: Food; grams: number; state?: 'raw' | 'cooked' }[] {
  const food = catalog.get(ref.foodId)
  if (!food) return []
  const kcal = sumRefs([ref]).kcal
  const protein = sumRefs([ref]).protein
  const candidates = catalog.curated().filter(f =>
    f.id !== food.id && f.role === food.role && f.cat !== 'especias' && f.cat !== 'salsas' &&
    foodConflicts(f, profile).length === 0 && !profile.dislikedFoodIds.includes(f.id),
  )
  const scored = candidates.map(f => {
    const state: 'raw' | 'cooked' | undefined = f.nutrientsCooked ? (ref.state ?? 'raw') : undefined
    const per100 = nutrientsFor(f, state)
    const grams = per100.kcal > 0 ? roundGrams(kcal / per100.kcal * 100) : ref.grams
    const gramsClamped = Math.max(5, Math.min(600, grams))
    const p = per100.protein * gramsClamped / 100
    // Preferimos misma categoría, proteína similar, densidad calórica parecida (gramaje
    // similar) y alimentos habituales (los que tienen unidad de compra o variante cocinada)
    let s = 0
    if (f.cat === food.cat) s += 3
    s -= Math.abs(p - protein) / Math.max(5, protein) * 2
    s -= Math.abs(gramsClamped - ref.grams) / Math.max(50, ref.grams) * 1.5
    if (f.unit || f.nutrientsCooked) s += 1
    if (COMMON.has(f.id)) s += 1.5
    return { food: f, grams: gramsClamped, state, s }
  })
  scored.sort((a, b) => b.s - a.s)
  return scored.slice(0, limit).map(({ food, grams, state }) => ({ food, grams, state }))
}

/** Alimentos "de siempre" que conviene proponer antes como sustitutos */
const COMMON = new Set([
  'es:pechuga-pollo', 'es:pechuga-pavo', 'es:merluza', 'es:salmon', 'es:atun-lata-natural', 'es:huevo', 'es:ternera-filete', 'es:lomo-cerdo',
  'es:arroz-blanco', 'es:pasta', 'es:patata', 'es:pan-integral', 'es:avena', 'es:quinoa', 'es:boniato', 'es:cuscus',
  'es:brocoli', 'es:judias-verdes', 'es:espinacas', 'es:calabacin', 'es:tomate', 'es:zanahoria', 'es:pimiento-rojo', 'es:lechuga', 'es:champinones',
  'es:manzana', 'es:platano', 'es:naranja', 'es:pera', 'es:fresas', 'es:kiwi', 'es:mandarina', 'es:uvas', 'es:sandia', 'es:melon',
  'es:yogur-natural', 'es:yogur-griego', 'es:leche-semi', 'es:queso-fresco', 'es:nueces', 'es:almendras', 'es:aceite-oliva', 'es:aguacate',
  'es:lentejas', 'es:garbanzos', 'es:alubias-blancas',
])

/**
 * "Nivelar": reajusta las cantidades de un día ya editado para cuadrar kcal, proteína,
 * carbohidratos y grasa (y mejorar micros) sin cambiar los alimentos ni el peso de cada comida
 * en el día. Los ingredientes pequeños (< 15 g: aceite, especias, salsas) no se tocan.
 */
export function balanceExistingDay(mealsIn: PlanMeal[], targets: Targets): PlanMeal[] {
  const drafts: MealDraft[] = mealsIn.map(m => ({
    meal: { ...m, items: m.items.map(it => ({ ...it })) },
    fixed: m.items.map(it => it.grams < 15 || ['especias', 'salsas'].includes(catalog.get(it.foodId)?.cat ?? '') || (m.templateId?.startsWith('side-') ?? false)),
    base: m.items.map(it => it.grams),
  }))
  // Cada comida conserva su peso relativo en el día, escalado al objetivo
  const kcals = drafts.map(d => sumRefs(d.meal.items).kcal)
  const total = kcals.reduce((a, b) => a + b, 0) || 1
  const mealKcal = kcals.map(k => (k > 0 ? targets.kcal * k / total : undefined))
  solveAndRound(drafts, targets, { mealKcal })
  return drafts.map(d => d.meal)
}

export function emptyPlan(name: string, params: GenParams): Omit<Plan, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
  return { name, emoji: '📅', days: Array.from({ length: 7 }, () => ({ meals: [] })), params, isActive: false }
}
