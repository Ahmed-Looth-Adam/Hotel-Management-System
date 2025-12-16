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
        // Refresh failed, clear tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');

        // Don't redirect here - let ProtectedRoute handle it
        // This prevents hard page reloads that clear error messages
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
      // Clear any existing tokens on failed login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');

      // Extract error details from response
      const errorData = error.response?.data || {};
      const errorMessage = errorData.error || errorData.detail || errorData.message || 'Incorrect username or password';

      // Include additional context if available
      let fullErrorMessage = errorMessage;
      if (errorData.remaining_attempts !== undefined) {
        fullErrorMessage += ` (${errorData.remaining_attempts} attempts remaining)`;
      } else if (errorData.locked_until) {
        fullErrorMessage = `${errorMessage}. Locked until ${errorData.locked_until}`;
      }

      return {
        success: false,
        error: fullErrorMessage,
        errorData: errorData, // Pass full error data for additional handling
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
   * Change user password
   * @param {Object} passwordData - Contains old and new passwords
   * @returns {Promise} API response
   */
  changePassword: async (passwordData) => {
    try {
      const response = await authAPI.post('/change-password/', passwordData);
      return { success: true, data: response.data };
    } catch (error) {
      const errorData = error.response?.data || {};
      const errorMessage = errorData.error || errorData.detail || errorData.message || 'Failed to change password';

      return {
        success: false,
        error: errorMessage,
        errorData: errorData, // Pass full error data for additional handling
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

  /**
   * Request a password reset email
   * @param {string} email - User's email address
   * @returns {Promise} API response
   */
  requestPasswordReset: async (email) => {
    try {
      console.log('Requesting password reset for email:', email);
      const payload = {email};
      const response = await authAPI.post('/password-reset/', payload );
      console.log('Password reset response:', response.data);
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to request password reset.',
      };
    }
  },

  /**
   * Confirms password reset using UID/Token and sets the new password
   * @param {string} uid - User ID encoded in base64
   * @param {string} token - The secure, time-sensitive token
   * @param {string} new_password - The user's desired new password
   * @returns {Promise} API response
   */
  confirmPasswordReset: async (uid, token, new_password) => {
    try {
      // Matches the backend endpoint: path('password-reset-confirm/', ...)
      const response = await authAPI.post('/password-reset-confirm/', { 
        uid, 
        token, 
        new_password // This matches the key expected by the Django view
      });
      return { success: true, message: response.data.detail };
    } catch (error) {
      // The backend returns a specific error for invalid/expired tokens
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to complete password reset.',
      };
    }
  },
  
/**
   * Admin: Get all users (with optional role filter)
   * @param {string} role - Optional role filter ('admin', 'manager', 'staff', 'guest')
   * @returns {Promise} API response
   */
  getUsers: async (role = '') => {
    try {
      const query = role ? `?role=${role}` : '';
      const response = await authAPI.get(`/admin/users/${query}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch users',
      };
    }
  },

  /**
   * Admin: Create a new staff/manager account
   * @param {Object|FormData} userData - Registration data (supports FormData for file uploads)
   * @returns {Promise} API response
   */
  createUser: async (userData) => {
    try {
      const config = userData instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};
      const response = await authAPI.post('/admin/users/', userData, config);
      return { success: true, data: response.data };
    } catch (error) {
      // Return full error object to handle field-specific validation errors
      return {
        success: false,
        error: error.response?.data || 'Failed to create user',
      };
    }
  },

  /**
   * Admin: Update user details (role, active status, or password reset)
   * @param {number} userId - ID of user to update
   * @param {Object|FormData} updateData - Fields to update (supports FormData for file uploads)
   * @returns {Promise} API response
   */
  updateUser: async (userId, updateData) => {
    try {
      const config = updateData instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};
      const response = await authAPI.patch(`/admin/users/${userId}/`, updateData, config);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update user',
      };
    }
  },

  /**
   * Admin: Update user details (role, active status, or password reset)
   * @param {number} userId - ID of user to update
   * @returns {Promise} API response
   */
  deleteUser: async (userId) => { 
    try {
      const response = await authAPI.delete(`/admin/users/${userId}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete user',
      };
    }
  },


};

export default authService;
