import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AssessmentPage from './pages/AssessmentPage'
import SchoolsPage from './pages/SchoolsPage'
import SchoolDetailPage from './pages/SchoolDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/assess" element={<AssessmentPage />} />
        <Route path="/schools" element={<SchoolsPage />} />
        <Route path="/schools/:id" element={<SchoolDetailPage />} />
      </Routes>
    </BrowserRouter>
  )
}
