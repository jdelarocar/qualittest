import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// Laboratory APIs
export const laboratoryAPI = {
  getMe: () => api.get('/laboratories/me'),
  getAll: () => api.get('/laboratories'),
};

// Program APIs
export const programAPI = {
  getAll: () => api.get('/programs'),
  getById: (id) => api.get(`/programs/${id}`),
};

// Analyte APIs
export const analyteAPI = {
  getByProgram: (programId) => api.get(`/analytes/program/${programId}`),
  getMethods: (analyteId) => api.get(`/analytes/${analyteId}/methods`),
};

// Parameter APIs
export const parameterAPI = {
  get: (programId, year) => api.get('/parameters', { params: { programId, year } }),
  save: (data) => api.post('/parameters', data),
};

// Shipment APIs
export const shipmentAPI = {
  getAll: (params) => api.get('/shipments', { params }),
  getById: (id) => api.get(`/shipments/${id}`),
};

// Result APIs
export const resultAPI = {
  getByShipment: (shipmentId) => api.get(`/results/shipment/${shipmentId}`),
  submit: (shipmentId, data) => api.post(`/results/shipment/${shipmentId}`, data),
};

// Statistics APIs
export const statisticsAPI = {
  getByShipmentAndAnalyte: (shipmentId, analyteId) =>
    api.get(`/statistics/shipment/${shipmentId}/analyte/${analyteId}`),
  getIDSHistory: (params) => api.get('/statistics/history/ids', { params }),
  calculate: (shipmentId) => api.post(`/statistics/calculate/${shipmentId}`),
};

export default api;
