import type { Activity, Goal, Pace, Profile, Sex, Targets } from '@/data/types'
import type { NutrientKey } from '@/data/nutrients'

/**
 * Cálculo de necesidades energéticas y nutricionales.
 *
 * BMR (metabolismo basal):
 *  - Mifflin-St Jeor (1990): la ecuación con mejor precisión en población general
 *    según la ADA/Academy of Nutrition and Dietetics (±10 % en ~80 % de personas).
 *  - Katch-McArdle si se conoce el % de grasa corporal: usa masa magra y es más
 *    precisa en personas con composición corporal atípica (muy musculadas u obesas).
 *
 * Sobre la etnia: no existe hoy una ecuación validada con ajuste étnico que
 * supere a Mifflin-St Jeor de forma consistente; los estudios muestran ligeras
 * sobreestimaciones (~3-5 %) en población asiática. Si conoces tu % de grasa,
 * Katch-McArdle elimina gran parte de ese sesgo. Ver docs/GUIA-DESARROLLO.md.
 *
 * TDEE = BMR × factor de actividad.
 * Micronutrientes: valores de referencia EFSA (DRV, población adulta europea).
 */

export const ACTIVITY_FACTORS: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

export const ACTIVITY_LABELS: Record<Activity, { label: string; desc: string; example: string; emoji: string }> = {
  sedentary: { label: 'Sedentario', desc: 'Trabajo sentado y casi nada de ejercicio', example: 'Oficina o estudios, te mueves en coche, menos de 5.000 pasos al día', emoji: '🛋️' },
  light: { label: 'Ligero', desc: 'Caminas bastante o entrenas suave 1-3 días por semana', example: 'Paseos diarios, yoga, pilates, bici tranquila, gimnasio sin acabar sudando', emoji: '🚶' },
  moderate: { label: 'Moderado', desc: 'Entrenas 3-5 días por semana con esfuerzo real', example: 'Gimnasio, correr, fútbol, natación, pádel… sesiones de 45-60 min en las que sudas', emoji: '🏃' },
  active: { label: 'Activo', desc: 'Entrenas fuerte 6-7 días o tu trabajo es físico', example: 'Obra, reparto, hostelería + entreno; o entrenos intensos casi a diario', emoji: '🏋️' },
  very_active: { label: 'Muy activo', desc: 'Trabajo físico duro y además entrenas a diario', example: 'Deportista de competición, doble sesión, trabajo de carga todo el día', emoji: '🔥' },
}

export const GOAL_LABELS: Record<Goal, { label: string; desc: string; emoji: string }> = {
  lose: { label: 'Perder grasa', desc: 'Déficit calórico controlado', emoji: '🔥' },
  maintain: { label: 'Mantener', desc: 'Comer lo que gastas', emoji: '⚖️' },
  gain: { label: 'Ganar músculo', desc: 'Superávit moderado', emoji: '💪' },
}

export const PACE_LABELS: Record<Pace, { label: string; desc: string }> = {
  slow: { label: 'Suave', desc: '≈ 0,25 kg / semana' },
  normal: { label: 'Normal', desc: '≈ 0,5 kg / semana' },
  fast: { label: 'Rápido', desc: '≈ 0,75 kg / semana' },
}

/** Explicación de cada ritmo según el objetivo: qué implica, ventajas e inconvenientes */
export const PACE_INFO: Record<'lose' | 'gain', Record<Pace, { rate: string; kcal: string; pros: string; cons: string }>> = {
  lose: {
    slow: { rate: '≈ 0,25 kg/semana', kcal: '−250 kcal/día', pros: 'Casi no se nota el hambre, conservas toda la fuerza y el músculo. El que mejor se mantiene en el tiempo.', cons: 'Los resultados tardan más en verse.' },
    normal: { rate: '≈ 0,5 kg/semana', kcal: '−500 kcal/día', pros: 'El equilibrio recomendado: resultados visibles en pocas semanas sin pasar hambre.', cons: 'Conviene mantener la proteína alta y entrenar fuerza para no perder músculo.' },
    fast: { rate: '≈ 0,75 kg/semana', kcal: '−750 kcal/día', pros: 'Más rápido. Tiene sentido solo con bastante grasa que perder y durante pocas semanas.', cons: 'Más hambre y menos energía para entrenar; parte del peso perdido puede ser músculo. No se recomienda si estás cerca de un peso normal.' },
  },
  gain: {
    slow: { rate: '≈ 0,15 kg/semana', kcal: '+150 kcal/día', pros: 'Ganancia "limpia": casi todo lo que subes es músculo, muy poca grasa.', cons: 'Es lento; requiere paciencia y constancia en el entreno.' },
    normal: { rate: '≈ 0,3 kg/semana', kcal: '+300 kcal/día', pros: 'Buen ritmo para ganar músculo si entrenas fuerza 3+ días por semana.', cons: 'Acumularás algo de grasa que luego habrá que perder.' },
    fast: { rate: '≈ 0,45 kg/semana', kcal: '+450 kcal/día', pros: 'Solo si te cuesta mucho ganar peso (metabolismo muy alto, principiantes delgados).', cons: 'Una parte importante del peso será grasa; el músculo no se construye más rápido por comer más.' },
  },
}

/**
 * Perder peso "rápido" solo es razonable con reserva de grasa suficiente: IMC ≥ 25 o
 * % de grasa alto. Con menos, el déficit grande se come músculo y rendimiento.
 */
