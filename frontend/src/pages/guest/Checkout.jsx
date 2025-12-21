/**
 * Checkout Page - Deprecated
 *
 * This page has been replaced by:
 * - /guest/reservation - For managing multi-room reservations
 * - /guest/booking-confirmation - For payment
 *
 * This component now redirects to the Reservation page.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

const Checkout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new Reservation page
    navigate('/guest/reservation', { replace: true });
  }, [navigate]);

  // Show loading while redirecting
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <CircularProgress sx={{ color: '#667eea' }} />
      <Typography sx={{ color: '#717171' }}>
        Redirecting to reservation...
      </Typography>
    </Box>
  );
};

export default Checkout;
