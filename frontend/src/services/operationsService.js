import api from './api';

/**
 * Operations Service
 * API calls for hotel operations dashboard
 */
const operationsService = {
  /**
   * Get operations dashboard data
   * @param {number} hotelId - Hotel ID
   * @returns {Promise} API response
   */
  getDashboard: async (hotelId) => {
    try {
      const response = await api.get('/operations/dashboard/', {
        params: { hotel: hotelId },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch dashboard data',
      };
    }
  },

  // Late Checkout Requests
  /**
   * Get late checkout requests
   * @param {Object} params - Query parameters (hotel, status)
   * @returns {Promise} API response
   */
  getLateCheckoutRequests: async (params = {}) => {
    try {
      const response = await api.get('/late-checkout-requests/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch late checkout requests',
      };
    }
  },

  /**
   * Get late checkout request by ID
   * @param {number} id - Request ID
   * @returns {Promise} API response
   */
  getLateCheckoutRequestById: async (id) => {
    try {
      const response = await api.get(`/late-checkout-requests/${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch late checkout request',
      };
    }
  },

  /**
   * Create a late checkout request
   * @param {Object} requestData - Request data (booking_id, requested_checkout_time, guest_notes)
   * @returns {Promise} API response
   */
  createLateCheckoutRequest: async (requestData) => {
    try {
      const response = await api.post('/late-checkout-requests/', requestData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to create late checkout request',
      };
    }
  },

  /**
   * Approve a late checkout request
   * @param {number} id - Request ID
   * @param {Object} data - Approval data (notes)
   * @returns {Promise} API response
   */
  approveLateCheckout: async (id, data = {}) => {
    try {
      const response = await api.post(`/late-checkout-requests/${id}/approve/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to approve late checkout',
      };
    }
  },

  /**
   * Reject a late checkout request
   * @param {number} id - Request ID
   * @param {Object} data - Rejection data (reason)
   * @returns {Promise} API response
   */
  rejectLateCheckout: async (id, data = {}) => {
    try {
      const response = await api.post(`/late-checkout-requests/${id}/reject/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to reject late checkout',
      };
    }
  },

  /**
   * Get today's check-ins
   * @param {number} hotelId - Hotel ID
   * @returns {Promise} API response
   */
  getTodayCheckIns: async (hotelId) => {
    try {
      const response = await api.get('/operations/dashboard/', {
        params: { hotel: hotelId },
      });
      return {
        success: true,
        data: response.data.today_checkins?.bookings || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch today\'s check-ins',
      };
    }
  },

  /**
   * Get today's check-outs
   * @param {number} hotelId - Hotel ID
   * @returns {Promise} API response
   */
  getTodayCheckOuts: async (hotelId) => {
    try {
      const response = await api.get('/operations/dashboard/', {
        params: { hotel: hotelId },
      });
      return {
        success: true,
        data: response.data.today_checkouts?.bookings || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch today\'s check-outs',
      };
    }
  },

  /**
   * Get current occupancy
   * @param {number} hotelId - Hotel ID
   * @returns {Promise} API response
   */
  getCurrentOccupancy: async (hotelId) => {
    try {
      const response = await api.get('/operations/dashboard/', {
        params: { hotel: hotelId },
      });
      return {
        success: true,
        data: response.data.occupancy || {}
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch occupancy',
      };
    }
  },
};

export default operationsService;
