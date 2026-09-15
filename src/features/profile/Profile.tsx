import { useRef, useState } from 'react'
import { ChevronRight, Download, Moon, Sun, Monitor, Trash2, Upload, RotateCcw } from 'lucide-react'
import { Button, Sheet, cx, haptic, useConfirm, useToast } from '@/components/ui'
import { ALLERGEN_LABELS } from '@/data/foods.es'
import { catalog } from '@/data/foodDb'
import type { Activity, Goal, Pace, Profile } from '@/data/types'
import { ACTIVITY_LABELS, GOAL_LABELS, PACE_LABELS, ageOf, bmi, fastLossAllowed, idealWeightRange } from '@/lib/nutrition'
import { getThemeMode, setThemeMode, useTheme, type ThemeMode } from '@/lib/theme'
import { exportAll, importAll, saveProfile, setDayExtras, wipeAll } from '@/store/repo'
import { useProfile, useTargets, useWeights } from '@/store/hooks'
import { ActivityPicker, BodyFields, IntoleranceEditor, PacePicker } from '@/features/onboarding/Onboarding'
import { dateKey } from '@/lib/dates'

export default function ProfilePage() {
  const profile = useProfile()
  const targets = useTargets(profile)
  const weights = useWeights()
  const toast = useToast()
  const { confirm, el: confirmEl } = useConfirm()
  const theme = useTheme()
  const [sheet, setSheet] = useState<'datos' | 'objetivo' | 'intolerancias' | 'peso' | 'ajustar' | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!profile || !targets) return null
  const age = ageOf(profile)
  const [minW, maxW] = idealWeightRange(profile.heightCm)

  const doExport = async () => {
    const data = await exportAll()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `dietapp-${dateKey()}.json`; a.click()
    URL.revokeObjectURL(url)
    toast('Copia exportada', { tone: 'ok' })
  }
  const doImport = async (file: File) => {
    try {
      const data = JSON.parse(await file.text())
      if (!(await confirm('Importar copia', 'Se sustituirán todos los datos actuales por los del archivo.'))) return
      await importAll(data)
      toast('Datos importados', { tone: 'ok' })
    } catch { toast('Archivo no válido', { tone: 'danger' }) }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-full bg-accent-soft text-accent-ink flex items-center justify-center text-2xl font-extrabold">{profile.name.slice(0, 1).toUpperCase()}</div>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight">{profile.name}</h1>
          <div className="text-sm text-ink-2">{profile.sex === 'male' ? 'Hombre' : 'Mujer'} · {age} años · {profile.heightCm} cm · {profile.weightKg} kg</div>
        </div>
      </div>

      {/* Objetivos */}
      <div className="card p-4">
        <div className="flex items-baseline justify-between mb-3">
          <div className="font-bold">Tu objetivo diario</div>
          <button className="text-sm font-semibold text-accent-ink" onClick={() => setSheet('ajustar')}>Ajustar</button>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div><div className="text-2xl font-extrabold tabular">{targets.kcal}</div><div className="text-[11px] font-semibold text-ink-3">kcal</div></div>
          <div><div className="text-2xl font-extrabold tabular text-[var(--c-protein)]">{targets.protein}</div><div className="text-[11px] font-semibold text-ink-3">proteína</div></div>
          <div><div className="text-2xl font-extrabold tabular text-[var(--c-carbs)]">{targets.carbs}</div><div className="text-[11px] font-semibold text-ink-3">carbos</div></div>
          <div><div className="text-2xl font-extrabold tabular text-[var(--c-fat)]">{targets.fat}</div><div className="text-[11px] font-semibold text-ink-3">grasa</div></div>
        </div>
        <div className="text-xs text-ink-3 mt-3">
          Metabolismo basal {targets.bmr} kcal ({profile.bodyFatPct != null ? 'Katch-McArdle' : 'Mifflin-St Jeor'}) · Gasto total {targets.tdee} kcal · {GOAL_LABELS[profile.goal].label}{profile.goal !== 'maintain' ? ` (${PACE_LABELS[profile.pace].desc})` : ''}
          {profile.overrides && Object.keys(profile.overrides).length > 0 && ' · con ajustes manuales'}
        </div>
      </div>

      {/* Peso */}
      <div className="card p-4">
        <div className="flex items-baseline justify-between mb-1">
          <div className="font-bold">⚖️ Peso</div>
          <button className="text-sm font-semibold text-accent-ink" onClick={() => setSheet('peso')}>Registrar hoy</button>
        </div>
        <div className="text-sm text-ink-2">IMC {bmi(profile.weightKg, profile.heightCm).toFixed(1)} · rango saludable {minW}–{maxW} kg</div>
        {weights && weights.length > 1 && <WeightChart data={weights.map(w => ({ date: w.date, kg: w.weightKg! }))} />}
      </div>

      <Row emoji="📏" title="Mis datos" desc="Sexo, edad, altura, peso, % grasa, actividad" onClick={() => setSheet('datos')} />
      <Row emoji="🎯" title="Objetivo" desc={`${GOAL_LABELS[profile.goal].label} · ${ACTIVITY_LABELS[profile.activity].label}`} onClick={() => setSheet('objetivo')} />
      <Row emoji="🚫" title="Intolerancias y alergias" desc={profile.intolerances.length + profile.customIntolerances.length ? [...profile.intolerances.map(a => ALLERGEN_LABELS[a].label), ...profile.customIntolerances].join(', ') : 'Ninguna'} onClick={() => setSheet('intolerancias')} />
      {profile.dislikedFoodIds.length > 0 && (
        <Row emoji="👎" title="Alimentos que no me gustan" desc={profile.dislikedFoodIds.map(id => catalog.get(id)?.name).filter(Boolean).join(', ')}
          onClick={async () => { if (await confirm('Vaciar lista', 'Volverán a aparecer en las propuestas de dietas.', false)) await saveProfile({ dislikedFoodIds: [] }) }} />
      )}

      {/* Tema */}
      <div className="card p-4">
        <div className="font-bold mb-2">Aspecto</div>
        <div className="flex p-1 rounded-2xl bg-surface-2">
          {([['system', Monitor, 'Auto'], ['light', Sun, 'Claro'], ['dark', Moon, 'Oscuro']] as [ThemeMode, typeof Sun, string][]).map(([m, Icon, l]) => (
            <button key={m} onClick={() => { setThemeMode(m); haptic(6) }} className={cx('press flex-1 h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5', (theme ?? getThemeMode()) === m ? 'bg-surface shadow-card' : 'text-ink-3')}><Icon size={16} />{l}</button>
          ))}
        </div>
      </div>

      {/* Datos */}
      <div className="card p-4 flex flex-col gap-2">
        <div className="font-bold">Tus datos</div>
        <p className="text-xs text-ink-3">Todo se guarda en este dispositivo. Exporta una copia para llevarla a otro o antes de borrar el navegador.</p>
        <div className="flex gap-2">
          <Button variant="soft" full onClick={doExport}><Download size={16} /> Exportar</Button>
          <Button variant="outline" full onClick={() => fileRef.current?.click()}><Upload size={16} /> Importar</Button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) doImport(f); e.target.value = '' }} />
        </div>
        <Button variant="ghost" size="sm" className="text-danger" onClick={async () => { if (await confirm('Borrar todo', 'Se eliminarán perfil, diario, recetas y dietas de este dispositivo.')) { await wipeAll(); location.reload() } }}><Trash2 size={14} /> Borrar todos los datos</Button>
      </div>

      <div className="text-[11px] text-ink-3 text-center pb-4">Dietapp v0.2 · Datos: USDA FoodData Central (SR Legacy, dominio público) y CIQUAL 2020 (ANSES, Licence Ouverte) · Referencias EFSA DRV · No sustituye el consejo de un profesional sanitario.</div>

      {/* Sheets */}
      <Sheet open={sheet === 'datos'} onClose={() => setSheet(null)} title="Mis datos">
        <BodyForm profile={profile} onSaved={() => { setSheet(null); toast('Datos actualizados', { tone: 'ok' }) }} />
      </Sheet>
      <Sheet open={sheet === 'objetivo'} onClose={() => setSheet(null)} title="Objetivo y actividad">
        <GoalForm profile={profile} onSaved={() => { setSheet(null); toast('Objetivo actualizado', { tone: 'ok' }) }} />
      </Sheet>
      <Sheet open={sheet === 'intolerancias'} onClose={() => setSheet(null)} title="Intolerancias y alergias">
        <IntoleranceEditor value={profile.intolerances} custom={profile.customIntolerances}
          onChange={v => saveProfile({ intolerances: v })} onCustom={v => saveProfile({ customIntolerances: v })} />
        <p className="text-xs text-ink-3 mt-4">Los cambios se guardan al instante.</p>
      </Sheet>
      <Sheet open={sheet === 'peso'} onClose={() => setSheet(null)} title="Registrar peso de hoy">
        <WeightForm current={profile.weightKg} onSaved={async kg => { await setDayExtras(dateKey(), { weightKg: kg }); await saveProfile({ weightKg: kg }); setSheet(null); toast('Peso registrado', { tone: 'ok' }) }} />
      </Sheet>
      <Sheet open={sheet === 'ajustar'} onClose={() => setSheet(null)} title="Ajustar objetivos">
        <OverridesForm profile={profile} computed={targets} onSaved={() => { setSheet(null); toast('Objetivos ajustados', { tone: 'ok' }) }} />
      </Sheet>
      {confirmEl}
    </div>
  )
}

