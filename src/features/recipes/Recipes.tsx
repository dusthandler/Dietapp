import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, Plus, Search, Trash2, X } from 'lucide-react'
import { Button, Empty, Sheet, cx, haptic, useConfirm, useToast } from '@/components/ui'
import { amountText, catalog } from '@/data/foodDb'
import { uid } from '@/data/db'
import { MEALS, mealForHour, type Food, type FoodRef, type MealId, type Recipe, type RecipeIngredient } from '@/data/types'
import { dateKey, hourNow } from '@/lib/dates'
import { optimizeImage } from '@/lib/image'
import { addRecipeToDiary, deleteRecipe, saveRecipe } from '@/store/repo'
import { foodConflicts, nutrientsOfRef, sumRefs, useProfile, useRecipes } from '@/store/hooks'
import { FoodPicker } from '@/features/foods/FoodPicker'
import { MacroMini, PortionEditor } from '@/features/foods/PortionEditor'
import { RecipeAddSheet } from './RecipeAddSheet'

const EMOJIS = ['🍲', '🥗', '🍝', '🍛', '🥘', '🍳', '🥪', '🌯', '🍚', '🐟', '🍗', '🥩', '🥣', '🍕', '🥙', '🍜', '🥞', '🧆', '🍱', '🥑']

export default function Recipes() {
  const recipes = useRecipes()
  const profile = useProfile()
  const toast = useToast()
  const { confirm, el: confirmEl } = useConfirm()
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Recipe | 'new' | null>(null)
  const [adding, setAdding] = useState<Recipe | null>(null)
  const [meal, setMeal] = useState<MealId>(mealForHour(hourNow()))

  const list = useMemo(() => (recipes ?? []).filter(r => !q || r.name.toLowerCase().includes(q.toLowerCase())), [recipes, q])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight">Mis recetas</h1>
          <p className="text-sm text-ink-2">Tus platos de siempre, listos en un toque.</p>
        </div>
        <Button onClick={() => setEditing('new')}><Plus size={18} /> Nueva</Button>
      </div>

      {(recipes?.length ?? 0) > 4 && (
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar receta" className="w-full h-11 pl-11 pr-4 rounded-2xl bg-surface shadow-card outline-none focus:ring-2 ring-accent" />
        </div>
      )}

      {recipes && recipes.length === 0 && (
        <Empty emoji="🍲" title="Aún no tienes recetas" desc="Guarda los platos que repites (tu cena de siempre, tu desayuno…) y añádelos al diario en un toque. Luego podrás ajustar cada ingrediente."
          action={<Button onClick={() => setEditing('new')}><Plus size={18} /> Crear mi primera receta</Button>} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {list.map(r => {
          const n = sumRefs(r.ingredients)
          const bad = r.ingredients.some(i => foodConflicts(catalog.get(i.foodId), profile).length > 0)
          return (
            <motion.div layout key={r.id} className={cx('card p-4 flex flex-col gap-2', bad && 'ring-2 ring-danger/40')}>
              <button className="press flex items-center gap-3 text-left" onClick={() => setEditing(r)}>
                {r.image ? <img src={r.image} alt="" className="h-14 w-14 rounded-2xl object-cover shrink-0" /> : <span className="text-4xl">{r.emoji}</span>}
                <span className="flex-1 min-w-0">
                  <div className="font-bold text-lg leading-tight truncate">{r.name}</div>
                  <div className="text-xs text-ink-3 truncate">{r.ingredients.map(i => catalog.get(i.foodId)?.name).filter(Boolean).join(', ')}</div>
                </span>
              </button>
              <div className="flex items-center gap-2 text-xs font-semibold text-ink-2 tabular">
                <span className="text-ink font-extrabold text-base">{Math.round(n.kcal)} kcal</span>
                <span className="text-[var(--c-protein)]">🥩 {Math.round(n.protein)} g</span>
                <span className="text-[var(--c-carbs)]">🍞 {Math.round(n.carbs)} g</span>
                <span className="text-[var(--c-fat)]">🥑 {Math.round(n.fat)} g</span>
                {bad && <span className="text-danger">⚠ intolerancia</span>}
              </div>
              <div className="flex gap-2 mt-1">
                <select value={meal} onChange={e => setMeal(e.target.value as MealId)} className="h-10 px-2 rounded-xl bg-surface-2 text-sm font-semibold outline-none">
                  {MEALS.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.label}</option>)}
                </select>
                <Button size="sm" className="flex-1 h-10" onClick={() => setAdding(r)}><Plus size={16} /> Añadir a hoy</Button>
              </div>
            </motion.div>
          )
        })}
      </div>

      <RecipeEditor open={!!editing} recipe={editing === 'new' ? null : editing} onClose={() => setEditing(null)}
        onSaved={r => { setEditing(null); toast(`${r.emoji} ${r.name} guardada`, { tone: 'ok' }) }}
        onDelete={async r => { if (await confirm('Eliminar receta', `¿Seguro que quieres borrar «${r.name}»?`)) { await deleteRecipe(r.id); setEditing(null); toast('Receta eliminada') } }} />

      <RecipeAddSheet open={!!adding} recipe={adding} onClose={() => setAdding(null)}
        onConfirm={async ings => { if (!adding) return; await addRecipeToDiary(dateKey(), meal, adding, ings); toast(`${adding.emoji} añadida a ${MEALS.find(m => m.id === meal)?.label}`, { tone: 'ok' }); setAdding(null) }} />
      {confirmEl}
    </div>
  )
}

