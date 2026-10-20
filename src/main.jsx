import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { applyTheme } from './lib/prefs'
import './assets/index.css'
import { startWarmup } from './lib/warmup'
import { installLeveler } from './lib/audioLeveler'
import './assets/index.css'

applyTheme(); // set light/dark before the first paint
startWarmup();
installLeveler();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)