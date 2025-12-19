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
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Avatar,
  CircularProgress,
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
  PersonOff,
  Close as CloseIcon,
  AttachMoney as MoneyIcon,
  Notes as NotesIcon,
  RoomService as ServicesIcon,
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
  no_show: 'error',
};

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [checkOutDialog, setCheckOutDialog] = useState(false);
  const [noShowDialog, setNoShowDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [noShowNotes, setNoShowNotes] = useState('');
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [roomCondition, setRoomCondition] = useState('');
  const [checkOutLoading, setCheckOutLoading] = useState(false);
  const [noShowLoading, setNoShowLoading] = useState(false);

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
    setCheckOutLoading(true);
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
    setCheckOutLoading(false);
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

  const handleNoShow = async () => {
    setNoShowLoading(true);
    const result = await bookingService.markNoShow(id, { notes: noShowNotes });
    if (result.success) {
      showSuccess('Booking marked as no-show');
      setNoShowDialog(false);
      setNoShowNotes('');
      fetchBooking();
    } else {
      showError(result.error?.detail || result.error?.message || 'Failed to mark as no-show');
    }
    setNoShowLoading(false);
  };

  // Check if booking can be marked as no-show (on or after check-in date)
  const canMarkNoShow = () => {
    if (!booking || booking.status !== 'confirmed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(booking.check_in_date);
    checkInDate.setHours(0, 0, 0, 0);
    return today >= checkInDate;
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
          {canMarkNoShow() && (
            <Button
              variant="outlined"
              color="warning"
              startIcon={<PersonOff />}
              onClick={() => setNoShowDialog(true)}
            >
              No Show
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
              {/* Services Summary */}
              {booking.service_charges && booking.service_charges.length > 0 && (
                <ListItem>
                  <ListItemText
                    primary="Additional Services"
                    secondary={`£${booking.service_charges.reduce((sum, s) => sum + parseFloat(s.total_price || 0), 0).toFixed(2)} (${booking.service_charges.length} service${booking.service_charges.length > 1 ? 's' : ''})`}
                  />
                </ListItem>
              )}
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

        {/* Additional Services Section */}
        {booking.service_charges && booking.service_charges.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ServicesIcon /> Additional Services
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Quantity</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Unit Price</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {booking.service_charges.map((service, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {service.service_name}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={service.quantity || 1}
                          size="small"
                          sx={{ minWidth: 32, height: 24, fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          £{parseFloat(service.unit_price || 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600} color="primary.main">
                          £{parseFloat(service.total_price || 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total Row */}
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell colSpan={3} align="right">
                      <Typography variant="body2" fontWeight={600}>
                        Services Total
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700} color="primary.main">
                        £{booking.service_charges.reduce((sum, s) => sum + parseFloat(s.total_price || 0), 0).toFixed(2)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {/* Check-out Details Section - Only show for checked out bookings */}
        {booking.status === 'checked_out' && (booking.room_condition || booking.check_out_notes || booking.additional_charges > 0) && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Logout /> Check-out Details
            </Typography>
            <List dense>
              {booking.additional_charges > 0 && (
                <ListItem>
                  <ListItemText
                    primary="Additional Charges at Check-out"
                    secondary={`£${parseFloat(booking.additional_charges).toFixed(2)}`}
                    secondaryTypographyProps={{ fontWeight: 600, color: 'primary.main' }}
                  />
                </ListItem>
              )}
              {booking.room_condition && (
                <ListItem>
                  <ListItemText primary="Room Condition" secondary={booking.room_condition} />
                </ListItem>
              )}
              {booking.check_out_notes && (
                <ListItem>
                  <ListItemText primary="Check-out Notes" secondary={booking.check_out_notes} />
                </ListItem>
              )}
            </List>
          </>
        )}

        {/* No-Show Details Section - Only show for no-show bookings */}
        {booking.status === 'no_show' && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main' }}>
              <PersonOff /> No-Show Details
            </Typography>
            <List dense>
              {booking.no_show_at && (
                <ListItem>
                  <ListItemText
                    primary="Marked as No-Show"
                    secondary={`${new Date(booking.no_show_at).toLocaleString()}${booking.no_show_by_name ? ` by ${booking.no_show_by_name}` : ''}`}
                  />
                </ListItem>
              )}
              {booking.no_show_notes && (
                <ListItem>
                  <ListItemText primary="Notes" secondary={booking.no_show_notes} />
                </ListItem>
              )}
            </List>
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
      <Dialog
        open={checkOutDialog}
        onClose={() => setCheckOutDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(180deg, #1a1f37 0%, #0f1225 100%)',
            color: '#ffffff',
            px: 3,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                width: 36,
                height: 36,
              }}
            >
              <Logout fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#ffffff' }}>
                Guest Check-Out
              </Typography>
              {booking && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {booking.booking_reference} | Room {booking.room_number}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton onClick={() => setCheckOutDialog(false)} sx={{ color: '#ffffff' }} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 3, py: 2.5 }}>
          {/* Additional Charges Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
            <MoneyIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Additional Charges
            </Typography>
          </Box>
          <TextField
            fullWidth
            type="number"
            label="Amount (£)"
            value={additionalCharges}
            onChange={(e) => setAdditionalCharges(parseFloat(e.target.value) || 0)}
            size="small"
            InputProps={{ sx: { borderRadius: 2 } }}
            sx={{ mb: 3 }}
          />

          {/* Room Condition Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
            <Hotel sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Room Condition
            </Typography>
          </Box>
          <TextField
            fullWidth
            label="Condition"
            value={roomCondition}
            onChange={(e) => setRoomCondition(e.target.value)}
            placeholder="e.g., Good, Needs cleaning, Minor damage..."
            size="small"
            InputProps={{ sx: { borderRadius: 2 } }}
            sx={{ mb: 3 }}
          />

          {/* Notes Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
            <NotesIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Check-Out Notes
            </Typography>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any remarks or notes for this check-out..."
            size="small"
            InputProps={{ sx: { borderRadius: 2 } }}
          />
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 1.5,
            bgcolor: 'grey.50',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Button
            onClick={() => setCheckOutDialog(false)}
            disabled={checkOutLoading}
            color="inherit"
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCheckOut}
            disabled={checkOutLoading}
            sx={{
              borderRadius: 2,
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#000000',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              '&:hover': {
                bgcolor: '#1a1a1a',
              },
              '&.Mui-disabled': {
                bgcolor: 'grey.300',
                color: 'grey.500',
              },
            }}
          >
            {checkOutLoading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Complete Check-Out'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* No-Show Dialog */}
      <Dialog
        open={noShowDialog}
        onClose={() => setNoShowDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(180deg, #7c2d12 0%, #451a0a 100%)',
            color: '#ffffff',
            px: 3,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                width: 36,
                height: 36,
              }}
            >
              <PersonOff fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#ffffff' }}>
                Mark as No-Show
              </Typography>
              {booking && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {booking.booking_reference} | {booking.user_name}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton onClick={() => setNoShowDialog(false)} sx={{ color: '#ffffff' }} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Box
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              bgcolor: 'rgba(249, 115, 22, 0.08)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Are you sure you want to mark this booking as a <strong>no-show</strong>? This action indicates
              the guest did not arrive for their reservation on the scheduled check-in date.
            </Typography>
          </Box>

          {/* Notes Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
            <NotesIcon sx={{ fontSize: 16, color: 'warning.main' }} />
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              No-Show Notes
            </Typography>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (optional)"
            placeholder="Add any relevant notes about this no-show..."
            value={noShowNotes}
            onChange={(e) => setNoShowNotes(e.target.value)}
            size="small"
            InputProps={{ sx: { borderRadius: 2 } }}
          />
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 1.5,
            bgcolor: 'grey.50',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Button
            onClick={() => setNoShowDialog(false)}
            disabled={noShowLoading}
            color="inherit"
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleNoShow}
            disabled={noShowLoading}
            sx={{
              borderRadius: 2,
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#ea580c',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
              '&:hover': {
                bgcolor: '#c2410c',
              },
              '&.Mui-disabled': {
                bgcolor: 'grey.300',
                color: 'grey.500',
              },
            }}
          >
            {noShowLoading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Confirm No-Show'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BookingDetail;
