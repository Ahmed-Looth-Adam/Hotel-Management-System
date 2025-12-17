/**
 * Footer Component - Airbnb-style footer
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Container,
  Typography,
  Grid,
  Stack,
  Link,
  IconButton,
} from '@mui/material';
import {
  Facebook,
  Twitter,
  Instagram,
  Language,
  AttachMoney,
} from '@mui/icons-material';

const FooterLink = ({ children, onClick }) => (
  <Typography
    component="span"
    onClick={onClick}
    sx={{
      fontSize: '14px',
      color: '#222222',
      cursor: 'pointer',
      transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
      '&:hover': {
        textDecoration: 'underline',
      },
    }}
  >
    {children}
  </Typography>
);

const Footer = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <Box
      sx={{
        bgcolor: '#F7F7F7',
        borderTop: '1px solid #DDDDDD',
        mt: 6,
      }}
    >
      {/* Main Footer */}
      <Container maxWidth="xl">
        <Box sx={{ py: 6 }}>
          <Grid container spacing={4}>
            {/* Support */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#222222',
                  mb: 2,
                }}
              >
                Support
              </Typography>
              <Stack spacing={1.5}>
                <FooterLink onClick={() => navigate('/help')}>Help Center</FooterLink>
                <FooterLink onClick={() => navigate('/safety')}>Safety information</FooterLink>
                <FooterLink onClick={() => navigate('/cancellation')}>Cancellation options</FooterLink>
                <FooterLink onClick={() => navigate('/contact')}>Contact us</FooterLink>
              </Stack>
            </Grid>

            {/* Community */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#222222',
                  mb: 2,
                }}
              >
                Community
              </Typography>
              <Stack spacing={1.5}>
                <FooterLink onClick={() => navigate('/about')}>About us</FooterLink>
                <FooterLink onClick={() => navigate('/careers')}>Careers</FooterLink>
                <FooterLink onClick={() => navigate('/press')}>Press</FooterLink>
                <FooterLink onClick={() => navigate('/investors')}>Investors</FooterLink>
              </Stack>
            </Grid>

            {/* Hosting */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#222222',
                  mb: 2,
                }}
              >
                For Hotels
              </Typography>
              <Stack spacing={1.5}>
                <FooterLink onClick={() => navigate('/partner')}>Partner with us</FooterLink>
                <FooterLink onClick={() => navigate('/resources')}>Hotel resources</FooterLink>
                <FooterLink onClick={() => navigate('/forum')}>Community forum</FooterLink>
                <FooterLink onClick={() => navigate('/hosting')}>Hosting responsibly</FooterLink>
              </Stack>
            </Grid>

            {/* Hotels */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#222222',
                  mb: 2,
                }}
              >
                Hotels
              </Typography>
              <Stack spacing={1.5}>
                <FooterLink onClick={() => navigate(isAuthenticated ? '/guest/rooms' : '/login')}>
                  {isAuthenticated ? 'Browse Rooms' : 'Sign in'}
                </FooterLink>
                <FooterLink onClick={() => navigate('/guest/rooms')}>All destinations</FooterLink>
                <FooterLink onClick={() => navigate('/deals')}>Special deals</FooterLink>
                <FooterLink onClick={() => navigate('/gift-cards')}>Gift cards</FooterLink>
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* Bottom Bar */}
        <Box
          sx={{
            borderTop: '1px solid #DDDDDD',
            py: 3,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2,
          }}
        >
          {/* Left side */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: { xs: 1, md: 2 },
            }}
          >
            <Typography sx={{ fontSize: '14px', color: '#222222' }}>
              © {new Date().getFullYear()} Hotels
            </Typography>
            <Typography sx={{ color: '#717171', display: { xs: 'none', md: 'block' } }}>·</Typography>
            <FooterLink onClick={() => navigate('/privacy')}>Privacy</FooterLink>
            <Typography sx={{ color: '#717171' }}>·</Typography>
            <FooterLink onClick={() => navigate('/terms')}>Terms</FooterLink>
            <Typography sx={{ color: '#717171' }}>·</Typography>
            <FooterLink onClick={() => navigate('/sitemap')}>Sitemap</FooterLink>
          </Box>

          {/* Right side */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              <Language sx={{ fontSize: 18, color: '#222222' }} />
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#222222' }}>
                English (UK)
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#222222' }}>
                £ GBP
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                size="small"
                sx={{
                  color: '#222222',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                }}
              >
                <Facebook sx={{ fontSize: 20 }} />
              </IconButton>
              <IconButton
                size="small"
                sx={{
                  color: '#222222',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                }}
              >
                <Twitter sx={{ fontSize: 20 }} />
              </IconButton>
              <IconButton
                size="small"
                sx={{
                  color: '#222222',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                }}
              >
                <Instagram sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
