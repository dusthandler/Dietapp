/**
 * Convierte el dataset USDA SR Legacy (JSON oficial, dominio público) en un
 * JSON compacto para la app.
 *
 * Uso:  node scripts/build-usda.mjs [ruta/al/FoodData_Central_sr_legacy_food_json_2018-04.json]
 * Descarga: https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_json_2018-04.zip
 *
 * Salida: public/data/usda.json  →  { keys, cats, foods: [[ndb, desc, catIdx, [nutrientes...]], ...] }
 * Todos los valores son por 100 g.
 */
import fs from 'node:fs'
import path from 'node:path'

const src = process.argv[2] ?? path.join(process.env.TEMP ?? '/tmp', 'FoodData_Central_sr_legacy_food_json_2018-04.json')
if (!fs.existsSync(src)) {
  console.error('No encuentro el JSON de USDA en', src)
  process.exit(1)
}

// Orden de nutrientes en el array compacto (debe coincidir con src/data/nutrients.ts)
const NUTRIENTS = [
  ['kcal', 1008], ['protein', 1003], ['fat', 1004], ['carbs', 1005], ['fiber', 1079], ['sugar', 2000],
  ['satFat', 1258], ['monoFat', 1292], ['polyFat', 1293], ['chol', 1253],
  ['vitA', 1106], ['vitC', 1162], ['vitD', 1114], ['vitE', 1109], ['vitK', 1185],
  ['b1', 1165], ['b2', 1166], ['b3', 1167], ['b5', 1170], ['b6', 1175], ['b9', 1177], ['b12', 1178], ['choline', 1180],
  ['calcium', 1087], ['iron', 1089], ['magnesium', 1090], ['phosphorus', 1091], ['potassium', 1092], ['sodium', 1093],
  ['zinc', 1095], ['copper', 1098], ['manganese', 1101], ['selenium', 1103],
  ['omega3', [1278, 1272, 1270]], // EPA + DHA + ALA
  ['water', 1051],
  ['iodine', null], // USDA SR Legacy no publica yodo → se completa con CIQUAL (foods.ciqual.ts)
]

console.log('Leyendo', src)
const raw = JSON.parse(fs.readFileSync(src, 'utf8'))
const foods = raw.SRLegacyFoods
const cats = []
const catIdx = new Map()

const round = (v, d) => Math.round(v * 10 ** d) / 10 ** d

const out = []
for (const f of foods) {
  const cat = f.foodCategory?.description ?? 'Other'
  if (!catIdx.has(cat)) { catIdx.set(cat, cats.length); cats.push(cat) }
  const byId = new Map()
  for (const n of f.foodNutrients) byId.set(n.nutrient.id, n.amount ?? 0)
  const vals = NUTRIENTS.map(([, id]) => {
    if (id == null) return null
    if (Array.isArray(id)) return round(id.reduce((s, i) => s + (byId.get(i) ?? 0), 0), 3)
    const v = byId.get(id)
    if (v == null) return null
    return v >= 100 ? round(v, 0) : v >= 10 ? round(v, 1) : round(v, 3)
  })
  // Porciones USDA (para alimentos sin capa en español)
  const portions = (f.foodPortions ?? [])
    .filter(p => p.gramWeight > 0 && p.modifier && !/^(oz|lb|fl oz|quart|liter|cubic inch|NLEA)/i.test(p.modifier))
    .slice(0, 4)
    .map(p => [p.amount ?? 1, p.modifier.replace(/\s*\(.*?\)\s*/g, ' ').trim().slice(0, 40), round(p.gramWeight, 1)])
  out.push([f.ndbNumber, f.description, catIdx.get(cat), vals, portions])
}

const result = { version: 'SR-Legacy-2018-04', keys: NUTRIENTS.map(n => n[0]), cats, foods: out }
const dest = path.join(process.cwd(), 'public', 'data', 'usda.json')
fs.mkdirSync(path.dirname(dest), { recursive: true })
fs.writeFileSync(dest, JSON.stringify(result))
const size = fs.statSync(dest).size
console.log(`OK → ${dest}  (${out.length} alimentos, ${(size / 1024 / 1024).toFixed(2)} MB)`)
