import { useMemo, useState } from 'react'
import { AlertTriangle, Star, Trash2 } from 'lucide-react'
import { Button, Stepper, cx, haptic } from '@/components/ui'
import { hasVariants, nutrientsFor } from '@/data/foodDb'
import { fmtNutrient, scaleNutrients, type Nutrients } from '@/data/nutrients'
import type { Food, FoodRef, PortionState } from '@/data/types'
import { ALLERGEN_LABELS, type Allergen } from '@/data/foods.es'
import { foodConflicts, useProfile } from '@/store/hooks'
import { toggleFavorite } from '@/store/repo'

export const MACRO_EMOJI = { kcal: '🔥', protein: '🥩', carbs: '🍞', fat: '🥑' } as const

interface Chip { label: string; state?: PortionState; g: number; raw?: number; cooked?: number }

/** Lista unificada de medidas: cada una con su peso en crudo y cocinado (vía rendimiento) */
function buildChips(food: Food): Chip[] {
  const y = food.yield ?? 1
  if (!hasVariants(food)) return food.portions.map(p => ({ label: p.label, g: p.g }))
  return food.portions.map(p => {
    const st = p.state ?? 'raw'
    return st === 'raw'
      ? { label: p.label, state: 'raw' as const, g: p.g, raw: p.g, cooked: p.g * y }
      : { label: p.label, state: 'cooked' as const, g: p.g, raw: p.g / y, cooked: p.g }
  })
}

const roundG = (g: number) => (g >= 100 ? Math.round(g) : Math.round(g * 10) / 10)

