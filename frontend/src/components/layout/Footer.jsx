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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
              <Box
                component="img"
                src="/logo.png"
                alt="LuxeStayHotels"
                sx={{ width: 100, height: 60, borderRadius: '10px' }}
              />
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
