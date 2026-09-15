import { CURATED_FOODS, type Allergen, type FoodCategory, type FoodRole, type Portion } from './foods.es'
import { CIQUAL_PRIMARY, IODINE_FROM, type CiqRef } from './foods.ciqual'
import { NUTRIENT_KEYS, emptyNutrients, type Nutrients } from './nutrients'
import type { CustomFood, Food } from './types'

/**
 * Catálogo de alimentos en memoria.
 *  - Capa curada en español (prioridad en búsqueda)
 *  - USDA SR Legacy (7.793 alimentos, inglés, dominio público)
 *  - CIQUAL 2020 (3.178 alimentos, inglés/francés, Licence Ouverte) — aporta yodo y
 *    pescados/embutidos/platos mediterráneos que USDA no tiene
 *  - Alimentos personalizados del usuario (IndexedDB)
 */

type UsdaRow = [number, string, number, (number | null)[], [number, string, number][]]
interface UsdaFile { version: string; keys: string[]; cats: string[]; foods: UsdaRow[] }
type CiqRow = [number, string, string, number, (number | null)[]]
interface CiqFile { version: string; keys: string[]; cats: string[]; foods: CiqRow[] }

/** Nutrientes con `null` = "sin dato" (distinto de 0) */
type RawNutrients = Record<string, number | null>

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const USDA_CAT_MAP: Record<string, FoodCategory> = {
  'Dairy and Egg Products': 'lacteos', 'Spices and Herbs': 'especias', 'Baby Foods': 'platos',
  'Fats and Oils': 'grasas', 'Poultry Products': 'carne', 'Soups, Sauces, and Gravies': 'salsas',
  'Sausages and Luncheon Meats': 'carne', 'Breakfast Cereals': 'cereales', 'Fruits and Fruit Juices': 'frutas',
  'Pork Products': 'carne', 'Vegetables and Vegetable Products': 'verduras', 'Nut and Seed Products': 'frutos-secos',
  'Beef Products': 'carne', 'Beverages': 'bebidas', 'Finfish and Shellfish Products': 'pescado',
  'Legumes and Legume Products': 'legumbres', 'Lamb, Veal, and Game Products': 'carne', 'Baked Products': 'cereales',
  'Sweets': 'postres', 'Cereal Grains and Pasta': 'cereales', 'Fast Foods': 'platos',
  'Meals, Entrees, and Side Dishes': 'platos', 'Snacks': 'platos', 'American Indian/Alaska Native Foods': 'platos',
  'Restaurant Foods': 'platos',
}
const CIQ_CAT_MAP: Record<string, FoodCategory> = {
  beverages: 'bebidas', 'milk and milk products': 'lacteos', 'meat, egg and fish': 'carne', 'baby food': 'platos',
  'fruits, vegetables, legumes and nuts': 'verduras', 'starters and dishes': 'platos', 'cereal products': 'cereales',
  'sugar and confectionery': 'postres', miscellaneous: 'especias', 'fats and oils': 'grasas', 'ice cream and sorbet': 'postres',
}
const CAT_EMOJI: Record<FoodCategory, string> = {
  carne: '🥩', pescado: '🐟', huevos: '🥚', lacteos: '🥛', cereales: '🌾', tuberculos: '🥔', legumbres: '🫘', verduras: '🥬', frutas: '🍎',
  'frutos-secos': '🥜', grasas: '🫒', bebidas: '🥤', especias: '🌿', endulzantes: '🍯', salsas: '🥫', postres: '🍰', platos: '🍱', suplementos: '💊',
}
export const CAT_ROLE: Record<FoodCategory, FoodRole> = {
  carne: 'protein', pescado: 'protein', huevos: 'protein', lacteos: 'dairy', cereales: 'carb', tuberculos: 'carb', legumbres: 'protein', verduras: 'veg',
  frutas: 'fruit', 'frutos-secos': 'nut', grasas: 'fat', bebidas: 'other', especias: 'other', endulzantes: 'other', salsas: 'other', postres: 'other', platos: 'other', suplementos: 'other',
}

