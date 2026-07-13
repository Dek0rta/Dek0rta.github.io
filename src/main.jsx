import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { LangProvider } from './i18n.jsx'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </StrictMode>,
)
