/**
 * Footer Component - Hotel Management System
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Container,
  Typography,
} from '@mui/material';
import { Hotel as HotelIcon } from '@mui/icons-material';

const Footer = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const isGuest = !user?.role || user?.role === 'guest';

  const FooterLink = ({ children, onClick }) => (
    <Typography
      component="span"
      onClick={onClick}
      sx={{
        fontSize: '14px',
        color: '#717171',
        cursor: 'pointer',
        '&:hover': {
          color: '#667eea',
          textDecoration: 'underline',
        },
      }}
    >
      {children}
    </Typography>
  );

  return (
    <Box
      sx={{
        bgcolor: '#F7F7F7',
        borderTop: '1px solid #EBEBEB',
        mt: 6,
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            py: 4,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 3,
          }}
        >
          {/* Left - Branding & Copyright */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HotelIcon sx={{ color: '#667eea', fontSize: 22 }} />
              <Typography
                sx={{
                  fontSize: '15px',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                LuxeStay Hotels
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '14px', color: '#717171' }}>
              © {new Date().getFullYear()}
            </Typography>
          </Box>

          {/* Center - Links */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
            <FooterLink onClick={() => navigate('/')}>Home</FooterLink>
            <FooterLink onClick={() => navigate('/guest/rooms')}>Browse Rooms</FooterLink>
            {isAuthenticated && isGuest && (
              <FooterLink onClick={() => navigate('/guest/my-bookings')}>My Bookings</FooterLink>
            )}
            {!isAuthenticated && (
              <FooterLink onClick={() => navigate('/login')}>Sign In</FooterLink>
            )}
          </Box>

          {/* Right - Currency */}
          <Typography sx={{ fontSize: '14px', color: '#717171' }}>
            £ GBP · English (UK)
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
