import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { BookmarkPlus, CalendarPlus, Check, ChevronDown, ChevronLeft, ChevronRight, Copy, Plus, RefreshCw, Shuffle, Sparkles, Trash2 } from 'lucide-react'
import { Button, CheckCircle, ProgressBar, Ring, Sheet, cx, haptic, useConfirm, useToast } from '@/components/ui'
import { NUTRIENT_DEFS, NUTRIENT_NOTES, TRACKED_LIMITS, TRACKED_MICROS, fmtNutrient, type NutrientKey, barTone } from '@/data/nutrients'
import { amountText } from '@/data/foodDb'
import { MACRO_EMOJI, MacroMini } from '@/features/foods/PortionEditor'
import { MEALS, mealForHour, type Food, type FoodRef, type MealId, type Recipe, type RecipeIngredient } from '@/data/types'
import { WEEKDAY_SHORT, addDays, dateKey, formatDay, hourNow, startOfWeek, weekdayIndex } from '@/lib/dates'
import { activatePlan, addDiaryItem, addItemsToDiary, addRecipeToDiary, copyDay, removeDiaryGroup, removeDiaryItem, setDayExtras, updateDiaryItem } from '@/store/repo'
import { foodConflicts, useActivePlan, useDayExtras, useDaySummary, usePlans, useProfile, useRecipes, useTargets, useWeekKcal, type ResolvedItem } from '@/store/hooks'
import { FoodPicker } from '@/features/foods/FoodPicker'
import { PortionEditor } from '@/features/foods/PortionEditor'
import { RecipeAddSheet } from '@/features/recipes/RecipeAddSheet'
import { RecipeEditor } from '@/features/recipes/Recipes'
import { SubstituteSheet } from '@/features/foods/SubstituteSheet'
import { ContributorList, NutrientFoodsSheet, type Contributor } from '@/features/foods/NutrientFoods'
import { RegenerateRestSheet, SaveDayAsPlanSheet } from './DayActions'

