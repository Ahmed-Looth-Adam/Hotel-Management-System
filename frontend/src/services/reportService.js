/**
 * Report Service - API calls for reports and analytics
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import api from './api';

const reportService = {
  // Get occupancy report
  getOccupancy: async (params = {}) => {
    try {
      const response = await api.get('/reports/occupancy/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Get revenue report
  getRevenue: async (params = {}) => {
    try {
      const response = await api.get('/reports/revenue/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Get guest demographics
  getGuestDemographics: async (params = {}) => {
    try {
      const response = await api.get('/reports/guest_demographics/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Get dashboard summary
  getDashboardSummary: async (params = {}) => {
    try {
      const response = await api.get('/reports/dashboard_summary/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Get service popularity
  getServicePopularity: async (params = {}) => {
    try {
      const response = await api.get('/reports/service_popularity/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },
};

export default reportService;
