/**
 * Convierte la tabla CIQUAL 2020 (ANSES, Francia — Licence Ouverte / Etalab) en un JSON
 * compacto con el MISMO orden de nutrientes que usda.json.
 *
 * Uso:  node scripts/build-ciqual.mjs [carpeta con los XML]
 * Descarga: https://ciqual.anses.fr/cms/sites/default/files/inline-files/XML_2020_07_07.zip
 *
 * Salida: public/data/ciqual.json → { keys, cats, foods: [[code, nameEn, nameFr, catIdx, [nutrientes...]], ...] }
 * Todos los valores por 100 g. Aporta yodo, y pescados/embutidos/platos mediterráneos que USDA no tiene.
 */
import fs from 'node:fs'
import path from 'node:path'

const dir = process.argv[2] ?? path.join(process.env.TEMP ?? '/tmp', 'ciqual')
const read = f => fs.readFileSync(path.join(dir, f)).toString('latin1')

// Orden de claves = src/data/nutrients.ts (NUTRIENT_KEYS)
const KEYS = ['kcal', 'protein', 'fat', 'carbs', 'fiber', 'sugar', 'satFat', 'monoFat', 'polyFat', 'chol',
  'vitA', 'vitC', 'vitD', 'vitE', 'vitK', 'b1', 'b2', 'b3', 'b5', 'b6', 'b9', 'b12', 'choline',
  'calcium', 'iron', 'magnesium', 'phosphorus', 'potassium', 'sodium', 'zinc', 'copper', 'manganese', 'selenium',
  'omega3', 'water', 'iodine']

// Códigos CIQUAL por clave (array = suma)
const MAP = {
  kcal: 328, protein: 25000, fat: 40000, carbs: 31000, fiber: 34100, sugar: 32000, satFat: 40302, monoFat: 40303, polyFat: 40304, chol: 75100,
  vitC: 55100, vitD: 52100, vitE: 53100, vitK: [54101, 54104], b1: 56100, b2: 56200, b3: 56310, b5: 56400, b6: 56500, b9: 56700, b12: 56600,
  calcium: 10200, iron: 10260, magnesium: 10120, phosphorus: 10150, potassium: 10190, sodium: 10110, zinc: 10300, copper: 10290, manganese: 10251, selenium: 10340,
  omega3: [41833, 42053, 42263], water: 400, iodine: 10530,
}
const RETINOL = 51200, BCAROTENE = 51330

function num(t) {
  t = t.trim()
  if (!t || t === '-') return null
  if (/^traces$/i.test(t)) return 0
  const lt = t.startsWith('<')
  const v = parseFloat(t.replace('<', '').replace(',', '.').trim())
  if (isNaN(v)) return null
  return lt ? 0 : v
}
const round = (v, d) => Math.round(v * 10 ** d) / 10 ** d
const fmt = v => v == null ? null : v >= 100 ? round(v, 0) : v >= 10 ? round(v, 1) : round(v, 3)

console.log('Leyendo', dir)
const groups = new Map()
for (const m of read('alim_grp_2020_07_07.xml').matchAll(/<alim_grp_code>\s*(\d+)\s*<\/alim_grp_code>\s*<alim_grp_nom_fr>[^<]*<\/alim_grp_nom_fr>\s*<alim_grp_nom_eng>\s*([^<]*?)\s*<\/alim_grp_nom_eng>/g))
  groups.set(m[1], m[2])

const foods = new Map()
for (const m of read('alim_2020_07_07.xml').matchAll(/<ALIM>([\s\S]*?)<\/ALIM>/g)) {
  const b = m[1]
  const g = re => (b.match(re) ?? [])[1]?.trim()
  const code = +g(/<alim_code>\s*([^<]+?)\s*</)
  foods.set(code, { code, fr: g(/<alim_nom_fr>\s*([^<]+?)\s*</), en: g(/<alim_nom_eng>\s*([^<]+?)\s*</), grp: g(/<alim_grp_code>\s*([^<]+?)\s*</), n: new Map() })
}

const compo = read('compo_2020_07_07.xml')
const reC = /<alim_code>\s*(\d+)\s*<\/alim_code>\s*<const_code>\s*(\d+)\s*<\/const_code>\s*<teneur>\s*([^<]*?)\s*<\/teneur>/g
let m
while ((m = reC.exec(compo))) {
  const f = foods.get(+m[1])
  if (f) f.n.set(+m[2], num(m[3]))
}

const cats = []
const catIdx = new Map()
const out = []
const skipped = []
for (const f of foods.values()) {
  const cat = groups.get(f.grp) ?? 'Other'
  if (!catIdx.has(cat)) { catIdx.set(cat, cats.length); cats.push(cat) }
  const get = c => Array.isArray(c) ? (c.some(x => f.n.get(x) != null) ? c.reduce((s, x) => s + (f.n.get(x) ?? 0), 0) : null) : (f.n.get(c) ?? null)
  const vals = KEYS.map(k => {
    if (k === 'choline') return null
    if (k === 'vitA') {
      const r = f.n.get(RETINOL), b = f.n.get(BCAROTENE)
      return r == null && b == null ? null : fmt((r ?? 0) + (b ?? 0) / 12)
    }
    if (k === 'kcal') {
      const kj = f.n.get(327) ?? f.n.get(332)
      let kcal = f.n.get(328) ?? f.n.get(333) ?? (kj != null ? kj / 4.184 : null)
      // Sin energía declarada → se calcula con los factores Atwater (Reglamento UE 1169/2011)
      if (kcal == null) {
        const p = f.n.get(25000), fa = f.n.get(40000), c = f.n.get(31000)
        if (p != null || fa != null || c != null) kcal = 4 * (p ?? 0) + 9 * (fa ?? 0) + 4 * (c ?? 0) + 2 * (f.n.get(34100) ?? 0) + 7 * (f.n.get(60000) ?? 0) + 2.4 * (f.n.get(34000) ?? 0)
      }
      return fmt(kcal)
    }
    return fmt(get(MAP[k]))
  })
  if (vals[0] == null) { skipped.push(f.en); continue } // sin energía → inútil
  out.push([f.code, f.en ?? f.fr, f.fr, catIdx.get(cat), vals])
}

const result = { version: 'CIQUAL-2020-07-07', license: 'Etalab Open Licence 2.0 — ANSES', keys: KEYS, cats, foods: out }
const dest = path.join(process.cwd(), 'public', 'data', 'ciqual.json')
fs.writeFileSync(dest, JSON.stringify(result))
console.log('Sin energía (omitidos):', skipped.length, skipped.slice(0, 15).join(' | '))
console.log(`OK → ${dest} (${out.length} alimentos, ${(fs.statSync(dest).size / 1024).toFixed(0)} KB)`)
