/**
 * My Bookings Page - Guest view for their bookings
 *
 * Features:
 * - List of user's bookings
 * - Booking status display
 * - Cancel booking with fee information
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
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Paper,
  Tab,
  Tabs,
  Alert,
  Avatar,
  alpha,
  IconButton,
} from '@mui/material';
import {
  EventNote,
  Hotel as HotelIcon,
  Cancel,
  Visibility,
  CheckCircle,
  Schedule,
  CalendarToday,
  Person,
  MeetingRoom,
  Warning as WarningIcon,
  Close as CloseIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { bookingService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';

const statusConfig = {
  pending: { color: 'warning', icon: <Schedule />, label: 'Pending', bgColor: '#fff3e0' },
  confirmed: { color: 'info', icon: <CheckCircle />, label: 'Confirmed', bgColor: '#e3f2fd' },
  checked_in: { color: 'success', icon: <HotelIcon />, label: 'Checked In', bgColor: '#e8f5e9' },
  checked_out: { color: 'default', icon: <CheckCircle />, label: 'Completed', bgColor: '#f5f5f5' },
  cancelled: { color: 'error', icon: <Cancel />, label: 'Cancelled', bgColor: '#ffebee' },
  completed: { color: 'success', icon: <CheckCircle />, label: 'Completed', bgColor: '#e8f5e9' },
  no_show: { color: 'error', icon: <Cancel />, label: 'No Show', bgColor: '#ffebee' },
};

// Cancellation fees from CLAUDE.md
const getCancellationFee = (checkInDate, totalPrice) => {
  const now = new Date();
  const checkIn = new Date(checkInDate);
  const daysUntilCheckIn = Math.ceil((checkIn - now) / (1000 * 60 * 60 * 24));

  // Calculate first night price (estimate as 1/nights of total)
  // For simplicity, assume first night is same proportion
  const firstNightPrice = totalPrice / Math.max(1, Math.ceil((new Date(checkInDate) - now) / (1000 * 60 * 60 * 24)));

  if (daysUntilCheckIn > 14) {
    return { fee: 0, description: 'Free cancellation (more than 14 days notice)', type: 'free' };
  } else if (daysUntilCheckIn >= 3) {
    return { fee: totalPrice * 0.5, description: '50% of first night (3-14 days notice)', type: 'partial' };
  } else {
    return { fee: totalPrice, description: '100% of first night (less than 72 hours notice)', type: 'full' };
  }
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
      const data = Array.isArray(result.data) ? result.data : result.data?.results || [];
      setBookings(data);
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
      showError(result.error?.message || result.error?.detail || 'Failed to cancel booking');
    }
    setCancelling(false);
  };

  const getFilteredBookings = (tab) => {
    const now = new Date();
    switch (tab) {
      case 0: // Upcoming
        return bookings.filter(b =>
          ['pending', 'confirmed'].includes(b.status) &&
          new Date(b.check_in_date) >= now
        );
      case 1: // Current
        return bookings.filter(b => b.status === 'checked_in');
      case 2: // Past
        return bookings.filter(b =>
          ['checked_out', 'completed', 'cancelled', 'no_show'].includes(b.status) ||
          new Date(b.check_out_date) < now
        );
      default:
        return bookings;
    }
  };

  const filteredBookings = getFilteredBookings(tabValue);

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

  const cancellationInfo = cancelDialog.booking
    ? getCancellationFee(cancelDialog.booking.check_in_date, parseFloat(cancelDialog.booking.total_price || 0))
    : null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            <EventNote />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              My Bookings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your hotel reservations
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/guest/rooms')}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Book New Room
        </Button>
      </Box>

      {/* Tabs */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          indicatorColor="primary"
          textColor="primary"
          sx={{ px: 2 }}
        >
          <Tab label={`Upcoming (${getFilteredBookings(0).length})`} />
          <Tab label={`Current Stay (${getFilteredBookings(1).length})`} />
          <Tab label={`Past (${getFilteredBookings(2).length})`} />
        </Tabs>
      </Paper>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <EventNote sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No bookings found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {tabValue === 0 ? "You don't have any upcoming bookings" :
             tabValue === 1 ? "You're not currently checked in" :
             "No past bookings to show"}
          </Typography>
          {tabValue === 0 && (
            <Button
              variant="contained"
              onClick={() => navigate('/guest/rooms')}
              sx={{ borderRadius: 2, textTransform: 'none' }}
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
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          {booking.hotel_name || 'Hotel'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Ref: {booking.booking_reference}
                        </Typography>
                      </Box>
                      <Chip
                        icon={status.icon}
                        label={status.label}
                        size="small"
                        sx={{
                          bgcolor: status.bgColor,
                          color: `${status.color}.main`,
                          fontWeight: 600,
                          '& .MuiChip-icon': { color: 'inherit' },
                        }}
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarToday sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Check-in</Typography>
                            <Typography variant="body2" fontWeight={500}>{formatDate(booking.check_in_date)}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarToday sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Check-out</Typography>
                            <Typography variant="body2" fontWeight={500}>{formatDate(booking.check_out_date)}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MeetingRoom sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Room</Typography>
                            <Typography variant="body2" fontWeight={500}>{booking.room_number}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Guests</Typography>
                            <Typography variant="body2" fontWeight={500}>{booking.guests_count}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>

                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        bgcolor: alpha('#1976d2', 0.05),
                        borderRadius: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {nights} night{nights > 1 ? 's' : ''}
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="primary.main">
                        £{parseFloat(booking.total_price || 0).toFixed(2)}
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      View Details
                    </Button>
                    {['pending', 'confirmed'].includes(booking.status) && (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={() => setCancelDialog({ open: true, booking })}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
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

      {/* Cancel Dialog with Fee Info */}
      <Dialog
        open={cancelDialog.open}
        onClose={() => setCancelDialog({ open: false, booking: null })}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(180deg, #d32f2f 0%, #b71c1c 100%)',
            color: '#ffffff',
            px: 3,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
              <WarningIcon />
            </Avatar>
            <Typography variant="h6" fontWeight={600}>
              Cancel Booking
            </Typography>
          </Box>
          <IconButton
            onClick={() => setCancelDialog({ open: false, booking: null })}
            sx={{ color: '#ffffff' }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          {cancellationInfo && (
            <Alert
              severity={cancellationInfo.type === 'free' ? 'success' : cancellationInfo.type === 'partial' ? 'warning' : 'error'}
              sx={{ mb: 3, borderRadius: 2 }}
            >
              <Typography variant="subtitle2" fontWeight={600}>
                Cancellation Fee: {cancellationInfo.type === 'free' ? 'None' : `£${cancellationInfo.fee.toFixed(2)}`}
              </Typography>
              <Typography variant="body2">
                {cancellationInfo.description}
              </Typography>
            </Alert>
          )}

          {cancelDialog.booking && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Booking Details
              </Typography>
              <Typography variant="body2">
                <strong>Hotel:</strong> {cancelDialog.booking.hotel_name}
              </Typography>
              <Typography variant="body2">
                <strong>Room:</strong> {cancelDialog.booking.room_number}
              </Typography>
              <Typography variant="body2">
                <strong>Check-in:</strong> {formatDate(cancelDialog.booking.check_in_date)}
              </Typography>
              <Typography variant="body2">
                <strong>Total:</strong> £{parseFloat(cancelDialog.booking.total_price || 0).toFixed(2)}
              </Typography>
            </Box>
          )}

          <Typography variant="body1" gutterBottom>
            Are you sure you want to cancel this booking?
          </Typography>

          <TextField
            fullWidth
            label="Reason for cancellation (optional)"
            multiline
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            sx={{ mt: 2 }}
            InputProps={{ sx: { borderRadius: 2 } }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            onClick={() => setCancelDialog({ open: false, booking: null })}
            sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
          >
            Keep Booking
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelBooking}
            disabled={cancelling}
            sx={{ borderRadius: 2, textTransform: 'none', px: 3, fontWeight: 600 }}
          >
            {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyBookings;
