import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Skeleton,
  IconButton,
} from '@mui/material';
import {
  FavoriteBorder,
  Favorite,
  Star as StarIcon,
  ChevronLeft,
  ChevronRight,
  Hotel as HotelIcon,
} from '@mui/icons-material';
import hotelService from '../../services/hotelService';

// Airbnb-style animation timing
const springTransition = 'all 0.3s cubic-bezier(0.2, 0, 0, 1)';
const fastSpring = 'all 0.2s cubic-bezier(0.2, 0, 0, 1)';

const HotelCard = ({ hotel, onClick }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Get all gallery images
  const getImages = () => {
    if (hotel.galleries && hotel.galleries.length > 0) {
      const gallery = hotel.galleries[0];
      if (gallery.images && gallery.images.length > 0) {
        return gallery.images.map(img => `http://localhost:8000${img.image}`);
      }
    }
    return [];
  };

  const images = getImages();
  const hasMultipleImages = images.length > 1;

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  return (
    <Box
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        cursor: 'pointer',
        width: '100%',
      }}
    >
      {/* Image Container */}
      <Box
        sx={{
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          aspectRatio: '20/19',
          bgcolor: '#F7F7F7',
          mb: 1.5,
        }}
      >
        {images.length > 0 ? (
          <Box
            component="img"
            src={images[currentImageIndex]}
            alt={hotel.name}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s cubic-bezier(0.2, 0, 0, 1)',
              transform: isHovered ? 'scale(1.02)' : 'scale(1)',
            }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#EBEBEB',
            }}
          >
            <HotelIcon sx={{ fontSize: 48, color: '#DDDDDD' }} />
          </Box>
        )}

        {/* Favorite Button */}
        <IconButton
          onClick={handleFavoriteClick}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            color: isFavorite ? '#FF385C' : '#FFFFFF',
            transition: fastSpring,
            '&:hover': {
              transform: 'scale(1.1)',
            },
            '&:active': {
              transform: 'scale(0.9)',
            },
          }}
        >
          {isFavorite ? (
            <Favorite sx={{ fontSize: 24, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
          ) : (
            <FavoriteBorder
              sx={{
                fontSize: 24,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                stroke: 'rgba(0,0,0,0.5)',
                strokeWidth: 2,
              }}
            />
          )}
        </IconButton>

        {/* Navigation Arrows */}
        {hasMultipleImages && isHovered && (
          <>
            <IconButton
              onClick={handlePrevImage}
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255,255,255,0.9)',
                width: 28,
                height: 28,
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                transition: fastSpring,
                opacity: 0,
                animation: 'fadeIn 0.2s forwards',
                '@keyframes fadeIn': {
                  from: { opacity: 0 },
                  to: { opacity: 1 },
                },
                '&:hover': {
                  bgcolor: '#FFFFFF',
                  transform: 'translateY(-50%) scale(1.04)',
                },
              }}
            >
              <ChevronLeft sx={{ fontSize: 16, color: '#222222' }} />
            </IconButton>
            <IconButton
              onClick={handleNextImage}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255,255,255,0.9)',
                width: 28,
                height: 28,
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                transition: fastSpring,
                opacity: 0,
                animation: 'fadeIn 0.2s forwards',
                '&:hover': {
                  bgcolor: '#FFFFFF',
                  transform: 'translateY(-50%) scale(1.04)',
                },
              }}
            >
              <ChevronRight sx={{ fontSize: 16, color: '#222222' }} />
            </IconButton>
          </>
        )}

        {/* Dots Indicator */}
        {hasMultipleImages && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 0.5,
            }}
          >
            {images.slice(0, 5).map((_, index) => (
              <Box
                key={index}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: index === currentImageIndex ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                  transition: fastSpring,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Content */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.25 }}>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '15px',
              color: '#222222',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              mr: 1,
            }}
          >
            {hotel.city}, {hotel.country}
          </Typography>
          {hotel.star_rating && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <StarIcon sx={{ fontSize: 14, color: '#222222' }} />
              <Typography sx={{ fontSize: '14px', color: '#222222', fontWeight: 500 }}>
                {hotel.star_rating}.0
              </Typography>
            </Box>
          )}
        </Box>

        <Typography
          sx={{
            fontSize: '14px',
            color: '#717171',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            mb: 0.25,
          }}
        >
          {hotel.name}
        </Typography>

        <Typography
          sx={{
            fontSize: '14px',
            color: '#717171',
            mb: 0.5,
          }}
        >
          {hotel.total_rooms || 0} rooms available
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '15px', color: '#222222' }}>
            £120
          </Typography>
          <Typography sx={{ fontSize: '15px', color: '#222222' }}>
            night
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const LoadingSkeleton = () => (
  <Box sx={{ width: '100%' }}>
    <Skeleton
      variant="rounded"
      sx={{
        borderRadius: '12px',
        aspectRatio: '20/19',
        mb: 1.5,
      }}
    />
    <Skeleton variant="text" width="70%" height={20} />
    <Skeleton variant="text" width="50%" height={18} />
    <Skeleton variant="text" width="40%" height={18} />
    <Skeleton variant="text" width="30%" height={20} />
  </Box>
);

const FeaturedListings = () => {
  const navigate = useNavigate();
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
      setHotels(data.slice(0, 12));
    }
    setLoading(false);
  };

  const handleHotelClick = (hotel) => {
    navigate(`/guest/rooms?hotel=${hotel.id}`);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
              xl: 'repeat(5, 1fr)',
            },
            gap: { xs: 3, md: 3 },
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <LoadingSkeleton key={i} />
          ))}
        </Box>
      </Container>
    );
  }

  if (hotels.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <HotelIcon sx={{ fontSize: 64, color: '#DDDDDD', mb: 2 }} />
          <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#222222', mb: 1 }}>
            No hotels available yet
          </Typography>
          <Typography sx={{ fontSize: '14px', color: '#717171' }}>
            Check back soon for our featured properties.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)',
            xl: 'repeat(5, 1fr)',
          },
          gap: { xs: 3, md: 3 },
        }}
      >
        {hotels.map((hotel, index) => (
          <Box
            key={hotel.id}
            sx={{
              opacity: 0,
              animation: `fadeInUp 0.4s ease-out ${index * 0.05}s forwards`,
              '@keyframes fadeInUp': {
                from: {
                  opacity: 0,
                  transform: 'translateY(20px)',
                },
                to: {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
            }}
          >
            <HotelCard
              hotel={hotel}
              onClick={() => handleHotelClick(hotel)}
            />
          </Box>
        ))}
      </Box>
    </Container>
  );
};

export default FeaturedListings;
