const API_BASE = 'http://localhost:8000'

export function getToken() {
  return localStorage.getItem('vextracker_token') || ''
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('vextracker_token', token)
  } else {
    localStorage.removeItem('vextracker_token')
  }
}

async function request(endpoint, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.detail || data.message || `Request failed with status ${response.status}`)
  }
  return data
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  me: () => request('/auth/me'),

  // Parent Portal
  getChildren: () => request('/parent/children'),
  createChild: (data) =>
    request('/parent/children', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getTimeline: (childId) => request(`/parent/children/${childId}/timeline`),
  getReminders: (childId) => request(`/parent/children/${childId}/reminders`),

  // Doctor Portal
  getPatients: () => request('/doctor/patients'),
  getPatientTimeline: (childId) => request(`/doctor/patients/${childId}/timeline`),
  resolveQr: (qrToken) =>
    request('/doctor/qr/resolve', {
      method: 'POST',
      body: JSON.stringify({ qr_token: qrToken }),
    }),
  administerDose: (payload) =>
    request('/doctor/administer', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Admin Portal
  getSummary: () => request('/admin/summary'),
  getRiskAnalytics: () => request('/admin/analytics/risk'),
  getForecastAnalytics: () => request('/admin/analytics/forecast'),
  getVaccines: () => request('/admin/vaccines'),
  getInventory: () => request('/admin/inventory'),
  createInventory: (payload) =>
    request('/admin/inventory', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCenters: () => request('/admin/centers'),
  getSchedules: () => request('/admin/schedules'),

  // AI Assistant
  askAssistant: (question) =>
    request('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),
}
