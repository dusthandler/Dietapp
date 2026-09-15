import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, BookmarkPlus, Check, Pencil, Plus, RefreshCw, Scale, Shuffle, Sparkles, Trash2, Wand2, X } from 'lucide-react'
import { Button, Chip, Empty, Sheet, cx, haptic, useConfirm, useToast } from '@/components/ui'
import { amountText, catalog } from '@/data/foodDb'
import { uid } from '@/data/db'
import { COMPLEXITY_LABELS, VARIETY_LABELS } from '@/data/mealTemplates'
import { MEALS, type Complexity, type Food, type FoodRef, type MealId, type Plan, type PlanDay, type PlanMeal, type Profile, type Recipe, type RecipeIngredient, type Targets, type Variety } from '@/data/types'
import { WEEKDAY_LABELS, WEEKDAY_SHORT, dateKey, weekdayIndex } from '@/lib/dates'
import { NUTRIENT_DEFS, TRACKED_MICROS, fmtNutrient } from '@/data/nutrients'
import { balanceExistingDay, dayNutrients, generatePlan, reshuffleMeal, type GenParams } from '@/lib/planGenerator'
import { SubstituteSheet } from '@/features/foods/SubstituteSheet'
import { NutrientFoodsSheet } from '@/features/foods/NutrientFoods'
import type { NutrientKey } from '@/data/nutrients'
import { activatePlan, addItemsToDiary, deletePlan, savePlan, saveProfile, saveRecipe } from '@/store/repo'
import { foodConflicts, nutrientsOfRef, sumRefs, usePlans, useProfile, useRecipes, useTargets } from '@/store/hooks'
import { FoodPicker } from '@/features/foods/FoodPicker'
import { MacroMini, PortionEditor } from '@/features/foods/PortionEditor'

const PLAN_EMOJIS = ['📅', '⚡', '🥗', '💪', '🔥', '🌿', '🍽️', '🏖️', '🏋️', '🧘']

export default function Plans() {
  const plans = usePlans()
  const profile = useProfile()
  const targets = useTargets(profile)
  const toast = useToast()
  const { confirm, el: confirmEl } = useConfirm()
  const [wizard, setWizard] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  const open = useMemo(() => plans?.find(p => p.id === openId) ?? null, [plans, openId])

  if (!profile || !targets) return null

  if (open) {
    return <PlanView plan={open} profile={profile} targets={targets} onBack={() => setOpenId(null)} />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight">Mis dietas</h1>
          <p className="text-sm text-ink-2">Planes semanales guardados. Activa uno y aplícalo cada día.</p>
        </div>
        <Button onClick={() => setWizard(true)}><Wand2 size={18} /> Crear</Button>
      </div>

      {plans && plans.length === 0 && (
        <Empty emoji="📅" title="Aún no tienes ninguna dieta" desc="Genera un plan semanal a tu medida: elige lo fácil o elaborado que quieres cocinar y cuánta variedad. Podrás cambiar cualquier plato o ingrediente."
          action={<Button onClick={() => setWizard(true)}><Sparkles size={18} /> Generar mi primera dieta</Button>} />
      )}

      <div className="flex flex-col gap-3">
        {(plans ?? []).map(p => {
          const avg = p.days.reduce((s, d) => s + dayNutrients(d).kcal, 0) / 7
          return (
            <motion.div layout key={p.id} role="button" tabIndex={0} onClick={() => setOpenId(p.id)} onKeyDown={e => { if (e.key === 'Enter') setOpenId(p.id) }}
              className={cx('press card p-4 text-left flex items-center gap-3 cursor-pointer', p.isActive && 'ring-2 ring-accent')}>
              <span className="text-4xl">{p.emoji}</span>
              <span className="flex-1 min-w-0">
                <div className="font-bold text-lg leading-tight truncate">{p.name} {p.isActive && <span className="text-xs bg-accent text-white rounded-full px-2 py-0.5 ml-1 align-middle">ACTIVA</span>}</div>
                <div className="text-xs text-ink-3">{COMPLEXITY_LABELS[p.params.complexity].emoji} {COMPLEXITY_LABELS[p.params.complexity].label} · {VARIETY_LABELS[p.params.variety].emoji} variedad {VARIETY_LABELS[p.params.variety].label.toLowerCase()} · {p.params.mealsPerDay} comidas</div>
                <div className="text-sm font-semibold text-ink-2 tabular mt-0.5">≈ {Math.round(avg)} kcal/día</div>
              </span>
              <div className="flex flex-col gap-1">
                {!p.isActive && <Button size="sm" variant="soft" onClick={e => { e.stopPropagation(); activatePlan(p.id); toast(`${p.emoji} ${p.name} activada`, { tone: 'ok' }) }}>Activar</Button>}
                <Button size="sm" variant="ghost" onClick={async e => { e.stopPropagation(); if (await confirm('Eliminar dieta', `¿Borrar «${p.name}»?`)) { await deletePlan(p.id); toast('Dieta eliminada') } }}><Trash2 size={16} /></Button>
              </div>
            </motion.div>
          )
        })}
      </div>

      <PlanWizard open={wizard} onClose={() => setWizard(false)} profile={profile} targets={targets}
        onCreated={p => { setWizard(false); setOpenId(p.id); toast(`${p.emoji} ${p.name} creada`, { tone: 'ok' }) }} />
      {confirmEl}
    </div>
  )
}

