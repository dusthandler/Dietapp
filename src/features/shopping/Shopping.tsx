import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Share2 } from 'lucide-react'
import { Button, Empty, cx, haptic, useToast } from '@/components/ui'
import { catalog, rawGrams } from '@/data/foodDb'
import { CATEGORY_LABELS, type FoodCategory } from '@/data/foods.es'
import type { Food, Plan } from '@/data/types'
import { usePlans } from '@/store/hooks'

type Period = 'week' | 'month'

interface Line { food: Food; grams: number; units?: number; unitLabel?: string }

function buildList(plan: Plan, period: Period): Map<FoodCategory, Line[]> {
  const grams = new Map<string, number>()
  for (const d of plan.days) for (const m of d.meals) for (const it of m.items) {
    const f = catalog.get(it.foodId)
    if (!f) continue
    grams.set(f.id, (grams.get(f.id) ?? 0) + rawGrams(f, it.grams, it.state))
  }
  const factor = period === 'month' ? 30 / 7 : 1
  const groups = new Map<FoodCategory, Line[]>()
  for (const [id, g] of grams) {
    const f = catalog.get(id)!
    if (f.cat === 'especias' && g * factor < 30) continue // sal, especias… no hace falta comprarlas cada semana
    const total = g * factor
    const line: Line = { food: f, grams: total }
    if (f.unit) { line.units = Math.max(1, Math.ceil(total / f.unit.g - 0.15)); line.unitLabel = line.units === 1 ? f.unit.one : f.unit.many }
    const arr = groups.get(f.cat) ?? []
    arr.push(line)
    groups.set(f.cat, arr)
  }
  for (const arr of groups.values()) arr.sort((a, b) => b.grams - a.grams)
  return groups
}

function fmtWeight(l: Line): string {
  const g = l.grams
  const w = g >= 1000 ? `${(g / 1000).toFixed(g >= 10000 ? 0 : 1).replace('.', ',')} kg` : `${Math.round(g / 5) * 5 || Math.round(g)} g`
  const isLiquid = l.food.cat === 'bebidas' || /leche|bebida|nata|zumo|caldo/i.test(l.food.name)
  return isLiquid ? (g >= 1000 ? `${(g / 1000).toFixed(1).replace('.', ',')} L` : `${Math.round(g / 10) * 10} ml`) : w
}

function fmtQty(l: Line): string {
  const v = fmtWeight(l)
  return l.units ? `${l.units} ${l.unitLabel}` : v
}

export default function Shopping() {
  const plans = usePlans()
  const toast = useToast()
  const [period, setPeriod] = useState<Period>('week')
  const [planId, setPlanId] = useState<string | null>(null)
  const [checked, setChecked] = useState<Set<string>>(() => { try { return new Set(JSON.parse(localStorage.getItem('dietapp.shopping.checked') ?? '[]')) } catch { return new Set() } })

  useEffect(() => { try { localStorage.setItem('dietapp.shopping.checked', JSON.stringify([...checked])) } catch { /* noop */ } }, [checked])

  const plan = useMemo(() => plans?.find(p => p.id === planId) ?? plans?.find(p => p.isActive) ?? plans?.[0] ?? null, [plans, planId])
  const groups = useMemo(() => (plan ? buildList(plan, period) : new Map<FoodCategory, Line[]>()), [plan, period])
  const totalLines = [...groups.values()].reduce((s, a) => s + a.length, 0)
  const doneLines = [...groups.values()].flat().filter(l => checked.has(l.food.id)).length

  const toggle = (id: string) => { setChecked(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n }); haptic(6) }

  const share = async () => {
    if (!plan) return
    const lines: string[] = [`🛒 Lista de la compra — ${plan.name} (${period === 'week' ? 'semana' : 'mes'})`, '']
    for (const [cat, arr] of groups) {
      lines.push(`${CATEGORY_LABELS[cat].emoji} ${CATEGORY_LABELS[cat].label}`)
      for (const l of arr) lines.push(`  • ${l.food.name}: ${fmtQty(l)}${l.units ? ` (≈ ${fmtWeight(l)})` : ''}`)
      lines.push('')
    }
    const text = lines.join('\n')
    try {
      if (navigator.share) await navigator.share({ title: 'Lista de la compra', text })
      else { await navigator.clipboard.writeText(text); toast('Lista copiada al portapapeles', { tone: 'ok' }) }
    } catch { /* cancelado */ }
  }

  if (!plans) return null

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Lista de la compra</h1>
        <p className="text-sm text-ink-2">Calculada en crudo a partir de tu dieta.</p>
      </div>

      {plans.length === 0 ? (
        <Empty emoji="🛒" title="Sin dieta, sin lista" desc="Crea una dieta en la pestaña Dietas y aquí verás cuánto comprar de cada cosa por semana o por mes." />
      ) : (
        <>
          <div className="flex gap-2 items-center">
            <select value={plan?.id ?? ''} onChange={e => setPlanId(e.target.value)} className="flex-1 h-11 px-3 rounded-2xl bg-surface shadow-card font-semibold outline-none min-w-0">
              {plans.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.name}{p.isActive ? ' (activa)' : ''}</option>)}
            </select>
            <div className="flex p-1 rounded-2xl bg-surface-2 shrink-0">
              {(['week', 'month'] as Period[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)} className={cx('press h-9 px-3 rounded-xl text-sm font-bold', period === p ? 'bg-surface shadow-card' : 'text-ink-3')}>{p === 'week' ? 'Semana' : 'Mes'}</button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden"><motion.div className="h-full bg-ok" animate={{ width: `${totalLines ? doneLines / totalLines * 100 : 0}%` }} /></div>
            <span className="font-semibold text-ink-2 tabular">{doneLines}/{totalLines}</span>
            <Button size="sm" variant="ghost" onClick={() => setChecked(new Set())}>Reiniciar</Button>
            <Button size="sm" variant="soft" onClick={share}><Share2 size={14} /> Compartir</Button>
          </div>

          {[...groups.entries()].map(([cat, arr]) => (
            <div key={cat} className="card overflow-hidden">
              <div className="px-4 py-2.5 text-xs font-bold text-ink-3 uppercase tracking-wide bg-surface-2/60">{CATEGORY_LABELS[cat].emoji} {CATEGORY_LABELS[cat].label}</div>
              <ul>
                {arr.map(l => {
                  const on = checked.has(l.food.id)
                  return (
                    <li key={l.food.id}>
                      <button onClick={() => toggle(l.food.id)} className="press w-full flex items-center gap-3 px-4 py-2.5 text-left border-t border-line">
                        <span className={cx('h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors', on ? 'bg-ok border-ok text-white' : 'border-line')}>{on && <Check size={14} strokeWidth={3} />}</span>
                        <span className="text-xl">{l.food.emoji}</span>
                        <span className={cx('flex-1 min-w-0 font-semibold leading-tight', on && 'line-through text-ink-3')}>{l.food.name}</span>
                        <span className={cx('shrink-0 max-w-[42%] text-right text-sm font-bold tabular leading-tight', on ? 'text-ink-3' : 'text-ink-2')}>
                          {fmtQty(l)}{l.units ? <span className="block text-[11px] font-semibold text-ink-3">≈ {fmtWeight(l)}</span> : null}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          <p className="text-[11px] text-ink-3 text-center">Cantidades en crudo (el arroz, la pasta y las legumbres pesan más cocinados). El mes se calcula como 30 días.</p>
        </>
      )}
    </div>
  )
}