export default function Today() {
  const [date, setDate] = useState(dateKey())
  const profile = useProfile()
  const targets = useTargets(profile)
  const summary = useDaySummary(date, true)
  const extras = useDayExtras(date)
  const week = useWeekKcal(date, true)
  const activePlan = useActivePlan()
  const plans = usePlans()
  const recipes = useRecipes()
  const toast = useToast()
  const { confirm, el: confirmEl } = useConfirm()

  const [picker, setPicker] = useState<{ meal: MealId } | null>(null)
  const [editing, setEditing] = useState<ResolvedItem | null>(null)
  const [recipeToAdd, setRecipeToAdd] = useState<{ recipe: Recipe; meal: MealId } | null>(null)
  const [saveAsRecipe, setSaveAsRecipe] = useState<{ name: string; emoji: string; ingredients: RecipeIngredient[] } | null>(null)
  const [planSelect, setPlanSelect] = useState(false)
  const [regen, setRegen] = useState(false)
  const [saveDay, setSaveDay] = useState(false)
  const [sub, setSub] = useState<ResolvedItem | null>(null)
  const [suggestFor, setSuggestFor] = useState<NutrientKey | null>(null)
  const [suggestMeal, setSuggestMeal] = useState<MealId>('comida')
  const [suggestFood, setSuggestFood] = useState<Food | null>(null)

  // Escritorio: cada columna hace scroll por su cuenta; al llegar al final, la rueda pasa a la otra columna
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const L = leftRef.current, R = rightRef.current
    if (!L || !R) return
    const canScroll = (el: HTMLElement, dy: number) => (dy > 0 ? el.scrollHeight - el.scrollTop - el.clientHeight > 1 : el.scrollTop > 0)
    const mk = (self: HTMLElement, other: HTMLElement) => (e: WheelEvent) => {
      if (window.innerWidth < 1024 || !e.deltaY) return
      if (canScroll(self, e.deltaY)) return
      if (canScroll(other, e.deltaY)) { e.preventDefault(); other.scrollTop += e.deltaY }
    }
    const hl = mk(L, R), hr = mk(R, L)
    L.addEventListener('wheel', hl, { passive: false })
    R.addEventListener('wheel', hr, { passive: false })
    return () => { L.removeEventListener('wheel', hl); R.removeEventListener('wheel', hr) }
  }, [!!profile && !!targets && !!summary]) // las columnas solo existen cuando hay datos

  const recipeImages = useMemo(() => new Map((recipes ?? []).filter(r => r.image).map(r => [r.id, r.image!])), [recipes])

  const isToday = date === dateKey()
  const greeting = useMemo(() => {
    const h = hourNow()
    return h < 6 ? 'Buenas noches' : h < 13 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches'
  }, [])

  if (!profile || !targets || !summary) return null
  const total = summary.total
  const empty = Object.values(summary.byMeal).every(m => m.items.length === 0)
  const allItems = MEALS.flatMap(m => summary.byMeal[m.id].items)
  /** Alimentos de hoy que aportan un nutriente, de mayor a menor */
  const contributorsFor = (k: NutrientKey): Contributor[] => allItems
    .map(it => ({ id: it.id, emoji: it.food?.emoji ?? '❓', name: it.food?.name ?? 'Alimento', meal: it.meal, amount: it.nutrients[k] ?? 0 }))
    .filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount)
  const openNutrient = (k: NutrientKey) => { setSuggestFor(k); setSuggestMeal(mealForHour(hourNow())) }

  const onPick = async (ref: FoodRef, food: Food) => {
    if (!picker) return
    await addDiaryItem(date, picker.meal, ref)
    toast(`${food.emoji} ${food.name} añadido`, { tone: 'ok' })
  }

  const applyPlanDay = async () => {
    if (!activePlan) return
    const day = activePlan.days[weekdayIndex(date)]
    if (!day) return
    const ok = await confirm('Aplicar el plan de hoy', `Se añadirán las comidas de «${activePlan.name}» para este día al diario.`, false)
    if (!ok) return
    for (const m of day.meals) await addItemsToDiary(date, m.meal, m.items, m.title, m.recipeId)
    toast('Plan aplicado al diario', { emoji: '📅', tone: 'ok' })
  }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-6 lg:items-start lg:h-[calc(100dvh-2.75rem)]">
      {/* ───────── Columna izquierda: cabecera + comidas ───────── */}
      <div ref={leftRef} className="flex flex-col gap-4 min-w-0 lg:h-full lg:overflow-y-auto no-scrollbar lg:pr-2 lg:pb-6">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-sm text-ink-3 font-semibold">{greeting}, {profile.name.split(' ')[0]}</div>
            <div className="text-2xl font-extrabold tracking-tight capitalize">{formatDay(date)}</div>
          </div>
          <button className="press h-10 w-10 rounded-full bg-surface shadow-card flex items-center justify-center" onClick={() => setDate(addDays(date, -1))} aria-label="Día anterior"><ChevronLeft size={20} /></button>
          {!isToday && <button className="press h-10 px-3 rounded-full bg-accent-soft text-accent-ink text-sm font-bold" onClick={() => setDate(dateKey())}>Hoy</button>}
          <button className="press h-10 w-10 rounded-full bg-surface shadow-card flex items-center justify-center" onClick={() => setDate(addDays(date, 1))} aria-label="Día siguiente"><ChevronRight size={20} /></button>
        </div>

        {week && (
          <div className="flex gap-1.5">
            {week.map((k, i) => {
              const d = addDays(startOfWeek(date), i)
              const on = d === date
              const future = d > dateKey()
              const pct = Math.min(1, k / targets.kcal)
              return (
                <button key={i} onClick={() => setDate(d)} className={cx('press flex-1 flex flex-col items-center gap-1 py-1.5 rounded-2xl', on ? 'bg-surface shadow-card' : 'hover:bg-surface-2')} aria-label={d}>
                  <span className={cx('text-[11px] font-bold', on ? 'text-ink' : 'text-ink-3')}>{WEEKDAY_SHORT[i]}</span>
                  <span className="relative h-7 w-7 rounded-full" style={{ background: future ? 'var(--surface-2)' : `conic-gradient(${k > targets.kcal * 1.1 ? 'var(--danger)' : 'var(--accent)'} ${pct * 360}deg, var(--surface-2) 0)` }}>
                    <span className="absolute inset-[5px] rounded-full bg-surface" />
                    {k >= targets.kcal * 0.9 && k <= targets.kcal * 1.1 && <span className="absolute inset-0 flex items-center justify-center text-[10px] text-ok font-black">✓</span>}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* En móvil el resumen va arriba; en escritorio, en la columna derecha */}
        <div className="lg:hidden"><EnergyCard total={total} targets={targets} contributors={contributorsFor} onSelect={openNutrient} /></div>

        {plans && plans.length > 0 && (
          <div className="flex gap-2">
            <button onClick={() => setPlanSelect(true)} className="press flex-1 min-w-0 flex items-center gap-3 h-14 px-3 rounded-2xl bg-surface shadow-card text-left" title="Cambiar la dieta activa">
              <span className="text-2xl">{activePlan?.emoji ?? '📅'}</span>
              <span className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wide text-ink-3">Dieta activa</div>
                <div className="font-bold truncate text-sm">{activePlan?.name ?? 'Elegir una dieta…'}</div>
              </span>
              <ChevronDown size={18} className="text-ink-3 shrink-0" />
            </button>
            <Button variant="soft" size="lg" className="h-14 shrink-0" disabled={!activePlan} onClick={applyPlanDay} title="Añade al diario las comidas previstas para este día">
              <Sparkles size={18} /> Aplicar
            </Button>
          </div>
        )}

        {/* Acciones sobre el día: recalcular lo que queda / convertirlo en dieta */}
        {!empty && (
          <div className="grid grid-cols-2 gap-2">
            <DayAction icon={<RefreshCw size={18} strokeWidth={2.25} />} label="Recalcular el resto" hint="Cuadra lo que te falta" onClick={() => setRegen(true)} title="Mantiene lo comido y genera de nuevo las comidas que faltan para cuadrar el día" />
            <DayAction icon={<CalendarPlus size={18} strokeWidth={2.25} />} label="Guardar como dieta" hint="Lo de hoy, cada día" onClick={() => setSaveDay(true)} title="Guarda las comidas de este día como una dieta nueva" />
          </div>
        )}

        <div className="flex flex-col gap-3">
          {MEALS.map(m => {
            const data = summary.byMeal[m.id]
            return (
              <MealCard key={m.id} meal={m} items={data.items} kcal={data.nutrients.kcal} profile={profile} images={recipeImages}
                onAdd={() => setPicker({ meal: m.id })}
                onEdit={it => setEditing(it)}
                onSubstitute={it => setSub(it)}
                onRemoveGroup={async gid => { await removeDiaryGroup(gid); toast('Receta eliminada') }}
                onSaveRecipe={() => setSaveAsRecipe({ name: '', emoji: m.emoji, ingredients: data.items.map(it => ({ id: it.id, foodId: it.foodId, grams: it.grams, state: it.state, portionLabel: it.portionLabel })) })}
              />
            )
          })}
          {isToday && empty && (
            <button onClick={async () => { await copyDay(addDays(date, -1), date); toast('Copiado el día de ayer', { emoji: '📋' }) }} className="press self-center text-sm font-semibold text-ink-3 flex items-center gap-1.5 py-1"><Copy size={14} /> Copiar lo de ayer</button>
          )}
        </div>

        <div className="lg:hidden flex flex-col gap-4">
          <WaterTracker ml={extras?.waterMl ?? 0} onChange={ml => setDayExtras(date, { waterMl: ml })} />
          <MicroSection total={total} targets={targets.micros} onSuggest={openNutrient} contributors={contributorsFor} />
        </div>
      </div>

      {/* ───────── Columna derecha (escritorio): datos ───────── */}
      <aside ref={rightRef} className="hidden lg:flex flex-col gap-4 lg:h-full overflow-y-auto no-scrollbar pr-1 pb-6">
        <EnergyCard total={total} targets={targets} contributors={contributorsFor} onSelect={openNutrient} />
        <WaterTracker ml={extras?.waterMl ?? 0} onChange={ml => setDayExtras(date, { waterMl: ml })} />
        <MicroSection total={total} targets={targets.micros} onSuggest={openNutrient} contributors={contributorsFor} />
      </aside>

      <div className="lg:hidden text-[11px] text-ink-3 text-center pb-2">Valores nutricionales: USDA + CIQUAL · Objetivos: EFSA DRV</div>

      {/* FAB */}
      <motion.button whileTap={{ scale: 0.92 }} onClick={() => { setPicker({ meal: mealForHour(hourNow()) }); haptic(8) }}
        className="md:hidden fixed right-5 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 h-14 w-14 rounded-full bg-accent text-white shadow-float flex items-center justify-center" aria-label="Añadir alimento">
        <Plus size={28} strokeWidth={2.5} />
      </motion.button>

      <FoodPicker open={!!picker} onClose={() => setPicker(null)} onPick={onPick} meal={picker?.meal}
        title={picker ? `Añadir a ${MEALS.find(m => m.id === picker.meal)?.label}` : 'Añadir'}
        onPickRecipe={r => { if (picker) { setRecipeToAdd({ recipe: r, meal: picker.meal }); setPicker(null) } }} />

      <RecipeAddSheet open={!!recipeToAdd} recipe={recipeToAdd?.recipe ?? null} onClose={() => setRecipeToAdd(null)}
        onConfirm={async ings => {
          if (!recipeToAdd) return
          await addRecipeToDiary(date, recipeToAdd.meal, recipeToAdd.recipe, ings)
          toast(`${recipeToAdd.recipe.emoji} ${recipeToAdd.recipe.name} añadida`, { tone: 'ok' })
          setRecipeToAdd(null)
        }} />

      <RecipeEditor open={!!saveAsRecipe} recipe={null} initial={saveAsRecipe} onClose={() => setSaveAsRecipe(null)}
        onSaved={r => { setSaveAsRecipe(null); toast(`${r.emoji} «${r.name}» guardada en tus recetas`, { tone: 'ok' }) }} />

      <Sheet open={!!editing} onClose={() => setEditing(null)} title={editing?.recipeName ? `De: ${editing.recipeName}` : 'Editar'}>
        {editing?.food && (
          <PortionEditor food={editing.food} initial={{ grams: editing.grams, state: editing.state, portionLabel: editing.portionLabel }} saveLabel="Guardar"
            onSave={async ref => { await updateDiaryItem(editing.id, ref); setEditing(null); haptic(8) }}
            onDelete={async () => { await removeDiaryItem(editing.id); setEditing(null); toast('Eliminado') }} />
        )}
      </Sheet>
      {/* Sustituir un alimento del diario por otro equivalente */}
      <SubstituteSheet open={!!sub} ing={sub} profile={profile} onClose={() => setSub(null)}
        onPick={async (food, grams, state) => { if (!sub) return; await updateDiaryItem(sub.id, { foodId: food.id, grams, state, portionLabel: undefined }); setSub(null); toast(`Cambiado por ${food.emoji} ${food.name}`) }} />

      {/* Sugerencias por nutriente → elegir comida y cantidad → diario */}
      <NutrientFoodsSheet nutrient={suggestFor} open={!!suggestFor && !suggestFood} onClose={() => setSuggestFor(null)} profile={profile}
        target={suggestFor ? (suggestFor === 'protein' ? targets.protein : suggestFor === 'carbs' ? targets.carbs : suggestFor === 'fat' ? targets.fat : targets.micros[suggestFor]) : undefined}
        contributors={suggestFor ? contributorsFor(suggestFor) : []} dayTotal={suggestFor ? total[suggestFor] : 0}
        onContributorClick={c => { const it = allItems.find(x => x.id === c.id); if (it) { setSuggestFor(null); setEditing(it) } }}
        onPick={f => setSuggestFood(f)}
        headerExtra={
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-ink-2">Añadir a</span>
            <select value={suggestMeal} onChange={e => setSuggestMeal(e.target.value as MealId)} className="h-9 px-2 rounded-xl bg-surface-2 text-sm font-semibold outline-none">
              {MEALS.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.label}</option>)}
            </select>
          </div>
        } />
      <Sheet open={!!suggestFood} onClose={() => setSuggestFood(null)} title="Cantidad">
        {suggestFood && (
          <PortionEditor food={suggestFood} onSave={async ref => { await addDiaryItem(date, suggestMeal, ref); toast(`${suggestFood.emoji} ${suggestFood.name} añadido`, { tone: 'ok' }); setSuggestFood(null); setSuggestFor(null) }} />
        )}
      </Sheet>

      <RegenerateRestSheet open={regen} onClose={() => setRegen(false)} date={date} isToday={isToday} profile={profile} targets={targets} summary={summary} params={activePlan?.params} />
      <SaveDayAsPlanSheet open={saveDay} onClose={() => setSaveDay(false)} summary={summary} params={activePlan?.params} />

      <Sheet open={planSelect} onClose={() => setPlanSelect(false)} title="Dieta activa">
        <p className="text-sm text-ink-2 mb-3">La dieta activa es la que se propone cada día con «Aplicar» y la que usa la lista de la compra.</p>
        <ul className="flex flex-col gap-1.5">
          {(plans ?? []).map(p => (
            <li key={p.id}>
              <button onClick={async () => { await activatePlan(p.id); setPlanSelect(false); toast(`${p.emoji} ${p.name} activada`, { tone: 'ok' }) }}
                className={cx('press w-full flex items-center gap-3 p-3 rounded-2xl text-left', p.isActive ? 'bg-accent-soft ring-2 ring-accent' : 'bg-surface-2')}>
                <span className="text-2xl">{p.emoji}</span>
                <span className="flex-1 min-w-0"><div className="font-bold truncate">{p.name}</div><div className="text-xs text-ink-3">{p.params.mealsPerDay} comidas al día</div></span>
                {p.isActive && <Check size={18} className="text-accent" />}
              </button>
            </li>
          ))}
        </ul>
        {activePlan && <Button variant="ghost" full className="mt-3" onClick={async () => { await activatePlan(null); setPlanSelect(false); toast('Sin dieta activa') }}>Desactivar la dieta actual</Button>}
      </Sheet>
      {confirmEl}
    </div>
  )
}

/** Acción sobre el día, con el mismo aspecto que la tarjeta de "Dieta activa" */
function DayAction({ icon, label, hint, onClick, title }: { icon: React.ReactNode; label: string; hint: string; onClick: () => void; title: string }) {
  return (
    <button onClick={onClick} title={title} className="press flex items-center gap-3 h-14 px-3 rounded-2xl bg-surface shadow-card text-left min-w-0">
      <span className="h-9 w-9 rounded-xl bg-accent-soft text-accent-ink flex items-center justify-center shrink-0">{icon}</span>
      <span className="flex-1 min-w-0">
        <div className="font-bold text-sm leading-tight truncate">{label}</div>
        <div className="text-[11px] text-ink-3 truncate">{hint}</div>
      </span>
    </button>
  )
}

function EnergyCard({ total, targets, contributors, onSelect }: { total: Record<NutrientKey, number>; targets: { kcal: number; protein: number; carbs: number; fat: number }; contributors: (k: NutrientKey) => Contributor[]; onSelect: (k: NutrientKey) => void }) {
  const tone = barTone(total.kcal, targets.kcal, 'target')
  return (
    <div className="card p-4 sm:p-5 flex items-center gap-4">
      <Ring value={total.kcal} max={targets.kcal} size={140} stroke={14} color={tone.color}>
        <div className="text-3xl font-extrabold tabular leading-none">{Math.round(total.kcal)}</div>
        <div className="text-[11px] font-semibold text-ink-3 mt-1">de {targets.kcal} kcal</div>
        <div className="text-xs font-bold mt-1" style={{ color: tone.color }}>
          {total.kcal > targets.kcal ? `+${Math.round(total.kcal - targets.kcal)}` : `${Math.round(targets.kcal - total.kcal)} restantes`}
        </div>
      </Ring>
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        <MacroBar k="protein" label={`${MACRO_EMOJI.protein} Proteína`} value={total.protein} target={targets.protein} color="var(--c-protein)" contributors={contributors} onSelect={onSelect} />
        <MacroBar k="carbs" label={`${MACRO_EMOJI.carbs} Carbos`} value={total.carbs} target={targets.carbs} color="var(--c-carbs)" contributors={contributors} onSelect={onSelect} />
        <MacroBar k="fat" label={`${MACRO_EMOJI.fat} Grasa`} value={total.fat} target={targets.fat} color="var(--c-fat)" contributors={contributors} onSelect={onSelect} />
      </div>
    </div>
  )
}

function MacroBar({ k, label, value, target, color, contributors, onSelect }: { k: NutrientKey; label: string; value: number; target: number; color: string; contributors: (k: NutrientKey) => Contributor[]; onSelect: (k: NutrientKey) => void }) {
  const pct = Math.round((value / target) * 100)
  const tone = barTone(value, target, 'target')
  return (
    <HoverContribs k={k} contributors={contributors} total={value}>
      <button className="w-full text-left" onClick={() => onSelect(k)} title="Ver qué lo aporta hoy y alimentos ricos">
        <div className="flex items-baseline justify-between gap-2 text-sm mb-1">
          <span className="font-bold" style={{ color }}>{label}</span>
          <span className="tabular font-semibold text-ink-2 whitespace-nowrap"><span className="text-ink">{Math.round(value)}</span><span className="text-ink-3 text-xs">/{target} g</span> <span className="text-ink-3 text-xs hidden min-[420px]:inline">{pct}%</span></span>
        </div>
        <ProgressBar value={value} max={target} color={tone.color} height={9} />
      </button>
    </HoverContribs>
  )
}

/** Leyenda de colores de las barras (una sola vez, al final de la columna de datos) */
function ToneLegend() {
  const Dot = ({ c }: { c: string }) => <span className="inline-block h-2 w-2 rounded-full align-middle mr-1" style={{ background: c }} />
  return (
    <div className="text-[11px] text-ink-3 leading-relaxed px-1">
      <div><b className="text-ink-2">Objetivos:</b> <Dot c="var(--danger)" />lejos · <Dot c="var(--warn)" />cerca o algo pasado · <Dot c="var(--ok)" />en objetivo (±10 %)</div>
      <div><b className="text-ink-2">Límites:</b> <Dot c="var(--ok)" />bien · <Dot c="var(--warn)" />acercándote al tope · <Dot c="var(--danger)" />pasado (más de un 10 %)</div>
    </div>
  )
}

const canHover = () => typeof window !== 'undefined' && window.matchMedia?.('(hover: hover)').matches

/**
 * Popover (solo con ratón) con los alimentos de hoy que más aportan. Se pinta con posición fija
 * respecto a la ventana para que no lo recorte la columna con scroll; arriba o abajo según haya sitio.
 */
function HoverContribs({ k, contributors, total, children }: { k: NutrientKey; contributors: (k: NutrientKey) => Contributor[]; total: number; children: React.ReactNode }) {
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const show = () => {
    if (!canHover() || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const below = window.innerHeight - r.bottom
    setPos(below > 220 ? { left: r.left, width: r.width, top: r.bottom + 4 } : { left: r.left, width: r.width, bottom: window.innerHeight - r.top + 4 })
  }
  const list = pos ? contributors(k) : []
  return (
    <div ref={ref} onMouseEnter={show} onMouseLeave={() => setPos(null)}>
      {children}
      {pos && list.length > 0 && createPortal(
        <div className="fixed z-[70] p-2 rounded-xl bg-surface shadow-float border border-line pointer-events-none" style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom }}>
          <div className="text-[10px] font-bold uppercase tracking-wide text-ink-3 mb-1">Hoy lo aportan</div>
          <ContributorList nutrient={k} contributors={list} total={total} compact />
        </div>, document.body)}
    </div>
  )
}