function OptionCards<T extends string>({ options, value, onChange }: { options: Record<T, { label: string; desc: string; emoji: string }>; value: T; onChange: (v: T) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {(Object.keys(options) as T[]).map(k => {
        const o = options[k]
        const on = value === k
        return (
          <button key={k} onClick={() => { onChange(k); haptic(6) }} className={cx('press p-3 rounded-2xl text-center flex flex-col items-center gap-1', on ? 'bg-accent text-white shadow-float' : 'bg-surface-2')}>
            <span className="text-2xl">{o.emoji}</span>
            <span className="font-bold text-sm leading-tight">{o.label}</span>
            <span className={cx('text-[11px] leading-tight', on ? 'text-white/80' : 'text-ink-3')}>{o.desc}</span>
          </button>
        )
      })}
    </div>
  )
}

function PlanWizard({ open, onClose, profile, targets, onCreated }: { open: boolean; onClose: () => void; profile: Profile; targets: Targets; onCreated: (p: Plan) => void }) {
  const [complexity, setComplexity] = useState<Complexity>('easy')
  const [variety, setVariety] = useState<Variety>('medium')
  const [mealsPerDay, setMealsPerDay] = useState<3 | 4 | 5>(4)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('📅')
  const [busy, setBusy] = useState(false)
  const [base, setBase] = useState<Food[]>([])
  const [pickingBase, setPickingBase] = useState(false)

  const suggested = `${COMPLEXITY_LABELS[complexity].label} · variedad ${VARIETY_LABELS[variety].label.toLowerCase()}`

  const create = async () => {
    setBusy(true)
    const params: GenParams = { complexity, variety, mealsPerDay, mustHave: base.map(f => f.id) }
    const days = generatePlan(profile, targets, params)
    const p = await savePlan({ name: name.trim() || suggested, emoji, days, params, isActive: false })
    haptic([10, 40, 20])
    setBusy(false)
    onCreated(p)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Nueva dieta" wide
      footer={<Button size="xl" full disabled={busy} onClick={create}><Sparkles size={20} /> Generar semana</Button>}>
      <div className="sm:grid sm:grid-cols-[1fr_15rem] sm:gap-5">
      {/* Alimentos base: en escritorio a la derecha, en móvil arriba */}
      <div className="sm:order-2 mb-5 sm:mb-0">
        <div className="card p-3 sm:sticky sm:top-0">
          <div className="font-bold">Alimentos que quiero usar</div>
          <div className="text-xs text-ink-3 mb-2">Lo que tienes en la nevera o te apetece: la dieta los incluirá (repartidos por la semana; con poca variedad, cada día).</div>
          <ul className="flex flex-col gap-1.5 mb-2">
            {base.map(f => (
              <li key={f.id} className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-surface-2">
                <span className="text-xl">{f.emoji}</span>
                <span className="flex-1 min-w-0 text-sm font-semibold truncate">{f.name}</span>
                <button className="press h-7 w-7 rounded-full bg-surface flex items-center justify-center text-ink-3 hover:text-danger" onClick={() => setBase(base.filter(x => x.id !== f.id))} aria-label="Quitar"><X size={14} /></button>
              </li>
            ))}
          </ul>
          <Button variant="soft" size="sm" full onClick={() => setPickingBase(true)}><Plus size={16} /> Añadir alimento</Button>
        </div>
      </div>
      <div className="flex flex-col gap-5 sm:order-1 min-w-0">
        <div>
          <div className="font-bold mb-2">¿Cuánto quieres cocinar?</div>
          <OptionCards options={COMPLEXITY_LABELS} value={complexity} onChange={setComplexity} />
        </div>
        <div>
          <div className="font-bold mb-2">¿Cuánta variedad?</div>
          <OptionCards options={VARIETY_LABELS} value={variety} onChange={setVariety} />
        </div>
        <div>
          <div className="font-bold mb-2">Comidas al día</div>
          <div className="flex gap-2">
            {([3, 4, 5] as const).map(n => (
              <button key={n} onClick={() => setMealsPerDay(n)} className={cx('press flex-1 h-12 rounded-2xl font-bold', mealsPerDay === n ? 'bg-ink text-paper' : 'bg-surface-2')}>{n}</button>
            ))}
          </div>
          <div className="text-xs text-ink-3 mt-1">{mealsPerDay === 3 ? 'Desayuno, comida y cena' : mealsPerDay === 4 ? 'Desayuno, comida, merienda y cena' : 'Desayuno, media mañana, comida, merienda y cena'}</div>
        </div>
        <div>
          <div className="font-bold mb-2">Nombre</div>
          <div className="flex gap-2">
            <select value={emoji} onChange={e => setEmoji(e.target.value)} className="h-12 w-16 rounded-2xl bg-surface-2 text-2xl text-center appearance-none outline-none">
              {PLAN_EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <input value={name} onChange={e => setName(e.target.value)} placeholder={suggested} className="flex-1 h-12 px-4 rounded-2xl bg-surface-2 outline-none focus:ring-2 ring-accent font-semibold" />
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-accent-soft text-accent-ink text-sm">
          Objetivo: <b>{targets.kcal} kcal</b> · 🥩 {targets.protein} g · 🍞 {targets.carbs} g · 🥑 {targets.fat} g. Se respetan tus intolerancias y alimentos que no te gustan.
        </div>
      </div>
      </div>
      <FoodPicker open={pickingBase} onClose={() => setPickingBase(false)} title="Alimento base" keepOpen
        onPick={() => {}} onPickFood={f => { setBase(b => (b.some(x => x.id === f.id) ? b : [...b, f])) }} />
    </Sheet>
  )
}

// ═══════════════════════════ Vista de un plan ═══════════════════════════

function PlanView({ plan, profile, targets, onBack }: { plan: Plan; profile: Profile; targets: Targets; onBack: () => void }) {
  const toast = useToast()
  const { confirm, el: confirmEl } = useConfirm()
  const recipes = useRecipes()
  const [day, setDay] = useState(weekdayIndex(dateKey()))
  const [days, setDays] = useState<PlanDay[]>(plan.days)
  const [dirty, setDirty] = useState(false)
  const [sub, setSub] = useState<{ mealId: string; ing: RecipeIngredient } | null>(null)
  const [editing, setEditing] = useState<{ mealId: string; ing: RecipeIngredient } | null>(null)
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [changeMeal, setChangeMeal] = useState<PlanMeal | null>(null)
  const [newMealSlot, setNewMealSlot] = useState<MealId | null>(null)
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null)
  const [showMicros, setShowMicros] = useState(false)
  const [suggestFor, setSuggestFor] = useState<NutrientKey | null>(null)
  const [suggestMeal, setSuggestMeal] = useState<string | null>(null)
  const [suggestFood, setSuggestFood] = useState<Food | null>(null)

  useEffect(() => { setDays(plan.days); setDirty(false) }, [plan.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const d = days[day]
  const totals = dayNutrients(d)
  const update = (fn: (days: PlanDay[]) => PlanDay[]) => { setDays(prev => fn(prev)); setDirty(true) }
  const updateMeal = (mealId: string, fn: (m: PlanMeal) => PlanMeal | null) => update(ds => ds.map((dd, i) => i !== day ? dd : { ...dd, meals: dd.meals.map(m => m.id === mealId ? fn(m) : m).filter(Boolean) as PlanMeal[] }))

  const save = async () => { await savePlan({ ...plan, days }); setDirty(false); toast('Dieta guardada', { tone: 'ok' }) }
  const regenerate = async () => {
    if (!(await confirm('Regenerar toda la semana', 'Se sustituirán todos los platos por otros nuevos con los mismos criterios.', false))) return
    update(() => generatePlan(profile, targets, plan.params))
    toast('Semana regenerada', { emoji: '✨' })
  }
  const applyToday = async () => {
    for (const m of d.meals) await addItemsToDiary(dateKey(), m.meal, m.items, m.title, m.recipeId)
    toast('Comidas añadidas al diario de hoy', { tone: 'ok' })
  }
  const levelDay = () => {
    update(ds => ds.map((dd, i) => (i === day ? { ...dd, meals: balanceExistingDay(dd.meals, targets) } : dd)))
    toast('Cantidades ajustadas a tus objetivos', { emoji: '⚖️', tone: 'ok' })
  }
  const copyDayToAll = () => {
    update(ds => ds.map((dd, i) => i === day ? dd : { ...dd, meals: d.meals.map(m => ({ ...m, id: uid(), items: m.items.map(it => ({ ...it, id: uid() })) })) }))
    toast('Copiado al resto de la semana')
  }

  const orderedMeals = [...d.meals].sort((a, b) => MEALS.findIndex(m => m.id === a.meal) - MEALS.findIndex(m => m.id === b.meal))
  const missingSlots = MEALS.filter(m => !d.meals.some(x => x.meal === m.id))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button className="press h-10 w-10 rounded-full bg-surface shadow-card flex items-center justify-center" onClick={onBack} aria-label="Volver"><ArrowLeft size={20} /></button>
        <div className="flex-1 min-w-0">
          <div className="text-xl font-extrabold tracking-tight truncate">{plan.emoji} {plan.name}</div>
          <div className="text-xs text-ink-3 truncate">{COMPLEXITY_LABELS[plan.params.complexity].label} · variedad {VARIETY_LABELS[plan.params.variety].label.toLowerCase()}{plan.params.mustHave?.length ? ` · con ${plan.params.mustHave.map(id => catalog.get(id)?.name.split(/[(/]/)[0].trim().toLowerCase()).filter(Boolean).join(', ')}` : ''}</div>
        </div>
        {plan.isActive ? <span className="text-xs font-bold bg-accent text-white rounded-full px-3 py-1">ACTIVA</span>
          : <Button size="sm" variant="soft" onClick={() => { activatePlan(plan.id); toast('Dieta activada', { tone: 'ok' }) }}>Activar</Button>}
      </div>

      {/* Días */}
      <div className="flex gap-1.5">
        {WEEKDAY_SHORT.map((w, i) => {
          const k = dayNutrients(days[i]).kcal
          const on = i === day
          return (
            <button key={w} onClick={() => { setDay(i); haptic(4) }} className={cx('press flex-1 py-2 rounded-2xl flex flex-col items-center', on ? 'bg-ink text-paper' : 'bg-surface shadow-card')}>
              <span className="font-bold">{w}</span>
              <span className={cx('text-[10px] tabular', on ? 'opacity-70' : 'text-ink-3')}>{Math.round(k)}</span>
            </button>
          )
        })}
      </div>

      {/* Totales del día */}
      <div className="card p-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs font-bold text-ink-3 uppercase tracking-wide">{WEEKDAY_LABELS[day]}</div>
            <div className="text-2xl font-extrabold tabular leading-tight">{Math.round(totals.kcal)} <span className="text-sm text-ink-3 font-semibold">/ {targets.kcal} kcal</span></div>
          </div>
          <div className="text-xs font-semibold tabular text-right">
            <div className="text-[var(--c-protein)]">🥩 {Math.round(totals.protein)} <span className="text-ink-3">/ {targets.protein} g</span></div>
            <div className="text-[var(--c-carbs)]">🍞 {Math.round(totals.carbs)} <span className="text-ink-3">/ {targets.carbs} g</span></div>
            <div className="text-[var(--c-fat)]">🥑 {Math.round(totals.fat)} <span className="text-ink-3">/ {targets.fat} g</span></div>
          </div>
        </div>
        {(() => {
          const rows = TRACKED_MICROS.map(k => ({ k, v: totals[k] ?? 0, t: targets.micros[k] ?? 0 })).filter(r => r.t > 0)
          const missing = rows.filter(r => r.v < r.t * 0.9).sort((a, b) => a.v / a.t - b.v / b.t)
          return (
            <div className="mt-2 pt-2 border-t border-line">
              <button className="press w-full flex items-center justify-between text-xs font-semibold" onClick={() => setShowMicros(!showMicros)}>
                <span className={missing.length === 0 ? 'text-ok' : 'text-ink-2'}>{missing.length === 0 ? '✓ Todos los micronutrientes cubiertos' : `Micronutrientes: ${rows.length - missing.length}/${rows.length} cubiertos`}</span>
                <span className="px-2.5 py-1 mr-1 rounded-lg bg-surface-2 text-ink-2">{showMicros ? 'ocultar' : 'ver'}</span>
              </button>
              {showMicros && missing.length > 0 && (<>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {missing.map(r => (
                    <li key={r.k}>
                      <button className="press text-[11px] font-semibold px-2.5 py-1 rounded-full bg-surface-2 text-ink-2 hover:bg-accent-soft hover:text-accent-ink" onClick={() => { setSuggestFor(r.k); setSuggestMeal(orderedMeals[0]?.id ?? null) }} title="Ver alimentos ricos en este nutriente">
                        {NUTRIENT_DEFS[r.k].label} {Math.round(r.v / r.t * 100)}% <span className="text-ink-3">({fmtNutrient(r.k, r.v, false)}/{fmtNutrient(r.k, r.t)})</span> +
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-ink-3 mt-1">Toca un nutriente para ver alimentos que lo cubren y añadirlos al día.</p>
              </>)}
            </div>
          )
        })()}
      </div>

      {/* Comidas */}
      <div className="flex flex-col gap-3">
        {orderedMeals.map(m => {
            const meta = MEALS.find(x => x.id === m.meal)!
            const n = sumRefs(m.items)
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  {m.image ? <img src={m.image} alt="" className="h-11 w-11 rounded-xl object-cover shrink-0" /> : <span className="text-2xl">{m.emoji}</span>}
                  <span className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-ink-3 uppercase tracking-wide">{meta.emoji} {meta.label}</div>
                    {renaming?.id === m.id ? (
                      <input autoFocus value={renaming.title} onChange={e => setRenaming({ id: m.id, title: e.target.value })}
                        onBlur={() => { const t = renaming.title.trim(); if (t) updateMeal(m.id, mm => ({ ...mm, title: t })); setRenaming(null) }}
                        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setRenaming(null) }}
                        className="w-full h-8 px-2 rounded-lg bg-surface-2 font-bold outline-none focus:ring-2 ring-accent" />
                    ) : (
                      <button className="press text-left font-bold leading-tight flex items-center gap-1.5 group" onClick={() => setRenaming({ id: m.id, title: m.title })} title="Cambiar nombre">
                        <span>{m.title}</span><Pencil size={13} className="text-ink-3 opacity-60 group-hover:opacity-100 shrink-0" />
                      </button>
                    )}
                  </span>
                  <span className="text-sm font-bold tabular text-ink-2">🔥 {Math.round(n.kcal)} kcal</span>
                </div>
                <ul className="px-2 pb-1">
                  {m.items.map(it => {
                    const f = catalog.get(it.foodId)
                    const bad = foodConflicts(f, profile).length > 0
                    return (
                      <li key={it.id} className={cx('flex items-center gap-2 px-2 py-1 rounded-xl', bad && 'bg-danger-soft/60')}>
                        <button className="press flex-1 flex items-center gap-2 text-left min-w-0" onClick={() => setEditing({ mealId: m.id, ing: it })}>
                          <span className="text-lg w-7 text-center">{f?.emoji}</span>
                          <span className="flex-1 min-w-0">
                            <div className={cx('text-[15px] font-semibold truncate', bad && 'text-danger')}>{f?.name}</div>
                            <div className="text-xs text-ink-3">{amountText(f, it.grams, it.state, it.portionLabel)}</div>
                          </span>
                          <MacroMini n={nutrientsOfRef(it)} />
                        </button>
                        <button className="press h-8 px-2.5 rounded-full bg-surface-2 text-xs font-bold text-ink-2 flex items-center gap-1" onClick={() => setSub({ mealId: m.id, ing: it })}><Shuffle size={13} /> Sustituir</button>
                        <button className="press h-8 w-8 rounded-full bg-surface-2 text-ink-3 flex items-center justify-center hover:text-danger" onClick={() => updateMeal(m.id, mm => ({ ...mm, items: mm.items.filter(x => x.id !== it.id) }))} aria-label="Quitar"><X size={14} /></button>
                      </li>
                    )
                  })}
                </ul>
                <div className="flex gap-1 px-3 pb-3 pt-1 flex-wrap">
                  <Button size="sm" variant="ghost" onClick={() => setAddingTo(m.id)}><Plus size={14} /> Ingrediente</Button>
                  <Button size="sm" variant="ghost" onClick={() => setChangeMeal(m)}><RefreshCw size={14} /> Cambiar plato</Button>
                  <Button size="sm" variant="ghost" onClick={async () => { await saveRecipe({ name: m.title, emoji: m.emoji, image: m.image ?? null, ingredients: m.items.map(it => ({ ...it, id: uid() })), mealHint: m.meal }); toast(`${m.emoji} «${m.title}» guardada en tus recetas`, { tone: 'ok' }) }} title="Guardar este plato en Mis recetas"><BookmarkPlus size={14} /> Guardar receta</Button>
                  <div className="flex-1" />
                  <Button size="sm" variant="ghost" onClick={() => updateMeal(m.id, () => null)} aria-label="Quitar plato"><Trash2 size={14} /></Button>
                </div>
              </motion.div>
            )
          })}
        {missingSlots.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {missingSlots.map(s => <Chip key={s.id} onClick={() => setNewMealSlot(s.id)}><Plus size={14} /> {s.emoji} {s.label}</Chip>)}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex gap-2">
          <Button variant="soft" full onClick={applyToday}><Check size={18} /> Aplicar al diario de hoy</Button>
          <Button variant="outline" onClick={copyDayToAll} title="Copiar este día al resto de la semana">Copiar a toda la semana</Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" full onClick={levelDay} title="Reajusta las cantidades de este día para volver a cuadrar kcal, proteína y grasa"><Scale size={18} /> Nivelar el día</Button>
          <Button variant="outline" full onClick={regenerate}><Sparkles size={18} /> Regenerar semana</Button>
        </div>
      </div>

        {dirty && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="fixed left-4 right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6 md:left-auto md:right-8 md:w-96 z-30">
            <div className="card p-3 flex items-center gap-3 shadow-float">
              <span className="flex-1 text-sm font-semibold">Cambios sin guardar</span>
              <Button size="sm" variant="ghost" onClick={() => { setDays(plan.days); setDirty(false) }}>Descartar</Button>
              <Button size="sm" onClick={save}>Guardar</Button>
            </div>
          </motion.div>
        )}

      {/* Sugerencias por nutriente → elegir comida y cantidad */}
      <NutrientFoodsSheet nutrient={suggestFor} open={!!suggestFor && !suggestFood} onClose={() => setSuggestFor(null)} profile={profile} target={suggestFor ? targets.micros[suggestFor] : undefined}
        contributors={suggestFor ? d.meals.flatMap(m => m.items.map(it => ({ id: it.id, emoji: catalog.get(it.foodId)?.emoji ?? '❓', name: catalog.get(it.foodId)?.name ?? 'Alimento', meal: m.meal, amount: nutrientsOfRef(it)[suggestFor] ?? 0 }))).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount) : []}
        dayTotal={suggestFor ? totals[suggestFor] : 0}
        onPick={f => setSuggestFood(f)}
        headerExtra={
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-ink-2">Añadir a</span>
            <select value={suggestMeal ?? ''} onChange={e => setSuggestMeal(e.target.value)} className="h-9 px-2 rounded-xl bg-surface-2 text-sm font-semibold outline-none flex-1 min-w-0">
              {orderedMeals.map(m => <option key={m.id} value={m.id}>{MEALS.find(x => x.id === m.meal)?.emoji} {m.title}</option>)}
            </select>
          </div>
        } />
      <Sheet open={!!suggestFood} onClose={() => setSuggestFood(null)} title="Cantidad">
        {suggestFood && (
          <PortionEditor food={suggestFood} saveLabel="Añadir al plato" onSave={ref => {
            const target = suggestMeal ?? orderedMeals[0]?.id
            if (target) updateMeal(target, mm => ({ ...mm, items: [...mm.items, { id: uid(), ...ref }] }))
            setSuggestFood(null); setSuggestFor(null)
            toast(`${suggestFood.emoji} ${suggestFood.name} añadido. Pulsa «Nivelar el día» si quieres recuadrar las cantidades.`, { tone: 'ok' })
          }} />
        )}
      </Sheet>

      {/* Sustituir */}
      <SubstituteSheet open={!!sub} ing={sub?.ing ?? null} profile={profile} onClose={() => setSub(null)}
        onPick={(food, grams, state) => { if (!sub) return; updateMeal(sub.mealId, mm => ({ ...mm, items: mm.items.map(x => x.id === sub.ing.id ? { ...x, foodId: food.id, grams, state, portionLabel: undefined } : x) })); setSub(null); toast(`Cambiado por ${food.emoji} ${food.name}`) }}
        onDislike={async foodId => { await saveProfile({ dislikedFoodIds: [...new Set([...profile.dislikedFoodIds, foodId])] }); toast('No te lo volveremos a proponer', { emoji: '👌' }) }} />

      {/* Editar cantidad */}
      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Cantidad">
        {editing && catalog.get(editing.ing.foodId) && (
          <PortionEditor food={catalog.get(editing.ing.foodId)!} initial={editing.ing} saveLabel="Guardar"
            onSave={ref => { updateMeal(editing.mealId, mm => ({ ...mm, items: mm.items.map(x => x.id === editing.ing.id ? { ...x, ...ref } : x) })); setEditing(null) }} />
        )}
      </Sheet>

      {/* Añadir ingrediente a un plato */}
      <FoodPicker open={!!addingTo} onClose={() => setAddingTo(null)} title="Añadir ingrediente" keepOpen={false}
        onPick={(ref: FoodRef, _f: Food) => { if (addingTo) updateMeal(addingTo, mm => ({ ...mm, items: [...mm.items, { id: uid(), ...ref }] })); setAddingTo(null) }} />

      {/* Cambiar plato entero (otra plantilla o una receta propia) */}
      <ChangeMealSheet open={!!changeMeal || !!newMealSlot} onClose={() => { setChangeMeal(null); setNewMealSlot(null) }} recipes={recipes ?? []}
        slot={changeMeal?.meal ?? newMealSlot ?? 'comida'}
        onShuffle={() => {
          const base: PlanMeal = changeMeal ?? { id: uid(), meal: newMealSlot!, title: '', emoji: '🍽️', items: [] }
          const nm = reshuffleMeal(profile, targets, plan.params, base)
          if (!nm) { toast('No hay más platos disponibles para esta comida', { tone: 'danger' }); return }
          if (changeMeal) updateMeal(changeMeal.id, () => nm)
          else update(ds => ds.map((dd, i) => i === day ? { ...dd, meals: [...dd.meals, nm] } : dd))
          setChangeMeal(null); setNewMealSlot(null)
        }}
        onRecipe={r => {
          const nm: PlanMeal = { id: uid(), meal: changeMeal?.meal ?? newMealSlot!, title: r.name, emoji: r.emoji, recipeId: r.id, image: r.image ?? null, items: r.ingredients.map(i => ({ ...i, id: uid() })) }
          if (changeMeal) updateMeal(changeMeal.id, () => nm)
          else update(ds => ds.map((dd, i) => i === day ? { ...dd, meals: [...dd.meals, nm] } : dd))
          setChangeMeal(null); setNewMealSlot(null)
        }} />
      {confirmEl}
    </div>
  )
}

