import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import LandingPage from './pages/LandingPage'
import AssessmentPage from './pages/AssessmentPage'
import SchoolsPage from './pages/SchoolsPage'
import SchoolDetailPage from './pages/SchoolDetailPage'
import ChatPage from './pages/ChatPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/assess" element={<AssessmentPage />} />
          <Route path="/schools" element={<SchoolsPage />} />
          <Route path="/schools/:id" element={<SchoolDetailPage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
