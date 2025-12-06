import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
<<<<<<< HEAD
import { AudioProvider } from './context/AudioContext.jsx'
=======
>>>>>>> 79d52c792460071028c6ce6892c6a03c21402ae7

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
<<<<<<< HEAD
      <AudioProvider>
        <App />
      </AudioProvider>
=======
      <App />
>>>>>>> 79d52c792460071028c6ce6892c6a03c21402ae7
    </ErrorBoundary>
  </StrictMode>,
)
