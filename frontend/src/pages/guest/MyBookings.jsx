/**
 * My Bookings Page - Guest view for their bookings
 *
 * Features:
 * - List of user's bookings
 * - Booking status display
 * - Cancel booking option
 * - View booking details
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
  Paper,
  Tab,
  Tabs,
} from '@mui/material';
import {
  EventNote,
  CalendarMonth,
  Hotel,
  Person,
  Cancel,
  Visibility,
  CheckCircle,
  Schedule,
  Error,
} from '@mui/icons-material';
import { bookingService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';

const statusConfig = {
  pending: { color: 'warning', icon: <Schedule />, label: 'Pending' },
  confirmed: { color: 'info', icon: <CheckCircle />, label: 'Confirmed' },
  checked_in: { color: 'success', icon: <Hotel />, label: 'Checked In' },
  checked_out: { color: 'default', icon: <CheckCircle />, label: 'Completed' },
  cancelled: { color: 'error', icon: <Cancel />, label: 'Cancelled' },
  completed: { color: 'success', icon: <CheckCircle />, label: 'Completed' },
};

const MyBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [cancelDialog, setCancelDialog] = useState({ open: false, booking: null });
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const result = await bookingService.getMyBookings();
    if (result.success) {
      setBookings(result.data.results || result.data);
    } else {
      showError('Failed to load your bookings');
    }
    setLoading(false);
  };

  const handleCancelBooking = async () => {
    if (!cancelDialog.booking) return;

    setCancelling(true);
    const result = await bookingService.cancel(cancelDialog.booking.id, { reason: cancelReason });
    if (result.success) {
      showSuccess('Booking cancelled successfully');
      fetchBookings();
      setCancelDialog({ open: false, booking: null });
      setCancelReason('');
    } else {
      showError(result.error?.message || 'Failed to cancel booking');
    }
    setCancelling(false);
  };

  const filterBookings = () => {
    const now = new Date();
    switch (tabValue) {
      case 0: // Upcoming
        return bookings.filter(b =>
          ['pending', 'confirmed'].includes(b.status) &&
          new Date(b.check_in_date) >= now
        );
      case 1: // Current
        return bookings.filter(b => b.status === 'checked_in');
      case 2: // Past
        return bookings.filter(b =>
          ['checked_out', 'completed', 'cancelled'].includes(b.status) ||
          new Date(b.check_out_date) < now
        );
      default:
        return bookings;
    }
  };

  const filteredBookings = filterBookings();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const calculateNights = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventNote color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            My Bookings
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => navigate('/guest/rooms')}
        >
          Book New Room
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label={`Upcoming (${filterBookings().length})`} />
          <Tab label="Current Stay" />
          <Tab label="Past Bookings" />
        </Tabs>
      </Paper>

      {filteredBookings.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <EventNote sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No bookings found
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {tabValue === 0 ? "You don't have any upcoming bookings" :
             tabValue === 1 ? "You're not currently checked in" :
             "No past bookings to show"}
          </Typography>
          {tabValue === 0 && (
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => navigate('/guest/rooms')}
            >
              Browse Rooms
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredBookings.map((booking) => {
            const status = statusConfig[booking.status] || statusConfig.pending;
            const nights = calculateNights(booking.check_in_date, booking.check_out_date);

            return (
              <Grid item xs={12} md={6} key={booking.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6">
                          {booking.hotel_name || 'Hotel'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Booking Ref: {booking.booking_reference}
                        </Typography>
                      </Box>
                      <Chip
                        icon={status.icon}
                        label={status.label}
                        color={status.color}
                        size="small"
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Check-in</Typography>
                        <Typography variant="body1">{formatDate(booking.check_in_date)}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Check-out</Typography>
                        <Typography variant="body1">{formatDate(booking.check_out_date)}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Room</Typography>
                        <Typography variant="body1">{booking.room_number}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Guests</Typography>
                        <Typography variant="body1">{booking.guests_count}</Typography>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">
                          {nights} night{nights > 1 ? 's' : ''}
                        </Typography>
                        <Typography variant="h6">
                          ${parseFloat(booking.total_price || 0).toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                    >
                      View Details
                    </Button>
                    {['pending', 'confirmed'].includes(booking.status) && (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={() => setCancelDialog({ open: true, booking })}
                      >
                        Cancel
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog.open} onClose={() => setCancelDialog({ open: false, booking: null })}>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to cancel this booking? Cancellation fees may apply based on the hotel's policy.
          </DialogContentText>
          <TextField
            fullWidth
            label="Reason for cancellation (optional)"
            multiline
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog({ open: false, booking: null })}>
            Keep Booking
          </Button>
          <Button
            color="error"
            onClick={handleCancelBooking}
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling...' : 'Cancel Booking'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyBookings;
