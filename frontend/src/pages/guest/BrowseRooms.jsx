/**
 * Browse Rooms Page - Guest view for browsing available rooms
 * Airbnb-style design matching the landing page
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  IconButton,
  Skeleton,
} from '@mui/material';
import {
  Star as StarIcon,
  ChevronLeft,
  ChevronRight,
  Hotel as HotelIcon,
  Person,
  KingBed,
  LocationOn,
  Public,
  ArrowBack,
} from '@mui/icons-material';
import { roomService, hotelService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';
import Hero from '../../components/landing/Hero';

// Airbnb-style animation timing
const fastSpring = 'all 0.2s cubic-bezier(0.2, 0, 0, 1)';

// Room types and base prices from CLAUDE.md
const ROOM_TYPE_INFO = {
  standard: { label: 'Standard Double', price: 120, capacity: 2 },
  deluxe: { label: 'Deluxe King', price: 180, capacity: 2 },
  suite: { label: 'Family Suite', price: 240, capacity: 4 },
  penthouse: { label: 'Penthouse', price: 500, capacity: 4 },
};

// Room Type Card - Airbnb style
const RoomTypeCard = ({ roomType, hotel, availableCount, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const typeInfo = ROOM_TYPE_INFO[roomType.category] || ROOM_TYPE_INFO.standard;
  const room = roomType.sampleRoom;

  // Get images from the room's gallery - do NOT fall back to hotel gallery
  const getImages = () => {
    // Check room's assigned gallery (from RoomListSerializer)
    if (room?.gallery && room.gallery.images && room.gallery.images.length > 0) {
      return room.gallery.images.map(img =>
        img.image?.startsWith('http') ? img.image : `http://localhost:8000${img.image}`
      );
    }
    // Check room galleries array (alternative structure)
    if (room?.galleries && room.galleries.length > 0) {
      const gallery = room.galleries[0];
      if (gallery.images && gallery.images.length > 0) {
        return gallery.images.map(img =>
          img.image?.startsWith('http') ? img.image : `http://localhost:8000${img.image}`
        );
      }
    }
    // Check direct image field
    if (room?.image) {
      const imgUrl = room.image.startsWith('http') ? room.image : `http://localhost:8000${room.image}`;
      return [imgUrl];
    }
    // Check images array
    if (room?.images && room.images.length > 0) {
      return room.images.map(img => {
        const url = typeof img === 'string' ? img : img.image || img.url;
        return url?.startsWith('http') ? url : `http://localhost:8000${url}`;
      });
    }
    // Check room_type images
    if (room?.room_type?.image) {
      const imgUrl = room.room_type.image.startsWith('http') ? room.room_type.image : `http://localhost:8000${room.room_type.image}`;
      return [imgUrl];
    }
    // No fallback to hotel gallery - rooms should use their own gallery
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
      }}
    >
      {/* Image Container */}
      <Box
        sx={{
          position: 'relative',
          borderRadius: { xs: '10px', sm: '12px' },
          overflow: 'hidden',
          aspectRatio: '20/19',
          bgcolor: '#F7F7F7',
          mb: { xs: 1, sm: 1.5 },
        }}
      >
        {images.length > 0 ? (
          <Box
            component="img"
            src={images[currentImageIndex]}
            alt={typeInfo.label}
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
              fontSize: { xs: '13px', sm: '15px' },
              color: '#222222',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              mr: 1,
            }}
          >
            {typeInfo.label}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <StarIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: '#222222' }} />
            <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, color: '#222222', fontWeight: 500 }}>
              {hotel?.star_rating || 4}.0
            </Typography>
          </Box>
        </Box>

        <Typography
          sx={{
            fontSize: { xs: '12px', sm: '14px' },
            color: '#717171',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            mb: 0.25,
          }}
        >
          {hotel?.name || 'Hotel'}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, mb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Person sx={{ fontSize: { xs: 12, sm: 14 }, color: '#717171' }} />
            <Typography sx={{ fontSize: { xs: '11px', sm: '14px' }, color: '#717171' }}>
              {typeInfo.capacity} guests
            </Typography>
          </Box>
          <Typography sx={{ fontSize: { xs: '11px', sm: '14px' }, color: '#717171' }}>
            {availableCount} available
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
          <Typography sx={{ fontWeight: 600, fontSize: { xs: '13px', sm: '15px' }, color: '#222222' }}>
            £{typeInfo.price}
          </Typography>
          <Typography sx={{ fontSize: { xs: '13px', sm: '15px' }, color: '#222222' }}>
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
        borderRadius: { xs: '10px', sm: '12px' },
        aspectRatio: '20/19',
        mb: { xs: 1, sm: 1.5 },
      }}
    />
    <Skeleton variant="text" width="70%" sx={{ height: { xs: 16, sm: 20 } }} />
    <Skeleton variant="text" width="50%" sx={{ height: { xs: 14, sm: 18 } }} />
    <Skeleton variant="text" width="40%" sx={{ height: { xs: 14, sm: 18 } }} />
    <Skeleton variant="text" width="30%" sx={{ height: { xs: 16, sm: 20 } }} />
  </Box>
);