function Row({ emoji, title, desc, onClick }: { emoji: string; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="press card p-4 flex items-center gap-3 text-left">
      <span className="text-2xl">{emoji}</span>
      <span className="flex-1 min-w-0"><div className="font-bold">{title}</div><div className="text-xs text-ink-3 truncate">{desc}</div></span>
      <ChevronRight size={18} className="text-ink-3" />
    </button>
  )
}

function Field({ label, value, onChange, unit, min, max, step = 1 }: { label: string; value: number; onChange: (v: number) => void; unit: string; min: number; max: number; step?: number }) {
  return (
    <div className="mb-3">
      <div className="flex items-baseline justify-between mb-1"><span className="font-semibold text-ink-2 text-sm">{label}</span><span className="font-extrabold tabular text-xl">{value}<span className="text-sm text-ink-3 ml-1">{unit}</span></span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full accent-[var(--accent)] h-8" />
    </div>
  )
}

function BodyForm({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const [p, setP] = useState<Profile>({ ...profile })
  const patch = (x: Partial<Profile>) => setP(prev => ({ ...prev, ...x }))
  return (
    <div>
      <input value={p.name} onChange={e => patch({ name: e.target.value })} className="w-full h-12 px-4 rounded-2xl bg-surface-2 outline-none font-semibold mb-3 focus:ring-2 ring-accent" placeholder="Nombre" />
      <BodyFields p={p} patch={patch} />
      <Button size="lg" full className="mt-3" onClick={async () => {
        const pace = p.goal === 'lose' && p.pace === 'fast' && !fastLossAllowed(p) ? 'normal' : p.pace
        await saveProfile({ name: p.name, sex: p.sex, birthYear: p.birthYear, birthDate: p.birthDate, heightCm: p.heightCm, weightKg: p.weightKg, bodyFatPct: p.bodyFatPct, pace }); onSaved()
      }}>Guardar</Button>
    </div>
  )
}

function GoalForm({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const [goal, setGoal] = useState<Goal>(profile.goal)
  const [pace, setPace] = useState<Pace>(profile.pace)
  const [activity, setActivity] = useState<Activity>(profile.activity)
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="font-bold mb-2">Objetivo</div>
        <div className="flex gap-2">{(Object.keys(GOAL_LABELS) as Goal[]).map(g => <button key={g} onClick={() => { setGoal(g); if (g === 'lose' && pace === 'fast' && !fastLossAllowed(profile)) setPace('normal') }} className={cx('press flex-1 p-3 rounded-2xl text-center', goal === g ? 'bg-accent text-white' : 'bg-surface-2')}><div className="text-2xl">{GOAL_LABELS[g].emoji}</div><div className="text-xs font-bold">{GOAL_LABELS[g].label}</div></button>)}</div>
      </div>
      <PacePicker p={{ ...profile, goal, pace }} onPace={setPace} />
      <div>
        <div className="font-bold mb-2">Actividad</div>
        <ActivityPicker value={activity} onChange={setActivity} />
      </div>
      <Button size="lg" full onClick={async () => { await saveProfile({ goal, pace, activity }); onSaved() }}>Guardar</Button>
    </div>
  )
}

function WeightForm({ current, onSaved }: { current: number; onSaved: (kg: number) => void }) {
  const [kg, setKg] = useState(current)
  return (
    <div>
      <div className="text-center text-5xl font-extrabold tabular my-4">{kg.toFixed(1).replace('.', ',')}<span className="text-xl text-ink-3 ml-1">kg</span></div>
      <input type="range" min={35} max={200} step={0.1} value={kg} onChange={e => setKg(Number(e.target.value))} className="w-full accent-[var(--accent)] h-8 mb-2" />
      <div className="flex justify-center gap-2 mb-4">
        {[-1, -0.5, -0.1, 0.1, 0.5, 1].map(d => <button key={d} onClick={() => setKg(Math.round((kg + d) * 10) / 10)} className="press h-9 px-3 rounded-xl bg-surface-2 text-sm font-bold tabular">{d > 0 ? '+' : ''}{d}</button>)}
      </div>
      <Button size="lg" full onClick={() => onSaved(Math.round(kg * 10) / 10)}>Guardar peso</Button>
    </div>
  )
}

function OverridesForm({ profile, computed, onSaved }: { profile: Profile; computed: { kcal: number; protein: number; fat: number; carbs: number }; onSaved: () => void }) {
  const [o, setO] = useState({ kcal: profile.overrides?.kcal ?? computed.kcal, protein: profile.overrides?.protein ?? computed.protein, fat: profile.overrides?.fat ?? computed.fat })
  const carbs = Math.max(0, Math.round((o.kcal - o.protein * 4 - o.fat * 9) / 4))
  return (
    <div>
      <p className="text-sm text-ink-2 mb-3">Si tu nutricionista te ha dado cifras concretas, ponlas aquí. Los carbohidratos se calculan con el resto.</p>
      <Field label="Calorías" value={o.kcal} onChange={v => setO({ ...o, kcal: v })} unit="kcal" min={1000} max={5000} step={10} />
      <Field label="Proteína" value={o.protein} onChange={v => setO({ ...o, protein: v })} unit="g" min={40} max={300} step={5} />
      <Field label="Grasa" value={o.fat} onChange={v => setO({ ...o, fat: v })} unit="g" min={20} max={200} step={5} />
      <div className="text-sm font-semibold text-ink-2 mb-4">Carbohidratos resultantes: <b className="text-ink">{carbs} g</b></div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={async () => { await saveProfile({ overrides: undefined }); onSaved() }}><RotateCcw size={16} /> Automático</Button>
        <Button full onClick={async () => { await saveProfile({ overrides: { kcal: o.kcal, protein: o.protein, fat: o.fat, carbs } }); onSaved() }}>Guardar</Button>
      </div>
    </div>
  )
}

function WeightChart({ data }: { data: { date: string; kg: number }[] }) {
  const w = 320, h = 90, pad = 8
  const last = data.slice(-30)
  const min = Math.min(...last.map(d => d.kg)) - 0.5
  const max = Math.max(...last.map(d => d.kg)) + 0.5
  const pts = last.map((d, i) => [pad + (i / Math.max(1, last.length - 1)) * (w - pad * 2), h - pad - ((d.kg - min) / (max - min)) * (h - pad * 2)] as const)
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  return (
    <div className="mt-3">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24">
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={3} fill="var(--accent)" />)}
      </svg>
      <div className="flex justify-between text-[10px] text-ink-3 tabular"><span>{last[0].date.slice(5)}</span><span>{last[last.length - 1].kg} kg</span></div>
    </div>
  )
}
