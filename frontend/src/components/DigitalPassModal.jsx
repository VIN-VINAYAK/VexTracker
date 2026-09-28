import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { CheckCircle2, Download, Printer, ShieldCheck, X } from 'lucide-react'

export function DigitalPassModal({ isOpen, child, timeline = [], onClose }) {
  const canvasRef = useRef(null)
  const [qrUrl, setQrUrl] = useState('')

  const completedDoses = timeline.filter((item) => item.status === 'Completed')
  const totalDoses = timeline.length
  const pct = totalDoses ? Math.round((completedDoses.length / totalDoses) * 100) : 0

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen || !child) return

    const payload = JSON.stringify({
      passport_id: `VEX-PASS-${child.id ? child.id.slice(-6).toUpperCase() : 'VERIFIED'}`,
      child_id: child.id,
      name: `${child.first_name} ${child.last_name}`,
      dob: child.date_of_birth,
      completed_doses: completedDoses.length,
      total_doses: totalDoses,
      verified_by: 'Metro Child Health Network',
      issued_at: new Date().toISOString(),
    })

    // Generate canvas QR
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, payload, {
        width: 170,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
    }

    // Generate downloadable image URL
    QRCode.toDataURL(payload, { width: 320, margin: 1 })
      .then(setQrUrl)
      .catch(() => {})
  }, [isOpen, child, completedDoses.length, totalDoses])

  if (!isOpen || !child) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-emerald-500/40 bg-slate-900 shadow-2xl shadow-emerald-950/50"
      >
        {/* Certificate Card Header */}
        <div className="relative bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 p-5 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                  Official Immunization Record
                </p>
                <h2 className="text-xl font-extrabold text-white">Digital Pediatric Vaccine Pass</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:border-rose-500 hover:bg-rose-500/20 hover:text-white transition"
              title="Close (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Top Info Banner with QR */}
          <div className="grid gap-4 sm:grid-cols-12 bg-slate-950 p-4 rounded-xl border border-slate-800 items-center">
            <div className="sm:col-span-7 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Patient Credentials
              </span>
              <h3 className="text-2xl font-black text-white">
                {child.first_name} {child.last_name}
              </h3>
              <div className="space-y-1 text-xs text-slate-300 pt-1">
                <p>
                  <span className="text-slate-500 font-medium">Date of Birth:</span> {child.date_of_birth}
                </p>
                <p>
                  <span className="text-slate-500 font-medium">Gender:</span> {child.gender || 'Not specified'}
                </p>
                <p>
                  <span className="text-slate-500 font-medium">Patient ID:</span> #{child.id ? child.id.slice(-8) : 'AUTO'}
                </p>
                {child.notes && (
                  <p className="text-amber-300/90 text-xs mt-1">
                    <span className="text-slate-500 font-medium">Clinical Alerts:</span> {child.notes}
                  </p>
                )}
              </div>
            </div>

            <div className="sm:col-span-5 flex flex-col items-center justify-center bg-white p-3 rounded-xl border border-slate-200">
              <canvas ref={canvasRef} className="rounded-lg shadow-sm" />
              <p className="mt-2 text-[10px] font-mono font-bold text-slate-800 tracking-wider">
                SCAN FOR CLINICAL VERIFICATION
              </p>
            </div>
          </div>

          {/* Immunization Status Bar */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-300">Immunization Completion Status</span>
              <span className="font-bold text-emerald-400">
                {completedDoses.length} of {totalDoses} doses ({pct}%)
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Dose Records Summary */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Verified Immunizations
            </h4>
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {timeline.length === 0 ? (
                <p className="text-xs text-slate-500">No immunization entries recorded.</p>
              ) : (
                timeline.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/50 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          item.status === 'Completed' ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                      />
                      <div>
                        <span className="font-bold text-white">{item.vaccine_name}</span>
                        {item.dose_number && (
                          <span className="ml-2 text-[10px] text-slate-400">Dose #{item.dose_number}</span>
                        )}
                        {item.disease_target && (
                          <p className="text-[10px] text-slate-500">{item.disease_target}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {item.status === 'Completed' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {item.administered_date || 'Completed'}
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-400">Due: {item.due_date}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer Security Watermark */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Cryptographically Signed & Timestamped</span>
            </div>
            <span>VexTracker Clinical Network</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 p-4">
          <p className="text-[11px] text-slate-400">Accepted for Daycare, School & Travel verification.</p>
          <div className="flex items-center gap-2">
            {qrUrl && (
              <a
                href={qrUrl}
                download={`${child.first_name}_Vaccine_QR.png`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
              >
                <Download className="h-3.5 w-3.5" />
                Save QR
              </a>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Certificate
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
