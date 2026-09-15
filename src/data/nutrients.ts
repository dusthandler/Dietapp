/**
 * Definición de nutrientes. El orden de NUTRIENT_KEYS coincide con el array
 * compacto generado por scripts/build-usda.mjs.
 */
export const NUTRIENT_KEYS = [
  'kcal', 'protein', 'fat', 'carbs', 'fiber', 'sugar', 'satFat', 'monoFat', 'polyFat', 'chol',
  'vitA', 'vitC', 'vitD', 'vitE', 'vitK', 'b1', 'b2', 'b3', 'b5', 'b6', 'b9', 'b12', 'choline',
  'calcium', 'iron', 'magnesium', 'phosphorus', 'potassium', 'sodium', 'zinc', 'copper', 'manganese', 'selenium',
  'omega3', 'water', 'iodine',
] as const

export type NutrientKey = (typeof NUTRIENT_KEYS)[number]
export type Nutrients = Record<NutrientKey, number>

export type NutrientGroup = 'energy' | 'macro' | 'vitamin' | 'mineral' | 'other'

export interface NutrientDef {
  key: NutrientKey
  label: string
  short: string
  unit: 'kcal' | 'g' | 'mg' | 'µg'
  group: NutrientGroup
  /** true = es un límite (no conviene pasarse), no un objetivo a completar */
  isLimit?: boolean
  /** decimales a mostrar */
  decimals: number
}

const def = (key: NutrientKey, label: string, short: string, unit: NutrientDef['unit'], group: NutrientGroup, decimals: number, isLimit = false): NutrientDef =>
  ({ key, label, short, unit, group, decimals, isLimit })

export const NUTRIENT_DEFS: Record<NutrientKey, NutrientDef> = {
  kcal: def('kcal', 'Calorías', 'kcal', 'kcal', 'energy', 0),
  protein: def('protein', 'Proteína', 'Prot', 'g', 'macro', 0),
  fat: def('fat', 'Grasa', 'Grasa', 'g', 'macro', 0),
  carbs: def('carbs', 'Carbohidratos', 'Carbs', 'g', 'macro', 0),
  fiber: def('fiber', 'Fibra', 'Fibra', 'g', 'macro', 0),
  sugar: def('sugar', 'Azúcares (incl. fruta y leche)', 'Azúcar', 'g', 'macro', 0, true),
  satFat: def('satFat', 'Grasa saturada', 'Sat.', 'g', 'macro', 0, true),
  monoFat: def('monoFat', 'Grasa monoinsaturada', 'Mono', 'g', 'other', 1),
  polyFat: def('polyFat', 'Grasa poliinsaturada', 'Poli', 'g', 'other', 1),
  chol: def('chol', 'Colesterol', 'Col.', 'mg', 'other', 0, true),
  vitA: def('vitA', 'Vitamina A', 'Vit A', 'µg', 'vitamin', 0),
  vitC: def('vitC', 'Vitamina C', 'Vit C', 'mg', 'vitamin', 0),
  vitD: def('vitD', 'Vitamina D', 'Vit D', 'µg', 'vitamin', 1),
  vitE: def('vitE', 'Vitamina E', 'Vit E', 'mg', 'vitamin', 1),
  vitK: def('vitK', 'Vitamina K', 'Vit K', 'µg', 'vitamin', 0),
  b1: def('b1', 'Vitamina B1 (tiamina)', 'B1', 'mg', 'vitamin', 2),
  b2: def('b2', 'Vitamina B2 (riboflavina)', 'B2', 'mg', 'vitamin', 2),
  b3: def('b3', 'Vitamina B3 (niacina)', 'B3', 'mg', 'vitamin', 1),
  b5: def('b5', 'Vitamina B5', 'B5', 'mg', 'vitamin', 1),
  b6: def('b6', 'Vitamina B6', 'B6', 'mg', 'vitamin', 2),
  b9: def('b9', 'Folato (B9)', 'B9', 'µg', 'vitamin', 0),
  b12: def('b12', 'Vitamina B12', 'B12', 'µg', 'vitamin', 1),
  choline: def('choline', 'Colina', 'Colina', 'mg', 'vitamin', 0),
  calcium: def('calcium', 'Calcio', 'Ca', 'mg', 'mineral', 0),
  iron: def('iron', 'Hierro', 'Fe', 'mg', 'mineral', 1),
  magnesium: def('magnesium', 'Magnesio', 'Mg', 'mg', 'mineral', 0),
  phosphorus: def('phosphorus', 'Fósforo', 'P', 'mg', 'mineral', 0),
  potassium: def('potassium', 'Potasio', 'K', 'mg', 'mineral', 0),
  sodium: def('sodium', 'Sodio', 'Na', 'mg', 'mineral', 0, true),
  zinc: def('zinc', 'Zinc', 'Zn', 'mg', 'mineral', 1),
  copper: def('copper', 'Cobre', 'Cu', 'mg', 'mineral', 2),
  manganese: def('manganese', 'Manganeso', 'Mn', 'mg', 'mineral', 1),
  selenium: def('selenium', 'Selenio', 'Se', 'µg', 'mineral', 0),
  omega3: def('omega3', 'Omega-3', 'Ω3', 'g', 'other', 2),
  water: def('water', 'Agua (alimentos)', 'Agua', 'g', 'other', 0),
  iodine: def('iodine', 'Yodo', 'I', 'µg', 'mineral', 0),
}

