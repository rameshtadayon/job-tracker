import { Route, Routes } from 'react-router-dom'
import ApplicationDetail from './pages/ApplicationDetail'
import ApplicationsList from './pages/ApplicationsList'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ApplicationsList />} />
      <Route path="/applications/:id" element={<ApplicationDetail />} />
    </Routes>
  )
}
