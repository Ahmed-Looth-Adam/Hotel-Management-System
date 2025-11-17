/**
 * Footer Component - Site-wide footer matching homepage design
 *
 * Features:
 * - Brand information and description
 * - Quick navigation links
 * - Contact information
 * - Copyright notice
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Stack,
  Divider,
  alpha,
} from '@mui/material';
import {
  Hotel as HotelIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';

const Footer = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 6, mt: 8 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Brand Section */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <HotelIcon sx={{ fontSize: 32, mr: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Hotel Management
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
              Experience world-class hospitality with our premium hotel services. Your comfort is our priority.
            </Typography>
          </Grid>

          {/* Quick Links Section */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Quick Links
            </Typography>
            <Stack spacing={1}>
              <Button
                color="inherit"
                sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                onClick={() => navigate('/')}
              >
                Home
              </Button>
              <Button
                color="inherit"
                sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                onClick={() => navigate(isAuthenticated ? '/bookings' : '/register')}
              >
                Book a Room
              </Button>
              <Button
                color="inherit"
                sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
              >
                {isAuthenticated ? 'Dashboard' : 'Sign In'}
              </Button>
              <Button
                color="inherit"
                sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                onClick={() => navigate('/demo')}
              >
                View Components
              </Button>
            </Stack>
          </Grid>

          {/* Contact Section */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Contact Us
            </Typography>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon sx={{ fontSize: 20 }} />
                <Typography variant="body2">+44 (0) 20 1234 5678</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon sx={{ fontSize: 20 }} />
                <Typography variant="body2">info@hotelmanagement.com</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon sx={{ fontSize: 20 }} />
                <Typography variant="body2">123 Luxury Street, London, UK</Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        {/* Copyright */}
        <Divider sx={{ my: 3, borderColor: alpha('#ffffff', 0.2) }} />
        <Typography variant="body2" sx={{ textAlign: 'center', opacity: 0.8 }}>
          © {new Date().getFullYear()} Hotel Management System. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
