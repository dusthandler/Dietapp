import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronRight, Globe, Plus, Search, Star, X } from 'lucide-react'
import { Button, Chip, Sheet, cx, haptic, IconButton } from '@/components/ui'
import { catalog } from '@/data/foodDb'
import { CATEGORY_LABELS, CATEGORY_TILES, type CategoryTile, type FoodCategory } from '@/data/foods.es'
import { scaleNutrients } from '@/data/nutrients'
import { MEALS, type Food, type FoodRef, type MealId, type Recipe } from '@/data/types'
import { foodConflicts, useCatalogVersion, useMealFrequent, useProfile, useRecipes, useUsage } from '@/store/hooks'
import { MACRO_EMOJI, PortionEditor } from './PortionEditor'
import { CustomFoodEditor } from './CustomFoodEditor'
import { NutrientFoodRow, foodsRichIn, nutrientFromQuery, nutrientSuggestions } from './NutrientFoods'
import { NUTRIENT_DEFS, NUTRIENT_NOTES, type NutrientKey } from '@/data/nutrients'
import { useTargets } from '@/store/hooks'

/** Mosaicos especiales que van delante de las categorías */
const SPECIAL_TILES: CategoryTile[] = [
  { id: 'recientes', label: 'Recientes', emoji: '🕒', cats: [], bg: '#EAE6FF' },
  { id: 'favoritos', label: 'Favoritos', emoji: '⭐', cats: [], bg: '#FFF4C2' },
  { id: 'recetas', label: 'Mis recetas', emoji: '🍲', cats: [], bg: '#FFE3D3' },
  { id: 'personalizados', label: 'Personalizados', emoji: '📝', cats: [], bg: '#F1E8FF' },
]

export interface FoodPickerProps {
  open: boolean
  onClose: () => void
  onPick: (ref: FoodRef, food: Food) => void
  /** Si se pasa, aparece el mosaico "Mis recetas" */
  onPickRecipe?: (recipe: Recipe) => void
  title?: string
  saveLabel?: string
  /** Mantener abierto tras añadir (para añadir varios seguidos) */
  keepOpen?: boolean
  /** Comida a la que se añade: muestra arriba los alimentos habituales en ella */
  meal?: MealId
  /** Si se pasa, al tocar un alimento se devuelve directamente (sin elegir cantidad) */
  onPickFood?: (food: Food) => void
}