const ALLERGEN_RULES: [RegExp, Allergen][] = [
  [/\b(milk|cheese|yogurt|yoghurt|cream|butter|whey|casein|dairy)\b/i, 'lacteos'],
  [/\b(wheat|bread|pasta|barley|rye|flour|couscous|bulgur|seitan|cracker|cookie|biscuit|cake|pastry|muffin|croissant|semolina)\b/i, 'gluten'],
  [/\begg/i, 'huevo'],
  [/\b(fish|salmon|tuna|cod|hake|trout|sardine|pilchard|anchov|mackerel|herring|halibut|flounder|sole|haddock|pollock|saithe|swordfish|tilapia|bass|bream|snapper|whiting|monkfish|anglerfish|perch|carp|catfish|pike|roe|caviar|albacore)\b/i, 'pescado'],
  [/\b(shrimp|prawn|crab|lobster|crayfish|crustacean|langoustine|scampi)/i, 'marisco'],
  [/\b(clam|mussel|oyster|squid|octopus|scallop|cuttlefish|snail|abalone|mollusk|whelk|cockle)/i, 'moluscos'],
  [/\b(peanut)/i, 'cacahuete'],
  [/\b(almond|walnut|hazelnut|cashew|pistachio|pecan|macadamia|brazil ?nut|pine nut|chestnut|nuts)\b/i, 'frutos-secos'],
  [/\b(soy|soya|tofu|tempeh|edamame|miso)/i, 'soja'],
  [/\b(sesame|tahini)/i, 'sesamo'],
  [/\bcelery/i, 'apio'],
  [/\bmustard/i, 'mostaza'],
]

const MODIFIER_ES: [RegExp, string][] = [
  [/^cup(s)?\b/i, 'taza'], [/^tbsp\b|^tablespoon/i, 'cucharada'], [/^tsp\b|^teaspoon/i, 'cucharadita'],
  [/^slice/i, 'rebanada'], [/^piece/i, 'pieza'], [/^medium/i, 'mediano/a'], [/^large/i, 'grande'], [/^small/i, 'pequeño/a'],
  [/^serving/i, 'ración'], [/^unit/i, 'unidad'], [/^can\b/i, 'lata'], [/^container/i, 'envase'], [/^package/i, 'paquete'],
  [/^fillet/i, 'filete'], [/^steak/i, 'filete'], [/^breast/i, 'pechuga'], [/^thigh/i, 'muslo'], [/^leg/i, 'pierna'],
  [/^bar\b/i, 'barrita'], [/^bottle/i, 'botella'], [/^glass/i, 'vaso'], [/^fruit/i, 'pieza'], [/^whole/i, 'entero'],
  [/^leaf/i, 'hoja'], [/^clove/i, 'diente'], [/^head/i, 'cabeza'], [/^stalk/i, 'tallo'], [/^spear/i, 'espárrago'],
  [/^patty/i, 'hamburguesa'], [/^link/i, 'salchicha'], [/^egg/i, 'huevo'], [/^cookie/i, 'galleta'], [/^scoop/i, 'cazo'],
]

function translateModifier(mod: string): string {
  for (const [re, es] of MODIFIER_ES) if (re.test(mod)) return mod.replace(re, es)
  return mod
}

function toRaw(keys: string[], vals: (number | null)[]): RawNutrients {
  const n: RawNutrients = {}
  for (const k of NUTRIENT_KEYS) n[k] = null
  keys.forEach((k, i) => { if (k in n) n[k] = vals[i] ?? null })
  return n
}

function finalize(n: RawNutrients): Nutrients {
  const out = emptyNutrients()
  for (const k of NUTRIENT_KEYS) (out as Record<string, number>)[k] = n[k] ?? 0
  return out
}

interface SourceRecord { name: string; nameAlt?: string; cat: string; nutrients: RawNutrients; portions: Portion[] }

/**
 * Aplica un ajuste del usuario sobre un alimento del catálogo. Los valores crudos por 100 g son los
 * del ajuste; si el alimento tiene variante cocinada, se recalcula manteniendo la relación
 * crudo→cocinado original de cada nutriente (o el rendimiento si el original era 0).
 */
