import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { DiffPage } from './pages/DiffPage'
import { DiffProvider } from './contexts/DiffContext'

function App() {
  return (
    <Router>
      <DiffProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/diff" element={<DiffPage />} />
          </Routes>
        </div>
      </DiffProvider>
    </Router>
  )
}

export default App