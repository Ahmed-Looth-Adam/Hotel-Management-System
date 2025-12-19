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
} from '@mui/icons-material';
import { roomService, bookingService, authService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';
import Hero from '../../components/landing/Hero';

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

  const [room, setRoom] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPolicies, setShowPolicies] = useState(false);

  // Booking details from URL params
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guests = parseInt(searchParams.get('guests')) || 2;
  const servicesParam = searchParams.get('services') || '';
  const initialServices = servicesParam ? servicesParam.split(',') : [];
  const initialSpecialRequests = searchParams.get('specialRequests') || '';

  const [selectedServices, setSelectedServices] = useState(initialServices);
  const [specialRequests, setSpecialRequests] = useState(initialSpecialRequests);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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
    fetchData();
  }, [id, isAuthenticated]);

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

  const handleDetailsChange = (field) => (e) => {
    setPersonalDetails(prev => ({ ...prev, [field]: e.target.value }));
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
  const roomTotal = typeInfo.price * nights;

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
    if (!agreedToTerms) {
      showError('Please agree to the terms and policies');
      return;
    }
    if (!checkIn || !checkOut) {
      showError('Invalid booking dates');
      return;
    }

    setSubmitting(true);

    try {
      if (user && (personalDetails.first_name !== user.first_name ||
          personalDetails.last_name !== user.last_name ||
          personalDetails.phone_number !== user.phone_number)) {
        await authService.updateProfile({
          first_name: personalDetails.first_name,
          last_name: personalDetails.last_name,
          phone_number: personalDetails.phone_number,
        });
      }

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

      const result = await bookingService.create(bookingData);

      if (result.success) {
        showSuccess('Booking confirmed successfully!');
        navigate('/guest/my-bookings');
      } else {
        showError(result.error?.message || result.error?.detail || 'Failed to create booking');
      }
    } catch (error) {
      showError('An error occurred. Please try again.');
    }

    setSubmitting(false);
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

              {/* Price Breakdown */}
              <Box sx={{ py: { xs: 2, sm: 3 }, borderBottom: '1px solid #EBEBEB' }}>
                <Typography sx={{ fontSize: { xs: '15px', sm: '18px' }, fontWeight: 600, color: '#222222', mb: { xs: 1.5, sm: 2 } }}>
                  Price details
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: { xs: '13px', sm: '15px' }, color: '#222222' }}>
                    £{typeInfo.price} x {nights} night{nights !== 1 ? 's' : ''}
                  </Typography>
                  <Typography sx={{ fontSize: { xs: '13px', sm: '15px' }, color: '#222222' }}>£{roomTotal}</Typography>
                </Box>

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
                  <CircularProgress size={20} sx={{ color: '#FFFFFF' }} />
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
    </Box>
  );
};

export default BookingConfirmation;
