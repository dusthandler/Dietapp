import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { Button, Chip, cx, haptic } from '@/components/ui'
import { DateField, NumberField } from '@/components/fields'
import { ALLERGEN_LABELS, type Allergen } from '@/data/foods.es'
import type { Activity, Goal, Pace, Profile, Sex } from '@/data/types'
import { ACTIVITY_LABELS, GOAL_LABELS, PACE_INFO, PACE_LABELS, ageOf, bmi, computeTargets, fastLossAllowed } from '@/lib/nutrition'
import { saveProfile } from '@/store/repo'
import { useProfile } from '@/store/hooks'

const STEPS = ['hola', 'cuerpo', 'actividad', 'objetivo', 'intolerancias', 'resultado'] as const

type Draft = Omit<Profile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>

export default function Onboarding({ onDone }: { onDone?: () => void }) {
  const existing = useProfile()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [p, setP] = useState<Draft>(() => ({
    name: existing?.name ?? '', sex: existing?.sex ?? 'male', birthYear: existing?.birthYear ?? 1992, birthDate: existing?.birthDate ?? '1992-06-15',
    heightCm: existing?.heightCm ?? 175, weightKg: existing?.weightKg ?? 75, bodyFatPct: existing?.bodyFatPct ?? null,
    activity: existing?.activity ?? 'light', goal: existing?.goal ?? 'maintain', pace: existing?.pace ?? 'normal',
    intolerances: existing?.intolerances ?? [], customIntolerances: existing?.customIntolerances ?? [],
    dislikedFoodIds: existing?.dislikedFoodIds ?? [], onboarded: false,
  }))
  const patch = (x: Partial<Draft>) => setP(prev => ({ ...prev, ...x, birthYear: x.birthDate ? Number(x.birthDate.slice(0, 4)) : prev.birthYear }))
  const go = (d: 1 | -1) => { setDir(d); setStep(s => Math.max(0, Math.min(STEPS.length - 1, s + d))); haptic(6) }

  const targets = useMemo(() => computeTargets({ ...p, id: 'me', userId: 'local', createdAt: 0, updatedAt: 0 }), [p])

  const finish = async () => {
    await saveProfile({ ...p, name: p.name.trim(), onboarded: true })
    haptic([10, 40, 20])
    onDone?.()
  }

  const key = STEPS[step]
  const canNext = key !== 'hola' || p.name.trim().length > 0

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto px-5 pt-6 pb-8 safe-top safe-bottom">
      <div className="flex items-center gap-2 mb-6">
        {step > 0 ? (
          <button className="press h-10 w-10 rounded-full bg-surface-2 flex items-center justify-center" onClick={() => go(-1)} aria-label="Atrás"><ArrowLeft size={18} /></button>
        ) : <div className="w-10" />}
        <div className="flex-1 flex gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s} className={cx('h-1.5 flex-1 rounded-full transition-colors', i <= step ? 'bg-accent' : 'bg-line')} />
          ))}
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 relative">
        {/* -inset-x-1 + px-1: deja sitio al anillo de foco de los campos para que no se recorte */}
        <motion.div key={key} initial={{ x: dir * 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="absolute inset-y-0 -inset-x-1 px-1 overflow-y-auto no-scrollbar">
            {key === 'hola' && <StepHello name={p.name} onName={v => patch({ name: v })} />}
            {key === 'cuerpo' && <StepBody p={p} patch={patch} />}
            {key === 'actividad' && <StepActivity value={p.activity} onChange={v => patch({ activity: v })} />}
            {key === 'objetivo' && <StepGoal p={p} onGoal={v => patch({ goal: v, pace: v === 'lose' && p.pace === 'fast' && !fastLossAllowed(p) ? 'normal' : p.pace })} onPace={v => patch({ pace: v })} />}
            {key === 'intolerancias' && <StepIntolerances value={p.intolerances} custom={p.customIntolerances} onChange={v => patch({ intolerances: v })} onCustom={v => patch({ customIntolerances: v })} />}
            {key === 'resultado' && <StepResult p={p} t={targets} />}
        </motion.div>
      </div>

      <div className="pt-4">
        {key === 'resultado' ? (
          <Button size="xl" full onClick={finish}><Sparkles size={20} /> ¡Empezar!</Button>
        ) : (
          <Button size="xl" full disabled={!canNext} onClick={() => go(1)}>Continuar <ArrowRight size={20} /></Button>
        )}
      </div>
    </div>
  )
}

