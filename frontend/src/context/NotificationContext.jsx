/**
 * NotificationContext - Global notification state management
 *
 * Fetches notifications from backend API with polling support.
 * Notifications are filtered by user role and assigned hotel on the backend.
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';

const NotificationContext = createContext(null);

// Polling interval in milliseconds (30 seconds)
const POLLING_INTERVAL = 30000;

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const pollingRef = useRef(null);

  /**
   * Fetch notifications from the backend
   */
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    // Only fetch for staff, manager, and admin roles
    if (!['staff', 'manager', 'admin'].includes(user.role)) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const result = await notificationService.getAll();

      if (result.success) {
        const notifs = result.data.results || result.data || [];
        setNotifications(notifs);

        // Calculate unread count
        const unread = notifs.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  /**
   * Mark a specific notification as read
   */
  const markAsRead = useCallback(async (notificationId) => {
    const result = await notificationService.markAsRead(notificationId);

    if (result.success) {
      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    return result;
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    const result = await notificationService.markAllAsRead();

    if (result.success) {
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    }

    return result;
  }, []);

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(async () => {
    const result = await notificationService.clearAll();

    if (result.success) {
      // Mark all as read in local state (backend doesn't delete, just marks read)
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    }

    return result;
  }, []);

  /**
   * Manually trigger a refresh
   */
  const refresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Fetch notifications on mount and when auth state changes
  useEffect(() => {
    if (isAuthenticated && user && ['staff', 'manager', 'admin'].includes(user.role)) {
      fetchNotifications();
    } else {
      // Clear notifications for guests or unauthenticated users
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, user, fetchNotifications]);

  // Set up polling for real-time updates
  useEffect(() => {
    if (isAuthenticated && user && ['staff', 'manager', 'admin'].includes(user.role)) {
      // Start polling
      pollingRef.current = setInterval(() => {
        fetchNotifications();
      }, POLLING_INTERVAL);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    }
  }, [isAuthenticated, user, fetchNotifications]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearAll,
    refresh,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotificationContext must be used within a NotificationProvider'
    );
  }
  return context;
};

export default NotificationContext;
