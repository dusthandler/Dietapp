import { useMemo, useState } from 'react'
import { ChevronDown, RotateCcw, Trash2 } from 'lucide-react'
import { Button, Chip, cx, haptic, useConfirm } from '@/components/ui'
import { CAT_ROLE, catalog } from '@/data/foodDb'
import { ALLERGEN_LABELS, CATEGORY_LABELS, type Allergen, type FoodCategory } from '@/data/foods.es'
import { NUTRIENT_DEFS, TRACKED_MICROS, emptyNutrients, type NutrientKey, type Nutrients } from '@/data/nutrients'
import type { CustomFood, Food } from '@/data/types'
import { deleteCustomFood, saveCustomFood } from '@/store/repo'

const EMOJIS = ['🍽️', '🥗', '🍲', '🥪', '🍛', '🍱', '🥤', '🍫', '🧀', '🥩', '🍗', '🐟', '🥦', '🍞', '🍎', '🥜', '🍕', '🥛', '🍚', '🫘']
/** Lo que trae la etiqueta de cualquier producto (por 100 g) */
const LABEL_FIELDS: { k: NutrientKey; label: string }[] = [
  { k: 'kcal', label: 'Calorías' }, { k: 'protein', label: 'Proteína' }, { k: 'carbs', label: 'Carbohidratos' }, { k: 'sugar', label: 'de los cuales azúcares' },
  { k: 'fat', label: 'Grasa' }, { k: 'satFat', label: 'de la cual saturada' }, { k: 'fiber', label: 'Fibra' },
]
const MICRO_FIELDS = TRACKED_MICROS.filter(k => k !== 'fiber')

/** número → texto corto ("12", "0.5", "1.25"); acepta coma o punto al volver */
const fmt = (v: number | undefined) => (v == null || v === 0 ? '' : String(Math.round(v * 100) / 100))
const num = (s: string) => { const v = parseFloat(s.replace(',', '.')); return Number.isFinite(v) && v >= 0 ? v : 0 }

/**
 * Editor de alimentos. Tres usos:
 *  - crear un alimento propio (`initialName`),
 *  - editar uno propio (`custom` sin `overrideOf`),
 *  - ajustar uno del catálogo a la marca que compras (`base`, y `custom` si ya estaba ajustado):
 *    los valores nuevos sustituyen a los originales en toda la app; "Restablecer" vuelve al original.
 * Los campos numéricos son texto libre (admiten "0,5" y "12.75") y se convierten al guardar.
 */
