import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { applyTheme } from './lib/prefs'
import './assets/index.css'

applyTheme(); // set light/dark before the first paint

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)