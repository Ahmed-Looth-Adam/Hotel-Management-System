/**
 * Order Service - API calls for order management (multi-room bookings)
 */

import { bookingsApi } from './api';

const orderService = {
  /**
   * Create a new order with multiple rooms from cart
   * @param {Object} data - { rooms: [...] }
   */
  create: async (data) => {
    try {
      const response = await bookingsApi.post('/orders/', data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Order creation error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.rooms || error.response?.data?.message || 'Failed to create order'
      };
    }
  },

  /**
   * Get all orders for the current user
   */
  getAll: async () => {
    try {
      const response = await bookingsApi.get('/orders/');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get orders error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch orders'
      };
    }
  },

  /**
   * Get a specific order by ID
   * @param {number} id - Order ID
   */
  getById: async (id) => {
    try {
      const response = await bookingsApi.get(`/orders/${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get order error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch order'
      };
    }
  },
};

export default orderService;