function MealCard({ meal, items, kcal, profile, images, onAdd, onEdit, onSubstitute, onRemoveGroup, onSaveRecipe }:
  { meal: (typeof MEALS)[number]; items: ResolvedItem[]; kcal: number; profile: ReturnType<typeof useProfile>; images: Map<string, string>;
    onAdd: () => void; onEdit: (it: ResolvedItem) => void; onSubstitute: (it: ResolvedItem) => void; onRemoveGroup: (gid: string) => void; onSaveRecipe: () => void }) {
  const groups: { key: string; name?: string | null; gid?: string | null; recipeId?: string | null; items: ResolvedItem[] }[] = []
  for (const it of items) {
    const key = it.groupId ?? it.id
    let g = groups.find(x => x.key === key)
    if (!g) { g = { key, name: it.recipeName, gid: it.groupId, recipeId: it.recipeId, items: [] }; groups.push(g) }
    g.items.push(it)
  }
  const empty = items.length === 0
  const headerImage = groups.map(g => (g.recipeId ? images.get(g.recipeId) : undefined)).find(Boolean)
  return (
    <div className={cx('card overflow-hidden', empty && 'bg-surface/60')}>
      <button onClick={onAdd} className="press w-full flex items-center gap-3 px-4 py-3 text-left">
        {headerImage ? <img src={headerImage} alt="" className="h-11 w-11 rounded-xl object-cover shrink-0" /> : <span className="text-2xl">{meal.emoji}</span>}
        <span className="flex-1 font-bold">{meal.label}</span>
        {!empty && <span className="text-sm font-bold tabular text-ink-2">{MACRO_EMOJI.kcal} {Math.round(kcal)} kcal</span>}
        <span className="h-8 w-8 rounded-full bg-accent-soft text-accent-ink flex items-center justify-center"><Plus size={18} strokeWidth={2.5} /></span>
      </button>
      {!empty && (
        <>
          <ul className="px-2 pb-1">
            {groups.map(g => {
                const img = g.recipeId ? images.get(g.recipeId) : undefined
                return (
                  <motion.li key={g.key} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                    {g.name && (
                      <div className="flex items-center gap-2 px-2 pt-1 pb-0.5 text-xs font-bold text-ink-3 uppercase tracking-wide">
                        {img ? <img src={img} alt="" className="h-6 w-6 rounded-md object-cover" /> : <span>🍲</span>}
                        <span className="flex-1">{g.name}</span>
                        {g.gid && <button className="press p-1 rounded-lg hover:bg-danger-soft hover:text-danger" onClick={() => onRemoveGroup(g.gid!)} aria-label="Eliminar receta"><Trash2 size={14} /></button>}
                      </div>
                    )}
                    {g.items.map(it => <ItemRow key={it.id} item={it} conflicts={foodConflicts(it.food, profile)} indent={!!g.name} onClick={() => onEdit(it)} onSubstitute={() => onSubstitute(it)} />)}
                  </motion.li>
                )
            })}
          </ul>
          <div className="px-3 pb-2.5 flex justify-end">
            <button onClick={onSaveRecipe} className="press h-8 px-3 rounded-full bg-surface-2 text-xs font-bold text-ink-2 flex items-center gap-1.5 hover:text-ink"><BookmarkPlus size={14} /> Guardar como receta</button>
          </div>
        </>
      )}
    </div>
  )
}