export function fastLossAllowed(p: Pick<Profile, 'sex' | 'weightKg' | 'heightCm' | 'bodyFatPct'>): boolean {
  if (p.bodyFatPct != null) return p.bodyFatPct >= (p.sex === 'male' ? 22 : 32)
  return bmi(p.weightKg, p.heightCm) >= 25
}

export function ageOf(p: Pick<Profile, 'birthYear' | 'birthDate'>, today = new Date()): number {
  if (p.birthDate) {
    const [y, m, d] = p.birthDate.split('-').map(Number)
    let age = today.getFullYear() - y
    if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--
    return Math.max(14, age)
  }
  return ageFromBirthYear(p.birthYear, today)
}

export function ageFromBirthYear(year: number, today = new Date()): number {
  return Math.max(14, today.getFullYear() - year)
}

export function mifflinStJeor(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return sex === 'male' ? base + 5 : base - 161
}

export function katchMcArdle(weightKg: number, bodyFatPct: number): number {
  const lbm = weightKg * (1 - bodyFatPct / 100)
  return 370 + 21.6 * lbm
}

export function bmi(weightKg: number, heightCm: number): number {
  const h = heightCm / 100
  return weightKg / (h * h)
}

export function computeTargets(p: Profile): Targets {
  const age = ageOf(p)
  const useKatch = p.bodyFatPct != null && p.bodyFatPct > 3 && p.bodyFatPct < 60
  const bmr = useKatch ? katchMcArdle(p.weightKg, p.bodyFatPct!) : mifflinStJeor(p.sex, p.weightKg, p.heightCm, age)
  const tdee = bmr * ACTIVITY_FACTORS[p.activity]

  // Ajuste según objetivo (kcal/día). 0,5 kg grasa/semana ≈ 500 kcal/día
  const paceDelta: Record<Pace, number> = { slow: 250, normal: 500, fast: 750 }
  let kcal = tdee
  if (p.goal === 'lose') kcal = tdee - paceDelta[p.pace]
  if (p.goal === 'gain') kcal = tdee + paceDelta[p.pace] * 0.6 // superávit más conservador para minimizar grasa
  // Suelo de seguridad: nunca por debajo del BMR ni de 1200/1500 kcal
  const floor = Math.max(bmr, p.sex === 'male' ? 1500 : 1200)
  kcal = Math.max(kcal, floor)

  // Proteína (g/kg) según objetivo — rangos de la ISSN (2017)
  const proteinPerKg: Record<Goal, number> = { lose: 2.0, maintain: 1.6, gain: 1.8 }
  const refWeight = useKatch ? p.weightKg * (1 - p.bodyFatPct! / 100) / 0.8 : p.weightKg // si hay mucho % graso, referencia a peso "magro ajustado"
  const protein = Math.round(proteinPerKg[p.goal] * Math.min(p.weightKg, refWeight))
  // Grasa: 25-30 % de kcal (mín. 0,7 g/kg para función hormonal)
  const fat = Math.round(Math.max(0.7 * p.weightKg, kcal * 0.28 / 9))
  const carbs = Math.round(Math.max(50, (kcal - protein * 4 - fat * 9) / 4))

  const micros = microTargets(p.sex, age, kcal)
  const t: Targets = { bmr: Math.round(bmr), tdee: Math.round(tdee), kcal: Math.round(kcal), protein, fat, carbs, micros }
  if (p.overrides) {
    if (p.overrides.kcal) t.kcal = p.overrides.kcal
    if (p.overrides.protein) t.protein = p.overrides.protein
    if (p.overrides.fat) t.fat = p.overrides.fat
    if (p.overrides.carbs) t.carbs = p.overrides.carbs
    else if (p.overrides.kcal || p.overrides.protein || p.overrides.fat) t.carbs = Math.round(Math.max(50, (t.kcal - t.protein * 4 - t.fat * 9) / 4))
  }
  return t
}

/**
 * Valores de referencia EFSA para adultos (PRI/AI). Cuando el valor depende de
 * la energía (B1, B3) se calcula a partir de las kcal objetivo.
 */
export function microTargets(sex: Sex, age: number, kcal: number): Partial<Record<NutrientKey, number>> {
  const m = sex === 'male'
  const MJ = kcal * 4.184 / 1000
  return {
    fiber: 25,
    vitA: m ? 750 : 650,
    vitC: m ? 110 : 95,
    vitD: 15,
    vitE: m ? 13 : 11,
    vitK: 70,
    b1: Math.round(0.1 * MJ * 100) / 100,
    b2: 1.6,
    b3: Math.round(1.6 * MJ * 10) / 10,
    b5: 5,
    b6: m ? 1.7 : 1.6,
    b9: 330,
    b12: 4,
    choline: 400,
    calcium: age < 25 ? 1000 : 950,
    iron: m ? 11 : age >= 50 ? 11 : 16,
    magnesium: m ? 350 : 300,
    phosphorus: 550,
    potassium: 3500,
    zinc: m ? 11 : 8.5,
    copper: m ? 1.6 : 1.3,
    manganese: 3,
    selenium: 70,
    iodine: 150,
    omega3: m ? 1.6 : 1.1,
    // límites
    sodium: 2000,
    // Azúcares totales (las bases no distinguen los libres de los de fruta/leche): 15 % kcal
    sugar: Math.round(kcal * 0.15 / 4),
    satFat: Math.round(kcal * 0.10 / 9),
    chol: 300,
  }
}

export function idealWeightRange(heightCm: number): [number, number] {
  const h = heightCm / 100
  return [Math.round(18.5 * h * h), Math.round(24.9 * h * h)]
}
