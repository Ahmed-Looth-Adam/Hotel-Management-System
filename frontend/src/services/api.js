import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Create axios instance with default config for hotels API
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/hotels`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create axios instance for bookings API
const bookingsApi = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
const addAuthToken = (config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Response interceptor to handle token refresh
const handleTokenRefresh = async (error) => {
  const originalRequest = error.config;

  if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;

    try {
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, {
        refresh: refreshToken,
      });

      const { access } = response.data;
      localStorage.setItem('access_token', access);
      originalRequest.headers.Authorization = `Bearer ${access}`;

      return axios(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      return Promise.reject(refreshError);
    }
  }

  return Promise.reject(error);
};

// Apply interceptors
api.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));
api.interceptors.response.use((response) => response, handleTokenRefresh);

bookingsApi.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));
bookingsApi.interceptors.response.use((response) => response, handleTokenRefresh);

export { api, bookingsApi, API_BASE_URL };
export default api;
