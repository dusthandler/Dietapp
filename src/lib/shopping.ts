import { catalog, rawGrams } from '@/data/foodDb'
import type { FoodCategory } from '@/data/foods.es'
import type { Food, Plan } from '@/data/types'

export type Period = 'week' | 'month'

export interface ShopLine {
  food: Food
  /** gramos a comprar (en crudo; en legumbres de bote, peso escurrido) */
  grams: number
  units?: number
  unitLabel?: string
  /** alternativa de compra ("o 330 g en seco") */
  alt?: string
}

/**
 * Formas preparadas que en el súper se compran como otro alimento: los huevos cocidos, fritos o en
 * tortilla son huevos; la patata asada, patatas; el café con leche, leche (≈ 80 %).
 */
const BUY_AS: Record<string, { as: string; byUnits?: boolean; factor?: number }> = {
  'es:huevo-cocido': { as: 'es:huevo', byUnits: true },
  'es:huevo-frito': { as: 'es:huevo', byUnits: true },
  'es:huevos-revueltos': { as: 'es:huevo', byUnits: true },
  'es:tortilla-francesa': { as: 'es:huevo', byUnits: true },
  'es:huevo-escalfado': { as: 'es:huevo', byUnits: true },
  'es:patata-asada': { as: 'es:patata', byUnits: true },
  'es:cafe-con-leche': { as: 'es:leche-semi', factor: 0.8 },
}

/** Peso escurrido de un bote de legumbre cocida de 400 g */
const BOTE_ESCURRIDO = 240

/**
 * Lista de la compra de una dieta: suma lo que piden sus 7 días (o 30 días en "mes"), en crudo,
 * agrupada por categoría y con unidades de compra (huevos, piezas de fruta, botes, latas…).
 */
export function buildShoppingList(plan: Plan, period: Period): Map<FoodCategory, ShopLine[]> {
  const raw = new Map<string, number>()      // gramos en crudo / tal cual
  const cookedLeg = new Map<string, number>() // legumbres usadas ya cocidas (de bote), gramos escurridos
  for (const d of plan.days) for (const m of d.meals) for (const it of m.items) {
    let f = catalog.get(it.foodId)
    if (!f) continue
    let grams = it.grams
    const alias = BUY_AS[f.id]
    const target = alias && catalog.get(alias.as)
    if (alias && target) {
      if (alias.byUnits && f.unit && target.unit) grams = grams / f.unit.g * target.unit.g
      else grams = grams * (alias.factor ?? 1)
      f = target
      raw.set(f.id, (raw.get(f.id) ?? 0) + grams)
      continue
    }
    if (f.cat === 'legumbres' && it.state === 'cooked' && f.yield) { cookedLeg.set(f.id, (cookedLeg.get(f.id) ?? 0) + grams); continue }
    raw.set(f.id, (raw.get(f.id) ?? 0) + rawGrams(f, grams, it.state))
  }

  const factor = period === 'month' ? 30 / 7 : 1
  const groups = new Map<FoodCategory, ShopLine[]>()
  const push = (line: ShopLine) => { const arr = groups.get(line.food.cat) ?? []; arr.push(line); groups.set(line.food.cat, arr) }

  for (const id of new Set([...raw.keys(), ...cookedLeg.keys()])) {
    const f = catalog.get(id)!
    const dry = (raw.get(id) ?? 0) * factor
    const cooked = (cookedLeg.get(id) ?? 0) * factor
    if (cooked > 0) {
      // Legumbre de bote: se compra por botes; también se indica el equivalente en seco
      const totalCooked = cooked + dry * (f.yield ?? 1)
      const units = Math.max(1, Math.ceil(totalCooked / BOTE_ESCURRIDO - 0.15))
      push({ food: f, grams: totalCooked, units, unitLabel: units === 1 ? 'bote (400 g)' : 'botes (400 g)', alt: `o ${Math.round(totalCooked / (f.yield ?? 1) / 10) * 10} g en seco` })
      continue
    }
    if (f.cat === 'especias' && dry < 30) continue // sal, especias… no hace falta comprarlas cada semana
    const line: ShopLine = { food: f, grams: dry }
    if (f.unit) { line.units = Math.max(1, Math.ceil(dry / f.unit.g - 0.15)); line.unitLabel = line.units === 1 ? f.unit.one : f.unit.many }
    push(line)
  }
  for (const arr of groups.values()) arr.sort((a, b) => b.grams - a.grams)
  return groups
}
