import { motion, useDragControls } from 'framer-motion'
import { Check, Minus, Plus, X } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

// ───────────────────────── util ─────────────────────────
export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

export function haptic(pattern: number | number[] = 12) {
  try { navigator.vibrate?.(pattern) } catch { /* noop */ }
}

// ───────────────────────── Button ─────────────────────────
type Variant = 'primary' | 'soft' | 'ghost' | 'danger' | 'ok' | 'outline'
type Size = 'sm' | 'md' | 'lg' | 'xl'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-white shadow-[0_6px_20px_-6px_var(--accent)] hover:brightness-105',
  soft: 'bg-accent-soft text-accent-ink hover:brightness-95',
  ghost: 'bg-transparent text-ink-2 hover:bg-surface-2',
  outline: 'bg-transparent border border-line text-ink hover:bg-surface-2',
  danger: 'bg-danger-soft text-danger hover:brightness-95',
  ok: 'bg-ok text-white hover:brightness-105',
}
const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-xl gap-1.5',
  md: 'h-11 px-4 text-[15px] rounded-2xl gap-2',
  lg: 'h-13 px-5 text-base rounded-2xl gap-2',
  xl: 'h-14 px-6 text-lg rounded-3xl gap-2.5',
}

export function Button({ variant = 'primary', size = 'md', className, children, full, ...rest }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; full?: boolean }) {
  return (
    <button
      {...rest}
      className={cx('press inline-flex items-center justify-center font-semibold select-none disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap',
        VARIANTS[variant], SIZES[size], full && 'w-full', className)}
    >
      {children}
    </button>
  )
}

export function IconButton({ className, children, label, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button {...rest} aria-label={label} title={label}
      className={cx('press inline-flex items-center justify-center h-10 w-10 rounded-full bg-surface-2 text-ink-2 hover:text-ink disabled:opacity-40', className)}>
      {children}
    </button>
  )
}

// ───────────────────────── Chip ─────────────────────────
export function Chip({ active, children, className, tone = 'accent', ...rest }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; tone?: 'accent' | 'danger' | 'ok' | 'neutral' }) {
  const on = { accent: 'bg-accent text-white', danger: 'bg-danger text-white', ok: 'bg-ok text-white', neutral: 'bg-ink text-paper' }[tone]
  return (
    <button {...rest}
      className={cx('press inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-semibold whitespace-nowrap border',
        active ? cx(on, 'border-transparent') : 'bg-surface border-line text-ink-2 hover:bg-surface-2', className)}>
      {children}
    </button>
  )
}

// ───────────────────────── Progress ─────────────────────────
export function ProgressBar({ value, max, color, height = 10, className }:
  { value: number; max: number; color: string; height?: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className={cx('w-full rounded-full bg-surface-2 overflow-hidden', className)} style={{ height }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 90, damping: 18, mass: 0.6 }}
      />
    </div>
  )
}

export function Ring({ value, max, size = 150, stroke = 14, color = 'var(--accent)', children }:
  { value: number; max: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(1, value / max) : 0
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-2)" strokeWidth={stroke} fill="none" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ type: 'spring', stiffness: 60, damping: 16 }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

export function CheckCircle({ size = 40, delay = 0 }: { size?: number; delay?: number }) {
  return (
    <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 14, delay }}
      className="rounded-full bg-ok text-white flex items-center justify-center shadow-[0_6px_16px_-6px_var(--ok)]"
      style={{ width: size, height: size }}>
      <Check size={size * 0.55} strokeWidth={3} />
    </motion.div>
  )
}

