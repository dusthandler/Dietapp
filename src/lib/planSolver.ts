import { catalog, nutrientsFor } from '@/data/foodDb'
import { TRACKED_LIMITS, TRACKED_MICROS, type NutrientKey } from '@/data/nutrients'
import type { Food, PlanMeal, PortionState, Targets } from '@/data/types'

/**
 * Optimizador de cantidades de un día.
 *
 * Variables: los gramos de cada ingrediente no fijo. Objetivo (convexo, por mínimos cuadrados):
 *  - kcal, proteína, carbohidratos y grasa del día lo más cerca posible del objetivo (desviación relativa);
 *  - cada comida cerca de su parte de las kcal (para que no salga una comida de 1.000 kcal y una cena de 300);
 *  - micronutrientes por debajo del objetivo penalizan (más verdura/fruta/lácteo cuando sale barato);
 *  - sodio, grasa saturada y azúcares por encima del límite penalizan;
 *  - cada ingrediente cerca de su cantidad de receta (que el plato siga siendo reconocible).
 * Restricciones: cada ingrediente entre un mínimo y un máximo razonables (por rol y topes absolutos
 * por ración, p. ej. ≤ 250 g de carne en crudo). Se resuelve por descenso por coordenadas, exacto en
 * cada coordenada, que converge al óptimo global de este problema convexo en pocas decenas de pasadas.
 */

export interface MealDraft { meal: PlanMeal; fixed: boolean[]; base: number[]; /** nada de esta comida se toca (lo ya comido) */ hard?: boolean }

const MACRO_W: [NutrientKey, number][] = [['kcal', 8], ['protein', 6], ['carbs', 3], ['fat', 4]]
/** Peso de cada micronutriente que falta (la vit. D casi nunca se cubre con comida: pesa poco) */
const MICRO_W: Partial<Record<NutrientKey, number>> = { vitD: 0.08, iodine: 0.3, omega3: 0.3, fiber: 0.8 }
const MICRO_DEFAULT_W = 0.5
const LIMIT_W: Partial<Record<NutrientKey, number>> = { sodium: 1.2, satFat: 1.5, sugar: 0.8 }
const MEAL_W = 0.6
const REG_W = 0.04

/** Tope absoluto por ración, en gramos en crudo (o tal cual si no tiene variante) */
function absCap(f: Food): number | undefined {
  const id = f.id.replace(/^es:/, '')
  if (id === 'proteina-whey') return 45
  if (f.cat === 'carne' || f.cat === 'pescado') {
    if (/lata/.test(id)) return 170
    if (/fiambre|jamon|ahumado|chorizo|salchich/.test(id)) return 110
    // pescado blanco: muy magro, la ración habitual es mayor (2 filetes de merluza ≈ 300 g)
    if (/merluza|lubina|dorada|bacalao|gallo|rape|lenguado|pescadilla|abadejo/.test(id)) return 320
    return 250
  }
  if (f.cat === 'huevos') return id === 'clara-huevo' ? 300 : 180 // máx. 3 huevos por comida
  if (f.cat === 'legumbres') return /hummus/.test(id) ? 100 : 130
  if (f.cat === 'cereales') return /pan|tortilla|tortitas/.test(id) ? 140 : id === 'granola' ? 80 : 140
  if (f.cat === 'tuberculos') return 450
  if (f.cat === 'lacteos') return /queso/.test(id) && !/fresco|batido|cottage/.test(id) ? 60 : 400
  if (f.cat === 'frutos-secos') return 40
  if (f.cat === 'grasas') return 25
  if (f.cat === 'verduras') return 350
  if (f.cat === 'frutas') return 300
  return undefined
}

/** Ración mínima con sentido (en crudo): por debajo el ingrediente deja de pintar nada en el plato */
function minPortion(f: Food): number {
  const id = f.id.replace(/^es:/, '')
  if (id === 'proteina-whey') return 20
  if (/hummus/.test(id)) return 40
  if (f.cat === 'carne' || f.cat === 'pescado') return /fiambre|jamon|ahumado|lata|chorizo/.test(id) ? 30 : 100
  if (f.cat === 'huevos') return 50
  if (f.cat === 'frutos-secos') return 15
  if (f.cat === 'cereales') return /tortitas/.test(id) ? 18 : 25
  if (f.cat === 'lacteos') return /queso/.test(id) && !/fresco|batido|cottage/.test(id) ? 10 : 60
  if (f.cat === 'legumbres') return 40
  if (f.cat === 'tuberculos') return 80
  if (f.cat === 'frutas') return 60
  if (f.cat === 'verduras') return 30
  return 0
}