// Hotel Gallery Carousel - Shows hotel images with info overlay
const HotelGalleryCarousel = ({ hotel, roomTypesCount, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get hotel gallery images
  const getHotelImages = () => {
    if (hotel?.galleries && hotel.galleries.length > 0) {
      const gallery = hotel.galleries[0];
      if (gallery.images && gallery.images.length > 0) {
        return gallery.images.map(img =>
          img.image?.startsWith('http') ? img.image : `http://localhost:8000${img.image}`
        );
      }
    }
    return [];
  };

  const images = getHotelImages();
  if (images.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          height: { xs: 280, sm: 340, md: 420 },
        }}
      >
        {/* Main Image */}
        <Box
          component="img"
          src={images[currentIndex]}
          alt={`${hotel?.name} - Image ${currentIndex + 1}`}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'opacity 0.3s ease',
          }}
        />

        {/* Dark Gradient Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.5) 100%)',
          }}
        />

        {/* Hotel Info Overlay - Top */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            p: { xs: 2.5, md: 4 },
          }}
        >
          {/* Back Button + Hotel Name */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <IconButton
              onClick={onBack}
              sx={{
                bgcolor: 'rgba(255,255,255,0.9)',
                width: 36,
                height: 36,
                '&:hover': {
                  bgcolor: '#FFFFFF',
                },
              }}
            >
              <ArrowBack sx={{ fontSize: 20, color: '#222222' }} />
            </IconButton>
            <Typography
              sx={{
                fontSize: { xs: '24px', sm: '28px', md: '36px' },
                fontWeight: 700,
                color: '#FFFFFF',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              {hotel?.name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LocationOn sx={{ fontSize: 18, color: 'rgba(255,255,255,0.9)' }} />
              <Typography sx={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)' }}>
                {hotel?.city}, {hotel?.country}
              </Typography>
            </Box>
            {hotel?.star_rating && (
              <>
                <Box sx={{ color: 'rgba(255,255,255,0.5)' }}>•</Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <StarIcon sx={{ fontSize: 16, color: '#FFFFFF' }} />
                  <Typography sx={{ fontSize: '15px', color: '#FFFFFF', fontWeight: 500 }}>
                    {hotel.star_rating}.0
                  </Typography>
                </Box>
              </>
            )}
            <Box sx={{ color: 'rgba(255,255,255,0.5)' }}>•</Box>
            <Typography sx={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)' }}>
              {roomTypesCount} room type{roomTypesCount !== 1 ? 's' : ''} available
            </Typography>
          </Box>
        </Box>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <IconButton
              onClick={handlePrev}
              sx={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255,255,255,0.95)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                width: 36,
                height: 36,
                '&:hover': {
                  bgcolor: '#FFFFFF',
                  transform: 'translateY(-50%) scale(1.05)',
                },
              }}
            >
              <ChevronLeft sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton
              onClick={handleNext}
              sx={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255,255,255,0.95)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                width: 36,
                height: 36,
                '&:hover': {
                  bgcolor: '#FFFFFF',
                  transform: 'translateY(-50%) scale(1.05)',
                },
              }}
            >
              <ChevronRight sx={{ fontSize: 20 }} />
            </IconButton>
          </>
        )}

        {/* Dot Indicators */}
        {images.length > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 0.75,
            }}
          >
            {images.map((_, idx) => (
              <Box
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                sx={{
                  width: idx === currentIndex ? 8 : 6,
                  height: idx === currentIndex ? 8 : 6,
                  borderRadius: '50%',
                  bgcolor: idx === currentIndex ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  transition: fastSpring,
                  '&:hover': {
                    bgcolor: '#FFFFFF',
                  },
                }}
              />
            ))}
          </Box>
        )}

        {/* Image Counter */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            bgcolor: 'rgba(0,0,0,0.6)',
            color: '#FFFFFF',
            px: 1.5,
            py: 0.5,
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          {currentIndex + 1} / {images.length}
        </Box>
      </Box>
    </Box>
  );
};

