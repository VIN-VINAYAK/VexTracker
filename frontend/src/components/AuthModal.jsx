import { useState } from 'react'
import { Activity, Lock, Mail, Phone, Shield, Stethoscope, User, Users, ArrowRight } from 'lucide-react'

export function AuthModal({ onLogin, onRegister, loading, error }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    email: 'parent@vextracker.ai',
    password: 'password123',
    full_name: 'Maya Patel',
    phone: '+1-555-0101',
    role: 'parent',
  })

  const demoAccounts = [
    {
      role: 'parent',
      title: 'Parent Portal',
      name: 'Maya Patel',
      email: 'parent@vextracker.ai',
      desc: 'View child timeline, digital QR pass & pediatric reminders',
      icon: Users,
      badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
      btnColor: 'hover:border-emerald-500/50 hover:bg-emerald-500/10',
    },
    {
      role: 'doctor',
      title: 'Pediatric Doctor',
      name: 'Dr. Priya Shah, MD',
      email: 'doctor@vextracker.ai',
      desc: 'Verify QR passes, administer doses & sign clinical charts',
      icon: Stethoscope,
      badgeColor: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
      btnColor: 'hover:border-cyan-500/50 hover:bg-cyan-500/10',
    },
    {
      role: 'admin',
      title: 'System Admin',
      name: 'Alicia Grant',
      email: 'admin@vextracker.ai',
      desc: 'AI dropout forecasting, vaccine inventory & cold-chain audit',
      icon: Shield,
      badgeColor: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400',
      btnColor: 'hover:border-indigo-500/50 hover:bg-indigo-500/10',
    },
  ]

  const handleDemoClick = (email) => {
    onLogin(email, 'password123')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (mode === 'login') {
      onLogin(form.email, form.password)
    } else {
      onRegister(form)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl relative z-10 grid gap-8 md:grid-cols-12 items-center">
        {/* Left Side: Brand and 1-Click Demo Login Cards */}
        <div className="md:col-span-6 space-y-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-500 p-0.5 shadow-xl shadow-cyan-500/20">
                <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
                  <Activity className="h-6 w-6 text-cyan-400" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white">VexTracker AI</h1>
                <p className="text-xs font-medium text-cyan-400">Next-Gen Pediatric Immunization Platform</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed">
              Deterministic vaccination engine, cryptographic QR health passes, cold-chain inventory, and RAG-powered
              pediatric AI guidance.
            </p>
          </div>

          {/* 1-Click Demo Profiles */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Instant 1-Click Demo Access
            </p>

            {demoAccounts.map((account) => {
              const Icon = account.icon
              return (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => handleDemoClick(account.email)}
                  disabled={loading}
                  className={`w-full group text-left rounded-2xl border border-slate-800 bg-slate-900/80 p-4 transition-all duration-200 hover:shadow-lg ${account.btnColor}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-200 group-hover:scale-105 transition">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{account.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${account.badgeColor}`}>
                            {account.title}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{account.desc}</p>
                      </div>
                    </div>

                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Side: Traditional Login / Register Form */}
        <div className="md:col-span-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
            {/* Toggle Switch */}
            <div className="flex rounded-xl border border-slate-800 bg-slate-950 p-1 mb-6">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                  mode === 'login' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
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
                    placeholder="name@vextracker.ai"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                      <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="+1-555-0101"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
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
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-emerald-400 transition disabled:opacity-50 mt-2"
              >
                {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In to Portal' : 'Register Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
