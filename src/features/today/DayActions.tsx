import { useEffect, useMemo, useState } from 'react'
import { Check, RefreshCw, Sparkles } from 'lucide-react'
import { Button, Sheet, cx, haptic, useToast } from '@/components/ui'
import { amountText, catalog } from '@/data/foodDb'
import { MACRO_EMOJI, MacroMini } from '@/features/foods/PortionEditor'
import { MEALS, mealForHour, type MealId, type PlanDay, type PlanMeal, type Profile, type Targets } from '@/data/types'
import { hourNow } from '@/lib/dates'
import { mealSplit, regenerateRest, type GenParams } from '@/lib/planGenerator'
import { activatePlan, addItemsToDiary, clearMeal, savePlan } from '@/store/repo'
import { sumRefs, type DaySummary } from '@/store/hooks'

const PLAN_EMOJIS = ['📅', '⚡', '🥗', '💪', '🔥', '🌿', '🍽️', '🏖️', '🏋️', '🧘']
const DEFAULT_PARAMS: GenParams = { complexity: 'medium', variety: 'medium', mealsPerDay: 4 }

/** Lo registrado en el diario convertido a comidas de plan (para el generador o para guardar como dieta) */
export function diaryAsPlanMeals(summary: DaySummary): PlanMeal[] {
  return MEALS.filter(m => summary.byMeal[m.id].items.length > 0).map(m => {
    const items = summary.byMeal[m.id].items
    const recipeName = items.find(it => it.recipeName)?.recipeName
    return {
      id: m.id, meal: m.id, emoji: m.emoji,
      title: recipeName ?? (items.length === 1 ? items[0].food?.name ?? m.label : m.label),
      recipeId: items.every(it => it.recipeId === items[0].recipeId) ? items[0].recipeId ?? null : null,
      items: items.map(it => ({ id: it.id, foodId: it.foodId, grams: it.grams, state: it.state, portionLabel: it.portionLabel })),
    }
  })
}

/** Vista compacta de una comida propuesta: título, ingredientes con medida casera y macros */
function MealPreview({ m }: { m: PlanMeal }) {
  const n = sumRefs(m.items)
  const meal = MEALS.find(x => x.id === m.meal)
  return (
    <div className="p-3 rounded-2xl bg-surface-2">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xl">{meal?.emoji}</span>
        <span className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wide text-ink-3">{meal?.label}</div>
          <div className="font-bold text-sm leading-tight truncate">{m.title}</div>
        </span>
        <MacroMini n={n} />
      </div>
      <ul className="flex flex-col gap-0.5">
        {m.items.map(it => {
          const f = catalog.get(it.foodId)
          return <li key={it.id} className="text-xs text-ink-2 flex gap-1.5"><span>{f?.emoji ?? '❓'}</span><span className="truncate">{f?.name ?? 'Alimento'} · {amountText(f, it.grams, it.state, it.portionLabel)}</span></li>
        })}
      </ul>
    </div>
  )
}

/**
 * "Recalcular el resto del día": lo comido se mantiene; las comidas marcadas se generan de nuevo
 * para que el día cuadre. Se ve la propuesta antes de aplicarla y se puede pedir otra.
 */
