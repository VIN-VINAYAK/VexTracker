import { useState, useEffect } from 'react'
import {
  Shield,
  TrendingUp,
  AlertTriangle,
  Package,
  Building2,
  Syringe,
  BarChart3,
  Calendar,
  CheckCircle2,
  Plus,
  RefreshCw,
  Cpu,
} from 'lucide-react'
import { api } from '../services/api'

export function AdminDashboard({ currentUser }) {
  const [activeTab, setActiveTab] = useState('analytics') // 'analytics' | 'inventory' | 'catalog' | 'centers'
  const [summary, setSummary] = useState(null)
  const [riskData, setRiskData] = useState(null)
  const [forecastData, setForecastData] = useState(null)
  const [inventory, setInventory] = useState([])
  const [vaccines, setVaccines] = useState([])
  const [centers, setCenters] = useState([])
  const [loading, setLoading] = useState(true)

  // Add Inventory Batch Modal state
  const [showAddBatch, setShowAddBatch] = useState(false)
  const [batchForm, setBatchForm] = useState({
    vaccine_id: '',
    batch_number: '',
    quantity_on_hand: 50,
    expiry_date: '',
    location: 'Cold Storage Unit A (2-8°C)',
  })
  const [addMsg, setAddMsg] = useState('')

  const loadAll = async () => {
    try {
      setLoading(true)
      const [sumRes, riskRes, foreRes, invRes, vacRes, cenRes] = await Promise.all([
        api.getSummary().catch(() => null),
        api.getRiskAnalytics().catch(() => null),
        api.getForecastAnalytics().catch(() => null),
        api.getInventory().catch(() => []),
        api.getVaccines().catch(() => []),
        api.getCenters().catch(() => []),
      ])

      setSummary(sumRes)
      setRiskData(riskRes)
      setForecastData(foreRes)
      setInventory(invRes)
      setVaccines(vacRes)
      setCenters(cenRes)

      if (vacRes.length > 0 && !batchForm.vaccine_id) {
        setBatchForm((prev) => ({ ...prev, vaccine_id: vacRes[0]._id || vacRes[0].id }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const handleCreateBatch = async (e) => {
    e.preventDefault()
    if (!batchForm.vaccine_id || !batchForm.batch_number) return

    try {
      await api.createInventory(batchForm)
      setAddMsg(`Batch ${batchForm.batch_number} registered successfully!`)
      setShowAddBatch(false)
      await loadAll()
      setTimeout(() => setAddMsg(''), 4000)
    } catch (err) {
      setAddMsg(err.message || 'Failed to register batch.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Admin Executive Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30 shadow-lg">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-500/30">
                  Regional Command Center
                </span>
                <span className="text-xs text-slate-400">Chief Immunization Officer</span>
              </div>
              <h2 className="mt-1 text-2xl font-bold text-white">
                {currentUser?.full_name || 'Alicia Grant'}
              </h2>
              <p className="text-xs text-slate-400">
                Supply Chain Logistics, Cold-Chain Auditing & ML Dropout Risk Intelligence
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === 'analytics'
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                  : 'border border-slate-800 bg-slate-900 text-slate-300 hover:text-white'
              }`}
            >
              <Cpu className="h-4 w-4" />
              <span>AI Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === 'inventory'
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                  : 'border border-slate-800 bg-slate-900 text-slate-300 hover:text-white'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Inventory & Cold Chain</span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === 'catalog'
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                  : 'border border-slate-800 bg-slate-900 text-slate-300 hover:text-white'
              }`}
            >
              <Syringe className="h-4 w-4" />
              <span>Vaccine Catalog</span>
            </button>

            <button
              onClick={() => setActiveTab('centers')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === 'centers'
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                  : 'border border-slate-800 bg-slate-900 text-slate-300 hover:text-white'
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Clinics ({centers.length})</span>
            </button>
          </div>
        </div>

        {/* Operational KPIs */}
        {summary && (
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-6 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400">Total Children</span>
              <div className="mt-1 text-2xl font-black text-white">{summary.total_children}</div>
            </div>

            <div className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400">Coverage Rate</span>
              <div className="mt-1 text-2xl font-black text-emerald-400">{summary.coverage_rate}%</div>
            </div>

            <div className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400">Total Stock (Units)</span>
              <div className="mt-1 text-2xl font-black text-cyan-400">{summary.total_inventory_units}</div>
            </div>

            <div className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400">Active Batches</span>
              <div className="mt-1 text-2xl font-black text-indigo-400">{summary.total_inventory_batches}</div>
            </div>

            <div className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400">Low Stock Batches</span>
              <div className={`mt-1 text-2xl font-black ${summary.low_stock_batches > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                {summary.low_stock_batches}
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400">Expiring &lt; 90d</span>
              <div className={`mt-1 text-2xl font-black ${summary.expiring_batches > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                {summary.expiring_batches}
              </div>
            </div>
          </div>
        )}
      </div>

      {addMsg && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          {addMsg}
        </div>
      )}

      {/* TAB 1: AI ANALYTICS & ML FORECASTING */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Missed Dose Risk Predictor */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-indigo-400" />
                  <h3 className="font-bold text-white text-lg">AI Missed-Dose Dropout Risk Classifier</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Supervised linear-heuristic weighted ensemble evaluating prior missed shots, response latency, and days to due date.
                </p>
              </div>

              {riskData?.metrics && (
                <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400">F1 Score:</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {(riskData.metrics.f1 * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 ml-2">Accuracy:</span>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {(riskData.metrics.accuracy * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            {/* Risk Cohort Insights Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Cohort Risk Segment</th>
                    <th className="pb-3 font-semibold">Risk Level</th>
                    <th className="pb-3 font-semibold">Dropout Probability</th>
                    <th className="pb-3 font-semibold">AI Recommended Proactive Intervention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {riskData?.cohorts?.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-950/40 transition">
                      <td className="py-3 font-medium text-white">{c.segment}</td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 font-bold ${
                            c.risk_level === 'High'
                              ? 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40'
                              : c.risk_level === 'Moderate'
                              ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
                          }`}
                        >
                          {c.risk_level}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-slate-300">{(c.risk_score * 100).toFixed(0)}%</td>
                      <td className="py-3 text-cyan-300">{c.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Predictive Demand Forecasting */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-cyan-400" />
                  <h3 className="font-bold text-white text-lg">Predictive Vaccine Demand Forecast (6-Month Horizon)</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Auto-trend projected consumption curve preventing clinical stockouts across regional centers.
                </p>
              </div>

              {forecastData?.evaluation && (
                <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400">MAE:</span>
                  <span className="text-xs font-mono font-bold text-cyan-400">{forecastData.evaluation.mae}</span>
                  <span className="text-[10px] text-slate-400 ml-2">R²:</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">{forecastData.evaluation.r2}</span>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              {forecastData?.timeline?.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center hover:border-cyan-500/40 transition"
                >
                  <p className="text-xs font-bold text-slate-400">{item.month}</p>
                  <p className="mt-2 text-2xl font-black text-cyan-400">{item.projected_doses}</p>
                  <p className="text-[10px] text-slate-500 mt-1">projected doses</p>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-emerald-400">
                    Buffer: {item.buffer_stock_recommended} units
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY & COLD CHAIN */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Live Vaccine Inventory & Cold-Chain Units</h3>
            <button
              onClick={() => setShowAddBatch(true)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-400 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Register Inbound Shipment</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Vaccine Formulation</th>
                  <th className="py-3 px-4 font-semibold">Batch Lot Number</th>
                  <th className="py-3 px-4 font-semibold">Quantity on Hand</th>
                  <th className="py-3 px-4 font-semibold">Cold Storage Location</th>
                  <th className="py-3 px-4 font-semibold">Expiry Date</th>
                  <th className="py-3 px-4 font-semibold">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {inventory.map((item) => {
                  const isLow = item.quantity_on_hand <= (item.min_stock || 15)
                  return (
                    <tr key={item.id} className="hover:bg-slate-950/40 transition">
                      <td className="py-3.5 px-4 font-bold text-white">{item.vaccine_name || 'Vaccine Formulation'}</td>
                      <td className="py-3.5 px-4 font-mono text-cyan-300">{item.batch_number}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-sm font-bold text-white">{item.quantity_on_hand}</span>
                        <span className="text-[10px] text-slate-500 ml-1">vials</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{item.location || 'Cold Room A (2-8°C)'}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {item.expiry_date ? item.expiry_date.split('T')[0] : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        {isLow ? (
                          <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold text-rose-300 ring-1 ring-rose-500/40">
                            Low Stock Alert
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-500/40">
                            Adequate
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VACCINE CATALOG */}
      {activeTab === 'catalog' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vaccines.map((v) => (
            <div
              key={v._id || v.id}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-bold text-indigo-400">
                  {v.name}
                </span>
                <span className="text-[11px] text-slate-400">{v.recommended_age_months}</span>
              </div>
              <div>
                <h4 className="font-bold text-white text-base">{v.disease_target}</h4>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">{v.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: CLINICS */}
      {activeTab === 'centers' && (
        <div className="grid gap-4 sm:grid-cols-3">
          {centers.map((c) => (
            <div key={c._id || c.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <Building2 className="h-5 w-5" />
                <span className="font-bold text-sm text-white">{c.name}</span>
              </div>
              <p className="text-xs text-slate-400">{c.address}</p>
              <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
                <p>Phone: {c.phone}</p>
                <p>Contact: {c.contact_person}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Batch Modal */}
      {showAddBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="font-bold text-white text-base mb-4">Register Inbound Vaccine Shipment</h3>
            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Vaccine</label>
                <select
                  value={batchForm.vaccine_id}
                  onChange={(e) => setBatchForm({ ...batchForm, vaccine_id: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white"
                >
                  {vaccines.map((v) => (
                    <option key={v._id || v.id} value={v._id || v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Batch / Lot Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DTP-8812-F"
                  value={batchForm.batch_number}
                  onChange={(e) => setBatchForm({ ...batchForm, batch_number: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Quantity (Units)</label>
                  <input
                    type="number"
                    min={1}
                    value={batchForm.quantity_on_hand}
                    onChange={(e) => setBatchForm({ ...batchForm, quantity_on_hand: parseInt(e.target.value) })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={batchForm.expiry_date}
                    onChange={(e) => setBatchForm({ ...batchForm, expiry_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Storage Location</label>
                <input
                  type="text"
                  value={batchForm.location}
                  onChange={(e) => setBatchForm({ ...batchForm, location: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddBatch(false)}
                  className="rounded-xl px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-500 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-400"
                >
                  Save Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