// ───────────────────────── Stepper ─────────────────────────
export function Stepper({ value, onChange, step = 10, min = 0, max = 5000, unit = 'g', big }:
  { value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; unit?: string; big?: boolean }) {
  const [text, setText] = useState(String(Math.round(value)))
  useEffect(() => { setText(String(Math.round(value * 10) / 10)) }, [value])
  const set = (v: number) => { const c = Math.max(min, Math.min(max, v)); onChange(c); haptic(8) }
  const hold = useRef<number | null>(null)
  const startHold = (dir: 1 | -1) => {
    set(value + dir * step)
    let v = value + dir * step
    hold.current = window.setTimeout(() => {
      hold.current = window.setInterval(() => { v += dir * step; set(v) }, 80)
    }, 400)
  }
  const stopHold = () => { if (hold.current) { clearTimeout(hold.current); clearInterval(hold.current); hold.current = null } }
  return (
    <div className={cx('inline-flex items-center gap-2 rounded-2xl bg-surface-2 p-1.5', big && 'w-full')}>
      <button className="press h-11 w-11 rounded-xl bg-surface text-ink flex items-center justify-center shadow-sm" onPointerDown={() => startHold(-1)} onPointerUp={stopHold} onPointerLeave={stopHold} onPointerCancel={stopHold} aria-label="Menos">
        <Minus size={20} strokeWidth={2.5} />
      </button>
      <div className="flex-1 flex items-baseline justify-center gap-1">
        <input inputMode="decimal" className={cx('w-20 bg-transparent text-center font-bold tabular outline-none', big ? 'text-3xl' : 'text-xl')} value={text}
          onChange={e => setText(e.target.value)}
          onBlur={() => { const n = parseFloat(text.replace(',', '.')); if (!isNaN(n)) set(n); else setText(String(value)) }}
          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }} />
        <span className="text-ink-3 font-semibold">{unit}</span>
      </div>
      <button className="press h-11 w-11 rounded-xl bg-surface text-ink flex items-center justify-center shadow-sm" onPointerDown={() => startHold(1)} onPointerUp={stopHold} onPointerLeave={stopHold} onPointerCancel={stopHold} aria-label="Más">
        <Plus size={20} strokeWidth={2.5} />
      </button>
    </div>
  )
}

// ───────────────────────── Sheet (bottom sheet / modal) ─────────────────────────
/**
 * Bottom sheet en móvil, modal centrado en escritorio.
 * No usa AnimatePresence para la salida: con "reducir movimiento" activado en el sistema,
 * Framer Motion puede dejar el elemento montado (invisible) y bloquear los clics. Aquí el
 * sheet controla su propio desmontaje con un tiempo de seguridad.
 */
export function Sheet({ open, onClose, title, children, wide, footer, noPad }:
  { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; wide?: boolean; footer?: ReactNode; noPad?: boolean }) {
  const drag = useDragControls()
  const [mounted, setMounted] = useState(open)
  const reduced = useMemo(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, [])

  useEffect(() => {
    if (open) { setMounted(true); return }
    const t = window.setTimeout(() => setMounted(false), reduced ? 0 : 320)
    return () => window.clearTimeout(t)
  }, [open, reduced])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, onClose])

  if (!mounted) return null
  const spring = reduced ? { duration: 0 } : { type: 'spring' as const, stiffness: 380, damping: 36 }

  return createPortal(
    <div className={cx('fixed inset-0 z-50 flex items-end sm:items-center justify-center', !open && 'pointer-events-none')} aria-hidden={!open}>
      <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: open ? 1 : 0 }} transition={{ duration: reduced ? 0 : 0.2 }} onClick={onClose} />
      <motion.div
        className={cx('relative w-full bg-surface shadow-sheet flex flex-col max-h-[92dvh] sm:max-h-[86dvh] rounded-t-3xl sm:rounded-3xl', wide ? 'sm:max-w-2xl' : 'sm:max-w-md')}
        initial={{ y: '100%', opacity: 0.6 }} animate={open ? { y: 0, opacity: 1 } : { y: '100%', opacity: 0 }}
        transition={spring}
        drag="y" dragListener={false} dragControls={drag} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.4 }}
        onDragEnd={(_, info) => { if (info.offset.y > 120 || info.velocity.y > 600) onClose() }}
      >
        {/* Asa: solo desde aquí (y el título) se arrastra para cerrar, así el scroll interno no se ve afectado */}
        <div className="sm:hidden pt-2 pb-1 cursor-grab touch-none" onPointerDown={e => drag.start(e)}>
          <div className="mx-auto h-1.5 w-10 rounded-full bg-line" />
        </div>
        {(title !== undefined) && (
          <div className="flex items-center gap-3 px-5 pt-2 sm:pt-3 pb-2 touch-none" onPointerDown={e => drag.start(e)}>
            <div className="flex-1 text-lg font-bold truncate">{title}</div>
            <IconButton label="Cerrar" onClick={onClose}><X size={18} /></IconButton>
          </div>
        )}
        <div className={cx('flex-1 overflow-y-auto overscroll-contain', !noPad && 'px-5 pb-5')}>{children}</div>
        {footer && <div className="px-5 py-3 border-t border-line bg-surface safe-bottom rounded-b-3xl">{footer}</div>}
      </motion.div>
    </div>,
    document.body,
  )
}