export function RecipeEditor({ open, recipe, initial, onClose, onSaved, onDelete }:
  { open: boolean; recipe: Recipe | null; initial?: { name?: string; emoji?: string; ingredients: RecipeIngredient[] } | null; onClose: () => void; onSaved: (r: Recipe) => void; onDelete?: (r: Recipe) => void }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🍲')
  const [image, setImage] = useState<string | null>(null)
  const [ings, setIngs] = useState<RecipeIngredient[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const [picking, setPicking] = useState(false)
  const [editing, setEditing] = useState<RecipeIngredient | null>(null)
  const [key, setKey] = useState('')
  const profile = useProfile()

  // Reinicia el formulario al abrir
  const k = `${open}-${recipe?.id ?? 'new'}`
  if (k !== key) {
    setKey(k)
    setName(recipe?.name ?? initial?.name ?? '')
    setEmoji(recipe?.emoji ?? initial?.emoji ?? '🍲')
    setImage(recipe?.image ?? null)
    setIngs((recipe?.ingredients ?? initial?.ingredients ?? []).map(i => ({ ...i, id: i.id || uid() })))
  }

  const totals = sumRefs(ings)
  const save = async () => {
    if (!name.trim() || ings.length === 0) return
    const r = await saveRecipe({ ...(recipe ?? {}), name: name.trim(), emoji, image, ingredients: ings })
    haptic([10, 30, 10])
    onSaved(r)
  }

  return (
    <>
      <Sheet open={open} onClose={onClose} title={recipe ? 'Editar receta' : 'Nueva receta'}
        footer={
          <div className="flex items-center gap-2">
            {recipe && onDelete && <Button variant="danger" size="lg" onClick={() => onDelete(recipe)} aria-label="Eliminar"><Trash2 size={18} /></Button>}
            <Button size="lg" className="flex-1" disabled={!name.trim() || ings.length === 0} onClick={save}>Guardar · {Math.round(totals.kcal)} kcal</Button>
          </div>
        }>
        <div className="flex gap-2 mb-3">
          <div className="relative">
            <select value={emoji} onChange={e => setEmoji(e.target.value)} className="h-12 w-16 rounded-2xl bg-surface-2 text-2xl text-center appearance-none outline-none">
              {[...new Set([emoji, ...EMOJIS])].map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre: Cena de merluza con patatas" className="flex-1 h-12 px-4 rounded-2xl bg-surface-2 outline-none focus:ring-2 ring-accent font-semibold" />
        </div>
        {/* Foto (miniatura optimizada, ~15 KB) */}
        <div className="flex items-center gap-3 mb-3">
          {image ? (
            <div className="relative">
              <img src={image} alt="" className="h-20 w-20 rounded-2xl object-cover" />
              <button className="press absolute -top-2 -right-2 h-7 w-7 rounded-full bg-ink text-paper flex items-center justify-center shadow-card" onClick={() => setImage(null)} aria-label="Quitar foto"><X size={14} /></button>
            </div>
          ) : (
            <button className="press h-20 w-20 rounded-2xl bg-surface-2 border border-dashed border-line flex flex-col items-center justify-center gap-1 text-ink-3" onClick={() => fileRef.current?.click()}>
              <Camera size={20} /><span className="text-[10px] font-semibold">Foto</span>
            </button>
          )}
          <div className="text-xs text-ink-3">{image ? `Foto guardada (${Math.round(image.length * 0.75 / 1024)} KB)` : 'Opcional. Se guarda en miniatura para que ocupe muy poco.'}</div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) setImage(await optimizeImage(f)); e.target.value = '' }} />
        </div>
        <div className="text-xs font-bold text-ink-3 uppercase tracking-wide mb-2">Ingredientes</div>
        <ul className="flex flex-col gap-1.5">
          {ings.map(i => {
            const f = catalog.get(i.foodId)
            const n = nutrientsOfRef(i)
            const bad = foodConflicts(f, profile).length > 0
            return (
              <li key={i.id} className={cx('flex items-center gap-2 rounded-2xl px-2 py-1.5', bad ? 'bg-danger-soft/60' : 'bg-surface-2')}>
                <button className="press flex-1 flex items-center gap-3 text-left min-w-0" onClick={() => setEditing(i)}>
                  <span className="text-2xl w-9 text-center">{f?.emoji}</span>
                  <span className="flex-1 min-w-0">
                    <div className={cx('font-semibold truncate', bad && 'text-danger')}>{f?.name}</div>
                    <div className="text-xs text-ink-3">{amountText(f, i.grams, i.state, i.portionLabel)}</div>
                  </span>
                  <MacroMini n={n} />
                </button>
                <button className="press h-9 w-9 rounded-full bg-surface flex items-center justify-center text-ink-3 hover:text-danger" onClick={() => setIngs(ings.filter(x => x.id !== i.id))} aria-label="Quitar"><Trash2 size={16} /></button>
              </li>
            )
          })}
        </ul>
        <Button variant="soft" full className="mt-3" onClick={() => setPicking(true)}><Plus size={18} /> Añadir ingrediente</Button>
        {ings.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-4 p-3 rounded-2xl bg-surface-2 text-center">
            <div><div className="font-extrabold text-lg tabular">{Math.round(totals.kcal)}</div><div className="text-[11px] text-ink-3 font-semibold">🔥 kcal</div></div>
            <div><div className="font-extrabold text-lg tabular text-[var(--c-protein)]">{Math.round(totals.protein)}</div><div className="text-[11px] text-ink-3 font-semibold">🥩 prot</div></div>
            <div><div className="font-extrabold text-lg tabular text-[var(--c-carbs)]">{Math.round(totals.carbs)}</div><div className="text-[11px] text-ink-3 font-semibold">🍞 carbs</div></div>
            <div><div className="font-extrabold text-lg tabular text-[var(--c-fat)]">{Math.round(totals.fat)}</div><div className="text-[11px] text-ink-3 font-semibold">🥑 grasa</div></div>
          </div>
        )}
      </Sheet>

      <FoodPicker open={picking} onClose={() => setPicking(false)} title="Añadir ingrediente" keepOpen
        onPick={(ref: FoodRef, _f: Food) => setIngs(list => [...list, { id: uid(), ...ref }])} />

      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Cantidad">
        {editing && catalog.get(editing.foodId) && (
          <PortionEditor food={catalog.get(editing.foodId)!} initial={editing} saveLabel="Guardar"
            onSave={ref => { setIngs(ings.map(x => x.id === editing.id ? { ...x, ...ref } : x)); setEditing(null) }} />
        )}
      </Sheet>
    </>
  )
}
