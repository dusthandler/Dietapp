import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cx, haptic } from './ui'

/**
 * Campo numérico grande: se puede escribir directamente y ajustar con − / +
 * (mantén pulsado para ir rápido). Sustituye a los sliders, que eran imprecisos.
 */
export function NumberField({ label, value, onChange, unit, min, max, step = 1, decimals = 0, hint }:
  { label: string; value: number; onChange: (v: number) => void; unit?: string; min: number; max: number; step?: number; decimals?: number; hint?: string }) {
  const fmt = (v: number) => v.toFixed(decimals).replace('.', ',')
  const [text, setText] = useState(fmt(value))
  const [editing, setEditing] = useState(false)
  useEffect(() => { if (!editing) setText(fmt(value)) }, [value, editing]) // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (raw: string) => {
    const n = parseFloat(raw.replace(',', '.'))
    if (!isNaN(n)) onChange(Math.max(min, Math.min(max, Math.round(n / step) * step)))
    else setText(fmt(value))
  }
  const nudge = (dir: 1 | -1) => { onChange(Math.max(min, Math.min(max, Math.round((value + dir * step) / step) * step))); haptic(6) }

  // Mantener pulsado
  const [hold, setHold] = useState<{ t: number; i: number } | null>(null)
  const startHold = (dir: 1 | -1) => {
    nudge(dir)
    let v = value
    const t = window.setTimeout(() => {
      const i = window.setInterval(() => { v = Math.max(min, Math.min(max, v + dir * step)); onChange(Math.round(v / step) * step) }, 70)
      setHold(h => ({ t: h?.t ?? t, i }))
    }, 450)
    setHold({ t, i: 0 })
  }
  const stopHold = () => { if (hold) { clearTimeout(hold.t); clearInterval(hold.i); setHold(null) } }

  return (
    <div className="card p-3 mb-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold">{label}</div>
          {hint && <div className="text-xs text-ink-3">{hint}</div>}
        </div>
        <div className="flex items-center gap-1.5 rounded-2xl bg-surface-2 p-1">
          <button type="button" className="press h-11 w-11 rounded-xl bg-surface shadow-sm flex items-center justify-center" aria-label="Menos"
            onPointerDown={() => startHold(-1)} onPointerUp={stopHold} onPointerLeave={stopHold} onPointerCancel={stopHold}><Minus size={18} strokeWidth={2.5} /></button>
          <div className="flex items-baseline justify-center gap-1 w-[5.5rem]">
            <input inputMode="decimal" value={text} onFocus={e => { setEditing(true); e.target.select() }}
              onChange={e => setText(e.target.value)}
              onBlur={() => { setEditing(false); commit(text) }}
              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
              className={cx('w-full bg-transparent text-center font-extrabold tabular outline-none text-2xl', unit && 'text-right')} aria-label={label} />
            {unit && <span className="text-sm text-ink-3 font-semibold">{unit}</span>}
          </div>
          <button type="button" className="press h-11 w-11 rounded-xl bg-surface shadow-sm flex items-center justify-center" aria-label="Más"
            onPointerDown={() => startHold(1)} onPointerUp={stopHold} onPointerLeave={stopHold} onPointerCancel={stopHold}><Plus size={18} strokeWidth={2.5} /></button>
        </div>
      </div>
    </div>
  )
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/** Fecha de nacimiento con día, mes y año escribibles */
export function DateField({ label, value, onChange }: { label: string; value: string; onChange: (iso: string) => void }) {
  const [y, m, d] = (value || '1990-01-01').split('-').map(Number)
  const [day, setDay] = useState(String(d))
  const [year, setYear] = useState(String(y))
  useEffect(() => { setDay(String(d)); setYear(String(y)) }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  const maxYear = new Date().getFullYear() - 14
  const emit = (dd: number, mm: number, yy: number) => {
    const daysIn = new Date(yy, mm, 0).getDate()
    const D = Math.max(1, Math.min(daysIn, dd || 1)), Y = Math.max(1900, Math.min(maxYear, yy || 1990))
    onChange(`${Y}-${String(mm).padStart(2, '0')}-${String(D).padStart(2, '0')}`)
  }
  const box = 'h-12 rounded-xl bg-surface-2 text-center font-bold text-lg outline-none focus:ring-2 ring-accent tabular'
  return (
    <div className="card p-3 mb-3">
      <div className="font-semibold mb-2">{label}</div>
      <div className="grid grid-cols-[4.5rem_1fr_5.5rem] gap-2">
        <input inputMode="numeric" value={day} onChange={e => setDay(e.target.value.replace(/\D/g, '').slice(0, 2))} onBlur={() => emit(+day, m, +year)} onFocus={e => e.target.select()}
          className={box} aria-label="Día" placeholder="DD" />
        <select value={m} onChange={e => emit(+day, +e.target.value, +year)} className={cx(box, 'px-2 appearance-none')} aria-label="Mes">
          {MONTHS.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
        </select>
        <input inputMode="numeric" value={year} onChange={e => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))} onBlur={() => emit(+day, m, +year)} onFocus={e => e.target.select()}
          className={box} aria-label="Año" placeholder="AAAA" />
      </div>
    </div>
  )
}
