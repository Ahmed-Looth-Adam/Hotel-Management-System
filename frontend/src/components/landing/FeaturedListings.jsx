import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Skeleton,
  IconButton,
  Button,
} from '@mui/material';
import {
  Star as StarIcon,
  ChevronLeft,
  ChevronRight,
  Hotel as HotelIcon,
  ArrowForward,
} from '@mui/icons-material';
import hotelService from '../../services/hotelService';

// Airbnb-style animation timing
const springTransition = 'all 0.3s cubic-bezier(0.2, 0, 0, 1)';
const fastSpring = 'all 0.2s cubic-bezier(0.2, 0, 0, 1)';

const HotelCard = ({ hotel, onClick }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

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

  return (
    <Box
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        cursor: 'pointer',
        width: '100%',
        minWidth: { xs: '280px', sm: '260px' },
        maxWidth: { xs: '320px', sm: '300px' },
        flexShrink: 0,
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
              position: 'absolute',
              top: 0,
              left: 0,
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
              position: 'absolute',
              top: 0,
              left: 0,
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
            {hotel.name}
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
          {hotel.city}
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
            £{hotel.min_price || hotel.cheapest_price || 120}
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
  <Box sx={{ width: '100%', minWidth: '260px', maxWidth: '300px', flexShrink: 0 }}>
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

// Horizontal scrollable section for each country
const CountrySection = ({ country, hotels, onHotelClick, onShowAll }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      return () => ref.removeEventListener('scroll', checkScroll);
    }
  }, [hotels]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <Box sx={{ mb: 5 }}>
      {/* Section Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2.5,
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: '22px', md: '24px' },
            fontWeight: 600,
            color: '#222222',
          }}
        >
          Stays in {country}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            onClick={onShowAll}
            sx={{
              color: '#222222',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '14px',
              '&:hover': {
                bgcolor: 'transparent',
                textDecoration: 'underline',
              },
            }}
            endIcon={<ArrowForward sx={{ fontSize: 18 }} />}
          >
            Show all
          </Button>
          {/* Scroll Arrows - Desktop only */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            <IconButton
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              sx={{
                width: 32,
                height: 32,
                border: '1px solid',
                borderColor: canScrollLeft ? '#222222' : '#EBEBEB',
                color: canScrollLeft ? '#222222' : '#EBEBEB',
                '&:hover': {
                  bgcolor: canScrollLeft ? '#F7F7F7' : 'transparent',
                },
              }}
            >
              <ChevronLeft sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              sx={{
                width: 32,
                height: 32,
                border: '1px solid',
                borderColor: canScrollRight ? '#222222' : '#EBEBEB',
                color: canScrollRight ? '#222222' : '#EBEBEB',
                '&:hover': {
                  bgcolor: canScrollRight ? '#F7F7F7' : 'transparent',
                },
              }}
            >
              <ChevronRight sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Scrollable Hotels Row */}
      <Box
        ref={scrollRef}
        sx={{
          display: 'flex',
          gap: 2.5,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          pb: 1,
          mx: { xs: -2, sm: -3, md: -5, lg: -10, xl: -12 },
          px: { xs: 2, sm: 3, md: 5, lg: 10, xl: 12 },
        }}
      >
        {hotels.map((hotel, index) => (
          <Box
            key={hotel.id}
            sx={{
              scrollSnapAlign: 'start',
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
              onClick={() => onHotelClick(hotel)}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

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
      setHotels(data);
    }
    setLoading(false);
  };

  const handleHotelClick = (hotel) => {
    navigate(`/guest/rooms?hotel=${hotel.id}`);
  };

  const handleShowAll = (country) => {
    // Navigate to browse rooms with country filter
    navigate(`/guest/rooms?country=${encodeURIComponent(country)}`);
  };

  // Group hotels by country
  const groupedByCountry = hotels.reduce((acc, hotel) => {
    const country = hotel.country || 'Other';
    if (!acc[country]) {
      acc[country] = [];
    }
    acc[country].push(hotel);
    return acc;
  }, {});

  // Sort countries alphabetically, but put countries with more hotels first
  const sortedCountries = Object.keys(groupedByCountry).sort((a, b) => {
    const diff = groupedByCountry[b].length - groupedByCountry[a].length;
    if (diff !== 0) return diff;
    return a.localeCompare(b);
  });

  // Responsive padding for containers
  const containerSx = { px: { xs: 2, sm: 3, md: 5, lg: 10, xl: 12 } };

  if (loading) {
    return (
      <Container maxWidth={false} sx={{ py: 3, ...containerSx }}>
        {/* Loading skeletons for sections */}
        {[1, 2].map((section) => (
          <Box key={section} sx={{ mb: 5 }}>
            <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
            <Box
              sx={{
                display: 'flex',
                gap: 2.5,
                overflowX: 'hidden',
              }}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <LoadingSkeleton key={i} />
              ))}
            </Box>
          </Box>
        ))}
      </Container>
    );
  }

  if (hotels.length === 0) {
    return (
      <Container maxWidth={false} sx={{ py: 6, ...containerSx }}>
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
    <Container maxWidth={false} sx={{ py: 4, ...containerSx }}>
      {sortedCountries.map((country) => (
        <CountrySection
          key={country}
          country={country}
          hotels={groupedByCountry[country]}
          onHotelClick={handleHotelClick}
          onShowAll={() => handleShowAll(country)}
        />
      ))}
    </Container>
  );
};

export default FeaturedListings;
