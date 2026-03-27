import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from './contexts/AuthContext'
import LandingPage from './pages/LandingPage'
import AssessmentPage from './pages/AssessmentPage'
import SchoolsPage from './pages/SchoolsPage'
import SchoolDetailPage from './pages/SchoolDetailPage'
import ChatPage from './pages/ChatPage'
import EssayPage from './pages/EssayPage'
import FinancialAidPage from './pages/FinancialAidPage'

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/assess" element={<AssessmentPage />} />
            <Route path="/schools" element={<SchoolsPage />} />
            <Route path="/schools/:id" element={<SchoolDetailPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/essay" element={<EssayPage />} />
            <Route path="/financial-aid" element={<FinancialAidPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  )
}
