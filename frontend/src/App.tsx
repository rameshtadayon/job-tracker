import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { api, UNAUTHORIZED_EVENT } from './api'
import ApplicationDetail from './pages/ApplicationDetail'
import ApplicationsList from './pages/ApplicationsList'
import LoginPage from './pages/LoginPage'
import type { User } from './types'

export default function App() {
  // undefined = still checking the session, null = logged out.
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    api.auth
      .me()
      .then(setUser)
      .catch(() => setUser(null))
    const onUnauthorized = () => setUser(null)
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  async function handleLogout() {
    await api.auth.logout().catch(() => {})
    setUser(null)
  }

  if (user === undefined) return null
  if (user === null) return <LoginPage onLogin={setUser} />

  return (
    <>
      <div className="session-bar">
        <span>{user.email}</span>
        <button onClick={handleLogout}>Log out</button>
      </div>
      <Routes>
        <Route path="/" element={<ApplicationsList />} />
        <Route path="/applications/:id" element={<ApplicationDetail />} />
      </Routes>
    </>
  )
}
