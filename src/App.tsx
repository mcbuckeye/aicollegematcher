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
import StrategyPage from './pages/StrategyPage'
import ComparePage from './pages/ComparePage'
import ParentDashboardPage from './pages/ParentDashboardPage'
import DecisionPage from './pages/DecisionPage'

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
            <Route path="/strategy" element={<StrategyPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/parent-dashboard" element={<ParentDashboardPage />} />
            <Route path="/decide" element={<DecisionPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  )
}
