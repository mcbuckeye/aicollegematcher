import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AssessmentPage from './pages/AssessmentPage'
import SchoolsPage from './pages/SchoolsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/assess" element={<AssessmentPage />} />
        <Route path="/schools" element={<SchoolsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
