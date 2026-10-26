/**
 * NoiseWatch API Service
 *
 * Centralized API client using Axios.
 * In development, requests are proxied through Vite to the FastAPI backend.
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('noisewatch_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('noisewatch_token');
      localStorage.removeItem('noisewatch_user');
      // Don't redirect if already on login/landing
      if (!window.location.pathname.match(/^\/(login|register|)$/)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── API Methods ───────────────────────────────────────────────

export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (email, password, display_name) =>
    api.post('/api/auth/register', { email, password, display_name }),
  getProfile: () => api.get('/api/auth/me'),
};

export const dashboardAPI = {
  getSummary: () => api.get('/api/dashboard/summary'),
};

export const locationsAPI = {
  list: (params = {}) => api.get('/api/locations', { params }),
  get: (id) => api.get(`/api/locations/${id}`),
  create: (data) => api.post('/api/locations', data),
};

export const readingsAPI = {
  list: (params = {}) => api.get('/api/readings', { params }),
  create: (data) => api.post('/api/readings', data),
};

export const incidentsAPI = {
  list: (params = {}) => api.get('/api/incidents', { params }),
  get: (id) => api.get(`/api/incidents/${id}`),
  review: (id, data) => api.post(`/api/incidents/${id}/review`, data),
  generateReport: (id) => api.post(`/api/incidents/${id}/generate-report`),
};

export const reportsAPI = {
  list: (params = {}) => api.get('/api/reports', { params }),
  get: (id) => api.get(`/api/reports/${id}`),
  update: (id, data) => api.put(`/api/reports/${id}`, data),
  download: (id) => api.get(`/api/reports/${id}/download`, { responseType: 'blob' }),
  getDownloadUrl: (id) => `${API_BASE}/api/reports/${id}/download`,
  generateAINarrative: (data) => api.post('/api/reports/generate-ai-narrative', data),
};

export const audioAPI = {
  getModelInfo: () => api.get('/api/audio/model-info'),
  extractFeatures: (samples, sampleRate = 22050) =>
    api.post('/api/audio/extract-features', { samples, sample_rate: sampleRate }),
  classify: (samples, sampleRate = 22050, forceFallback = false) =>
    api.post('/api/audio/classify', { samples, sample_rate: sampleRate, force_fallback: forceFallback }),
  classifyFeatures: (features, forceFallback = false) =>
    api.post('/api/audio/classify-features', { ...features, force_fallback: forceFallback }),
  retrain: (samplesPerClass = 250, nEstimators = 150) =>
    api.post('/api/audio/retrain', { samples_per_class: samplesPerClass, n_estimators: nEstimators }),
  uploadAndClassify: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/audio/upload-and-classify', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  detectZone: (lat, lon) =>
    api.get('/api/audio/detect-zone', { params: { lat, lon } }),
  evaluateMobileReading: (data) =>
    api.post('/api/audio/evaluate-mobile-reading', data),
};

export const complaintsAPI = {
  list: (params = {}) => api.get('/api/complaints', { params }),
  get: (id) => api.get(`/api/complaints/${id}`),
  create: (data) => api.post('/api/complaints', data),
  submit: (id) => api.post(`/api/complaints/${id}/submit`),
};

export const devicesAPI = {
  list: (params = {}) => api.get('/api/admin/devices', { params }),
};

export const notificationsAPI = {
  list: () => api.get('/api/notifications'),
};

export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
