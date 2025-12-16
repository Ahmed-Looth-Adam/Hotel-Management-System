import api from './api';

/**
 * Amenity Service
 * API calls for amenity management
 */
const amenityService = {
  // Amenity Categories
  getCategories: async (params = {}) => {
    try {
      const response = await api.get('/amenity-categories/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch amenity categories',
      };
    }
  },

  getCategoryById: async (id) => {
    try {
      const response = await api.get(`/amenity-categories/${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch amenity category',
      };
    }
  },

  createCategory: async (data) => {
    try {
      const response = await api.post('/amenity-categories/', data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to create amenity category',
      };
    }
  },

  updateCategory: async (id, data) => {
    try {
      const response = await api.put(`/amenity-categories/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to update amenity category',
      };
    }
  },

  deleteCategory: async (id) => {
    try {
      await api.delete(`/amenity-categories/${id}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to delete amenity category',
      };
    }
  },

  // Amenities
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/amenities/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch amenities',
      };
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/amenities/${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch amenity',
      };
    }
  },

  create: async (data) => {
    try {
      const response = await api.post('/amenities/', data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to create amenity',
      };
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/amenities/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to update amenity',
      };
    }
  },

  delete: async (id) => {
    try {
      await api.delete(`/amenities/${id}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to delete amenity',
      };
    }
  },

  // Room Amenities (assignments)
  getRoomAmenities: async (params = {}) => {
    try {
      const response = await api.get('/room-amenities/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch room amenities',
      };
    }
  },

  assignAmenityToRoom: async (data) => {
    try {
      const response = await api.post('/room-amenities/', data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to assign amenity to room',
      };
    }
  },

  removeAmenityFromRoom: async (id) => {
    try {
      await api.delete(`/room-amenities/${id}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to remove amenity from room',
      };
    }
  },

  /**
   * Bulk assign amenities to a room
   * @param {number} roomId - Room ID
   * @param {number[]} amenityIds - Array of amenity IDs
   * @returns {Promise} API response
   */
  bulkAssignToRoom: async (roomId, amenityIds) => {
    try {
      const promises = amenityIds.map((amenityId) =>
        api.post('/room-amenities/', { room: roomId, amenity: amenityId })
      );
      await Promise.all(promises);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to assign amenities to room',
      };
    }
  },
};

export default amenityService;