function applyOverride(base: Food, c: CustomFood): Food {
  const nutrients = { ...emptyNutrients(), ...c.nutrients }
  let nutrientsCooked = base.nutrientsCooked
  if (base.nutrientsCooked) {
    const cooked = emptyNutrients()
    for (const k of NUTRIENT_KEYS) {
      const b = base.nutrients[k], bc = base.nutrientsCooked[k]
      cooked[k] = b > 0 ? nutrients[k] * bc / b : base.yield ? nutrients[k] / base.yield : nutrients[k]
    }
    nutrientsCooked = cooked
  }
  const name = c.name?.trim() || base.name
  return {
    ...base, name, emoji: c.emoji || base.emoji, nutrients, nutrientsCooked,
    portions: c.portions?.length ? c.portions : base.portions,
    allergens: c.allergens ?? base.allergens,
    search: normalize(`${name} ${base.name} ${base.aliases.join(' ')}`), overridden: true,
  }
}

class FoodCatalog {
  private usda = new Map<number, SourceRecord>()
  private ciqual = new Map<number, SourceRecord>()
  private foods = new Map<string, Food>()
  private searchList: Food[] = []
  private custom: CustomFood[] = []
  /** alimentos del catálogo sustituidos por un ajuste del usuario, con su versión original */
  private originals = new Map<string, Food>()
  ready: Promise<void>
  private resolveReady!: () => void
  loaded = false
  private listeners = new Set<() => void>()

  constructor() {
    this.ready = new Promise(res => { this.resolveReady = res })
  }

