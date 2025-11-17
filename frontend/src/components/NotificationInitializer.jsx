/**
 * NotificationInitializer - Initializes the notification service
 *
 * This component sets up the notification service to work outside React components.
 * It should be placed inside the SnackbarProvider in your app.
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { notificationService } from '../utils/notificationService';

const NotificationInitializer = () => {
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    // Initialize the notification service with enqueueSnackbar
    notificationService.setEnqueueSnackbar(enqueueSnackbar);
  }, [enqueueSnackbar]);

  // This component doesn't render anything
  return null;
};

export default NotificationInitializer;
