import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Create axios instance with default config
const authAPI = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
authAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
authAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Try to refresh the token
        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;

        // Update token in localStorage
        localStorage.setItem('access_token', access);

        // Update the failed request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;

        // Retry the original request
        return authAPI(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');

        // Redirect to login page
        window.location.href = '/login';

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Authentication Service
 * Centralized API calls for authentication
 */
const authService = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} API response
   */
  register: async (userData) => {
    try {
      const response = await authAPI.post('/register/', userData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Registration failed',
      };
    }
  },

  /**
   * Login user
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise} API response with tokens
   */
  login: async (username, password) => {
    try {
      const response = await authAPI.post('/login/', {
        username,
        password,
      });

      const { access, refresh, user } = response.data;

      // Store tokens and user data
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data || 'Login failed',
      };
    }
  },

  /**
   * Logout user
   * @returns {Promise} API response
   */
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        await authAPI.post('/logout/', {
          refresh: refreshToken,
        });
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Logout failed',
      };
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Refresh access token
   * @returns {Promise} API response with new access token
   */
  refreshToken: async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');

      if (!refresh) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
        refresh,
      });

      const { access } = response.data;
      localStorage.setItem('access_token', access);

      return { success: true, token: access };
    } catch (error) {
      // Clear tokens on refresh failure
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');

      return {
        success: false,
        error: error.response?.data || 'Token refresh failed',
      };
    }
  },

  /**
   * Get user profile
   * @returns {Promise} API response with user data
   */
  getProfile: async () => {
    try {
      const response = await authAPI.get('/profile/');

      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response.data));

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch profile',
      };
    }
  },

  /**
   * Update user profile
   * @param {Object} userData - Updated user data
   * @returns {Promise} API response
   */
  updateProfile: async (userData) => {
    try {
      const response = await authAPI.put('/profile/', userData);

      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response.data));

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to update profile',
      };
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated: () => {
    const token = localStorage.getItem('access_token');
    return !!token;
  },

  /**
   * Get current user from localStorage
   * @returns {Object|null} User object or null
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  /**
   * Get access token
   * @returns {string|null} Access token or null
   */
  getAccessToken: () => {
    return localStorage.getItem('access_token');
  },

  /**
   * Get refresh token
   * @returns {string|null} Refresh token or null
   */
  getRefreshToken: () => {
    return localStorage.getItem('refresh_token');
  },
};

export default authService;