export function CustomFoodEditor({ initialName = '', base, custom, onDone }:
  { initialName?: string; base?: Food; custom?: CustomFood; onDone: (food: Food | null) => void }) {
  const isOverride = !!(base || custom?.overrideOf)
  const original = useMemo(() => (base ? catalog.original(base.id) : custom?.overrideOf ? catalog.original(custom.overrideOf) : undefined), [base, custom])
  const src: { name: string; emoji: string; cat: FoodCategory; nutrients: Partial<Nutrients>; allergens: Allergen[]; portions: { label: string; g: number }[] } | null =
    custom ? { name: custom.name, emoji: custom.emoji, cat: custom.cat, nutrients: custom.nutrients, allergens: custom.allergens, portions: custom.portions }
      : base ? { name: base.name, emoji: base.emoji, cat: base.cat, nutrients: base.nutrients, allergens: base.allergens, portions: base.portions } : null

  const [name, setName] = useState(src?.name ?? initialName)
  const [emoji, setEmoji] = useState(src?.emoji ?? '🍽️')
  const [cat, setCat] = useState<FoodCategory>(src?.cat ?? 'platos')
  const [allergens, setAllergens] = useState<Allergen[]>(src?.allergens ?? [])
  const [t, setT] = useState<Partial<Record<NutrientKey, string>>>(() => {
    const out: Partial<Record<NutrientKey, string>> = {}
    for (const k of [...LABEL_FIELDS.map(f => f.k), ...MICRO_FIELDS]) out[k] = fmt(src?.nutrients[k])
    return out
  })
  const [salt, setSalt] = useState(fmt((src?.nutrients.sodium ?? 0) / 400))
  const [portionLabel, setPortionLabel] = useState(src?.portions[0]?.label ?? '1 ración')
  const [portionG, setPortionG] = useState(fmt(src?.portions[0]?.g ?? 100))
  const [showMicros, setShowMicros] = useState(false)
  const [saving, setSaving] = useState(false)
  const { confirm, el: confirmEl } = useConfirm()

  const set = (k: NutrientKey, v: string) => setT(prev => ({ ...prev, [k]: v }))
  const microsFilled = MICRO_FIELDS.filter(k => num(t[k] ?? '') > 0).length

  const field = (k: NutrientKey, label: string, hint?: string) => {
    const def = NUTRIENT_DEFS[k]
    const orig = original && isOverride ? original.nutrients[k] : undefined
    const changed = orig != null && Math.abs(num(t[k] ?? '') - orig) > 0.005
    return (
      <label key={k} className="flex items-center justify-between gap-2 py-1.5 border-b border-line last:border-0">
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-ink-2 truncate">{label}</span>
          {hint && <span className="block text-[11px] text-ink-3">{hint}</span>}
          {changed && <span className="block text-[11px] text-accent-ink">original: {fmt(orig) || '0'} {def.unit}</span>}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          <input inputMode="decimal" value={t[k] ?? ''} placeholder="0" onChange={e => set(k, e.target.value)}
            className={cx('w-20 h-9 px-2 text-right rounded-xl bg-surface-2 outline-none focus:ring-2 ring-accent font-bold tabular', changed && 'ring-2 ring-accent/50')} />
          <span className="text-xs text-ink-3 w-7">{def.unit}</span>
        </span>
      </label>
    )
  }

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    const nutrients: Nutrients = { ...emptyNutrients(), ...(isOverride && original ? original.nutrients : {}) }
    for (const k of [...LABEL_FIELDS.map(f => f.k), ...MICRO_FIELDS]) nutrients[k] = num(t[k] ?? '')
    nutrients.sodium = Math.round(num(salt) * 400)
    const pg = num(portionG)
    const baseId = base?.id ?? custom?.overrideOf
    const cf = await saveCustomFood(isOverride && baseId
      ? { id: custom?.id, overrideOf: baseId, name: name.trim(), emoji, cat: original?.cat ?? cat, role: original?.role ?? CAT_ROLE[cat], nutrients, allergens, portions: [] }
      : { id: custom?.id, name: name.trim(), emoji, cat, role: CAT_ROLE[cat], nutrients, allergens, portions: pg > 0 ? [{ label: portionLabel.trim() || '1 ración', g: pg }] : [] })
    catalog.setCustom([...catalog.customList().filter(x => x.id !== cf.id), cf])
    setSaving(false)
    haptic([8, 30, 12])
    onDone(catalog.get(cf.overrideOf ?? `custom:${cf.id}`) ?? null)
  }

  const reset = async () => {
    if (!custom) return
    const ok = await confirm(isOverride ? 'Restablecer valores originales' : 'Eliminar alimento',
      isOverride ? `«${original?.name ?? name}» volverá a los valores del catálogo.` : `Se elimina «${name}» de tus alimentos. Lo que ya tengas registrado con él se mantiene.`, !isOverride)
    if (!ok) return
    await deleteCustomFood(custom.id)
    catalog.setCustom(catalog.customList().filter(x => x.id !== custom.id))
    onDone(isOverride && custom.overrideOf ? catalog.get(custom.overrideOf) ?? null : null)
  }

  return (
    <div className="flex flex-col gap-3">
      {isOverride && (
        <div className="p-3 rounded-2xl bg-accent-soft text-accent-ink text-sm">
          Estás ajustando <b>{original?.name}</b> a lo que compras tú. Los valores nuevos se usan en todo (diario, recetas, dietas); el original se guarda y puedes volver a él cuando quieras.
        </div>
      )}
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del alimento" className="w-full h-12 px-4 rounded-2xl bg-surface-2 outline-none focus:ring-2 ring-accent font-semibold" />
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {[...new Set([emoji, ...EMOJIS])].map(e => <button key={e} onClick={() => setEmoji(e)} className={cx('press h-10 w-10 shrink-0 rounded-xl text-xl', emoji === e ? 'bg-accent-soft ring-2 ring-accent' : 'bg-surface-2')}>{e}</button>)}
      </div>
      {!isOverride && (
        <select value={cat} onChange={e => setCat(e.target.value as FoodCategory)} className="h-11 px-3 rounded-2xl bg-surface-2 font-semibold outline-none">
          {(Object.keys(CATEGORY_LABELS) as FoodCategory[]).map(c => <option key={c} value={c}>{CATEGORY_LABELS[c].emoji} {CATEGORY_LABELS[c].label}</option>)}
        </select>
      )}

      <div className="card p-3">
        <div className="text-xs font-bold text-ink-3 uppercase tracking-wide mb-1">Valores por 100 g (de la etiqueta)</div>
        {LABEL_FIELDS.map(f => field(f.k, f.label))}
        <label className="flex items-center justify-between gap-2 py-1.5">
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink-2">Sal</span>
            <span className="block text-[11px] text-ink-3">≈ {Math.round(num(salt) * 400)} mg de sodio</span>
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <input inputMode="decimal" value={salt} placeholder="0" onChange={e => setSalt(e.target.value)} className="w-20 h-9 px-2 text-right rounded-xl bg-surface-2 outline-none focus:ring-2 ring-accent font-bold tabular" />
            <span className="text-xs text-ink-3 w-7">g</span>
          </span>
        </label>
      </div>

      <div className="card p-3">
        <button className="press w-full flex items-center justify-between text-left" onClick={() => setShowMicros(!showMicros)}>
          <span>
            <span className="block text-xs font-bold text-ink-3 uppercase tracking-wide">Vitaminas y minerales</span>
            <span className="block text-[11px] text-ink-3">{microsFilled ? `${microsFilled} con valor` : 'Opcional · casi nunca vienen en la etiqueta'}</span>
          </span>
          <ChevronDown size={18} className={cx('text-ink-3 transition-transform', showMicros && 'rotate-180')} />
        </button>
        {showMicros && <div className="mt-2">{MICRO_FIELDS.map(k => field(k, NUTRIENT_DEFS[k].label))}</div>}
      </div>

      {!isOverride && (
        <div className="card p-3">
          <div className="text-xs font-bold text-ink-3 uppercase tracking-wide mb-2">Medida fácil (opcional)</div>
          <div className="flex gap-2">
            <input value={portionLabel} onChange={e => setPortionLabel(e.target.value)} placeholder="1 ración" className="flex-1 min-w-0 h-10 px-3 rounded-xl bg-surface-2 outline-none font-semibold" />
            <input inputMode="decimal" value={portionG} onChange={e => setPortionG(e.target.value)} className="w-20 h-10 px-2 text-right rounded-xl bg-surface-2 outline-none font-bold tabular" />
            <span className="self-center text-xs text-ink-3">g</span>
          </div>
        </div>
      )}

      <div>
        <div className="text-xs font-bold text-ink-3 uppercase tracking-wide mb-2">Contiene</div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(ALLERGEN_LABELS) as Allergen[]).map(a => (
            <Chip key={a} tone="danger" active={allergens.includes(a)} onClick={() => setAllergens(allergens.includes(a) ? allergens.filter(x => x !== a) : [...allergens, a])} className="h-8 text-xs">{ALLERGEN_LABELS[a].emoji} {ALLERGEN_LABELS[a].label}</Chip>
          ))}
        </div>
      </div>

      <Button size="xl" full disabled={!name.trim() || saving} onClick={save}>{isOverride ? 'Guardar mis valores' : custom ? 'Guardar cambios' : 'Guardar alimento'}</Button>
      {custom && (
        <Button variant="ghost" full onClick={reset}>
          {isOverride ? <><RotateCcw size={16} /> Restablecer valores originales</> : <><Trash2 size={16} /> Eliminar alimento</>}
        </Button>
      )}
      {confirmEl}
    </div>
  )
}
