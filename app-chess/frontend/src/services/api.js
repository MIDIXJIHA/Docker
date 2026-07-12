import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('chess_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token invalid/expired — clear session
      localStorage.removeItem('chess_token');
      localStorage.removeItem('chess_user');
      localStorage.removeItem('chess_session');
      
      // Only redirect if not already on login page
      if (window.location.hash !== '#/login') {
        window.dispatchEvent(new CustomEvent('session:expired'));
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  guest: () => api.post('/auth/guest'),
  profile: () => api.get('/auth/profile'),
};

// Games
export const gamesAPI = {
  history: () => api.get('/games/history'),
  get: (id) => api.get(`/games/${id}`),
  leaderboard: () => api.get('/games/leaderboard'),
};

// Bots
export const botsAPI = {
  list: () => api.get('/bots'),
};

// Health
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
