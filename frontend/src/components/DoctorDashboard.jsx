import { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'
import {
  Stethoscope,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Search,
  User,
  Calendar,
  Syringe,
  FileCheck,
  ShieldCheck,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react'
import { api } from '../services/api'

export function DoctorDashboard({ currentUser }) {
  const [activeTab, setActiveTab] = useState('scanner') // 'scanner' | 'patients'
  const [patients, setPatients] = useState([])
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [patientTimeline, setPatientTimeline] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // QR Scanning & Resolution state
  const [qrInput, setQrInput] = useState('')
  const [resolving, setResolving] = useState(false)
  const [resolvedRecord, setResolvedRecord] = useState(null)
  const [resolveError, setResolveError] = useState('')

  // Administration Form state
  const [administering, setAdministering] = useState(false)
  const [adminSuccess, setAdminSuccess] = useState('')
  const [adminForm, setAdminForm] = useState({
    child_id: '',
    vaccine_id: '',
    dose_number: 1,
    administered_date: new Date().toISOString().split('T')[0],
    batch_number: 'DT-2049-A',
    injection_site: 'Left Anterolateral Thigh',
    notes: 'Well tolerated. No immediate hypersensitivity during 15-min observation.',
  })

  // Available vaccines & inventory batches
  const [vaccinesList, setVaccinesList] = useState([])
  const [inventoryList, setInventoryList] = useState([])

  const loadData = async () => {
    try {
      const [pts, vax, inv] = await Promise.all([
        api.getPatients().catch(() => []),
        api.getVaccines().catch(() => []),
        api.getInventory().catch(() => []),
      ])
      setPatients(pts)
      setVaccinesList(vax)
      setInventoryList(inv)

      if (pts.length > 0 && !selectedPatientId) {
        setSelectedPatientId(pts[0].id)
        loadPatientHistory(pts[0].id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const loadPatientHistory = async (patientId) => {
    try {
      const data = await api.getPatientTimeline(patientId)
      setPatientTimeline(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleResolveQr = async (tokenToUse) => {
    const token = tokenToUse || qrInput
    if (!token.trim()) return

    setResolving(true)
    setResolveError('')
    setResolvedRecord(null)
    setAdminSuccess('')

    try {
      const res = await api.resolveQr(token.trim())
      setResolvedRecord(res)
      setAdminForm((prev) => ({
        ...prev,
        child_id: res.child_id || prev.child_id,
        vaccine_id: res.vaccine_id || (vaccinesList[0]?.id ? String(vaccinesList[0].id) : prev.vaccine_id),
        dose_number: res.dose_number || 1,
      }))
    } catch (err) {
      setResolveError(err.message || 'Invalid or unverifiable QR token.')
    } finally {
      setResolving(false)
    }
  }

  const handleLoadDemoPass = async (child) => {
    try {
      // Fetch timeline to get signed token
      const tData = await api.getTimeline(child.id)
      const token = tData.items?.[0]?.qr_token || ''
      if (token) {
        setQrInput(token)
        handleResolveQr(token)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleAdminister = async (e) => {
    e.preventDefault()
    if (!adminForm.child_id || !adminForm.vaccine_id) {
      setResolveError('Child and Vaccine selection are required.')
      return
    }

    setAdministering(true)
    setResolveError('')
    setAdminSuccess('')

    try {
      const res = await api.administerDose(adminForm)
      setAdminSuccess(
        `Dose verified & recorded successfully for ${res.child_name}! Signed by ${res.verified_by_doctor}.`
      )

      // Confetti celebration!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#10b981', '#3b82f6', '#f59e0b'],
      })

      // Refresh patients list & history
      await loadData()
      if (adminForm.child_id) {
        loadPatientHistory(adminForm.child_id)
      }
    } catch (err) {
      setResolveError(err.message || 'Failed to record dose.')
    } finally {
      setAdministering(false)
    }
  }

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase()
    return (
      p.first_name.toLowerCase().includes(q) ||
      p.last_name.toLowerCase().includes(q) ||
      (p.notes && p.notes.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6">
      {/* Doctor Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 p-6 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30 shadow-lg">
              <Stethoscope className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-semibold text-cyan-300 ring-1 ring-cyan-500/30">
                  Pediatric Clinical Station
                </span>
                <span className="text-xs text-slate-400">Metro Child Health Clinic</span>
              </div>
              <h2 className="mt-1 text-2xl font-bold text-white">
                {currentUser?.full_name || 'Dr. Priya Shah, MD'}
              </h2>
              <p className="text-xs text-slate-400">
                Official Dose Verification & Cryptographic Health Card Signing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'scanner'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'border border-slate-800 bg-slate-900 text-slate-300 hover:text-white'
              }`}
            >
              <QrCode className="h-4 w-4" />
              <span>QR Dose Station</span>
            </button>

            <button
              onClick={() => setActiveTab('patients')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'patients'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'border border-slate-800 bg-slate-900 text-slate-300 hover:text-white'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Patient Directory ({patients.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {adminSuccess && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-300 shadow-lg animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <div className="text-sm font-semibold">{adminSuccess}</div>
        </div>
      )}

      {/* TAB 1: QR DOSE STATION & VERIFIER */}
      {activeTab === 'scanner' && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left: QR Resolver Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                  <QrCode className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-white text-base">Scan or Verify Patient QR</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Scan the parent's digital pass or paste the cryptographic token to verify pediatric identity and record
                administration.
              </p>

              <div className="space-y-3">
                <textarea
                  rows={3}
                  placeholder="Paste QR payload token (JWT)..."
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:outline-none font-mono"
                />

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleResolveQr()}
                    disabled={resolving || !qrInput.trim()}
                    className="flex-1 rounded-xl bg-cyan-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition disabled:opacity-50"
                  >
                    {resolving ? 'Cryptographic Check...' : 'Verify Token'}
                  </button>
                </div>

                {/* 1-Click Quick Demo Load Buttons */}
                <div className="pt-2 border-t border-slate-800">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Quick Clinical Testing:
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {patients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleLoadDemoPass(p)}
                        className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-300 hover:border-cyan-500/40 hover:bg-slate-800 transition text-left"
                      >
                        <span className="font-medium">
                          Load Pass: {p.first_name} {p.last_name}
                        </span>
                        <span className="text-[10px] text-cyan-400">Auto-Verify</span>
                      </button>
                    ))}
                  </div>
                </div>

                {resolveError && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{resolveError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Resolved Patient Card */}
            {resolvedRecord && (
              <div className="rounded-2xl border border-emerald-500/40 bg-slate-900/90 p-5 shadow-lg animate-in fade-in">
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <ShieldCheck className="h-4 w-4" />
                    CRYPTOGRAPHICALLY VERIFIED
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">HASH OK</span>
                </div>

                <h4 className="text-lg font-bold text-white">{resolvedRecord.child_name}</h4>
                <div className="mt-2 space-y-1 text-xs text-slate-300">
                  {resolvedRecord.child_dob && <p>DOB: {resolvedRecord.child_dob}</p>}
                  {resolvedRecord.notes && (
                    <p className="text-amber-300 font-medium">Alerts: {resolvedRecord.notes}</p>
                  )}
                  {resolvedRecord.vaccine_name && (
                    <p className="text-cyan-300">Target Dose: {resolvedRecord.vaccine_name}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Administration & Sign-off Form */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleAdminister}
              className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Syringe className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Record & Verify Dose Administration</h3>
                    <p className="text-xs text-slate-400">Digital clinician sign-off with lot verification</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                    Patient
                  </label>
                  <select
                    value={adminForm.child_id}
                    onChange={(e) => setAdminForm({ ...adminForm, child_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="">-- Select Patient --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.first_name} {p.last_name} (DOB: {p.date_of_birth})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                    Vaccine Formulation
                  </label>
                  <select
                    value={adminForm.vaccine_id}
                    onChange={(e) => setAdminForm({ ...adminForm, vaccine_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="">-- Select Vaccine --</option>
                    {vaccinesList.map((v) => (
                      <option key={v._id || v.id} value={v._id || v.id}>
                        {v.name} - {v.disease_target}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                    Dose Sequence
                  </label>
                  <select
                    value={adminForm.dose_number}
                    onChange={(e) => setAdminForm({ ...adminForm, dose_number: parseInt(e.target.value) })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value={1}>Dose #1</option>
                    <option value={2}>Dose #2</option>
                    <option value={3}>Dose #3</option>
                    <option value={4}>Dose #4</option>
                    <option value={5}>Booster #1</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                    Administration Date
                  </label>
                  <input
                    type="date"
                    value={adminForm.administered_date}
                    onChange={(e) => setAdminForm({ ...adminForm, administered_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                    Vaccine Lot / Batch
                  </label>
                  <select
                    value={adminForm.batch_number}
                    onChange={(e) => setAdminForm({ ...adminForm, batch_number: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  >
                    {inventoryList.map((item) => (
                      <option key={item.id} value={item.batch_number}>
                        {item.batch_number} ({item.vaccine_name || 'In Stock'})
                      </option>
                    ))}
                    <option value="DT-2049-A">DT-2049-A (Standard Lot)</option>
                    <option value="MMR-1850-B">MMR-1850-B (Standard Lot)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                  Anatomical Injection Site
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    'Left Anterolateral Thigh',
                    'Right Anterolateral Thigh',
                    'Left Deltoid',
                    'Oral Drops',
                  ].map((site) => (
                    <button
                      key={site}
                      type="button"
                      onClick={() => setAdminForm({ ...adminForm, injection_site: site })}
                      className={`rounded-xl border p-2 text-xs font-medium transition ${
                        adminForm.injection_site === site
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {site}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                  Clinical Observations & Doctor Notes
                </label>
                <textarea
                  rows={2}
                  value={adminForm.notes}
                  onChange={(e) => setAdminForm({ ...adminForm, notes: e.target.value })}
                  placeholder="Record post-vaccination observation, patient tolerance, caregiver counsel..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Attesting Clinician: {currentUser?.full_name || 'Dr. Priya Shah'}</span>
                </div>

                <button
                  type="submit"
                  disabled={administering || !adminForm.child_id || !adminForm.vaccine_id}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition disabled:opacity-50"
                >
                  <FileCheck className="h-4 w-4" />
                  <span>{administering ? 'Recording & Signing...' : 'Verify & Sign Dose'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: PATIENT DIRECTORY */}
      {activeTab === 'patients' && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Patient Search & List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search patient name, allergies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredPatients.map((patient) => {
                const isSelected = selectedPatientId === patient.id
                return (
                  <button
                    key={patient.id}
                    onClick={() => {
                      setSelectedPatientId(patient.id)
                      loadPatientHistory(patient.id)
                    }}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-500/30'
                        : 'border-slate-800 bg-slate-900/70 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm">
                        {patient.first_name} {patient.last_name}
                      </h4>
                      <span className="text-[10px] text-cyan-400 font-semibold">
                        {patient.completed_count} verified
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                      <span>DOB: {patient.date_of_birth}</span>
                      <span>{patient.gender}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Patient Clinical History & Chart */}
          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
              {patientTimeline ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{patientTimeline.child?.full_name}</h3>
                      <p className="text-xs text-slate-400">
                        DOB: {patientTimeline.child?.date_of_birth} | Gender: {patientTimeline.child?.gender}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setAdminForm((prev) => ({ ...prev, child_id: selectedPatientId }))
                        setActiveTab('scanner')
                      }}
                      className="rounded-xl bg-cyan-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition"
                    >
                      + Administer Dose
                    </button>
                  </div>

                  {patientTimeline.child?.notes && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300">
                      <strong>Clinical Notes / Allergies:</strong> {patientTimeline.child.notes}
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Vaccination History & Records
                    </h4>

                    {patientTimeline.records?.length === 0 ? (
                      <p className="text-xs text-slate-500">No vaccination records found for this patient.</p>
                    ) : (
                      patientTimeline.records?.map((rec, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <div>
                              <span className="font-bold text-white">{rec.vaccine_name}</span>
                              <span className="ml-2 text-slate-400">Dose #{rec.dose_number}</span>
                              {rec.notes && <p className="text-slate-500 mt-0.5">{rec.notes}</p>}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-emerald-400 font-semibold">
                              {rec.administered_date || 'Completed'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Select a patient to inspect clinical vaccination chart.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
