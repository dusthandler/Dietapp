import { useEffect, useMemo, useState } from 'react'
import { Plus, RotateCcw, X } from 'lucide-react'
import { Button, Sheet, cx, haptic } from '@/components/ui'
import { amountText, catalog } from '@/data/foodDb'
import { uid } from '@/data/db'
import type { Food, FoodRef, Recipe, RecipeIngredient } from '@/data/types'
import { sumRefs, nutrientsOfRef, foodConflicts, useProfile } from '@/store/hooks'
import { FoodPicker } from '@/features/foods/FoodPicker'
import { MacroMini, PortionEditor } from '@/features/foods/PortionEditor'

/**
 * Al añadir una receta al diario, permite ajustar cada ingrediente por
 * separado (quitar las nueces, poner menos pescado, añadir brócoli…)
 * sin modificar la receta guardada.
 */
export function RecipeAddSheet({ open, recipe, onClose, onConfirm, confirmLabel = 'Añadir al diario' }:
  { open: boolean; recipe: Recipe | null; onClose: () => void; onConfirm: (ingredients: RecipeIngredient[]) => void; confirmLabel?: string }) {
  const [ings, setIngs] = useState<(RecipeIngredient & { removed?: boolean })[]>([])
  const [editing, setEditing] = useState<RecipeIngredient | null>(null)
  const [adding, setAdding] = useState(false)
  const profile = useProfile()

  useEffect(() => { if (recipe && open) setIngs(recipe.ingredients.map(i => ({ ...i }))) }, [recipe, open])

  const active = useMemo(() => ings.filter(i => !i.removed), [ings])
  const totals = useMemo(() => sumRefs(active), [active])
  const original = useMemo(() => recipe ? sumRefs(recipe.ingredients) : null, [recipe])
  const changed = recipe && JSON.stringify(active.map(i => [i.foodId, i.grams, i.state])) !== JSON.stringify(recipe.ingredients.map(i => [i.foodId, i.grams, i.state]))

  if (!recipe) return null

  return (
    <>
      <Sheet open={open} onClose={onClose} title={<span>{recipe.emoji} {recipe.name}</span>}
        footer={
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <div className="font-extrabold text-xl tabular leading-none">{Math.round(totals.kcal)} <span className="text-xs text-ink-3 font-semibold">kcal</span></div>
              <div className="text-xs text-ink-3 tabular">🥩 {Math.round(totals.protein)} · 🍞 {Math.round(totals.carbs)} · 🥑 {Math.round(totals.fat)}</div>
            </div>
            <Button size="lg" className="flex-1" disabled={active.length === 0} onClick={() => { onConfirm(active.map(({ removed: _r, ...i }) => i)); haptic([10, 30, 10]) }}>{confirmLabel}</Button>
          </div>
        }>
        <p className="text-sm text-ink-2 mb-3">Toca un ingrediente para cambiar la cantidad, o quítalo si hoy no lo has puesto. La receta guardada no cambia.</p>
        <ul className="flex flex-col gap-1.5">
          {ings.map(i => {
            const f = catalog.get(i.foodId)
            const n = nutrientsOfRef(i)
            const bad = foodConflicts(f, profile).length > 0
            return (
              <li key={i.id} className={cx('flex items-center gap-2 rounded-2xl px-2 py-1.5', i.removed ? 'opacity-40' : bad ? 'bg-danger-soft/60' : 'bg-surface-2')}>
                <button className="press flex-1 flex items-center gap-3 text-left min-w-0" disabled={i.removed} onClick={() => setEditing(i)}>
                  <span className="text-2xl w-9 text-center">{f?.emoji ?? '❓'}</span>
                  <span className="flex-1 min-w-0">
                    <div className={cx('font-semibold truncate', i.removed && 'line-through', bad && 'text-danger')}>{f?.name ?? '—'}</div>
                    <div className="text-xs text-ink-3">{amountText(f, i.grams, i.state, i.portionLabel)}</div>
                  </span>
                  <MacroMini n={n} />
                </button>
                <button className="press h-9 w-9 rounded-full bg-surface flex items-center justify-center text-ink-3" onClick={() => { setIngs(ings.map(x => x.id === i.id ? { ...x, removed: !x.removed } : x)); haptic(6) }} aria-label={i.removed ? 'Restaurar' : 'Quitar'}>
                  {i.removed ? <RotateCcw size={16} /> : <X size={16} />}
                </button>
              </li>
            )
          })}
        </ul>
        <Button variant="soft" full className="mt-3" onClick={() => setAdding(true)}><Plus size={18} /> Añadir ingrediente extra</Button>
        {changed && original && (
          <div className="text-xs text-ink-3 mt-3 text-center">Receta original: {Math.round(original.kcal)} kcal · ahora {Math.round(totals.kcal)} kcal</div>
        )}
      </Sheet>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Cantidad">
        {editing && catalog.get(editing.foodId) && (
          <PortionEditor food={catalog.get(editing.foodId)!} initial={editing} saveLabel="Guardar"
            onSave={ref => { setIngs(ings.map(x => x.id === editing.id ? { ...x, ...ref } : x)); setEditing(null) }} />
        )}
      </Sheet>

      <FoodPicker open={adding} onClose={() => setAdding(false)} title="Ingrediente extra" keepOpen={false}
        onPick={(ref: FoodRef, _food: Food) => { setIngs([...ings, { id: uid(), ...ref }]); setAdding(false) }} />
    </>
  )
}
