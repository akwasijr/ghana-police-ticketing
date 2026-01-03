import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { db } from '@/lib/database/db'
import { syncService } from '@/lib/sync/sync-service'

// Initialize database
db.open().then(() => {
  console.log('[App] Database initialized')
}).catch((error) => {
  console.error('[App] Database initialization failed:', error)
})

// Initialize PWA - handled by vite-plugin-pwa

// Start auto-sync
syncService.startAutoSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