export function FoodPicker({ open, onClose, onPick, onPickRecipe, title = 'Añadir alimento', saveLabel = 'Añadir', keepOpen = true, meal, onPickFood }: FoodPickerProps) {
  const [q, setQ] = useState('')
  const [nutrientPick, setNutrientPick] = useState<NutrientKey | null>(null)
  const dq = useDeferredValue(q)
  const [tile, setTile] = useState<CategoryTile | null>(null)
  const [subCat, setSubCat] = useState<FoodCategory | null>(null)
  const [includeIntl, setIncludeIntl] = useState(false)
  const [selected, setSelected] = useState<Food | null>(null)
  const [creating, setCreating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const profile = useProfile()
  const usage = useUsage()
  const recipes = useRecipes()
  const frequent = useMealFrequent(meal)
  const targets = useTargets(profile)
  useCatalogVersion()

  useEffect(() => { if (open) { setSelected(null); setQ(''); setNutrientPick(null); setCreating(false); setTile(null); setSubCat(null); setTimeout(() => inputRef.current?.focus(), 250) } }, [open])

  const usageByFood = useMemo(() => new Map((usage ?? []).map(u => [u.foodId, u])), [usage])
  const recent = useMemo(() => (usage ?? []).filter(u => u.count > 0).sort((a, b) => b.lastUsed - a.lastUsed).map(u => catalog.get(u.foodId)).filter(Boolean) as Food[], [usage])
  const favorites = useMemo(() => (usage ?? []).filter(u => u.favorite).map(u => catalog.get(u.foodId)).filter(Boolean) as Food[], [usage])
  const searching = dq.trim().length > 0
  const nutrientKey = searching ? (nutrientPick ?? nutrientFromQuery(dq)) : null
  const richList = useMemo(() => (nutrientKey ? foodsRichIn(nutrientKey, profile) : []), [nutrientKey, profile])
  const nutrientChips = useMemo(() => (searching ? nutrientSuggestions(dq).filter(k => k !== nutrientKey) : []), [searching, dq, nutrientKey])

  const results = useMemo(() => {
    if (searching) return catalog.search(dq, 60, { includeUsda: includeIntl || dq.length > 3 })
    if (!tile) return []
    if (tile.id === 'recientes') return recent.slice(0, 40)
    if (tile.id === 'favoritos') return favorites
    if (tile.id === 'personalizados') return catalog.all().filter(f => f.source === 'custom')
    const cats = subCat ? [subCat] : tile.cats
    return catalog.curated().filter(f => cats.includes(f.cat))
  }, [dq, searching, tile, subCat, recent, favorites, includeIntl])

  const intlHidden = searching && !includeIntl && dq.length <= 3
  const mealMeta = MEALS.find(m => m.id === meal)
  const quick = frequent.length ? frequent : recent.slice(0, 10)

  const handlePick = (ref: FoodRef) => {
    if (!selected) return
    onPick(ref, selected)
    haptic([10, 30, 10])
    setSelected(null)
    if (!keepOpen) onClose()
    else { setQ(''); setTimeout(() => inputRef.current?.focus(), 100) }
  }

  const tiles = [...SPECIAL_TILES.filter(t => t.id !== 'recetas' || onPickRecipe), ...CATEGORY_TILES]
  const choose = (f: Food) => {
    haptic(6)
    if (onPickFood) { onPickFood(f); if (!keepOpen) onClose(); else setQ('') }
    else setSelected(f)
  }

  return (
    <Sheet open={open} onClose={onClose} noPad wide>
      <div className="relative min-h-[70dvh] sm:min-h-[60dvh]">
        {creating ? (
          <motion.div key="create" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="px-5 pb-5">
            <div className="flex items-center gap-2 py-3">
              <IconButton label="Atrás" onClick={() => setCreating(false)}><ArrowLeft size={18} /></IconButton>
              <div className="text-lg font-bold">Crear alimento</div>
            </div>
            <CustomFoodEditor initialName={q} onDone={f => { setCreating(false); if (f) setSelected(f) }} />
          </motion.div>
        ) : selected ? (
          <motion.div key="portion" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 34 }} className="px-5 pb-5">
            <div className="flex items-center gap-2 py-3">
              <IconButton label="Atrás" onClick={() => setSelected(null)}><ArrowLeft size={18} /></IconButton>
              <div className="text-sm font-semibold text-ink-3">Elige la cantidad</div>
              <div className="flex-1" />
              <IconButton label="Cerrar" onClick={onClose}><X size={18} /></IconButton>
            </div>
            <PortionEditor food={selected} onSave={handlePick} saveLabel={saveLabel} favorite={usageByFood.get(selected.id)?.favorite ?? false}
              initial={usageByFood.get(selected.id)?.lastGrams ? { grams: usageByFood.get(selected.id)!.lastGrams, state: usageByFood.get(selected.id)!.lastState, portionLabel: usageByFood.get(selected.id)!.lastPortionLabel } : undefined} />
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 34 }}>
            <div className="sticky top-0 z-10 bg-surface px-4 pt-3 pb-2 rounded-t-3xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-lg font-bold flex-1 px-1">{title}</div>
                <IconButton label="Cerrar" onClick={onClose}><X size={18} /></IconButton>
              </div>
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" />
                <input ref={inputRef} value={q} onChange={e => { setQ(e.target.value); setNutrientPick(null) }} placeholder="Buscar: pollo, arroz, manzana… o un nutriente"
                  className="w-full h-12 pl-11 pr-10 rounded-2xl bg-surface-2 outline-none focus:ring-2 ring-accent text-[15px] font-medium" />
                {q && <button className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-line flex items-center justify-center" onClick={() => { setQ(''); setNutrientPick(null) }} aria-label="Borrar"><X size={14} /></button>}
              </div>
            </div>

            <div className="px-4 pb-6">
              {/* ── Sin búsqueda y sin categoría: habituales + mosaico ── */}
              {!searching && !tile && (
                <>
                  {quick.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-bold text-ink-3 uppercase tracking-wide mb-2">{frequent.length && mealMeta ? `Habituales en ${mealMeta.label.toLowerCase()}` : 'Recientes'}</div>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
                        {quick.map(f => {
                          const bad = foodConflicts(f, profile).length > 0
                          return (
                            <button key={f.id} onClick={() => choose(f)}
                              className={cx('press shrink-0 flex items-center gap-2 h-11 pl-2 pr-3.5 rounded-full border text-sm font-semibold', bad ? 'bg-danger-soft border-danger/30 text-danger' : 'bg-surface border-line')}>
                              <span className="text-xl">{f.emoji}</span><span className="max-w-[9rem] truncate">{f.name}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {tiles.map(t => (
                      <button key={t.id} onClick={() => { setTile(t); setSubCat(null); haptic(6) }}
                        className="press flex flex-col items-center justify-center gap-1 rounded-2xl py-3.5 px-2 font-bold text-sm shadow-card"
                        style={{ background: `color-mix(in oklab, ${t.bg} var(--tile-mix), var(--surface))`, color: 'var(--tile-ink)' }}>
                        <span className="text-3xl leading-none">{t.emoji}</span>
                        <span className="leading-tight text-center text-[13px]">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* ── Categoría seleccionada ── */}
              {!searching && tile && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <button className="press h-9 px-3 rounded-full bg-surface-2 text-sm font-bold flex items-center gap-1" onClick={() => { setTile(null); setSubCat(null) }}><ArrowLeft size={14} /> Categorías</button>
                    <div className="font-bold">{tile.emoji} {tile.label}</div>
                  </div>
                  {tile.cats.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2 mb-1">
                      <Chip active={!subCat} onClick={() => setSubCat(null)}>Todo</Chip>
                      {tile.cats.map(c => <Chip key={c} active={subCat === c} onClick={() => setSubCat(c)}>{CATEGORY_LABELS[c].emoji} {CATEGORY_LABELS[c].label}</Chip>)}
                    </div>
                  )}
                  {tile.id === 'recetas' && onPickRecipe ? (
                    <div className="flex flex-col gap-1.5">
                      {(recipes ?? []).length === 0 && <div className="text-center text-ink-3 py-8">Aún no tienes recetas. Créalas en la pestaña Recetas o con «Guardar como receta» en cualquier comida.</div>}
                      {(recipes ?? []).map(r => (
                        <button key={r.id} onClick={() => { onPickRecipe(r); haptic(8) }} className="press flex items-center gap-3 p-3 rounded-2xl bg-surface-2 text-left">
                          {r.image ? <img src={r.image} alt="" className="h-11 w-11 rounded-xl object-cover shrink-0" /> : <span className="text-3xl w-11 text-center">{r.emoji}</span>}
                          <span className="flex-1 min-w-0">
                            <div className="font-bold truncate">{r.name}</div>
                            <div className="text-xs text-ink-3">{r.ingredients.length} ingredientes</div>
                          </span>
                          <ChevronRight size={18} className="text-ink-3" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <>
                      {results.length === 0 && (
                        <div className="text-center py-10 text-ink-3">
                          <div className="text-4xl mb-2">{tile.emoji}</div>
                          {tile.id === 'favoritos' ? 'Marca alimentos con ⭐ para verlos aquí.' : tile.id === 'personalizados' ? 'Crea alimentos propios desde una búsqueda («Crear … como alimento propio»).' : tile.id === 'recientes' ? 'Aquí aparecerán los alimentos que vayas añadiendo.' : 'Nada por aquí todavía.'}
                        </div>
                      )}
                      <ul className="flex flex-col">
                        {results.map(f => <FoodRow key={f.id} food={f} conflicts={foodConflicts(f, profile)} fav={usageByFood.get(f.id)?.favorite} onClick={() => choose(f)} />)}
                      </ul>
                    </>
                  )}
                </>
              )}

              {/* ── Chips cuando lo escrito parece un nutriente ("vitamina" → todas las vitaminas) ── */}
              {searching && nutrientChips.length > 0 && (nutrientKey || dq.trim().length >= 3 || results.length === 0) && (
                <div className="mb-3">
                  <div className="text-xs font-bold text-ink-3 uppercase tracking-wide mb-1.5 px-1">{nutrientKey ? 'Otros nutrientes' : '¿Buscas alimentos ricos en…?'}</div>
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
                    {nutrientChips.map(k => (
                      <Chip key={k} onClick={() => { setNutrientPick(k); setQ(NUTRIENT_DEFS[k].label); haptic(6) }}>{NUTRIENT_DEFS[k].label}</Chip>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Búsqueda por nutriente: "vitamina c", "hierro", "yodo"… ── */}
              {searching && nutrientKey && (
                <>
                  <div className="font-bold mb-1">Alimentos ricos en {NUTRIENT_DEFS[nutrientKey].label.toLowerCase()}</div>
                  {NUTRIENT_NOTES[nutrientKey] && <p className="text-xs text-ink-2 p-2.5 rounded-xl bg-surface-2 mb-2">{NUTRIENT_NOTES[nutrientKey]}</p>}
                  <p className="text-xs text-ink-3 mb-1 px-1">Ordenados por cantidad en una ración habitual{targets?.micros[nutrientKey] ? ` · tu objetivo: ${NUTRIENT_DEFS[nutrientKey].label} ${Math.round(targets.micros[nutrientKey]!)} ${NUTRIENT_DEFS[nutrientKey].unit}` : ''}</p>
                  <ul className="flex flex-col">
                    {richList.map(r => <NutrientFoodRow key={r.food.id} r={r} nutrient={nutrientKey} target={targets?.micros[nutrientKey] ?? undefined} onClick={() => choose(r.food)} />)}
                  </ul>
                </>
              )}

              {/* ── Resultados de búsqueda ── */}
              {searching && !nutrientKey && (
                <>
                  {results.length === 0 && (
                    <div className="text-center py-10 text-ink-3"><div className="text-4xl mb-2">🔍</div>No encuentro nada con ese nombre.</div>
                  )}
                  <ul className="flex flex-col">
                    {results.map(f => <FoodRow key={f.id} food={f} conflicts={foodConflicts(f, profile)} fav={usageByFood.get(f.id)?.favorite} onClick={() => choose(f)} />)}
                  </ul>
                  {intlHidden && (
                    <button onClick={() => setIncludeIntl(true)} className="press w-full mt-2 p-3 rounded-2xl bg-surface-2 text-sm font-semibold text-ink-2 flex items-center justify-center gap-2">
                      <Globe size={16} /> Buscar también en las bases internacionales (USDA + CIQUAL, 11.000 alimentos, en inglés)
                    </button>
                  )}
                  <Button variant="soft" full className="mt-3" onClick={() => setCreating(true)}><Plus size={18} /> Crear «{q}» como alimento propio</Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </Sheet>
  )
}

export function FoodRow({ food, conflicts, fav, onClick, right }: { food: Food; conflicts: string[]; fav?: boolean; onClick: () => void; right?: React.ReactNode }) {
  const bad = conflicts.length > 0
  const per = food.portions[0]
  const n = scaleNutrients(food.nutrients, (per?.g ?? 100) / 100)
  return (
    <li>
      <button onClick={onClick} className={cx('press w-full flex items-center gap-3 px-2 py-2 rounded-2xl text-left hover:bg-surface-2', bad && 'bg-danger-soft/60 hover:bg-danger-soft')}>
        <span className={cx('h-11 w-11 rounded-2xl flex items-center justify-center text-2xl shrink-0', bad ? 'bg-danger/10' : 'bg-surface-2')}>{food.emoji}</span>
        <span className="flex-1 min-w-0">
          <div className={cx('font-bold leading-tight truncate', bad && 'text-danger')}>{food.name}{fav && <Star size={12} className="inline ml-1 fill-[var(--c-carbs)] text-[var(--c-carbs)]" />}</div>
          <div className={cx('text-xs truncate tabular', bad ? 'text-danger/80' : 'text-ink-3')}>
            {bad ? `⚠ ${conflicts.join(', ')}` : (
              <>
                <span className="text-ink-2 font-semibold">{per ? `${per.label} (${Math.round(per.g)} g)` : '100 g'}</span>
                {' · '}{MACRO_EMOJI.kcal}{Math.round(n.kcal)} {MACRO_EMOJI.protein}{Math.round(n.protein)} {MACRO_EMOJI.carbs}{Math.round(n.carbs)} {MACRO_EMOJI.fat}{Math.round(n.fat)}
                {food.source === 'usda' ? ' · USDA' : food.source === 'ciqual' ? ' · CIQUAL' : ''}
              </>
            )}
          </div>
        </span>
        {right ?? <ChevronRight size={18} className="text-ink-3 shrink-0" />}
      </button>
    </li>
  )
}
