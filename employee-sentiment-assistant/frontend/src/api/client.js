import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sa_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sa_token')
      localStorage.removeItem('sa_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────
export const authAPI = {
  register: data => api.post('/api/auth/register', data),
  login:    data => api.post('/api/auth/login', data),
  me:       ()   => api.get('/api/auth/me'),
  users:    ()   => api.get('/api/auth/users'),
}

// ── Feedback ──────────────────────────────────
export const feedbackAPI = {
  submit: data => api.post('/api/feedback/submit', data),
  list:   (params = {}) => api.get('/api/feedback/list', { params }),
  get:    id   => api.get(`/api/feedback/${id}`),
}

// ── Analytics ─────────────────────────────────
export const analyticsAPI = {
  summary: () => api.get('/api/analytics/summary'),
  my:      () => api.get('/api/analytics/my'),
}

// ── Alerts ────────────────────────────────────
export const alertsAPI = {
  list:    (includeResolved = false) =>
    api.get('/api/alerts/', { params: { include_resolved: includeResolved } }),
  resolve: id => api.patch(`/api/alerts/${id}/resolve`),
}

// ── Chatbot ───────────────────────────────────
export const chatbotAPI = {
  ask: message => api.post('/api/chatbot/ask', { message }),
}

// ── Reports ───────────────────────────────────
export const reportsAPI = {
  exportCSV: (department = null) =>
    api.get('/api/reports/export/csv', {
      params:       department ? { department } : {},
      responseType: 'blob',
    }),
  summary: () => api.get('/api/reports/summary'),
}

export default api
