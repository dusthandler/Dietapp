import { useDeferredValue, useMemo, useState } from 'react'
import { ChevronRight, Globe, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { Button, Chip, Sheet, cx, useToast } from '@/components/ui'
import { catalog } from '@/data/foodDb'
import { CATEGORY_LABELS, type FoodCategory } from '@/data/foods.es'
import type { CustomFood, Food } from '@/data/types'
import { useCatalogVersion, useCustomFoods } from '@/store/hooks'
import { MACRO_EMOJI } from './PortionEditor'
import { CustomFoodEditor } from './CustomFoodEditor'

type Tab = 'mine' | 'all'

/** Fila de alimento con macros por 100 g y etiqueta de origen (propio / ajustado / base) */
function Row({ food, custom, onClick }: { food: Food; custom?: CustomFood; onClick: () => void }) {
  const n = food.nutrients
  const tag = food.source === 'custom' ? { text: 'Propio', cls: 'bg-accent-soft text-accent-ink' }
    : food.overridden ? { text: 'Ajustado', cls: 'bg-warn-soft text-warn' }
      : null
  return (
    <li>
      <button onClick={onClick} className="press w-full flex items-center gap-3 px-2 py-2 rounded-2xl text-left hover:bg-surface-2">
        <span className="h-11 w-11 rounded-2xl bg-surface-2 flex items-center justify-center text-2xl shrink-0">{food.emoji}</span>
        <span className="flex-1 min-w-0">
          <div className="font-bold leading-tight truncate flex items-center gap-1.5">
            <span className="truncate">{food.name}</span>
            {tag && <span className={cx('shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md', tag.cls)}>{tag.text}</span>}
          </div>
          <div className="text-xs text-ink-3 truncate tabular">
            {CATEGORY_LABELS[food.cat]?.label}{food.source === 'usda' ? ' · USDA' : food.source === 'ciqual' ? ' · CIQUAL' : ''}
            {' · '}{MACRO_EMOJI.kcal}{Math.round(n.kcal)} {MACRO_EMOJI.protein}{Math.round(n.protein)} {MACRO_EMOJI.carbs}{Math.round(n.carbs)} {MACRO_EMOJI.fat}{Math.round(n.fat)}
            {custom?.overrideOf && custom.name !== catalog.original(custom.overrideOf)?.name ? ` · antes: ${catalog.original(custom.overrideOf)?.name}` : ''}
          </div>
        </span>
        <ChevronRight size={18} className="text-ink-3 shrink-0" />
      </button>
    </li>
  )
}

/**
 * Sección "Alimentos": buscar en todo el catálogo, crear alimentos propios y ajustar los
 * existentes a la marca que compra cada usuario (los valores ajustados sustituyen a los del catálogo).
 */
export default function FoodsPage() {
  const [q, setQ] = useState('')
  const dq = useDeferredValue(q)
  const [tab, setTab] = useState<Tab>('mine')
  const [cat, setCat] = useState<FoodCategory | null>(null)
  const [includeIntl, setIncludeIntl] = useState(false)
  const [editing, setEditing] = useState<{ base?: Food; custom?: CustomFood } | null>(null)
  const [creating, setCreating] = useState(false)
  const customs = useCustomFoods()
  const version = useCatalogVersion()
  const toast = useToast()

  const byOverride = useMemo(() => new Map((customs ?? []).filter(c => c.overrideOf).map(c => [c.overrideOf!, c])), [customs])
  const byCustomId = useMemo(() => new Map((customs ?? []).map(c => [`custom:${c.id}`, c])), [customs])
  const mine = useMemo(() => (customs ?? [])
    .map(c => ({ c, food: catalog.get(c.overrideOf ?? `custom:${c.id}`) }))
    .filter((x): x is { c: CustomFood; food: Food } => !!x.food)
    .sort((a, b) => b.c.updatedAt - a.c.updatedAt), [customs, version]) // eslint-disable-line react-hooks/exhaustive-deps
  const searching = dq.trim().length > 0
  const results = useMemo(() => {
    if (searching) return catalog.search(dq, 80, { includeUsda: includeIntl || dq.length > 3 })
    if (tab === 'all') return catalog.curated().filter(f => f.source !== 'custom' && (!cat || f.cat === cat))
    return []
  }, [dq, searching, tab, cat, includeIntl, version]) // eslint-disable-line react-hooks/exhaustive-deps
  const intlHidden = searching && !includeIntl && dq.length <= 3

  const open = (food: Food) => {
    if (food.source === 'custom') setEditing({ custom: byCustomId.get(food.id) })
    else setEditing({ base: food, custom: byOverride.get(food.id) })
  }
  const counts = catalog.counts()

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight">Alimentos</h1>
          <p className="text-sm text-ink-2 mt-1">
            {counts.curated} alimentos españoles con medidas caseras y {(counts.usda + counts.ciqual).toLocaleString('es')} internacionales. Crea los tuyos o <b>ajusta cualquiera a la marca que compras</b>: los valores nuevos se usan en todo.
          </p>
        </div>
        <Button size="md" className="shrink-0" onClick={() => setCreating(true)}><Plus size={18} /> Nuevo</Button>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar un alimento para verlo o ajustarlo…"
          className="w-full h-12 pl-11 pr-10 rounded-2xl bg-surface shadow-card outline-none focus:ring-2 ring-accent text-[15px] font-medium" />
        {q && <button className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-line flex items-center justify-center" onClick={() => setQ('')} aria-label="Borrar"><X size={14} /></button>}
      </div>

      {!searching && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
          <Chip active={tab === 'mine'} onClick={() => setTab('mine')}><SlidersHorizontal size={14} /> Míos {mine.length ? `(${mine.length})` : ''}</Chip>
          <Chip active={tab === 'all'} onClick={() => setTab('all')}>Catálogo</Chip>
          {tab === 'all' && (Object.keys(CATEGORY_LABELS) as FoodCategory[]).map(c => (
            <Chip key={c} tone="neutral" active={cat === c} onClick={() => setCat(cat === c ? null : c)}>{CATEGORY_LABELS[c].emoji} {CATEGORY_LABELS[c].label}</Chip>
          ))}
        </div>
      )}

      <div className="card p-2">
        {searching ? (
          <>
            {results.length === 0 && <div className="text-center py-10 text-ink-3"><div className="text-4xl mb-2">🔍</div>No encuentro nada con ese nombre.</div>}
            <ul className="flex flex-col">{results.map(f => <Row key={f.id} food={f} custom={byOverride.get(f.id) ?? byCustomId.get(f.id)} onClick={() => open(f)} />)}</ul>
            {intlHidden && (
              <button onClick={() => setIncludeIntl(true)} className="press w-full mt-2 p-3 rounded-2xl bg-surface-2 text-sm font-semibold text-ink-2 flex items-center justify-center gap-2">
                <Globe size={16} /> Buscar también en las bases internacionales (en inglés)
              </button>
            )}
            <Button variant="soft" full className="mt-2" onClick={() => setCreating(true)}><Plus size={18} /> Crear «{q}» como alimento propio</Button>
          </>
        ) : tab === 'mine' ? (
          mine.length === 0 ? (
            <div className="text-center py-10 text-ink-3 px-4">
              <div className="text-4xl mb-2">🏷️</div>
              <div className="font-semibold text-ink-2 mb-1">Aún no tienes alimentos propios ni ajustados</div>
              <div className="text-sm">Busca arriba un alimento y toca «Ajustar a mi marca», o crea uno nuevo con los valores de la etiqueta.</div>
            </div>
          ) : (
            <ul className="flex flex-col">{mine.map(x => <Row key={x.c.id} food={x.food} custom={x.c} onClick={() => open(x.food)} />)}</ul>
          )
        ) : (
          <ul className="flex flex-col">{results.map(f => <Row key={f.id} food={f} custom={byOverride.get(f.id)} onClick={() => open(f)} />)}</ul>
        )}
      </div>

      <Sheet open={creating} onClose={() => setCreating(false)} title="Nuevo alimento">
        {creating && <CustomFoodEditor initialName={q} onDone={f => { setCreating(false); if (f) { toast(`${f.emoji} ${f.name} guardado`, { tone: 'ok' }); setQ('') } }} />}
      </Sheet>
      <Sheet open={!!editing} onClose={() => setEditing(null)} title={editing?.base ? (editing.custom ? 'Mi ajuste' : 'Ajustar a mi marca') : 'Editar alimento'}>
        {editing && (
          <CustomFoodEditor key={editing.custom?.id ?? editing.base?.id} base={editing.base} custom={editing.custom}
            onDone={f => { setEditing(null); toast(f ? `${f.emoji} ${f.name} guardado` : 'Hecho', { tone: 'ok' }) }} />
        )}
      </Sheet>
    </div>
  )
}