/** Micronutrientes que se muestran como barras/objetivos diarios */
export const TRACKED_MICROS: NutrientKey[] = [
  'fiber', 'vitA', 'vitC', 'vitD', 'vitE', 'vitK', 'b1', 'b2', 'b3', 'b5', 'b6', 'b9', 'b12', 'choline',
  'calcium', 'iron', 'magnesium', 'phosphorus', 'potassium', 'zinc', 'copper', 'manganese', 'selenium', 'iodine', 'omega3',
]
/**
 * Notas para micronutrientes que es normal no cubrir solo con comida, para que el usuario
 * no interprete la barra baja como un fallo de la dieta.
 */
export const NUTRIENT_NOTES: Partial<Record<NutrientKey, string>> = {
  vitD: 'La vitamina D viene sobre todo del sol (15-20 min al día en brazos y cara). Con comida es casi imposible llegar: solo pescado azul, huevos y setas aportan algo. Es normal que quede baja.',
  iodine: 'La fuente más práctica es la sal yodada (una pizca cubre gran parte); también pescado, marisco, lácteos y huevos. Las bases de datos no tienen yodo para muchos alimentos, así que el valor real suele ser algo mayor.',
  omega3: 'Cuenta ALA + EPA + DHA. Se cubre con pescado azul 2 veces por semana, nueces, chía o lino; no hace falta llegar cada día si la media semanal es buena.',
  vitK: 'Está sobre todo en hojas verdes (espinacas, kale, brócoli). Un puñado de verdura de hoja la cubre de sobra.',
  vitE: 'Frutos secos, semillas y aceite de oliva virgen. Un puñado de almendras o pipas de girasol la completa.',
  vitA: 'Zanahoria, boniato, calabaza y espinacas (carotenos) o huevo e hígado. Media zanahoria grande cubre el día.',
  sodium: 'Viene sobre todo de la sal añadida, embutidos, quesos curados, conservas, pan y salsas. Cocina con menos sal, elige conservas al natural y enjuaga las legumbres de bote.',
  satFat: 'Embutidos, quesos curados, mantequilla, nata, bollería y cortes grasos de carne. Cambia a carnes magras, pescado, lácteos desnatados y aceite de oliva.',
  sugar: 'Incluye los azúcares naturales de la fruta y la leche, que no preocupan. Vigila los añadidos: refrescos, zumos envasados, dulces, cereales azucarados y salsas.',
}

