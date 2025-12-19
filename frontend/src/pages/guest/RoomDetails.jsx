/**
 * Room Type Details Page - View room type details and make booking
 * Books a room TYPE, not a specific room. Room assignment happens at check-in.
 * Airbnb-style design matching the landing page.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Divider,
  Alert,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Skeleton,
} from '@mui/material';
import {
  Hotel as HotelIcon,
  Person,
  KingBed,
  Wifi,
  Tv,
  AcUnit,
  LocalBar,
  Bathtub,
  FlightTakeoff,
  Restaurant,
  Spa,
  Schedule,
  LocationOn,
  Star as StarIcon,
  ArrowBack,
} from '@mui/icons-material';
import { roomService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';
import Hero from '../../components/landing/Hero';

// Room types and base prices from CLAUDE.md
const ROOM_TYPE_INFO = {
  standard: { label: 'Standard Double', price: 120, capacity: 2, bedSize: 'Double' },
  deluxe: { label: 'Deluxe King', price: 180, capacity: 2, bedSize: 'King' },
  suite: { label: 'Family Suite', price: 240, capacity: 4, bedSize: 'King + Sofa Bed' },
  penthouse: { label: 'Penthouse', price: 500, capacity: 4, bedSize: 'Super King' },
};

// Ancillary services from CLAUDE.md
const ANCILLARY_SERVICES = [
  { id: 'airport_transfer', label: 'Airport Transfer (One-way)', price: 50, icon: FlightTakeoff, perPerson: false },
  { id: 'breakfast', label: 'Full English Breakfast', price: 20, icon: Restaurant, perPerson: true },
  { id: 'spa', label: 'Spa Access', price: 35, icon: Spa, perPerson: true },
  { id: 'late_checkout', label: 'Late Check-out (until 2 PM)', price: 40, icon: Schedule, perPerson: false },
];

// Standard amenities for all rooms
const AMENITIES = [
  { icon: Wifi, label: 'Free WiFi' },
  { icon: Tv, label: 'Smart TV' },
  { icon: AcUnit, label: 'Air Conditioning' },
  { icon: LocalBar, label: 'Mini Bar' },
  { icon: Bathtub, label: 'Private Bathroom' },
];

const RoomDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { showError } = useNotification();

  const [room, setRoom] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [formData, setFormData] = useState({
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: parseInt(searchParams.get('guests')) || 2,
    specialRequests: '',
  });
  const [selectedServices, setSelectedServices] = useState([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    const roomResult = await roomService.getById(id);
    if (roomResult.success) {
      setRoom(roomResult.data);
      // Hotel is already included in the room detail response (via HotelListSerializer)
      if (roomResult.data.hotel && typeof roomResult.data.hotel === 'object') {
        setHotel(roomResult.data.hotel);
      } else if (roomResult.data.hotel) {
        // Fallback: fetch hotel if only ID is returned
        const hotelResult = await hotelService.getById(roomResult.data.hotel);
        if (hotelResult.success) {
          setHotel(hotelResult.data);
        }
      }
    } else {
      showError('Failed to load room details');
      navigate('/guest/rooms');
    }
    setLoading(false);
  };

  const roomTypeCategory = room?.room_type_category || 'standard';
  const typeInfo = ROOM_TYPE_INFO[roomTypeCategory] || ROOM_TYPE_INFO.standard;

  // Get images from room's gallery - do NOT fall back to hotel gallery
  const getImages = () => {
    // Check room's own gallery (singular - from RoomDetailSerializer)
    if (room?.gallery?.images && room.gallery.images.length > 0) {
      return room.gallery.images.map(img =>
        img.image?.startsWith('http') ? img.image : `http://localhost:8000${img.image}`
      );
    }
    // Check room galleries (plural - alternative structure)
    if (room?.galleries && room.galleries.length > 0) {
      const gallery = room.galleries[0];
      if (gallery.images && gallery.images.length > 0) {
        return gallery.images.map(img =>
          img.image?.startsWith('http') ? img.image : `http://localhost:8000${img.image}`
        );
      }
    }
    // No fallback to hotel gallery - rooms should use their own gallery
    return [];
  };

  const images = getImages();
  const hasMultipleImages = images.length > 1;

  // Calculate price
  const calculatePrice = () => {
    if (!formData.checkIn || !formData.checkOut) {
      return { roomTotal: 0, servicesTotal: 0, total: 0, nights: 0 };
    }
    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    if (nights <= 0) return { roomTotal: 0, servicesTotal: 0, total: 0, nights: 0 };

    const roomTotal = typeInfo.price * nights;
    let servicesTotal = 0;
    selectedServices.forEach((serviceId) => {
      const service = ANCILLARY_SERVICES.find((s) => s.id === serviceId);
      if (service) {
        servicesTotal += service.perPerson
          ? service.price * formData.guests * nights
          : service.price;
      }
    });

    return { roomTotal, servicesTotal, total: roomTotal + servicesTotal, nights };
  };

  const priceBreakdown = calculatePrice();

  const handleServiceToggle = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleBooking = () => {
    if (!formData.checkIn || !formData.checkOut) {
      showError('Please select check-in and check-out dates');
      return;
    }

    if (new Date(formData.checkOut) <= new Date(formData.checkIn)) {
      showError('Check-out date must be after check-in date');
      return;
    }

    if (formData.guests > typeInfo.capacity) {
      showError(`Maximum ${typeInfo.capacity} guests allowed for this room type`);
      return;
    }

    // Navigate to booking confirmation page with all details
    const params = new URLSearchParams({
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      guests: formData.guests.toString(),
    });

    if (selectedServices.length > 0) {
      params.set('services', selectedServices.join(','));
    }

    if (formData.specialRequests.trim()) {
      params.set('specialRequests', formData.specialRequests.trim());
    }

    navigate(`/guest/booking/${id}/confirm?${params.toString()}`);
  };

  const containerSx = { px: { xs: 2, sm: 4, md: 12, lg: 20, xl: 28 } };

  if (loading) {
    return (
      <Box sx={{ bgcolor: '#FFFFFF', minHeight: '100vh' }}>
        <Hero initialCollapsed hideBottomNav initialParams={{ city: hotel?.city, checkIn: formData.checkIn, checkOut: formData.checkOut, guests: formData.guests }} />
        <Container maxWidth={false} sx={{ py: { xs: 2, sm: 4 }, ...containerSx }}>
          {/* Title skeleton */}
          <Skeleton variant="text" sx={{ width: { xs: 180, sm: 300 }, height: { xs: 28, sm: 40 }, mb: 1 }} />
          <Skeleton variant="text" sx={{ width: { xs: 140, sm: 200 }, height: { xs: 20, sm: 24 }, mb: { xs: 2, sm: 3 } }} />

          {/* Gallery skeleton */}
          <Skeleton
            variant="rounded"
            sx={{
              height: { xs: 200, sm: 280, md: 380 },
              borderRadius: { xs: '10px', sm: '12px' },
              mb: { xs: 2, sm: 4 }
            }}
          />

          {/* Content layout */}
          <Box sx={{ display: 'flex', gap: { xs: 2, sm: 4 }, flexDirection: { xs: 'column', lg: 'row' } }}>
            {/* Left column - Room info */}
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" sx={{ width: '60%', height: { xs: 24, sm: 30 } }} />
              <Skeleton variant="text" sx={{ width: '40%', height: { xs: 20, sm: 24 }, mb: 2 }} />
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} variant="text" sx={{ width: '80%', height: { xs: 18, sm: 22 } }} />
                ))}
              </Box>
            </Box>

            {/* Right column - Services and Booking card */}
            <Box sx={{ width: { xs: '100%', lg: 320 }, display: 'flex', flexDirection: 'column' }}>
              {/* Extra services skeleton - first on mobile */}
              <Box sx={{ order: { xs: 1, sm: 2 }, mb: { xs: 2, sm: 0 }, mt: { xs: 0, sm: 3 } }}>
                <Skeleton variant="text" sx={{ width: 140, height: { xs: 22, sm: 26 }, mb: 1 }} />
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} variant="text" sx={{ width: '100%', height: { xs: 36, sm: 44 }, mb: 0.5 }} />
                ))}
              </Box>

              {/* Booking card skeleton - second on mobile */}
              <Skeleton
                variant="rounded"
                sx={{
                  width: '100%',
                  height: { xs: 280, sm: 350 },
                  borderRadius: { xs: '10px', sm: '12px' },
                  order: { xs: 2, sm: 1 },
                }}
              />
            </Box>
          </Box>
        </Container>
      </Box>
    );
  }

  if (!room) {
    return (
      <Box sx={{ bgcolor: '#FFFFFF', minHeight: '100vh' }}>
        <Hero initialCollapsed hideBottomNav initialParams={{ city: hotel?.city, checkIn: formData.checkIn, checkOut: formData.checkOut, guests: formData.guests }} />
        <Container maxWidth={false} sx={{ py: 4, ...containerSx }}>
          <Alert severity="error" sx={{ borderRadius: '12px' }}>Room type not found</Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#FFFFFF', minHeight: '100vh' }}>
      <Hero initialCollapsed hideBottomNav initialParams={{ city: hotel?.city, checkIn: formData.checkIn, checkOut: formData.checkOut, guests: formData.guests }} />

      <Container maxWidth={false} sx={{ py: { xs: 2, sm: 4 }, ...containerSx }}>
        {/* Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, mb: 1 }}>
          <Box
            onClick={() => navigate(-1)}
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
          <Typography sx={{ fontSize: { xs: '18px', sm: '24px', md: '28px' }, fontWeight: 600, color: '#222222' }}>
            {typeInfo.label}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
          {hotel && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <StarIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: '#222222' }} />
                <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, color: '#222222', fontWeight: 500 }}>
                  {hotel.star_rating || 4}.0
                </Typography>
              </Box>
              <Typography sx={{ color: '#717171', fontSize: { xs: '12px', sm: '14px' } }}>·</Typography>
              <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, color: '#717171', textDecoration: 'underline', cursor: 'pointer' }}>
                {hotel.name}
              </Typography>
              <Typography sx={{ color: '#717171', fontSize: { xs: '12px', sm: '14px' } }}>·</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOn sx={{ fontSize: { xs: 14, sm: 16 }, color: '#717171' }} />
                <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, color: '#717171' }}>
                  {hotel.city}, {hotel.country}
                </Typography>
              </Box>
            </>
          )}
        </Box>

        {/* Main Content - Two Column Layout */}
        <Box sx={{ display: 'flex', gap: { xs: 2, sm: 4 }, flexDirection: { xs: 'column', lg: 'row' }, alignItems: 'flex-start' }}>
          {/* Left Column - Gallery + Room Info */}
          <Box sx={{ flex: 1, width: '100%' }}>
            {/* Gallery */}
            <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexDirection: { xs: 'column', md: 'row' }, mb: { xs: 2, sm: 4 } }}>
            {/* Main Image */}
            <Box
              sx={{
                position: 'relative',
                borderRadius: { xs: '10px', sm: '12px' },
                overflow: 'hidden',
                height: { xs: 200, sm: 280, md: 380, xl: 450 },
                width: { xs: '100%', md: 580, xl: 850 },
                flexShrink: 0,
                bgcolor: '#F7F7F7',
              }}
            >
              {images.length > 0 ? (
                <Box
                  component="img"
                  src={images[currentImageIndex]}
                  alt={typeInfo.label}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'opacity 0.3s ease',
                  }}
                />
              ) : (
                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#EBEBEB' }}>
                  <HotelIcon sx={{ fontSize: 80, color: '#DDDDDD' }} />
                </Box>
              )}
              {images.length > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 12,
                    right: 12,
                    bgcolor: 'rgba(0,0,0,0.7)',
                    color: '#FFFFFF',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  {currentImageIndex + 1} / {images.length}
                </Box>
              )}
            </Box>

            {/* Thumbnails */}
            {images.length > 1 && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'row', md: 'column' },
                  gap: { xs: 1, sm: 1.5 },
                  width: { xs: '100%', md: 130 },
                  height: { xs: 60, sm: 80, md: 380 },
                  overflowX: { xs: 'auto', md: 'hidden' },
                  overflowY: { xs: 'hidden', md: 'auto' },
                  flexShrink: 0,
                  '&::-webkit-scrollbar': { width: 6, height: 6 },
                  '&::-webkit-scrollbar-track': { bgcolor: '#F7F7F7', borderRadius: 3 },
                  '&::-webkit-scrollbar-thumb': { bgcolor: '#DDDDDD', borderRadius: 3, '&:hover': { bgcolor: '#BBBBBB' } },
                }}
              >
                {images.map((img, idx) => (
                  <Box
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    sx={{
                      flexShrink: 0,
                      width: { xs: 70, sm: 100, md: '100%' },
                      height: { xs: '100%', md: 85 },
                      borderRadius: { xs: '6px', sm: '8px' },
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: idx === currentImageIndex ? '2px solid #667eea' : '2px solid transparent',
                      opacity: idx === currentImageIndex ? 1 : 0.7,
                      transition: 'all 0.2s ease',
                      '&:hover': { opacity: 1, transform: 'scale(1.02)' },
                    }}
                  >
                    <Box
                      component="img"
                      src={img}
                      alt={`${typeInfo.label} - ${idx + 1}`}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                ))}
              </Box>
            )}
            </Box>

            {/* Room Info - Inside Left Column */}
            <Box sx={{ borderBottom: '1px solid #EBEBEB', pb: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
              <Typography sx={{ fontSize: { xs: '16px', sm: '22px' }, fontWeight: 600, color: '#222222', mb: 0.5 }}>
                {typeInfo.label} at {hotel?.name || 'Hotel'}
              </Typography>
              <Typography sx={{ fontSize: { xs: '13px', sm: '16px' }, color: '#717171' }}>
                {typeInfo.capacity} guests · {typeInfo.bedSize} bed · Private bathroom
              </Typography>
              <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, color: '#717171', mt: 0.5 }}>
                Room will be assigned at check-in based on availability
              </Typography>
            </Box>

            {/* Amenities */}
            <Box sx={{ pb: { xs: 2, sm: 3 } }}>
              <Typography sx={{ fontSize: { xs: '16px', sm: '22px' }, fontWeight: 600, color: '#222222', mb: { xs: 1.5, sm: 2 } }}>
                What this room offers
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 200px))', gap: { xs: 1, sm: 2 } }}>
                {AMENITIES.map((amenity, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
                    <amenity.icon sx={{ fontSize: { xs: 18, sm: 24 }, color: '#222222' }} />
                    <Typography sx={{ fontSize: { xs: '13px', sm: '16px' }, color: '#222222' }}>{amenity.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          {/* Right Column - Booking Card + Extra Services */}
          <Box sx={{ width: { xs: '100%', lg: 320 }, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Booking Card */}
            <Box
              sx={{
                border: '1px solid #DDDDDD',
                borderRadius: { xs: '10px', sm: '12px' },
                p: { xs: 2, sm: 3 },
                boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                bgcolor: '#FFFFFF',
                mb: { xs: 2, sm: 3 },
                order: { xs: 2, sm: 1 },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: { xs: 2, sm: 3 } }}>
                <Typography sx={{ fontSize: { xs: '18px', sm: '22px' }, fontWeight: 600, color: '#222222' }}>
                  £{typeInfo.price}
                </Typography>
                <Typography sx={{ fontSize: { xs: '13px', sm: '16px' }, color: '#717171' }}>night</Typography>
              </Box>

              {/* Date & Guest Inputs */}
              <Box sx={{ border: '1px solid #B0B0B0', borderRadius: '8px', mb: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', borderBottom: '1px solid #B0B0B0' }}>
                  <Box sx={{ flex: 1, p: { xs: 1, sm: 1.5 }, borderRight: '1px solid #B0B0B0', overflow: 'hidden' }}>
                    <Typography sx={{ fontSize: { xs: '9px', sm: '10px' }, fontWeight: 600, color: '#222222', textTransform: 'uppercase' }}>
                      Check-in
                    </Typography>
                    <TextField
                      type="date"
                      value={formData.checkIn}
                      onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                      variant="standard"
                      fullWidth
                      InputProps={{ disableUnderline: true }}
                      inputProps={{ min: new Date().toISOString().split('T')[0], style: { padding: 0 } }}
                      sx={{ '& input': { fontSize: { xs: '12px', sm: '14px' }, color: '#222222', width: '100%' } }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, p: { xs: 1, sm: 1.5 }, overflow: 'hidden' }}>
                    <Typography sx={{ fontSize: { xs: '9px', sm: '10px' }, fontWeight: 600, color: '#222222', textTransform: 'uppercase' }}>
                      Check-out
                    </Typography>
                    <TextField
                      type="date"
                      value={formData.checkOut}
                      onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                      variant="standard"
                      fullWidth
                      InputProps={{ disableUnderline: true }}
                      inputProps={{ min: formData.checkIn || new Date().toISOString().split('T')[0], style: { padding: 0 } }}
                      sx={{ '& input': { fontSize: { xs: '12px', sm: '14px' }, color: '#222222', width: '100%' } }}
                    />
                  </Box>
                </Box>
                <Box sx={{ p: { xs: 1, sm: 1.5 } }}>
                  <Typography sx={{ fontSize: { xs: '9px', sm: '10px' }, fontWeight: 600, color: '#222222', textTransform: 'uppercase' }}>
                    Guests
                  </Typography>
                  <TextField
                    type="number"
                    value={formData.guests}
                    onChange={(e) => setFormData({ ...formData, guests: Math.min(parseInt(e.target.value) || 1, typeInfo.capacity) })}
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                    inputProps={{ min: 1, max: typeInfo.capacity, style: { padding: 0 } }}
                    sx={{ '& input': { fontSize: { xs: '12px', sm: '14px' }, color: '#222222' } }}
                  />
                </Box>
              </Box>

              {/* Special Requests */}
              <TextField
                placeholder="Special requests (optional)"
                multiline
                rows={2}
                value={formData.specialRequests}
                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                fullWidth
                size="small"
                sx={{ mb: { xs: 1.5, sm: 2 }, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: { xs: '12px', sm: '14px' } } }}
              />

              {/* Book Button */}
              <Button
                variant="contained"
                fullWidth
                onClick={handleBooking}
                disabled={!formData.checkIn || !formData.checkOut}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '8px',
                  py: { xs: 1, sm: 1.5 },
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: { xs: '14px', sm: '16px' },
                  '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)' },
                  '&.Mui-disabled': { background: '#DDDDDD', color: '#999999' },
                }}
              >
                Book
              </Button>

              {!isAuthenticated && (
                <Typography sx={{ fontSize: { xs: '11px', sm: '12px' }, color: '#717171', textAlign: 'center', mt: 1 }}>
                  You'll need to log in to complete your booking
                </Typography>
              )}

              {/* Price Breakdown */}
              {priceBreakdown.nights > 0 && (
                <Box sx={{ mt: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, color: '#222222', textDecoration: 'underline' }}>
                      £{typeInfo.price} x {priceBreakdown.nights} night{priceBreakdown.nights !== 1 ? 's' : ''}
                    </Typography>
                    <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, color: '#222222' }}>£{priceBreakdown.roomTotal}</Typography>
                  </Box>
                  {priceBreakdown.servicesTotal > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, color: '#222222', textDecoration: 'underline' }}>
                        Extra services
                      </Typography>
                      <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, color: '#222222' }}>£{priceBreakdown.servicesTotal}</Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: { xs: '13px', sm: '14px' }, fontWeight: 600, color: '#222222' }}>Total</Typography>
                    <Typography sx={{ fontSize: { xs: '13px', sm: '14px' }, fontWeight: 600, color: '#222222' }}>£{priceBreakdown.total}</Typography>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Extra Services - Above Booking Card on mobile, below on desktop */}
            <Box sx={{ order: { xs: 1, sm: 2 }, mb: { xs: 2, sm: 0 }, mt: { xs: 0, sm: 3 } }}>
              <Typography sx={{ fontSize: { xs: '15px', sm: '18px' }, fontWeight: 600, color: '#222222', mb: { xs: 1.5, sm: 2 } }}>
                Add extra services
              </Typography>
              <FormGroup>
                {ANCILLARY_SERVICES.map((service) => {
                  const Icon = service.icon;
                  return (
                    <FormControlLabel
                      key={service.id}
                      control={
                        <Checkbox
                          checked={selectedServices.includes(service.id)}
                          onChange={() => handleServiceToggle(service.id)}
                          size="small"
                          sx={{ '&.Mui-checked': { color: '#667eea' }, p: { xs: 0.5, sm: 1 } }}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, py: { xs: 0.25, sm: 0.5 } }}>
                          <Icon sx={{ fontSize: { xs: 16, sm: 20 }, color: '#717171' }} />
                          <Box>
                            <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, color: '#222222' }}>{service.label}</Typography>
                            <Typography sx={{ fontSize: { xs: '11px', sm: '12px' }, color: '#717171' }}>
                              £{service.price}{service.perPerson ? ' per person per day' : ''}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      sx={{ m: 0, borderBottom: '1px solid #EBEBEB', '&:last-child': { borderBottom: 'none' } }}
                    />
                  );
                })}
              </FormGroup>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default RoomDetails;
