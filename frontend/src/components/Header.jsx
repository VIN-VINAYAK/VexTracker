import { Activity, Bot, ChevronDown, LogOut, Shield, Stethoscope, User, Users } from 'lucide-react'
import { useState } from 'react'

export function Header({ user, onLogout, onSwitchDemo, onOpenAI }) {
  const [showRoleMenu, setShowRoleMenu] = useState(false)

  const roleColors = {
    parent: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    doctor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    admin: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  }

  const roleIcons = {
    parent: Users,
    doctor: Stethoscope,
    admin: Shield,
  }

  const RoleIcon = roleIcons[user?.role] || User

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <Activity className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">VexTracker</span>
              <span className="rounded-md bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-cyan-300 ring-1 ring-cyan-500/30">
                AI
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 hidden sm:block">
              Clinical Pediatric Immunization Platform
            </p>
          </div>
        </div>

        {/* Right Nav & Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* AI Clinical Assistant Trigger */}
          <button
            onClick={onOpenAI}
            className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/60 to-emerald-950/60 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:border-cyan-400 hover:text-white transition shadow-sm"
          >
            <Bot className="h-4 w-4 text-cyan-400 animate-pulse" />
            <span>AI Assistant</span>
          </button>

          {/* Quick Demo Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <span>Demo Roles</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-xl shadow-slate-950/60 z-50">
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Switch Active Role
                </p>
                <button
                  onClick={() => {
                    onSwitchDemo('parent@vextracker.ai', 'password123')
                    setShowRoleMenu(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
                >
                  <Users className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-white">Maya Patel</p>
                    <p className="text-[10px] text-slate-400">Parent Dashboard</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onSwitchDemo('doctor@vextracker.ai', 'password123')
                    setShowRoleMenu(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
                >
                  <Stethoscope className="h-4 w-4 text-cyan-400" />
                  <div>
                    <p className="font-semibold text-white">Dr. Priya Shah, MD</p>
                    <p className="text-[10px] text-slate-400">Doctor & QR Verifier</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onSwitchDemo('admin@vextracker.ai', 'password123')
                    setShowRoleMenu(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
                >
                  <Shield className="h-4 w-4 text-indigo-400" />
                  <div>
                    <p className="font-semibold text-white">Alicia Grant</p>
                    <p className="text-[10px] text-slate-400">Healthcare Administrator</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* User Badge */}
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/90 py-1.5 px-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-200">
              <RoleIcon className="h-4 w-4" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-white leading-tight">{user.full_name}</p>
              <span
                className={`inline-block text-[10px] font-semibold uppercase tracking-wider rounded px-1.5 py-0.2 border ${
                  roleColors[user.role] || 'text-slate-400 border-slate-700'
                }`}
              >
                {user.role}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            title="Log Out"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
