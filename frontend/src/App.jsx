import { useEffect, useMemo, useState } from 'react'

const NAV_ITEMS = ['overview', 'children', 'timeline', 'assistant']

const badgeStyles = {
  Completed: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40',
  Upcoming: 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40',
  Overdue: 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/40',
  Normal: 'bg-slate-500/20 text-slate-200 ring-1 ring-slate-400/40',
  High: 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-400/40',
  Critical: 'bg-red-500/20 text-red-300 ring-1 ring-red-400/40',
}

const defaultQuestion = 'What does a routine vaccine schedule usually include?'

const emptyChildForm = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  gender: 'Male',
  notes: '',
}

function App() {
  const [authMode, setAuthMode] = useState('login')
  const [role, setRole] = useState('parent')
  const [form, setForm] = useState({
    full_name: 'Maya Patel',
    email: 'parent@vextracker.ai',
    password: 'password123',
    phone: '+1-555-0101',
  })
  const [newChild, setNewChild] = useState(emptyChildForm)
  const [token, setToken] = useState(localStorage.getItem('vextracker_token') || '')
  const [me, setMe] = useState(null)
  const [children, setChildren] = useState([])
  const [selectedChildId, setSelectedChildId] = useState('')
  const [timeline, setTimeline] = useState([])
  const [question, setQuestion] = useState(defaultQuestion)
  const [answer, setAnswer] = useState('')
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [activeMenu, setActiveMenu] = useState('overview')

  const roleOptions = useMemo(() => ['parent', 'doctor', 'admin'], [])
  const selectedChild = children.find((child) => child.id === selectedChildId) || null
  const upcomingCount = timeline.filter((item) => item.status !== 'Completed').length
  const completedCount = timeline.filter((item) => item.status === 'Completed').length

  const fetchChildren = async () => {
    if (!token || !me) return
    try {
      const response = await fetch('http://localhost:8000/parent/children', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (!Array.isArray(data)) return
      setChildren(data)
      if (data.length && !selectedChildId) {
        setSelectedChildId(data[0].id)
      }
      if (data.length && selectedChildId && !data.some((item) => item.id === selectedChildId)) {
        setSelectedChildId(data[0].id)
      }
    } catch (error) {
      setChildren([])
    }
  }

  const fetchTimeline = async (childId) => {
    if (!token || !childId) return
    try {
      const response = await fetch(`http://localhost:8000/parent/children/${childId}/timeline`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setTimeline(data.items || [])
    } catch (error) {
      setTimeline([])
    }
  }

  useEffect(() => {
    if (!token) {
      setMe(null)
      setChildren([])
      setTimeline([])
      return
    }

    fetch('http://localhost:8000/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error('Unauthorized')))
      .then((data) => setMe(data))
      .catch(() => {
        setToken('')
        localStorage.removeItem('vextracker_token')
      })
  }, [token])

  useEffect(() => {
    if (!token || !me) return
    fetchChildren()
  }, [token, me])

  useEffect(() => {
    if (!token || !selectedChildId) return
    fetchTimeline(selectedChildId)
  }, [token, selectedChildId])

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus('')

    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register'
      const payload = authMode === 'login'
        ? { email: form.email, password: form.password }
        : { full_name: form.full_name, email: form.email, password: form.password, phone: form.phone, role }

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed')
      }

      if (authMode === 'login') {
        setToken(data.access_token)
        localStorage.setItem('vextracker_token', data.access_token)
        setStatus('Logged in successfully.')
      } else {
        setAuthMode('login')
        setStatus('Account created. You can log in now.')
      }
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddChild = async (e) => {
    e.preventDefault()
    if (!token) return

    try {
      setLoading(true)
      const response = await fetch('http://localhost:8000/parent/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: newChild.first_name,
          last_name: newChild.last_name,
          date_of_birth: newChild.date_of_birth,
          gender: newChild.gender,
          notes: newChild.notes,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Could not create child profile')
      }

      setNewChild(emptyChildForm)
      setStatus('Child profile created successfully.')
      await fetchChildren()
      setSelectedChildId(data.id)
      setActiveMenu('timeline')
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAskAssistant = async () => {
    if (!question.trim()) return
    setLoading(true)
    setAnswer('')
    setSource('')

    try {
      const response = await fetch('http://localhost:8000/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const data = await response.json()
      setAnswer(data.answer || 'I do not have verified information on that.')
      setSource(data.source_snippet || 'N/A')
    } catch (error) {
      setAnswer('I do not have verified information on that.')
      setSource('API unavailable')
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setToken('')
    setMe(null)
    setChildren([])
    setTimeline([])
    setSelectedChildId('')
    setActiveMenu('overview')
    localStorage.removeItem('vextracker_token')
  }

  if (!token || !me) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/40">
          <div className="mb-6 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">VexTracker AI</p>
            <h1 className="mt-3 text-3xl font-bold">Secure access</h1>
          </div>

          <div className="mb-6 flex rounded-lg border border-slate-700 bg-slate-950 p-1">
            <button
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${authMode === 'login' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'}`}
              onClick={() => setAuthMode('login')}
            >
              Login
            </button>
            <button
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${authMode === 'register' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'}`}
              onClick={() => setAuthMode('register')}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="mb-1 block text-sm text-slate-300">Full name</label>
                <input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm text-slate-300">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              />
            </div>

            {authMode === 'register' && (
              <div>
                <label className="mb-1 block text-sm text-slate-300">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                />
              </div>
            )}

            {authMode === 'register' && (
              <div>
                <label className="mb-1 block text-sm text-slate-300">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                >
                  {roleOptions.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm text-slate-300">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              />
            </div>

            {status && <p className="text-sm text-cyan-300">{status}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60"
            >
              {loading ? 'Working...' : authMode === 'login' ? 'Login' : 'Create account'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 lg:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl shadow-slate-950/20">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">VexTracker AI</p>
              <h1 className="mt-3 text-2xl font-bold text-white">Menu</h1>
            </div>

            <nav className="space-y-2">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setActiveMenu(item)}
                  className={`w-full rounded-xl px-3 py-3 text-left text-sm font-medium capitalize transition ${activeMenu === item ? 'bg-cyan-500 text-slate-950' : 'bg-slate-950 text-slate-200 hover:bg-slate-800'}`}
                >
                  {item === 'assistant' ? 'AI Assistant' : item}
                </button>
              ))}
            </nav>

            <div className="mt-8 rounded-xl border border-slate-700 bg-slate-950 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Profile</p>
              <div className="mt-3 font-medium text-slate-100">{me.full_name}</div>
              <div className="text-sm text-slate-400">{me.role}</div>
            </div>
          </aside>

          <section className="space-y-6">
            <header className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">{me.role} portal</p>
                <h2 className="mt-2 text-3xl font-bold">Dashboard</h2>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-sm text-slate-300">
                  {children.length} child{children.length === 1 ? '' : 'ren'}
                </span>
                <button
                  onClick={logout}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                >
                  Logout
                </button>
              </div>
            </header>

            {status && (
              <div className="rounded-xl border border-cyan-800/60 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
                {status}
              </div>
            )}

            {activeMenu === 'overview' && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                    <p className="text-sm text-slate-400">Children</p>
                    <div className="mt-2 text-3xl font-bold text-white">{children.length}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                    <p className="text-sm text-slate-400">Completed</p>
                    <div className="mt-2 text-3xl font-bold text-emerald-300">{completedCount}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                    <p className="text-sm text-slate-400">Upcoming</p>
                    <div className="mt-2 text-3xl font-bold text-amber-300">{upcomingCount}</div>
                  </div>
                </div>

                <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-cyan-300">Child overview</h3>
                    {selectedChild && (
                      <button
                        type="button"
                        onClick={() => setActiveMenu('timeline')}
                        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                      >
                        View timeline
                      </button>
                    )}
                  </div>

                  {selectedChild ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                        <p className="text-sm text-slate-400">Selected child</p>
                        <div className="mt-2 text-xl font-semibold text-white">
                          {selectedChild.first_name} {selectedChild.last_name}
                        </div>
                        <p className="mt-2 text-sm text-slate-400">DOB: {selectedChild.date_of_birth}</p>
                        <p className="mt-2 text-sm text-slate-400">Gender: {selectedChild.gender || 'Not provided'}</p>
                      </div>

                      <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                        <p className="text-sm text-slate-400">Notes</p>
                        <p className="mt-2 text-sm text-slate-200">{selectedChild.notes || 'No notes added yet.'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400">Add a child to begin tracking vaccinations.</p>
                  )}
                </section>
              </div>
            )}

            {activeMenu === 'children' && (
              <div className="grid gap-6 xl:grid-cols-[1.1fr_2fr]">
                <form onSubmit={handleAddChild} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <h3 className="mb-4 text-xl font-semibold text-cyan-300">Add child</h3>

                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm text-slate-300">First name</label>
                        <input
                          value={newChild.first_name}
                          onChange={(e) => setNewChild({ ...newChild, first_name: e.target.value })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-slate-300">Last name</label>
                        <input
                          value={newChild.last_name}
                          onChange={(e) => setNewChild({ ...newChild, last_name: e.target.value })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm text-slate-300">Date of birth</label>
                        <input
                          type="date"
                          value={newChild.date_of_birth}
                          onChange={(e) => setNewChild({ ...newChild, date_of_birth: e.target.value })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-slate-300">Gender</label>
                        <select
                          value={newChild.gender}
                          onChange={(e) => setNewChild({ ...newChild, gender: e.target.value })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm text-slate-300">Notes</label>
                      <textarea
                        value={newChild.notes}
                        onChange={(e) => setNewChild({ ...newChild, notes: e.target.value })}
                        className="min-h-24 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save child profile'}
                    </button>
                  </div>
                </form>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <h3 className="mb-4 text-xl font-semibold text-cyan-300">Child list</h3>

                  <div className="space-y-3">
                    {children.length === 0 ? (
                      <p className="text-slate-400">No children enrolled yet.</p>
                    ) : (
                      children.map((child) => (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => {
                            setSelectedChildId(child.id)
                            setActiveMenu('timeline')
                          }}
                          className={`w-full rounded-xl border px-3 py-3 text-left ${selectedChildId === child.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-700 bg-slate-950'}`}
                        >
                          <div className="font-medium text-slate-100">{child.first_name} {child.last_name}</div>
                          <div className="text-xs text-slate-400">DOB: {child.date_of_birth}</div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeMenu === 'timeline' && (
              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-cyan-300">Vaccination timeline</h3>
                  {selectedChild && (
                    <span className="rounded-full border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-300">
                      Active child: {selectedChild.first_name}
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {!selectedChild ? (
                    <p className="text-slate-400">Select or add a child to view the timeline.</p>
                  ) : timeline.length === 0 ? (
                    <p className="text-slate-400">No vaccine timeline yet for this child.</p>
                  ) : (
                    timeline.map((item) => (
                      <article key={`${item.vaccine_name}-${item.due_date}`} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex items-center gap-3">
                              <h4 className="text-lg font-semibold text-white">{item.vaccine_name}</h4>
                              {item.dose_number ? (
                                <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-slate-300">
                                  Dose {item.dose_number}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-2 text-sm text-slate-400">Due: {item.due_date}</p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeStyles[item.status]}`}>
                              {item.status}
                            </span>
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeStyles[item.priority]}`}>
                              {item.priority}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 text-sm text-slate-300">
                          {item.administered_date ? `Administered on ${item.administered_date}` : 'Not yet administered'}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            )}

            {activeMenu === 'assistant' && (
              <section className="rounded-2xl border border-cyan-900/50 bg-slate-900 p-5">
                <h3 className="mb-3 text-xl font-semibold text-cyan-300">AI health assistant</h3>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-24 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-slate-100 outline-none"
                />
                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    onClick={handleAskAssistant}
                    className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
                    disabled={loading}
                  >
                    {loading ? 'Asking...' : 'Ask'}
                  </button>
                </div>

                {answer ? (
                  <div className="mt-5 rounded-lg border border-slate-700 bg-slate-950 p-4">
                    <p className="whitespace-pre-wrap text-slate-200">{answer}</p>
                    <div className="mt-4 border-t border-slate-800 pt-3 text-sm text-slate-400">
                      <span className="font-medium text-slate-300">Source:</span> {source}
                    </div>
                  </div>
                ) : null}
              </section>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

export default App
