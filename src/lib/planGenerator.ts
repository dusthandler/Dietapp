import { catalog, hasVariants, nutrientsFor } from '@/data/foodDb'
import { MEAL_TEMPLATES, type MealTemplate } from '@/data/mealTemplates'
import { uid } from '@/data/db'
import { TRACKED_MICROS, emptyNutrients, addNutrients, type Nutrients, type NutrientKey } from '@/data/nutrients'
import type { Complexity, Food, MealId, Plan, PlanDay, PlanMeal, PortionState, Profile, RecipeIngredient, Targets, Variety } from '@/data/types'
import { foodConflicts, sumRefs } from '@/store/hooks'

export interface GenParams { complexity: Complexity; variety: Variety; mealsPerDay: 3 | 4 | 5; /** ids de alimentos que deben aparecer en la dieta */ mustHave?: string[] }

/** Reparto de kcal por comida según número de comidas */
export function mealSplit(mealsPerDay: 3 | 4 | 5): Partial<Record<MealId, number>> {
  if (mealsPerDay === 3) return { desayuno: 0.27, comida: 0.40, cena: 0.33 }
  if (mealsPerDay === 4) return { desayuno: 0.25, comida: 0.37, merienda: 0.10, cena: 0.28 }
  return { desayuno: 0.22, 'media-manana': 0.08, comida: 0.35, merienda: 0.08, cena: 0.27 }
}

const COMPLEXITY_RANK: Record<Complexity, number> = { easy: 0, medium: 1, complex: 2 }

function seededRandom(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

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
 * Instancia una plantilla escalada a unas kcal objetivo y, si se indica un objetivo de
 * proteína para esa comida, la ajusta en dos pasos:
 *  1) escala global (excepto ingredientes fijos) para cuadrar kcal;
 *  2) corrige la fuente de proteína hacia el objetivo (±35 % máx.) y compensa las kcal
 *     con la fuente de carbohidrato (o verdura/grasa si no hay), para que el día no se
 *     pase de proteína ni se quede corto de energía.
 */
export function instantiateTemplate(t: MealTemplate, meal: MealId, kcalTarget: number, proteinTarget?: number): PlanMeal {
  return instantiateWithFlags(t, meal, kcalTarget, proteinTarget).meal
}

interface MealDraft { meal: PlanMeal; fixed: boolean[]; base: number[] }