/** Mínimo y máximo de un ingrediente según su papel en el plato y su cantidad de receta */
export function itemBounds(food: Food, state: PortionState | undefined, base: number): [number, number] {
  let lo = base * 0.5, hi = base * 1.8
  switch (food.role) {
    case 'veg': lo = base * 0.7; hi = base * 2; break
    case 'fruit': lo = base * 0.6; hi = base * 1.6; break
    case 'fat': case 'nut': lo = base * 0.4; hi = base * 1.5; break
    case 'protein': lo = base * 0.6; hi = base * 1.9; break
    case 'carb': lo = base * 0.5; hi = base * 2.1; break
    case 'dairy': lo = base * 0.5; hi = base * 1.9; break
  }
  const toState = (rawG: number) => (state === 'cooked' && food.yield ? rawG * food.yield : rawG)
  lo = Math.max(lo, Math.min(base, toState(minPortion(food))))
  const cap = absCap(food)
  if (cap) hi = Math.min(hi, toState(cap))
  return [Math.min(lo, hi), Math.max(lo, hi)]
}

/**
 * Ingredientes "fijos" de receta que aun así pueden bajar: el aceite, la mantequilla o los frutos
 * secos de acompañamiento. Nunca suben (no se añade aceite para cuadrar kcal) pero pueden reducirse
 * hasta un 40 % cuando sobra grasa.
 */
export function isSemiFixed(d: MealDraft, i: number): boolean {
  if (!d.fixed[i] || d.hard) return false
  const it = d.meal.items[i]
  const role = catalog.get(it.foodId)?.role
  return (role === 'fat' || role === 'nut') && it.grams >= 4
}

interface Term { kind: 0 | 1 | 2; T: number; w: number; N: number; key: NutrientKey; meal?: number }
interface Var { m: number; i: number; x: number; b: number; lo: number; hi: number; a: Float64Array }

export interface SolveOpts {
  /** kcal objetivo de cada comida (mismo orden que los borradores); undefined = sin término de reparto */
  mealKcal?: (number | undefined)[]
  /** ingredientes bloqueados además de los fijos ("m:i") */
  locked?: Set<string>
  sweeps?: number
  /** límites propios por ingrediente ("m:i" → [min, max]) */
  bounds?: Map<string, [number, number]>
}

function buildTerms(targets: Targets, drafts: MealDraft[], mealKcal?: (number | undefined)[]): Term[] {
  const terms: Term[] = []
  for (const [k, w] of MACRO_W) if (targets[k as 'kcal'] > 0) terms.push({ kind: 0, T: targets[k as 'kcal'], w, N: 0, key: k })
  for (const k of TRACKED_MICROS) { const T = targets.micros[k]; if (T && T > 0) terms.push({ kind: 1, T, w: MICRO_W[k] ?? MICRO_DEFAULT_W, N: 0, key: k }) }
  for (const k of TRACKED_LIMITS) { const T = targets.micros[k]; if (T && T > 0) terms.push({ kind: 2, T, w: LIMIT_W[k] ?? 1, N: 0, key: k }) }
  if (mealKcal) drafts.forEach((_, m) => { const T = mealKcal[m]; if (T && T > 0) terms.push({ kind: 0, T, w: MEAL_W, N: 0, key: 'kcal', meal: m }) })
  return terms
}

const per100 = (foodId: string, state?: PortionState) => { const f = catalog.get(foodId); return f ? nutrientsFor(f, state) : undefined }

/** Coste de una desviación (para comparar soluciones) */
function termCost(t: Term): number {
  const e = (t.N - t.T) / t.T
  if (t.kind === 1 && e >= 0) return 0
  if (t.kind === 2 && e <= 0) return 0
  return t.w * e * e
}

/**
 * Ajusta los gramos de los borradores (in situ) y devuelve el coste final. No redondea.
 */
