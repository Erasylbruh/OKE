import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css' // Только один файл стилей
import App from './App.jsx'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)