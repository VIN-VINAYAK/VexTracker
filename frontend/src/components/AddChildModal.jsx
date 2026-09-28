import { useState } from 'react'
import { Baby, Calendar, User, X } from 'lucide-react'

export function AddChildModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'Male',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.first_name || !formData.last_name || !formData.date_of_birth) {
      setError('Please fill in child first name, last name, and date of birth.')
      return
    }

    try {
      setLoading(true)
      setError('')
      await onAdd(formData)
      setFormData({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: 'Male',
        notes: '',
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to enroll child.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
      >

        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20">
              <Baby className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Enroll New Child</h3>
              <p className="text-xs text-slate-400">Generate automated pediatric vaccination schedule</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                First Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Leo"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Patel"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                required
                max={new Date().toISOString().split('T')[0]}
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">
              Medical Notes / Known Allergies (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Blood type A+, born at 39 weeks, mild egg allergy..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-emerald-400 transition disabled:opacity-50"
            >
              {loading ? 'Creating Schedule...' : 'Save & Generate Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
