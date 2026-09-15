import { useEffect } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { Apple, BookOpen, CalendarDays, ShoppingBasket, Sun, UserRound } from 'lucide-react'
import { ToastProvider, cx } from '@/components/ui'
import { useCatalogReady, useProfile } from '@/store/hooks'
import { useTheme } from '@/lib/theme'
import Onboarding from '@/features/onboarding/Onboarding'
import Today from '@/features/today/Today'
import Recipes from '@/features/recipes/Recipes'
import Plans from '@/features/plans/Plans'
import Shopping from '@/features/shopping/Shopping'
import ProfilePage from '@/features/profile/Profile'
import FoodsPage from '@/features/foods/FoodsPage'

const TABS = [
  { to: '/', label: 'Hoy', icon: Sun },
  { to: '/recetas', label: 'Recetas', icon: BookOpen },
  { to: '/planes', label: 'Dietas', icon: CalendarDays },
  { to: '/compra', label: 'Compra', icon: ShoppingBasket },
  { to: '/alimentos', label: 'Alimentos', icon: Apple },
  { to: '/perfil', label: 'Perfil', icon: UserRound },
]

export default function App() {
  useTheme()
  const ready = useCatalogReady()
  const profile = useProfile()
  const loc = useLocation()

  useEffect(() => { window.scrollTo({ top: 0 }) }, [loc.pathname])

  if (profile === undefined || !ready) return <Splash />

  const needsOnboarding = !profile || !profile.onboarded

  return (
    <ToastProvider>
      {needsOnboarding ? (
        <Routes>
          <Route path="*" element={<Onboarding />} />
        </Routes>
      ) : (
        <div className="min-h-dvh md:flex">
          <SideRail />
          <main className="flex-1 min-w-0 pb-24 md:pb-8">
            <div className={cx('mx-auto px-4 sm:px-6 pt-3 safe-top', loc.pathname === '/' ? 'max-w-2xl lg:max-w-6xl' : 'max-w-2xl')}>
              <Routes>
                <Route path="/" element={<Today />} />
                <Route path="/recetas" element={<Recipes />} />
                <Route path="/planes" element={<Plans />} />
                <Route path="/compra" element={<Shopping />} />
                <Route path="/alimentos" element={<FoodsPage />} />
                <Route path="/perfil" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
          <TabBar />
        </div>
      )}
    </ToastProvider>
  )
}

function Splash() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 text-center px-6">
      <div className="text-6xl animate-pop">🥑</div>
      <div className="text-2xl font-extrabold tracking-tight">Dietapp</div>
      <div className="text-ink-2 text-sm">Cargando la base de alimentos…</div>
      <div className="w-40 h-2 rounded-full skeleton" />
    </div>
  )
}

function TabBar() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl border-t border-line safe-bottom">
      <div className="flex justify-around items-stretch h-16">
        {TABS.map(t => (
          <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) =>
            cx('press flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold', isActive ? 'text-accent' : 'text-ink-3')}>
            {({ isActive }) => (
              <>
                <span className={cx('rounded-2xl px-4 py-1 transition-colors', isActive && 'bg-accent-soft')}>
                  <t.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </span>
                {t.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function SideRail() {
  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 sticky top-0 h-dvh border-r border-line bg-surface/60 backdrop-blur px-3 py-5 gap-1">
      <div className="flex items-center gap-2 px-3 mb-4">
        <span className="text-2xl">🥑</span>
        <span className="text-xl font-extrabold tracking-tight">Dietapp</span>
      </div>
      {TABS.map(t => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) =>
          cx('press flex items-center gap-3 px-3 h-11 rounded-2xl font-semibold', isActive ? 'bg-accent-soft text-accent-ink' : 'text-ink-2 hover:bg-surface-2')}>
          <t.icon size={20} />{t.label}
        </NavLink>
      ))}
      <div className="mt-auto px-3 text-[11px] text-ink-3">Datos: USDA · CIQUAL · EFSA</div>
    </aside>
  )
}
