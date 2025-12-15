/**
 * useNotification Hook - Custom hook for toast notifications
 *
 * Features:
 * - Simplified API for showing notifications
 * - Supports success, error, warning, and info variants
 * - Auto-dismissal and manual control
 * - Built on top of notistack
 *
 * Usage:
 * const { showSuccess, showError, showWarning, showInfo } = useNotification();
 * showSuccess('Operation completed successfully!');
 * showError('Something went wrong!');
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { useSnackbar } from 'notistack';

const useNotification = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  /**
   * Show a success notification
   * @param {string} message - The message to display
   * @param {object} options - Additional options for the notification
   */
  const showSuccess = (message, options = {}) => {
    return enqueueSnackbar(message, {
      variant: 'success',
      ...options,
    });
  };

  /**
   * Show an error notification
   * @param {string} message - The message to display
   * @param {object} options - Additional options for the notification
   */
  const showError = (message, options = {}) => {
    return enqueueSnackbar(message, {
      variant: 'error',
      ...options,
    });
  };

  /**
   * Show a warning notification
   * @param {string} message - The message to display
   * @param {object} options - Additional options for the notification
   */
  const showWarning = (message, options = {}) => {
    return enqueueSnackbar(message, {
      variant: 'warning',
      ...options,
    });
  };

  /**
   * Show an info notification
   * @param {string} message - The message to display
   * @param {object} options - Additional options for the notification
   */
  const showInfo = (message, options = {}) => {
    return enqueueSnackbar(message, {
      variant: 'info',
      ...options,
    });
  };

  /**
   * Show a default notification
   * @param {string} message - The message to display
   * @param {object} options - Additional options for the notification
   */
  const showNotification = (message, options = {}) => {
    return enqueueSnackbar(message, options);
  };

  /**
   * Close a specific notification
   * @param {string|number} key - The key of the notification to close
   */
  const closeNotification = (key) => {
    closeSnackbar(key);
  };

  /**
   * Close all notifications
   */
  const closeAllNotifications = () => {
    closeSnackbar();
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNotification,
    closeNotification,
    closeAllNotifications,
  };
};

export default useNotification;