  subscribe(fn: () => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn) } }
  private emit() { for (const l of this.listeners) l() }

  async load() {
    if (this.loaded) return
    const base = import.meta.env.BASE_URL
    const [usda, ciq] = await Promise.all([
      fetch(`${base}data/usda.json`).then(r => r.json() as Promise<UsdaFile>),
      fetch(`${base}data/ciqual.json`).then(r => r.json() as Promise<CiqFile>).catch(() => null),
    ])
    for (const row of usda.foods) {
      const portions: Portion[] = row[4].map(([amt, mod, g]) => ({ label: `${amt} ${translateModifier(mod)}`, g }))
      this.usda.set(row[0], { name: row[1], cat: usda.cats[row[2]], nutrients: toRaw(usda.keys, row[3]), portions })
    }
    if (ciq) for (const row of ciq.foods) {
      this.ciqual.set(row[0], { name: row[1], nameAlt: row[2], cat: ciq.cats[row[3]], nutrients: toRaw(ciq.keys, row[4]), portions: [] })
    }
    this.buildCurated()
    this.buildInternational()
    this.rebuildSearch()
    this.loaded = true
    this.resolveReady()
    this.emit()
  }

  private ciqPair(ref: CiqRef | undefined): [number | undefined, number | undefined] {
    if (ref == null) return [undefined, undefined]
    return Array.isArray(ref) ? [ref[0], ref[1]] : [ref, undefined]
  }

  private buildCurated() {
    for (const c of CURATED_FOODS) {
      const [primRaw, primCooked] = this.ciqPair(CIQUAL_PRIMARY[c.id] ?? (c.ciq ? (c.ciqCooked ? [c.ciq, c.ciqCooked] : c.ciq) : undefined))
      const rawRec = primRaw ? this.ciqual.get(primRaw) : c.ndb ? this.usda.get(c.ndb) : undefined
      if (!rawRec) { console.warn('Alimento base no encontrado', c.id); continue }
      const cookedRec = primCooked ? this.ciqual.get(primCooked) : c.ndbCooked ? this.usda.get(c.ndbCooked) : undefined
      const raw = { ...rawRec.nutrients }
      const cooked = cookedRec ? { ...cookedRec.nutrients } : undefined

      // Yodo: USDA no lo publica → equivalente CIQUAL. Si no hay código cocinado, se
      // estima por concentración (crudo ÷ rendimiento).
      const [iodRaw, iodCooked] = this.ciqPair(IODINE_FROM[c.id])
      if (raw.iodine == null && iodRaw) raw.iodine = this.ciqual.get(iodRaw)?.nutrients.iodine ?? null
      if (cooked && cooked.iodine == null) {
        const fromCode = iodCooked ? this.ciqual.get(iodCooked)?.nutrients.iodine : null
        cooked.iodine = fromCode ?? (raw.iodine != null && c.yield ? raw.iodine / c.yield : null)
      }

      const food: Food = {
        id: `es:${c.id}`,
        name: c.name,
        nameEn: rawRec.name,
        emoji: c.emoji,
        cat: c.cat,
        role: c.role,
        nutrients: finalize(raw),
        nutrientsCooked: cooked ? finalize(cooked) : undefined,
        yield: cooked ? c.yield ?? 1 : undefined,
        portions: c.portions,
        allergens: c.allergens ?? [],
        aliases: c.aliases ?? [],
        unit: c.unit,
        source: 'curated',
        search: normalize([c.name, ...(c.aliases ?? [])].join(' ')),
      }
      this.foods.set(food.id, food)
    }
  }

  private buildInternational() {
    for (const [ndb, rec] of this.usda) {
      let fcat = USDA_CAT_MAP[rec.cat] ?? 'platos'
      if (fcat === 'verduras' && /^(potato|sweet potato|yam|cassava|taro)/i.test(rec.name)) fcat = 'tuberculos'
      this.foods.set(`usda:${ndb}`, {
        id: `usda:${ndb}`, name: rec.name, nameEn: rec.name, emoji: CAT_EMOJI[fcat], cat: fcat, role: CAT_ROLE[fcat],
        nutrients: finalize(rec.nutrients), portions: rec.portions, allergens: ALLERGEN_RULES.filter(([re]) => re.test(rec.name)).map(([, a]) => a),
        aliases: [], source: 'usda', search: normalize(rec.name),
      })
    }
    for (const [code, rec] of this.ciqual) {
      let fcat = CIQ_CAT_MAP[rec.cat] ?? 'platos'
      // afina la categoría "meat, egg and fish" y "fruits, vegetables, legumes and nuts"
      if (fcat === 'carne') {
        if (/\b(fish|salmon|tuna|cod|hake|trout|sardine|pilchard|anchov|mackerel|herring|sole|bass|bream|squid|octopus|cuttlefish|shrimp|prawn|crab|mussel|clam|oyster|scallop|lobster|seafood|whiting|saithe|pollock|albacore|monkfish|anglerfish)\b/i.test(rec.name)) fcat = 'pescado'
        else if (/\begg/i.test(rec.name)) fcat = 'huevos'
      } else if (fcat === 'verduras') {
        if (/\b(apple|pear|banana|orange|grape|berry|berries|melon|peach|apricot|plum|cherry|kiwi|mango|pineapple|fig|date|lemon|lime|clementine|mandarin|nectarine|papaya|pomegranate|raisin|fruit)\b/i.test(rec.name)) fcat = 'frutas'
        else if (/\b(lentil|chick ?pea|bean|pea|soy|tofu|lupin)\b/i.test(rec.name)) fcat = 'legumbres'
        else if (/\b(almond|walnut|hazelnut|cashew|pistachio|peanut|nut|seed|pine nuts)\b/i.test(rec.name)) fcat = 'frutos-secos'
        else if (/^(potato|sweet potato|cassava|yam)/i.test(rec.name)) fcat = 'tuberculos'
      }
      this.foods.set(`ciqual:${code}`, {
        id: `ciqual:${code}`, name: rec.name, nameEn: rec.name, emoji: CAT_EMOJI[fcat], cat: fcat, role: CAT_ROLE[fcat],
        nutrients: finalize(rec.nutrients), portions: [], allergens: ALLERGEN_RULES.filter(([re]) => re.test(rec.name)).map(([, a]) => a),
        aliases: rec.nameAlt ? [rec.nameAlt] : [], source: 'ciqual', search: normalize(`${rec.name} ${rec.nameAlt ?? ''}`),
      })
    }
  }

  setCustom(list: CustomFood[]) {
    this.custom = list
    for (const id of [...this.foods.keys()]) if (id.startsWith('custom:')) this.foods.delete(id)
    for (const [id, f] of this.originals) this.foods.set(id, f)
    this.originals.clear()
    for (const c of list) {
      if (c.deletedAt) continue
      if (c.overrideOf) {
        const base = this.foods.get(c.overrideOf)
        if (!base || base.overridden) continue
        this.originals.set(base.id, base)
        this.foods.set(base.id, applyOverride(base, c))
        continue
      }
      this.foods.set(`custom:${c.id}`, {
        id: `custom:${c.id}`, name: c.name, emoji: c.emoji, cat: c.cat, role: c.role, nutrients: c.nutrients,
        portions: c.portions, allergens: c.allergens, aliases: [], source: 'custom', search: normalize(c.name),
      })
    }
    this.rebuildSearch()
    this.emit()
  }

  private rebuildSearch() {
    const order = { custom: 0, curated: 1, usda: 2, ciqual: 3 }
    this.searchList = [...this.foods.values()].sort((a, b) => order[a.source] - order[b.source])
  }

  get(id: string): Food | undefined { return this.foods.get(id) }
  /** Versión original (del catálogo) de un alimento ajustado por el usuario */
  original(id: string): Food | undefined { return this.originals.get(id) ?? this.foods.get(id) }
  all(): Food[] { return this.searchList }
  curated(): Food[] { return this.searchList.filter(f => f.source === 'curated' || f.source === 'custom') }
  customList(): CustomFood[] { return this.custom }
  /** número de alimentos por fuente (para mostrar en la UI) */
  counts() { const c = { curated: 0, usda: 0, ciqual: 0, custom: 0 }; for (const f of this.foods.values()) c[f.source]++; return c }

  /**
   * Búsqueda con puntuación: prioriza alimentos en español, coincidencias al
   * principio del nombre y todas las palabras presentes.
   */
  search(query: string, limit = 40, opts?: { includeUsda?: boolean; cat?: FoodCategory }): Food[] {
    const q = normalize(query)
    const includeIntl = opts?.includeUsda ?? true
    if (!q) {
      return this.searchList.filter(f => (f.source === 'curated' || f.source === 'custom') && (!opts?.cat || f.cat === opts.cat)).slice(0, limit)
    }
    const words = q.split(' ').filter(Boolean)
    const scored: { f: Food; s: number }[] = []
    for (const f of this.searchList) {
      const intl = f.source === 'usda' || f.source === 'ciqual'
      if (intl && !includeIntl) continue
      if (opts?.cat && f.cat !== opts.cat) continue
      let s = 0
      let all = true
      for (const w of words) {
        const idx = f.search.indexOf(w)
        if (idx < 0) { all = false; break }
        if (idx === 0) s += 30
        else if (f.search[idx - 1] === ' ') s += 15
        else s += 4
      }
      if (!all) continue
      if (f.source === 'curated') s += 50
      else if (f.source === 'custom') s += 60
      else s -= Math.min(20, f.search.length / 6) // descripciones largas → menos relevantes
      if (f.search.startsWith(q)) s += 20
      scored.push({ f, s })
    }
    scored.sort((a, b) => b.s - a.s || a.f.name.length - b.f.name.length)
    return scored.slice(0, limit).map(x => x.f)
  }
}

