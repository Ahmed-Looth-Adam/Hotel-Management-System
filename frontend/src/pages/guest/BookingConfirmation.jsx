/**
 * Booking Confirmation Page - Review booking details and confirm payment
 * Airbnb-style beautiful checkout experience
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Paper,
  Collapse,
  Avatar,
  Dialog,
  DialogContent,
  Radio,
  RadioGroup,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Hotel as HotelIcon,
  Person,
  LocationOn,
  FlightTakeoff,
  Restaurant,
  Spa,
  Schedule,
  CheckCircle,
  Info,
  ExpandMore,
  ExpandLess,
  ArrowBack,
  CalendarMonth,
  People,
  Lock,
  Shield,
  CreditCard,
  Add,
  Delete,
  ShoppingBag,
} from '@mui/icons-material';
import { roomService, bookingService, orderService, authService, savedCardService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';
import { useRoomCart, ANCILLARY_SERVICES as CART_ANCILLARY_SERVICES } from '../../context/RoomCartContext';
import Hero from '../../components/landing/Hero';

// Service icons mapping
const SERVICE_ICONS = {
  airport_transfer: FlightTakeoff,
  breakfast: Restaurant,
  spa: Spa,
  late_checkout: Schedule,
};

// Card type logos
const CARD_LOGOS = {
  visa: '/images/cards/visa.svg',
  mastercard: '/images/cards/mastercard.svg',
  amex: '/images/cards/amex.svg',
};

// Room types info
const ROOM_TYPE_INFO = {
  standard: { label: 'Standard Double', price: 120, capacity: 2, bedSize: 'Double' },
  deluxe: { label: 'Deluxe King', price: 180, capacity: 2, bedSize: 'King' },
  suite: { label: 'Family Suite', price: 240, capacity: 4, bedSize: 'King + Sofa Bed' },
  penthouse: { label: 'Penthouse', price: 500, capacity: 4, bedSize: 'Super King' },
};

// Ancillary services
const ANCILLARY_SERVICES = [
  { id: 'airport_transfer', label: 'Airport Transfer (One-way)', price: 50, icon: FlightTakeoff, perPerson: false },
  { id: 'breakfast', label: 'Full English Breakfast', price: 20, icon: Restaurant, perPerson: true },
  { id: 'spa', label: 'Spa Access', price: 35, icon: Spa, perPerson: true },
  { id: 'late_checkout', label: 'Late Check-out (until 2 PM)', price: 40, icon: Schedule, perPerson: false },
];

// Cancellation policy info
const CANCELLATION_POLICY = [
  { period: 'More than 14 days before check-in', fee: 'Free cancellation' },
  { period: '3-14 days before check-in', fee: '50% of first night' },
  { period: 'Less than 72 hours before check-in', fee: '100% of first night' },
  { period: 'No-show', fee: '100% of entire booking' },
];

const BookingConfirmation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useNotification();
  const {
    getCartItemsArray,
    reservationDates,
    getCartHotel,
    clearCart,
    calculateNights: cartCalculateNights,
    getCartTotal,
    getTotalGuests,
    roomCount,
    calculateItemTotal,
    toggleService,
    calculateItemServicesTotal,
  } = useRoomCart();

  // Get cart data
  const cartItems = getCartItemsArray();
  const cartHotel = getCartHotel();

  // Determine if this is a multi-room (cart) booking or single-room booking
  const isMultiRoomBooking = !id && roomCount > 0;

  const [room, setRoom] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPolicies, setShowPolicies] = useState(false);

  // Booking details from URL params (single room) or cart (multi-room)
  const checkIn = isMultiRoomBooking ? reservationDates.checkIn : (searchParams.get('checkIn') || '');
  const checkOut = isMultiRoomBooking ? reservationDates.checkOut : (searchParams.get('checkOut') || '');
  const guests = isMultiRoomBooking ? getTotalGuests() : (parseInt(searchParams.get('guests')) || 2);
  const servicesParam = searchParams.get('services') || '';
  const initialServices = servicesParam ? servicesParam.split(',') : [];
  const initialSpecialRequests = searchParams.get('specialRequests') || '';

  const [selectedServices, setSelectedServices] = useState(initialServices);
  const [specialRequests, setSpecialRequests] = useState(initialSpecialRequests);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [expandedRoomServices, setExpandedRoomServices] = useState({});

  // Payment details
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });
  const [paymentErrors, setPaymentErrors] = useState({});
  const [processingPayment, setProcessingPayment] = useState(false);

  // Saved cards
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState('new'); // 'new' or card id
  const [saveCard, setSaveCard] = useState(false);
  const [loadingSavedCards, setLoadingSavedCards] = useState(true);

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState('processing'); // 'processing', 'success', 'error'

  // Personal details
  const [personalDetails, setPersonalDetails] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
  });
  const [detailsComplete, setDetailsComplete] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: window.location.pathname + window.location.search } } });
      return;
    }

    // For multi-room, check if cart has rooms (but not if we just completed payment)
    if (!id && roomCount === 0 && !submitting && paymentStep !== 'success') {
      showError('No rooms in cart. Please add rooms first.');
      navigate('/guest/rooms');
      return;
    }

    fetchData();
    fetchSavedCards();
  }, [id, isAuthenticated]);

  const fetchSavedCards = async () => {
    setLoadingSavedCards(true);
    const result = await savedCardService.getAll();
    if (result.success) {
      setSavedCards(result.data || []);
      // Auto-select default card if exists
      const defaultCard = result.data?.find(c => c.is_default);
      if (defaultCard) {
        setSelectedCardId(defaultCard.id.toString());
      }
    }
    setLoadingSavedCards(false);
  };

  useEffect(() => {
    if (user) {
      const details = {
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
      };
      setPersonalDetails(details);
      setDetailsComplete(details.first_name && details.last_name && details.email);
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);

    if (isMultiRoomBooking) {
      // For multi-room bookings, use cart data
      // Get hotel info from cart
      if (cartHotel) {
        setHotel({
          id: cartHotel.hotel_id,
          name: cartHotel.hotel_name,
          city: cartHotel.hotel_city,
          country: cartHotel.hotel_country,
        });
      }
      setLoading(false);
      return;
    }

    // Single room booking - fetch room details
    const roomResult = await roomService.getById(id);
    if (roomResult.success) {
      setRoom(roomResult.data);
      if (roomResult.data.hotel && typeof roomResult.data.hotel === 'object') {
        setHotel(roomResult.data.hotel);
      }
    } else {
      showError('Failed to load room details');
      navigate('/guest/rooms');
    }
    setLoading(false);
  };

  const handleServiceToggle = (serviceId) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Toggle expanded state for room services in multi-room view
  const toggleRoomServicesExpanded = (key) => {
    setExpandedRoomServices((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleDetailsChange = (field) => (e) => {
    setPersonalDetails(prev => ({ ...prev, [field]: e.target.value }));
  };

  // Payment form handlers
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

  const handlePaymentChange = (field) => (e) => {
    let value = e.target.value;

    if (field === 'cardNumber') {
      value = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      value = formatExpiryDate(value.replace('/', ''));
    } else if (field === 'cvv') {
      value = value.replace(/[^0-9]/g, '').substring(0, 4);
    }

    setPaymentDetails(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (paymentErrors[field]) {
      setPaymentErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validatePaymentDetails = () => {
    const errors = {};
    const cardNum = paymentDetails.cardNumber.replace(/\s/g, '');

    if (!cardNum || cardNum.length < 13 || cardNum.length > 19) {
      errors.cardNumber = 'Please enter a valid card number';
    }

    const expiry = paymentDetails.expiryDate;
    if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) {
      errors.expiryDate = 'Please enter a valid expiry date (MM/YY)';
    } else {
      const [month, year] = expiry.split('/');
      const expMonth = parseInt(month, 10);
      const expYear = parseInt('20' + year, 10);
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      if (expMonth < 1 || expMonth > 12) {
        errors.expiryDate = 'Invalid month';
      } else if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        errors.expiryDate = 'Card has expired';
      }
    }

    if (!paymentDetails.cvv || paymentDetails.cvv.length < 3) {
      errors.cvv = 'Please enter a valid CVV';
    }

    if (!paymentDetails.cardholderName.trim()) {
      errors.cardholderName = 'Please enter the cardholder name';
    }

    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getCardType = (cardNumber) => {
    const num = cardNumber.replace(/\s/g, '');
    if (/^4/.test(num)) return 'Visa';
    if (/^5[1-5]/.test(num)) return 'Mastercard';
    if (/^3[47]/.test(num)) return 'Amex';
    if (/^6(?:011|5)/.test(num)) return 'Discover';
    return '';
  };

  // Calculate pricing
  const typeInfo = room ? (ROOM_TYPE_INFO[room.room_type?.category] || ROOM_TYPE_INFO.standard) : ROOM_TYPE_INFO.standard;

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();

  // Calculate room total - different for single vs multi-room
  const roomTotal = isMultiRoomBooking
    ? getCartTotal() // From cart context
    : typeInfo.price * nights;

  const servicesTotal = selectedServices.reduce((total, serviceId) => {
    const service = ANCILLARY_SERVICES.find(s => s.id === serviceId);
    if (!service) return total;
    return total + (service.perPerson ? service.price * guests * nights : service.price);
  }, 0);

  const totalPrice = roomTotal + servicesTotal;

  const handleConfirmBooking = async () => {
    if (!personalDetails.first_name || !personalDetails.last_name || !personalDetails.email) {
      showError('Please fill in all required personal details');
      return;
    }

    // Validate CVV is always required (even for saved cards)
    if (!paymentDetails.cvv || paymentDetails.cvv.length < 3) {
      setPaymentErrors(prev => ({ ...prev, cvv: 'Please enter your CVV' }));
      showError('Please enter your CVV to continue');
      return;
    }

    // For new cards, validate all fields
    if (selectedCardId === 'new' && !validatePaymentDetails()) {
      showError('Please check your payment details');
      return;
    }

    if (!agreedToTerms) {
      showError('Please agree to the terms and policies');
      return;
    }
    if (!checkIn || !checkOut) {
      showError('Invalid booking dates');
      return;
    }

    setSubmitting(true);
    setShowPaymentModal(true);
    setPaymentStep('processing');
    setProcessingPayment(true);

    try {
      // Simulate payment processing (2-3 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

      // Save card if requested (only for new cards)
      if (selectedCardId === 'new' && saveCard) {
        const saveResult = await savedCardService.create({
          card_number: paymentDetails.cardNumber,
          expiry_date: paymentDetails.expiryDate,
          cvv: paymentDetails.cvv,
          cardholder_name: paymentDetails.cardholderName,
          is_default: savedCards.length === 0, // Make default if first card
        });
        if (!saveResult.success) {
          console.warn('Failed to save card:', saveResult.error);
        }
      }

      setProcessingPayment(false);

      if (user && (personalDetails.first_name !== user.first_name ||
          personalDetails.last_name !== user.last_name ||
          personalDetails.phone_number !== user.phone_number)) {
        await authService.updateProfile({
          first_name: personalDetails.first_name,
          last_name: personalDetails.last_name,
          phone_number: personalDetails.phone_number,
        });
      }

      let result;

      if (isMultiRoomBooking) {
        // Multi-room booking - use orderService with rooms array
        // Each cart item has a quantity, so we expand into individual room entries
        const roomsForAPI = [];
        cartItems.forEach(item => {
          for (let i = 0; i < item.quantity; i++) {
            roomsForAPI.push({
              hotel_id: item.hotel_id,
              room_type_category: item.room_type_category,
              check_in_date: checkIn,
              check_out_date: checkOut,
              guests_count: item.guests_per_room,
              price_per_night: item.price_per_night,
              ancillary_services: item.ancillary_services || [],
              special_requests: item.special_requests || '',
            });
          }
        });

        result = await orderService.create({ rooms: roomsForAPI });
      } else {
        // Single room booking - use bookingService
        const bookingData = {
          room: parseInt(id),
          hotel: hotel?.id,
          check_in_date: checkIn,
          check_out_date: checkOut,
          guests_count: guests,
          total_price: totalPrice,
          room_type: room?.room_type_category || 'standard',
          special_requests: specialRequests,
          ancillary_services: selectedServices,
        };

        result = await bookingService.create(bookingData);
      }

      if (result.success) {
        setPaymentStep('success');
        // Clear cart for multi-room bookings
        if (isMultiRoomBooking) {
          clearCart();
        }
        await new Promise(resolve => setTimeout(resolve, 1500));
        setShowPaymentModal(false);
        showSuccess('Payment successful! Booking confirmed.');
        navigate('/guest/my-bookings');
      } else {
        setPaymentStep('error');
        await new Promise(resolve => setTimeout(resolve, 1500));
        setShowPaymentModal(false);
        showError(result.error?.message || result.error?.detail || 'Failed to create booking');
      }
    } catch (error) {
      setPaymentStep('error');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowPaymentModal(false);
      showError('An error occurred. Please try again.');
    }

    setProcessingPayment(false);
    setSubmitting(false);
  };

  // Handle saved card selection
  const handleCardSelection = (cardId) => {
    setSelectedCardId(cardId);
    // Clear CVV when switching cards
    setPaymentDetails(prev => ({ ...prev, cvv: '' }));
    setPaymentErrors({});
  };

  // Get selected card info for display
  const getSelectedCard = () => {
    if (selectedCardId === 'new') return null;
    return savedCards.find(c => c.id.toString() === selectedCardId);
  };

  const getImages = () => {
    if (!room) return [];
    // Check room's own gallery (singular - from RoomDetailSerializer)
    if (room.gallery?.images && room.gallery.images.length > 0) {
      return room.gallery.images.map(img =>
        img.image?.startsWith('http') ? img.image : `http://localhost:8000${img.image}`
      );
    }
    // Check room galleries (plural - alternative structure)
    if (room.galleries && room.galleries.length > 0) {
      const gallery = room.galleries[0];
      if (gallery.images && gallery.images.length > 0) {
        return gallery.images.map(img =>
          img.image?.startsWith('http') ? img.image : `http://localhost:8000${img.image}`
        );
      }
    }
    // No fallback to hotel gallery - rooms should use their own gallery
    return [];
  };

  const images = getImages();
  const mainImage = images[0] || null;

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#FFFFFF' }}>
        <Hero initialCollapsed hideBottomNav initialParams={{ city: hotel?.city, checkIn, checkOut, guests }} />
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#667eea' }} />
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FFFFFF' }}>
      <Hero initialCollapsed hideBottomNav initialParams={{ city: hotel?.city, checkIn, checkOut, guests }} />

      {/* Header Section */}
      <Box
        sx={{
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid #EBEBEB',
          py: { xs: 2, sm: 4 },
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, mb: 1 }}>
            <Box
              onClick={() => navigate(-1)}
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
              Confirm and pay
            </Typography>
          </Box>
          <Typography sx={{ fontSize: { xs: '13px', sm: '16px' }, color: '#717171' }}>
            You're almost there! Review your booking details below.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 5 }, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', gap: { xs: 2, sm: 5 }, flexDirection: { xs: 'column', lg: 'row' } }}>
          {/* Left Column - Forms */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Your Trip Summary */}
            <Box sx={{ mb: { xs: 2, sm: 4 } }}>
              <Typography sx={{ fontSize: { xs: '16px', sm: '22px' }, fontWeight: 600, color: '#222222', mb: { xs: 1.5, sm: 3 } }}>
                Your trip
              </Typography>

              <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 3 }, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, p: { xs: 1.5, sm: 2 }, bgcolor: 'white', borderRadius: { xs: '10px', sm: '12px' }, border: '1px solid #EBEBEB', flex: '1 1 200px' }}>
                  <Box sx={{ width: { xs: 36, sm: 48 }, height: { xs: 36, sm: 48 }, borderRadius: { xs: '8px', sm: '12px' }, bgcolor: '#F7F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CalendarMonth sx={{ color: '#222222', fontSize: { xs: 18, sm: 24 } }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: { xs: '10px', sm: '12px' }, color: '#717171', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dates</Typography>
                    <Typography sx={{ fontSize: { xs: '12px', sm: '15px' }, fontWeight: 600, color: '#222222' }}>
                      {formatDate(checkIn)}
                    </Typography>
                    <Typography sx={{ fontSize: { xs: '12px', sm: '15px' }, fontWeight: 600, color: '#222222' }}>
                      {formatDate(checkOut)}
                    </Typography>
                    <Typography sx={{ fontSize: { xs: '11px', sm: '13px' }, color: '#717171', fontWeight: 500 }}>{nights} night{nights !== 1 ? 's' : ''}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, p: { xs: 1.5, sm: 2 }, bgcolor: 'white', borderRadius: { xs: '10px', sm: '12px' }, border: '1px solid #EBEBEB', flex: '1 1 150px' }}>
                  <Box sx={{ width: { xs: 36, sm: 48 }, height: { xs: 36, sm: 48 }, borderRadius: { xs: '8px', sm: '12px' }, bgcolor: '#F7F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <People sx={{ color: '#222222', fontSize: { xs: 18, sm: 24 } }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: { xs: '10px', sm: '12px' }, color: '#717171', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Guests</Typography>
                    <Typography sx={{ fontSize: { xs: '12px', sm: '15px' }, fontWeight: 600, color: '#222222' }}>{guests} guest{guests !== 1 ? 's' : ''}</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Guest Details */}
            <Box sx={{ mb: { xs: 2, sm: 4 } }}>
              <Typography sx={{ fontSize: { xs: '16px', sm: '22px' }, fontWeight: 600, color: '#222222', mb: 0.5 }}>
                Guest details
              </Typography>
              <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, color: '#717171', mb: { xs: 1.5, sm: 3 } }}>
                {detailsComplete ? 'Confirm your information for this booking' : 'Please provide your details'}
              </Typography>

              <Box sx={{ bgcolor: 'white', p: { xs: 2, sm: 3 }, borderRadius: { xs: '10px', sm: '12px' }, border: '1px solid #EBEBEB' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 1.5, sm: 2 } }}>
                  <TextField
                    fullWidth
                    label="First name"
                    value={personalDetails.first_name}
                    onChange={handleDetailsChange('first_name')}
                    required
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: { xs: '13px', sm: '16px' } } }}
                  />
                  <TextField
                    fullWidth
                    label="Last name"
                    value={personalDetails.last_name}
                    onChange={handleDetailsChange('last_name')}
                    required
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: { xs: '13px', sm: '16px' } } }}
                  />
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={personalDetails.email}
                    disabled
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#f5f5f5', fontSize: { xs: '13px', sm: '16px' } } }}
                  />
                  <TextField
                    fullWidth
                    label="Phone number"
                    value={personalDetails.phone_number}
                    onChange={handleDetailsChange('phone_number')}
                    placeholder="+44 123 456 7890"
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: { xs: '13px', sm: '16px' } } }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Extra Services */}
            <Box sx={{ mb: { xs: 2, sm: 4 } }}>
              <Typography sx={{ fontSize: { xs: '16px', sm: '22px' }, fontWeight: 600, color: '#222222', mb: { xs: 1.5, sm: 3 } }}>
                Enhance your stay
              </Typography>

              {isMultiRoomBooking ? (
                // Multi-room: Collapsible cards per room type
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {cartItems.map((item) => {
                    const isExpanded = expandedRoomServices[item.key];
                    const servicesTotal = calculateItemServicesTotal(item);

                    return (
                      <Box
                        key={item.key}
                        sx={{
                          bgcolor: 'white',
                          borderRadius: { xs: '10px', sm: '12px' },
                          border: '1px solid #EBEBEB',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Room Header */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            p: { xs: 2, sm: 2.5 },
                            borderBottom: isExpanded ? '1px solid #EBEBEB' : 'none',
                          }}
                        >
                          {/* Room Image */}
                          <Box
                            sx={{
                              width: { xs: 50, sm: 60 },
                              height: { xs: 40, sm: 45 },
                              borderRadius: '8px',
                              overflow: 'hidden',
                              bgcolor: '#F7F7F7',
                              flexShrink: 0,
                            }}
                          >
                            {item.image ? (
                              <Box
                                component="img"
                                src={item.image}
                                alt={item.room_type_label}
                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <HotelIcon sx={{ fontSize: 20, color: '#DDDDDD' }} />
                              </Box>
                            )}
                          </Box>

                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontSize: { xs: '14px', sm: '15px' }, fontWeight: 600, color: '#222222' }}>
                              {item.room_type_label}{item.quantity > 1 ? ` x${item.quantity}` : ''}
                            </Typography>
                            <Typography sx={{ fontSize: { xs: '11px', sm: '12px' }, color: '#717171' }}>
                              {item.guests_per_room} guest{item.guests_per_room !== 1 ? 's' : ''} per room
                            </Typography>
                          </Box>

                          {/* Expand/Collapse Services */}
                          <Box
                            onClick={() => toggleRoomServicesExpanded(item.key)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              cursor: 'pointer',
                              p: 1,
                              borderRadius: '8px',
                              '&:hover': { bgcolor: '#F7F7F7' },
                            }}
                          >
                            <ShoppingBag sx={{ fontSize: 18, color: '#717171' }} />
                            <Typography sx={{ fontSize: '13px', color: '#667eea', fontWeight: 500 }}>
                              {item.ancillary_services?.length || 0} services
                            </Typography>
                            {isExpanded ? (
                              <ExpandLess sx={{ color: '#717171', fontSize: 20 }} />
                            ) : (
                              <ExpandMore sx={{ color: '#717171', fontSize: 20 }} />
                            )}
                          </Box>
                        </Box>

                        {/* Collapsible Services List */}
                        <Collapse in={isExpanded}>
                          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                            {CART_ANCILLARY_SERVICES.map((service) => {
                              const Icon = SERVICE_ICONS[service.id] || ShoppingBag;
                              const isSelected = item.ancillary_services?.includes(service.id);

                              // Calculate service price for this item
                              let servicePrice = service.price;
                              if (service.perPerson) servicePrice *= item.guests_per_room;
                              if (service.perNight) servicePrice *= nights;
                              servicePrice *= item.quantity;

                              return (
                                <Box
                                  key={service.id}
                                  onClick={() => toggleService(item.key, service.id)}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    p: 1.5,
                                    cursor: 'pointer',
                                    borderRadius: '8px',
                                    bgcolor: isSelected ? 'rgba(102, 126, 234, 0.05)' : 'transparent',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      bgcolor: isSelected ? 'rgba(102, 126, 234, 0.08)' : '#F7F7F7',
                                    },
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 36,
                                      height: 36,
                                      borderRadius: '8px',
                                      bgcolor: isSelected ? 'rgba(102, 126, 234, 0.15)' : '#F7F7F7',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <Icon sx={{ fontSize: 18, color: isSelected ? '#667eea' : '#717171' }} />
                                  </Box>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#222222' }}>
                                      {service.label}
                                    </Typography>
                                    <Typography sx={{ fontSize: '11px', color: '#717171' }}>
                                      £{service.price}
                                      {service.perPerson ? '/person' : ''}
                                      {service.perNight ? '/night' : ''}
                                      {' · '}Total: £{servicePrice.toFixed(0)}
                                    </Typography>
                                  </Box>
                                  <Checkbox
                                    checked={isSelected}
                                    size="small"
                                    sx={{ '&.Mui-checked': { color: '#667eea' }, p: 0.5 }}
                                  />
                                </Box>
                              );
                            })}
                          </Box>
                        </Collapse>

                        {/* Services Summary when collapsed */}
                        {!isExpanded && servicesTotal > 0 && (
                          <Box sx={{ px: { xs: 2, sm: 2.5 }, pb: 2 }}>
                            <Typography sx={{ fontSize: '12px', color: '#667eea', fontWeight: 500 }}>
                              +£{servicesTotal.toFixed(0)} in add-ons
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                // Single room: Simple list
                <Box sx={{ bgcolor: 'white', borderRadius: { xs: '10px', sm: '12px' }, border: '1px solid #EBEBEB', overflow: 'hidden' }}>
                  {ANCILLARY_SERVICES.map((service, idx) => {
                    const Icon = service.icon;
                    const isSelected = selectedServices.includes(service.id);
                    return (
                      <Box
                        key={service.id}
                        onClick={() => handleServiceToggle(service.id)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: { xs: 1.5, sm: 2 },
                          p: { xs: 1.5, sm: 2.5 },
                          cursor: 'pointer',
                          borderBottom: idx < ANCILLARY_SERVICES.length - 1 ? '1px solid #F0F0F0' : 'none',
                          bgcolor: isSelected ? 'rgba(102, 126, 234, 0.05)' : 'transparent',
                          transition: 'all 0.2s',
                          '&:hover': { bgcolor: isSelected ? 'rgba(102, 126, 234, 0.08)' : '#F7F7F7' },
                        }}
                      >
                        <Box sx={{ width: { xs: 36, sm: 44 }, height: { xs: 36, sm: 44 }, borderRadius: { xs: '8px', sm: '10px' }, bgcolor: isSelected ? 'rgba(102, 126, 234, 0.15)' : '#F7F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon sx={{ fontSize: { xs: 18, sm: 22 }, color: isSelected ? '#667eea' : '#717171' }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontSize: { xs: '13px', sm: '15px' }, fontWeight: 500, color: '#222222' }}>{service.label}</Typography>
                          <Typography sx={{ fontSize: { xs: '11px', sm: '13px' }, color: '#717171' }}>
                            £{service.price}{service.perPerson ? ' per person per day' : ''}
                          </Typography>
                        </Box>
                        <Checkbox
                          checked={isSelected}
                          size="small"
                          sx={{ '&.Mui-checked': { color: '#667eea' }, p: { xs: 0.5, sm: 1 } }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>

            {/* Special Requests */}
            <Box sx={{ mb: { xs: 2, sm: 4 } }}>
              <Typography sx={{ fontSize: { xs: '16px', sm: '22px' }, fontWeight: 600, color: '#222222', mb: { xs: 1.5, sm: 3 } }}>
                Special requests
              </Typography>
              <Box sx={{ bgcolor: 'white', p: { xs: 2, sm: 3 }, borderRadius: { xs: '10px', sm: '12px' }, border: '1px solid #EBEBEB' }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Any special requests? (e.g., high floor, extra pillows, early check-in)"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: { xs: '13px', sm: '16px' } } }}
                />
                <Typography sx={{ fontSize: { xs: '11px', sm: '12px' }, color: '#717171', mt: 1.5 }}>
                  Special requests are subject to availability and cannot be guaranteed.
                </Typography>
              </Box>
            </Box>

            {/* Payment Details */}
            <Box sx={{ mb: { xs: 2, sm: 4 } }}>
              <Typography sx={{ fontSize: { xs: '16px', sm: '22px' }, fontWeight: 600, color: '#222222', mb: 0.5 }}>
                Payment details
              </Typography>
              <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, color: '#717171', mb: { xs: 1.5, sm: 3 } }}>
                {savedCards.length > 0 ? 'Select a saved card or add a new one' : 'Enter your card information to complete the booking'}
              </Typography>

              <Box sx={{ bgcolor: 'white', p: { xs: 2, sm: 3 }, borderRadius: { xs: '10px', sm: '12px' }, border: '1px solid #EBEBEB' }}>
                {/* Saved Cards List */}
                {!loadingSavedCards && savedCards.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <RadioGroup value={selectedCardId} onChange={(e) => handleCardSelection(e.target.value)}>
                      {savedCards.map((card) => (
                        <Box
                          key={card.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            p: 1.5,
                            mb: 1,
                            borderRadius: '10px',
                            border: selectedCardId === card.id.toString() ? '2px solid #667eea' : '1px solid #EBEBEB',
                            bgcolor: selectedCardId === card.id.toString() ? 'rgba(102, 126, 234, 0.05)' : 'transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': { borderColor: '#667eea' },
                          }}
                          onClick={() => handleCardSelection(card.id.toString())}
                        >
                          <Radio value={card.id.toString()} size="small" sx={{ '&.Mui-checked': { color: '#667eea' } }} />
                          {CARD_LOGOS[card.card_type] && (
                            <Box
                              component="img"
                              src={CARD_LOGOS[card.card_type]}
                              alt={card.card_type}
                              sx={{ width: 40, height: 25, objectFit: 'contain' }}
                            />
                          )}
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#222222' }}>
                              •••• •••• •••• {card.last_four}
                            </Typography>
                            <Typography sx={{ fontSize: '12px', color: '#717171' }}>
                              {card.cardholder_name} · Expires {card.expiry_display}
                            </Typography>
                          </Box>
                          {card.is_default && (
                            <Box sx={{ px: 1, py: 0.25, bgcolor: '#667eea', borderRadius: '4px' }}>
                              <Typography sx={{ fontSize: '10px', color: 'white', fontWeight: 500 }}>Default</Typography>
                            </Box>
                          )}
                        </Box>
                      ))}

                      {/* Add new card option */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: '10px',
                          border: selectedCardId === 'new' ? '2px solid #667eea' : '1px solid #EBEBEB',
                          bgcolor: selectedCardId === 'new' ? 'rgba(102, 126, 234, 0.05)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': { borderColor: '#667eea' },
                        }}
                        onClick={() => handleCardSelection('new')}
                      >
                        <Radio value="new" size="small" sx={{ '&.Mui-checked': { color: '#667eea' } }} />
                        <Add sx={{ color: '#667eea' }} />
                        <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#667eea' }}>
                          Add a new card
                        </Typography>
                      </Box>
                    </RadioGroup>
                  </Box>
                )}

                {/* New Card Form - Show if no saved cards OR "Add new card" selected */}
                {(savedCards.length === 0 || selectedCardId === 'new') && (
                  <>
                    {/* Card Number */}
                    <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
                      <TextField
                        fullWidth
                        label="Card number"
                        value={paymentDetails.cardNumber}
                        onChange={handlePaymentChange('cardNumber')}
                        placeholder="1234 5678 9012 3456"
                        error={!!paymentErrors.cardNumber}
                        helperText={paymentErrors.cardNumber}
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <CreditCard sx={{ color: '#717171', mr: 1, fontSize: { xs: 18, sm: 20 } }} />
                          ),
                          endAdornment: getCardType(paymentDetails.cardNumber) && (
                            <Box
                              component="img"
                              src={CARD_LOGOS[getCardType(paymentDetails.cardNumber).toLowerCase()]}
                              alt={getCardType(paymentDetails.cardNumber)}
                              sx={{ width: 32, height: 20, objectFit: 'contain' }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ),
                        }}
                        inputProps={{ maxLength: 19 }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: { xs: '13px', sm: '16px' } } }}
                      />
                    </Box>

                    {/* Expiry and CVV */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: { xs: 1.5, sm: 2 }, mb: { xs: 1.5, sm: 2 } }}>
                      <TextField
                        fullWidth
                        label="Expiry date"
                        value={paymentDetails.expiryDate}
                        onChange={handlePaymentChange('expiryDate')}
                        placeholder="MM/YY"
                        error={!!paymentErrors.expiryDate}
                        helperText={paymentErrors.expiryDate}
                        size="small"
                        inputProps={{ maxLength: 5 }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: { xs: '13px', sm: '16px' } } }}
                      />
                      <TextField
                        fullWidth
                        label="CVV"
                        value={paymentDetails.cvv}
                        onChange={handlePaymentChange('cvv')}
                        placeholder="123"
                        type="password"
                        error={!!paymentErrors.cvv}
                        helperText={paymentErrors.cvv}
                        size="small"
                        inputProps={{ maxLength: 4 }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: { xs: '13px', sm: '16px' } } }}
                      />
                    </Box>

                    {/* Cardholder Name */}
                    <TextField
                      fullWidth
                      label="Cardholder name"
                      value={paymentDetails.cardholderName}
                      onChange={handlePaymentChange('cardholderName')}
                      placeholder="Name as shown on card"
                      error={!!paymentErrors.cardholderName}
                      helperText={paymentErrors.cardholderName}
                      size="small"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: { xs: '13px', sm: '16px' } } }}
                    />

                    {/* Save card checkbox */}
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={saveCard}
                          onChange={(e) => setSaveCard(e.target.checked)}
                          size="small"
                          sx={{ '&.Mui-checked': { color: '#667eea' } }}
                        />
                      }
                      label={
                        <Typography sx={{ fontSize: '13px', color: '#222222' }}>
                          Save this card for future bookings
                        </Typography>
                      }
                      sx={{ mt: 1.5 }}
                    />
                  </>
                )}

                {/* CVV for saved card - Always required */}
                {selectedCardId !== 'new' && savedCards.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography sx={{ fontSize: '13px', color: '#717171', mb: 1 }}>
                      For security, please enter your CVV
                    </Typography>
                    <TextField
                      label="CVV"
                      value={paymentDetails.cvv}
                      onChange={handlePaymentChange('cvv')}
                      placeholder="123"
                      type="password"
                      error={!!paymentErrors.cvv}
                      helperText={paymentErrors.cvv}
                      size="small"
                      inputProps={{ maxLength: 4 }}
                      sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                  </Box>
                )}

                {/* Security note */}
                <Box sx={{ mt: { xs: 1.5, sm: 2 }, display: 'flex', alignItems: 'center', gap: 1, p: { xs: 1, sm: 1.5 }, bgcolor: '#F7F7F7', borderRadius: '8px' }}>
                  <Lock sx={{ fontSize: { xs: 14, sm: 16 }, color: '#008A05' }} />
                  <Typography sx={{ fontSize: { xs: '10px', sm: '12px' }, color: '#717171' }}>
                    Your payment information is encrypted and secure
                  </Typography>
                </Box>

                {/* Accepted cards with logos */}
                <Box sx={{ mt: { xs: 1.5, sm: 2 }, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: { xs: 2, sm: 3 } }}>
                  <Typography sx={{ fontSize: { xs: '10px', sm: '11px' }, color: '#717171' }}>We accept:</Typography>
                  {Object.entries(CARD_LOGOS).map(([type, src]) => (
                    <Box
                      key={type}
                      component="img"
                      src={src}
                      alt={type}
                      sx={{ width: { xs: 36, sm: 44 }, height: { xs: 24, sm: 28 }, objectFit: 'contain' }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Cancellation Policy */}
            <Box sx={{ mb: { xs: 2, sm: 4 } }}>
              <Box
                onClick={() => setShowPolicies(!showPolicies)}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  bgcolor: 'white',
                  p: { xs: 2, sm: 3 },
                  borderRadius: { xs: '10px', sm: '12px' },
                  border: '1px solid #EBEBEB',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: '#667eea' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
                  <Box sx={{ width: { xs: 36, sm: 44 }, height: { xs: 36, sm: 44 }, borderRadius: { xs: '8px', sm: '10px' }, bgcolor: 'rgba(0, 138, 5, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield sx={{ fontSize: { xs: 18, sm: 22 }, color: '#008A05' }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: { xs: '14px', sm: '16px' }, fontWeight: 600, color: '#222222' }}>Cancellation policy</Typography>
                    <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, color: '#008A05', fontWeight: 500 }}>Free cancellation for 14+ days</Typography>
                  </Box>
                </Box>
                {showPolicies ? <ExpandLess sx={{ color: '#717171', fontSize: { xs: 20, sm: 24 } }} /> : <ExpandMore sx={{ color: '#717171', fontSize: { xs: 20, sm: 24 } }} />}
              </Box>

              <Collapse in={showPolicies}>
                <Box sx={{ bgcolor: 'white', p: { xs: 2, sm: 3 }, borderRadius: '0 0 12px 12px', border: '1px solid #EBEBEB', borderTop: 'none', mt: '-1px' }}>
                  {CANCELLATION_POLICY.map((policy, idx) => (
                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: { xs: 1, sm: 1.5 }, borderBottom: idx < CANCELLATION_POLICY.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                      <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, color: '#222222' }}>{policy.period}</Typography>
                      <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, color: policy.fee === 'Free cancellation' ? '#008A05' : '#717171', fontWeight: 500 }}>
                        {policy.fee}
                      </Typography>
                    </Box>
                  ))}

                  <Box sx={{ mt: 2, p: { xs: 1.5, sm: 2 }, bgcolor: '#F7F7F7', borderRadius: '8px', display: 'flex', gap: 1.5 }}>
                    <Info sx={{ fontSize: { xs: 16, sm: 18 }, color: '#717171', mt: 0.2 }} />
                    <Box>
                      <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, fontWeight: 600, color: '#222222' }}>Hotel policies</Typography>
                      <Typography sx={{ fontSize: { xs: '11px', sm: '13px' }, color: '#717171' }}>
                        Check-in: 3:00 PM - 11:00 PM · Check-out: Before 11:00 AM
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Collapse>
            </Box>
          </Box>

          {/* Right Column - Booking Card */}
          <Box sx={{ width: { xs: '100%', lg: 380 }, flexShrink: 0 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: { xs: '12px', sm: '16px' },
                border: '1px solid #EBEBEB',
                bgcolor: 'white',
                position: 'sticky',
                top: 100,
                boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
              }}
            >
              {/* Room Preview */}
              {isMultiRoomBooking ? (
                // Multi-room preview
                <Box sx={{ pb: { xs: 2, sm: 3 }, borderBottom: '1px solid #EBEBEB' }}>
                  <Typography sx={{ fontSize: { xs: '11px', sm: '13px' }, color: '#717171', mb: 1 }}>
                    {hotel?.name} · {roomCount} room{roomCount !== 1 ? 's' : ''}
                  </Typography>
                  {cartItems.map((item, index) => (
                    <Box
                      key={item.key}
                      sx={{
                        display: 'flex',
                        gap: { xs: 1.5, sm: 2 },
                        py: 1.5,
                        borderBottom: index < cartItems.length - 1 ? '1px solid #F0F0F0' : 'none',
                      }}
                    >
                      <Box
                        sx={{
                          width: { xs: 60, sm: 80 },
                          height: { xs: 50, sm: 60 },
                          borderRadius: { xs: '6px', sm: '8px' },
                          overflow: 'hidden',
                          bgcolor: '#F7F7F7',
                          flexShrink: 0,
                        }}
                      >
                        {item.image ? (
                          <Box
                            component="img"
                            src={item.image}
                            alt={item.room_type_label}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <HotelIcon sx={{ fontSize: { xs: 20, sm: 24 }, color: '#DDDDDD' }} />
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, fontWeight: 600, color: '#222222' }}>
                          {item.room_type_label}{item.quantity > 1 ? ` x${item.quantity}` : ''}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                          <Person sx={{ fontSize: { xs: 11, sm: 12 }, color: '#717171' }} />
                          <Typography sx={{ fontSize: { xs: '10px', sm: '12px' }, color: '#717171' }}>
                            {item.guests_per_room} guest{item.guests_per_room !== 1 ? 's' : ''} per room
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: { xs: '11px', sm: '13px' }, color: '#667eea', fontWeight: 500, mt: 0.25 }}>
                          £{item.price_per_night} / night
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                  {hotel?.city && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
                      <LocationOn sx={{ fontSize: { xs: 12, sm: 14 }, color: '#717171' }} />
                      <Typography sx={{ fontSize: { xs: '11px', sm: '13px' }, color: '#717171' }}>{hotel.city}, {hotel.country}</Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                // Single room preview
                <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, borderBottom: '1px solid #EBEBEB' }}>
                  <Box
                    sx={{
                      width: { xs: 90, sm: 130 },
                      height: { xs: 70, sm: 100 },
                      borderRadius: { xs: '8px', sm: '12px' },
                      overflow: 'hidden',
                      bgcolor: '#F7F7F7',
                      flexShrink: 0,
                    }}
                  >
                    {mainImage ? (
                      <Box
                        component="img"
                        src={mainImage}
                        alt={typeInfo.label}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <HotelIcon sx={{ fontSize: { xs: 28, sm: 36 }, color: '#DDDDDD' }} />
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: { xs: '11px', sm: '13px' }, color: '#717171', mb: 0.5 }}>{hotel?.name}</Typography>
                    <Typography sx={{ fontSize: { xs: '14px', sm: '17px' }, fontWeight: 600, color: '#222222', mb: 0.5 }}>{typeInfo.label}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Person sx={{ fontSize: { xs: 12, sm: 14 }, color: '#717171' }} />
                      <Typography sx={{ fontSize: { xs: '11px', sm: '13px' }, color: '#717171' }}>
                        {typeInfo.capacity} guests · {typeInfo.bedSize}
                      </Typography>
                    </Box>
                    {hotel?.city && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <LocationOn sx={{ fontSize: { xs: 12, sm: 14 }, color: '#717171' }} />
                        <Typography sx={{ fontSize: { xs: '11px', sm: '13px' }, color: '#717171' }}>{hotel.city}, {hotel.country}</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {/* Price Breakdown */}
              <Box sx={{ py: { xs: 2, sm: 3 }, borderBottom: '1px solid #EBEBEB' }}>
                <Typography sx={{ fontSize: { xs: '15px', sm: '18px' }, fontWeight: 600, color: '#222222', mb: { xs: 1.5, sm: 2 } }}>
                  Price details
                </Typography>

                {isMultiRoomBooking ? (
                  // Multi-room price breakdown
                  <>
                    {cartItems.map((item) => {
                      const itemTotal = calculateItemTotal(item);
                      return (
                        <Box key={item.key} sx={{ mb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontSize: { xs: '13px', sm: '15px' }, color: '#222222' }}>
                              {item.room_type_label}{item.quantity > 1 ? ` x${item.quantity}` : ''}
                            </Typography>
                            <Typography sx={{ fontSize: { xs: '13px', sm: '15px' }, color: '#222222' }}>
                              £{itemTotal.toFixed(0)}
                            </Typography>
                          </Box>
                          <Typography sx={{ fontSize: { xs: '11px', sm: '12px' }, color: '#717171' }}>
                            £{item.price_per_night?.toFixed(0) || 0} x {nights} nights{item.quantity > 1 ? ` x ${item.quantity} rooms` : ''}
                          </Typography>
                        </Box>
                      );
                    })}
                  </>
                ) : (
                  // Single room price breakdown
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontSize: { xs: '13px', sm: '15px' }, color: '#222222' }}>
                      £{typeInfo.price} x {nights} night{nights !== 1 ? 's' : ''}
                    </Typography>
                    <Typography sx={{ fontSize: { xs: '13px', sm: '15px' }, color: '#222222' }}>£{roomTotal}</Typography>
                  </Box>
                )}

                {selectedServices.map((serviceId) => {
                  const service = ANCILLARY_SERVICES.find(s => s.id === serviceId);
                  if (!service) return null;
                  const servicePrice = service.perPerson ? service.price * guests * nights : service.price;
                  return (
                    <Box key={serviceId} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontSize: { xs: '13px', sm: '15px' }, color: '#222222' }}>{service.label}</Typography>
                      <Typography sx={{ fontSize: { xs: '13px', sm: '15px' }, color: '#222222' }}>£{servicePrice}</Typography>
                    </Box>
                  );
                })}
              </Box>

              {/* Total */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: { xs: 2, sm: 3 }, borderBottom: '1px solid #EBEBEB' }}>
                <Typography sx={{ fontSize: { xs: '15px', sm: '18px' }, fontWeight: 700, color: '#222222' }}>Total (GBP)</Typography>
                <Typography sx={{ fontSize: { xs: '15px', sm: '18px' }, fontWeight: 700, color: '#222222' }}>£{totalPrice}</Typography>
              </Box>

              {/* Invalid Dates Warning */}
              {(!checkIn || !checkOut || nights <= 0) && (
                <Box sx={{ mt: 2, p: { xs: 1.5, sm: 2 }, bgcolor: '#FEF3F2', borderRadius: '10px', border: '1px solid #FEE4E2' }}>
                  <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, color: '#B42318', fontWeight: 500 }}>
                    Invalid booking dates. Please go back and select valid check-in and check-out dates.
                  </Typography>
                </Box>
              )}

              {/* Terms Agreement */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    size="small"
                    sx={{ '&.Mui-checked': { color: '#667eea' }, p: { xs: 0.5, sm: 1 } }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: { xs: '11px', sm: '13px' }, color: '#222222' }}>
                    I agree to the{' '}
                    <Box component="span" sx={{ color: '#667eea', textDecoration: 'underline', cursor: 'pointer' }}>
                      hotel policies
                    </Box>
                    {' '}and{' '}
                    <Box component="span" sx={{ color: '#667eea', textDecoration: 'underline', cursor: 'pointer' }}>
                      terms of service
                    </Box>
                  </Typography>
                }
                sx={{ my: { xs: 1.5, sm: 2 } }}
              />

              {/* Confirm Button */}
              <Button
                variant="contained"
                fullWidth
                onClick={handleConfirmBooking}
                disabled={submitting || !agreedToTerms || !checkIn || !checkOut || nights <= 0 || !personalDetails.first_name || !personalDetails.last_name}
                startIcon={!submitting && <Lock sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: { xs: '10px', sm: '12px' },
                  py: { xs: 1.25, sm: 1.75 },
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: { xs: '14px', sm: '16px' },
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.35)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.45)',
                  },
                  '&.Mui-disabled': { background: '#DDDDDD', color: '#999999', boxShadow: 'none' },
                }}
              >
                {submitting ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CircularProgress size={18} sx={{ color: '#FFFFFF' }} />
                    <Typography sx={{ fontSize: { xs: '13px', sm: '15px' }, fontWeight: 600 }}>
                      {processingPayment ? 'Processing payment...' : 'Confirming booking...'}
                    </Typography>
                  </Box>
                ) : (
                  `Confirm and pay £${totalPrice}`
                )}
              </Button>

              {/* Security Note */}
              <Box sx={{ mt: { xs: 2, sm: 3 }, display: 'flex', alignItems: 'center', gap: 1.5, p: { xs: 1.5, sm: 2 }, bgcolor: '#F7F7F7', borderRadius: '10px' }}>
                <CreditCard sx={{ fontSize: { xs: 18, sm: 20 }, color: '#717171' }} />
                <Typography sx={{ fontSize: { xs: '11px', sm: '12px' }, color: '#717171' }}>
                  Secure payment processing. Your payment info is encrypted.
                </Typography>
              </Box>

              {/* Free Cancellation Note */}
              <Box sx={{ mt: { xs: 1.5, sm: 2 }, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <CheckCircle sx={{ fontSize: { xs: 14, sm: 16 }, color: '#008A05' }} />
                <Typography sx={{ fontSize: { xs: '11px', sm: '13px' }, color: '#717171' }}>
                  Free cancellation for 14+ days before check-in
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Container>

      {/* Payment Processing Modal */}
      <Dialog
        open={showPaymentModal}
        PaperProps={{
          sx: {
            borderRadius: '20px',
            p: 4,
            minWidth: { xs: '90%', sm: 400 },
            textAlign: 'center',
            overflow: 'hidden',
          },
        }}
      >
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          {paymentStep === 'processing' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)', opacity: 1 },
                    '50%': { transform: 'scale(1.05)', opacity: 0.8 },
                    '100%': { transform: 'scale(1)', opacity: 1 },
                  },
                }}
              >
                <CreditCard sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '20px', fontWeight: 600, color: '#222222', mb: 1 }}>
                  {processingPayment ? 'Processing Payment...' : 'Confirming Booking...'}
                </Typography>
                <Typography sx={{ fontSize: '14px', color: '#717171' }}>
                  {processingPayment
                    ? 'Please wait while we securely process your payment'
                    : 'Almost there! Finalizing your reservation'}
                </Typography>
              </Box>
              <CircularProgress sx={{ color: '#667eea' }} />
            </Box>
          )}

          {paymentStep === 'success' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: '#008A05',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'scaleIn 0.3s ease-out',
                  '@keyframes scaleIn': {
                    '0%': { transform: 'scale(0)' },
                    '100%': { transform: 'scale(1)' },
                  },
                }}
              >
                <CheckCircle sx={{ fontSize: 50, color: 'white' }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '20px', fontWeight: 600, color: '#222222', mb: 1 }}>
                  Payment Successful!
                </Typography>
                <Typography sx={{ fontSize: '14px', color: '#717171' }}>
                  Your booking has been confirmed. Redirecting...
                </Typography>
              </Box>
            </Box>
          )}

          {paymentStep === 'error' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: '#B42318',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography sx={{ fontSize: 40, color: 'white' }}>!</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '20px', fontWeight: 600, color: '#222222', mb: 1 }}>
                  Payment Failed
                </Typography>
                <Typography sx={{ fontSize: '14px', color: '#717171' }}>
                  Something went wrong. Please try again.
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default BookingConfirmation;
