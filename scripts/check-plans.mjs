// Banco de pruebas del generador de dietas: carga los módulos reales vía Vite (SSR) y mide
// cuánto se desvía cada día de los objetivos, tamaños de ración y cobertura de micros.
import { createServer } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

const root = 'C:/Users/kevin/Documents/apps/Dietapp'
const realFetch = globalThis.fetch
globalThis.fetch = async (url, opts) => {
  const u = String(url)
  if (u.includes('data/') && u.endsWith('.json')) {
    const file = path.join(root, 'public', u.slice(u.indexOf('data/')))
    return { ok: true, json: async () => JSON.parse(fs.readFileSync(file, 'utf8')) }
  }
  return realFetch(url, opts)
}

const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [] } })
const { catalog } = await server.ssrLoadModule('/src/data/foodDb.ts')
await catalog.load()
const gen = await server.ssrLoadModule('/src/lib/planGenerator.ts')
const nut = await server.ssrLoadModule('/src/lib/nutrition.ts')
const nd = await server.ssrLoadModule('/src/data/nutrients.ts')
const hooks = await server.ssrLoadModule('/src/store/hooks.ts')
const shop = fs.existsSync(path.join(root, 'src/lib/shopping.ts')) ? await server.ssrLoadModule('/src/lib/shopping.ts') : null

const baseProfile = { id: 'me', name: 'T', intolerances: [], customIntolerances: [], dislikedFoodIds: [], onboarded: true, bodyFatPct: null, birthYear: 1992, birthDate: '1992-06-15' }
const PROFILES = {
  dustLose: { ...baseProfile, sex: 'male', heightCm: 180, weightKg: 90, activity: 'light', goal: 'lose', pace: 'normal' },
  maintain75: { ...baseProfile, sex: 'male', heightCm: 175, weightKg: 75, activity: 'light', goal: 'maintain', pace: 'normal' },
  woman60: { ...baseProfile, sex: 'female', heightCm: 163, weightKg: 60, activity: 'moderate', goal: 'lose', pace: 'normal', birthDate: '1995-03-10' },
  gain70: { ...baseProfile, sex: 'male', heightCm: 178, weightKg: 70, activity: 'moderate', goal: 'gain', pace: 'normal', birthDate: '2000-01-01' },
  lactoseFree: { ...baseProfile, sex: 'female', heightCm: 168, weightKg: 68, activity: 'light', goal: 'maintain', pace: 'normal', intolerances: ['lacteos'] },
}

const args = process.argv.slice(2)
const verbose = args.includes('-v')
const only = args.find(a => !a.startsWith('-'))
const pct = (v, t) => Math.round(v / t * 100)
const out = []
let worst = { kcal: 0, protein: 0, carbs: 0, fat: 0 }
const agg = { days: 0, okDays: 0, micros: 0, microsTot: 0, maxItem: [], mealShare: 0 }

