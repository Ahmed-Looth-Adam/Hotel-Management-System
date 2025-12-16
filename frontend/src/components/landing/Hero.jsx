
import React from 'react';
import { Box, Container, Typography, Paper, Grid, Button, Divider, useMediaQuery, useTheme } from '@mui/material';
import { Search } from '@mui/icons-material';

const Hero = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ position: 'relative', bgcolor: 'black', color: 'white', minHeight: '600px', display: 'flex', alignItems: 'center' }}>
      {/* Background Image */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.6,
          zIndex: 1,
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
        <Box sx={{ maxWidth: '850px', mx: 'auto', textAlign: 'center' }}>
          <Typography
            variant="h1"
            sx={{
              color: 'white',
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: '2.5rem', md: '4rem' },
              textShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            Find your next stay
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: 'white',
              mb: 6,
              fontWeight: 500,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            Search low prices on hotels, homes and much more...
          </Typography>

          {/* Search Bar - Flexbox Implementation */}
          <Paper
            elevation={3}
            sx={{
              p: '8px',
              borderRadius: { xs: 4, md: 40 },
              bgcolor: 'white',
              maxWidth: '850px',
              width: '100%',
              mx: 'auto',
              boxShadow: '0px 16px 32px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center', // Ensures vertical center
            }}
          >
            {/* Location */}
            <Box sx={{
              flex: 1.2,
              px: 3,
              py: 1.5,
              width: { xs: '100%', md: 'auto' },
              textAlign: 'left',
              borderRadius: 30,
              '&:hover': { bgcolor: '#f7f7f7' },
              cursor: 'pointer'
            }}>
              <Typography variant="caption" display="block" color="text.primary" fontWeight="bold">Where</Typography>
              <Typography variant="body2" color="text.secondary" noWrap>Search destinations</Typography>
            </Box>

            <Divider orientation={isMobile ? "horizontal" : "vertical"} flexItem sx={{ my: { xs: 1, md: 0 }, mx: { xs: 0, md: 0.5 }, height: { md: '32px' }, alignSelf: 'center' }} />

            {/* Dates */}
            <Box sx={{
              flex: 1,
              px: 3,
              py: 1.5,
              width: { xs: '100%', md: 'auto' },
              textAlign: 'left',
              borderRadius: 30,
              '&:hover': { bgcolor: '#f7f7f7' },
              cursor: 'pointer'
            }}>
              <Typography variant="caption" display="block" color="text.primary" fontWeight="bold">Check in - Check out</Typography>
              <Typography variant="body2" color="text.secondary" noWrap>Add dates</Typography>
            </Box>

            <Divider orientation={isMobile ? "horizontal" : "vertical"} flexItem sx={{ my: { xs: 1, md: 0 }, mx: { xs: 0, md: 0.5 }, height: { md: '32px' }, alignSelf: 'center' }} />

            {/* Guests + Button Container */}
            <Box sx={{
              flex: 1.3,
              display: 'flex',
              width: { xs: '100%', md: 'auto' },
              alignItems: 'center',
              pl: 3,
              pr: 1, // Padding right for the button
              py: 0.5,
              borderRadius: 30,
              '&:hover': { bgcolor: '#f7f7f7' },
              cursor: 'pointer'
            }}>
              <Box sx={{ flexGrow: 1, textAlign: 'left' }}>
                <Typography variant="caption" display="block" color="text.primary" fontWeight="bold">Who</Typography>
                <Typography variant="body2" color="text.secondary" noWrap>Add guests</Typography>
              </Box>

              <Button
                variant="contained"
                color="primary"
                sx={{
                  minWidth: '48px',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%', // Perfect circle
                  p: 0,
                  ml: 2, // Space from text
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)', // Subtle lift
                }}
              >
                <Search sx={{ fontSize: 22 }} />
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Hero;

