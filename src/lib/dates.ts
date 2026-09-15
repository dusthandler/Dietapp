export function dateKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, n: number): string {
  const d = parseKey(key)
  d.setDate(d.getDate() + n)
  return dateKey(d)
}

const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export function formatDay(key: string): string {
  const today = dateKey()
  if (key === today) return 'Hoy'
  if (key === addDays(today, -1)) return 'Ayer'
  if (key === addDays(today, 1)) return 'Mañana'
  const d = parseKey(key)
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export function formatShort(key: string): string {
  const d = parseKey(key)
  return `${DAYS_SHORT[d.getDay()]} ${d.getDate()}`
}

/** Índice de día de la semana con lunes = 0 */
export function weekdayIndex(key: string): number {
  return (parseKey(key).getDay() + 6) % 7
}

export const WEEKDAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
export const WEEKDAY_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export function startOfWeek(key: string): string {
  return addDays(key, -weekdayIndex(key))
}

export function hourNow(): number {
  const d = new Date()
  return d.getHours() + d.getMinutes() / 60
}
