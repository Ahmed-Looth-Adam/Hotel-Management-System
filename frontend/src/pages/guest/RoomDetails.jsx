/**
 * Room Details Page - View room details and make booking
 *
 * Features:
 * - Room information display with images
 * - Booking form with date selection
 * - Price calculation based on room type
 * - Ancillary services selection
 * - Amenities display
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  TextField,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  FormGroup,
  alpha,
  CardMedia,
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
  ArrowBack,
  CheckCircle,
  FlightTakeoff,
  Restaurant,
  Spa,
  Schedule,
  Visibility,
  Layers,
} from '@mui/icons-material';
import { roomService, bookingService, hotelService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';

// Room types and base prices from CLAUDE.md
const ROOM_TYPES = {
  standard: { label: 'Standard Double', price: 120, color: '#607d8b' },
  deluxe: { label: 'Deluxe King', price: 180, color: '#1976d2' },
  suite: { label: 'Family Suite', price: 240, color: '#7b1fa2' },
  penthouse: { label: 'Penthouse', price: 500, color: '#c62828' },
};

// Ancillary services from CLAUDE.md
const ANCILLARY_SERVICES = [
  { id: 'airport_transfer', label: 'Airport Transfer (One-way)', price: 50, icon: FlightTakeoff, perPerson: false },
  { id: 'breakfast', label: 'Full English Breakfast', price: 20, icon: Restaurant, perPerson: true },
  { id: 'spa', label: 'Spa Access', price: 35, icon: Spa, perPerson: true },
  { id: 'late_checkout', label: 'Late Check-out (until 2 PM)', price: 40, icon: Schedule, perPerson: false },
];

const RoomDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [formData, setFormData] = useState({
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: parseInt(searchParams.get('guests')) || 2,
    specialRequests: '',
  });
  const [selectedServices, setSelectedServices] = useState([]);
  const [priceBreakdown, setPriceBreakdown] = useState({
    roomTotal: 0,
    servicesTotal: 0,
    total: 0,
    nights: 0,
  });

  useEffect(() => {
    fetchRoom();
  }, [id]);

  useEffect(() => {
    calculatePrice();
  }, [formData.checkIn, formData.checkOut, formData.guests, room, selectedServices]);

  const fetchRoom = async () => {
    setLoading(true);
    const result = await roomService.getById(id);
    if (result.success) {
      setRoom(result.data);
    } else {
      showError('Failed to load room details');
      navigate('/guest/rooms');
    }
    setLoading(false);
  };

  const calculatePrice = () => {
    if (!room || !formData.checkIn || !formData.checkOut) {
      setPriceBreakdown({ roomTotal: 0, servicesTotal: 0, total: 0, nights: 0 });
      return;
    }

    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    if (nights > 0) {
      const roomType = ROOM_TYPES[room.room_type_category] || ROOM_TYPES.standard;
      const roomTotal = roomType.price * nights;

      // Calculate services total
      let servicesTotal = 0;
      selectedServices.forEach((serviceId) => {
        const service = ANCILLARY_SERVICES.find((s) => s.id === serviceId);
        if (service) {
          if (service.perPerson) {
            // Per person per day
            servicesTotal += service.price * formData.guests * nights;
          } else {
            // Flat fee
            servicesTotal += service.price;
          }
        }
      });

      setPriceBreakdown({
        roomTotal,
        servicesTotal,
        total: roomTotal + servicesTotal,
        nights,
      });
    } else {
      setPriceBreakdown({ roomTotal: 0, servicesTotal: 0, total: 0, nights: 0 });
    }
  };

  const handleServiceToggle = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleBooking = async () => {
    if (!user) {
      showError('Please log in to complete your booking');
      navigate('/login');
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

    if (formData.guests > room.max_occupancy) {
      showError(`Maximum ${room.max_occupancy} guests allowed for this room`);
      return;
    }

    setBooking(true);
    const result = await bookingService.create({
      room: room.id,
      hotel: room.hotel,
      check_in_date: formData.checkIn,
      check_out_date: formData.checkOut,
      guests_count: formData.guests,
      special_requests: formData.specialRequests,
      total_price: priceBreakdown.total,
      ancillary_services: selectedServices,
    });

    if (result.success) {
      showSuccess('Booking created successfully!');
      navigate('/guest/my-bookings');
    } else {
      showError(result.error?.message || result.error?.detail || 'Failed to create booking');
    }
    setBooking(false);
  };

  const getRoomImage = () => {
    if (room?.galleries && room.galleries.length > 0) {
      const gallery = room.galleries[0];
      if (gallery.images && gallery.images.length > 0) {
        return `http://localhost:8000${gallery.images[0].image}`;
      }
    }
    return null;
  };

  const getRoomTypeInfo = () => {
    return ROOM_TYPES[room?.room_type_category] || ROOM_TYPES.standard;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!room) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">Room not found</Alert>
      </Container>
    );
  }

  const roomTypeInfo = getRoomTypeInfo();
  const imageUrl = getRoomImage();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/guest/rooms')}
        sx={{ mb: 3, textTransform: 'none' }}
      >
        Back to Rooms
      </Button>

      <Grid container spacing={4}>
        {/* Room Information */}
        <Grid item xs={12} md={7}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {/* Room Image */}
            {imageUrl ? (
              <CardMedia
                component="img"
                height="350"
                image={imageUrl}
                alt={`Room ${room.room_number}`}
                sx={{ objectFit: 'cover' }}
              />
            ) : (
              <Box
                sx={{
                  height: 350,
                  bgcolor: alpha(roomTypeInfo.color, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HotelIcon sx={{ fontSize: 100, color: alpha(roomTypeInfo.color, 0.3) }} />
              </Box>
            )}

            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    Room {room.room_number}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    {room.hotel_name || room.hotel?.name}
                  </Typography>
                </Box>
                <Chip
                  label={roomTypeInfo.label}
                  sx={{
                    bgcolor: alpha(roomTypeInfo.color, 0.1),
                    color: roomTypeInfo.color,
                    fontWeight: 600,
                  }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Room Details */}
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Person sx={{ color: 'primary.main', mb: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      Max Guests
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {room.max_occupancy}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <KingBed sx={{ color: 'primary.main', mb: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      Bed
                    </Typography>
                    <Typography variant="h6" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                      {room.bed_size}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Layers sx={{ color: 'primary.main', mb: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      Floor
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {room.floor}
                    </Typography>
                  </Box>
                </Grid>
                {room.view_name && (
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Visibility sx={{ color: 'primary.main', mb: 0.5 }} />
                      <Typography variant="body2" color="text.secondary">
                        View
                      </Typography>
                      <Typography variant="h6" fontWeight={600} noWrap>
                        {room.view_name}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>

              {/* Amenities */}
              <Typography variant="h6" fontWeight={600} sx={{ mt: 3, mb: 2 }}>
                Room Amenities
              </Typography>
              <Grid container spacing={1}>
                {[
                  { icon: <Wifi />, label: 'Free WiFi' },
                  { icon: <Tv />, label: 'Smart TV' },
                  { icon: <AcUnit />, label: 'Air Conditioning' },
                  { icon: <LocalBar />, label: 'Mini Bar' },
                  { icon: <Bathtub />, label: 'Private Bathroom' },
                ].map((amenity, index) => (
                  <Grid item xs={6} sm={4} key={index}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                      <Box sx={{ color: 'success.main' }}>{amenity.icon}</Box>
                      <Typography variant="body2">{amenity.label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Booking Form */}
        <Grid item xs={12} md={5}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              position: 'sticky',
              top: 100,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 3 }}>
              <Typography variant="h4" fontWeight={700}>
                £{roomTypeInfo.price}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                / night
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Check-in Date"
                type="date"
                value={formData.checkIn}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
                inputProps={{ min: new Date().toISOString().split('T')[0] }}
                InputProps={{ sx: { borderRadius: 2 } }}
              />
              <TextField
                label="Check-out Date"
                type="date"
                value={formData.checkOut}
                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
                inputProps={{ min: formData.checkIn || new Date().toISOString().split('T')[0] }}
                InputProps={{ sx: { borderRadius: 2 } }}
              />
              <TextField
                label="Number of Guests"
                type="number"
                value={formData.guests}
                onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) || 1 })}
                inputProps={{ min: 1, max: room.max_occupancy }}
                fullWidth
                size="small"
                helperText={`Maximum ${room.max_occupancy} guests`}
                InputProps={{ sx: { borderRadius: 2 } }}
              />

              {/* Ancillary Services */}
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Add Extra Services
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
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Icon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {service.label}
                            </Typography>
                            <Typography variant="body2" color="primary.main" fontWeight={600}>
                              £{service.price}{service.perPerson ? '/person/day' : ''}
                            </Typography>
                          </Box>
                        }
                        sx={{ ml: 0, mb: 0.5 }}
                      />
                    );
                  })}
                </FormGroup>
              </Box>

              <TextField
                label="Special Requests"
                multiline
                rows={2}
                value={formData.specialRequests}
                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                placeholder="Any special requests..."
                fullWidth
                size="small"
                InputProps={{ sx: { borderRadius: 2 } }}
              />

              <Divider />

              {/* Price Breakdown */}
              {priceBreakdown.nights > 0 && (
                <Box sx={{ bgcolor: alpha('#1976d2', 0.05), p: 2, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      £{roomTypeInfo.price} x {priceBreakdown.nights} night{priceBreakdown.nights !== 1 ? 's' : ''}
                    </Typography>
                    <Typography variant="body2">£{priceBreakdown.roomTotal}</Typography>
                  </Box>
                  {priceBreakdown.servicesTotal > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Extra services
                      </Typography>
                      <Typography variant="body2">£{priceBreakdown.servicesTotal}</Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography fontWeight={600}>Total</Typography>
                    <Typography variant="h5" fontWeight={700} color="primary.main">
                      £{priceBreakdown.total}
                    </Typography>
                  </Box>
                </Box>
              )}

              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleBooking}
                disabled={booking || !formData.checkIn || !formData.checkOut}
                startIcon={booking ? <CircularProgress size={20} /> : <CheckCircle />}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {booking ? 'Processing...' : 'Book Now'}
              </Button>

              {!user && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Please log in to complete your booking
                </Alert>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default RoomDetails;
