/**
 * Home Page - Landing page for Hotel Management System
 *
 * Features:
 * - Hero section with call-to-action
 * - Hotel services and amenities showcase
 * - Room types with pricing
 * - Why choose us section
 * - Contact footer
 *
 * Edited By:
 * -> Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/auth/LoginModal';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Hotel as HotelIcon,
  Wifi as WifiIcon,
  Restaurant as RestaurantIcon,
  LocalParking as ParkingIcon,
  FitnessCenter as GymIcon,
  Pool as PoolIcon,
  RoomService as RoomServiceIcon,
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
  Star as StarIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  ArrowForward as ArrowForwardIcon,
  Bed as BedIcon,
  People as PeopleIcon,
} from '@mui/icons-material';

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const theme = useTheme();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Room types data
  const roomTypes = [
    {
      id: 1,
      name: 'Standard Room',
      description: 'Comfortable and affordable accommodation for solo travelers or couples',
      price: '£89',
      image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format&fit=crop',
      features: ['Queen Bed', '2 Guests', 'Free WiFi', 'City View'],
      beds: 1,
      guests: 2,
    },
    {
      id: 2,
      name: 'Deluxe Suite',
      description: 'Spacious suite with separate living area and premium amenities',
      price: '£159',
      image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&auto=format&fit=crop',
      features: ['King Bed', '4 Guests', 'Living Area', 'Ocean View'],
      beds: 2,
      guests: 4,
    },
    {
      id: 3,
      name: 'Presidential Suite',
      description: 'Luxurious suite with panoramic views and exclusive services',
      price: '£299',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop',
      features: ['King Bed', '6 Guests', 'Private Terrace', 'Butler Service'],
      beds: 3,
      guests: 6,
    },
  ];

  // Services/Amenities
  const services = [
    { icon: <WifiIcon />, title: 'Free WiFi', description: 'High-speed internet throughout' },
    { icon: <RestaurantIcon />, title: 'Restaurant & Bar', description: 'Fine dining and cocktails' },
    { icon: <PoolIcon />, title: 'Swimming Pool', description: 'Indoor and outdoor pools' },
    { icon: <GymIcon />, title: 'Fitness Center', description: '24/7 modern gym facilities' },
    { icon: <ParkingIcon />, title: 'Free Parking', description: 'Complimentary valet service' },
    { icon: <RoomServiceIcon />, title: 'Room Service', description: '24/7 in-room dining' },
    { icon: <SecurityIcon />, title: 'Security', description: '24/7 surveillance and safety' },
    { icon: <HotelIcon />, title: 'Concierge', description: 'Personalized assistance' },
  ];

  // Why choose us
  const benefits = [
    'Prime location in the city center',
    'Award-winning hospitality service',
    'Flexible booking and cancellation',
    'Best price guarantee',
    'Loyalty rewards program',
    'Eco-friendly practices',
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15,
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', maxWidth: '800px', mx: 'auto' }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                fontWeight: 700,
                mb: 2,
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              Experience Luxury & Comfort
            </Typography>
            <Typography
              variant="h5"
              sx={{
                mb: 4,
                opacity: 0.95,
                fontSize: { xs: '1.1rem', md: '1.5rem' },
                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
            >
              Your perfect stay awaits at our premium hotel properties
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
            >
              <Button
                variant="contained"
                color="secondary"
                size="large"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate(isAuthenticated ? '/bookings' : '/register')}
                sx={{
                  py: 1.5,
                  px: 4,
                  fontSize: '1.1rem',
                }}
              >
                {isAuthenticated ? 'Book Now' : 'Get Started'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => isAuthenticated ? navigate('/dashboard') : setLoginModalOpen(true)}
                sx={{
                  py: 1.5,
                  px: 4,
                  fontSize: '1.1rem',
                  color: 'white',
                  borderColor: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: alpha('#ffffff', 0.1),
                  },
                }}
              >
                {isAuthenticated ? 'View Dashboard' : 'Sign In'}
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Services Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" color="primary" gutterBottom>
            Our Services & Amenities
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
            Enjoy world-class facilities and services designed to make your stay memorable
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {services.map((service, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      color: 'primary.main',
                      mb: 2,
                      '& svg': { fontSize: 48 },
                    }}
                  >
                    {service.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {service.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {service.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Divider />

      {/* Room Types Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h2" color="primary" gutterBottom>
              Our Room Types
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
              Choose from our selection of beautifully designed rooms and suites
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {roomTypes.map((room) => (
              <Grid item xs={12} md={4} key={room.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: theme.shadows[6],
                    },
                  }}
                >
                  <CardMedia
                    component="img"
                    height="220"
                    image={room.image}
                    alt={room.name}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Typography variant="h5" component="h3" color="primary">
                        {room.name}
                      </Typography>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" color="secondary.main" sx={{ fontWeight: 700 }}>
                          {room.price}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          per night
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {room.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <BedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {room.beds} {room.beds === 1 ? 'Bed' : 'Beds'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PeopleIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {room.guests} Guests
                        </Typography>
                      </Box>
                    </Box>
                    <List dense sx={{ mb: 2 }}>
                      {room.features.map((feature, idx) => (
                        <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckIcon sx={{ fontSize: 18, color: 'success.main' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={feature}
                            slotProps={{
                              primary: { variant: 'body2' }
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate(isAuthenticated ? '/bookings' : '/register')}
                    >
                      Book Now
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Divider />

      {/* Why Choose Us Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box
              component="img"
              src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop"
              alt="Hotel exterior"
              sx={{
                width: '100%',
                borderRadius: 2,
                boxShadow: theme.shadows[4],
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h2" color="primary" gutterBottom>
              Why Choose Us?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              We are committed to providing exceptional hospitality and creating unforgettable experiences for our guests.
            </Typography>
            <List>
              {benefits.map((benefit, idx) => (
                <ListItem key={idx} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <StarIcon sx={{ color: 'secondary.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={benefit}
                    slotProps={{
                      primary: { variant: 'body1', fontWeight: 500 }
                    }}
                  />
                </ListItem>
              ))}
            </List>
            <Button
              variant="contained"
              color="primary"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
              sx={{ mt: 2 }}
            >
              Join Us Today
            </Button>
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 6, mt: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
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
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Quick Links
              </Typography>
              <Stack spacing={1}>
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
                  onClick={() => isAuthenticated ? navigate('/dashboard') : setLoginModalOpen(true)}
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
          <Divider sx={{ my: 3, borderColor: alpha('#ffffff', 0.2) }} />
          <Typography variant="body2" sx={{ textAlign: 'center', opacity: 0.8 }}>
            © {new Date().getFullYear()} Hotel Management System. All rights reserved.
          </Typography>
        </Container>
      </Box>

      {/* Login Modal */}
      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSwitchToRegister={() => navigate('/register')}
      />
    </Box>
  );
}

export default Home;