function ChangeMealSheet({ open, onClose, recipes, slot, onShuffle, onRecipe }:
  { open: boolean; onClose: () => void; recipes: Recipe[]; slot: MealId; onShuffle: () => void; onRecipe: (r: Recipe) => void }) {
  const meta = MEALS.find(m => m.id === slot)
  return (
    <Sheet open={open} onClose={onClose} title={`Plato para ${meta?.label.toLowerCase()}`}>
      <Button size="lg" full onClick={onShuffle}><Shuffle size={18} /> Proponme otro plato</Button>
      {recipes.length > 0 && (
        <>
          <div className="text-xs font-bold text-ink-3 uppercase tracking-wide mt-5 mb-2">O usa una de tus recetas</div>
          <ul className="flex flex-col gap-1.5">
            {recipes.map(r => (
              <li key={r.id}>
                <button className="press w-full flex items-center gap-3 p-2.5 rounded-2xl bg-surface-2 text-left" onClick={() => onRecipe(r)}>
                  <span className="text-2xl">{r.emoji}</span>
                  <span className="flex-1 min-w-0"><div className="font-semibold truncate">{r.name}</div><div className="text-xs text-ink-3">{Math.round(sumRefs(r.ingredients).kcal)} kcal</div></span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Sheet>
  )
}
