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

  // ============== Room Type Pricing ==============

  getRoomTypePricing: async (hotelId) => {
    try {
      const response = await api.get('/room-type-pricing/', { params: { hotel: hotelId } });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to fetch pricing' };
    }
  },

  createRoomTypePricing: async (data) => {
    try {
      const response = await api.post('/room-type-pricing/', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to create pricing' };
    }
  },

  updateRoomTypePricing: async (id, data) => {
    try {
      const response = await api.put(`/room-type-pricing/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to update pricing' };
    }
  },

  deleteRoomTypePricing: async (id) => {
    try {
      await api.delete(`/room-type-pricing/${id}/`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to delete pricing' };
    }
  },

  // ============== Seasonal Pricing ==============

  getSeasonalPricing: async (hotelId) => {
    try {
      const response = await api.get('/seasonal-pricing/', { params: { hotel: hotelId } });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to fetch seasons' };
    }
  },

  createSeasonalPricing: async (data) => {
    try {
      const response = await api.post('/seasonal-pricing/', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to create season' };
    }
  },

  updateSeasonalPricing: async (id, data) => {
    try {
      const response = await api.put(`/seasonal-pricing/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to update season' };
    }
  },

  deleteSeasonalPricing: async (id) => {
    try {
      await api.delete(`/seasonal-pricing/${id}/`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to delete season' };
    }
  },

  // ============== Ancillary Services ==============

  getAncillaryServices: async (hotelId) => {
    try {
      const response = await api.get('/ancillary-services/', { params: { hotel: hotelId } });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to fetch services' };
    }
  },

  createAncillaryService: async (data) => {
    try {
      const response = await api.post('/ancillary-services/', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to create service' };
    }
  },

  updateAncillaryService: async (id, data) => {
    try {
      const response = await api.put(`/ancillary-services/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to update service' };
    }
  },

  deleteAncillaryService: async (id) => {
    try {
      await api.delete(`/ancillary-services/${id}/`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to delete service' };
    }
  },

  // ============== Hotel Policies ==============

  getPolicies: async (hotelId) => {
    try {
      const response = await api.get('/policies/', { params: { hotel: hotelId } });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to fetch policies' };
    }
  },

  createPolicy: async (data) => {
    try {
      const response = await api.post('/policies/', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to create policy' };
    }
  },

  updatePolicy: async (id, data) => {
    try {
      const response = await api.put(`/policies/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to update policy' };
    }
  },

  deletePolicy: async (id) => {
    try {
      await api.delete(`/policies/${id}/`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to delete policy' };
    }
  },

  // ============== Galleries ==============

  getGalleries: async (hotelId) => {
    try {
      const response = await api.get('/galleries/', { params: { hotel: hotelId } });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to fetch galleries' };
    }
  },

  createGallery: async (data) => {
    try {
      const response = await api.post('/galleries/', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to create gallery' };
    }
  },

  updateGallery: async (id, data) => {
    try {
      const response = await api.put(`/galleries/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to update gallery' };
    }
  },

  deleteGallery: async (id) => {
    try {
      await api.delete(`/galleries/${id}/`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to delete gallery' };
    }
  },

  assignRoomsToGallery: async (galleryId, roomIds) => {
    try {
      const response = await api.post(`/galleries/${galleryId}/assign_rooms/`, { room_ids: roomIds });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to assign rooms' };
    }
  },

  unassignRoomsFromGallery: async (galleryId, roomIds) => {
    try {
      const response = await api.post(`/galleries/${galleryId}/unassign_rooms/`, { room_ids: roomIds });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to unassign rooms' };
    }
  },

  // ============== Gallery Images ==============

  uploadGalleryImage: async (galleryId, formData) => {
    try {
      formData.append('gallery', galleryId);
      const response = await api.post('/gallery-images/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to upload image' };
    }
  },

  deleteGalleryImage: async (id) => {
    try {
      await api.delete(`/gallery-images/${id}/`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to delete image' };
    }
  },

  // ============== Rooms ==============

  getRooms: async (hotelId) => {
    try {
      const response = await api.get('/rooms/', { params: { hotel: hotelId } });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to fetch rooms' };
    }
  },

  createRoom: async (data) => {
    try {
      const response = await api.post('/rooms/', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to create room' };
    }
  },

  updateRoom: async (id, data) => {
    try {
      const response = await api.put(`/rooms/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to update room' };
    }
  },

  deleteRoom: async (id) => {
    try {
      await api.delete(`/rooms/${id}/`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to delete room' };
    }
  },

  // ============== Room Views ==============

  getRoomViews: async (hotelId) => {
    try {
      const response = await api.get('/room-views/', { params: { hotel: hotelId } });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to fetch room views' };
    }
  },

  // ============== Amenity Categories ==============

  getAmenityCategories: async (hotelId) => {
    try {
      const response = await api.get('/amenity-categories/', { params: { hotel: hotelId } });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to fetch amenity categories' };
    }
  },

  createAmenityCategory: async (data) => {
    try {
      const response = await api.post('/amenity-categories/', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to create amenity category' };
    }
  },

  updateAmenityCategory: async (id, data) => {
    try {
      const response = await api.put(`/amenity-categories/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to update amenity category' };
    }
  },

  deleteAmenityCategory: async (id) => {
    try {
      await api.delete(`/amenity-categories/${id}/`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to delete amenity category' };
    }
  },

  // ============== Amenities ==============

  getAmenities: async (hotelId, categoryId = null) => {
    try {
      const params = { hotel: hotelId };
      if (categoryId) params.category = categoryId;
      const response = await api.get('/amenities/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to fetch amenities' };
    }
  },

  createAmenity: async (data) => {
    try {
      const response = await api.post('/amenities/', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to create amenity' };
    }
  },

  updateAmenity: async (id, data) => {
    try {
      const response = await api.put(`/amenities/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to update amenity' };
    }
  },

  deleteAmenity: async (id) => {
    try {
      await api.delete(`/amenities/${id}/`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to delete amenity' };
    }
  },
};

export default hotelService;
