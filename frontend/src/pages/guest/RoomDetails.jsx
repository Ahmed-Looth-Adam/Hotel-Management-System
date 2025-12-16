/**
 * Room Details Page - View room details and make booking
 *
 * Features:
 * - Room information display
 * - Booking form
 * - Price calculation
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Hotel,
  Person,
  KingBed,
  CalendarMonth,
  Wifi,
  Tv,
  AcUnit,
  LocalBar,
  Bathtub,
  ArrowBack,
  CheckCircle,
} from '@mui/icons-material';
import { roomService, bookingService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';

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
    guests: parseInt(searchParams.get('guests')) || 1,
    specialRequests: '',
  });
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    fetchRoom();
  }, [id]);

  useEffect(() => {
    calculatePrice();
  }, [formData.checkIn, formData.checkOut, room]);

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
      setTotalPrice(0);
      return;
    }

    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    if (nights > 0) {
      // Use base pricing based on room type
      const basePrices = {
        standard: 100,
        superior: 140,
        deluxe: 180,
        suite: 320,
        family: 250,
      };
      const pricePerNight = basePrices[room.room_type_category] || 100;
      setTotalPrice(pricePerNight * nights);
    } else {
      setTotalPrice(0);
    }
  };

  const handleBooking = async () => {
    if (!formData.checkIn || !formData.checkOut) {
      showError('Please select check-in and check-out dates');
      return;
    }

    if (new Date(formData.checkOut) <= new Date(formData.checkIn)) {
      showError('Check-out date must be after check-in date');
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
      total_price: totalPrice,
    });

    if (result.success) {
      showSuccess('Booking created successfully!');
      navigate('/guest/my-bookings');
    } else {
      showError(result.error?.message || 'Failed to create booking');
    }
    setBooking(false);
  };

  const getRoomTypeLabel = (type) => {
    const labels = {
      standard: 'Standard',
      superior: 'Superior',
      deluxe: 'Deluxe',
      suite: 'Suite',
      family: 'Family',
    };
    return labels[type] || type;
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/guest/rooms')}
        sx={{ mb: 2 }}
      >
        Back to Rooms
      </Button>

      <Grid container spacing={4}>
        {/* Room Information */}
        <Grid item xs={12} md={7}>
          <Paper elevation={2} sx={{ p: 3 }}>
            {/* Room Image Placeholder */}
            <Box
              sx={{
                height: 300,
                bgcolor: 'grey.200',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
              }}
            >
              <Hotel sx={{ fontSize: 100, color: 'grey.400' }} />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
              <Box>
                <Typography variant="h4" component="h1">
                  Room {room.room_number}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  {room.hotel_name || room.hotel?.name}
                </Typography>
              </Box>
              <Chip
                label={getRoomTypeLabel(room.room_type_category)}
                color="primary"
                size="medium"
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Room Details */}
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Person color="primary" />
                  <Typography variant="body2" color="text.secondary">Max Guests</Typography>
                  <Typography variant="h6">{room.max_occupancy}</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <KingBed color="primary" />
                  <Typography variant="body2" color="text.secondary">Bed Size</Typography>
                  <Typography variant="h6">{room.bed_size}</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">Beds</Typography>
                  <Typography variant="h6">{room.bed_count}</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">Floor</Typography>
                  <Typography variant="h6">{room.floor}</Typography>
                </Box>
              </Grid>
            </Grid>

            {room.view_name && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">View</Typography>
                <Typography>{room.view_name}</Typography>
              </Box>
            )}

            {/* Amenities */}
            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Amenities
            </Typography>
            <Grid container spacing={1}>
              {[
                { icon: <Wifi />, label: 'Free WiFi' },
                { icon: <Tv />, label: 'TV' },
                { icon: <AcUnit />, label: 'Air Conditioning' },
                { icon: <LocalBar />, label: 'Mini Bar' },
                { icon: <Bathtub />, label: 'Private Bathroom' },
              ].map((amenity, index) => (
                <Grid item xs={6} sm={4} key={index}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {amenity.icon}
                    <Typography variant="body2">{amenity.label}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Booking Form */}
        <Grid item xs={12} md={5}>
          <Paper elevation={3} sx={{ p: 3, position: 'sticky', top: 100 }}>
            <Typography variant="h5" gutterBottom>
              Book This Room
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
              <TextField
                label="Check-in Date"
                type="date"
                value={formData.checkIn}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                inputProps={{ min: new Date().toISOString().split('T')[0] }}
              />
              <TextField
                label="Check-out Date"
                type="date"
                value={formData.checkOut}
                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                inputProps={{ min: formData.checkIn || new Date().toISOString().split('T')[0] }}
              />
              <TextField
                label="Number of Guests"
                type="number"
                value={formData.guests}
                onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) || 1 })}
                inputProps={{ min: 1, max: room.max_occupancy }}
                fullWidth
              />
              <TextField
                label="Special Requests"
                multiline
                rows={3}
                value={formData.specialRequests}
                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                placeholder="Any special requests or requirements..."
                fullWidth
              />

              <Divider />

              {totalPrice > 0 && (
                <Box sx={{ bgcolor: 'primary.light', p: 2, borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Total Price</Typography>
                    <Typography variant="h5" fontWeight="bold">
                      ${totalPrice.toFixed(2)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {Math.ceil((new Date(formData.checkOut) - new Date(formData.checkIn)) / (1000 * 60 * 60 * 24))} night(s)
                  </Typography>
                </Box>
              )}

              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleBooking}
                disabled={booking || !formData.checkIn || !formData.checkOut}
                startIcon={booking ? <CircularProgress size={20} /> : <CheckCircle />}
              >
                {booking ? 'Processing...' : 'Confirm Booking'}
              </Button>

              {!user && (
                <Alert severity="info">
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