for (const [pname, profile] of Object.entries(PROFILES)) {
  if (only && pname !== only) continue
  const targets = nut.computeTargets(profile)
  out.push(`\n=== ${pname}: ${targets.kcal} kcal · P ${targets.protein} · C ${targets.carbs} · F ${targets.fat}`)
  for (const params of [
    { complexity: 'easy', variety: 'medium', mealsPerDay: 4 },
    { complexity: 'medium', variety: 'high', mealsPerDay: 5 },
    { complexity: 'complex', variety: 'low', mealsPerDay: 3 },
  ]) {
    for (const seed of [1, 7, 42]) {
      const t0 = Date.now()
      const days = gen.generatePlan(profile, targets, params, seed)
      const ms = Date.now() - t0
      out.push(`-- ${params.complexity}/${params.variety}/${params.mealsPerDay} seed ${seed} (${ms} ms)`)
      days.forEach((d, i) => {
        const n = gen.dayNutrients(d)
        const dev = { kcal: pct(n.kcal, targets.kcal), protein: pct(n.protein, targets.protein), carbs: pct(n.carbs, targets.carbs), fat: pct(n.fat, targets.fat) }
        for (const k of Object.keys(worst)) worst[k] = Math.max(worst[k], Math.abs(dev[k] - 100))
        const micros = nd.TRACKED_MICROS.filter(k => (targets.micros[k] ?? 0) > 0)
        const covered = micros.filter(k => n[k] >= targets.micros[k] * 0.9)
        const miss = micros.filter(k => n[k] < targets.micros[k] * 0.9).map(k => `${k}:${pct(n[k], targets.micros[k])}%`)
        agg.days++; agg.micros += covered.length; agg.microsTot += micros.length
        const ok = Object.values(dev).every(v => Math.abs(v - 100) <= 8)
        if (ok) agg.okDays++
        // raciones exageradas
        const big = []
        for (const m of d.meals) for (const it of m.items) {
          const f = catalog.get(it.foodId)
          const raw = it.state === 'cooked' && f?.yield ? it.grams / f.yield : it.grams
          if ((f?.role === 'protein' && f.cat !== 'legumbres' && raw > 260) || (f?.cat === 'cereales' && raw > 140 && it.state !== 'cooked') || it.grams > 500) big.push(`${f?.name} ${it.grams}g${it.state === 'cooked' ? 'c' : ''}`)
        }
        const mealK = d.meals.map(m => `${m.meal.slice(0, 3)} ${Math.round(hooks.sumRefs(m.items).kcal)}`).join(' | ')
        out.push(`  D${i + 1} kcal ${dev.kcal}% P ${dev.protein}% C ${dev.carbs}% F ${dev.fat}% · micros ${covered.length}/${micros.length}${miss.length ? ' (' + miss.join(' ') + ')' : ''} · sodio ${Math.round(n.sodium)} · ${mealK}${big.length ? ' · GRANDE: ' + big.join(', ') : ''}`)
        if (verbose || (!ok && args.includes('-f'))) for (const m of d.meals) out.push(`     ${m.meal}: ${m.title} — ${m.items.map(it => `${catalog.get(it.foodId)?.name} ${it.grams}${it.state === 'cooked' ? 'gc' : 'g'}`).join(', ')}`)
      })
      if (shop && verbose && seed === 1) {
        const plan = { days, params, name: 'x', emoji: 'x', isActive: true }
        const list = shop.buildShoppingList(plan, 'week')
        for (const [cat, arr] of list) out.push(`   🛒 ${cat}: ${arr.map(l => `${l.food.name} ${l.units ? l.units + ' ' + l.unitLabel + ' ≈' + Math.round(l.grams) + 'g' : Math.round(l.grams) + ' g'}${l.alt ? ' (' + l.alt + ')' : ''}`).join(' · ')}`)
      }
    }
  }
}
// Recalcular el resto del día y Nivelar, con el perfil de pérdida de grasa
{
  const profile = PROFILES.dustLose
  const targets = nut.computeTargets(profile)
  const params = { complexity: 'easy', variety: 'medium', mealsPerDay: 4 }
  for (const seed of [3, 9]) {
    const day = gen.generatePlan(profile, targets, params, seed)[0]
    const breakfast = day.meals.filter(m => m.meal === 'desayuno')
    // capricho en la comida: hamburguesa grande con queso ≈ 1.000 kcal
    const capricho = { id: 'x', meal: 'comida', title: 'Capricho', emoji: '🍔', items: [{ id: 'c1', foodId: 'es:pan-hamburguesa', grams: 100 }, { id: 'c2', foodId: 'es:ternera-picada-magra', grams: 250, state: 'raw' }, { id: 'c3', foodId: 'es:queso-lonchas', grams: 40 }, { id: 'c4', foodId: 'es:aceite-oliva', grams: 30 }] }
    const eaten = [...breakfast, capricho]
    const rest = gen.regenerateRest(profile, targets, params, eaten, ['merienda', 'cena'], seed)
    const n = gen.dayNutrients({ meals: [...eaten, ...rest] })
    const en = gen.dayNutrients({ meals: eaten })
    out.push(`\nRECALCULAR (seed ${seed}): comido ${Math.round(en.kcal)} kcal → día ${pct(n.kcal, targets.kcal)}% kcal · P ${pct(n.protein, targets.protein)}% · C ${pct(n.carbs, targets.carbs)}% · F ${pct(n.fat, targets.fat)}%`)
    for (const m of rest) out.push(`     ${m.meal}: ${m.title} — ${m.items.map(it => `${catalog.get(it.foodId)?.name} ${it.grams}g`).join(', ')}`)
    // Nivelar un día desajustado a mano (todo ×1.4)
    const messy = day.meals.map(m => ({ ...m, items: m.items.map(it => ({ ...it, grams: Math.round(it.grams * 1.4) })) }))
    const lv = gen.balanceExistingDay(messy, targets)
    const b = gen.dayNutrients({ meals: messy }), a2 = gen.dayNutrients({ meals: lv })
    out.push(`NIVELAR: antes ${pct(b.kcal, targets.kcal)}% kcal P ${pct(b.protein, targets.protein)}% C ${pct(b.carbs, targets.carbs)}% F ${pct(b.fat, targets.fat)}% → después ${pct(a2.kcal, targets.kcal)}% kcal P ${pct(a2.protein, targets.protein)}% C ${pct(a2.carbs, targets.carbs)}% F ${pct(a2.fat, targets.fat)}%`)
  }
}
out.push(`\nRESUMEN: días ${agg.days}, días con todos los macros ±8 %: ${agg.okDays} (${pct(agg.okDays, agg.days)} %), micros cubiertos ${pct(agg.micros, agg.microsTot)} %`)
out.push(`Peor desviación: kcal ±${worst.kcal} % · P ±${worst.protein} % · C ±${worst.carbs} % · F ±${worst.fat} %`)
console.log(out.join('\n'))
await server.close()
process.exit(0)