const BrowseRooms = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [filters, setFilters] = useState({
    hotel: searchParams.get('hotel') || '',
    city: searchParams.get('city') || '',
    country: searchParams.get('country') || '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: parseInt(searchParams.get('guests')) || 2,
  });

  // Get current hotel if filtering by hotel
  const currentHotel = filters.hotel ? hotels.find((h) => h.id == filters.hotel) : null;

  // Sync filters state with URL params when they change
  useEffect(() => {
    setFilters({
      hotel: searchParams.get('hotel') || '',
      city: searchParams.get('city') || '',
      country: searchParams.get('country') || '',
      checkIn: searchParams.get('checkIn') || '',
      checkOut: searchParams.get('checkOut') || '',
      guests: parseInt(searchParams.get('guests')) || 2,
    });
  }, [searchParams]);

  useEffect(() => {
    fetchInitialData();
  }, [searchParams]);

  const fetchInitialData = async () => {
    setLoading(true);
    const params = {
      is_active: true,
      status: 'available',
      page_size: 1000, // Request more rooms to overcome pagination limit
    };

    const hotelParam = searchParams.get('hotel');
    const cityParam = searchParams.get('city');
    const countryParam = searchParams.get('country');
    if (hotelParam) params.hotel = hotelParam;

    const [roomsResult, hotelsResult] = await Promise.all([
      roomService.getAll(params),
      hotelService.getAll({ is_active: true }),
    ]);

    let hotelData = [];
    if (hotelsResult.success) {
      hotelData = Array.isArray(hotelsResult.data)
        ? hotelsResult.data
        : hotelsResult.data?.results || [];
      setHotels(hotelData);
    }

    if (roomsResult.success) {
      let data = Array.isArray(roomsResult.data)
        ? roomsResult.data
        : roomsResult.data?.results || [];

      // Filter by country
      if (countryParam && data.length > 0) {
        const countryLower = countryParam.toLowerCase();
        const hotelsInCountry = hotelData.filter(h =>
          h.country?.toLowerCase() === countryLower
        );
        const hotelIdsInCountry = hotelsInCountry.map(h => String(h.id));
        data = data.filter(room =>
          hotelIdsInCountry.includes(String(room.hotel)) ||
          room.hotel_country?.toLowerCase() === countryLower
        );
      }

      // Filter by city
      if (cityParam && data.length > 0) {
        const cityLower = cityParam.toLowerCase();
        const hotelsInCity = hotelData.filter(h =>
          h.city?.toLowerCase() === cityLower
        );
        const hotelIdsInCity = hotelsInCity.map(h => String(h.id));
        data = data.filter(room =>
          hotelIdsInCity.includes(String(room.hotel)) ||
          room.hotel_city?.toLowerCase() === cityLower
        );
      }

      setRooms(data);
    } else {
      showError('Failed to load rooms');
    }

    setLoading(false);
  };

  // Group rooms by type and get unique types with count
  // Filters out room types that can't accommodate the number of guests
  const getRoomTypes = () => {
    const typeMap = new Map();
    const guestCount = filters.guests || 1;

    rooms.forEach(room => {
      const category = room.room_type_category || 'standard';
      const typeInfo = ROOM_TYPE_INFO[category] || ROOM_TYPE_INFO.standard;

      // Skip rooms that can't accommodate the number of guests
      if (typeInfo.capacity < guestCount) {
        return;
      }

      if (!typeMap.has(category)) {
        typeMap.set(category, {
          category,
          count: 1,
          sampleRoom: room,
          hotelId: room.hotel,
        });
      } else {
        typeMap.get(category).count++;
      }
    });

    return Array.from(typeMap.values());
  };

  const roomTypes = getRoomTypes();

  const handleRoomTypeClick = (roomType) => {
    // Navigate to room details with the sample room
    const queryParams = new URLSearchParams();
    if (filters.checkIn) queryParams.append('checkIn', filters.checkIn);
    if (filters.checkOut) queryParams.append('checkOut', filters.checkOut);
    if (filters.guests) queryParams.append('guests', filters.guests.toString());
    navigate(`/guest/rooms/${roomType.sampleRoom.id}?${queryParams.toString()}`);
  };

  // Responsive padding
  const containerSx = { px: { xs: 2, sm: 3, md: 5, lg: 10, xl: 12 } };

  // Responsive grid columns - 2 cards on mobile
  const gridColumns = {
    xs: 'repeat(2, 1fr)',
    sm: 'repeat(2, 1fr)',
    md: 'repeat(3, 1fr)',
    lg: 'repeat(4, 1fr)',
    xl: 'repeat(5, 1fr)',
  };

  if (loading) {
    return (
      <Box sx={{ bgcolor: '#FFFFFF', minHeight: '100vh' }}>
        <Hero initialCollapsed hideBottomNav />
        <Container maxWidth={false} sx={{ py: { xs: 2, sm: 4 }, ...containerSx }}>
          <Skeleton variant="text" width={300} height={40} sx={{ mb: 1 }} />
          <Skeleton variant="text" width={200} height={24} sx={{ mb: 4 }} />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: gridColumns,
              gap: { xs: 1.5, sm: 3 },
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <LoadingSkeleton key={i} />
            ))}
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#FFFFFF', minHeight: '100vh' }}>
      {/* Sticky Header with Search */}
      <Hero initialCollapsed hideBottomNav />

      <Container maxWidth={false} sx={{ py: { xs: 2, sm: 4 }, ...containerSx }}>
        {/* Hotel Gallery Carousel with info overlay - Only show when viewing a specific hotel */}
        {currentHotel && (
          <HotelGalleryCarousel
            hotel={currentHotel}
            roomTypesCount={roomTypes.length}
            onBack={() => navigate('/')}
          />
        )}

        {/* Page Header - Only show when NOT viewing a specific hotel */}
        {!currentHotel && (
          <Box sx={{ mb: { xs: 2, sm: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, mb: 1 }}>
              <Box
                onClick={() => navigate('/')}
                sx={{
                  width: { xs: 32, sm: 36 },
                  height: { xs: 32, sm: 36 },
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                }}
              >
                <ArrowBack sx={{ fontSize: { xs: 18, sm: 22 }, color: '#222222' }} />
              </Box>
              <Typography
                sx={{
                  fontSize: { xs: '18px', sm: '26px', md: '32px' },
                  fontWeight: 600,
                  color: '#222222',
                }}
              >
                {filters.country
                  ? `Stays in ${filters.country}`
                  : filters.city
                    ? `Stays in ${filters.city}`
                    : 'Browse Rooms'}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: { xs: '13px', sm: '16px' }, color: '#717171' }}>
              {roomTypes.length} room type{roomTypes.length !== 1 ? 's' : ''} available
            </Typography>
          </Box>
        )}

        {/* Room Types Grid */}
        {roomTypes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <HotelIcon sx={{ fontSize: 64, color: '#DDDDDD', mb: 2 }} />
            <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#222222', mb: 1 }}>
              No rooms available for {filters.guests} guest{filters.guests !== 1 ? 's' : ''}
            </Typography>
            <Typography sx={{ fontSize: '14px', color: '#717171', mb: 3 }}>
              {filters.guests > 4
                ? 'Our largest rooms accommodate up to 4 guests. Try searching for fewer guests.'
                : 'Try adjusting your search or reducing the number of guests.'}
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#222222',
                color: '#222222',
                '&:hover': {
                  borderColor: '#222222',
                  bgcolor: '#F7F7F7',
                },
              }}
            >
              Back to Home
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: gridColumns,
              gap: { xs: 1.5, sm: 3 },
            }}
          >
            {roomTypes.map((roomType, index) => (
              <Box
                key={roomType.category}
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
                <RoomTypeCard
                  roomType={roomType}
                  hotel={currentHotel || hotels.find(h => h.id === roomType.hotelId)}
                  availableCount={roomType.count}
                  onClick={() => handleRoomTypeClick(roomType)}
                />
              </Box>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default BrowseRooms;
