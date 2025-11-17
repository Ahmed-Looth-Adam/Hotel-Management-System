/**
 * Notification Service - Centralized notification utility
 *
 * Features:
 * - Singleton pattern for notifications
 * - Can be used outside React components
 * - Provides consistent notification messages
 * - Pre-configured notification templates
 *
 * Usage (in React components):
 * import { notificationService } from '../utils/notificationService';
 * notificationService.success('Operation completed!');
 *
 * Note: This requires the enqueueSnackbar function to be set during app initialization
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

class NotificationService {
  constructor() {
    this.enqueueSnackbar = null;
  }

  /**
   * Initialize the notification service with enqueueSnackbar function
   * This should be called once in your app's initialization
   * @param {Function} enqueueSnackbar - The enqueueSnackbar function from notistack
   */
  setEnqueueSnackbar(enqueueSnackbar) {
    this.enqueueSnackbar = enqueueSnackbar;
  }

  /**
   * Show a success notification
   * @param {string} message - The message to display
   * @param {object} options - Additional options
   */
  success(message, options = {}) {
    if (!this.enqueueSnackbar) {
      console.warn('NotificationService not initialized');
      return;
    }
    return this.enqueueSnackbar(message, {
      variant: 'success',
      ...options,
    });
  }

  /**
   * Show an error notification
   * @param {string} message - The message to display
   * @param {object} options - Additional options
   */
  error(message, options = {}) {
    if (!this.enqueueSnackbar) {
      console.warn('NotificationService not initialized');
      return;
    }
    return this.enqueueSnackbar(message, {
      variant: 'error',
      ...options,
    });
  }

  /**
   * Show a warning notification
   * @param {string} message - The message to display
   * @param {object} options - Additional options
   */
  warning(message, options = {}) {
    if (!this.enqueueSnackbar) {
      console.warn('NotificationService not initialized');
      return;
    }
    return this.enqueueSnackbar(message, {
      variant: 'warning',
      ...options,
    });
  }

  /**
   * Show an info notification
   * @param {string} message - The message to display
   * @param {object} options - Additional options
   */
  info(message, options = {}) {
    if (!this.enqueueSnackbar) {
      console.warn('NotificationService not initialized');
      return;
    }
    return this.enqueueSnackbar(message, {
      variant: 'info',
      ...options,
    });
  }

  /**
   * Show a notification with custom variant
   * @param {string} message - The message to display
   * @param {object} options - Additional options including variant
   */
  show(message, options = {}) {
    if (!this.enqueueSnackbar) {
      console.warn('NotificationService not initialized');
      return;
    }
    return this.enqueueSnackbar(message, options);
  }

  // Pre-configured notification templates

  /**
   * Show a login success notification
   */
  loginSuccess(username = '') {
    const message = username
      ? `Welcome back, ${username}!`
      : 'Login successful!';
    return this.success(message);
  }

  /**
   * Show a logout notification
   */
  logoutSuccess() {
    return this.info('You have been logged out successfully');
  }

  /**
   * Show a registration success notification
   */
  registrationSuccess() {
    return this.success('Registration successful! Please log in.');
  }

  /**
   * Show a save success notification
   */
  saveSuccess() {
    return this.success('Changes saved successfully');
  }

  /**
   * Show a delete success notification
   */
  deleteSuccess() {
    return this.success('Item deleted successfully');
  }

  /**
   * Show a generic error notification
   */
  genericError() {
    return this.error('Something went wrong. Please try again.');
  }

  /**
   * Show a network error notification
   */
  networkError() {
    return this.error('Network error. Please check your connection.');
  }

  /**
   * Show an unauthorized access notification
   */
  unauthorized() {
    return this.warning('You are not authorized to perform this action');
  }

  /**
   * Show a validation error notification
   */
  validationError(message = 'Please check your input') {
    return this.error(message);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