export function RegenerateRestSheet({ open, onClose, date, isToday, profile, targets, summary, params }:
  { open: boolean; onClose: () => void; date: string; isToday: boolean; profile: Profile; targets: Targets; summary: DaySummary; params?: GenParams }) {
  const toast = useToast()
  const p = params ?? DEFAULT_PARAMS
  const [sel, setSel] = useState<Set<MealId>>(new Set())
  const [preview, setPreview] = useState<PlanMeal[] | null>(null)
  const [seed, setSeed] = useState(0)
  const [busy, setBusy] = useState(false)

  const eaten = useMemo(() => diaryAsPlanMeals(summary), [summary])

  // Por defecto: comidas vacías que aún no han pasado (hoy) y que existen en la dieta activa
  useEffect(() => {
    if (!open) return
    const split = mealSplit(p.mealsPerDay)
    const nowFrom = isToday ? MEALS.find(m => m.id === mealForHour(hourNow()))!.hourFrom : 0
    const def = MEALS.filter(m => summary.byMeal[m.id].items.length === 0 && m.hourFrom >= nowFrom && (split[m.id] ?? 0) > 0).map(m => m.id)
    setSel(new Set(def)); setPreview(null); setSeed(0)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: MealId) => { const s = new Set(sel); s.has(id) ? s.delete(id) : s.add(id); setSel(s); setPreview(null); haptic(6) }
  const slots = MEALS.filter(m => sel.has(m.id)).map(m => m.id)
  const kept = eaten.filter(m => !sel.has(m.meal))
  const keptN = kept.reduce((t, m) => { const n = sumRefs(m.items); return { kcal: t.kcal + n.kcal, protein: t.protein + n.protein } }, { kcal: 0, protein: 0 })
  const rest = targets.kcal - keptN.kcal

  const generate = (s = seed) => {
    const out = regenerateRest(profile, targets, p, kept, slots, Date.now() + s)
    setPreview(out)
    if (!out.length) toast('No hay platos disponibles para esas comidas', { tone: 'danger' })
  }
  const another = () => { const s = seed + 1; setSeed(s); generate(s); haptic(6) }

  const apply = async () => {
    if (!preview?.length) return
    setBusy(true)
    for (const m of preview) { await clearMeal(date, m.meal); await addItemsToDiary(date, m.meal, m.items, m.title) }
    setBusy(false)
    haptic([10, 40, 20])
    toast(`${preview.length === 1 ? 'Comida recalculada' : `${preview.length} comidas recalculadas`} para cuadrar el día`, { emoji: '🔄', tone: 'ok' })
    onClose()
  }

  const finalN = preview ? [...kept, ...preview].reduce((t, m) => { const n = sumRefs(m.items); return { kcal: t.kcal + n.kcal, protein: t.protein + n.protein } }, { kcal: 0, protein: 0 }) : null

  return (
    <Sheet open={open} onClose={onClose} title="Recalcular el resto del día"
      footer={preview?.length ? (
        <div className="flex gap-2">
          <Button variant="outline" size="lg" onClick={another}><RefreshCw size={16} /> Otra propuesta</Button>
          <Button size="lg" full disabled={busy} onClick={apply}><Check size={18} /> Aplicar al diario</Button>
        </div>
      ) : (
        <Button size="lg" full disabled={slots.length === 0} onClick={() => { generate(); haptic(8) }}><Sparkles size={18} /> Proponer {slots.length === 1 ? 'la comida' : 'las comidas'}</Button>
      )}>
      <p className="text-sm text-ink-2 mb-3">Lo que ya has comido se mantiene tal cual. Las comidas marcadas se generan de nuevo para que el día completo cuadre con tus objetivos.</p>

      <div className={cx('p-3 rounded-2xl text-sm mb-3', rest < -150 ? 'bg-warn-soft text-warn' : 'bg-accent-soft text-accent-ink')}>
        Se mantienen <b>{Math.round(keptN.kcal)} kcal</b> de {targets.kcal} · {MACRO_EMOJI.protein} {Math.round(keptN.protein)} de {targets.protein} g.{' '}
        {rest > 150
          ? <>Quedan <b>{Math.round(rest)} kcal</b> para {slots.length === 0 ? 'lo que marques' : MEALS.filter(m => sel.has(m.id)).map(m => m.label.toLowerCase()).join(' y ')}.</>
          : rest >= -150
            ? <>Ya estás en el objetivo: lo que falte saldrá ligero.</>
            : <>Te has pasado en <b>{Math.round(-rest)} kcal</b>: las comidas que faltan saldrán ligeras, sin saltarte ninguna.</>}
      </div>

      <div className="flex flex-col gap-1.5 mb-3">
        {MEALS.map(m => {
          const items = summary.byMeal[m.id].items
          const kcal = summary.byMeal[m.id].nutrients.kcal
          const on = sel.has(m.id)
          return (
            <button key={m.id} onClick={() => toggle(m.id)} className={cx('press w-full flex items-center gap-3 p-2.5 rounded-2xl text-left', on ? 'bg-accent-soft ring-2 ring-accent' : 'bg-surface-2')}>
              <span className="text-xl">{m.emoji}</span>
              <span className="flex-1 min-w-0">
                <div className="font-bold text-sm">{m.label}</div>
                <div className={cx('text-xs', on && items.length ? 'text-warn font-semibold' : 'text-ink-3')}>
                  {items.length ? (on ? `Hecha (${Math.round(kcal)} kcal) · se reemplaza` : `Hecha · ${Math.round(kcal)} kcal · se mantiene`) : on ? 'Se genera nueva' : 'Vacía · no se toca'}
                </div>
              </span>
              <span className={cx('h-6 w-6 rounded-full flex items-center justify-center shrink-0', on ? 'bg-accent text-white' : 'bg-surface border border-line')}>{on && <Check size={14} strokeWidth={3} />}</span>
            </button>
          )
        })}
      </div>

      {preview && preview.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-xs font-bold text-ink-3 uppercase tracking-wide px-1">Propuesta</div>
          {preview.map(m => <MealPreview key={m.id} m={m} />)}
          {finalN && (
            <div className="text-xs text-ink-2 px-1">Con esto el día queda en <b>{Math.round(finalN.kcal)} kcal</b> ({Math.round(finalN.kcal / targets.kcal * 100)} %) y {MACRO_EMOJI.protein} <b>{Math.round(finalN.protein)} g</b> de proteína.</div>
          )}
        </div>
      )}
    </Sheet>
  )
}

