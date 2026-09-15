import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'

// Actualización automática: comprueba cada minuto y, cuando hay versión nueva, el SW toma el control y la página se recarga
registerSW({ immediate: true, onRegisteredSW(_url, r) { if (r) setInterval(() => r.update(), 60 * 1000) } })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
