import { useState, useEffect, useRef } from 'react'
import {
  Baby,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Plus,
  Bell,
  ChevronRight,
  Filter,
  FileText,
  Sparkles,
} from 'lucide-react'
import { api } from '../services/api'
import { DigitalPassModal } from './DigitalPassModal'
import { AddChildModal } from './AddChildModal'

export function ParentDashboard({ onOpenAI }) {
  const [children, setChildren] = useState([])
  const [selectedChildId, setSelectedChildId] = useState('')
  const [timeline, setTimeline] = useState([])
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [detailsError, setDetailsError] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [activeTab, setActiveTab] = useState('timeline') // 'timeline' | 'reminders'
  const [filterStatus, setFilterStatus] = useState('all') // 'all' | 'Completed' | 'Upcoming' | 'Overdue'

  const [showPassModal, setShowPassModal] = useState(false)
  const [showAddChildModal, setShowAddChildModal] = useState(false)
  const [simulatingAlert, setSimulatingAlert] = useState(false)
  const childDetailsRequest = useRef(0)

  const selectedChild = children.find((c) => c.id === selectedChildId) || children[0] || null

  const loadData = async () => {
    try {
      setLoading(true)
      setLoadError('')
      const data = await api.getChildren()
      if (!Array.isArray(data)) throw new Error('The server returned an invalid child list.')
      setChildren(data)
      if (data.length > 0) {
        const activeId = data.some((child) => child.id === selectedChildId) ? selectedChildId : data[0].id
        setSelectedChildId(activeId)
        await loadChildDetails(activeId)
      } else {
        setSelectedChildId('')
        setTimeline([])
        setReminders([])
      }
    } catch (err) {
      console.error(err)
      setLoadError(err.message || 'Could not load child profiles. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadChildDetails = async (childId) => {
    const requestId = ++childDetailsRequest.current
    setDetailsLoading(true)
    setDetailsError('')
    setTimeline([])
    setReminders([])

    const [timelineResult, remindersResult] = await Promise.allSettled([
      api.getTimeline(childId),
      api.getReminders(childId),
    ])
    if (requestId !== childDetailsRequest.current) return

    if (timelineResult.status === 'fulfilled') {
      setTimeline(timelineResult.value.items || [])
    } else {
      console.error(timelineResult.reason)
    }
    if (remindersResult.status === 'fulfilled') {
      setReminders(remindersResult.value.reminders || [])
    } else {
      console.error(remindersResult.reason)
    }

    const failedRequests = [timelineResult, remindersResult].filter((result) => result.status === 'rejected')
    if (failedRequests.length) {
      setDetailsError('Some child health information could not be loaded.')
    }
    setDetailsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSelectChild = (childId) => {
    setSelectedChildId(childId)
    loadChildDetails(childId)
  }

  const handleAddChild = async (formData) => {
    const res = await api.createChild(formData)
    await loadData()
    if (res.id) {
      setSelectedChildId(res.id)
      await loadChildDetails(res.id)
    }
    setStatusMsg(`Child profile created for ${formData.first_name}! Immunization schedule generated.`)
    setTimeout(() => setStatusMsg(''), 5000)
  }

  const handleSimulateAlert = () => {
    setSimulatingAlert(true)
    setTimeout(() => {
      setSimulatingAlert(false)
      setStatusMsg(`Automated reminder alert sent via Email & SMS for upcoming immunization milestones!`)
      setTimeout(() => setStatusMsg(''), 5000)
    }, 1200)
  }

  const completedCount = timeline.filter((i) => i.status === 'Completed').length
  const upcomingCount = timeline.filter((i) => i.status !== 'Completed').length
  const totalCount = timeline.length
  const pct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0

  const filteredTimeline = timeline.filter((item) => {
    if (filterStatus === 'all') return true
    return item.status === filterStatus
  })

  // Calculate age string from DOB
  const getAgeString = (dobString) => {
    if (!dobString) return ''
    const birth = new Date(dobString)
    const now = new Date()
    const diffMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
    if (diffMonths < 1) return 'Newborn'
    if (diffMonths < 12) return `${diffMonths} months old`
    const years = Math.floor(diffMonths / 12)
    const remMonths = diffMonths % 12
    return remMonths ? `${years}y ${remMonths}m old` : `${years} years old`
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {statusMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg('')} className="text-emerald-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Child Switcher Cards */}
      <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2">
        <div className="flex items-center gap-3">
          {children.map((child) => {
            const isSelected = selectedChild?.id === child.id
            return (
              <button
                key={child.id}
                onClick={() => handleSelectChild(child.id)}
                className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200 shrink-0 ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl font-bold text-sm ${
                    isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {child.first_name[0]}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">
                    {child.first_name} {child.last_name}
                  </h4>
                  <p className="text-xs text-slate-400">{getAgeString(child.date_of_birth)}</p>
                </div>
              </button>
            )
          })}

          <button
            onClick={() => setShowAddChildModal(true)}
            className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-4 py-4 text-xs font-semibold text-slate-400 hover:border-cyan-500 hover:text-cyan-400 transition shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Enroll Child</span>
          </button>
        </div>
      </div>

      {loading && children.length === 0 && (
        <p role="status" className="text-sm text-slate-400">Loading child profiles...</p>
      )}
      {loadError && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <span>{loadError}</span>
          <button onClick={loadData} className="shrink-0 font-semibold text-rose-100 underline">Retry</button>
        </div>
      )}
      {!loading && !loadError && children.length === 0 && (
        <p className="text-sm text-slate-400">No child profiles yet. Enroll a child to get started.</p>
      )}
      {selectedChild && detailsLoading && (
        <p role="status" className="text-sm text-slate-400">Loading {selectedChild.first_name}'s health information...</p>
      )}
      {selectedChild && detailsError && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <span>{detailsError}</span>
          <button onClick={() => loadChildDetails(selectedChild.id)} className="shrink-0 font-semibold text-amber-100 underline">Retry</button>
        </div>
      )}

      {selectedChild && (
        <>
          {/* Hero Child Summary Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 shadow-xl">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-semibold text-cyan-300 ring-1 ring-cyan-500/30">
                    Active Patient
                  </span>
                  <span className="text-xs text-slate-400">DOB: {selectedChild.date_of_birth}</span>
                </div>
                <h2 className="mt-2 text-3xl font-extrabold text-white tracking-tight">
                  {selectedChild.first_name} {selectedChild.last_name}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {selectedChild.notes || 'Routine pediatric immunization tracking active.'}
                </p>
              </div>

              {/* Quick Action Badges */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowPassModal(true)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition"
                >
                  <QrCode className="h-4 w-4" />
                  <span>Digital Vaccine Pass</span>
                </button>

                <button
                  onClick={handleSimulateAlert}
                  disabled={simulatingAlert}
                  className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                >
                  <Bell className="h-4 w-4 text-amber-400" />
                  <span>{simulatingAlert ? 'Dispatching...' : 'Simulate Reminder'}</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-6 sm:grid-cols-4">
              <div className="rounded-xl bg-slate-950/60 p-3.5 border border-slate-800/60">
                <span className="text-xs font-medium text-slate-400">Completion</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-400">{pct}%</span>
                  <span className="text-xs text-slate-500">protected</span>
                </div>
              </div>

              <div className="rounded-xl bg-slate-950/60 p-3.5 border border-slate-800/60">
                <span className="text-xs font-medium text-slate-400">Doses Completed</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">{completedCount}</span>
                  <span className="text-xs text-slate-500">of {totalCount} total</span>
                </div>
              </div>

              <div className="rounded-xl bg-slate-950/60 p-3.5 border border-slate-800/60">
                <span className="text-xs font-medium text-slate-400">Upcoming / Due</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-400">{upcomingCount}</span>
                  <span className="text-xs text-slate-500">doses</span>
                </div>
              </div>

              <div className="rounded-xl bg-slate-950/60 p-3.5 border border-slate-800/60">
                <span className="text-xs font-medium text-slate-400">Active Reminders</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-cyan-400">{reminders.length}</span>
                  <span className="text-xs text-slate-500">alerts active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  activeTab === 'timeline'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Vaccination Schedule & Timeline</span>
              </button>

              <button
                onClick={() => setActiveTab('reminders')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  activeTab === 'reminders'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bell className="h-4 w-4" />
                <span>Reminders & Notifications ({reminders.length})</span>
              </button>
            </div>

            {activeTab === 'timeline' && (
              <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1 border border-slate-800">
                {['all', 'Completed', 'Upcoming', 'Overdue'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize transition ${
                      filterStatus === status ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TAB 1: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-3">
              {detailsLoading ? (
                <div role="status" className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
                  Loading vaccination schedule...
                </div>
              ) : filteredTimeline.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
                  <Calendar className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                  <p>No vaccines match the selected filter.</p>
                </div>
              ) : (
                filteredTimeline.map((item, index) => {
                  const isCompleted = item.status === 'Completed'
                  const isOverdue = item.status === 'Overdue'

                  return (
                    <div
                      key={index}
                      className="group flex flex-col gap-4 rounded-2xl border border-slate-800/90 bg-slate-900/80 p-4 transition duration-200 hover:border-slate-700 sm:flex-row sm:items-center sm:justify-between shadow-sm"
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ring-1 ${
                            isCompleted
                              ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30'
                              : isOverdue
                              ? 'bg-rose-500/10 text-rose-400 ring-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 ring-amber-500/30'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-base">{item.vaccine_name}</h4>
                            {item.dose_number && (
                              <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                                Dose #{item.dose_number}
                              </span>
                            )}
                          </div>
                          {item.disease_target && (
                            <p className="text-xs text-slate-400 mt-0.5">Protects against: {item.disease_target}</p>
                          )}
                          {item.notes && <p className="text-xs text-slate-500 mt-1 italic">{item.notes}</p>}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 sm:text-right">
                        <div>
                          <p className="text-xs text-slate-400">
                            {isCompleted ? 'Administered' : 'Scheduled Due Date'}
                          </p>
                          <p className="text-sm font-semibold text-white">
                            {isCompleted ? item.administered_date : item.due_date}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/40'
                              : isOverdue
                              ? 'bg-rose-500/20 text-rose-300 ring-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 ring-amber-500/40'
                          }`}
                        >
                          {item.status}
                        </span>

                        <button
                          onClick={() => setShowPassModal(true)}
                          title="Show Digital QR Verification"
                          className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:border-cyan-400 hover:text-cyan-300 transition"
                        >
                          <QrCode className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* TAB 2: REMINDERS & NOTIFICATIONS */}
          {activeTab === 'reminders' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <h3 className="font-bold text-white text-base mb-1">Automated Immunization Dispatch Engine</h3>
                <p className="text-xs text-slate-400">
                  Deterministic reminders computed according to national immunization timing windows (7-day advance
                  alert, 48-hour urgent alert, and due-day notification).
                </p>
              </div>

              {detailsLoading ? (
                <div role="status" className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
                  Loading reminders...
                </div>
              ) : reminders.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
                  <p>All scheduled vaccines are up to date! No pending alerts.</p>
                </div>
              ) : (
                reminders.map((rem, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30">
                        <Bell className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{rem.vaccine_name}</h4>
                        <p className="text-xs text-slate-400">{rem.message}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">
                        {rem.days_remaining <= 0
                          ? 'Due Now'
                          : rem.days_remaining === 1
                          ? 'Due Tomorrow'
                          : `In ${rem.days_remaining} days`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <DigitalPassModal
        isOpen={showPassModal}
        child={selectedChild}
        timeline={timeline}
        onClose={() => setShowPassModal(false)}
      />


      <AddChildModal
        isOpen={showAddChildModal}
        onClose={() => setShowAddChildModal(false)}
        onAdd={handleAddChild}
      />
    </div>
  )
}
