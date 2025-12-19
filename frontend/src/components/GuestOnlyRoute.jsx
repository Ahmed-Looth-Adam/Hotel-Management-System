import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress, Container } from '@mui/material';

/**
 * GuestOnlyRoute - Restricts access to guest-only pages
 *
 * This component prevents admin, manager, and staff users from accessing
 * guest-facing pages like the landing page and room browsing pages.
 * These users are redirected to their dashboard instead.
 *
 * Unauthenticated users and users with 'guest' role can access these pages.
 */
const GuestOnlyRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Container>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // If authenticated and user is admin, manager, or staff, redirect to dashboard
  if (isAuthenticated && user?.role && ['admin', 'manager', 'staff'].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Allow access for unauthenticated users and guests
  return children;
};

export default GuestOnlyRoute;
