import { bookingsApi } from './api';

const savedCardService = {
  /**
   * Get all saved cards for the current user
   */
  getAll: async () => {
    try {
      const response = await bookingsApi.get('/payments/saved-cards/');
      // Handle paginated response from DRF
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to fetch saved cards' },
      };
    }
  },

  /**
   * Get a specific saved card by ID
   */
  getById: async (id) => {
    try {
      const response = await bookingsApi.get(`/payments/saved-cards/${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to fetch card' },
      };
    }
  },

  /**
   * Get the default saved card
   */
  getDefault: async () => {
    try {
      const response = await bookingsApi.get('/payments/saved-cards/default/');
      return { success: true, data: response.data };
    } catch (error) {
      if (error.response?.status === 404) {
        return { success: true, data: null };
      }
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to fetch default card' },
      };
    }
  },

  /**
   * Save a new card
   * @param {Object} cardData - { card_number, expiry_date, cvv, cardholder_name, card_nickname?, is_default? }
   */
  create: async (cardData) => {
    try {
      const response = await bookingsApi.post('/payments/saved-cards/', cardData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to save card' },
      };
    }
  },

  /**
   * Update a saved card
   * @param {number} id - Card ID
   * @param {Object} cardData - { card_nickname?, is_default?, is_active? }
   */
  update: async (id, cardData) => {
    try {
      const response = await bookingsApi.patch(`/payments/saved-cards/${id}/`, cardData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to update card' },
      };
    }
  },

  /**
   * Set a card as default
   * @param {number} id - Card ID
   */
  setDefault: async (id) => {
    try {
      const response = await bookingsApi.post(`/payments/saved-cards/${id}/set_default/`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to set default card' },
      };
    }
  },

  /**
   * Delete a saved card (soft delete)
   * @param {number} id - Card ID
   */
  delete: async (id) => {
    try {
      await bookingsApi.delete(`/payments/saved-cards/${id}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to delete card' },
      };
    }
  },
};

export default savedCardService;