export function solveDay(drafts: MealDraft[], targets: Targets, opts: SolveOpts = {}): number {
  const terms = buildTerms(targets, drafts, opts.mealKcal)
  const vars: Var[] = []
  drafts.forEach((d, m) => d.meal.items.forEach((it, i) => {
    const n = per100(it.foodId, it.state)
    if (!n) return
    const key = `${m}:${i}`
    const semi = isSemiFixed(d, i)
    const locked = d.hard || (d.fixed[i] && !semi) || opts.locked?.has(key)
    for (const t of terms) if (t.meal === undefined || t.meal === m) t.N += n[t.key] * it.grams / 100
    if (locked) return
    const food = catalog.get(it.foodId)!
    const b = Math.max(1, d.base[i] || it.grams)
    const [lo, hi] = semi ? [b * 0.4, b] : (opts.bounds?.get(key) ?? itemBounds(food, it.state, b))
    const a = new Float64Array(terms.length)
    terms.forEach((t, ti) => { a[ti] = t.meal === undefined || t.meal === m ? n[t.key] / 100 : 0 })
    vars.push({ m, i, x: Math.max(lo, Math.min(hi, it.grams)), b, lo, hi, a })
  }))
  // Los valores iniciales pueden haberse recortado a los límites: se recalculan los totales
  for (const v of vars) {
    const it = drafts[v.m].meal.items[v.i]
    const d = v.x - it.grams
    if (d) terms.forEach((t, ti) => { t.N += v.a[ti] * d })
  }

  const sweeps = opts.sweeps ?? 120
  for (let s = 0; s < sweeps; s++) {
    let moved = 0
    for (const v of vars) {
      const b2 = v.b * v.b
      let g = 2 * REG_W * (v.x - v.b) / b2
      let h = 2 * REG_W / b2
      for (let ti = 0; ti < terms.length; ti++) {
        const a = v.a[ti]
        if (a === 0) continue
        const t = terms[ti]
        const e = t.N - t.T
        if (t.kind === 1 && e >= 0) continue
        if (t.kind === 2 && e <= 0) continue
        const s2 = t.T * t.T
        g += 2 * t.w * a * e / s2
        h += 2 * t.w * a * a / s2
      }
      let nx = v.x - g / h
      if (nx < v.lo) nx = v.lo
      if (nx > v.hi) nx = v.hi
      const d = nx - v.x
      if (d !== 0) {
        for (let ti = 0; ti < terms.length; ti++) if (v.a[ti] !== 0) terms[ti].N += v.a[ti] * d
        v.x = nx
        moved = Math.max(moved, Math.abs(d) / v.b)
      }
    }
    if (moved < 2e-4) break
  }
  for (const v of vars) drafts[v.m].meal.items[v.i] = { ...drafts[v.m].meal.items[v.i], grams: v.x }
  let cost = 0
  for (const t of terms) cost += termCost(t)
  for (const v of vars) cost += REG_W * ((v.x - v.b) / v.b) ** 2
  return cost
}

/** Coste de un día tal cual (sin optimizar), con la misma métrica que solveDay */
export function dayCost(drafts: MealDraft[], targets: Targets, mealKcal?: (number | undefined)[]): number {
  const terms = buildTerms(targets, drafts, mealKcal)
  drafts.forEach((d, m) => d.meal.items.forEach(it => {
    const n = per100(it.foodId, it.state)
    if (n) for (const t of terms) if (t.meal === undefined || t.meal === m) t.N += n[t.key] * it.grams / 100
  }))
  return terms.reduce((s, t) => s + termCost(t), 0)
}

/** Paso de redondeo "por unidades" (huevos enteros, frutas por piezas, rebanadas, yogures) o null */
function unitStep(food: Food): number | null {
  const u = food.unit
  if (!u || u.g > 200) return null
  if (food.cat === 'huevos') return u.g
  if (food.cat === 'frutas' && food.role === 'fruit') return u.g >= 120 ? u.g / 2 : u.g
  if (/^(rebanada|yogur|tortilla|pan|pita)$/.test(u.one)) return u.g
  return null
}

export function roundGrams(g: number): number {
  if (g < 15) return Math.round(g)
  if (g < 60) return Math.round(g / 5) * 5
  return Math.round(g / 10) * 10
}

/**
 * Optimiza y redondea a cantidades que se pueden cocinar: primero las que van por unidades
 * (2 huevos, 1 yogur, ½ plátano), se bloquean, se reoptimiza el resto y se redondea a 5-10 g.
 */
export function solveAndRound(drafts: MealDraft[], targets: Targets, opts: SolveOpts = {}): number {
  solveDay(drafts, targets, opts)
  const locked = new Set(opts.locked ?? [])
  drafts.forEach((d, m) => d.meal.items.forEach((it, i) => {
    if (d.fixed[i] || d.hard || locked.has(`${m}:${i}`)) return
    const food = catalog.get(it.foodId)
    const step = food && unitStep(food)
    if (!step) return
    const [lo] = itemBounds(food!, it.state, d.base[i] || it.grams)
    const units = Math.max(lo > 0 ? 1 : 0, Math.round(it.grams / step))
    d.meal.items[i] = { ...it, grams: Math.round(units * step) }
    locked.add(`${m}:${i}`)
  }))
  solveDay(drafts, targets, { ...opts, locked })
  drafts.forEach((d, m) => d.meal.items.forEach((it, i) => {
    if (d.hard || locked.has(`${m}:${i}`)) return
    if (d.fixed[i]) { if (isSemiFixed(d, i)) d.meal.items[i] = { ...it, grams: Math.round(it.grams) }; return }
    const g = roundGrams(it.grams)
    const baseLabel = it.portionLabel
    d.meal.items[i] = { ...it, grams: g, portionLabel: baseLabel && Math.abs(g - (d.base[i] || g)) / Math.max(1, d.base[i] || g) < 0.08 ? baseLabel : undefined }
  }))
  return dayCost(drafts, targets, opts.mealKcal)
}
