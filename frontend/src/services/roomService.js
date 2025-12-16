import api from './api';

/**
 * Room Service
 * API calls for room management
 */
const roomService = {
  /**
   * Get all rooms
   * @param {Object} params - Query parameters (hotel, room_type, status, is_active)
   * @returns {Promise} API response
   */
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/rooms/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch rooms',
      };
    }
  },

  /**
   * Get room by ID
   * @param {number} id - Room ID
   * @returns {Promise} API response
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/rooms/${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch room',
      };
    }
  },

  /**
   * Create a new room
   * @param {Object} roomData - Room data
   * @returns {Promise} API response
   */
  create: async (roomData) => {
    try {
      const response = await api.post('/rooms/', roomData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to create room',
      };
    }
  },

  /**
   * Update a room
   * @param {number} id - Room ID
   * @param {Object} roomData - Updated room data
   * @returns {Promise} API response
   */
  update: async (id, roomData) => {
    try {
      const response = await api.put(`/rooms/${id}/`, roomData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to update room',
      };
    }
  },

  /**
   * Partially update a room
   * @param {number} id - Room ID
   * @param {Object} roomData - Partial room data
   * @returns {Promise} API response
   */
  patch: async (id, roomData) => {
    try {
      const response = await api.patch(`/rooms/${id}/`, roomData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to update room',
      };
    }
  },

  /**
   * Delete a room
   * @param {number} id - Room ID
   * @returns {Promise} API response
   */
  delete: async (id) => {
    try {
      await api.delete(`/rooms/${id}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to delete room',
      };
    }
  },

  /**
   * Check room availability
   * @param {Object} params - Availability parameters
   * @returns {Promise} API response
   */
  checkAvailability: async (params) => {
    try {
      const response = await api.post('/rooms/availability/', params);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to check availability',
      };
    }
  },

  // Room Types
  getRoomTypes: async () => {
    try {
      const response = await api.get('/room-types/');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch room types',
      };
    }
  },

  createRoomType: async (data) => {
    try {
      const response = await api.post('/room-types/', data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to create room type',
      };
    }
  },

  updateRoomType: async (id, data) => {
    try {
      const response = await api.put(`/room-types/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to update room type',
      };
    }
  },

  deleteRoomType: async (id) => {
    try {
      await api.delete(`/room-types/${id}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to delete room type',
      };
    }
  },

  // Room Views
  getRoomViews: async (params = {}) => {
    try {
      const response = await api.get('/room-views/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch room views',
      };
    }
  },

  createRoomView: async (data) => {
    try {
      const response = await api.post('/room-views/', data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to create room view',
      };
    }
  },

  updateRoomView: async (id, data) => {
    try {
      const response = await api.put(`/room-views/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to update room view',
      };
    }
  },

  deleteRoomView: async (id) => {
    try {
      await api.delete(`/room-views/${id}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to delete room view',
      };
    }
  },
};

export default roomService;
