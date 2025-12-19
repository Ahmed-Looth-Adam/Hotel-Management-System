/**
 * My Bookings Page - Guest view for their bookings
 * Airbnb-style beautiful booking management
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Hotel as HotelIcon,
  Cancel,
  CheckCircle,
  Schedule,
  CalendarMonth,
  People,
  Close as CloseIcon,
  ArrowBack,
  LocationOn,
  LuggageOutlined,
} from '@mui/icons-material';
import Hero from '../../components/landing/Hero';
import { bookingService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';

const statusConfig = {
  pending: { label: 'Pending', color: '#F59E0B', bgColor: '#FEF3C7' },
  confirmed: { label: 'Confirmed', color: '#667eea', bgColor: '#EEF2FF' },
  checked_in: { label: 'Checked In', color: '#10B981', bgColor: '#D1FAE5' },
  checked_out: { label: 'Completed', color: '#6B7280', bgColor: '#F3F4F6' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bgColor: '#FEE2E2' },
  completed: { label: 'Completed', color: '#10B981', bgColor: '#D1FAE5' },
  no_show: { label: 'No Show', color: '#EF4444', bgColor: '#FEE2E2' },
};

const getCancellationFee = (checkInDate, totalPrice) => {
  const now = new Date();
  const checkIn = new Date(checkInDate);
  const daysUntilCheckIn = Math.ceil((checkIn - now) / (1000 * 60 * 60 * 24));

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
  const [activeTab, setActiveTab] = useState('upcoming');
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
    // Compare dates only (without time) to avoid timezone/time issues
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (tab) {
      case 'upcoming':
        return bookings.filter(b =>
          ['pending', 'confirmed'].includes(b.status) &&
          new Date(b.check_in_date) >= today
        );
      case 'current':
        return bookings.filter(b => b.status === 'checked_in');
      case 'past':
        return bookings.filter(b =>
          ['checked_out', 'completed', 'cancelled', 'no_show'].includes(b.status) ||
          new Date(b.check_out_date) < today
        );
      default:
        return bookings;
    }
  };

  const filteredBookings = getFilteredBookings(activeTab);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateShort = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  const calculateNights = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', count: getFilteredBookings('upcoming').length },
    { id: 'current', label: 'Current', count: getFilteredBookings('current').length },
    { id: 'past', label: 'Past', count: getFilteredBookings('past').length },
  ];

  if (loading) {
    return (
      <Box sx={{ bgcolor: '#FFFFFF', minHeight: '100vh' }}>
        <Hero initialCollapsed hideBottomNav />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress sx={{ color: '#667eea' }} />
        </Box>
      </Box>
    );
  }

  const cancellationInfo = cancelDialog.booking
    ? getCancellationFee(cancelDialog.booking.check_in_date, parseFloat(cancelDialog.booking.total_price || 0))
    : null;

  return (
    <Box sx={{ bgcolor: '#FFFFFF', minHeight: '100vh' }}>
      <Hero initialCollapsed hideBottomNav />

      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, mb: { xs: 2, sm: 4 } }}>
          <Box
            onClick={() => navigate('/')}
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
          <Typography sx={{ fontSize: { xs: '18px', sm: '24px', md: '32px' }, fontWeight: 700, color: '#222222' }}>
            My Bookings
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, mb: { xs: 2, sm: 4 }, overflowX: 'auto' }}>
          {tabs.map((tab) => (
            <Box
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              sx={{
                px: { xs: 2, sm: 3 },
                py: { xs: 1, sm: 1.5 },
                borderRadius: '100px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                bgcolor: activeTab === tab.id ? '#667eea' : 'transparent',
                border: activeTab === tab.id ? 'none' : '1px solid #DDDDDD',
                flexShrink: 0,
                '&:hover': {
                  bgcolor: activeTab === tab.id ? '#667eea' : '#F7F7F7',
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: '12px', sm: '14px' },
                  fontWeight: 600,
                  color: activeTab === tab.id ? '#FFFFFF' : '#222222',
                }}
              >
                {tab.label} {tab.count > 0 && `(${tab.count})`}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <Box
            sx={{
              py: { xs: 4, sm: 8 },
              textAlign: 'center',
              bgcolor: '#F7F7F7',
              borderRadius: { xs: '12px', sm: '16px' },
            }}
          >
            <LuggageOutlined sx={{ fontSize: { xs: 48, sm: 64 }, color: '#DDDDDD', mb: 2 }} />
            <Typography sx={{ fontSize: { xs: '16px', sm: '20px' }, fontWeight: 600, color: '#222222', mb: 1 }}>
              No {activeTab} bookings
            </Typography>
            <Typography sx={{ fontSize: { xs: '13px', sm: '15px' }, color: '#717171', mb: 3 }}>
              {activeTab === 'upcoming' ? "You don't have any upcoming trips" :
               activeTab === 'current' ? "You're not currently checked in anywhere" :
               "You haven't completed any trips yet"}
            </Typography>
            {activeTab === 'upcoming' && (
              <Button
                variant="contained"
                onClick={() => navigate('/guest/rooms')}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: { xs: 3, sm: 4 },
                  py: { xs: 1, sm: 1.2 },
                  fontSize: { xs: '13px', sm: '14px' },
                }}
              >
                Start exploring
              </Button>
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
            {filteredBookings.map((booking) => {
              const status = statusConfig[booking.status] || statusConfig.pending;
              const nights = calculateNights(booking.check_in_date, booking.check_out_date);

              return (
                <Box
                  key={booking.id}
                  onClick={() => navigate(`/guest/rooms/${booking.room}`)}
                  sx={{
                    borderRadius: { xs: '12px', sm: '16px' },
                    border: '1px solid #EBEBEB',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                    },
                  }}
                >
                  {/* Card Header with Status */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      px: { xs: 2, sm: 3 },
                      py: { xs: 1, sm: 1.5 },
                      bgcolor: status.bgColor,
                      borderBottom: '1px solid #EBEBEB',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
                      {booking.status === 'confirmed' && <CheckCircle sx={{ fontSize: { xs: 14, sm: 18 }, color: status.color }} />}
                      {booking.status === 'pending' && <Schedule sx={{ fontSize: { xs: 14, sm: 18 }, color: status.color }} />}
                      {booking.status === 'checked_in' && <HotelIcon sx={{ fontSize: { xs: 14, sm: 18 }, color: status.color }} />}
                      {['cancelled', 'no_show'].includes(booking.status) && <Cancel sx={{ fontSize: { xs: 14, sm: 18 }, color: status.color }} />}
                      <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, fontWeight: 600, color: status.color }}>
                        {status.label}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: { xs: '11px', sm: '13px' }, color: '#717171' }}>
                      Ref: {booking.booking_reference}
                    </Typography>
                  </Box>

                  {/* Card Body */}
                  <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                    <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 }, flexDirection: { xs: 'column', sm: 'row' } }}>
                      {/* Room/Hotel Image */}
                      <Box
                        sx={{
                          width: { xs: '100%', sm: 140 },
                          height: { xs: 120, sm: 140 },
                          borderRadius: { xs: '10px', sm: '12px' },
                          flexShrink: 0,
                          overflow: 'hidden',
                          bgcolor: '#F7F7F7',
                        }}
                      >
                        {booking.room_image ? (
                          <Box
                            component="img"
                            src={booking.room_image}
                            alt={booking.hotel_name}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <HotelIcon sx={{ fontSize: { xs: 36, sm: 48 }, color: 'rgba(255,255,255,0.8)' }} />
                          </Box>
                        )}
                      </Box>

                      {/* Booking Details */}
                      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        {/* Top: Hotel name, location, room type */}
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: { xs: 0.5, sm: 0.5 } }}>
                            <Typography sx={{ fontSize: { xs: '15px', sm: '20px' }, fontWeight: 700, color: '#222222' }}>
                              {booking.hotel_name || 'Hotel'}
                            </Typography>
                            {/* Price - shown inline on mobile */}
                            <Box sx={{ display: { xs: 'block', sm: 'none' }, textAlign: 'right' }}>
                              <Typography sx={{ fontSize: '11px', color: '#717171' }}>Total</Typography>
                              <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#222222' }}>
                                £{parseFloat(booking.total_price || 0).toFixed(0)}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: { xs: 0.5, sm: 1 } }}>
                            <LocationOn sx={{ fontSize: { xs: 14, sm: 16 }, color: '#717171' }} />
                            <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, color: '#717171' }}>
                              {booking.hotel_city}{booking.hotel_country && `, ${booking.hotel_country}`}
                            </Typography>
                          </Box>

                          <Typography sx={{ fontSize: { xs: '13px', sm: '15px' }, fontWeight: 600, color: '#222222' }}>
                            {booking.room_type_label || booking.room_type_requested || 'Standard'}
                          </Typography>
                        </Box>

                        {/* Bottom: Check-in/out details */}
                        <Box sx={{ display: 'flex', gap: { xs: 2, sm: 4 }, mt: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarMonth sx={{ fontSize: { xs: 16, sm: 18 }, color: '#717171' }} />
                            <Box>
                              <Typography sx={{ fontSize: { xs: '11px', sm: '13px' }, color: '#717171' }}>
                                {formatDateShort(booking.check_in_date)} → {formatDateShort(booking.check_out_date)}
                              </Typography>
                              <Typography sx={{ fontSize: { xs: '11px', sm: '12px' }, color: '#222222', fontWeight: 500 }}>
                                {nights} night{nights !== 1 ? 's' : ''}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <People sx={{ fontSize: { xs: 16, sm: 18 }, color: '#717171' }} />
                            <Typography sx={{ fontSize: { xs: '11px', sm: '13px' }, color: '#222222', fontWeight: 500 }}>
                              {booking.guests_count} guest{booking.guests_count !== 1 ? 's' : ''}
                            </Typography>
                          </Box>

                          {/* Cancel button - shown inline on mobile, pushed to right */}
                          {['pending', 'confirmed'].includes(booking.status) && (
                            <Button
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCancelDialog({ open: true, booking });
                              }}
                              sx={{
                                display: { xs: 'inline-flex', sm: 'none' },
                                ml: 'auto',
                                color: '#EF4444',
                                textTransform: 'none',
                                fontSize: '11px',
                                fontWeight: 500,
                                px: 0,
                                py: 0,
                                minWidth: 'auto',
                                '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </Box>
                      </Box>

                      {/* Price & Actions - Desktop only */}
                      <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <Box>
                          <Typography sx={{ fontSize: '12px', color: '#717171', mb: 0.5 }}>Total</Typography>
                          <Typography sx={{ fontSize: '24px', fontWeight: 700, color: '#222222' }}>
                            £{parseFloat(booking.total_price || 0).toFixed(0)}
                          </Typography>
                        </Box>

                        {['pending', 'confirmed'].includes(booking.status) && (
                          <Button
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCancelDialog({ open: true, booking });
                            }}
                            sx={{
                              color: '#EF4444',
                              textTransform: 'none',
                              fontSize: '13px',
                              fontWeight: 500,
                              px: 0,
                              py: 0,
                              minWidth: 'auto',
                              '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                            }}
                          >
                            Cancel booking
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}

        {/* Cancel Dialog */}
        <Dialog
          open={cancelDialog.open}
          onClose={() => setCancelDialog({ open: false, booking: null })}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: { xs: '12px', sm: '16px' }, overflow: 'hidden', mx: { xs: 2, sm: 3 } } }}
        >
          <Box
            sx={{
              bgcolor: '#222222',
              px: { xs: 2, sm: 3 },
              py: { xs: 2, sm: 2.5 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography sx={{ fontSize: { xs: '16px', sm: '18px' }, fontWeight: 600, color: '#FFFFFF' }}>
              Cancel booking
            </Typography>
            <IconButton
              onClick={() => setCancelDialog({ open: false, booking: null })}
              sx={{ color: '#FFFFFF', p: 0.5 }}
              size="small"
            >
              <CloseIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>
          </Box>

          <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
            {cancellationInfo && (
              <Alert
                severity={cancellationInfo.type === 'free' ? 'success' : cancellationInfo.type === 'partial' ? 'warning' : 'error'}
                sx={{ mb: { xs: 2, sm: 3 }, borderRadius: '10px' }}
              >
                <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, fontWeight: 600 }}>
                  Cancellation fee: {cancellationInfo.type === 'free' ? 'None' : `£${cancellationInfo.fee.toFixed(2)}`}
                </Typography>
                <Typography sx={{ fontSize: { xs: '11px', sm: '13px' } }}>
                  {cancellationInfo.description}
                </Typography>
              </Alert>
            )}

            {cancelDialog.booking && (
              <Box sx={{ mb: { xs: 2, sm: 3 }, p: { xs: 2, sm: 2.5 }, bgcolor: '#F7F7F7', borderRadius: { xs: '10px', sm: '12px' } }}>
                <Typography sx={{ fontSize: { xs: '14px', sm: '16px' }, fontWeight: 600, color: '#222222', mb: 0.5 }}>
                  {cancelDialog.booking.hotel_name}
                </Typography>
                <Typography sx={{ fontSize: { xs: '12px', sm: '13px' }, color: '#717171', mb: 1 }}>
                  {cancelDialog.booking.hotel_city}{cancelDialog.booking.hotel_country && `, ${cancelDialog.booking.hotel_country}`}
                </Typography>
                <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography sx={{ fontSize: { xs: '10px', sm: '11px' }, color: '#717171', textTransform: 'uppercase' }}>Room</Typography>
                    <Typography sx={{ fontSize: { xs: '12px', sm: '13px' }, fontWeight: 500, color: '#222222' }}>
                      {cancelDialog.booking.room_type_label || cancelDialog.booking.room_type_requested || 'Standard'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: { xs: '10px', sm: '11px' }, color: '#717171', textTransform: 'uppercase' }}>Dates</Typography>
                    <Typography sx={{ fontSize: { xs: '12px', sm: '13px' }, fontWeight: 500, color: '#222222' }}>
                      {formatDateShort(cancelDialog.booking.check_in_date)} - {formatDateShort(cancelDialog.booking.check_out_date)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: { xs: '10px', sm: '11px' }, color: '#717171', textTransform: 'uppercase' }}>Total</Typography>
                    <Typography sx={{ fontSize: { xs: '12px', sm: '13px' }, fontWeight: 600, color: '#222222' }}>
                      £{parseFloat(cancelDialog.booking.total_price || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            <Typography sx={{ fontSize: { xs: '13px', sm: '15px' }, color: '#222222', mb: 2 }}>
              Are you sure you want to cancel this booking?
            </Typography>

            <TextField
              fullWidth
              label="Reason for cancellation (optional)"
              multiline
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: { xs: '13px', sm: '14px' } } }}
            />
          </DialogContent>

          <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.5 }, borderTop: '1px solid #EBEBEB', gap: 1 }}>
            <Button
              onClick={() => setCancelDialog({ open: false, booking: null })}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                px: { xs: 2, sm: 3 },
                py: { xs: 0.75, sm: 1 },
                fontSize: { xs: '13px', sm: '14px' },
                color: '#222222',
                border: '1px solid #222222',
                '&:hover': { bgcolor: '#F7F7F7' },
              }}
            >
              Keep booking
            </Button>
            <Button
              variant="contained"
              onClick={handleCancelBooking}
              disabled={cancelling}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                px: { xs: 2, sm: 3 },
                py: { xs: 0.75, sm: 1 },
                fontSize: { xs: '13px', sm: '14px' },
                fontWeight: 600,
                bgcolor: '#EF4444',
                '&:hover': { bgcolor: '#DC2626' },
              }}
            >
              {cancelling ? 'Cancelling...' : 'Cancel booking'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default MyBookings;