export const catalog = new FoodCatalog()

/** Devuelve nutrientes por 100 g según estado (crudo/cocinado) */
export function nutrientsFor(food: Food, state?: 'raw' | 'cooked'): Nutrients {
  if (state === 'cooked' && food.nutrientsCooked) return food.nutrientsCooked
  return food.nutrients
}

/** Gramos en crudo equivalentes (para la lista de la compra) */
export function rawGrams(food: Food, grams: number, state?: 'raw' | 'cooked'): number {
  if (state === 'cooked' && food.yield) return grams / food.yield
  return grams
}

export function hasVariants(food: Food): boolean {
  return !!food.nutrientsCooked
}

const FRACS: Record<string, number> = { '¼': 0.25, '⅓': 1 / 3, '½': 0.5, '⅔': 2 / 3, '¾': 0.75 }
/** Formatea cantidades "humanas": 2, 1½, ¾… Devuelve null si no es representable */
const fmtN = (n: number): string | null => {
  const whole = Math.floor(n + 1e-9), frac = n - whole
  const f = frac < 0.02 ? '' : Math.abs(frac - 0.25) < 0.02 ? '¼' : Math.abs(frac - 1 / 3) < 0.02 ? '⅓' : Math.abs(frac - 0.5) < 0.02 ? '½' : Math.abs(frac - 2 / 3) < 0.02 ? '⅔' : Math.abs(frac - 0.75) < 0.02 ? '¾' : null
  if (f === null) return null
  if (!f) return String(whole)
  return whole ? `${whole}${f}` : f
}
const NO_PLURAL = new Set(['de', 'del', 'a', 'al', 'la', 'el', 'con', 'sin', 'en', 'para', 'y', 'o', 'por', 'crudo', 'cruda', 'cocido', 'cocida', 'cocinado', 'cocinada', 'hervido', 'hervida', 'asado', 'asada', 'frito', 'frita'])
const ADJ_PLURAL = new Set(['crudo', 'cruda', 'cocido', 'cocida', 'cocinado', 'cocinada', 'hervido', 'hervida', 'asado', 'asada', 'frito', 'frita', 'mediano', 'mediana', 'pequeño', 'pequeña', 'grande', 'entero', 'entera', 'fino', 'fina', 'escurrido', 'escurrida'])

