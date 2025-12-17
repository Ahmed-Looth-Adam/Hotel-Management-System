import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardMedia,
  CardContent,
  useTheme,
  useMediaQuery,
  Skeleton,
  Button,
  Chip,
  alpha,
} from '@mui/material';
import {
  LocationOn,
  MeetingRoom,
  ArrowForward,
  Hotel as HotelIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import hotelService from '../../services/hotelService';

const HotelCard = ({ hotel, isMobile, onClick }) => {
  // Get first gallery image or use placeholder
  const getHotelImage = () => {
    if (hotel.galleries && hotel.galleries.length > 0) {
      const gallery = hotel.galleries[0];
      if (gallery.images && gallery.images.length > 0) {
        return `http://localhost:8000${gallery.images[0].image}`;
      }
    }
    return null;
  };

  const imageUrl = getHotelImage();

  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: 'none',
        boxShadow: 'none',
        bgcolor: 'transparent',
        cursor: 'pointer',
        position: 'relative',
        minWidth: isMobile ? '300px' : 'auto',
        maxWidth: isMobile ? '300px' : '100%',
        mx: isMobile ? 1 : 0,
        scrollSnapAlign: 'start',
        flexShrink: 0,
        transition: 'transform 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
        },
      }}
    >
      {/* Image Container */}
      <Box
        sx={{
          position: 'relative',
          borderRadius: 4,
          overflow: 'hidden',
          mb: 2,
          aspectRatio: '4/3',
          bgcolor: '#f0f0f0',
        }}
      >
        {imageUrl ? (
          <CardMedia
            component="img"
            image={imageUrl}
            alt={hotel.name}
            sx={{
              height: '100%',
              width: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s ease',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          />
        ) : (
          <Box
            sx={{
              height: '100%',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha('#1a1f37', 0.05),
            }}
          >
            <HotelIcon sx={{ fontSize: 64, color: alpha('#1a1f37', 0.2) }} />
          </Box>
        )}
        {hotel.is_active && (
          <Chip
            label="Available"
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              bgcolor: 'success.main',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          />
        )}
      </Box>

      <CardContent sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography
            variant="h6"
            fontWeight="700"
            sx={{ fontSize: '1.1rem', lineHeight: 1.3 }}
          >
            {hotel.name}
          </Typography>
          {hotel.star_rating && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <StarIcon sx={{ fontSize: 16, color: '#FFB400' }} />
              <Typography variant="body2" fontWeight={600}>
                {hotel.star_rating}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {hotel.city}, {hotel.country}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MeetingRoom sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {hotel.total_rooms || 0} rooms
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              From
            </Typography>
            <Typography variant="subtitle1" fontWeight={700} color="primary">
              £120<Typography component="span" variant="caption" color="text.secondary">/night</Typography>
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const LoadingSkeleton = ({ isMobile }) => (
  <Box
    sx={{
      minWidth: isMobile ? '300px' : 'auto',
      maxWidth: isMobile ? '300px' : '100%',
      mx: isMobile ? 1 : 0,
    }}
  >
    <Skeleton
      variant="rounded"
      sx={{ borderRadius: 4, aspectRatio: '4/3', mb: 2 }}
    />
    <Skeleton variant="text" width="80%" height={28} />
    <Skeleton variant="text" width="60%" height={20} />
    <Skeleton variant="text" width="40%" height={20} />
  </Box>
);

const FeaturedListings = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    setLoading(true);
    const result = await hotelService.getAll({ is_active: true });
    if (result.success) {
      const data = Array.isArray(result.data)
        ? result.data
        : result.data?.results || [];
      setHotels(data.slice(0, 8)); // Show max 8 hotels
    }
    setLoading(false);
  };

  const handleHotelClick = (hotel) => {
    // Navigate to browse rooms with hotel filter
    navigate(`/guest/rooms?hotel=${hotel.id}`);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 8 } }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={300} height={40} />
          <Skeleton variant="text" width={200} height={24} />
        </Box>
        {isMobile ? (
          <Box
            sx={{
              display: 'flex',
              overflowX: 'auto',
              gap: 2,
              pb: 2,
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <LoadingSkeleton key={i} isMobile={true} />
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 4,
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <LoadingSkeleton key={i} isMobile={false} />
            ))}
          </Box>
        )}
      </Container>
    );
  }

  if (hotels.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 8 } }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <HotelIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            No hotels available yet
          </Typography>
          <Typography color="text.secondary">
            Check back soon for our featured properties.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 8 } }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'end',
          mb: 4,
          px: { xs: 1, md: 0 },
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight="800"
            sx={{ mb: 1, letterSpacing: '-0.02em' }}
          >
            Our Hotels
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: '400px' }}
          >
            Discover our curated selection of premium hotels worldwide.
          </Typography>
        </Box>
        <Button
          endIcon={<ArrowForward />}
          onClick={() => navigate('/guest/rooms')}
          sx={{
            display: { xs: 'none', md: 'flex' },
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          View all rooms
        </Button>
      </Box>

      {isMobile ? (
        /* Mobile: Horizontal Scroll */
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            overflowX: 'auto',
            gap: 2,
            pb: 2,
            mx: -2,
            px: 2,
            scrollSnapType: 'x mandatory',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
            flexWrap: 'nowrap',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {hotels.map((hotel) => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              isMobile={true}
              onClick={() => handleHotelClick(hotel)}
            />
          ))}
        </Box>
      ) : (
        /* Desktop: CSS Grid */
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 4,
          }}
        >
          {hotels.map((hotel) => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              isMobile={false}
              onClick={() => handleHotelClick(hotel)}
            />
          ))}
        </Box>
      )}

      {/* Mobile: View All Button */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, textAlign: 'center', mt: 3 }}>
        <Button
          variant="outlined"
          endIcon={<ArrowForward />}
          onClick={() => navigate('/guest/rooms')}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
        >
          View all rooms
        </Button>
      </Box>
    </Container>
  );
};

export default FeaturedListings;