function Title({ emoji, children, sub }: { emoji: string; children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-5">
      <div className="text-4xl mb-2">{emoji}</div>
      <h1 className="text-2xl font-extrabold tracking-tight">{children}</h1>
      {sub && <p className="text-ink-2 mt-1">{sub}</p>}
    </div>
  )
}

function StepHello({ name, onName }: { name: string; onName: (v: string) => void }) {
  return (
    <div>
      <Title emoji="👋" sub="Dietapp te ayuda a comer bien sin pensar demasiado. Vamos a calcular lo que necesita tu cuerpo.">¡Hola! ¿Cómo te llamas?</Title>
      <input autoFocus value={name} onChange={e => onName(e.target.value)} placeholder="Tu nombre"
        className="w-full h-14 px-5 rounded-2xl bg-surface shadow-card text-lg font-semibold outline-none focus:ring-2 ring-accent" />
      <p className="text-xs text-ink-3 mt-4">Tus datos se guardan solo en este dispositivo. Nada sale de aquí.</p>
    </div>
  )
}

export function BodyFields({ p, patch }: { p: Pick<Profile, 'sex' | 'birthYear' | 'birthDate' | 'heightCm' | 'weightKg' | 'bodyFatPct'>; patch: (x: Partial<Profile>) => void }) {
  const [bf, setBf] = useState(p.bodyFatPct != null)
  return (
    <div>
      <div className="flex gap-2 mb-3">
        {(['male', 'female'] as Sex[]).map(s => (
          <button key={s} onClick={() => patch({ sex: s })} className={cx('press flex-1 h-14 rounded-2xl font-bold text-lg', p.sex === s ? 'bg-accent text-white' : 'bg-surface shadow-card text-ink-2')}>
            {s === 'male' ? '♂ Hombre' : '♀ Mujer'}
          </button>
        ))}
      </div>
      <DateField label={`Fecha de nacimiento · ${ageOf(p)} años`} value={p.birthDate ?? `${p.birthYear}-01-01`} onChange={iso => patch({ birthDate: iso, birthYear: Number(iso.slice(0, 4)) })} />
      <NumberField label="Altura" value={p.heightCm} min={120} max={230} unit="cm" onChange={v => patch({ heightCm: v })} />
      <NumberField label="Peso" value={p.weightKg} min={30} max={250} step={0.1} decimals={1} unit="kg" onChange={v => patch({ weightKg: v })} hint={`IMC ${bmi(p.weightKg, p.heightCm).toFixed(1)}`} />
      <div className="card p-3">
        <label className="flex items-center justify-between cursor-pointer gap-3">
          <div>
            <div className="font-semibold">¿Sabes tu % de grasa corporal?</div>
            <div className="text-xs text-ink-3">Opcional. Mejora mucho la precisión (fórmula Katch-McArdle).</div>
          </div>
          <input type="checkbox" checked={bf} onChange={e => { setBf(e.target.checked); patch({ bodyFatPct: e.target.checked ? 20 : null }) }} className="h-6 w-6 accent-[var(--accent)] shrink-0" />
        </label>
      </div>
      {bf && <div className="mt-3"><NumberField label="Grasa corporal" value={p.bodyFatPct ?? 20} min={4} max={60} unit="%" onChange={v => patch({ bodyFatPct: v })} /></div>}
    </div>
  )
}

function StepBody({ p, patch }: { p: Draft; patch: (x: Partial<Draft>) => void }) {
  return (
    <div>
      <Title emoji="📏" sub="Con esto calculamos tu metabolismo basal (fórmula Mifflin-St Jeor, la más precisa validada). Puedes escribir los números directamente.">Cuéntame sobre ti</Title>
      <BodyFields p={p} patch={patch as (x: Partial<Profile>) => void} />
    </div>
  )
}