function instantiateWithFlags(t: MealTemplate, meal: MealId, kcalTarget: number, proteinTarget?: number): MealDraft {
  const items: RecipeIngredient[] = t.items.map(it => ({ id: uid(), foodId: `es:${it.f}`, grams: it.g, state: it.s, portionLabel: it.label }))
  const fixed = items.map((_, i) => !!t.items[i].fixed)
  const kcalOf = (r: RecipeIngredient) => sumRefs([r]).kcal
  const protOf = (r: RecipeIngredient) => sumRefs([r]).protein
  const roleOf = (r: RecipeIngredient) => catalog.get(r.foodId)?.role

  // 1) escala global
  const fixedKcal = items.filter((_, i) => fixed[i]).reduce((s, r) => s + kcalOf(r), 0)
  const scalableKcal = items.filter((_, i) => !fixed[i]).reduce((s, r) => s + kcalOf(r), 0)
  let factor = scalableKcal > 0 ? (kcalTarget - fixedKcal) / scalableKcal : 1
  factor = Math.max(0.55, Math.min(1.9, factor))
  let scaled = items.map((r, i) => fixed[i] ? r : { ...r, grams: r.grams * factor })

  // 2) ajuste de proteína con compensación de kcal
  if (proteinTarget) {
    const protIdx = scaled.map((r, i) => (!fixed[i] && roleOf(r) === 'protein' ? i : -1)).filter(i => i >= 0)
    const carbIdx = scaled.map((r, i) => (!fixed[i] && roleOf(r) === 'carb' ? i : -1)).filter(i => i >= 0)
    const compIdx = carbIdx.length ? carbIdx : scaled.map((r, i) => (!fixed[i] && ['veg', 'fruit', 'fat', 'nut', 'dairy'].includes(roleOf(r) ?? '') ? i : -1)).filter(i => i >= 0)
    if (protIdx.length) {
      const total = sumRefs(scaled)
      const protFromSources = protIdx.reduce((s, i) => s + protOf(scaled[i]), 0)
      const others = total.protein - protFromSources
      const wanted = Math.max(0, proteinTarget - others)
      if (protFromSources > 0) {
        const pf = Math.max(0.65, Math.min(1.35, wanted / protFromSources))
        const before = protIdx.reduce((s, i) => s + kcalOf(scaled[i]), 0)
        scaled = scaled.map((r, i) => protIdx.includes(i) ? { ...r, grams: r.grams * pf } : r)
        const after = protIdx.reduce((s, i) => s + kcalOf(scaled[i]), 0)
        const delta = before - after // kcal liberadas (o consumidas) que hay que compensar
        const compKcal = compIdx.reduce((s, i) => s + kcalOf(scaled[i]), 0)
        if (compIdx.length && compKcal > 0) {
          const cf = Math.max(0.6, Math.min(1.6, (compKcal + delta) / compKcal))
          scaled = scaled.map((r, i) => compIdx.includes(i) ? { ...r, grams: r.grams * cf } : r)
        }
      }
    }
  }

  const final = scaled.map((r, i) => {
    if (fixed[i]) return r
    const g = roundGrams(r.grams)
    const base = items[i].grams
    // Si cambia mucho la cantidad, la etiqueta de medida deja de ser fiel
    return { ...r, grams: g, portionLabel: Math.abs(g - base) / base < 0.12 ? r.portionLabel : undefined }
  })
  return { meal: { id: uid(), meal, title: t.name, emoji: t.emoji, items: final, templateId: t.id }, fixed, base: items.map(i => i.grams) }
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

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
    const times = variety === 'medium' ? 3 : 3
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


/**
 * Refuerzos de micronutrientes: pequeñas cantidades de alimentos muy densos en el
 * nutriente que falta. El generador los añade al día (como extra en un snack) cuando
 * un micronutriente se queda por debajo del 90 % del objetivo.
 */
interface Booster { f: string; g: number; s?: PortionState; helps: NutrientKey[]; /** comidas donde tiene sentido; por defecto snacks/desayuno */ slots?: MealId[] }
const BOOSTERS: Booster[] = [
  { f: 'kiwi', g: 150, helps: ['vitC', 'vitK', 'fiber'] },
  { f: 'naranja', g: 150, helps: ['vitC', 'b9'] },
  { f: 'fresas', g: 150, helps: ['vitC', 'manganese'] },
  { f: 'pimiento-rojo', g: 75, helps: ['vitC', 'vitA', 'b6'], slots: ['comida', 'cena'] },
  { f: 'almendras', g: 25, helps: ['vitE', 'magnesium', 'calcium', 'b2'] },
  { f: 'pipas-girasol', g: 15, helps: ['vitE', 'selenium', 'magnesium', 'b1'] },
  { f: 'avellanas', g: 25, helps: ['vitE', 'manganese', 'copper'] },
  { f: 'zanahoria', g: 80, s: 'raw', helps: ['vitA'], slots: ['comida', 'cena', 'media-manana', 'merienda'] },
  { f: 'boniato', g: 150, s: 'cooked', helps: ['vitA', 'potassium', 'fiber'], slots: ['comida', 'cena'] },
  { f: 'espinacas', g: 60, s: 'raw', helps: ['vitA', 'vitK', 'b9', 'magnesium'], slots: ['comida', 'cena'] },
  { f: 'calabaza', g: 150, s: 'cooked', helps: ['vitA', 'potassium'], slots: ['comida', 'cena'] },
  { f: 'salmon-ahumado', g: 50, helps: ['vitD', 'omega3', 'iodine', 'b12'], slots: ['desayuno', 'cena', 'comida'] },
  { f: 'sardinas-lata', g: 60, helps: ['vitD', 'omega3', 'calcium', 'iodine', 'b12', 'selenium'], slots: ['comida', 'cena'] },
  { f: 'atun-lata-natural', g: 56, helps: ['vitD', 'b12', 'selenium', 'iodine', 'b3'], slots: ['comida', 'cena'] },
  { f: 'huevo-cocido', g: 50, helps: ['vitD', 'iodine', 'choline', 'b12', 'selenium'], slots: ['desayuno', 'comida', 'cena', 'merienda'] },
  { f: 'champinones', g: 100, s: 'raw', helps: ['vitD', 'b2', 'b3', 'b5', 'copper', 'selenium'], slots: ['comida', 'cena'] },
  { f: 'nueces', g: 20, helps: ['omega3', 'copper', 'manganese'] },
  { f: 'chia', g: 12, helps: ['omega3', 'fiber', 'calcium'] },
  { f: 'sal-yodada', g: 3, helps: ['iodine'], slots: ['comida', 'cena'] },
  { f: 'yogur-natural', g: 125, helps: ['iodine', 'calcium', 'b2', 'b12'] },
  { f: 'queso-curado', g: 30, helps: ['calcium', 'iodine', 'b12', 'phosphorus'], slots: ['desayuno', 'merienda', 'media-manana', 'cena'] },
  { f: 'nueces-brasil', g: 5, helps: ['selenium'] },
  { f: 'pipas-calabaza', g: 15, helps: ['zinc', 'magnesium', 'iron', 'copper'], slots: ['desayuno', 'media-manana', 'merienda', 'comida', 'cena'] },
  { f: 'lentejas', g: 100, s: 'cooked', helps: ['iron', 'b9', 'fiber', 'potassium', 'b1'], slots: ['comida', 'cena'] },
  { f: 'platano', g: 120, helps: ['potassium', 'b6', 'manganese'] },
  { f: 'aguacate', g: 75, helps: ['potassium', 'b9', 'vitE', 'fiber', 'b5'], slots: ['desayuno', 'comida', 'cena'] },
  { f: 'avena', g: 30, helps: ['fiber', 'magnesium', 'b1', 'manganese', 'zinc'] },
  { f: 'brocoli', g: 100, s: 'cooked', helps: ['vitC', 'vitK', 'b9'], slots: ['comida', 'cena'] },
  { f: 'higado-pollo', g: 50, s: 'cooked', helps: ['vitA', 'b12', 'b9', 'iron', 'copper', 'b2', 'choline'], slots: ['comida', 'cena'] },
]

function boostMicros(meals: MealDraft[], targets: Targets, profile: Profile, editable: MealDraft[] = meals) {
  const totals = () => { let t = emptyNutrients(); for (const m of meals) t = addNutrients(t, sumRefs(m.meal.items)); return t }
  const used = new Set<string>(meals.flatMap(m => m.meal.items.map(i => i.foodId)))
  let addedKcal = 0
  for (let pass = 0; pass < 4; pass++) {
    const t = totals()
    const deficits = TRACKED_MICROS.filter(k => (targets.micros[k] ?? 0) > 0 && t[k] < (targets.micros[k] ?? 0) * 0.9)
    if (!deficits.length) break
    let best: { b: Booster; food: Food; n: Nutrients; score: number } | null = null
    const present = new Set(editable.map(m => m.meal.meal))
    for (const b of BOOSTERS) {
      const food = catalog.get(`es:${b.f}`)
      if (!food || used.has(food.id)) continue
      const allowed = b.slots ?? ['media-manana', 'merienda', 'desayuno']
      if (!allowed.some(sl => present.has(sl))) continue
      if (foodConflicts(food, profile).length || profile.dislikedFoodIds.includes(food.id)) continue
      const n = sumRefs([{ foodId: food.id, grams: b.g, state: b.s }])
      let gain = 0
      for (const k of deficits) { const target = targets.micros[k]!; gain += Math.min(n[k], target - t[k]) / target }
      if (gain < 0.08) continue
      const score = gain / (1 + n.kcal / 150)
      if (!best || score > best.score) best = { b, food, n, score }
    }
    if (!best || addedKcal + best.n.kcal > 320) break
    // Se añade como extra en la primera comida permitida para ese alimento
    const allowed = best.b.slots ?? ['media-manana', 'merienda', 'desayuno']
    const slot = allowed.map(sl => editable.find(m => m.meal.meal === sl)).find(Boolean)
    if (!slot) break
    slot.meal.items.push({ id: uid(), foodId: best.food.id, grams: best.b.g, state: best.b.s })
    slot.fixed.push(true)
    slot.base.push(best.b.g)
    used.add(best.food.id)
    addedKcal += best.n.kcal
  }
}


/**
 * Balance del día completo: si la suma de comidas se pasa de grasa, se reducen las
 * fuentes de grasa (aguacate, frutos secos, quesos grasos…); si sobra o falta proteína
 * se corrigen sus fuentes; y por último se ajustan los carbohidratos para cuadrar las
 * kcal del día. Los ingredientes fijos (aceite para cocinar, especias) no se tocan.
 */
function balanceDay(meals: MealDraft[], targets: Targets) {
  const roleOf = (r: RecipeIngredient) => catalog.get(r.foodId)?.role
  const all = () => meals.flatMap(m => m.meal.items.map((it, i) => ({ it, fixed: m.fixed[i], m })))
  const scaleRole = (roles: string[], f: number) => {
    for (const m of meals) m.meal.items = m.meal.items.map((it, i) => (!m.fixed[i] && roles.includes(roleOf(it) ?? '') ? { ...it, grams: it.grams * f } : it))
  }
  const totals = () => { let t = emptyNutrients(); for (const m of meals) t = addNutrients(t, sumRefs(m.meal.items)); return t }

  // 1) grasa: solo si se pasa claramente
  let t = totals()
  if (t.fat > targets.fat * 1.12) {
    const fatItems = all().filter(x => !x.fixed && ['fat', 'nut'].includes(roleOf(x.it) ?? ''))
    const fatFrom = fatItems.reduce((s, x) => s + sumRefs([x.it]).fat, 0)
    if (fatFrom > 0) {
      const excess = t.fat - targets.fat * 1.05
      scaleRole(['fat', 'nut'], clamp(1 - excess / fatFrom, 0.45, 1))
    }
    t = totals()
    // si sigue sobrando, también los lácteos, proteínas y carbohidratos más grasos
    if (t.fat > targets.fat * 1.12) {
      const src = all().filter(x => !x.fixed && ['dairy', 'protein', 'carb'].includes(roleOf(x.it) ?? '') && sumRefs([x.it]).fat / Math.max(1, sumRefs([x.it]).kcal) * 9 > 0.3)
      const fatFrom = src.reduce((s, x) => s + sumRefs([x.it]).fat, 0)
      if (fatFrom > 0) {
        const f = clamp(1 - (t.fat - targets.fat * 1.05) / fatFrom, 0.65, 1)
        for (const m of meals) m.meal.items = m.meal.items.map(it => (src.some(x => x.it === it) ? { ...it, grams: it.grams * f } : it))
      }
      t = totals()
    }
  }
  // 2) proteína: corrección global suave
  if (t.protein > targets.protein * 1.15 || t.protein < targets.protein * 0.9) {
    const src = all().filter(x => !x.fixed && roleOf(x.it) === 'protein')
    const from = src.reduce((s, x) => s + sumRefs([x.it]).protein, 0)
    if (from > 0) scaleRole(['protein'], clamp((targets.protein - (t.protein - from)) / from, 0.8, 1.3))
    t = totals()
  }
  // 3) kcal: cuadrar con carbohidratos (o fruta/verdura si no hay)
  const carbs = all().filter(x => !x.fixed && roleOf(x.it) === 'carb')
  const comp = carbs.length ? ['carb'] : ['fruit', 'veg']
  const compKcal = all().filter(x => !x.fixed && comp.includes(roleOf(x.it) ?? '')).reduce((s, x) => s + sumRefs([x.it]).kcal, 0)
  if (compKcal > 0) scaleRole(comp, clamp((compKcal + (targets.kcal - t.kcal)) / compKcal, 0.6, 1.8))

  // redondeo final y etiquetas; ningún ingrediente baja del 50 % ni sube del doble de su tamaño original
  for (const m of meals) {
    m.meal.items = m.meal.items.map((it, i) => {
      if (m.fixed[i]) return it
      const g = roundGrams(clamp(it.grams, m.base[i] * 0.5, m.base[i] * 2))
      return { ...it, grams: g, portionLabel: it.portionLabel && Math.abs(g - it.grams) / Math.max(1, it.grams) < 0.12 ? it.portionLabel : (g === it.grams ? it.portionLabel : undefined) }
    })
  }
}

function roundGrams(g: number): number {
  if (g < 15) return Math.round(g)
  if (g < 60) return Math.round(g / 5) * 5
  return Math.round(g / 10) * 10
}

export function dayNutrients(day: PlanDay): Nutrients {
  let total = emptyNutrients()
  for (const m of day.meals) total = addNutrients(total, sumRefs(m.items))
  return total
}

/**
 * Genera un plan semanal.
 *  - complexity: usa plantillas hasta ese nivel (las fáciles siempre entran; con "elaborada" se priorizan las complejas)
 *  - variety: low = mismo plato cada día; medium = 2-3 rotando; high = todos distintos
 */
export function generatePlan(profile: Profile, targets: Targets, params: GenParams, seed = Date.now()): PlanDay[] {
  const rnd = seededRandom(seed)
  const split = mealSplit(params.mealsPerDay)
  const slots = Object.keys(split) as MealId[]
  const maxRank = COMPLEXITY_RANK[params.complexity]

  const mustHave = (params.mustHave ?? []).filter(id => catalog.get(id))
  const mustSet = new Set(mustHave.map(id => id.replace(/^es:/, '')))
  const perSlot: Record<string, MealTemplate[]> = {}
  for (const slot of slots) {
    let pool = MEAL_TEMPLATES.filter(t => t.meals.includes(slot) && COMPLEXITY_RANK[t.complexity] <= maxRank && templateAllowed(t, profile))
    if (params.complexity === 'complex') {
      // prioriza elaboradas/medias pero mantiene fáciles como relleno
      const hard = pool.filter(t => t.complexity !== 'easy')
      pool = [...shuffle(hard, rnd), ...shuffle(pool.filter(t => t.complexity === 'easy'), rnd)]
    } else pool = shuffle(pool, rnd)
    // Las plantillas que ya llevan alimentos base van primero
    if (mustSet.size) pool.sort((a, b) => b.items.filter(i => mustSet.has(i.f)).length - a.items.filter(i => mustSet.has(i.f)).length)
    perSlot[slot] = pool
  }
  const schedule = mustHaveSchedule(mustHave, params.variety)

  const n = params.variety === 'low' ? 1 : params.variety === 'medium' ? 3 : 7

  const days: PlanDay[] = []
  for (let d = 0; d < 7; d++) {
    const meals: MealDraft[] = []
    for (const slot of slots) {
      const pool = perSlot[slot]
      if (pool.length === 0) continue
      const choices = pool.slice(0, Math.min(n, pool.length))
      // Evita repetir el mismo plato en comida y cena del mismo día
      let t = choices[d % choices.length]
      const used = new Set(meals.map(m => m.meal.templateId))
      if (used.has(t.id)) t = choices.find(c => !used.has(c.id)) ?? pool.find(c => !used.has(c.id)) ?? t
      meals.push(instantiateWithFlags(t, slot, targets.kcal * (split[slot] ?? 0.25), targets.protein * (split[slot] ?? 0.25)))
    }
    if (schedule[d].length) injectMustHave(meals, schedule[d], profile)
    boostMicros(meals, targets, profile)
    balanceDay(meals, targets)
    days.push({ meals: meals.map(m => m.meal) })
  }
  return days
}

/**
 * "Recalcular el resto del día": lo ya comido (`eaten`) se mantiene fijo y se generan de nuevo
 * las comidas de `slots` para que el día completo cuadre con los objetivos (kcal, proteína,
 * micros). Si lo comido ya se pasa, las comidas nuevas salen ligeras pero nunca desaparecen:
 * cada una conserva un mínimo razonable (un snack ~120 kcal, una comida principal ~300 kcal).
 */
export function regenerateRest(profile: Profile, targets: Targets, params: GenParams, eaten: PlanMeal[], slots: MealId[], seed = Date.now()): PlanMeal[] {
  const rnd = seededRandom(seed)
  const maxRank = COMPLEXITY_RANK[params.complexity]
  const split = mealSplit(params.mealsPerDay)
  const eatenN = eaten.reduce((t, m) => addNutrients(t, sumRefs(m.items)), emptyNutrients())
  const eatenFoods = new Set(eaten.flatMap(m => m.items.map(i => i.foodId)))
  const restKcal = Math.max(0, targets.kcal - eatenN.kcal)
  const restProt = Math.max(0, targets.protein - eatenN.protein)
  const weights = slots.map(s => split[s] ?? (s === 'comida' || s === 'cena' || s === 'desayuno' ? 0.3 : 0.1))
  const wsum = weights.reduce((a, b) => a + b, 0) || 1
  const minKcal = (s: MealId) => (s === 'media-manana' || s === 'merienda' ? 120 : 300)

  const fixed: MealDraft[] = eaten.map(m => ({ meal: m, fixed: m.items.map(() => true), base: m.items.map(i => i.grams) }))
  const fresh: MealDraft[] = []
  slots.forEach((slot, i) => {
    let pool = MEAL_TEMPLATES.filter(t => t.meals.includes(slot) && COMPLEXITY_RANK[t.complexity] <= maxRank && templateAllowed(t, profile))
    if (!pool.length) return
    // Variedad: evita platos cuyos ingredientes principales ya se han comido hoy o ya están en otra comida nueva
    const usedNow = new Set([...eatenFoods, ...fresh.flatMap(m => m.meal.items.map(x => x.foodId))])
    const overlap = (t: MealTemplate) => t.items.filter(x => usedNow.has(`es:${x.f}`) && !x.fixed).length
    pool = shuffle(pool, rnd).sort((a, b) => overlap(a) - overlap(b))
    const kcal = Math.max(minKcal(slot), restKcal * weights[i] / wsum)
    const prot = restProt * weights[i] / wsum
    fresh.push(instantiateWithFlags(pool[0], slot, kcal, prot))
  })
  if (!fresh.length) return []
  const all = [...fixed, ...fresh]
  boostMicros(all, targets, profile, fresh)
  balanceDay(all, targets)
  // Ajuste final: balanceDay cuadra las kcal con los carbohidratos, pero una sola comida nueva puede
  // no tenerlos (ensalada de legumbres, tortilla…). Si el día sigue desviado, se escalan en bloque
  // los ingredientes libres de las comidas nuevas (entre la mitad y el doble).
  const kcalOf = (ms: MealDraft[], onlyFree = false) => ms.reduce((t, m) => t + m.meal.items.reduce((s, it, i) => s + (onlyFree && m.fixed[i] ? 0 : sumRefs([it]).kcal), 0), 0)
  const dayKcal = kcalOf(all)
  const freeKcal = kcalOf(fresh, true)
  if (freeKcal > 0 && Math.abs(dayKcal - targets.kcal) > targets.kcal * 0.03) {
    const f = clamp((freeKcal + targets.kcal - dayKcal) / freeKcal, 0.5, 2)
    for (const m of fresh) m.meal.items = m.meal.items.map((it, i) => (m.fixed[i] ? it : { ...it, grams: roundGrams(it.grams * f), portionLabel: undefined }))
  }
  return fresh.map(m => m.meal)
}

/** Vuelve a elegir una plantilla distinta para una comida concreta */
export function reshuffleMeal(profile: Profile, targets: Targets, params: GenParams, current: PlanMeal, excludeIds: string[] = []): PlanMeal | null {
  const split = mealSplit(params.mealsPerDay)
  const pool = MEAL_TEMPLATES.filter(t => t.meals.includes(current.meal) && COMPLEXITY_RANK[t.complexity] <= COMPLEXITY_RANK[params.complexity] && templateAllowed(t, profile) && t.id !== current.templateId && !excludeIds.includes(t.id))
  if (pool.length === 0) return null
  const t = pool[Math.floor(Math.random() * pool.length)]
  return instantiateTemplate(t, current.meal, targets.kcal * (split[current.meal] ?? 0.25), targets.protein * (split[current.meal] ?? 0.25))
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
 * "Nivelar": reajusta las cantidades de un día ya editado para volver a acercarse a los
 * objetivos (grasa → proteína → kcal con carbohidratos) sin cambiar los alimentos.
 * Los ingredientes pequeños (< 15 g: aceite, especias, salsas) no se tocan.
 */
export function balanceExistingDay(mealsIn: PlanMeal[], targets: Targets): PlanMeal[] {
  const drafts: MealDraft[] = mealsIn.map(m => ({
    meal: { ...m, items: m.items.map(it => ({ ...it })) },
    fixed: m.items.map(it => it.grams < 15 || ['especias', 'salsas'].includes(catalog.get(it.foodId)?.cat ?? '')),
    base: m.items.map(it => it.grams),
  }))
  // Dos pasadas: la segunda afina lo que la primera dejó a medias (los suelos del 50 % siguen respetándose)
  balanceDay(drafts, targets)
  balanceDay(drafts, targets)
  // Tras nivelar, las etiquetas de medida ya no son fieles → se recalculan al mostrar
  return drafts.map(d => ({ ...d.meal, items: d.meal.items.map((it, i) => (d.fixed[i] ? it : { ...it, portionLabel: undefined })) }))
}

export function emptyPlan(name: string, params: GenParams): Omit<Plan, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
  return { name, emoji: '📅', days: Array.from({ length: 7 }, () => ({ meals: [] })), params, isActive: false }
}
