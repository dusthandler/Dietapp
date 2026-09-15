import { useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import { Sheet, cx, haptic } from '@/components/ui'
import { catalog, normalize } from '@/data/foodDb'
import { NUTRIENT_DEFS, NUTRIENT_NOTES, TRACKED_LIMITS, TRACKED_MICROS, fmtNutrient, type NutrientKey } from '@/data/nutrients'
import { MEALS, type Food, type MealId, type Profile } from '@/data/types'
import { foodConflicts } from '@/store/hooks'

/** Nombres en castellano con los que se puede buscar un nutriente en el buscador */
const NUTRIENT_ALIASES: [RegExp, NutrientKey][] = [
  [/^(vit(amina)?\s*)?a$/, 'vitA'], [/^(vit(amina)?\s*)?c$|acido ascorbico/, 'vitC'], [/^(vit(amina)?\s*)?d$/, 'vitD'],
  [/^(vit(amina)?\s*)?e$/, 'vitE'], [/^(vit(amina)?\s*)?k$/, 'vitK'],
  [/^(vit(amina)?\s*)?b\s?1$|tiamina/, 'b1'], [/^(vit(amina)?\s*)?b\s?2$|riboflavina/, 'b2'], [/^(vit(amina)?\s*)?b\s?3$|niacina/, 'b3'],
  [/^(vit(amina)?\s*)?b\s?5$|pantot/, 'b5'], [/^(vit(amina)?\s*)?b\s?6$|piridoxina/, 'b6'], [/^(vit(amina)?\s*)?b\s?9$|folato|acido folico|folico/, 'b9'],
  [/^(vit(amina)?\s*)?b\s?12$|cobalamina/, 'b12'], [/colina/, 'choline'],
  [/^calcio$/, 'calcium'], [/^hierro$/, 'iron'], [/^magnesio$/, 'magnesium'], [/^fosforo$/, 'phosphorus'], [/^potasio$/, 'potassium'],
  [/^(zinc|cinc)$/, 'zinc'], [/^cobre$/, 'copper'], [/^manganeso$/, 'manganese'], [/^selenio$/, 'selenium'], [/^(yodo|iodo)$/, 'iodine'],
  [/^omega ?3?$/, 'omega3'], [/^fibra$/, 'fiber'], [/^proteina(s)?$/, 'protein'], [/^sodio$/, 'sodium'], // "sal" no: es el principio de salmón/salsa
  [/^(carbohidratos?|hidratos|carbos)$/, 'carbs'], [/^grasas?$/, 'fat'], [/^grasa saturada|saturadas?$/, 'satFat'], [/^azucar(es)?$/, 'sugar'],
]

/** Si la búsqueda es el nombre de un nutriente ("vitamina c", "hierro", "yodo"…), devuelve su clave */
export function nutrientFromQuery(q: string): NutrientKey | null {
  const raw = normalize(q)
  if (raw.length < 2) return null // "c" solo es el principio de "cebolla", no la vitamina C
  const n = raw.replace(/^vitamina\s+/, 'vit ').replace(/^vit\.?\s*/, 'vit ')
  for (const [re, key] of NUTRIENT_ALIASES) if (re.test(n) || re.test(raw)) return key
  return null
}

/** Nutrientes que se pueden buscar en el buscador (los que se siguen en "Hoy" + macros) */
const SEARCHABLE: NutrientKey[] = ['protein', 'carbs', 'fat', 'fiber', ...TRACKED_MICROS.filter(k => k !== 'fiber'), ...TRACKED_LIMITS]
const EXTRA_TERMS: Partial<Record<NutrientKey, string[]>> = {
  iodine: ['yodo', 'iodo'], b9: ['acido folico', 'folico'], sodium: ['sal'], omega3: ['omega', 'omega 3', 'omega3'],
  carbs: ['hidratos', 'carbos'], satFat: ['saturadas'], sugar: ['azucar'],
}
const termsOf = (k: NutrientKey): string[] => {
  const label = normalize(NUTRIENT_DEFS[k].label)
  const words = label.split(' ').filter(w => w.length >= 3 && w !== 'incl' && w !== 'fruta' && w !== 'leche')
  const extra = EXTRA_TERMS[k] ?? []
  const vit = NUTRIENT_DEFS[k].group === 'vitamin' && /^b\d/.test(k) ? [k, `vit ${k}`, `vitamina ${k}`] : []
  return [label, ...words, ...extra, ...vit]
}

/**
 * Nutrientes que empiezan por lo escrito: "vitamina" → todas las vitaminas, "vitamina b" → las B,
 * "hie" → hierro, "omeg" → omega-3. Sirve para ofrecer chips cuando la búsqueda aún es ambigua.
 */
export function nutrientSuggestions(q: string, limit = 14): NutrientKey[] {
  const n = normalize(q).replace(/^vit(?:amina)?\.?\s*/, 'vitamina ').trim()
  if (n.length < 2) return []
  const out: NutrientKey[] = []
  for (const k of SEARCHABLE) {
    if (termsOf(k).some(t => t.startsWith(n) || (n.length >= 4 && t.includes(n)))) out.push(k)
  }
  return out.slice(0, limit)
}

export interface RichFood { food: Food; perPortion: number; grams: number; label: string }

/** Alimentos (capa española) ordenados por cantidad del nutriente en una ración habitual */
export function foodsRichIn(key: NutrientKey, profile?: Profile | null, limit = 30): RichFood[] {
  const out: RichFood[] = []
  for (const f of catalog.curated()) {
    if (f.cat === 'especias' || f.cat === 'salsas' || f.cat === 'suplementos') continue
    if (profile && foodConflicts(f, profile).length) continue
    const p = f.portions[0]
    const grams = p?.g ?? 100
    const per100 = p?.state === 'cooked' && f.nutrientsCooked ? f.nutrientsCooked : f.nutrients
    const v = (per100[key] ?? 0) * grams / 100
    if (v <= 0) continue
    out.push({ food: f, perPortion: v, grams, label: p ? p.label : '100 g' })
  }
  out.sort((a, b) => b.perPortion - a.perPortion)
  return out.slice(0, limit)
}

/** Un alimento ya registrado hoy y cuánto aporta del nutriente */
export interface Contributor { id: string; emoji: string; name: string; meal: MealId; amount: number }

export function NutrientFoodRow({ r, nutrient, target, onClick }: { r: RichFood; nutrient: NutrientKey; target?: number; onClick: () => void }) {
  const pct = target ? Math.round(r.perPortion / target * 100) : null
  const kcal = Math.round((r.food.portions[0]?.state === 'cooked' && r.food.nutrientsCooked ? r.food.nutrientsCooked : r.food.nutrients).kcal * r.grams / 100)
  return (
    <li>
      <button onClick={onClick} className="press w-full flex items-center gap-3 px-2 py-2 rounded-2xl text-left hover:bg-surface-2">
        <span className="h-11 w-11 rounded-2xl bg-surface-2 flex items-center justify-center text-2xl shrink-0">{r.food.emoji}</span>
        <span className="flex-1 min-w-0">
          <div className="font-bold leading-tight truncate">{r.food.name}</div>
          <div className="text-xs text-ink-3 truncate">{r.label}{/\d\s?(g|ml)\)?$/.test(r.label) ? '' : ` (${Math.round(r.grams)} g)`} · 🔥{kcal}</div>
        </span>
        <span className="text-right shrink-0">
          <div className="text-sm font-extrabold tabular text-accent-ink">{fmtNutrient(nutrient, r.perPortion)}</div>
          {pct != null && <div className={cx('text-[11px] font-semibold tabular', pct >= 50 ? 'text-ok' : 'text-ink-3')}>{pct}% del día</div>}
        </span>
        <ChevronRight size={18} className="text-ink-3 shrink-0" />
      </button>
    </li>
  )
}

