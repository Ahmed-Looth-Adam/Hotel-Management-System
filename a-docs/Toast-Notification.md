# Toast Notification System

This project uses **notistack** for displaying toast notifications. The system provides a simple, consistent way to show success, error, warning, and info messages throughout the application.

## Features

- ✅ Multiple notification variants (success, error, warning, info)
- ✅ Customizable position, duration, and max notifications
- ✅ Can be used inside and outside React components
- ✅ Pre-configured message templates for common scenarios
- ✅ Auto-dismissal with configurable duration
- ✅ Stacking notifications with queue management

## Setup

The notification system is already configured in `App.jsx` with the following settings:
- **Position**: Top-right corner
- **Max notifications**: 3 simultaneous notifications
- **Auto-hide duration**: 3 seconds

## Usage

### Method 1: Using the `useNotification` Hook (Recommended for React Components)

```jsx
import useNotification from '../hooks/useNotification';

function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

  const handleAction = async () => {
    try {
      await someAsyncOperation();
      showSuccess('Operation completed successfully!');
    } catch (error) {
      showError('Something went wrong!');
    }
  };

  return <button onClick={handleAction}>Do Something</button>;
}
```

### Method 2: Using the `notificationService` (For Services/Utilities)

```jsx
import { notificationService } from '../utils/notificationService';

// Can be used anywhere, even outside React components
export const apiService = {
  async saveData(data) {
    try {
      const response = await api.post('/data', data);
      notificationService.success('Data saved successfully!');
      return response;
    } catch (error) {
      notificationService.error('Failed to save data');
      throw error;
    }
  }
};
```

## Available Methods

### useNotification Hook

```jsx
const {
  showSuccess,        // Show success notification
  showError,          // Show error notification
  showWarning,        // Show warning notification
  showInfo,           // Show info notification
  showNotification,   // Show notification with custom variant
  closeNotification,  // Close a specific notification
  closeAllNotifications // Close all notifications
} = useNotification();
```

### notificationService

```javascript
// Basic methods
notificationService.success(message, options);
notificationService.error(message, options);
notificationService.warning(message, options);
notificationService.info(message, options);
notificationService.show(message, options);

// Pre-configured templates
notificationService.loginSuccess(username);
notificationService.logoutSuccess();
notificationService.registrationSuccess();
notificationService.saveSuccess();
notificationService.deleteSuccess();
notificationService.genericError();
notificationService.networkError();
notificationService.unauthorized();
notificationService.validationError(message);
```

## Examples

### Basic Usage

```jsx
// Success notification
showSuccess('User created successfully!');

// Error notification
showError('Failed to delete item');

// Warning notification
showWarning('This action cannot be undone');

// Info notification
showInfo('Your session will expire in 5 minutes');
```

### With Custom Options

```jsx
// Custom duration (5 seconds)
showSuccess('Saved!', { autoHideDuration: 5000 });

// Prevent auto-hide
showError('Critical error', { persist: true });

// Custom position
showInfo('New message', {
  anchorOrigin: { vertical: 'bottom', horizontal: 'left' }
});
```

### Using Pre-configured Templates

```jsx
// Login success
notificationService.loginSuccess('John Doe');
// Shows: "Welcome back, John Doe!"

// Logout
notificationService.logoutSuccess();
// Shows: "You have been logged out successfully"

// Save success
notificationService.saveSuccess();
// Shows: "Changes saved successfully"

// Network error
notificationService.networkError();
// Shows: "Network error. Please check your connection."
```

## Integration in Existing Code

### In Authentication Context

```jsx
const login = async (username, password) => {
  const result = await authService.login(username, password);

  if (result.success) {
    setUser(result.data?.user);
    setIsAuthenticated(true);
    notificationService.loginSuccess(username);
  } else {
    notificationService.error(result.error);
  }

  return result;
};
```

### In Form Submissions

```jsx
const handleSubmit = async (values) => {
  try {
    await api.createBooking(values);
    showSuccess('Booking created successfully!');
    navigate('/bookings');
  } catch (error) {
    showError(error.response?.data?.message || 'Failed to create booking');
  }
};
```

### In API Error Handling

```jsx
// In axios interceptor
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      notificationService.unauthorized();
    } else if (error.response?.status === 500) {
      notificationService.genericError();
    } else if (!error.response) {
      notificationService.networkError();
    }
    return Promise.reject(error);
  }
);
```

## Testing the Notification System

Visit `/notification-demo` to see live examples of all notification types and templates.

## Configuration

To customize the notification settings, edit the `SnackbarProvider` configuration in `App.jsx`:

```jsx
<SnackbarProvider
  maxSnack={3}                    // Maximum simultaneous notifications
  anchorOrigin={{
    vertical: 'top',              // 'top' or 'bottom'
    horizontal: 'right',          // 'left', 'center', or 'right'
  }}
  autoHideDuration={3000}         // Duration in milliseconds
>
  {/* ... */}
</SnackbarProvider>
```

## File Structure

```
frontend/src/
├── hooks/
│   └── useNotification.js       # React hook for notifications
├── utils/
│   └── notificationService.js   # Service for use outside components
├── components/
│   └── NotificationInitializer.jsx  # Initializes the service
└── examples/
    └── NotificationExample.jsx  # Demo component
```

## Best Practices

1. **Use the hook in components**: For React components, always use `useNotification` hook
2. **Use the service in utilities**: For services, API calls, or non-React code, use `notificationService`
3. **Keep messages concise**: Notification messages should be brief and actionable
4. **Use appropriate variants**: Match the notification type to the message (success for confirmations, error for failures, etc.)
5. **Don't overuse**: Only show notifications for important events that need user attention
6. **Provide context**: Include relevant details in error messages to help users understand what went wrong

## Troubleshooting

**Notifications not appearing?**
- Ensure `SnackbarProvider` wraps your app in `App.jsx`
- Verify `NotificationInitializer` is included inside `SnackbarProvider`
- Check browser console for errors

**Service notifications not working?**
- Make sure `NotificationInitializer` is rendered in your app
- The service is initialized after the first render

## Resources

- [notistack Documentation](https://notistack.com/)
- [Material-UI Integration](https://notistack.com/examples/material-ui)
