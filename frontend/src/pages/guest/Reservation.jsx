/**
 * Reservation Page - Full-page view for managing multi-room reservation
 * Shows shared dates, room list with quantity controls, services, and pricing
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  IconButton,
  Paper,
  Collapse,
  Checkbox,
  FormControlLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack,
  CalendarMonth,
  People,
  LocationOn,
  Hotel as HotelIcon,
  Add,
  Remove,
  Delete,
  ExpandMore,
  ExpandLess,
  FlightTakeoff,
  Restaurant,
  Spa,
  Schedule,
  ShoppingBag,
  EventNote,
} from '@mui/icons-material';
import { useRoomCart, ANCILLARY_SERVICES } from '../../context/RoomCartContext';
import { useAuth } from '../../context/AuthContext';
import Hero from '../../components/landing/Hero';

// Service icons mapping
const SERVICE_ICONS = {
  airport_transfer: FlightTakeoff,
  breakfast: Restaurant,
  spa: Spa,
  late_checkout: Schedule,
};

const Reservation = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    cartItems,
    reservationDates,
    updateReservationDates,
    getCartItemsArray,
    updateQuantity,
    removeFromCart,
    toggleService,
    updateCartItem,
    clearCart,
    calculateNights,
    calculateItemServicesTotal,
    calculateItemTotal,
    getCartTotal,
    getTotalRooms,
    getTotalGuests,
    getCartHotel,
    roomCount,
  } = useRoomCart();

  const [expandedServices, setExpandedServices] = useState({});
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [dateError, setDateError] = useState('');

  const cartHotel = getCartHotel();
  const items = getCartItemsArray();
  const nights = calculateNights();
  const totalPrice = getCartTotal();
  const totalGuests = getTotalGuests();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/guest/reservation' } } });
    }
  }, [isAuthenticated, navigate]);

  const toggleServicesExpanded = (key) => {
    setExpandedServices((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleDateChange = (field, value) => {
    const newDates = {
      ...reservationDates,
      [field]: value,
    };

    // Validate dates
    if (newDates.checkIn && newDates.checkOut) {
      const checkInDate = new Date(newDates.checkIn);
      const checkOutDate = new Date(newDates.checkOut);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (checkInDate < today) {
        setDateError('Check-in date cannot be in the past');
        return;
      }
      if (checkOutDate <= checkInDate) {
        setDateError('Check-out must be after check-in');
        return;
      }
    }

    setDateError('');
    updateReservationDates(newDates.checkIn, newDates.checkOut);
  };

  const handleProceedToPayment = () => {
    navigate('/guest/booking-confirmation');
  };

  const handleAddMoreRooms = () => {
    const params = new URLSearchParams();
    if (cartHotel?.hotel_id) {
      params.set('hotel', cartHotel.hotel_id);
    }
    if (reservationDates.checkIn) {
      params.set('checkIn', reservationDates.checkIn);
    }
    if (reservationDates.checkOut) {
      params.set('checkOut', reservationDates.checkOut);
    }
    navigate(`/guest/rooms${params.toString() ? '?' + params.toString() : ''}`);
  };

  const handleClearReservation = () => {
    clearCart();
    setShowClearDialog(false);
    navigate('/guest/rooms');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Empty state
  if (roomCount === 0) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#FFFFFF' }}>
        <Hero initialCollapsed hideBottomNav />

        <Container maxWidth="md" sx={{ py: { xs: 4, sm: 8 } }}>
          <Box
            sx={{
              textAlign: 'center',
              py: { xs: 4, sm: 8 },
            }}
          >
            <Box
              sx={{
                width: { xs: 80, sm: 120 },
                height: { xs: 80, sm: 120 },
                borderRadius: '50%',
                bgcolor: '#F7F7F7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <EventNote sx={{ fontSize: { xs: 40, sm: 60 }, color: '#DDDDDD' }} />
            </Box>

            <Typography
              sx={{
                fontSize: { xs: '20px', sm: '28px' },
                fontWeight: 600,
                color: '#222222',
                mb: 1.5,
              }}
            >
              No rooms in your reservation
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: '14px', sm: '16px' },
                color: '#717171',
                mb: 4,
                maxWidth: 400,
                mx: 'auto',
              }}
            >
              Start browsing our rooms to build your perfect stay. You can add multiple rooms from the same hotel.
            </Typography>

            <Button
              variant="contained"
              onClick={() => navigate('/guest/rooms')}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                py: 1.5,
                px: 4,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '16px',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.45)',
                },
              }}
            >
              Browse Rooms
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FFFFFF' }}>
      <Hero
        initialCollapsed
        hideBottomNav
        initialParams={{
          city: cartHotel?.hotel_city,
          checkIn: reservationDates.checkIn,
          checkOut: reservationDates.checkOut,
          guests: totalGuests,
        }}
      />

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
            <Typography
              sx={{
                fontSize: { xs: '18px', sm: '24px', md: '32px' },
                fontWeight: 700,
                color: '#222222',
              }}
            >
              Your Reservation
            </Typography>
            <Chip
              label={`${roomCount} room${roomCount !== 1 ? 's' : ''}`}
              size="small"
              sx={{
                bgcolor: 'rgba(102, 126, 234, 0.1)',
                color: '#667eea',
                fontWeight: 600,
                fontSize: { xs: '11px', sm: '13px' },
              }}
            />
          </Box>
          <Typography sx={{ fontSize: { xs: '13px', sm: '16px' }, color: '#717171' }}>
            Review and customize your rooms before proceeding to payment
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 5 }, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', gap: { xs: 2, sm: 5 }, flexDirection: { xs: 'column', lg: 'row' } }}>
          {/* Left Column - Room List */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Shared Dates Section */}
            <Box sx={{ mb: { xs: 2, sm: 4 } }}>
              <Typography
                sx={{
                  fontSize: { xs: '16px', sm: '22px' },
                  fontWeight: 600,
                  color: '#222222',
                  mb: { xs: 1.5, sm: 3 },
                }}
              >
                Stay dates
              </Typography>

              <Box
                sx={{
                  bgcolor: 'white',
                  p: { xs: 2, sm: 3 },
                  borderRadius: { xs: '10px', sm: '12px' },
                  border: '1px solid #EBEBEB',
                }}
              >
                <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 3 }, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography
                      sx={{
                        fontSize: { xs: '11px', sm: '13px' },
                        color: '#717171',
                        mb: 1,
                        fontWeight: 500,
                      }}
                    >
                      Check-in
                    </Typography>
                    <TextField
                      type="date"
                      value={reservationDates.checkIn || ''}
                      onChange={(e) => handleDateChange('checkIn', e.target.value)}
                      size="small"
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <CalendarMonth sx={{ color: '#717171', mr: 1, fontSize: 18 }} />
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '10px',
                          fontSize: { xs: '13px', sm: '15px' },
                        },
                      }}
                    />
                  </Box>

                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography
                      sx={{
                        fontSize: { xs: '11px', sm: '13px' },
                        color: '#717171',
                        mb: 1,
                        fontWeight: 500,
                      }}
                    >
                      Check-out
                    </Typography>
                    <TextField
                      type="date"
                      value={reservationDates.checkOut || ''}
                      onChange={(e) => handleDateChange('checkOut', e.target.value)}
                      size="small"
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <CalendarMonth sx={{ color: '#717171', mr: 1, fontSize: 18 }} />
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '10px',
                          fontSize: { xs: '13px', sm: '15px' },
                        },
                      }}
                    />
                  </Box>
                </Box>

                {dateError && (
                  <Typography
                    sx={{
                      fontSize: '12px',
                      color: '#B42318',
                      mt: 1.5,
                    }}
                  >
                    {dateError}
                  </Typography>
                )}

                {nights > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mt: 2,
                      p: 1.5,
                      bgcolor: '#F7F7F7',
                      borderRadius: '8px',
                    }}
                  >
                    <CalendarMonth sx={{ fontSize: 16, color: '#667eea' }} />
                    <Typography sx={{ fontSize: '13px', color: '#222222', fontWeight: 500 }}>
                      {nights} night{nights !== 1 ? 's' : ''} · {formatDate(reservationDates.checkIn)} to{' '}
                      {formatDate(reservationDates.checkOut)}
                    </Typography>
                  </Box>
                )}

                <Typography sx={{ fontSize: '11px', color: '#717171', mt: 1.5 }}>
                  All rooms share the same check-in and check-out dates
                </Typography>
              </Box>
            </Box>

            {/* Hotel Info */}
            {cartHotel && (
              <Box sx={{ mb: { xs: 2, sm: 4 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: { xs: 2, sm: 3 },
                    bgcolor: 'white',
                    borderRadius: { xs: '10px', sm: '12px' },
                    border: '1px solid #EBEBEB',
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 48, sm: 60 },
                      height: { xs: 48, sm: 60 },
                      borderRadius: { xs: '10px', sm: '12px' },
                      bgcolor: '#F7F7F7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <HotelIcon sx={{ fontSize: { xs: 24, sm: 30 }, color: '#667eea' }} />
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: { xs: '15px', sm: '18px' },
                        fontWeight: 600,
                        color: '#222222',
                      }}
                    >
                      {cartHotel.hotel_name}
                    </Typography>
                    {cartHotel.hotel_city && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <LocationOn sx={{ fontSize: 14, color: '#717171' }} />
                        <Typography sx={{ fontSize: '13px', color: '#717171' }}>
                          {cartHotel.hotel_city}, {cartHotel.hotel_country}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            )}

            {/* Room List */}
            <Box sx={{ mb: { xs: 2, sm: 4 } }}>
              <Typography
                sx={{
                  fontSize: { xs: '16px', sm: '22px' },
                  fontWeight: 600,
                  color: '#222222',
                  mb: { xs: 1.5, sm: 3 },
                }}
              >
                Rooms ({roomCount})
              </Typography>

              {items.map((item, index) => {
                const itemTotal = calculateItemTotal(item);
                const servicesTotal = calculateItemServicesTotal(item);
                const isServicesExpanded = expandedServices[item.key];
                const ServiceIcon = SERVICE_ICONS;

                return (
                  <Box
                    key={item.key}
                    sx={{
                      bgcolor: 'white',
                      p: { xs: 2, sm: 3 },
                      borderRadius: { xs: '10px', sm: '12px' },
                      border: '1px solid #EBEBEB',
                      mb: 2,
                    }}
                  >
                    {/* Room Header */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        {/* Room Image */}
                        <Box
                          sx={{
                            width: { xs: 70, sm: 100 },
                            height: { xs: 55, sm: 75 },
                            borderRadius: { xs: '8px', sm: '10px' },
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
                            <Box
                              sx={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <HotelIcon sx={{ fontSize: 24, color: '#DDDDDD' }} />
                            </Box>
                          )}
                        </Box>

                        <Box>
                          <Typography
                            sx={{
                              fontSize: { xs: '14px', sm: '17px' },
                              fontWeight: 600,
                              color: '#222222',
                            }}
                          >
                            {item.room_type_label}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <People sx={{ fontSize: 14, color: '#717171' }} />
                            <Typography sx={{ fontSize: '13px', color: '#717171' }}>
                              {item.guests_per_room} guest{item.guests_per_room !== 1 ? 's' : ''} per room
                            </Typography>
                          </Box>
                          <Typography
                            sx={{
                              fontSize: '13px',
                              color: '#667eea',
                              fontWeight: 500,
                              mt: 0.5,
                            }}
                          >
                            £{item.price_per_night?.toFixed(0) || 0} / night
                          </Typography>
                        </Box>
                      </Box>

                      <IconButton
                        onClick={() => removeFromCart(item.key)}
                        sx={{ color: '#B42318', p: 0.5 }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* Quantity Controls */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        bgcolor: '#F7F7F7',
                        borderRadius: '10px',
                        p: { xs: 1.5, sm: 2 },
                        mb: 2,
                      }}
                    >
                      <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#222222' }}>
                        Number of rooms
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => updateQuantity(item.key, item.quantity - 1)}
                          sx={{
                            bgcolor: 'white',
                            border: '1px solid #DDDDDD',
                            width: 32,
                            height: 32,
                            '&:hover': { bgcolor: '#EBEBEB' },
                          }}
                        >
                          <Remove sx={{ fontSize: 16 }} />
                        </IconButton>
                        <Typography
                          sx={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#222222',
                            minWidth: 30,
                            textAlign: 'center',
                          }}
                        >
                          {item.quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => updateQuantity(item.key, item.quantity + 1)}
                          disabled={item.quantity >= item.max_available}
                          sx={{
                            bgcolor: 'white',
                            border: '1px solid #DDDDDD',
                            width: 32,
                            height: 32,
                            '&:hover': { bgcolor: '#EBEBEB' },
                            '&.Mui-disabled': { bgcolor: '#F7F7F7', borderColor: '#EBEBEB' },
                          }}
                        >
                          <Add sx={{ fontSize: 16 }} />
                        </IconButton>
                        {item.quantity >= item.max_available && (
                          <Typography sx={{ fontSize: '11px', color: '#B42318' }}>Max</Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Services Section */}
                    <Box
                      onClick={() => toggleServicesExpanded(item.key)}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        py: 1,
                        borderTop: '1px solid #F0F0F0',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShoppingBag sx={{ fontSize: 18, color: '#717171' }} />
                        <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#222222' }}>
                          Add-on services
                        </Typography>
                        {item.ancillary_services?.length > 0 && (
                          <Chip
                            label={`${item.ancillary_services.length} selected`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '11px',
                              bgcolor: 'rgba(102, 126, 234, 0.1)',
                              color: '#667eea',
                            }}
                          />
                        )}
                      </Box>
                      {isServicesExpanded ? (
                        <ExpandLess sx={{ color: '#717171' }} />
                      ) : (
                        <ExpandMore sx={{ color: '#717171' }} />
                      )}
                    </Box>

                    <Collapse in={isServicesExpanded}>
                      <Box sx={{ pt: 1 }}>
                        {ANCILLARY_SERVICES.map((service) => {
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
                                <Icon
                                  sx={{ fontSize: 18, color: isSelected ? '#667eea' : '#717171' }}
                                />
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography
                                  sx={{ fontSize: '13px', fontWeight: 500, color: '#222222' }}
                                >
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

                    {/* Special Requests */}
                    <Box sx={{ mt: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Special requests (optional)"
                        value={item.special_requests || ''}
                        onChange={(e) =>
                          updateCartItem(item.key, { special_requests: e.target.value })
                        }
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            fontSize: '13px',
                          },
                        }}
                      />
                    </Box>

                    {/* Item Total */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mt: 2,
                        pt: 2,
                        borderTop: '1px solid #F0F0F0',
                      }}
                    >
                      <Typography sx={{ fontSize: '13px', color: '#717171' }}>
                        {item.quantity} room{item.quantity !== 1 ? 's' : ''} x {nights} night
                        {nights !== 1 ? 's' : ''}
                        {servicesTotal > 0 && ` + services`}
                      </Typography>
                      <Typography
                        sx={{ fontSize: '16px', fontWeight: 600, color: '#667eea' }}
                      >
                        £{itemTotal.toFixed(0)}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}

              {/* Add More Rooms Button */}
              <Button
                fullWidth
                variant="outlined"
                onClick={handleAddMoreRooms}
                startIcon={<Add />}
                sx={{
                  borderRadius: '12px',
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '14px',
                  borderColor: '#667eea',
                  color: '#667eea',
                  borderStyle: 'dashed',
                  '&:hover': {
                    borderColor: '#5a6fd6',
                    bgcolor: 'rgba(102, 126, 234, 0.04)',
                  },
                }}
              >
                Add More Rooms
              </Button>
            </Box>
          </Box>

          {/* Right Column - Price Summary */}
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
              <Typography
                sx={{
                  fontSize: { xs: '15px', sm: '18px' },
                  fontWeight: 600,
                  color: '#222222',
                  mb: 2,
                }}
              >
                Price summary
              </Typography>

              {/* Room Breakdown */}
              {items.map((item) => {
                const roomSubtotal = item.price_per_night * nights * item.quantity;
                const servicesSubtotal = calculateItemServicesTotal(item) * item.quantity;

                return (
                  <Box key={item.key} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 0.5,
                      }}
                    >
                      <Typography sx={{ fontSize: '14px', color: '#222222' }}>
                        {item.room_type_label}
                        {item.quantity > 1 && ` x${item.quantity}`}
                      </Typography>
                      <Typography sx={{ fontSize: '14px', color: '#222222' }}>
                        £{roomSubtotal.toFixed(0)}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '12px', color: '#717171' }}>
                      £{item.price_per_night?.toFixed(0) || 0} x {nights} nights
                      {item.quantity > 1 && ` x ${item.quantity} rooms`}
                    </Typography>

                    {servicesSubtotal > 0 && (
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mt: 1,
                        }}
                      >
                        <Typography sx={{ fontSize: '13px', color: '#717171' }}>
                          Add-on services
                        </Typography>
                        <Typography sx={{ fontSize: '13px', color: '#717171' }}>
                          £{servicesSubtotal.toFixed(0)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                );
              })}

              {/* Divider */}
              <Box sx={{ borderTop: '1px solid #EBEBEB', my: 2 }} />

              {/* Total */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Typography
                  sx={{ fontSize: { xs: '16px', sm: '18px' }, fontWeight: 700, color: '#222222' }}
                >
                  Total (GBP)
                </Typography>
                <Typography
                  sx={{ fontSize: { xs: '16px', sm: '18px' }, fontWeight: 700, color: '#222222' }}
                >
                  £{totalPrice.toFixed(0)}
                </Typography>
              </Box>

              {/* Summary Stats */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  p: 2,
                  bgcolor: '#F7F7F7',
                  borderRadius: '10px',
                  mb: 3,
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#667eea' }}>
                    {roomCount}
                  </Typography>
                  <Typography sx={{ fontSize: '12px', color: '#717171' }}>
                    room{roomCount !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#667eea' }}>
                    {nights}
                  </Typography>
                  <Typography sx={{ fontSize: '12px', color: '#717171' }}>
                    night{nights !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#667eea' }}>
                    {totalGuests}
                  </Typography>
                  <Typography sx={{ fontSize: '12px', color: '#717171' }}>
                    guest{totalGuests !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              </Box>

              {/* Proceed to Payment Button */}
              <Button
                fullWidth
                variant="contained"
                onClick={handleProceedToPayment}
                disabled={nights <= 0 || !reservationDates.checkIn || !reservationDates.checkOut}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '16px',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.35)',
                  mb: 1.5,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.45)',
                  },
                  '&.Mui-disabled': {
                    background: '#DDDDDD',
                    color: '#999999',
                    boxShadow: 'none',
                  },
                }}
              >
                Proceed to Payment
              </Button>

              {/* Clear Reservation Button */}
              <Button
                fullWidth
                variant="text"
                onClick={() => setShowClearDialog(true)}
                sx={{
                  color: '#B42318',
                  textTransform: 'none',
                  fontSize: '13px',
                  '&:hover': { bgcolor: 'rgba(180, 35, 24, 0.05)' },
                }}
              >
                Clear Reservation
              </Button>
            </Paper>
          </Box>
        </Box>
      </Container>

      {/* Clear Confirmation Dialog */}
      <Dialog
        open={showClearDialog}
        onClose={() => setShowClearDialog(false)}
        PaperProps={{
          sx: { borderRadius: '16px', maxWidth: 400 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Clear Reservation?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#717171' }}>
            Are you sure you want to remove all {roomCount} room{roomCount !== 1 ? 's' : ''} from your
            reservation? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setShowClearDialog(false)}
            sx={{ textTransform: 'none', color: '#717171' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleClearReservation}
            variant="contained"
            sx={{
              textTransform: 'none',
              bgcolor: '#B42318',
              '&:hover': { bgcolor: '#9A1E15' },
            }}
          >
            Clear All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reservation;
