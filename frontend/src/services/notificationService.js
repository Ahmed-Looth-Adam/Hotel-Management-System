/**
 * Notification Service - API calls for notifications
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { bookingsApi } from './api';

const notificationService = {
  /**
   * Get all notifications for the current user
   */
  getAll: async () => {
    try {
      const response = await bookingsApi.get('/notifications/');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async () => {
    try {
      const response = await bookingsApi.get('/notifications/unread_count/');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Mark a specific notification as read
   */
  markAsRead: async (notificationId) => {
    try {
      const response = await bookingsApi.post(`/notifications/${notificationId}/mark_read/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    try {
      const response = await bookingsApi.post('/notifications/mark_all_read/');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Clear all notifications (marks them as read)
   */
  clearAll: async () => {
    try {
      const response = await bookingsApi.post('/notifications/clear_all/');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },
};

export default notificationService;
