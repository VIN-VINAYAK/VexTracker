import { useState, useEffect } from 'react'
import { api, setToken, getToken } from './services/api'
import { Header } from './components/Header'
import { AuthModal } from './components/AuthModal'
import { ParentDashboard } from './components/ParentDashboard'
import { DoctorDashboard } from './components/DoctorDashboard'
import { AdminDashboard } from './components/AdminDashboard'
import { AIAssistant } from './components/AIAssistant'

export function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [showAI, setShowAI] = useState(false)

  // Verify stored session on boot
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }

    api
      .me()
      .then((userData) => {
        setUser(userData)
      })
      .catch(() => {
        setToken('')
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const handleLogin = async (email, password) => {
    try {
      setLoading(true)
      setAuthError('')
      const data = await api.login(email, password)
      setToken(data.access_token)
      const profile = await api.me()
      setUser(profile)
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please verify credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (payload) => {
    try {
      setLoading(true)
      setAuthError('')
      await api.register(payload)
      // Auto login right after register
      await handleLogin(payload.email, payload.password)
    } catch (err) {
      setAuthError(err.message || 'Registration failed.')
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setToken('')
    setUser(null)
  }

  const handleSwitchDemo = async (email, password) => {
    await handleLogin(email, password)
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          <p className="text-xs uppercase tracking-widest text-slate-400">Loading VexTracker AI...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <AuthModal
        onLogin={handleLogin}
        onRegister={handleRegister}
        loading={loading}
        error={authError}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        user={user}
        onLogout={handleLogout}
        onSwitchDemo={handleSwitchDemo}
        onOpenAI={() => setShowAI(true)}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        {user.role === 'parent' && <ParentDashboard onOpenAI={() => setShowAI(true)} />}
        {user.role === 'doctor' && <DoctorDashboard currentUser={user} onOpenAI={() => setShowAI(true)} />}
        {user.role === 'admin' && <AdminDashboard currentUser={user} onOpenAI={() => setShowAI(true)} />}
      </main>

      <AIAssistant isOpen={showAI} onClose={() => setShowAI(false)} />
    </div>
  )
}

export default App