function pluralWord(w: string): string {
  if (/[\d()]/.test(w)) return w
  const lower = w.toLowerCase()
  if (NO_PLURAL.has(lower) && !ADJ_PLURAL.has(lower)) return w
  if (/s$/i.test(w)) return w
  if (/z$/i.test(w)) return w.slice(0, -1) + 'ces'
  if (/[aeiouáéíóú]$/i.test(w)) return w + 's'
  if (/[íúó]n$/i.test(w)) return w.replace(/ín$/, 'in').replace(/ún$/, 'un').replace(/ón$/, 'on') + 'es' // ración → raciones, jamón → jamones
  return w + 'es'
}

/** "1 plátano mediano" ×3 → "3 plátanos medianos"; "2 cucharadas" ×2 → "4 cucharadas"; "Un puñado" ×2 → "2 puñados" */
function multiplyLabel(label: string, n: number): string | null {
  const m = label.match(/^(\d+|un|una|[¼⅓½⅔¾])\s+(.*)$/i)
  if (!m) return null // "Para ensalada", "Un chorrito"… solo tienen sentido ×1
  const k = /^\d+$/.test(m[1]) ? Number(m[1]) : FRACS[m[1]] ?? 1
  const total = k * n
  const rest = m[2]
  if (Math.abs(total - 1) < 0.01) return `1 ${rest}`
  const t = fmtN(total)
  if (t === null) return null
  if (total < 1) return `${t} ${rest}`
  // Solo se pluraliza si el resto está en singular (k === 1)
  const phrase = k === 1 ? rest.split(' ').map(pluralWord).join(' ') : rest
  return `${t} ${phrase}`
}

/**
 * Describe una cantidad con la medida casera más cercana, para que en las listas se
 * entienda sin abrir el alimento: "1 plátano mediano", "≈ 2 filetes", "≈ ½ pechuga".
 * Si ya hay una etiqueta exacta guardada, se devuelve tal cual.
 */
export function describeAmount(food: Food, grams: number, state?: 'raw' | 'cooked', exactLabel?: string): string | undefined {
  if (exactLabel) return exactLabel
  const variants = hasVariants(food)
  const ps = food.portions.filter(p => !variants || !state || !p.state || p.state === state)
  if (!ps.length || grams <= 0) return undefined
  let best: { text: string; err: number; score: number } | null = null
  for (const p of ps) {
    if (p.g <= 0) continue
    const raw = grams / p.g
    const n = raw < 0.75 ? 0.5 : Math.round(raw * 2) / 2
    if (n < 0.5 || n > 8) continue
    const err = Math.abs(grams - n * p.g) / grams
    if (err > 0.3) continue
    const text = n === 1 ? p.label : multiplyLabel(p.label, n)
    if (!text) continue
    const score = err + (n === 1 ? 0 : 0.05) + (n % 1 ? 0.04 : 0) + Math.max(0, n - 1) * 0.045 + (p.g < 5 ? 0.2 : 0)
    if (!best || score < best.score) best = { text: `${err > 0.04 ? '≈ ' : ''}${text}`, err, score }
  }
  return best?.text
}

/** Texto de cantidad para listas: "180 g · 1 manzana mediana", "150 g crudo · 120 g cocinado · 2 filetes" */
export function amountText(food: Food | undefined, grams: number, state?: 'raw' | 'cooked', exactLabel?: string): string {
  const desc = food ? describeAmount(food, grams, state, exactLabel) : exactLabel
  if (food && hasVariants(food)) {
    const y = food.yield ?? 1
    const raw = state === 'cooked' ? grams / y : grams
    const cooked = state === 'cooked' ? grams : grams * y
    return `${Math.round(raw)} g crudo · ${Math.round(cooked)} g cocinado${desc ? ` · ${desc}` : ''}`
  }
  return `${Math.round(grams)} g${desc ? ` · ${desc}` : ''}`
}