function ItemRow({ item, conflicts, indent, onClick, onSubstitute }: { item: ResolvedItem; conflicts: string[]; indent?: boolean; onClick: () => void; onSubstitute: () => void }) {
  const f = item.food
  const bad = conflicts.length > 0
  return (
    <div className={cx('flex items-center gap-1 rounded-xl', indent && 'pl-2', bad && 'bg-danger-soft/60')}>
      <button onClick={onSubstitute} className="press h-8 w-8 shrink-0 rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink flex items-center justify-center" title="Sustituir por otro alimento equivalente" aria-label="Sustituir"><Shuffle size={14} /></button>
      <button onClick={onClick} className="press flex-1 min-w-0 flex items-center gap-3 pr-2 py-1.5 rounded-xl text-left hover:bg-surface-2">
        <span className="text-xl w-8 text-center">{f?.emoji ?? '❓'}</span>
        <span className="flex-1 min-w-0">
          <div className={cx('font-semibold truncate text-[15px]', bad && 'text-danger')}>{f?.name ?? 'Alimento no disponible'}</div>
          <div className="text-xs text-ink-3">{amountText(f, item.grams, item.state, item.portionLabel)}</div>
        </span>
        <MacroMini n={item.nutrients} />
      </button>
    </div>
  )
}