export function ActivityPicker({ value, onChange }: { value: Activity; onChange: (v: Activity) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {(Object.keys(ACTIVITY_LABELS) as Activity[]).map(a => {
        const d = ACTIVITY_LABELS[a]
        const on = value === a
        return (
          <button key={a} onClick={() => { onChange(a); haptic(6) }} className={cx('press text-left flex items-start gap-3 p-4 rounded-2xl', on ? 'bg-accent text-white shadow-float' : 'bg-surface shadow-card')}>
            <span className="text-3xl leading-none mt-0.5">{d.emoji}</span>
            <span className="min-w-0">
              <div className="font-bold">{d.label}</div>
              <div className={cx('text-sm', on ? 'text-white/90' : 'text-ink-2')}>{d.desc}</div>
              <div className={cx('text-xs mt-0.5', on ? 'text-white/70' : 'text-ink-3')}>Ej.: {d.example}</div>
            </span>
          </button>
        )
      })}
    </div>
  )
}

function StepActivity({ value, onChange }: { value: Activity; onChange: (v: Activity) => void }) {
  return (
    <div>
      <Title emoji="🏃" sub="Cuenta solo el ejercicio que haces de verdad, no el que te gustaría hacer. Si dudas entre dos, elige el inferior.">¿Cuánto te mueves?</Title>
      <ActivityPicker value={value} onChange={onChange} />
    </div>
  )
}

