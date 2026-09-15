import { useEffect, useSyncExternalStore } from 'react'

export type ThemeMode = 'system' | 'light' | 'dark'
const KEY = 'dietapp.theme'
const listeners = new Set<() => void>()

export function getThemeMode(): ThemeMode {
  try { return (localStorage.getItem(KEY) as ThemeMode) || 'system' } catch { return 'system' }
}

export function setThemeMode(mode: ThemeMode) {
  try { localStorage.setItem(KEY, mode) } catch { /* noop */ }
  apply()
  listeners.forEach(l => l())
}

function apply() {
  const mode = getThemeMode()
  const dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', dark ? '#15120F' : '#FFF8F0')
}

export function useTheme(): ThemeMode {
  const mode = useSyncExternalStore(cb => { listeners.add(cb); return () => { listeners.delete(cb) } }, getThemeMode)
  useEffect(() => {
    apply()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const h = () => apply()
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  return mode
}