/** Panel "Hoy ya llevas": los alimentos registrados que aportan el nutriente, de mayor a menor */
export function ContributorList({ nutrient, contributors, total, compact, onClick }:
  { nutrient: NutrientKey; contributors: Contributor[]; total: number; compact?: boolean; onClick?: (c: Contributor) => void }) {
  const list = compact ? contributors.slice(0, 5) : contributors
  if (contributors.length === 0) return <div className="text-xs text-ink-3">Hoy no has registrado nada que lo aporte.</div>
  return (
    <ul className={cx('flex flex-col', compact ? 'gap-0.5' : 'gap-1')}>
      {list.map(c => {
        const pct = total > 0 ? Math.round(c.amount / total * 100) : 0
        const meal = MEALS.find(m => m.id === c.meal)
        const row = (
          <>
            <span className={compact ? 'text-sm' : 'text-lg'}>{c.emoji}</span>
            <span className="flex-1 min-w-0">
              <span className={cx('block truncate font-semibold', compact ? 'text-xs' : 'text-sm')}>{c.name}</span>
              {!compact && <span className="block text-[11px] text-ink-3">{meal?.emoji} {meal?.label}</span>}
            </span>
            <span className={cx('tabular text-right shrink-0', compact ? 'text-xs' : 'text-sm')}>
              <b>{fmtNutrient(nutrient, c.amount)}</b> <span className="text-ink-3 text-[11px]">{pct}%</span>
            </span>
          </>
        )
        return (
          <li key={c.id}>
            {onClick ? (
              <button onClick={() => onClick(c)} className={cx('press w-full flex items-center gap-2 rounded-xl text-left hover:bg-surface', compact ? 'px-1 py-0.5' : 'px-2 py-1.5 bg-surface-2')}>{row}</button>
            ) : (
              <div className={cx('flex items-center gap-2 rounded-xl', compact ? 'px-1 py-0.5' : 'px-2 py-1.5 bg-surface-2')}>{row}</div>
            )}
          </li>
        )
      })}
      {compact && contributors.length > 5 && <li className="text-[11px] text-ink-3 px-1">y {contributors.length - 5} más… (toca para ver todo)</li>}
    </ul>
  )
}

