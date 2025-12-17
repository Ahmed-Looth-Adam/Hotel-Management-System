import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  ArrowBack,
  Person,
  Hotel,
  CalendarMonth,
  Payment,
  Login,
  Logout,
  Cancel,
} from '@mui/icons-material';
import { bookingService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import LoadingSpinner from '../../components/loading/LoadingSpinner';

const statusColors = {
  pending: 'warning',
  confirmed: 'info',
  checked_in: 'success',
  checked_out: 'default',
  cancelled: 'error',
};

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkInDialog, setCheckInDialog] = useState(false);
  const [checkOutDialog, setCheckOutDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [roomCondition, setRoomCondition] = useState('');

  const fetchBooking = async () => {
    setLoading(true);
    const result = await bookingService.getById(id);
    if (result.success) {
      setBooking(result.data);
    } else {
      showError('Failed to fetch booking details');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const handleCheckIn = async () => {
    const result = await bookingService.checkIn(id, { notes });
    if (result.success) {
      showSuccess('Guest checked in successfully');
      setCheckInDialog(false);
      setNotes('');
      fetchBooking();
    } else {
      showError(result.error?.message || 'Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    const result = await bookingService.checkOut(id, {
      notes,
      additional_charges: additionalCharges,
      room_condition: roomCondition,
    });
    if (result.success) {
      showSuccess('Guest checked out successfully');
      setCheckOutDialog(false);
      setNotes('');
      setAdditionalCharges(0);
      setRoomCondition('');
      fetchBooking();
    } else {
      showError(result.error?.message || 'Failed to check out');
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      const result = await bookingService.cancel(id, { reason: 'Cancelled by staff' });
      if (result.success) {
        showSuccess('Booking cancelled successfully');
        fetchBooking();
      } else {
        showError(result.error?.message || 'Failed to cancel booking');
      }
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading booking details..." />;
  }

  if (!booking) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Booking not found</Typography>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/bookings')}>
          Back to Bookings
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/bookings')}>
          Back to Bookings
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {booking.status === 'confirmed' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<Login />}
              onClick={() => setCheckInDialog(true)}
            >
              Check In
            </Button>
          )}
          {booking.status === 'checked_in' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Logout />}
              onClick={() => setCheckOutDialog(true)}
            >
              Check Out
            </Button>
          )}
          {['pending', 'confirmed'].includes(booking.status) && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              onClick={handleCancel}
            >
              Cancel
            </Button>
          )}
        </Box>
      </Box>

      <Paper sx={{ p: 4, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Booking #{booking.booking_reference}
            </Typography>
            <Typography color="text.secondary">
              Created on {new Date(booking.created_at).toLocaleDateString()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={booking.status?.replace('_', ' ')}
              color={statusColors[booking.status] || 'default'}
            />
            <Chip
              label={booking.payment_status}
              variant="outlined"
              color={booking.payment_status === 'paid' ? 'success' : 'warning'}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person /> Guest Information
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Name" secondary={booking.user_name} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Email" secondary={booking.user_email} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Guests" secondary={`${booking.guests_count} guest(s)`} />
              </ListItem>
            </List>

            {booking.booking_guests && booking.booking_guests.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>Additional Guests</Typography>
                <List dense>
                  {booking.booking_guests.map((guest) => (
                    <ListItem key={guest.id}>
                      <ListItemText
                        primary={guest.full_name}
                        secondary={`${guest.guest_type} - ${guest.email || 'No email'}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Hotel /> Room Information
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Hotel" secondary={booking.hotel_name} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Room" secondary={`Room ${booking.room_number}`} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Room Type" secondary={booking.room_type} />
              </ListItem>
              {booking.room_view && (
                <ListItem>
                  <ListItemText primary="View" secondary={booking.room_view} />
                </ListItem>
              )}
            </List>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarMonth /> Stay Details
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Check-in Date" secondary={booking.check_in_date} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Check-out Date" secondary={booking.check_out_date} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Number of Nights" secondary={booking.number_of_nights} />
              </ListItem>
              {booking.checked_in_at && (
                <ListItem>
                  <ListItemText
                    primary="Checked In"
                    secondary={`${new Date(booking.checked_in_at).toLocaleString()} by ${booking.checked_in_by_name}`}
                  />
                </ListItem>
              )}
              {booking.checked_out_at && (
                <ListItem>
                  <ListItemText
                    primary="Checked Out"
                    secondary={`${new Date(booking.checked_out_at).toLocaleString()} by ${booking.checked_out_by_name}`}
                  />
                </ListItem>
              )}
            </List>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Payment /> Payment Details
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Total Price" secondary={`£${parseFloat(booking.total_price || 0).toFixed(2)}`} />
              </ListItem>
              {booking.additional_charges > 0 && (
                <ListItem>
                  <ListItemText primary="Additional Charges" secondary={`£${parseFloat(booking.additional_charges).toFixed(2)}`} />
                </ListItem>
              )}
              <ListItem>
                <ListItemText primary="Payment Method" secondary={booking.payment_method || 'Not specified'} />
              </ListItem>
              {booking.promo_code && (
                <ListItem>
                  <ListItemText primary="Promo Code" secondary={booking.promo_code} />
                </ListItem>
              )}
            </List>
          </Grid>
        </Grid>

        {booking.special_requests && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>Special Requests</Typography>
            <Typography>{booking.special_requests}</Typography>
          </>
        )}
      </Paper>

      {/* Check-in Dialog */}
      <Dialog open={checkInDialog} onClose={() => setCheckInDialog(false)}>
        <DialogTitle>Check In Guest</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckInDialog(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleCheckIn}>
            Confirm Check In
          </Button>
        </DialogActions>
      </Dialog>

      {/* Check-out Dialog */}
      <Dialog open={checkOutDialog} onClose={() => setCheckOutDialog(false)}>
        <DialogTitle>Check Out Guest</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="number"
            label="Additional Charges"
            value={additionalCharges}
            onChange={(e) => setAdditionalCharges(parseFloat(e.target.value) || 0)}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Room Condition"
            value={roomCondition}
            onChange={(e) => setRoomCondition(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckOutDialog(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleCheckOut}>
            Confirm Check Out
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BookingDetail;
