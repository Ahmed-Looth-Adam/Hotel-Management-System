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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Badge as BadgeIcon,
} from '@mui/icons-material';
import { bookingService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import LoadingSpinner from '../../components/loading/LoadingSpinner';
import CheckInModal from '../../components/bookings/CheckInModal';

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
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
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

  const handleCheckInSuccess = (data) => {
    showSuccess(`Guest checked in successfully to Room ${data.room_number}`);
    fetchBooking();
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
              color="primary"
              startIcon={<Login />}
              onClick={() => setCheckInModalOpen(true)}
              sx={{
                '&:hover': {
                  backgroundColor: '#5a67d8',
                },
              }}
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
              sx={{
                '&:hover': {
                  backgroundColor: '#5a67d8',
                },
              }}
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
                <ListItemText
                  primary="Room"
                  secondary={
                    booking.room_number ? (
                      `Room ${booking.room_number}`
                    ) : (
                      <Chip
                        label="To be assigned"
                        size="small"
                        color="warning"
                        variant="outlined"
                        sx={{ mt: 0.5 }}
                      />
                    )
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Room Type"
                  secondary={booking.room_type || booking.room_type_requested || 'Standard'}
                />
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
                <ListItemText
                  primary="Total"
                  secondary={`£${(
                    parseFloat(booking.total_price || 0) +
                    parseFloat(booking.additional_charges || 0) +
                    (booking.service_charges?.reduce((sum, s) => sum + parseFloat(s.total_price || 0), 0) || 0)
                  ).toFixed(2)}`}
                  secondaryTypographyProps={{ fontWeight: 600, color: 'primary.main' }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Room Charge"
                  secondary={`£${parseFloat(booking.total_price || 0).toFixed(2)} (${booking.number_of_nights} night${booking.number_of_nights > 1 ? 's' : ''})`}
                />
              </ListItem>
              {/* Service Charges / Ancillary Services */}
              {booking.service_charges && booking.service_charges.map((service, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={service.service_name}
                    secondary={`£${parseFloat(service.total_price || 0).toFixed(2)}${service.quantity > 1 ? ` (Qty: ${service.quantity})` : ''}`}
                  />
                </ListItem>
              ))}
              {/* Additional Charges (added at checkout) */}
              {booking.additional_charges > 0 && (
                <ListItem>
                  <ListItemText
                    primary="Additional Charges"
                    secondary={`£${parseFloat(booking.additional_charges).toFixed(2)}`}
                  />
                </ListItem>
              )}
              {/* Promo Code */}
              {booking.promo_code && (
                <ListItem>
                  <ListItemText
                    primary="Promo Code"
                    secondary={booking.promo_code}
                  />
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

        {/* Check-in Records Section */}
        {booking.check_in_records && booking.check_in_records.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BadgeIcon /> Verified Guest Details
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Guest Type</TableCell>
                    <TableCell>Full Name</TableCell>
                    <TableCell>Date of Birth</TableCell>
                    <TableCell>Nationality</TableCell>
                    <TableCell>ID Type</TableCell>
                    <TableCell>ID Number</TableCell>
                    <TableCell>Address</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {booking.check_in_records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Chip
                          label={record.guest_type === 'primary' ? 'Primary' : 'Additional'}
                          size="small"
                          color={record.guest_type === 'primary' ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{record.full_name}</TableCell>
                      <TableCell>{record.date_of_birth}</TableCell>
                      <TableCell>{record.nationality}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>
                        {record.id_type?.replace('_', ' ')}
                      </TableCell>
                      <TableCell>{record.id_number}</TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {record.address}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {booking.check_in_records[0]?.verified_by_name && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Verified by {booking.check_in_records[0].verified_by_name} on{' '}
                {new Date(booking.check_in_records[0].verified_at).toLocaleString()}
              </Typography>
            )}
          </>
        )}
      </Paper>

      {/* Check-in Modal */}
      <CheckInModal
        open={checkInModalOpen}
        onClose={() => setCheckInModalOpen(false)}
        booking={booking}
        onSuccess={handleCheckInSuccess}
      />

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
