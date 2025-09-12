import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { DiffPage } from './pages/DiffPage'
import { HistoryPage } from './pages/HistoryPage'
import { DiffProvider } from './contexts/DiffContext'
import { HistoryProvider } from './contexts/HistoryContext'
import { ToastProvider } from './components/common/Toast'
import { ErrorBoundary } from './components/common/ErrorBoundary'

/**
 * Main application component with routing and global providers
 */
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ToastProvider>
          <HistoryProvider>
            <DiffProvider>
              <div className="min-h-screen bg-gray-50">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/diff" element={<DiffPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                </Routes>
              </div>
            </DiffProvider>
          </HistoryProvider>
        </ToastProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App