/**
 * Hoja de un nutriente: a la derecha (o arriba en móvil) lo que ya llevas hoy; a la izquierda
 * alimentos ricos en él para añadir. Para los límites (sodio, saturadas, azúcares) solo se
 * muestra de dónde viene y cómo bajarlo.
 */
export function NutrientFoodsSheet({ nutrient, open, onClose, profile, target, onPick, headerExtra, contributors = [], dayTotal = 0, onContributorClick }:
  { nutrient: NutrientKey | null; open: boolean; onClose: () => void; profile?: Profile | null; target?: number; onPick: (food: Food) => void; headerExtra?: React.ReactNode;
    contributors?: Contributor[]; dayTotal?: number; onContributorClick?: (c: Contributor) => void }) {
  const list = useMemo(() => (nutrient ? foodsRichIn(nutrient, profile) : []), [nutrient, profile])
  if (!nutrient) return null
  const def = NUTRIENT_DEFS[nutrient]
  const limit = !!def.isLimit
  const panel = (
    <div className="card p-3 sm:sticky sm:top-0">
      <div className="font-bold text-sm">{limit ? 'De dónde viene hoy' : 'Hoy ya llevas'}</div>
      <div className={cx('text-xs mb-2 tabular', limit && target && dayTotal > target ? 'text-danger font-semibold' : 'text-ink-3')}>
        {fmtNutrient(nutrient, dayTotal)}{target ? ` de ${fmtNutrient(nutrient, target)} (${Math.round(dayTotal / target * 100)}%)` : ''}
      </div>
      <ContributorList nutrient={nutrient} contributors={contributors} total={dayTotal} onClick={onContributorClick} />
      {onContributorClick && contributors.length > 0 && <p className="text-[11px] text-ink-3 mt-2">Toca uno para cambiar su cantidad o sustituirlo.</p>}
    </div>
  )
  return (
    <Sheet open={open} onClose={onClose} title={limit ? `${def.label}: de dónde viene` : `Ricos en ${def.label.toLowerCase()}`} wide>
      {NUTRIENT_NOTES[nutrient] && <p className="text-xs text-ink-2 p-2.5 rounded-xl bg-surface-2 mb-3">{NUTRIENT_NOTES[nutrient]}</p>}
      {limit ? panel : (
        <div className="sm:grid sm:grid-cols-[1fr_15rem] sm:gap-4">
          <div className="sm:order-2 mb-4 sm:mb-0">{panel}</div>
          <div className="sm:order-1 min-w-0">
            {headerExtra}
            <p className="text-xs text-ink-3 mb-1 px-1">Cantidad por ración habitual{target ? ` · objetivo diario ${fmtNutrient(nutrient, target)}` : ''}</p>
            <ul className="flex flex-col">
              {list.map(r => <NutrientFoodRow key={r.food.id} r={r} nutrient={nutrient} target={target} onClick={() => { onPick(r.food); haptic(6) }} />)}
            </ul>
          </div>
        </div>
      )}
    </Sheet>
  )
}
