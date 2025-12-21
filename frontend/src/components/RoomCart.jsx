/**
 * Floating Room Cart Button - Navigates to Reservation page
 * Simple floating button that shows room count badge and navigates to /guest/reservation
 */

import { useNavigate } from 'react-router-dom';
import { Box, Badge } from '@mui/material';
import { EventNote } from '@mui/icons-material';
import { useRoomCart } from '../context/RoomCartContext';

const RoomCart = () => {
  const navigate = useNavigate();
  const { roomCount } = useRoomCart();

  // Don't render if cart is empty
  if (roomCount === 0) {
    return null;
  }

  const handleClick = () => {
    navigate('/guest/reservation');
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        position: 'fixed',
        bottom: { xs: 16, sm: 24 },
        right: { xs: 16, sm: 24 },
        zIndex: 1100,
        cursor: 'pointer',
      }}
    >
      <Badge
        badgeContent={roomCount}
        color="primary"
        sx={{
          '& .MuiBadge-badge': {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 600,
          },
        }}
      >
        <Box
          sx={{
            width: { xs: 56, sm: 64 },
            height: { xs: 56, sm: 64 },
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: '0 6px 25px rgba(102, 126, 234, 0.5)',
            },
          }}
        >
          <EventNote sx={{ color: 'white', fontSize: { xs: 24, sm: 28 } }} />
        </Box>
      </Badge>
    </Box>
  );
};

export default RoomCart;
