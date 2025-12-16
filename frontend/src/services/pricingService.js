import api from './api';

/**
 * Pricing Service
 * API calls for pricing management
 */
const pricingService = {
  // Room Type Pricing
  getRoomTypePricing: async (params = {}) => {
    try {
      const response = await api.get('/room-type-pricing/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch room type pricing',
      };
    }
  },

  createRoomTypePricing: async (data) => {
    try {
      const response = await api.post('/room-type-pricing/', data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to create room type pricing',
      };
    }
  },

  updateRoomTypePricing: async (id, data) => {
    try {
      const response = await api.put(`/room-type-pricing/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to update room type pricing',
      };
    }
  },

  deleteRoomTypePricing: async (id) => {
    try {
      await api.delete(`/room-type-pricing/${id}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to delete room type pricing',
      };
    }
  },

  // View Pricing
  getViewPricing: async (params = {}) => {
    try {
      const response = await api.get('/view-pricing/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch view pricing',
      };
    }
  },

  createViewPricing: async (data) => {
    try {
      const response = await api.post('/view-pricing/', data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to create view pricing',
      };
    }
  },

  updateViewPricing: async (id, data) => {
    try {
      const response = await api.put(`/view-pricing/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to update view pricing',
      };
    }
  },

  deleteViewPricing: async (id) => {
    try {
      await api.delete(`/view-pricing/${id}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to delete view pricing',
      };
    }
  },

  // Seasonal Pricing
  getSeasonalPricing: async (params = {}) => {
    try {
      const response = await api.get('/seasonal-pricing/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch seasonal pricing',
      };
    }
  },

  createSeasonalPricing: async (data) => {
    try {
      const response = await api.post('/seasonal-pricing/', data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to create seasonal pricing',
      };
    }
  },

  updateSeasonalPricing: async (id, data) => {
    try {
      const response = await api.put(`/seasonal-pricing/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to update seasonal pricing',
      };
    }
  },

  deleteSeasonalPricing: async (id) => {
    try {
      await api.delete(`/seasonal-pricing/${id}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to delete seasonal pricing',
      };
    }
  },

  // Day Type Pricing
  getDayTypePricing: async (params = {}) => {
    try {
      const response = await api.get('/day-type-pricing/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch day type pricing',
      };
    }
  },

  createDayTypePricing: async (data) => {
    try {
      const response = await api.post('/day-type-pricing/', data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to create day type pricing',
      };
    }
  },

  updateDayTypePricing: async (id, data) => {
    try {
      const response = await api.put(`/day-type-pricing/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to update day type pricing',
      };
    }
  },

  deleteDayTypePricing: async (id) => {
    try {
      await api.delete(`/day-type-pricing/${id}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to delete day type pricing',
      };
    }
  },

  // Promotional Discounts
  getPromotionalDiscounts: async (params = {}) => {
    try {
      const response = await api.get('/promotional-discounts/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch promotional discounts',
      };
    }
  },

  createPromotionalDiscount: async (data) => {
    try {
      const response = await api.post('/promotional-discounts/', data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to create promotional discount',
      };
    }
  },

  updatePromotionalDiscount: async (id, data) => {
    try {
      const response = await api.put(`/promotional-discounts/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to update promotional discount',
      };
    }
  },

  deletePromotionalDiscount: async (id) => {
    try {
      await api.delete(`/promotional-discounts/${id}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to delete promotional discount',
      };
    }
  },

  // Price Calculation
  calculatePrice: async (data) => {
    try {
      const response = await api.post('/pricing/calculate/', data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to calculate price',
      };
    }
  },
};

export default pricingService;