export function PortionEditor({ food, initial, onSave, onDelete, saveLabel = 'Añadir', favorite, compact }:
  { food: Food; initial?: Partial<FoodRef>; onSave: (ref: FoodRef) => void; onDelete?: () => void; saveLabel?: string; favorite?: boolean; compact?: boolean }) {
  const profile = useProfile()
  const variants = hasVariants(food)
  const y = food.yield ?? 1
  const chips = useMemo(() => buildChips(food), [food])
  const first = chips[0]
  const [state, setState] = useState<PortionState | undefined>(() => variants ? (initial?.state ?? first?.state ?? 'raw') : undefined)
  const [grams, setGrams] = useState<number>(() => initial?.grams ?? first?.g ?? 100)
  const [label, setLabel] = useState<string | undefined>(() => initial?.portionLabel ?? (initial?.grams ? undefined : first?.label))

  const n: Nutrients = useMemo(() => scaleNutrients(nutrientsFor(food, state), grams / 100), [food, state, grams])
  const conflicts = foodConflicts(food, profile)

  // Pesos equivalentes: el estado activo es la fuente de verdad y el otro se deriva del rendimiento
  const rawG = variants ? (state === 'cooked' ? grams / y : grams) : grams
  const cookedG = variants ? (state === 'cooked' ? grams : grams * y) : grams

  const pick = (c: Chip) => { setGrams(c.g); setLabel(c.label); if (variants && c.state) setState(c.state); haptic(8) }
  const stepFor = (g: number) => (g >= 300 ? 25 : g >= 100 ? 10 : g >= 20 ? 5 : 1)

  return (
    <div className="flex flex-col gap-4">
      {!compact && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[10rem]">
            <div className="text-5xl leading-none">{food.emoji}</div>
            <div className="min-w-0">
              <div className="text-xl font-extrabold leading-tight">{food.name}</div>
              {(food.source === 'usda' || food.source === 'ciqual') && <div className="text-xs text-ink-3">Base {food.source === 'usda' ? 'USDA' : 'CIQUAL'}{food.aliases[0] ? ` · ${food.aliases[0]}` : ''}</div>}
              {food.source === 'curated' && food.nameEn && <div className="text-xs text-ink-3 truncate">Fuente: {food.nameEn}</div>}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <MacroTiles n={n} />
            {favorite !== undefined && (
              <button className="press h-10 w-10 ml-1 rounded-full bg-surface-2 flex items-center justify-center shrink-0" onClick={() => { toggleFavorite(food.id); haptic(10) }} aria-label="Favorito">
                <Star size={20} className={favorite ? 'fill-[var(--c-carbs)] text-[var(--c-carbs)]' : 'text-ink-3'} />
              </button>
            )}
          </div>
        </div>
      )}
      {compact && <MacroTiles n={n} />}

      {conflicts.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-danger-soft text-danger text-sm font-semibold">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>Contiene {conflicts.map(c => (ALLERGEN_LABELS[c as Allergen]?.label ?? c).toLowerCase()).join(', ')} — coincide con tus intolerancias.</div>
        </div>
      )}

      {chips.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {chips.map(c => {
            const on = label === c.label && Math.abs(grams - c.g) < 0.01 && (!variants || c.state === state)
            return (
              <button key={c.label + c.g} onClick={() => pick(c)}
                className={cx('press text-left px-3 py-2 rounded-2xl border transition-colors', on ? 'bg-accent text-white border-accent shadow-[0_6px_16px_-8px_var(--accent)]' : 'bg-surface border-line hover:bg-surface-2')}>
                <div className="font-bold text-[15px] leading-tight">{c.label}</div>
                {variants ? (
                  <div className={cx('text-xs mt-0.5 tabular', on ? 'text-white/85' : 'text-ink-3')}>
                    🥩 crudo <b>{roundG(c.raw!)} g</b> <span className="opacity-60">/</span> 🍳 cocinado <b>{roundG(c.cooked!)} g</b>
                  </div>
                ) : (
                  <div className={cx('text-xs', on ? 'text-white/80' : 'text-ink-3')}>{roundG(c.g)} g</div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {variants ? (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className={cx('text-xs font-bold mb-1.5 px-1', state === 'raw' ? 'text-ink' : 'text-ink-3')}>🥩 pesado en crudo</div>
            <Stepper value={roundG(rawG)} onChange={v => { setState('raw'); setGrams(v); setLabel(undefined) }} step={stepFor(rawG)} unit="g" big />
          </div>
          <div>
            <div className={cx('text-xs font-bold mb-1.5 px-1', state === 'cooked' ? 'text-ink' : 'text-ink-3')}>🍳 pesado cocinado</div>
            <Stepper value={roundG(cookedG)} onChange={v => { setState('cooked'); setGrams(v); setLabel(undefined) }} step={stepFor(cookedG)} unit="g" big />
          </div>
        </div>
      ) : (
        <div>
          <div className="text-xs font-bold text-ink-3 uppercase tracking-wide mb-1.5 px-1">Gramos exactos</div>
          <Stepper value={grams} onChange={v => { setGrams(v); setLabel(undefined) }} step={stepFor(grams)} unit="g" big />
        </div>
      )}

      <div className="flex gap-2">
        {onDelete && (
          <Button variant="danger" size="xl" onClick={onDelete} aria-label="Eliminar"><Trash2 size={20} /></Button>
        )}
        <Button size="xl" full onClick={() => onSave({ foodId: food.id, grams: roundG(grams), state, portionLabel: label })}>
          {saveLabel} · {Math.round(n.kcal)} kcal
        </Button>
      </div>
    </div>
  )
}

/** Macros compactas para filas de lista, en una linea: 🥩26 🍞3 🥑1  🔥123 */
export function MacroMini({ n }: { n: Nutrients }) {
  return (
    <span className="shrink-0 flex items-baseline gap-2 whitespace-nowrap tabular">
      <span className="text-[11px] text-ink-3">{MACRO_EMOJI.protein}{Math.round(n.protein)} {MACRO_EMOJI.carbs}{Math.round(n.carbs)} {MACRO_EMOJI.fat}{Math.round(n.fat)}</span>
      <span className="text-sm font-bold text-ink-2">{MACRO_EMOJI.kcal}{Math.round(n.kcal)}</span>
    </span>
  )
}

export function MacroTiles({ n, small }: { n: Nutrients; small?: boolean }) {
  const tiles = [
    { emoji: MACRO_EMOJI.kcal, value: String(Math.round(n.kcal)), unit: '', label: 'kcal', color: 'var(--c-kcal)' },
    { emoji: MACRO_EMOJI.protein, value: fmtNutrient('protein', n.protein, false), unit: 'g', label: 'Proteína', color: 'var(--c-protein)' },
    { emoji: MACRO_EMOJI.carbs, value: fmtNutrient('carbs', n.carbs, false), unit: 'g', label: 'Carbos', color: 'var(--c-carbs)' },
    { emoji: MACRO_EMOJI.fat, value: fmtNutrient('fat', n.fat, false), unit: 'g', label: 'Grasa', color: 'var(--c-fat)' },
  ]
  return (
    <div className="flex gap-1.5">
      {tiles.map(t => (
        <div key={t.label} className={cx('rounded-xl bg-surface-2 text-center', small ? 'px-2 py-1 min-w-[3.4rem]' : 'px-2.5 py-1.5 min-w-[4rem]')}>
          <div className={cx('leading-none', small ? 'text-sm' : 'text-lg')}>{t.emoji}</div>
          <div className={cx('font-extrabold tabular leading-tight', small ? 'text-sm' : 'text-lg')} style={{ color: t.color }}>{t.value}<span className="text-[10px] text-ink-3 font-semibold ml-0.5">{t.unit}</span></div>
          <div className="text-[10px] font-semibold text-ink-3 leading-tight">{t.label}</div>
        </div>
      ))}
    </div>
  )
}
