/**
 * Notification Example - Demonstrates how to use the notification system
 *
 * This component shows various ways to use toast notifications in the app:
 * 1. Using the useNotification hook (recommended for React components)
 * 2. Using the notificationService (for use outside components or in utilities)
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { Box, Button, Container, Typography, Stack, Paper } from '@mui/material';
import useNotification from '../hooks/useNotification';
import { notificationService } from '../utils/notificationService';

const NotificationExample = () => {
  const {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  } = useNotification();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Notification System Examples
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Click the buttons below to see different notification types in action.
      </Typography>

      {/* Using useNotification Hook */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Method 1: Using useNotification Hook
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Recommended for use inside React components
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
          <Button
            variant="contained"
            color="success"
            onClick={() => showSuccess('Operation completed successfully!')}
          >
            Show Success
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => showError('An error occurred!')}
          >
            Show Error
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => showWarning('This is a warning message')}
          >
            Show Warning
          </Button>
          <Button
            variant="contained"
            color="info"
            onClick={() => showInfo('Here is some information')}
          >
            Show Info
          </Button>
        </Stack>
      </Paper>

      {/* Using notificationService */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Method 2: Using notificationService
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Can be used anywhere, including outside React components
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
          <Button
            variant="outlined"
            color="success"
            onClick={() => notificationService.success('Service success message')}
          >
            Service Success
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => notificationService.error('Service error message')}
          >
            Service Error
          </Button>
          <Button
            variant="outlined"
            color="warning"
            onClick={() => notificationService.warning('Service warning message')}
          >
            Service Warning
          </Button>
          <Button
            variant="outlined"
            color="info"
            onClick={() => notificationService.info('Service info message')}
          >
            Service Info
          </Button>
        </Stack>
      </Paper>

      {/* Pre-configured Templates */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Pre-configured Notification Templates
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Common notification messages for typical use cases
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
          <Button
            variant="contained"
            onClick={() => notificationService.loginSuccess('John Doe')}
          >
            Login Success
          </Button>
          <Button
            variant="contained"
            onClick={() => notificationService.logoutSuccess()}
          >
            Logout
          </Button>
          <Button
            variant="contained"
            onClick={() => notificationService.saveSuccess()}
          >
            Save Success
          </Button>
          <Button
            variant="contained"
            onClick={() => notificationService.deleteSuccess()}
          >
            Delete Success
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => notificationService.networkError()}
          >
            Network Error
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => notificationService.unauthorized()}
          >
            Unauthorized
          </Button>
        </Stack>
      </Paper>

      {/* Code Examples */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Usage in Your Code
        </Typography>
        <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
          <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
{`// In a React component:
import useNotification from '../hooks/useNotification';

function MyComponent() {
  const { showSuccess, showError } = useNotification();

  const handleSubmit = async () => {
    try {
      await api.submit();
      showSuccess('Data submitted successfully!');
    } catch (error) {
      showError('Failed to submit data');
    }
  };
}

// In a service or utility file:
import { notificationService } from '../utils/notificationService';

export const apiService = {
  async login(credentials) {
    try {
      const response = await api.login(credentials);
      notificationService.loginSuccess(response.username);
      return response;
    } catch (error) {
      notificationService.error('Login failed');
      throw error;
    }
  }
};`}
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default NotificationExample;