/** Límites (barras que no conviene llenar) */
export const TRACKED_LIMITS: NutrientKey[] = ['sugar', 'satFat', 'sodium']

// ───────────────────────── Color de las barras ─────────────────────────
export type ToneKind = 'target' | 'micro' | 'limit'
export type ToneState = 'far' | 'near' | 'ok' | 'over' | 'excess'
export interface Tone { color: string; state: ToneState }

/** Mezcla continua entre dos tokens de color (t = 0 → a, t = 1 → b) */
const mix = (a: string, b: string, t: number) => {
  const k = Math.round(Math.max(0, Math.min(1, t)) * 100)
  return k <= 0 ? a : k >= 100 ? b : `color-mix(in oklab, ${a} ${100 - k}%, ${b})`
}

/**
 * Color de una barra según lo cerca que está del objetivo. Es un gradiente continuo:
 * - Objetivos (kcal, macros): rojo muy lejos → amarillo cerca → verde en objetivo (92–110 %) →
 *   amarillo si te pasas algo → rojo si te pasas mucho (≥ 150 %).
 * - Micros: igual pero pasarse no penaliza (con comida no hay exceso que preocupe).
 * - Límites (sodio, saturadas, azúcares): verde de salida, amarillo al acercarse (60–100 %),
 *   naranja en el margen de tolerancia (100–110 %) y rojo a partir del 110 %. Un límite es un tope
 *   recomendado, no un precipicio: pasarse 1 g un día no cambia nada; importa la media.
 */
export function barTone(value: number, target: number, kind: ToneKind): Tone {
  const ok = 'var(--ok)', warn = 'var(--warn)', danger = 'var(--danger)'
  if (!(target > 0)) return { color: 'var(--ink-3)', state: 'ok' }
  const p = value / target * 100
  if (kind === 'limit') {
    if (p < 60) return { color: ok, state: 'ok' }
    if (p < 90) return { color: mix(ok, warn, (p - 60) / 30), state: 'near' }
    if (p < 100) return { color: warn, state: 'near' }
    if (p < 110) return { color: mix(warn, danger, (p - 100) / 10), state: 'over' }
    return { color: danger, state: 'excess' }
  }
  if (p < 45) return { color: danger, state: 'far' }
  if (p < 80) return { color: mix(danger, warn, (p - 45) / 35), state: p < 65 ? 'far' : 'near' }
  if (p < 92) return { color: mix(warn, ok, (p - 80) / 12), state: 'near' }
  if (kind === 'micro' || p <= 110) return { color: ok, state: 'ok' }
  if (p < 125) return { color: mix(ok, warn, (p - 110) / 15), state: 'over' }
  if (p < 150) return { color: mix(warn, danger, (p - 125) / 25), state: 'over' }
  return { color: danger, state: 'excess' }
}

export const emptyNutrients = (): Nutrients =>
  Object.fromEntries(NUTRIENT_KEYS.map(k => [k, 0])) as Nutrients

export function addNutrients(a: Nutrients, b: Nutrients, factor = 1): Nutrients {
  const out = { ...a }
  for (const k of NUTRIENT_KEYS) out[k] = (a[k] ?? 0) + (b[k] ?? 0) * factor
  return out
}

export function scaleNutrients(n: Nutrients, factor: number): Nutrients {
  return addNutrients(emptyNutrients(), n, factor)
}

export function fmtNum(v: number, decimals: number): string {
  return v.toFixed(decimals).replace('.', ',')
}

export function fmtNutrient(key: NutrientKey, value: number, withUnit = true): string {
  const d = NUTRIENT_DEFS[key]
  const v = value ?? 0
  const decimals = v >= 100 ? 0 : v >= 10 ? Math.min(d.decimals, 1) : d.decimals
  return `${fmtNum(v, decimals)}${withUnit ? ' ' + d.unit : ''}`
}
