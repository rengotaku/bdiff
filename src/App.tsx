import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { DiffPage } from './pages/DiffPage'
import { DiffProvider } from './contexts/DiffContext'
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
          <DiffProvider>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/diff" element={<DiffPage />} />
              </Routes>
            </div>
          </DiffProvider>
        </ToastProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App