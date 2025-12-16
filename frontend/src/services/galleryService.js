import api from './api';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Gallery Service
 * API calls for gallery management
 */
const galleryService = {
  // Galleries
  /**
   * Get all galleries
   * @param {Object} params - Query parameters (hotel, gallery_type)
   * @returns {Promise} API response
   */
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/galleries/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch galleries',
      };
    }
  },

  /**
   * Get gallery by ID
   * @param {number} id - Gallery ID
   * @returns {Promise} API response
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/galleries/${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch gallery',
      };
    }
  },

  /**
   * Create a new gallery
   * @param {Object} galleryData - Gallery data
   * @returns {Promise} API response
   */
  create: async (galleryData) => {
    try {
      const response = await api.post('/galleries/', galleryData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to create gallery',
      };
    }
  },

  /**
   * Update a gallery
   * @param {number} id - Gallery ID
   * @param {Object} galleryData - Updated gallery data
   * @returns {Promise} API response
   */
  update: async (id, galleryData) => {
    try {
      const response = await api.put(`/galleries/${id}/`, galleryData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to update gallery',
      };
    }
  },

  /**
   * Delete a gallery
   * @param {number} id - Gallery ID
   * @returns {Promise} API response
   */
  delete: async (id) => {
    try {
      await api.delete(`/galleries/${id}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to delete gallery',
      };
    }
  },

  // Gallery Images
  /**
   * Get all images for a gallery
   * @param {Object} params - Query parameters (gallery)
   * @returns {Promise} API response
   */
  getImages: async (params = {}) => {
    try {
      const response = await api.get('/gallery-images/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch gallery images',
      };
    }
  },

  /**
   * Upload an image to a gallery
   * @param {number} galleryId - Gallery ID
   * @param {File} imageFile - Image file to upload
   * @param {Object} imageData - Additional image data (alt_text, is_primary, sort_order)
   * @returns {Promise} API response
   */
  uploadImage: async (galleryId, imageFile, imageData = {}) => {
    try {
      const formData = new FormData();
      formData.append('gallery', galleryId);
      formData.append('image', imageFile);

      if (imageData.alt_text) {
        formData.append('alt_text', imageData.alt_text);
      }
      if (imageData.is_primary !== undefined) {
        formData.append('is_primary', imageData.is_primary);
      }
      if (imageData.sort_order !== undefined) {
        formData.append('sort_order', imageData.sort_order);
      }

      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_BASE_URL}/api/hotels/gallery-images/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to upload image',
      };
    }
  },

  /**
   * Update image metadata
   * @param {number} id - Image ID
   * @param {Object} imageData - Updated image data
   * @returns {Promise} API response
   */
  updateImage: async (id, imageData) => {
    try {
      const response = await api.patch(`/gallery-images/${id}/`, imageData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to update image',
      };
    }
  },

  /**
   * Delete an image
   * @param {number} id - Image ID
   * @returns {Promise} API response
   */
  deleteImage: async (id) => {
    try {
      await api.delete(`/gallery-images/${id}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to delete image',
      };
    }
  },

  /**
   * Set image as primary
   * @param {number} id - Image ID
   * @returns {Promise} API response
   */
  setPrimaryImage: async (id) => {
    try {
      const response = await api.patch(`/gallery-images/${id}/`, { is_primary: true });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to set primary image',
      };
    }
  },

  /**
   * Reorder images in a gallery
   * @param {number} galleryId - Gallery ID
   * @param {Array} imageOrders - Array of { id, sort_order } objects
   * @returns {Promise} API response
   */
  reorderImages: async (galleryId, imageOrders) => {
    try {
      const promises = imageOrders.map(({ id, sort_order }) =>
        api.patch(`/gallery-images/${id}/`, { sort_order })
      );
      await Promise.all(promises);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to reorder images',
      };
    }
  },
};

export default galleryService;
