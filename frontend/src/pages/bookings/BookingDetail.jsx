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
  alpha,
  Card,
  CardContent,
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
  Email as EmailIcon,
  Groups as GuestsIcon,
  MeetingRoom as RoomIcon,
  Visibility as ViewIcon,
  NightsStay as NightsIcon,
  EventAvailable as CheckInDateIcon,
  EventBusy as CheckOutDateIcon,
  Receipt as ReceiptIcon,
  LocalOffer as PromoIcon,
  Comment as RequestIcon,
} from '@mui/icons-material';
import { bookingService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import LoadingSpinner from '../../components/loading/LoadingSpinner';
import CheckInModal from '../../components/bookings/CheckInModal';

const statusConfig = {
  pending: { color: '#ed6c02', bg: '#fff4e5', label: 'Pending' },
  confirmed: { color: '#0288d1', bg: '#e3f2fd', label: 'Confirmed' },
  checked_in: { color: '#2e7d32', bg: '#e8f5e9', label: 'Checked In' },
  checked_out: { color: '#616161', bg: '#f5f5f5', label: 'Checked Out' },
  cancelled: { color: '#d32f2f', bg: '#ffebee', label: 'Cancelled' },
  no_show: { color: '#c62828', bg: '#ffebee', label: 'No Show' },
};

const paymentStatusConfig = {
  paid: { color: '#2e7d32', bg: '#e8f5e9' },
  pending: { color: '#ed6c02', bg: '#fff4e5' },
  refunded: { color: '#0288d1', bg: '#e3f2fd' },
  failed: { color: '#d32f2f', bg: '#ffebee' },
};

// Info row component for consistent styling
const InfoRow = ({ icon: Icon, label, value, valueColor, valueBold }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, py: 1.25 }}>
    <Avatar sx={{ width: 32, height: 32, bgcolor: alpha('#1976d2', 0.1), color: '#1976d2' }}>
      <Icon sx={{ fontSize: 16 }} />
    </Avatar>
    <Box sx={{ flex: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={valueBold ? 600 : 500}
        sx={{ color: valueColor || 'text.primary' }}
      >
        {value}
      </Typography>
    </Box>
  </Box>
);

// Section card component
const SectionCard = ({ icon: Icon, title, children, color = '#1976d2' }) => (
  <Card
    elevation={0}
    sx={{
      height: '100%',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 3,
      overflow: 'hidden',
    }}
  >
    <Box
      sx={{
        px: 2.5,
        py: 1.5,
        bgcolor: alpha(color, 0.04),
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(color, 0.12), color: color }}>
        <Icon sx={{ fontSize: 20 }} />
      </Avatar>
      <Typography variant="subtitle1" fontWeight={600} color="text.primary">
        {title}
      </Typography>
    </Box>
    <CardContent sx={{ p: 2.5 }}>
      {children}
    </CardContent>
  </Card>
);

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [checkOutDialog, setCheckOutDialog] = useState(false);
  const [noShowDialog, setNoShowDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [noShowNotes, setNoShowNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [roomCondition, setRoomCondition] = useState('');
  const [checkOutLoading, setCheckOutLoading] = useState(false);
  const [noShowLoading, setNoShowLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

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
    setCancelLoading(true);
    const result = await bookingService.cancel(id, { reason: cancelReason || 'Cancelled by staff' });
    if (result.success) {
      showSuccess('Booking cancelled successfully');
      setCancelDialog(false);
      setCancelReason('');
      fetchBooking();
    } else {
      showError(result.error?.message || 'Failed to cancel booking');
    }
    setCancelLoading(false);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate total price
  const calculateTotal = () => {
    const roomPrice = parseFloat(booking?.total_price || 0);
    const additionalChargesAmount = parseFloat(booking?.additional_charges || 0);
    const servicesTotal = booking?.service_charges?.reduce((sum, s) => sum + parseFloat(s.total_price || 0), 0) || 0;
    return (roomPrice + additionalChargesAmount + servicesTotal).toFixed(2);
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

  const status = statusConfig[booking.status] || statusConfig.pending;
  const paymentStatus = paymentStatusConfig[booking.payment_status] || paymentStatusConfig.pending;

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', py: 3 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/bookings')}
            sx={{
              color: 'text.secondary',
              '&:hover': { bgcolor: 'white' },
            }}
          >
            Back to Bookings
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {booking.status === 'confirmed' && (
              <Button
                variant="contained"
                startIcon={<Login />}
                onClick={() => setCheckInModalOpen(true)}
                sx={{
                  bgcolor: '#2e7d32',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  '&:hover': { bgcolor: '#1b5e20' },
                }}
              >
                Check In
              </Button>
            )}
            {booking.status === 'checked_in' && (
              <Button
                variant="contained"
                startIcon={<Logout />}
                onClick={() => setCheckOutDialog(true)}
                sx={{
                  bgcolor: '#1976d2',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  '&:hover': { bgcolor: '#1565c0' },
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
                onClick={() => setCancelDialog(true)}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
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
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                No Show
              </Button>
            )}
          </Box>
        </Box>

        {/* Main Booking Card */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            mb: 3,
          }}
        >
          {/* Booking Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #1a1f37 0%, #0d1025 100%)',
              color: 'white',
              p: 3,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5 }}>
                  Booking Reference
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ mb: 1, color: 'white' }}>
                  {booking.booking_reference}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Created on {formatDate(booking.created_at)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <Chip
                  label={status.label}
                  sx={{
                    bgcolor: status.bg,
                    color: status.color,
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    height: 32,
                    px: 1,
                  }}
                />
                <Chip
                  label={booking.payment_status?.charAt(0).toUpperCase() + booking.payment_status?.slice(1)}
                  sx={{
                    bgcolor: paymentStatus.bg,
                    color: paymentStatus.color,
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    height: 32,
                    px: 1,
                  }}
                />
              </Box>
            </Box>

            {/* Quick Stats */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
                gap: 2,
                mt: 3,
                pt: 3,
                borderTop: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  Guest
                </Typography>
                <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'white' }}>
                  {booking.user_name}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  Hotel
                </Typography>
                <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'white' }}>
                  {booking.hotel_name}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  Room
                </Typography>
                <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'white' }}>
                  {booking.room_number ? `Room ${booking.room_number}` : 'To be assigned'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  Total Amount
                </Typography>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#4ade80' }}>
                  £{calculateTotal()}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Content Sections */}
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Guest Information */}
              <Grid item xs={12} md={6}>
                <SectionCard icon={Person} title="Guest Information" color="#1976d2">
                  <InfoRow icon={Person} label="Full Name" value={booking.user_name} />
                  <InfoRow icon={EmailIcon} label="Email" value={booking.user_email} />
                  <InfoRow icon={GuestsIcon} label="Number of Guests" value={`${booking.guests_count} guest(s)`} />

                  {booking.booking_guests && booking.booking_guests.length > 0 && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Additional Guests
                      </Typography>
                      {booking.booking_guests.map((guest) => (
                        <Box key={guest.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: alpha('#1976d2', 0.1), color: '#1976d2' }}>
                            {guest.full_name?.[0]}
                          </Avatar>
                          <Typography variant="body2">{guest.full_name}</Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </SectionCard>
              </Grid>

              {/* Room Information */}
              <Grid item xs={12} md={6}>
                <SectionCard icon={Hotel} title="Room Information" color="#9c27b0">
                  <InfoRow icon={Hotel} label="Hotel" value={booking.hotel_name} />
                  <InfoRow
                    icon={RoomIcon}
                    label="Room Number"
                    value={booking.room_number ? `Room ${booking.room_number}` : 'To be assigned at check-in'}
                    valueColor={booking.room_number ? 'text.primary' : 'warning.main'}
                  />
                  <InfoRow
                    icon={BadgeIcon}
                    label="Room Type"
                    value={booking.room_type || booking.room_type_requested || 'Standard'}
                  />
                  {booking.room_view && (
                    <InfoRow icon={ViewIcon} label="View" value={booking.room_view} />
                  )}
                </SectionCard>
              </Grid>

              {/* Stay Details */}
              <Grid item xs={12} md={6}>
                <SectionCard icon={CalendarMonth} title="Stay Details" color="#2e7d32">
                  <InfoRow icon={CheckInDateIcon} label="Check-in Date" value={formatDate(booking.check_in_date)} />
                  <InfoRow icon={CheckOutDateIcon} label="Check-out Date" value={formatDate(booking.check_out_date)} />
                  <InfoRow
                    icon={NightsIcon}
                    label="Duration"
                    value={`${booking.number_of_nights} night${booking.number_of_nights > 1 ? 's' : ''}`}
                    valueBold
                  />

                  {booking.checked_in_at && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                          icon={<Login sx={{ fontSize: 14 }} />}
                          label={`Checked in: ${formatDateTime(booking.checked_in_at)}`}
                          size="small"
                          sx={{ bgcolor: alpha('#2e7d32', 0.1), color: '#2e7d32', fontWeight: 500 }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        by {booking.checked_in_by_name}
                      </Typography>
                    </Box>
                  )}

                  {booking.checked_out_at && (
                    <Box sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                          icon={<Logout sx={{ fontSize: 14 }} />}
                          label={`Checked out: ${formatDateTime(booking.checked_out_at)}`}
                          size="small"
                          sx={{ bgcolor: alpha('#616161', 0.1), color: '#616161', fontWeight: 500 }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        by {booking.checked_out_by_name}
                      </Typography>
                    </Box>
                  )}
                </SectionCard>
              </Grid>

              {/* Payment Details */}
              <Grid item xs={12} md={6}>
                <SectionCard icon={Payment} title="Payment Details" color="#ed6c02">
                  <Box sx={{ bgcolor: alpha('#ed6c02', 0.05), borderRadius: 2, p: 2, mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">Total Amount</Typography>
                    <Typography variant="h4" fontWeight={700} color="#ed6c02">
                      £{calculateTotal()}
                    </Typography>
                  </Box>

                  <InfoRow
                    icon={Hotel}
                    label="Room Charge"
                    value={`£${parseFloat(booking.total_price || 0).toFixed(2)} (${booking.number_of_nights} night${booking.number_of_nights > 1 ? 's' : ''})`}
                  />

                  {booking.service_charges && booking.service_charges.length > 0 && (
                    <InfoRow
                      icon={ServicesIcon}
                      label="Additional Services"
                      value={`£${booking.service_charges.reduce((sum, s) => sum + parseFloat(s.total_price || 0), 0).toFixed(2)} (${booking.service_charges.length} service${booking.service_charges.length > 1 ? 's' : ''})`}
                    />
                  )}

                  {booking.additional_charges > 0 && (
                    <InfoRow
                      icon={ReceiptIcon}
                      label="Additional Charges"
                      value={`£${parseFloat(booking.additional_charges).toFixed(2)}`}
                    />
                  )}

                  {booking.promo_code && (
                    <InfoRow icon={PromoIcon} label="Promo Code" value={booking.promo_code} />
                  )}
                </SectionCard>
              </Grid>
            </Grid>

            {/* Special Requests */}
            {booking.special_requests && (
              <Box sx={{ mt: 3 }}>
                <SectionCard icon={RequestIcon} title="Special Requests" color="#7c3aed">
                  <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                    {booking.special_requests}
                  </Typography>
                </SectionCard>
              </Box>
            )}

            {/* Additional Services Table */}
            {booking.service_charges && booking.service_charges.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <SectionCard icon={ServicesIcon} title="Additional Services" color="#0891b2">
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: alpha('#0891b2', 0.04) }}>
                          <TableCell sx={{ fontWeight: 600, borderBottom: '2px solid', borderColor: alpha('#0891b2', 0.2) }}>Service</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600, borderBottom: '2px solid', borderColor: alpha('#0891b2', 0.2) }}>Qty</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, borderBottom: '2px solid', borderColor: alpha('#0891b2', 0.2) }}>Unit Price</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, borderBottom: '2px solid', borderColor: alpha('#0891b2', 0.2) }}>Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {booking.service_charges.map((service, index) => (
                          <TableRow key={index} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {service.service_name}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={service.quantity || 1}
                                size="small"
                                sx={{ minWidth: 32, height: 24, fontSize: '0.75rem', bgcolor: alpha('#0891b2', 0.1), color: '#0891b2' }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" color="text.secondary">
                                £{parseFloat(service.unit_price || 0).toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={600} color="#0891b2">
                                £{parseFloat(service.total_price || 0).toFixed(2)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow sx={{ bgcolor: alpha('#0891b2', 0.04) }}>
                          <TableCell colSpan={3} align="right">
                            <Typography variant="body2" fontWeight={600}>
                              Services Total
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={700} color="#0891b2">
                              £{booking.service_charges.reduce((sum, s) => sum + parseFloat(s.total_price || 0), 0).toFixed(2)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </SectionCard>
              </Box>
            )}

            {/* Check-out Details */}
            {booking.status === 'checked_out' && (booking.room_condition || booking.check_out_notes || booking.additional_charges > 0) && (
              <Box sx={{ mt: 3 }}>
                <SectionCard icon={Logout} title="Check-out Details" color="#616161">
                  {booking.additional_charges > 0 && (
                    <InfoRow
                      icon={MoneyIcon}
                      label="Additional Charges at Check-out"
                      value={`£${parseFloat(booking.additional_charges).toFixed(2)}`}
                      valueBold
                      valueColor="primary.main"
                    />
                  )}
                  {booking.room_condition && (
                    <InfoRow icon={Hotel} label="Room Condition" value={booking.room_condition} />
                  )}
                  {booking.check_out_notes && (
                    <InfoRow icon={NotesIcon} label="Check-out Notes" value={booking.check_out_notes} />
                  )}
                </SectionCard>
              </Box>
            )}

            {/* No-Show Details */}
            {booking.status === 'no_show' && (
              <Box sx={{ mt: 3 }}>
                <SectionCard icon={PersonOff} title="No-Show Details" color="#c62828">
                  {booking.no_show_at && (
                    <InfoRow
                      icon={CalendarMonth}
                      label="Marked as No-Show"
                      value={`${formatDateTime(booking.no_show_at)}${booking.no_show_by_name ? ` by ${booking.no_show_by_name}` : ''}`}
                    />
                  )}
                  {booking.no_show_notes && (
                    <InfoRow icon={NotesIcon} label="Notes" value={booking.no_show_notes} />
                  )}
                </SectionCard>
              </Box>
            )}

            {/* Check-in Records */}
            {booking.check_in_records && booking.check_in_records.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <SectionCard icon={BadgeIcon} title="Verified Guest Details" color="#7c3aed">
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: alpha('#7c3aed', 0.04) }}>
                          <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Full Name</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>DOB</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Nationality</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>ID Type</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>ID Number</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {booking.check_in_records.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              <Chip
                                label={record.guest_type === 'primary' ? 'Primary' : 'Additional'}
                                size="small"
                                sx={{
                                  bgcolor: record.guest_type === 'primary' ? alpha('#7c3aed', 0.1) : alpha('#616161', 0.1),
                                  color: record.guest_type === 'primary' ? '#7c3aed' : '#616161',
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>{record.full_name}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{record.date_of_birth}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{record.nationality}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                {record.id_type?.replace('_', ' ')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>{record.id_number}</Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {booking.check_in_records[0]?.verified_by_name && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary">
                        Verified by <strong>{booking.check_in_records[0].verified_by_name}</strong> on{' '}
                        {formatDateTime(booking.check_in_records[0].verified_at)}
                      </Typography>
                    </Box>
                  )}
                </SectionCard>
              </Box>
            )}
          </Box>
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

        {/* Cancel Booking Dialog */}
        <Dialog
          open={cancelDialog}
          onClose={() => setCancelDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              overflow: 'hidden',
            },
          }}
        >
          <Box
            sx={{
              background: 'linear-gradient(180deg, #7f1d1d 0%, #450a0a 100%)',
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
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  width: 36,
                  height: 36,
                }}
              >
                <Cancel fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#ffffff' }}>
                  Cancel Booking
                </Typography>
                {booking && (
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {booking.booking_reference} | {booking.user_name}
                  </Typography>
                )}
              </Box>
            </Box>
            <IconButton onClick={() => setCancelDialog(false)} sx={{ color: '#ffffff' }} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <DialogContent sx={{ px: 3, py: 2.5 }}>
            <Box
              sx={{
                p: 2,
                mb: 3,
                borderRadius: 2,
                bgcolor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Are you sure you want to <strong>cancel</strong> this booking? This action cannot be undone
                and the guest will be notified of the cancellation.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
              <NotesIcon sx={{ fontSize: 16, color: 'error.main' }} />
              <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Cancellation Reason
              </Typography>
            </Box>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason (optional)"
              placeholder="Enter a reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
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
              onClick={() => setCancelDialog(false)}
              disabled={cancelLoading}
              color="inherit"
              sx={{
                borderRadius: 2,
                px: 3,
                textTransform: 'none',
                fontWeight: 500,
              }}
            >
              Keep Booking
            </Button>
            <Button
              variant="contained"
              onClick={handleCancel}
              disabled={cancelLoading}
              sx={{
                borderRadius: 2,
                px: 4,
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: '#dc2626',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                '&:hover': {
                  bgcolor: '#b91c1c',
                },
                '&.Mui-disabled': {
                  bgcolor: 'grey.300',
                  color: 'grey.500',
                },
              }}
            >
              {cancelLoading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Cancel Booking'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default BookingDetail;