// ───────────────────────── Toast ─────────────────────────
interface ToastItem { id: number; text: string; emoji?: string; tone?: 'ok' | 'danger' | 'info' }
const ToastCtx = createContext<(text: string, opts?: { emoji?: string; tone?: ToastItem['tone'] }) => void>(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const push = useCallback((text: string, opts?: { emoji?: string; tone?: ToastItem['tone'] }) => {
    const id = Date.now() + Math.random()
    setItems(list => [...list.slice(-2), { id, text, ...opts }])
    setTimeout(() => setItems(list => list.filter(t => t.id !== id)), 2400)
  }, [])
  const value = useMemo(() => push, [push])
  return (
    <ToastCtx.Provider value={value}>
      {children}
      {createPortal(
        <div className="fixed left-0 right-0 bottom-24 sm:bottom-8 z-[60] flex flex-col items-center gap-2 pointer-events-none px-4">
          {items.map(t => (
            <motion.div key={t.id} initial={{ y: 20, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }}
              className={cx('px-4 py-2.5 rounded-2xl shadow-float text-sm font-semibold flex items-center gap-2 max-w-sm',
                t.tone === 'danger' ? 'bg-danger text-white' : t.tone === 'ok' ? 'bg-ok text-white' : 'bg-ink text-paper')}>
              {t.emoji && <span className="text-base">{t.emoji}</span>}{t.text}
            </motion.div>
          ))}
        </div>, document.body)}
    </ToastCtx.Provider>
  )
}

// ───────────────────────── Empty state ─────────────────────────
export function Empty({ emoji, title, desc, action }: { emoji: string; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center py-10 px-6 gap-2">
      <div className="text-5xl mb-1">{emoji}</div>
      <div className="font-bold text-lg">{title}</div>
      {desc && <div className="text-ink-2 text-sm max-w-xs">{desc}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2 mt-1">
      <h2 className="text-[15px] font-bold text-ink-2 uppercase tracking-wide">{children}</h2>
      {right}
    </div>
  )
}

/** Confirmación sencilla */
export function useConfirm() {
  const [state, setState] = useState<{ title: string; desc?: string; resolve: (ok: boolean) => void; danger?: boolean } | null>(null)
  const confirm = useCallback((title: string, desc?: string, danger = true) => new Promise<boolean>(resolve => setState({ title, desc, resolve, danger })), [])
  const el = (
    <Sheet open={!!state} onClose={() => { state?.resolve(false); setState(null) }} title={state?.title}>
      {state?.desc && <p className="text-ink-2 mb-4">{state.desc}</p>}
      <div className="flex gap-2">
        <Button variant="outline" full onClick={() => { state?.resolve(false); setState(null) }}>Cancelar</Button>
        <Button variant={state?.danger ? 'danger' : 'primary'} full onClick={() => { state?.resolve(true); setState(null) }}>Confirmar</Button>
      </div>
    </Sheet>
  )
  return { confirm, el }
}
