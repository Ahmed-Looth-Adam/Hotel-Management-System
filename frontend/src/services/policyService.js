import api from './api';

/**
 * Policy Service
 * API calls for hotel policy management
 */
const policyService = {
  /**
   * Get all policies
   * @param {Object} params - Query parameters (hotel, policy_type)
   * @returns {Promise} API response
   */
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/policies/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch policies',
      };
    }
  },

  /**
   * Get policy by ID
   * @param {number} id - Policy ID
   * @returns {Promise} API response
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/policies/${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch policy',
      };
    }
  },

  /**
   * Create a new policy
   * @param {Object} policyData - Policy data
   * @returns {Promise} API response
   */
  create: async (policyData) => {
    try {
      const response = await api.post('/policies/', policyData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to create policy',
      };
    }
  },

  /**
   * Update a policy
   * @param {number} id - Policy ID
   * @param {Object} policyData - Updated policy data
   * @returns {Promise} API response
   */
  update: async (id, policyData) => {
    try {
      const response = await api.put(`/policies/${id}/`, policyData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to update policy',
      };
    }
  },

  /**
   * Delete a policy
   * @param {number} id - Policy ID
   * @returns {Promise} API response
   */
  delete: async (id) => {
    try {
      await api.delete(`/policies/${id}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to delete policy',
      };
    }
  },
};

export default policyService;