function WaterTracker({ ml, onChange }: { ml: number; onChange: (ml: number) => void }) {
  const glasses = 8
  const filled = Math.round(ml / 250)
  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between mb-2">
        <div className="font-bold">💧 Agua</div>
        <div className="text-sm font-semibold text-ink-2 tabular">{(ml / 1000).toFixed(2).replace('.', ',')} L <span className="text-ink-3">/ 2 L</span></div>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: glasses }).map((_, i) => (
          <button key={i} onClick={() => { onChange(i + 1 === filled ? i * 250 : (i + 1) * 250); haptic(6) }}
            className={cx('press flex-1 h-10 rounded-xl transition-colors', i < filled ? 'bg-[var(--c-water)]' : 'bg-surface-2')} aria-label={`Vaso ${i + 1}`} />
        ))}
      </div>
    </div>
  )
}

function MicroSection({ total, targets, onSuggest, contributors }: { total: Record<NutrientKey, number>; targets: Partial<Record<NutrientKey, number>>; onSuggest: (k: NutrientKey) => void; contributors: (k: NutrientKey) => Contributor[] }) {
  const rows = TRACKED_MICROS.map(k => ({ k, v: total[k] ?? 0, t: targets[k] ?? 0 })).filter(r => r.t > 0)
  const done = rows.filter(r => r.v >= r.t)
  const pending = rows.filter(r => r.v < r.t).sort((a, b) => b.v / b.t - a.v / a.t)
  const limits = TRACKED_LIMITS.map(k => ({ k, v: total[k] ?? 0, t: targets[k] ?? 0 })).filter(r => r.t > 0)
  const [showAll, setShowAll] = useState(false)
  const [note, setNote] = useState<NutrientKey | null>(null)
  const visible = showAll ? pending : pending.slice(0, 8)

  return (
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-extrabold">Micronutrientes</h2>
          <span className="text-sm font-bold text-ink-2 tabular">{done.length}/{rows.length} completados</span>
        </div>

        {done.length > 0 && (
          <div className="card p-4 bg-ok-soft/60 dark:bg-ok-soft">
            <div className="text-xs font-bold text-ok uppercase tracking-wide mb-3">✓ Completado hoy</div>
            <div className="flex flex-wrap gap-3">
              {done.map((r, i) => (
                <button key={r.k} className="press flex flex-col items-center gap-1 w-14" onClick={() => onSuggest(r.k)} title={`${NUTRIENT_DEFS[r.k].label}: ${fmtNutrient(r.k, r.v)} de ${fmtNutrient(r.k, r.t)}`}>
                  <CheckCircle size={40} delay={Math.min(i * 0.03, 0.4)} />
                  <div className="text-[11px] font-bold text-center leading-tight text-ink-2">{NUTRIENT_DEFS[r.k].short}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="card p-4 flex flex-col gap-3">
          {pending.length === 0 && <div className="text-center text-ok font-bold py-2">🎉 ¡Todos los micronutrientes cubiertos!</div>}
          {visible.map(r => {
            const hasNote = !!NUTRIENT_NOTES[r.k]
            return (
              <HoverContribs key={r.k} k={r.k} contributors={contributors} total={r.v}>
                <div className="flex items-baseline justify-between gap-2 text-sm mb-1">
                  <span className="flex items-baseline gap-1.5 min-w-0">
                    <button className="font-semibold text-left truncate hover:text-accent-ink" onClick={() => onSuggest(r.k)} title="Ver qué lo aporta hoy y alimentos ricos">{NUTRIENT_DEFS[r.k].label}</button>
                    {hasNote && <button className="text-ink-3 text-xs" onClick={() => setNote(note === r.k ? null : r.k)} aria-label="Información">ⓘ</button>}
                  </span>
                  <span className="tabular text-ink-2 whitespace-nowrap"><span className="font-bold text-ink">{fmtNutrient(r.k, r.v, false)}</span> / {fmtNutrient(r.k, r.t)} <span className="text-ink-3 text-xs">{Math.round(r.v / r.t * 100)}%</span></span>
                </div>
                <button className="w-full" onClick={() => onSuggest(r.k)} aria-label={`Ver ${NUTRIENT_DEFS[r.k].label}`}>
                  <ProgressBar value={r.v} max={r.t} color={barTone(r.v, r.t, 'micro').color} height={8} />
                </button>
                {note === r.k && <p className="text-xs text-ink-2 mt-1.5 p-2 rounded-xl bg-surface-2">{NUTRIENT_NOTES[r.k]}</p>}
              </HoverContribs>
            )
          })}
          {pending.length > 8 && (
            <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)}>{showAll ? 'Ver menos' : `Ver los ${pending.length - 8} restantes`}</Button>
          )}
        </div>

        <div className="card p-4 flex flex-col gap-3">
          <div className="text-xs font-bold text-ink-3 uppercase tracking-wide">Límites diarios (mejor no llenar)</div>
          {limits.map(r => {
            const tone = barTone(r.v, r.t, 'limit')
            return (
              <HoverContribs key={r.k} k={r.k} contributors={contributors} total={r.v}>
                <button className="w-full text-left" onClick={() => onSuggest(r.k)} title="Ver de dónde viene hoy">
                  <div className="flex items-baseline justify-between text-sm mb-1">
                    <span className="font-semibold">{NUTRIENT_DEFS[r.k].label}</span>
                    <span className={cx('tabular', tone.state === 'ok' ? 'text-ink-2' : 'font-bold')} style={tone.state === 'ok' ? undefined : { color: tone.color }}><span className="font-bold">{fmtNutrient(r.k, r.v, false)}</span> / {fmtNutrient(r.k, r.t)}</span>
                  </div>
                  <ProgressBar value={r.v} max={r.t} color={tone.color} height={6} />
                </button>
              </HoverContribs>
            )
          })}
        </div>
        <ToneLegend />
      </div>
  )
}
