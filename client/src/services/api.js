import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor: unwrap data and normalize errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// ── Health ────────────────────────────────────────────────────────────────────
export const getHealth = () => api.get('/api/health');

// ── Analytics ─────────────────────────────────────────────────────────────────
export const getAnalyticsSummary = () => api.get('/api/analytics/summary');

export const getAnalyticsPages = (params = {}) =>
  api.get('/api/analytics/pages', { params });

// ── Sessions ──────────────────────────────────────────────────────────────────
export const getSessions = (page = 1, limit = 20, search = '') =>
  api.get('/api/sessions', { params: { page, limit, search } });

export const getSessionEvents = (sessionId) =>
  api.get(`/api/sessions/${encodeURIComponent(sessionId)}/events`);

// ── Pages ─────────────────────────────────────────────────────────────────────
export const getPages = () => api.get('/api/pages');

export const getPageClicks = (url) =>
  api.get('/api/pages/clicks', { params: { url } });

export default api;
