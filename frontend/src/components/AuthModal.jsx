import { useState } from 'react'
import { Activity, Lock, Mail, Moon, Phone, ShieldCheck, Sun, User } from 'lucide-react'

export function AuthModal({ onLogin, onRegister, loading, error, theme, onToggleTheme }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'parent',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (mode === 'login') {
      onLogin(form.email, form.password)
    } else {
      onRegister({ ...form, phone: form.phone ? `+91 ${form.phone}` : '' })
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-slate-950 px-4 py-12">
      <button
        type="button"
        onClick={onToggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        className="absolute right-4 top-4 flex h-10 items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition sm:right-6 sm:top-6"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
      </button>
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
            <Activity className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">VexTracker AI</h1>
            <p className="text-xs text-slate-400">Immunization management</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-2xl sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">
              {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {mode === 'login'
                ? 'Access your secure healthcare workspace.'
                : 'Enter your details to get started.'}
            </p>
          </div>

            {/* Toggle Switch */}
            <div className="flex rounded-xl border border-slate-800 bg-slate-950 p-1 mb-6">
              <button
                type="button"
                onClick={() => setMode('login')}
                aria-pressed={mode === 'login'}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                  mode === 'login' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                aria-pressed={mode === 'register'}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                  mode === 'register' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      autoComplete="name"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="flex overflow-hidden rounded-xl border border-slate-800 bg-slate-950 focus-within:border-cyan-500">
                        <span className="flex items-center border-r border-slate-800 px-3 text-xs text-slate-400">+91</span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          pattern="[6-9][0-9]{9}"
                          title="Enter a valid 10-digit Indian mobile number"
                          placeholder="98765 43210"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                          autoComplete="tel-national"
                          className="w-full min-w-0 bg-transparent px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                        />
                      </div>
                    </div>
                      <p className="mt-1 text-[10px] text-slate-500">10-digit Indian mobile number</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
                      Platform Role
                    </label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="parent">Parent</option>
                      <option value="doctor">Pediatric Doctor</option>
                      <option value="admin">Healthcare Admin</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-cyan-400 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300 transition disabled:opacity-50 mt-2"
              >
                {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>
        </div>

        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5" />
          Secure access to your healthcare workspace
        </p>
      </div>
    </div>
  )
}
