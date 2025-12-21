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
  Receipt as ReceiptIcon,
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
  const [detailsDialog, setDetailsDialog] = useState({ open: false, booking: null });

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

  const handleDownloadInvoice = (booking, e) => {
    e.stopPropagation();

    const nights = calculateNights(booking.check_in_date, booking.check_out_date);
    const roomTotal = parseFloat(booking.total_price || 0);
    const servicesTotal = booking.service_charges?.reduce((sum, s) => sum + parseFloat(s.total_price || 0), 0) || 0;
    const additionalCharges = parseFloat(booking.additional_charges || 0);
    const grandTotal = roomTotal + servicesTotal + additionalCharges;

    // Build services rows if any
    const serviceRows = booking.service_charges?.map(s => `
      <tr>
        <td style="padding: 10px 15px; border-bottom: 1px solid #f0f0f0;">${s.service_name || 'Service'}</td>
        <td style="padding: 10px 15px; border-bottom: 1px solid #f0f0f0; text-align: center;">${s.quantity || 1}</td>
        <td style="padding: 10px 15px; border-bottom: 1px solid #f0f0f0; text-align: right;">£${parseFloat(s.unit_price || 0).toFixed(2)}</td>
        <td style="padding: 10px 15px; border-bottom: 1px solid #f0f0f0; text-align: right;">£${parseFloat(s.total_price || 0).toFixed(2)}</td>
      </tr>
    `).join('') || '';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${booking.booking_reference}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
              color: #333;
              line-height: 1.5;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 2px solid #667eea;
            }
            .logo {
              font-size: 28px;
              font-weight: 700;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            .logo-subtitle {
              font-size: 12px;
              color: #666;
              margin-top: 4px;
            }
            .invoice-title {
              text-align: right;
            }
            .invoice-title h1 {
              font-size: 32px;
              font-weight: 700;
              color: #222;
              margin-bottom: 5px;
            }
            .invoice-meta {
              font-size: 13px;
              color: #666;
            }
            .invoice-meta strong {
              color: #333;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 14px;
              font-weight: 600;
              color: #667eea;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 12px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
            }
            .info-box {
              background: #f8f9ff;
              padding: 20px;
              border-radius: 10px;
            }
            .info-box h3 {
              font-size: 16px;
              font-weight: 600;
              color: #222;
              margin-bottom: 10px;
            }
            .info-box p {
              font-size: 14px;
              color: #555;
              margin-bottom: 5px;
            }
            .stay-details {
              display: flex;
              gap: 40px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 25px;
              border-radius: 12px;
              margin-bottom: 30px;
            }
            .stay-item {
              text-align: center;
            }
            .stay-item .label {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 1px;
              opacity: 0.8;
              margin-bottom: 5px;
            }
            .stay-item .value {
              font-size: 18px;
              font-weight: 600;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background: #f5f7fa;
              padding: 12px 15px;
              text-align: left;
              font-size: 12px;
              font-weight: 600;
              color: #555;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            th:last-child, td:last-child { text-align: right; }
            th:nth-child(2), td:nth-child(2) { text-align: center; }
            th:nth-child(3), td:nth-child(3) { text-align: right; }
            td {
              padding: 12px 15px;
              border-bottom: 1px solid #eee;
              font-size: 14px;
            }
            .totals {
              background: #f8f9ff;
              padding: 20px;
              border-radius: 10px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 14px;
            }
            .total-row.subtotal {
              border-bottom: 1px solid #e0e0e0;
              margin-bottom: 10px;
              padding-bottom: 15px;
            }
            .total-row.grand-total {
              font-size: 20px;
              font-weight: 700;
              color: #667eea;
              border-top: 2px solid #667eea;
              margin-top: 10px;
              padding-top: 15px;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 13px;
              font-weight: 600;
              background: #d1fae5;
              color: #065f46;
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              text-align: center;
              color: #888;
              font-size: 12px;
            }
            .footer p {
              margin-bottom: 5px;
            }
            @media print {
              body { padding: 20px; }
              .stay-details { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .info-box, .totals { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">LuxeStay</div>
              <div class="logo-subtitle">Premium Hotel Experience</div>
            </div>
            <div class="invoice-title">
              <h1>INVOICE</h1>
              <div class="invoice-meta">
                <div><strong>Reference:</strong> ${booking.booking_reference}</div>
                <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                <div style="margin-top: 10px;"><span class="status-badge">PAID</span></div>
              </div>
            </div>
          </div>

          <div class="stay-details">
            <div class="stay-item">
              <div class="label">Check-in</div>
              <div class="value">${formatDate(booking.check_in_date)}</div>
            </div>
            <div class="stay-item">
              <div class="label">Check-out</div>
              <div class="value">${formatDate(booking.check_out_date)}</div>
            </div>
            <div class="stay-item">
              <div class="label">Duration</div>
              <div class="value">${nights} Night${nights !== 1 ? 's' : ''}</div>
            </div>
            <div class="stay-item">
              <div class="label">Guests</div>
              <div class="value">${booking.guests_count}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-box">
              <div class="section-title">Guest Details</div>
              <h3>${user?.first_name || ''} ${user?.last_name || ''}</h3>
              <p>${user?.email || booking.user_email || ''}</p>
              ${user?.phone_number ? `<p>${user.phone_number}</p>` : ''}
            </div>
            <div class="info-box">
              <div class="section-title">Hotel & Room</div>
              <h3>${booking.hotel_name || 'Hotel'}</h3>
              <p>${booking.hotel_city || ''}${booking.hotel_country ? `, ${booking.hotel_country}` : ''}</p>
              <p><strong>Room:</strong> ${booking.room_number || 'N/A'} - ${booking.room_type_label || booking.room_type_requested || 'Standard'}</p>
            </div>
          </div>

          <div class="section" style="margin-top: 30px;">
            <div class="section-title">Charges Breakdown</div>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Room Accommodation</strong><br><span style="color: #666; font-size: 12px;">${booking.room_type_label || booking.room_type_requested || 'Standard'} - ${nights} night${nights !== 1 ? 's' : ''}</span></td>
                  <td>${nights}</td>
                  <td>£${(roomTotal / nights).toFixed(2)}</td>
                  <td><strong>£${roomTotal.toFixed(2)}</strong></td>
                </tr>
                ${serviceRows}
                ${additionalCharges > 0 ? `
                <tr>
                  <td><strong>Additional Charges</strong><br><span style="color: #666; font-size: 12px;">Incidentals at checkout</span></td>
                  <td>1</td>
                  <td>£${additionalCharges.toFixed(2)}</td>
                  <td><strong>£${additionalCharges.toFixed(2)}</strong></td>
                </tr>
                ` : ''}
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row subtotal">
                <span>Room Charges</span>
                <span>£${roomTotal.toFixed(2)}</span>
              </div>
              ${servicesTotal > 0 ? `
              <div class="total-row">
                <span>Additional Services</span>
                <span>£${servicesTotal.toFixed(2)}</span>
              </div>
              ` : ''}
              ${additionalCharges > 0 ? `
              <div class="total-row">
                <span>Additional Charges</span>
                <span>£${additionalCharges.toFixed(2)}</span>
              </div>
              ` : ''}
              <div class="total-row grand-total">
                <span>Total Paid</span>
                <span>£${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p><strong>Thank you for staying with LuxeStay!</strong></p>
            <p>For any queries regarding this invoice, please contact our support team.</p>
            <p style="margin-top: 15px;">This is a computer-generated invoice and does not require a signature.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();

    // Small delay to ensure content is loaded before printing
    setTimeout(() => {
      printWindow.print();
    }, 250);

    showSuccess('Invoice ready for download');
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
                  onClick={() => navigate(`/guest/booking/${booking.id}`)}
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

                          {/* Invoice button - shown inline on mobile for past bookings */}
                          {['checked_out', 'completed'].includes(booking.status) && (
                            <Button
                              size="small"
                              startIcon={<ReceiptIcon sx={{ fontSize: 14 }} />}
                              onClick={(e) => handleDownloadInvoice(booking, e)}
                              sx={{
                                display: { xs: 'inline-flex', sm: 'none' },
                                ml: 'auto',
                                color: '#667eea',
                                textTransform: 'none',
                                fontSize: '11px',
                                fontWeight: 500,
                                px: 0,
                                py: 0,
                                minWidth: 'auto',
                                '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                              }}
                            >
                              Invoice
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

                        {/* Invoice button - Desktop for past bookings */}
                        {['checked_out', 'completed'].includes(booking.status) && (
                          <Button
                            size="small"
                            startIcon={<ReceiptIcon sx={{ fontSize: 16 }} />}
                            onClick={(e) => handleDownloadInvoice(booking, e)}
                            sx={{
                              color: '#667eea',
                              textTransform: 'none',
                              fontSize: '13px',
                              fontWeight: 500,
                              px: 0,
                              py: 0,
                              minWidth: 'auto',
                              '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                            }}
                          >
                            Download Invoice
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

        {/* Booking Details Dialog */}
        <Dialog
          open={detailsDialog.open}
          onClose={() => setDetailsDialog({ open: false, booking: null })}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: { xs: '12px', sm: '16px' }, overflow: 'hidden', mx: { xs: 2, sm: 3 } } }}
        >
          {detailsDialog.booking && (() => {
            const booking = detailsDialog.booking;
            const status = statusConfig[booking.status] || statusConfig.pending;
            const nights = calculateNights(booking.check_in_date, booking.check_out_date);
            const hasMultipleRooms = booking.booking_rooms && booking.booking_rooms.length > 0;

            return (
              <>
                <Box
                  sx={{
                    bgcolor: status.bgColor,
                    px: { xs: 2, sm: 3 },
                    py: { xs: 2, sm: 2.5 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {booking.status === 'confirmed' && <CheckCircle sx={{ fontSize: 20, color: status.color }} />}
                    {booking.status === 'pending' && <Schedule sx={{ fontSize: 20, color: status.color }} />}
                    {booking.status === 'checked_in' && <HotelIcon sx={{ fontSize: 20, color: status.color }} />}
                    {['cancelled', 'no_show'].includes(booking.status) && <Cancel sx={{ fontSize: 20, color: status.color }} />}
                    <Typography sx={{ fontSize: { xs: '16px', sm: '18px' }, fontWeight: 600, color: status.color }}>
                      {status.label}
                    </Typography>
                  </Box>
                  <IconButton
                    onClick={() => setDetailsDialog({ open: false, booking: null })}
                    sx={{ color: '#222222', p: 0.5 }}
                    size="small"
                  >
                    <CloseIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  </IconButton>
                </Box>

                <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
                  {/* Booking Reference */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography sx={{ fontSize: { xs: '11px', sm: '12px' }, color: '#717171' }}>
                      Booking Reference
                    </Typography>
                    <Typography sx={{ fontSize: { xs: '13px', sm: '14px' }, fontWeight: 600, color: '#222222' }}>
                      {booking.booking_reference}
                    </Typography>
                  </Box>

                  {/* Hotel Info */}
                  <Box sx={{ mb: 3, p: 2, bgcolor: '#F7F7F7', borderRadius: '12px' }}>
                    <Typography sx={{ fontSize: { xs: '16px', sm: '18px' }, fontWeight: 700, color: '#222222', mb: 0.5 }}>
                      {booking.hotel_name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOn sx={{ fontSize: 16, color: '#717171' }} />
                      <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, color: '#717171' }}>
                        {booking.hotel_city}{booking.hotel_country && `, ${booking.hotel_country}`}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Dates & Guests */}
                  <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography sx={{ fontSize: '11px', color: '#717171', textTransform: 'uppercase', mb: 0.5 }}>Check-in</Typography>
                      <Typography sx={{ fontSize: { xs: '14px', sm: '15px' }, fontWeight: 600, color: '#222222' }}>
                        {formatDateShort(booking.check_in_date)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '11px', color: '#717171', textTransform: 'uppercase', mb: 0.5 }}>Check-out</Typography>
                      <Typography sx={{ fontSize: { xs: '14px', sm: '15px' }, fontWeight: 600, color: '#222222' }}>
                        {formatDateShort(booking.check_out_date)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '11px', color: '#717171', textTransform: 'uppercase', mb: 0.5 }}>Duration</Typography>
                      <Typography sx={{ fontSize: { xs: '14px', sm: '15px' }, fontWeight: 600, color: '#222222' }}>
                        {nights} night{nights !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '11px', color: '#717171', textTransform: 'uppercase', mb: 0.5 }}>Guests</Typography>
                      <Typography sx={{ fontSize: { xs: '14px', sm: '15px' }, fontWeight: 600, color: '#222222' }}>
                        {booking.guests_count} guest{booking.guests_count !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Rooms */}
                  <Box sx={{ mb: 3 }}>
                    <Typography sx={{ fontSize: '11px', color: '#717171', textTransform: 'uppercase', mb: 1 }}>
                      {hasMultipleRooms ? `Rooms (${booking.booking_rooms.length})` : 'Room'}
                    </Typography>

                    {hasMultipleRooms ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {booking.booking_rooms.map((room, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              p: 2,
                              bgcolor: '#F7F7F7',
                              borderRadius: '10px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Box>
                              <Typography sx={{ fontSize: { xs: '13px', sm: '14px' }, fontWeight: 600, color: '#222222' }}>
                                {room.room_type_label || room.room_type_category || 'Room'}
                              </Typography>
                              <Typography sx={{ fontSize: '12px', color: '#717171' }}>
                                {room.guests_count} guest{room.guests_count !== 1 ? 's' : ''}
                                {room.ancillary_services_display?.length > 0 && ` · ${room.ancillary_services_display.length} service${room.ancillary_services_display.length !== 1 ? 's' : ''}`}
                              </Typography>
                            </Box>
                            <Typography sx={{ fontSize: { xs: '14px', sm: '15px' }, fontWeight: 600, color: '#222222' }}>
                              £{parseFloat(room.total_price || 0).toFixed(0)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Box sx={{ p: 2, bgcolor: '#F7F7F7', borderRadius: '10px' }}>
                        <Typography sx={{ fontSize: { xs: '14px', sm: '15px' }, fontWeight: 600, color: '#222222' }}>
                          {booking.room_type_label || booking.room_type_requested || 'Standard Room'}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Total Price */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: '1px solid #EBEBEB' }}>
                    <Typography sx={{ fontSize: { xs: '14px', sm: '16px' }, fontWeight: 600, color: '#222222' }}>
                      Total
                    </Typography>
                    <Typography sx={{ fontSize: { xs: '20px', sm: '24px' }, fontWeight: 700, color: '#222222' }}>
                      £{parseFloat(booking.total_price || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </DialogContent>

                <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.5 }, borderTop: '1px solid #EBEBEB', gap: 1 }}>
                  {['pending', 'confirmed'].includes(booking.status) && (
                    <Button
                      onClick={() => {
                        setDetailsDialog({ open: false, booking: null });
                        setCancelDialog({ open: true, booking });
                      }}
                      sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        px: { xs: 2, sm: 3 },
                        py: { xs: 0.75, sm: 1 },
                        fontSize: { xs: '13px', sm: '14px' },
                        color: '#EF4444',
                        border: '1px solid #EF4444',
                        '&:hover': { bgcolor: '#FEE2E2' },
                      }}
                    >
                      Cancel booking
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    onClick={() => setDetailsDialog({ open: false, booking: null })}
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      px: { xs: 2, sm: 3 },
                      py: { xs: 0.75, sm: 1 },
                      fontSize: { xs: '13px', sm: '14px' },
                      fontWeight: 600,
                      bgcolor: '#222222',
                      '&:hover': { bgcolor: '#333333' },
                    }}
                  >
                    Close
                  </Button>
                </DialogActions>
              </>
            );
          })()}
        </Dialog>
      </Container>
    </Box>
  );
};

export default MyBookings;
