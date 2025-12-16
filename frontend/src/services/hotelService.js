import api from './api';

/**
 * Hotel Service
 * API calls for hotel management
 */
const hotelService = {
  /**
   * Get all hotels
   * @param {Object} params - Query parameters (is_active, city)
   * @returns {Promise} API response
   */
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/hotels/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch hotels',
      };
    }
  },

  /**
   * Get hotel by ID
   * @param {number} id - Hotel ID
   * @returns {Promise} API response
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/hotels/${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch hotel',
      };
    }
  },

  /**
   * Create a new hotel
   * @param {Object} hotelData - Hotel data
   * @returns {Promise} API response
   */
  create: async (hotelData) => {
    try {
      const response = await api.post('/hotels/', hotelData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to create hotel',
      };
    }
  },

  /**
   * Update a hotel
   * @param {number} id - Hotel ID
   * @param {Object} hotelData - Updated hotel data
   * @returns {Promise} API response
   */
  update: async (id, hotelData) => {
    try {
      const response = await api.put(`/hotels/${id}/`, hotelData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to update hotel',
      };
    }
  },

  /**
   * Partially update a hotel
   * @param {number} id - Hotel ID
   * @param {Object} hotelData - Partial hotel data
   * @returns {Promise} API response
   */
  patch: async (id, hotelData) => {
    try {
      const response = await api.patch(`/hotels/${id}/`, hotelData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to update hotel',
      };
    }
  },

  /**
   * Delete a hotel
   * @param {number} id - Hotel ID
   * @returns {Promise} API response
   */
  delete: async (id) => {
    try {
      await api.delete(`/hotels/${id}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to delete hotel',
      };
    }
  },
};

export default hotelService;
