import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { HomePage } from './pages/HomePage'
import { DiffPage } from './pages/DiffPage'
import { DiffProvider } from './contexts/DiffContext'
import { ToastProvider } from './components/common/Toast'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { HreflangTags } from './components/common/HreflangTags'

const supportedLanguages = ['ja', 'en', 'ko', 'zh-TW', 'zh-CN', 'id', 'fr', 'de']

/**
 * Language wrapper component that updates i18n based on URL path
 */
function LanguageWrapper({ children }: { children: React.ReactNode }) {
  const { lang } = useParams<{ lang: string }>()
  const { i18n } = useTranslation()

  useEffect(() => {
    if (lang && supportedLanguages.includes(lang) && i18n.language !== lang) {
      i18n.changeLanguage(lang)
    }
  }, [lang, i18n])

  return <>{children}</>
}

/**
 * Main application component with routing and global providers
 */
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <HreflangTags />
        <ToastProvider>
          <DiffProvider>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                {/* Default route - redirect to /ja/ */}
                <Route path="/" element={<Navigate to="/ja/" replace />} />

                {/* Language-prefixed routes */}
                <Route path="/:lang" element={<LanguageWrapper><HomePage /></LanguageWrapper>} />
                <Route path="/:lang/" element={<LanguageWrapper><HomePage /></LanguageWrapper>} />
                <Route path="/:lang/diff" element={<LanguageWrapper><DiffPage /></LanguageWrapper>} />
              </Routes>
            </div>
          </DiffProvider>
        </ToastProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App