/** "Guardar el día como dieta": lo registrado hoy pasa a ser una dieta (cada día de la semana igual) */
export function SaveDayAsPlanSheet({ open, onClose, summary, params }: { open: boolean; onClose: () => void; summary: DaySummary; params?: GenParams }) {
  const toast = useToast()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🍽️')
  const [activate, setActivate] = useState(true)
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (open) { setName(''); setEmoji('🍽️'); setActivate(true) } }, [open])
  const meals = useMemo(() => diaryAsPlanMeals(summary), [summary])
  const mealsPerDay = Math.min(5, Math.max(3, meals.length)) as 3 | 4 | 5

  const save = async () => {
    setBusy(true)
    const day: PlanDay = { meals }
    // Cada día de la semana lleva su propia copia (ids nuevos) para poder editarlos por separado
    const days = Array.from({ length: 7 }, () => ({ meals: day.meals.map(m => ({ ...m, id: `${m.id}-${Math.random().toString(36).slice(2, 8)}`, items: m.items.map(it => ({ ...it, id: `${it.id}-${Math.random().toString(36).slice(2, 6)}` })) })) }))
    const p = await savePlan({ name: name.trim() || 'Mi día', emoji, days, params: { ...(params ?? DEFAULT_PARAMS), variety: 'low', mealsPerDay }, isActive: false })
    if (activate) await activatePlan(p.id)
    setBusy(false)
    haptic([10, 40, 20])
    toast(`${emoji} «${p.name}» guardada en Dietas${activate ? ' y activada' : ''}`, { tone: 'ok' })
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Guardar el día como dieta"
      footer={<Button size="lg" full disabled={busy || meals.length === 0} onClick={save}><Check size={18} /> Guardar dieta</Button>}>
      <p className="text-sm text-ink-2 mb-3">Las {meals.length} comidas de este día se guardan como una dieta nueva en «Dietas» (igual todos los días de la semana). Luego podrás editarla, variar días o generar la lista de la compra.</p>
      <div className="flex gap-2 mb-3">
        <select value={emoji} onChange={e => setEmoji(e.target.value)} className="h-12 w-16 rounded-2xl bg-surface-2 text-2xl text-center appearance-none outline-none">
          {PLAN_EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la dieta" className="flex-1 h-12 px-4 rounded-2xl bg-surface-2 outline-none focus:ring-2 ring-accent font-semibold" />
      </div>
      <button onClick={() => { setActivate(!activate); haptic(6) }} className={cx('press w-full flex items-center gap-3 p-3 rounded-2xl text-left mb-3', activate ? 'bg-accent-soft ring-2 ring-accent' : 'bg-surface-2')}>
        <span className={cx('h-6 w-6 rounded-full flex items-center justify-center shrink-0', activate ? 'bg-accent text-white' : 'bg-surface border border-line')}>{activate && <Check size={14} strokeWidth={3} />}</span>
        <span className="text-sm"><b>Activarla</b> como dieta actual <span className="text-ink-3">(la que se propone con «Aplicar» y usa la lista de la compra)</span></span>
      </button>
      <div className="flex flex-col gap-2">
        {meals.map(m => <MealPreview key={m.id} m={m} />)}
      </div>
    </Sheet>
  )
}