export function PacePicker({ p, onPace }: { p: Pick<Profile, 'goal' | 'pace' | 'sex' | 'weightKg' | 'heightCm' | 'bodyFatPct'>; onPace: (pc: Pace) => void }) {
  if (p.goal === 'maintain') return null
  const info = PACE_INFO[p.goal]
  const fastOk = p.goal === 'gain' || fastLossAllowed(p)
  return (
    <div>
      <div className="font-semibold text-ink-2 mb-2">Ritmo</div>
      <div className="flex flex-col gap-2">
        {(Object.keys(PACE_LABELS) as Pace[]).map(pc => {
          const disabled = pc === 'fast' && !fastOk
          const on = p.pace === pc
          const i = info[pc]
          return (
            <button key={pc} disabled={disabled} onClick={() => { onPace(pc); haptic(6) }}
              className={cx('press text-left p-3.5 rounded-2xl', on ? 'bg-ink text-paper' : 'bg-surface shadow-card', disabled && 'opacity-50')}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-bold">{PACE_LABELS[pc].label}</span>
                <span className={cx('text-xs font-semibold tabular', on ? 'opacity-80' : 'text-ink-3')}>{i.rate} · {i.kcal}</span>
              </div>
              <div className={cx('text-xs mt-1', on ? 'opacity-90' : 'text-ink-2')}>✅ {i.pros}</div>
              <div className={cx('text-xs mt-0.5', on ? 'opacity-70' : 'text-ink-3')}>⚠️ {i.cons}</div>
              {disabled && <div className="text-xs mt-1 font-semibold text-danger">No disponible: con tu peso actual perderías músculo. Usa "Normal" y, si quieres, revísalo más adelante.</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepGoal({ p, onGoal, onPace }: { p: Draft; onGoal: (g: Goal) => void; onPace: (pc: Pace) => void }) {
  return (
    <div>
      <Title emoji="🎯">¿Cuál es tu objetivo?</Title>
      <div className="flex flex-col gap-2 mb-5">
        {(Object.keys(GOAL_LABELS) as Goal[]).map(g => {
          const d = GOAL_LABELS[g]
          const on = p.goal === g
          return (
            <button key={g} onClick={() => { onGoal(g); haptic(6) }} className={cx('press text-left flex items-center gap-3 p-4 rounded-2xl', on ? 'bg-accent text-white shadow-float' : 'bg-surface shadow-card')}>
              <span className="text-3xl">{d.emoji}</span>
              <span>
                <div className="font-bold">{d.label}</div>
                <div className={cx('text-sm', on ? 'text-white/80' : 'text-ink-2')}>{d.desc}</div>
              </span>
            </button>
          )
        })}
      </div>
      {p.goal !== 'maintain' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <PacePicker p={p} onPace={onPace} />
          {p.goal === 'lose' && <p className="text-xs text-ink-3 mt-3">En cualquier ritmo, la app nunca te pone por debajo de tu metabolismo basal ni de 1.200/1.500 kcal, y calcula la proteína alta (2 g/kg) para proteger el músculo.</p>}
        </motion.div>
      )}
    </div>
  )
}

export function IntoleranceEditor({ value, custom, onChange, onCustom }: { value: Allergen[]; custom: string[]; onChange: (v: Allergen[]) => void; onCustom: (v: string[]) => void }) {
  const [text, setText] = useState('')
  const toggle = (a: Allergen) => { onChange(value.includes(a) ? value.filter(x => x !== a) : [...value, a]); haptic(6) }
  const addCustom = () => { const t = text.trim().toLowerCase(); if (t && !custom.includes(t)) onCustom([...custom, t]); setText('') }
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(ALLERGEN_LABELS) as Allergen[]).map(a => (
          <Chip key={a} tone="danger" active={value.includes(a)} onClick={() => toggle(a)}>
            <span>{ALLERGEN_LABELS[a].emoji}</span>{ALLERGEN_LABELS[a].label}
          </Chip>
        ))}
      </div>
      <div className="text-sm font-semibold text-ink-2 mb-2">Otras (palabra clave, p. ej. «cebolla», «fructosa»)</div>
      <div className="flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addCustom() }} placeholder="Añadir…"
          className="flex-1 h-11 px-4 rounded-2xl bg-surface shadow-card outline-none focus:ring-2 ring-accent" />
        <Button variant="soft" onClick={addCustom}>Añadir</Button>
      </div>
      {custom.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {custom.map(c => <Chip key={c} tone="danger" active onClick={() => onCustom(custom.filter(x => x !== c))}>{c} ✕</Chip>)}
        </div>
      )}
    </div>
  )
}

function StepIntolerances(props: { value: Allergen[]; custom: string[]; onChange: (v: Allergen[]) => void; onCustom: (v: string[]) => void }) {
  return (
    <div>
      <Title emoji="🚫" sub="Los alimentos que coincidan se marcarán en rojo en toda la app. Puedes cambiarlo luego en tu perfil.">¿Alguna intolerancia o alergia?</Title>
      <IntoleranceEditor {...props} />
    </div>
  )
}

function StepResult({ p, t }: { p: Draft; t: ReturnType<typeof computeTargets> }) {
  const items = [
    { label: 'Proteína', v: t.protein, unit: 'g', color: 'var(--c-protein)', emoji: '🥩' },
    { label: 'Carbohidratos', v: t.carbs, unit: 'g', color: 'var(--c-carbs)', emoji: '🍞' },
    { label: 'Grasa', v: t.fat, unit: 'g', color: 'var(--c-fat)', emoji: '🥑' },
  ]
  return (
    <div>
      <Title emoji="🎉" sub={`Esto es lo que tu cuerpo necesita cada día para ${GOAL_LABELS[p.goal].label.toLowerCase()}.`}>¡Listo, {p.name.trim()}!</Title>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="card p-6 text-center mb-3 bg-linear-to-br from-accent to-[#FFB25C] text-white shadow-float">
        <div className="text-sm font-semibold opacity-90">Objetivo diario</div>
        <div className="text-6xl font-extrabold tracking-tight my-1">{t.kcal}</div>
        <div className="text-sm font-semibold opacity-90">kcal</div>
        <div className="text-xs opacity-80 mt-2">Metabolismo basal {t.bmr} · Gasto total {t.tdee} kcal</div>
      </motion.div>
      <div className="grid grid-cols-3 gap-2">
        {items.map((it, i) => (
          <motion.div key={it.label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 + i * 0.08 }} className="card p-3 text-center">
            <div className="h-1.5 rounded-full mb-2" style={{ background: it.color }} />
            <div className="text-2xl font-extrabold tabular">{it.v}<span className="text-sm text-ink-3 ml-0.5">{it.unit}</span></div>
            <div className="text-xs text-ink-2 font-semibold">{it.emoji} {it.label}</div>
          </motion.div>
        ))}
      </div>
      <p className="text-xs text-ink-3 mt-4">Además controlaremos 25 vitaminas, minerales y ácidos grasos con los valores de referencia de la EFSA. Todo se puede ajustar en tu perfil.</p>
    </div>
  )
}
