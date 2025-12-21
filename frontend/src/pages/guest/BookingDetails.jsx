/**
 * Booking Details Page - Guest view for a specific booking
 * Allows viewing, editing, additional payments, and invoice download
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Collapse,
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
  Receipt as ReceiptIcon,
  Edit as EditIcon,
  Payment as PaymentIcon,
  ExpandMore,
  ExpandLess,
  Restaurant,
  Spa,
  FlightTakeoff,
  AccessTime,
} from '@mui/icons-material';
import Hero from '../../components/landing/Hero';
import { bookingService, savedCardService, paymentService } from '../../services';
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

const SERVICE_ICONS = {
  airport_transfer: FlightTakeoff,
  breakfast: Restaurant,
  spa: Spa,
  late_checkout: AccessTime,
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
};

const getCancellationFee = (checkInDate, totalPrice) => {
  const now = new Date();
  const checkIn = new Date(checkInDate);
  const daysUntilCheckIn = Math.ceil((checkIn - now) / (1000 * 60 * 60 * 24));
  const price = parseFloat(totalPrice) || 0;

  if (daysUntilCheckIn > 14) {
    return { fee: 0, description: 'Free cancellation (more than 14 days notice)', type: 'free' };
  } else if (daysUntilCheckIn >= 3) {
    return { fee: price * 0.5, description: '50% of first night (3-14 days notice)', type: 'partial' };
  } else {
    return { fee: price, description: '100% of first night (less than 72 hours notice)', type: 'full' };
  }
};

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [expandedRooms, setExpandedRooms] = useState({});

  // Edit booking state
  const [editDialog, setEditDialog] = useState(false);
  const [editData, setEditData] = useState({
    check_in_date: '',
    check_out_date: '',
    guests_count: 2,
    special_requests: '',
  });
  const [editStep, setEditStep] = useState('form'); // 'form', 'payment', 'processing'
  const [priceDifference, setPriceDifference] = useState(0);
  const [newTotalPrice, setNewTotalPrice] = useState(0);
  const [saving, setSaving] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState('');

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    setLoading(true);
    const result = await bookingService.getById(id);
    if (result.success) {
      setBooking(result.data);
    } else {
      showError('Failed to load booking details');
      navigate('/guest/my-bookings');
    }
    setLoading(false);
  };

  const handleCancelBooking = async () => {
    setCancelling(true);
    const result = await bookingService.cancel(id, { reason: cancelReason });
    if (result.success) {
      showSuccess('Booking cancelled successfully');
      fetchBooking();
      setCancelDialog(false);
      setCancelReason('');
    } else {
      showError(result.error?.message || result.error?.detail || 'Failed to cancel booking');
    }
    setCancelling(false);
  };

  const handleDownloadInvoice = () => {
    if (!booking) return;

    const nights = calculateNights(booking.check_in_date, booking.check_out_date);
    const hasMultipleRooms = booking.booking_rooms && booking.booking_rooms.length > 0;

    // Build room rows
    let roomRows = '';
    if (hasMultipleRooms) {
      booking.booking_rooms.forEach((room) => {
        const roomNights = calculateNights(room.check_in_date || booking.check_in_date, room.check_out_date || booking.check_out_date);
        roomRows += `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${room.room_type_label || room.room_type_category || 'Room'} (${room.guests_count} guests)</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${roomNights}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">£${parseFloat(room.price_per_night || 0).toFixed(2)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">£${parseFloat(room.total_price || 0).toFixed(2)}</td>
          </tr>
        `;
        // Add services for this room
        if (room.ancillary_services_display && room.ancillary_services_display.length > 0) {
          room.ancillary_services_display.forEach(service => {
            roomRows += `
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee; padding-left: 30px; color: #666;">↳ ${service}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">-</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">-</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">Included</td>
              </tr>
            `;
          });
        }
      });
    } else {
      roomRows = `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${booking.room_type_label || booking.room_type_requested || 'Room'} (${booking.guests_count} guests)</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${nights}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">£${(parseFloat(booking.total_price || 0) / nights).toFixed(2)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">£${parseFloat(booking.total_price || 0).toFixed(2)}</td>
        </tr>
      `;
    }

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
              <div style="margin-top: 10px;"><span class="status-badge">${booking.payment_status === 'paid' ? 'PAID' : 'PENDING'}</span></div>
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
            <p>${user?.email || ''}</p>
          </div>
          <div class="info-box">
            <div class="section-title">Hotel</div>
            <h3>${booking.hotel_name}</h3>
            <p>${booking.hotel_city || ''}${booking.hotel_country ? `, ${booking.hotel_country}` : ''}</p>
          </div>
        </div>

        <div class="section" style="margin-top: 30px;">
          <div class="section-title">Charges Breakdown</div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Nights</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${roomRows}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row grand-total">
              <span>Total</span>
              <span>£${parseFloat(booking.total_price || 0).toFixed(2)}</span>
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

    showSuccess('Invoice ready - select "Save as PDF" in print dialog');
  };

  const toggleRoomExpanded = (idx) => {
    setExpandedRooms(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Edit booking functions
  const openEditDialog = async () => {
    if (!booking) return;

    setEditData({
      check_in_date: booking.check_in_date,
      check_out_date: booking.check_out_date,
      guests_count: booking.guests_count,
      special_requests: booking.special_requests || '',
    });
    setEditStep('form');
    setPriceDifference(0);
    setNewTotalPrice(parseFloat(booking.total_price) || 0);
    // Reset payment data for security
    setPaymentData({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
    });
    setSelectedCardId('');
    setEditDialog(true);

    // Fetch saved cards
    const result = await savedCardService.getAll();
    if (result.success) {
      setSavedCards(result.data || []);
      const defaultCard = result.data?.find(c => c.is_default);
      if (defaultCard) {
        setSelectedCardId(defaultCard.id.toString());
      }
    }
  };

  const calculateNewPrice = () => {
    if (!booking) return;

    const originalNights = calculateNights(booking.check_in_date, booking.check_out_date);
    const newNights = calculateNights(editData.check_in_date, editData.check_out_date);

    // Get price per night from booking rooms or calculate
    let pricePerNight = 0;
    if (booking.booking_rooms && booking.booking_rooms.length > 0) {
      pricePerNight = booking.booking_rooms.reduce((sum, room) =>
        sum + parseFloat(room.price_per_night || 0), 0);
    } else {
      pricePerNight = parseFloat(booking.total_price) / originalNights;
    }

    const newTotal = pricePerNight * newNights;
    const originalTotal = parseFloat(booking.total_price) || 0;
    const difference = newTotal - originalTotal;

    setNewTotalPrice(newTotal);
    setPriceDifference(difference);

    return { newTotal, difference };
  };

  const handleEditDataChange = (field) => (e) => {
    const value = e.target.value;
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (editDialog && editData.check_in_date && editData.check_out_date) {
      calculateNewPrice();
    }
  }, [editData.check_in_date, editData.check_out_date, editDialog]);

  const handleReviewChanges = () => {
    const newNights = calculateNights(editData.check_in_date, editData.check_out_date);
    if (newNights <= 0) {
      showError('Check-out date must be after check-in date');
      return;
    }

    calculateNewPrice();

    if (priceDifference > 0) {
      setEditStep('payment');
    } else {
      // No additional payment needed, submit directly
      handleSaveChanges();
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handlePaymentDataChange = (field) => (e) => {
    let value = e.target.value;
    if (field === 'cardNumber') {
      value = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      value = formatExpiryDate(value.replace('/', ''));
    } else if (field === 'cvv') {
      value = value.replace(/[^0-9]/g, '').substring(0, 4);
    }
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async (withPayment = false) => {
    // Validate CVV for saved card
    if (withPayment && selectedCardId && (!paymentData.cvv || paymentData.cvv.length < 3)) {
      showError('Please enter your CVV');
      return;
    }

    // Validate new card details
    if (withPayment && !selectedCardId) {
      if (!paymentData.cardNumber || paymentData.cardNumber.replace(/\s/g, '').length < 13) {
        showError('Please enter a valid card number');
        return;
      }
      if (!paymentData.expiryDate || !/^\d{2}\/\d{2}$/.test(paymentData.expiryDate)) {
        showError('Please enter a valid expiry date (MM/YY)');
        return;
      }
      if (!paymentData.cvv || paymentData.cvv.length < 3) {
        showError('Please enter a valid CVV');
        return;
      }
      if (!paymentData.cardholderName.trim()) {
        showError('Please enter the cardholder name');
        return;
      }
    }

    setSaving(true);
    setEditStep('processing');

    try {
      // If payment is required, process it first
      if (withPayment && priceDifference > 0) {
        let paymentPayload;

        if (selectedCardId) {
          paymentPayload = {
            booking_id: booking.id,
            amount: priceDifference,
            saved_card_id: parseInt(selectedCardId),
            cvv: paymentData.cvv,
            payment_type: 'additional',
          };
        } else {
          paymentPayload = {
            booking_id: booking.id,
            amount: priceDifference,
            card_number: paymentData.cardNumber,
            expiry_month: paymentData.expiryDate.split('/')[0],
            expiry_year: paymentData.expiryDate.split('/')[1],
            cvv: paymentData.cvv,
            cardholder_name: paymentData.cardholderName,
            payment_type: 'additional',
          };
        }

        const paymentResult = await paymentService.create(paymentPayload);
        if (!paymentResult.success) {
          showError(paymentResult.error?.message || 'Payment failed');
          setEditStep('payment');
          setSaving(false);
          return;
        }
      }

      // Update booking
      const updatePayload = {
        check_in_date: editData.check_in_date,
        check_out_date: editData.check_out_date,
        guests_count: editData.guests_count,
        special_requests: editData.special_requests,
        total_price: newTotalPrice,
      };

      const result = await bookingService.update(booking.id, updatePayload);

      if (result.success) {
        showSuccess('Booking updated successfully');
        setEditDialog(false);
        fetchBooking();
      } else {
        showError(result.error?.message || 'Failed to update booking');
        setEditStep('form');
      }
    } catch (error) {
      showError('An error occurred while updating the booking');
      setEditStep('form');
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#FFFFFF' }}>
        <Hero
          title="Booking Details"
          subtitle="View your reservation"
          showSearch={false}
          minHeight="180px"
        />
        <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress sx={{ color: '#667eea' }} />
        </Container>
      </Box>
    );
  }

  if (!booking) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#FFFFFF' }}>
        <Hero
          title="Booking Not Found"
          subtitle="The booking you're looking for doesn't exist"
          showSearch={false}
          minHeight="180px"
        />
        <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/guest/my-bookings')}
            sx={{ color: '#667eea' }}
          >
            Back to My Bookings
          </Button>
        </Container>
      </Box>
    );
  }

  const status = statusConfig[booking.status] || statusConfig.pending;
  const nights = calculateNights(booking.check_in_date, booking.check_out_date);
  const hasMultipleRooms = booking.booking_rooms && booking.booking_rooms.length > 0;
  const canCancel = ['pending', 'confirmed'].includes(booking.status);
  const canEdit = ['pending', 'confirmed'].includes(booking.status);
  const cancellationInfo = canCancel ? getCancellationFee(booking.check_in_date, booking.total_price) : null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FFFFFF' }}>
      <Hero
        title="Booking Details"
        subtitle={`Reference: ${booking.booking_reference}`}
        showSearch={false}
        minHeight="180px"
      />

      <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 } }}>
        {/* Back Button */}
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/guest/my-bookings')}
          sx={{
            mb: 3,
            color: '#717171',
            textTransform: 'none',
            '&:hover': { bgcolor: '#F7F7F7' },
          }}
        >
          Back to My Bookings
        </Button>

        {/* Status Banner */}
        <Box
          sx={{
            bgcolor: status.bgColor,
            borderRadius: '12px',
            p: { xs: 2, sm: 3 },
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {booking.status === 'confirmed' && <CheckCircle sx={{ fontSize: 24, color: status.color }} />}
            {booking.status === 'pending' && <Schedule sx={{ fontSize: 24, color: status.color }} />}
            {booking.status === 'checked_in' && <HotelIcon sx={{ fontSize: 24, color: status.color }} />}
            {['checked_out', 'completed'].includes(booking.status) && <CheckCircle sx={{ fontSize: 24, color: status.color }} />}
            {['cancelled', 'no_show'].includes(booking.status) && <Cancel sx={{ fontSize: 24, color: status.color }} />}
            <Box>
              <Typography sx={{ fontSize: { xs: '18px', sm: '20px' }, fontWeight: 700, color: status.color }}>
                {status.label}
              </Typography>
              <Typography sx={{ fontSize: { xs: '12px', sm: '13px' }, color: status.color, opacity: 0.8 }}>
                Booking Reference: {booking.booking_reference}
              </Typography>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {canEdit && (
              <Button
                startIcon={<EditIcon />}
                onClick={openEditDialog}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  px: 2,
                  py: 1,
                  fontSize: '13px',
                  color: '#667eea',
                  border: '1px solid #667eea',
                  '&:hover': { bgcolor: '#EEF2FF' },
                }}
              >
                Edit
              </Button>
            )}
            <Button
              startIcon={<ReceiptIcon />}
              onClick={handleDownloadInvoice}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                px: 2,
                py: 1,
                fontSize: '13px',
                color: '#222222',
                border: '1px solid #222222',
                '&:hover': { bgcolor: '#F7F7F7' },
              }}
            >
              Invoice
            </Button>
            {canCancel && (
              <Button
                onClick={() => setCancelDialog(true)}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  px: 2,
                  py: 1,
                  fontSize: '13px',
                  color: '#EF4444',
                  border: '1px solid #EF4444',
                  '&:hover': { bgcolor: '#FEE2E2' },
                }}
              >
                Cancel
              </Button>
            )}
          </Box>
        </Box>

        {/* Hotel Info Card */}
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: '12px',
            border: '1px solid #EBEBEB',
            overflow: 'hidden',
            mb: 3,
          }}
        >
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography sx={{ fontSize: { xs: '20px', sm: '24px' }, fontWeight: 700, color: '#222222', mb: 0.5 }}>
              {booking.hotel_name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
              <LocationOn sx={{ fontSize: 18, color: '#717171' }} />
              <Typography sx={{ fontSize: { xs: '14px', sm: '15px' }, color: '#717171' }}>
                {booking.hotel_city}{booking.hotel_country && `, ${booking.hotel_country}`}
              </Typography>
            </Box>

            {/* Dates & Guests Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                gap: 2,
                p: 2,
                bgcolor: '#F7F7F7',
                borderRadius: '10px',
              }}
            >
              <Box>
                <Typography sx={{ fontSize: '11px', color: '#717171', textTransform: 'uppercase', mb: 0.5 }}>
                  Check-in
                </Typography>
                <Typography sx={{ fontSize: { xs: '14px', sm: '16px' }, fontWeight: 600, color: '#222222' }}>
                  {formatDate(booking.check_in_date)}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '11px', color: '#717171', textTransform: 'uppercase', mb: 0.5 }}>
                  Check-out
                </Typography>
                <Typography sx={{ fontSize: { xs: '14px', sm: '16px' }, fontWeight: 600, color: '#222222' }}>
                  {formatDate(booking.check_out_date)}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '11px', color: '#717171', textTransform: 'uppercase', mb: 0.5 }}>
                  Duration
                </Typography>
                <Typography sx={{ fontSize: { xs: '14px', sm: '16px' }, fontWeight: 600, color: '#222222' }}>
                  {nights} night{nights !== 1 ? 's' : ''}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '11px', color: '#717171', textTransform: 'uppercase', mb: 0.5 }}>
                  Guests
                </Typography>
                <Typography sx={{ fontSize: { xs: '14px', sm: '16px' }, fontWeight: 600, color: '#222222' }}>
                  {booking.guests_count} guest{booking.guests_count !== 1 ? 's' : ''}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Rooms Section */}
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: '12px',
            border: '1px solid #EBEBEB',
            overflow: 'hidden',
            mb: 3,
          }}
        >
          <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: '1px solid #EBEBEB' }}>
            <Typography sx={{ fontSize: { xs: '16px', sm: '18px' }, fontWeight: 600, color: '#222222' }}>
              {hasMultipleRooms ? `Rooms (${booking.booking_rooms.length})` : 'Room'}
            </Typography>
          </Box>

          {hasMultipleRooms ? (
            <Box>
              {booking.booking_rooms.map((room, idx) => {
                const isExpanded = expandedRooms[idx];
                const roomServices = room.ancillary_services_display || [];

                return (
                  <Box key={idx} sx={{ borderBottom: idx < booking.booking_rooms.length - 1 ? '1px solid #EBEBEB' : 'none' }}>
                    <Box
                      onClick={() => toggleRoomExpanded(idx)}
                      sx={{
                        p: { xs: 2, sm: 3 },
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#F7F7F7' },
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontSize: { xs: '15px', sm: '16px' }, fontWeight: 600, color: '#222222' }}>
                          {room.room_type_label || room.room_type_category || 'Room'}
                        </Typography>
                        <Typography sx={{ fontSize: '13px', color: '#717171' }}>
                          {room.guests_count} guest{room.guests_count !== 1 ? 's' : ''}
                          {roomServices.length > 0 && ` · ${roomServices.length} service${roomServices.length !== 1 ? 's' : ''}`}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography sx={{ fontSize: { xs: '16px', sm: '18px' }, fontWeight: 700, color: '#222222' }}>
                          £{parseFloat(room.total_price || 0).toFixed(0)}
                        </Typography>
                        {isExpanded ? <ExpandLess sx={{ color: '#717171' }} /> : <ExpandMore sx={{ color: '#717171' }} />}
                      </Box>
                    </Box>

                    <Collapse in={isExpanded}>
                      <Box sx={{ px: { xs: 2, sm: 3 }, pb: 2 }}>
                        <Box sx={{ p: 2, bgcolor: '#F7F7F7', borderRadius: '10px' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography sx={{ fontSize: '13px', color: '#717171' }}>Room rate per night</Typography>
                            <Typography sx={{ fontSize: '13px', color: '#222222' }}>£{parseFloat(room.price_per_night || 0).toFixed(2)}</Typography>
                          </Box>
                          {room.services_total > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography sx={{ fontSize: '13px', color: '#717171' }}>Services</Typography>
                              <Typography sx={{ fontSize: '13px', color: '#222222' }}>£{parseFloat(room.services_total || 0).toFixed(2)}</Typography>
                            </Box>
                          )}
                          {roomServices.length > 0 && (
                            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #E0E0E0' }}>
                              <Typography sx={{ fontSize: '12px', color: '#717171', mb: 1 }}>Included Services:</Typography>
                              {roomServices.map((service, sIdx) => (
                                <Chip
                                  key={sIdx}
                                  label={service}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5, fontSize: '11px', bgcolor: '#E8F0FE', color: '#1967D2' }}
                                />
                              ))}
                            </Box>
                          )}
                          {room.special_requests && (
                            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #E0E0E0' }}>
                              <Typography sx={{ fontSize: '12px', color: '#717171', mb: 0.5 }}>Special Requests:</Typography>
                              <Typography sx={{ fontSize: '13px', color: '#222222' }}>{room.special_requests}</Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography sx={{ fontSize: { xs: '15px', sm: '16px' }, fontWeight: 600, color: '#222222', mb: 1 }}>
                {booking.room_type_label || booking.room_type_requested || 'Standard Room'}
              </Typography>
              <Typography sx={{ fontSize: '13px', color: '#717171' }}>
                {booking.guests_count} guest{booking.guests_count !== 1 ? 's' : ''} · {nights} night{nights !== 1 ? 's' : ''}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Price Summary */}
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: '12px',
            border: '1px solid #EBEBEB',
            overflow: 'hidden',
            mb: 3,
          }}
        >
          <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: '1px solid #EBEBEB' }}>
            <Typography sx={{ fontSize: { xs: '16px', sm: '18px' }, fontWeight: 600, color: '#222222' }}>
              Price Summary
            </Typography>
          </Box>
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {hasMultipleRooms && booking.booking_rooms.map((room, idx) => (
              <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '14px', color: '#717171' }}>
                  {room.room_type_label || room.room_type_category || 'Room'} ({room.guests_count} guests)
                </Typography>
                <Typography sx={{ fontSize: '14px', color: '#222222' }}>
                  £{parseFloat(room.total_price || 0).toFixed(2)}
                </Typography>
              </Box>
            ))}

            {booking.additional_charges > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '14px', color: '#717171' }}>Additional Charges</Typography>
                <Typography sx={{ fontSize: '14px', color: '#222222' }}>
                  £{parseFloat(booking.additional_charges).toFixed(2)}
                </Typography>
              </Box>
            )}

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                pt: 2,
                mt: 2,
                borderTop: '2px solid #222222',
              }}
            >
              <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#222222' }}>Total</Typography>
              <Typography sx={{ fontSize: '24px', fontWeight: 700, color: '#222222' }}>
                £{parseFloat(booking.total_price || 0).toFixed(2)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography sx={{ fontSize: '13px', color: '#717171' }}>Payment Status</Typography>
              <Chip
                label={booking.payment_status === 'paid' ? 'Paid' : booking.payment_status || 'Pending'}
                size="small"
                sx={{
                  bgcolor: booking.payment_status === 'paid' ? '#D1FAE5' : '#FEF3C7',
                  color: booking.payment_status === 'paid' ? '#059669' : '#D97706',
                  fontWeight: 600,
                  fontSize: '12px',
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Special Requests */}
        {booking.special_requests && (
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: '12px',
              border: '1px solid #EBEBEB',
              overflow: 'hidden',
              mb: 3,
            }}
          >
            <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: '1px solid #EBEBEB' }}>
              <Typography sx={{ fontSize: { xs: '16px', sm: '18px' }, fontWeight: 600, color: '#222222' }}>
                Special Requests
              </Typography>
            </Box>
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography sx={{ fontSize: '14px', color: '#222222' }}>
                {booking.special_requests}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Cancellation Policy */}
        {canCancel && cancellationInfo && (
          <Alert
            severity={cancellationInfo.type === 'free' ? 'success' : cancellationInfo.type === 'partial' ? 'warning' : 'error'}
            sx={{ mb: 3, borderRadius: '12px' }}
          >
            <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
              Cancellation: {cancellationInfo.type === 'free' ? 'Free' : `£${(parseFloat(cancellationInfo.fee) || 0).toFixed(2)} fee`}
            </Typography>
            <Typography sx={{ fontSize: '13px' }}>
              {cancellationInfo.description}
            </Typography>
          </Alert>
        )}

        {/* Cancel Dialog */}
        <Dialog
          open={cancelDialog}
          onClose={() => setCancelDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
        >
          <Box
            sx={{
              bgcolor: '#222222',
              px: 3,
              py: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF' }}>
              Cancel Booking
            </Typography>
            <IconButton onClick={() => setCancelDialog(false)} sx={{ color: '#FFFFFF', p: 0.5 }} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <DialogContent sx={{ p: 3 }}>
            {cancellationInfo && (
              <Alert
                severity={cancellationInfo.type === 'free' ? 'success' : cancellationInfo.type === 'partial' ? 'warning' : 'error'}
                sx={{ mb: 3, borderRadius: '10px' }}
              >
                <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                  Cancellation fee: {cancellationInfo.type === 'free' ? 'None' : `£${(parseFloat(cancellationInfo.fee) || 0).toFixed(2)}`}
                </Typography>
                <Typography sx={{ fontSize: '13px' }}>
                  {cancellationInfo.description}
                </Typography>
              </Alert>
            )}

            <Typography sx={{ fontSize: '15px', color: '#222222', mb: 2 }}>
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
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2.5, borderTop: '1px solid #EBEBEB', gap: 1 }}>
            <Button
              onClick={() => setCancelDialog(false)}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                px: 3,
                py: 1,
                color: '#222222',
                border: '1px solid #222222',
                '&:hover': { bgcolor: '#F7F7F7' },
              }}
            >
              Keep Booking
            </Button>
            <Button
              variant="contained"
              onClick={handleCancelBooking}
              disabled={cancelling}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                px: 3,
                py: 1,
                fontWeight: 600,
                bgcolor: '#EF4444',
                '&:hover': { bgcolor: '#DC2626' },
              }}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Booking Dialog */}
        <Dialog
          open={editDialog}
          onClose={() => !saving && setEditDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
        >
          <Box
            sx={{
              bgcolor: '#667eea',
              px: 3,
              py: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF' }}>
              {editStep === 'form' && 'Edit Booking'}
              {editStep === 'payment' && 'Payment Required'}
              {editStep === 'processing' && 'Processing...'}
            </Typography>
            {!saving && (
              <IconButton onClick={() => setEditDialog(false)} sx={{ color: '#FFFFFF', p: 0.5 }} size="small">
                <CloseIcon />
              </IconButton>
            )}
          </Box>

          <DialogContent sx={{ p: 3 }}>
            {editStep === 'processing' && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#667eea', mb: 2 }} />
                <Typography sx={{ fontSize: '16px', color: '#222222' }}>
                  Updating your booking...
                </Typography>
              </Box>
            )}

            {editStep === 'form' && (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Check-in Date"
                    type="date"
                    value={editData.check_in_date}
                    onChange={handleEditDataChange('check_in_date')}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: new Date().toISOString().split('T')[0] }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                  <TextField
                    fullWidth
                    label="Check-out Date"
                    type="date"
                    value={editData.check_out_date}
                    onChange={handleEditDataChange('check_out_date')}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: editData.check_in_date || new Date().toISOString().split('T')[0] }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                </Box>

                <TextField
                  fullWidth
                  label="Number of Guests"
                  type="number"
                  value={editData.guests_count}
                  onChange={handleEditDataChange('guests_count')}
                  size="small"
                  inputProps={{ min: 1, max: 10 }}
                  sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />

                <TextField
                  fullWidth
                  label="Special Requests"
                  multiline
                  rows={3}
                  value={editData.special_requests}
                  onChange={handleEditDataChange('special_requests')}
                  size="small"
                  sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />

                {/* Price Summary */}
                <Box sx={{ bgcolor: '#F7F7F7', borderRadius: '12px', p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontSize: '14px', color: '#717171' }}>Original Total</Typography>
                    <Typography sx={{ fontSize: '14px', color: '#222222' }}>
                      £{parseFloat(booking?.total_price || 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontSize: '14px', color: '#717171' }}>New Total</Typography>
                    <Typography sx={{ fontSize: '14px', color: '#222222' }}>
                      £{newTotalPrice.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      pt: 1,
                      mt: 1,
                      borderTop: '1px solid #E0E0E0',
                    }}
                  >
                    <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#222222' }}>
                      {priceDifference >= 0 ? 'Additional Payment' : 'Price Reduction'}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: priceDifference > 0 ? '#EF4444' : priceDifference < 0 ? '#10B981' : '#222222',
                      }}
                    >
                      {priceDifference > 0 ? '+' : ''}£{priceDifference.toFixed(2)}
                    </Typography>
                  </Box>

                  {priceDifference < 0 && (
                    <Alert severity="info" sx={{ mt: 2, borderRadius: '8px' }}>
                      <Typography sx={{ fontSize: '13px' }}>
                        No refund will be provided for reduced booking costs.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              </>
            )}

            {editStep === 'payment' && (
              <>
                <Alert severity="warning" sx={{ mb: 3, borderRadius: '10px' }}>
                  <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                    Additional payment of £{priceDifference.toFixed(2)} required
                  </Typography>
                  <Typography sx={{ fontSize: '13px' }}>
                    Your booking dates have been extended. Please provide payment to confirm the changes.
                  </Typography>
                </Alert>

                {/* Saved Cards */}
                {savedCards.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#222222', mb: 1.5 }}>
                      Saved Cards
                    </Typography>
                    {savedCards.map((card) => (
                      <Box
                        key={card.id}
                        onClick={() => setSelectedCardId(card.id.toString())}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 1.5,
                          mb: 1,
                          borderRadius: '10px',
                          border: selectedCardId === card.id.toString() ? '2px solid #667eea' : '1px solid #EBEBEB',
                          bgcolor: selectedCardId === card.id.toString() ? '#EEF2FF' : 'transparent',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': { borderColor: '#667eea' },
                        }}
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            border: selectedCardId === card.id.toString() ? '6px solid #667eea' : '2px solid #EBEBEB',
                          }}
                        />
                        <Box>
                          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#222222' }}>
                            •••• {card.last_four}
                          </Typography>
                          <Typography sx={{ fontSize: '12px', color: '#717171' }}>
                            {card.cardholder_name} · Expires {card.expiry_display}
                          </Typography>
                        </Box>
                      </Box>
                    ))}

                    {/* CVV for saved card */}
                    {selectedCardId && selectedCardId !== '' && (
                      <Box sx={{ mt: 2, pl: 4 }}>
                        <TextField
                          label="CVV *"
                          value={paymentData.cvv}
                          onChange={handlePaymentDataChange('cvv')}
                          placeholder="123"
                          type="password"
                          size="small"
                          required
                          error={paymentData.cvv !== '' && paymentData.cvv.length < 3}
                          inputProps={{ maxLength: 4, minLength: 3 }}
                          sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                          helperText={paymentData.cvv !== '' && paymentData.cvv.length < 3 ? 'CVV must be 3-4 digits' : 'Required for security'}
                        />
                      </Box>
                    )}

                    <Box
                      onClick={() => setSelectedCardId('')}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 1.5,
                        mt: 1,
                        borderRadius: '10px',
                        border: selectedCardId === '' ? '2px solid #667eea' : '1px solid #EBEBEB',
                        bgcolor: selectedCardId === '' ? '#EEF2FF' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: '#667eea' },
                      }}
                    >
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          border: selectedCardId === '' ? '6px solid #667eea' : '2px solid #EBEBEB',
                        }}
                      />
                      <Typography sx={{ fontSize: '14px', color: '#222222' }}>
                        Use a different card
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* New Card Form */}
                {(savedCards.length === 0 || selectedCardId === '') && (
                  <Box>
                    <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#222222', mb: 1.5 }}>
                      Card Details
                    </Typography>
                    <TextField
                      fullWidth
                      label="Card Number"
                      value={paymentData.cardNumber}
                      onChange={handlePaymentDataChange('cardNumber')}
                      placeholder="1234 5678 9012 3456"
                      size="small"
                      inputProps={{ maxLength: 19 }}
                      sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                      <TextField
                        fullWidth
                        label="Expiry Date"
                        value={paymentData.expiryDate}
                        onChange={handlePaymentDataChange('expiryDate')}
                        placeholder="MM/YY"
                        size="small"
                        inputProps={{ maxLength: 5 }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                      />
                      <TextField
                        fullWidth
                        label="CVV"
                        value={paymentData.cvv}
                        onChange={handlePaymentDataChange('cvv')}
                        placeholder="123"
                        type="password"
                        size="small"
                        inputProps={{ maxLength: 4 }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                      />
                    </Box>
                    <TextField
                      fullWidth
                      label="Cardholder Name"
                      value={paymentData.cardholderName}
                      onChange={handlePaymentDataChange('cardholderName')}
                      placeholder="Name as shown on card"
                      size="small"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                  </Box>
                )}
              </>
            )}
          </DialogContent>

          {!saving && (
            <DialogActions sx={{ px: 3, py: 2.5, borderTop: '1px solid #EBEBEB', gap: 1 }}>
              {editStep === 'form' && (
                <>
                  <Button
                    onClick={() => setEditDialog(false)}
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      px: 3,
                      py: 1,
                      color: '#222222',
                      border: '1px solid #222222',
                      '&:hover': { bgcolor: '#F7F7F7' },
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleReviewChanges}
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      px: 3,
                      py: 1,
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
                      },
                    }}
                  >
                    {priceDifference > 0 ? 'Continue to Payment' : 'Save Changes'}
                  </Button>
                </>
              )}

              {editStep === 'payment' && (
                <>
                  <Button
                    onClick={() => setEditStep('form')}
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      px: 3,
                      py: 1,
                      color: '#222222',
                      border: '1px solid #222222',
                      '&:hover': { bgcolor: '#F7F7F7' },
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => handleSaveChanges(true)}
                    disabled={selectedCardId && paymentData.cvv.length < 3}
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      px: 3,
                      py: 1,
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
                      },
                      '&:disabled': {
                        background: '#ccc',
                        color: '#666',
                      },
                    }}
                  >
                    Pay £{priceDifference.toFixed(2)} & Confirm
                  </Button>
                </>
              )}
            </DialogActions>
          )}
        </Dialog>
      </Container>
    </Box>
  );
};

export default BookingDetails;
