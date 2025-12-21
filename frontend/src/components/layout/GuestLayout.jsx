/**
 * Guest Layout Component - Customer-facing layout for guests
 *
 * Features:
 * - Minimal wrapper (pages use their own Hero component for navigation)
 * - Clean, modern hotel booking site feel
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { Box } from '@mui/material';
import RoomCart from '../RoomCart';

const GuestLayout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Main Content - Pages use their own Hero component for navigation */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: '#FFFFFF',
        }}
      >
        {children}
      </Box>
      {/* Floating Room Cart for multi-room bookings */}
      <RoomCart />
    </Box>
  );
};

export default GuestLayout;
