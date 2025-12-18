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
  Chip,
  Paper,
  IconButton,
  Skeleton,
} from '@mui/material';
import {
  FavoriteBorder,
  Favorite,
  Star as StarIcon,
  ChevronLeft,
  ChevronRight,
  Hotel as HotelIcon,
  Person,
  KingBed,
  LocationOn,
  CalendarToday,
  Group,
  Public,
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
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const typeInfo = ROOM_TYPE_INFO[roomType.category] || ROOM_TYPE_INFO.standard;
  const room = roomType.sampleRoom;

  // Get images from the room - check multiple possible structures
  const getImages = () => {
    // Check room galleries
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
    // Use hotel gallery as fallback
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

        {/* Favorite Button */}
        <IconButton
          onClick={handleFavoriteClick}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            color: isFavorite ? '#FF385C' : '#FFFFFF',
            transition: fastSpring,
            '&:hover': { transform: 'scale(1.1)' },
            '&:active': { transform: 'scale(0.9)' },
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
            {typeInfo.label}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <StarIcon sx={{ fontSize: 14, color: '#222222' }} />
            <Typography sx={{ fontSize: '14px', color: '#222222', fontWeight: 500 }}>
              {hotel?.star_rating || 4}.0
            </Typography>
          </Box>
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
          {hotel?.name || 'Hotel'}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Person sx={{ fontSize: 14, color: '#717171' }} />
            <Typography sx={{ fontSize: '14px', color: '#717171' }}>
              {typeInfo.capacity} guests
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '14px', color: '#717171' }}>
            {availableCount} available
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '15px', color: '#222222' }}>
            £{typeInfo.price}
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

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const params = {
      is_active: true,
      status: 'available',
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
        const hotelIdsInCountry = hotelsInCountry.map(h => h.id);
        data = data.filter(room =>
          hotelIdsInCountry.includes(room.hotel) ||
          room.hotel_country?.toLowerCase() === countryLower
        );
      }

      // Filter by city
      if (cityParam && data.length > 0) {
        const cityLower = cityParam.toLowerCase();
        const hotelsInCity = hotelData.filter(h =>
          h.city?.toLowerCase() === cityLower
        );
        const hotelIdsInCity = hotelsInCity.map(h => h.id);
        data = data.filter(room =>
          hotelIdsInCity.includes(room.hotel) ||
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
  const getRoomTypes = () => {
    const typeMap = new Map();

    rooms.forEach(room => {
      const category = room.room_type_category || 'standard';
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

  // Responsive grid columns
  const gridColumns = {
    xs: 'repeat(1, 1fr)',
    sm: 'repeat(2, 1fr)',
    md: 'repeat(3, 1fr)',
    lg: 'repeat(4, 1fr)',
    xl: 'repeat(5, 1fr)',
  };

  if (loading) {
    return (
      <Box sx={{ bgcolor: '#FFFFFF', minHeight: '100vh' }}>
        <Hero initialCollapsed />
        <Container maxWidth={false} sx={{ py: 4, ...containerSx }}>
          <Skeleton variant="text" width={300} height={40} sx={{ mb: 1 }} />
          <Skeleton variant="text" width={200} height={24} sx={{ mb: 4 }} />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: gridColumns,
              gap: 3,
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
      <Hero initialCollapsed />

      <Container maxWidth={false} sx={{ py: 4, ...containerSx }}>
        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            sx={{
              fontSize: { xs: '26px', md: '32px' },
              fontWeight: 600,
              color: '#222222',
              mb: 1,
            }}
          >
            {currentHotel
              ? currentHotel.name
              : filters.country
                ? `Stays in ${filters.country}`
                : filters.city
                  ? `Stays in ${filters.city}`
                  : 'Browse Rooms'}
          </Typography>
          {currentHotel && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LocationOn sx={{ fontSize: 18, color: '#717171' }} />
              <Typography sx={{ fontSize: '16px', color: '#717171' }}>
                {currentHotel.city}, {currentHotel.country}
              </Typography>
              {currentHotel.star_rating && (
                <>
                  <Box sx={{ mx: 1, color: '#DDDDDD' }}>•</Box>
                  <StarIcon sx={{ fontSize: 16, color: '#222222' }} />
                  <Typography sx={{ fontSize: '16px', color: '#222222' }}>
                    {currentHotel.star_rating}.0
                  </Typography>
                </>
              )}
            </Box>
          )}
          <Typography sx={{ fontSize: '16px', color: '#717171' }}>
            {roomTypes.length} room type{roomTypes.length !== 1 ? 's' : ''} available
          </Typography>
        </Box>

        {/* Search Summary */}
        {(filters.checkIn || filters.checkOut || filters.guests !== 2) && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 4,
              borderRadius: '12px',
              bgcolor: '#F7F7F7',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#222222' }}>
              Your search:
            </Typography>
            {(filters.checkIn || filters.checkOut) && (
              <Chip
                icon={<CalendarToday sx={{ fontSize: 16 }} />}
                label={
                  filters.checkIn && filters.checkOut
                    ? `${filters.checkIn} → ${filters.checkOut}`
                    : filters.checkIn || filters.checkOut
                }
                size="small"
                sx={{
                  bgcolor: '#FFFFFF',
                  border: '1px solid #DDDDDD',
                  '& .MuiChip-label': { fontWeight: 500 },
                }}
                onDelete={() => setFilters({ ...filters, checkIn: '', checkOut: '' })}
              />
            )}
            {filters.guests !== 2 && (
              <Chip
                icon={<Group sx={{ fontSize: 16 }} />}
                label={`${filters.guests} guest${filters.guests !== 1 ? 's' : ''}`}
                size="small"
                sx={{
                  bgcolor: '#FFFFFF',
                  border: '1px solid #DDDDDD',
                  '& .MuiChip-label': { fontWeight: 500 },
                }}
                onDelete={() => setFilters({ ...filters, guests: 2 })}
              />
            )}
          </Paper>
        )}

        {/* Room Types Grid */}
        {roomTypes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <HotelIcon sx={{ fontSize: 64, color: '#DDDDDD', mb: 2 }} />
            <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#222222', mb: 1 }}>
              No rooms available
            </Typography>
            <Typography sx={{ fontSize: '14px', color: '#717171', mb: 3 }}>
              Try adjusting your search or check back later.
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
              gap: 3,
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
