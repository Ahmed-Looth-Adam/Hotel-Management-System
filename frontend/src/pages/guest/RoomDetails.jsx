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
  CircularProgress,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
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
  CheckCircle,
  FlightTakeoff,
  Restaurant,
  Spa,
  Schedule,
  LocationOn,
  Star as StarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
} from '@mui/icons-material';
import { roomService, bookingService, hotelService } from '../../services';
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
  const { showSuccess, showError } = useNotification();

  const [room, setRoom] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
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
      // Fetch hotel details
      if (roomResult.data.hotel) {
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

  // Get images
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
    // Check hotel galleries as fallback
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

  const handleBooking = async () => {
    if (!isAuthenticated) {
      // Save current URL to redirect back after login
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

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

    setBooking(true);
    const result = await bookingService.create({
      hotel: room.hotel,
      room_type: roomTypeCategory,
      check_in_date: formData.checkIn,
      check_out_date: formData.checkOut,
      guests_count: formData.guests,
      special_requests: formData.specialRequests,
      total_price: priceBreakdown.total,
      ancillary_services: selectedServices,
    });

    if (result.success) {
      showSuccess('Booking created successfully! Room will be assigned at check-in.');
      navigate('/guest/my-bookings');
    } else {
      showError(result.error?.message || result.error?.detail || 'Failed to create booking');
    }
    setBooking(false);
  };

  const containerSx = { px: { xs: 2, sm: 3, md: 5, lg: 10, xl: 12 } };

  if (loading) {
    return (
      <Box sx={{ bgcolor: '#FFFFFF', minHeight: '100vh' }}>
        <Hero initialCollapsed hideBottomNav />
        <Container maxWidth={false} sx={{ py: 4, ...containerSx }}>
          <Skeleton variant="text" width={300} height={40} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={400} sx={{ borderRadius: '12px', mb: 3 }} />
          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={30} />
              <Skeleton variant="text" width="40%" height={24} />
            </Box>
            <Skeleton variant="rounded" width={400} height={500} sx={{ borderRadius: '12px' }} />
          </Box>
        </Container>
      </Box>
    );
  }

  if (!room) {
    return (
      <Box sx={{ bgcolor: '#FFFFFF', minHeight: '100vh' }}>
        <Hero initialCollapsed hideBottomNav />
        <Container maxWidth={false} sx={{ py: 4, ...containerSx }}>
          <Alert severity="error" sx={{ borderRadius: '12px' }}>Room type not found</Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#FFFFFF', minHeight: '100vh' }}>
      <Hero initialCollapsed hideBottomNav />

      <Container maxWidth={false} sx={{ py: 4, ...containerSx }}>
        {/* Title */}
        <Typography sx={{ fontSize: { xs: '24px', md: '28px' }, fontWeight: 600, color: '#222222', mb: 1 }}>
          {typeInfo.label}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {hotel && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <StarIcon sx={{ fontSize: 16, color: '#222222' }} />
                <Typography sx={{ fontSize: '14px', color: '#222222', fontWeight: 500 }}>
                  {hotel.star_rating || 4}.0
                </Typography>
              </Box>
              <Typography sx={{ color: '#717171' }}>·</Typography>
              <Typography sx={{ fontSize: '14px', color: '#717171', textDecoration: 'underline', cursor: 'pointer' }}>
                {hotel.name}
              </Typography>
              <Typography sx={{ color: '#717171' }}>·</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOn sx={{ fontSize: 16, color: '#717171' }} />
                <Typography sx={{ fontSize: '14px', color: '#717171' }}>
                  {hotel.city}, {hotel.country}
                </Typography>
              </Box>
            </>
          )}
        </Box>

        {/* Image Gallery */}
        <Box
          sx={{
            position: 'relative',
            borderRadius: '12px',
            overflow: 'hidden',
            height: { xs: 300, md: 450 },
            bgcolor: '#F7F7F7',
            mb: 4,
          }}
        >
          {images.length > 0 ? (
            <Box
              component="img"
              src={images[currentImageIndex]}
              alt={typeInfo.label}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#EBEBEB' }}>
              <HotelIcon sx={{ fontSize: 80, color: '#DDDDDD' }} />
            </Box>
          )}
          {hasMultipleImages && (
            <>
              <IconButton
                onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                sx={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: '#FFFFFF' } }}
              >
                <ChevronLeft />
              </IconButton>
              <IconButton
                onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                sx={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: '#FFFFFF' } }}
              >
                <ChevronRight />
              </IconButton>
              <Box sx={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 0.5 }}>
                {images.map((_, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: idx === currentImageIndex ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                      cursor: 'pointer',
                    }}
                    onClick={() => setCurrentImageIndex(idx)}
                  />
                ))}
              </Box>
            </>
          )}
        </Box>

        {/* Content */}
        <Box sx={{ display: 'flex', gap: 6, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Left - Room Info */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ borderBottom: '1px solid #EBEBEB', pb: 3, mb: 3 }}>
              <Typography sx={{ fontSize: '22px', fontWeight: 600, color: '#222222', mb: 1 }}>
                {typeInfo.label} at {hotel?.name || 'Hotel'}
              </Typography>
              <Typography sx={{ fontSize: '16px', color: '#717171' }}>
                {typeInfo.capacity} guests · {typeInfo.bedSize} bed · Private bathroom
              </Typography>
              <Typography sx={{ fontSize: '14px', color: '#717171', mt: 1 }}>
                Room will be assigned at check-in based on availability
              </Typography>
            </Box>

            {/* Amenities */}
            <Box sx={{ borderBottom: '1px solid #EBEBEB', pb: 3, mb: 3 }}>
              <Typography sx={{ fontSize: '22px', fontWeight: 600, color: '#222222', mb: 2 }}>
                What this room offers
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                {AMENITIES.map((amenity, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <amenity.icon sx={{ fontSize: 24, color: '#222222' }} />
                    <Typography sx={{ fontSize: '16px', color: '#222222' }}>{amenity.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Extra Services */}
            <Box sx={{ pb: 3 }}>
              <Typography sx={{ fontSize: '22px', fontWeight: 600, color: '#222222', mb: 2 }}>
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
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                          <Icon sx={{ fontSize: 24, color: '#222222' }} />
                          <Box>
                            <Typography sx={{ fontSize: '16px', color: '#222222' }}>{service.label}</Typography>
                            <Typography sx={{ fontSize: '14px', color: '#717171' }}>
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

          {/* Right - Booking Card */}
          <Box sx={{ width: { xs: '100%', md: 400 }, flexShrink: 0 }}>
            <Box
              sx={{
                position: 'sticky',
                top: 100,
                border: '1px solid #DDDDDD',
                borderRadius: '12px',
                p: 3,
                boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 3 }}>
                <Typography sx={{ fontSize: '22px', fontWeight: 600, color: '#222222' }}>
                  £{typeInfo.price}
                </Typography>
                <Typography sx={{ fontSize: '16px', color: '#717171' }}>night</Typography>
              </Box>

              {/* Date & Guest Inputs */}
              <Box sx={{ border: '1px solid #B0B0B0', borderRadius: '8px', mb: 2 }}>
                <Box sx={{ display: 'flex', borderBottom: '1px solid #B0B0B0' }}>
                  <Box sx={{ flex: 1, p: 1.5, borderRight: '1px solid #B0B0B0' }}>
                    <Typography sx={{ fontSize: '10px', fontWeight: 600, color: '#222222', textTransform: 'uppercase' }}>
                      Check-in
                    </Typography>
                    <TextField
                      type="date"
                      value={formData.checkIn}
                      onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                      variant="standard"
                      InputProps={{ disableUnderline: true }}
                      inputProps={{ min: new Date().toISOString().split('T')[0], style: { padding: 0 } }}
                      sx={{ '& input': { fontSize: '14px', color: '#222222' } }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, p: 1.5 }}>
                    <Typography sx={{ fontSize: '10px', fontWeight: 600, color: '#222222', textTransform: 'uppercase' }}>
                      Check-out
                    </Typography>
                    <TextField
                      type="date"
                      value={formData.checkOut}
                      onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                      variant="standard"
                      InputProps={{ disableUnderline: true }}
                      inputProps={{ min: formData.checkIn || new Date().toISOString().split('T')[0], style: { padding: 0 } }}
                      sx={{ '& input': { fontSize: '14px', color: '#222222' } }}
                    />
                  </Box>
                </Box>
                <Box sx={{ p: 1.5 }}>
                  <Typography sx={{ fontSize: '10px', fontWeight: 600, color: '#222222', textTransform: 'uppercase' }}>
                    Guests
                  </Typography>
                  <TextField
                    type="number"
                    value={formData.guests}
                    onChange={(e) => setFormData({ ...formData, guests: Math.min(parseInt(e.target.value) || 1, typeInfo.capacity) })}
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                    inputProps={{ min: 1, max: typeInfo.capacity, style: { padding: 0 } }}
                    sx={{ '& input': { fontSize: '14px', color: '#222222' } }}
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
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />

              {/* Book Button */}
              <Button
                variant="contained"
                fullWidth
                onClick={handleBooking}
                disabled={booking || !formData.checkIn || !formData.checkOut}
                sx={{
                  bgcolor: '#FF385C',
                  borderRadius: '8px',
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '16px',
                  '&:hover': { bgcolor: '#E31C5F' },
                }}
              >
                {booking ? <CircularProgress size={24} sx={{ color: '#FFFFFF' }} /> : 'Book'}
              </Button>

              {!isAuthenticated && (
                <Typography sx={{ fontSize: '12px', color: '#717171', textAlign: 'center', mt: 1 }}>
                  You'll need to log in to complete your booking
                </Typography>
              )}

              {/* Price Breakdown */}
              {priceBreakdown.nights > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontSize: '16px', color: '#222222', textDecoration: 'underline' }}>
                      £{typeInfo.price} x {priceBreakdown.nights} night{priceBreakdown.nights !== 1 ? 's' : ''}
                    </Typography>
                    <Typography sx={{ fontSize: '16px', color: '#222222' }}>£{priceBreakdown.roomTotal}</Typography>
                  </Box>
                  {priceBreakdown.servicesTotal > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontSize: '16px', color: '#222222', textDecoration: 'underline' }}>
                        Extra services
                      </Typography>
                      <Typography sx={{ fontSize: '16px', color: '#222222' }}>£{priceBreakdown.servicesTotal}</Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#222222' }}>Total</Typography>
                    <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#222222' }}>£{priceBreakdown.total}</Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default RoomDetails;
