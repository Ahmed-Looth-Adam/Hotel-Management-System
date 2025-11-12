/**
 * Home Page - Landing page for Hotel Management System
 *
 * Edited By:
 * -> Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Stack,
} from '@mui/material';
import {
  Hotel as HotelIcon,
  Lock as LockIcon,
  Analytics as AnalyticsIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';

function Home() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 8 }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h1" color="primary" gutterBottom>
            🏨 Hotel Management System
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
            Material-UI v7 Minimalist Theme
          </Typography>
          <Chip label="White-Based Design" color="primary" sx={{ mr: 1 }} />
          <Chip label="Luxury Aesthetic" color="secondary" />
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LockIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h5" color="primary">
                    Authentication
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Secure login & registration with JWT authentication
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <HotelIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h5" color="success.main">
                    Room Management
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Manage rooms, bookings, and availability in real-time
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AnalyticsIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h5" color="info.main">
                    Analytics
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Revenue insights and occupancy reports with charts
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card sx={{ mb: 4, p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Color Palette Preview
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Chip label="Primary (Navy)" color="primary" />
            <Chip label="Secondary (Gold)" color="secondary" />
            <Chip label="Success (Available)" color="success" />
            <Chip label="Warning (Pending)" color="warning" />
            <Chip label="Error (Unavailable)" color="error" />
            <Chip label="Info (Teal)" color="info" />
          </Stack>
        </Card>

        <Box sx={{ textAlign: 'center' }}>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="contained" color="primary" size="large">
              Get Started
            </Button>
            <Button variant="outlined" color="primary" size="large">
              Learn More
            </Button>
            <Button variant="contained" color="secondary" size="large">
              Premium Features
            </Button>
            <Button
              variant="outlined"
              color="info"
              size="large"
              startIcon={<PaletteIcon />}
              onClick={() => navigate('/demo')}
            >
              View Component Demo
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

export default Home;
