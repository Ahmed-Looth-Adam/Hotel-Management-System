import { bookingsApi } from './api';

/**
 * Booking Service
 * API calls for booking management
 */
const bookingService = {
  /**
   * Get all bookings
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getAll: async (params = {}) => {
    try {
      const response = await bookingsApi.get('/bookings/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch bookings',
      };
    }
  },

  /**
   * Get current user's bookings
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getMyBookings: async (params = {}) => {
    try {
      const response = await bookingsApi.get('/bookings/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch your bookings',
      };
    }
  },

  /**
   * Get booking by ID
   * @param {number} id - Booking ID
   * @returns {Promise} API response
   */
  getById: async (id) => {
    try {
      const response = await bookingsApi.get(`/bookings/${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch booking',
      };
    }
  },

  /**
   * Create a new booking
   * @param {Object} bookingData - Booking data
   * @returns {Promise} API response
   */
  create: async (bookingData) => {
    try {
      const response = await bookingsApi.post('/bookings/', bookingData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to create booking',
      };
    }
  },

  /**
   * Update a booking
   * @param {number} id - Booking ID
   * @param {Object} bookingData - Updated booking data
   * @returns {Promise} API response
   */
  update: async (id, bookingData) => {
    try {
      const response = await bookingsApi.put(`/bookings/${id}/`, bookingData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to update booking',
      };
    }
  },

  /**
   * Partially update a booking
   * @param {number} id - Booking ID
   * @param {Object} bookingData - Partial booking data
   * @returns {Promise} API response
   */
  patch: async (id, bookingData) => {
    try {
      const response = await bookingsApi.patch(`/bookings/${id}/`, bookingData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to update booking',
      };
    }
  },

  /**
   * Delete a booking
   * @param {number} id - Booking ID
   * @returns {Promise} API response
   */
  delete: async (id) => {
    try {
      await bookingsApi.delete(`/bookings/${id}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to delete booking',
      };
    }
  },

  /**
   * Check in a booking
   * @param {number} id - Booking ID
   * @param {Object} data - Check-in data (notes, actual_guests)
   * @returns {Promise} API response
   */
  checkIn: async (id, data = {}) => {
    try {
      const response = await bookingsApi.post(`/bookings/${id}/check_in/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to check in',
      };
    }
  },

  /**
   * Check out a booking
   * @param {number} id - Booking ID
   * @param {Object} data - Check-out data (notes, room_condition, additional_charges)
   * @returns {Promise} API response
   */
  checkOut: async (id, data = {}) => {
    try {
      const response = await bookingsApi.post(`/bookings/${id}/check_out/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to check out',
      };
    }
  },

  /**
   * Cancel a booking
   * @param {number} id - Booking ID
   * @param {Object} data - Cancellation data (reason)
   * @returns {Promise} API response
   */
  cancel: async (id, data = {}) => {
    try {
      const response = await bookingsApi.post(`/bookings/${id}/cancel/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to cancel booking',
      };
    }
  },

  /**
   * Reassign room for a booking
   * @param {number} id - Booking ID
   * @param {Object} data - Reassignment data (new_room_id, reason)
   * @returns {Promise} API response
   */
  reassignRoom: async (id, data) => {
    try {
      const response = await bookingsApi.post(`/bookings/${id}/reassign_room/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to reassign room',
      };
    }
  },

  /**
   * Get booking guests
   * @param {number} bookingId - Booking ID
   * @returns {Promise} API response
   */
  getGuests: async (bookingId) => {
    try {
      const response = await bookingsApi.get(`/bookings/${bookingId}/guests/`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch guests',
      };
    }
  },

  /**
   * Add guest to booking
   * @param {number} bookingId - Booking ID
   * @param {Object} guestData - Guest data
   * @returns {Promise} API response
   */
  addGuest: async (bookingId, guestData) => {
    try {
      const response = await bookingsApi.post(`/bookings/${bookingId}/add_guest/`, guestData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to add guest',
      };
    }
  },
};

export default bookingService;
