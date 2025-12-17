import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Divider,
  useMediaQuery,
  useTheme,
  IconButton,
  Popover,
  Grow,
  Avatar,
  Menu,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  Add,
  Remove,
  TuneRounded,
  Menu as MenuIcon,
  Language as LanguageIcon,
  LocationOn,
  NearMe,
  Close,
  ArrowBack,
  FavoriteBorder,
  PersonOutline,
} from '@mui/icons-material';
import { Dialog, Slide } from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';
import hotelService from '../../services/hotelService';

// Framer Motion spring configurations
const smoothSpring = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

const gentleSpring = {
  type: 'spring',
  stiffness: 200,
  damping: 25,
};

// CSS transitions for hover effects
const springTransition = 'all 0.3s cubic-bezier(0.2, 0, 0, 1)';
const fastSpring = 'all 0.2s cubic-bezier(0.2, 0, 0, 1)';

const Hero = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isScrolled, setIsScrolled] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeField, setActiveField] = useState(null);

  // Search state
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [guests, setGuests] = useState(2);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Locations state
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Popover states
  const [dateAnchor, setDateAnchor] = useState(null);
  const [guestAnchor, setGuestAnchor] = useState(null);
  const [locationAnchor, setLocationAnchor] = useState(null);

  // Menu states
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Transition for full screen dialog
  const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  });

  // Ref for search bar
  const searchBarRef = useRef(null);

  // Track last scroll direction to prevent oscillation
  const lastScrollY = useRef(0);
  const scrollDirection = useRef('up');
  const isManualExpand = useRef(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;

          // Determine scroll direction
          if (scrollY > lastScrollY.current) {
            scrollDirection.current = 'down';
          } else if (scrollY < lastScrollY.current) {
            scrollDirection.current = 'up';
          }

          lastScrollY.current = scrollY;
          setIsScrolled(scrollY > 10);

          // Only collapse when scrolling DOWN past threshold
          if (scrollDirection.current === 'down' && scrollY > 30 && !isManualExpand.current) {
            setIsExpanded(false);
            setActiveField(null);
          }

          // Only expand when at the very top
          if (scrollY < 5) {
            setIsExpanded(true);
            isManualExpand.current = false;
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle manual expand (clicking collapsed bar)
  const handleExpandSearch = () => {
    isManualExpand.current = true;
    setIsExpanded(true);
    // Reset manual flag after a delay to allow normal scroll behavior
    setTimeout(() => {
      isManualExpand.current = false;
    }, 500);
  };

  // Click outside to collapse expanded search bar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target)) {
        const isPopover = event.target.closest('.MuiPopover-root');
        if (!isPopover && isExpanded && window.scrollY > 10) {
          setIsExpanded(false);
          isManualExpand.current = false;
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  // Fetch hotel locations
  useEffect(() => {
    const fetchLocations = async () => {
      setLoadingLocations(true);
      const result = await hotelService.getAll({ is_active: true });
      if (result.success) {
        const data = Array.isArray(result.data)
          ? result.data
          : result.data?.results || [];

        // Extract unique locations from hotels
        const locationMap = new Map();
        data.forEach(hotel => {
          const key = `${hotel.city}-${hotel.country}`;
          if (!locationMap.has(key)) {
            locationMap.set(key, {
              id: hotel.id,
              city: hotel.city,
              country: hotel.country,
              hotelCount: 1,
            });
          } else {
            locationMap.get(key).hotelCount++;
          }
        });
        setLocations(Array.from(locationMap.values()));
      }
      setLoadingLocations(false);
    };
    fetchLocations();
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedLocation) params.set('city', selectedLocation.city);
    if (checkIn) params.set('checkIn', checkIn.format('YYYY-MM-DD'));
    if (checkOut) params.set('checkOut', checkOut.format('YYYY-MM-DD'));
    if (guests) params.set('guests', guests.toString());
    navigate(`/guest/rooms?${params.toString()}`);
  };

  const handleFieldClick = (field, event) => {
    setIsExpanded(true);
    setActiveField(field);
    if (field === 'where') {
      setLocationAnchor(searchBarRef.current);
    } else if (field === 'dates') {
      setDateAnchor(event.currentTarget);
    } else if (field === 'guests') {
      setGuestAnchor(event.currentTarget);
    }
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setLocationAnchor(null);
    setActiveField(null);
  };

  // User menu handlers
  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);
  const handleLogout = async () => {
    handleCloseUserMenu();
    navigate('/');
    await logout();
  };

  // Collapsed Search Bar (Airbnb style)
  const renderCollapsedSearchBar = () => (
    <Paper
      onClick={handleExpandSearch}
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: '48px',
        borderRadius: '40px',
        border: '1px solid #DDDDDD',
        boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)',
        cursor: 'pointer',
        transition: springTransition,
        '&:hover': {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.08)',
        },
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderRight: '1px solid #DDDDDD',
          '&:hover': { bgcolor: '#F7F7F7' },
          transition: fastSpring,
        }}
      >
        <Typography variant="body2" fontWeight={600} color="#222222" noWrap>
          {selectedLocation ? selectedLocation.city : 'Anywhere'}
        </Typography>
      </Box>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderRight: '1px solid #DDDDDD',
          '&:hover': { bgcolor: '#F7F7F7' },
          transition: fastSpring,
        }}
      >
        <Typography variant="body2" fontWeight={600} color="#222222" noWrap>
          Any week
        </Typography>
      </Box>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          flexGrow: 1,
          '&:hover': { bgcolor: '#F7F7F7' },
          transition: fastSpring,
        }}
      >
        <Typography variant="body2" color="#717171" noWrap>
          Add guests
        </Typography>
      </Box>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          bgcolor: '#FF385C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: 1,
          transition: fastSpring,
          '&:hover': { transform: 'scale(1.04)' },
          '&:active': { transform: 'scale(0.96)' },
        }}
      >
        <Search sx={{ fontSize: 16, color: 'white' }} />
      </Box>
    </Paper>
  );

  // Expanded Search Bar (Airbnb style)
  const renderExpandedSearchBar = () => (
    <Box sx={{ width: '100%', maxWidth: '900px', mx: 'auto' }}>
      <Paper
        ref={searchBarRef}
        elevation={0}
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          borderRadius: { xs: '24px', md: '40px' },
          border: '1px solid #DDDDDD',
          boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)',
          bgcolor: '#FFFFFF',
          overflow: 'hidden',
          transition: springTransition,
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.08)',
          },
        }}
      >
        {/* Where */}
        <Box
          onClick={(e) => handleFieldClick('where', e)}
          sx={{
            flex: 1.2,
            px: { xs: 3, md: 4 },
            py: { xs: 1.5, md: 2 },
            width: { xs: '100%', md: 'auto' },
            textAlign: 'left',
            borderRadius: { xs: '24px', md: '40px' },
            cursor: 'pointer',
            transition: fastSpring,
            bgcolor: activeField === 'where' ? '#EBEBEB' : 'transparent',
            '&:hover': { bgcolor: activeField === 'where' ? '#EBEBEB' : '#F7F7F7' },
          }}
          onMouseEnter={() => setActiveField('where')}
          onMouseLeave={() => !locationAnchor && setActiveField(null)}
        >
          <Typography
            variant="caption"
            display="block"
            sx={{ color: '#222222', fontWeight: 600, fontSize: '12px', letterSpacing: '0.04em' }}
          >
            Where
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: selectedLocation ? '#222222' : '#717171', fontSize: '14px', mt: 0.25 }}
            noWrap
          >
            {selectedLocation ? `${selectedLocation.city}, ${selectedLocation.country}` : 'Search destinations'}
          </Typography>
        </Box>

        <Divider
          orientation={isMobile ? 'horizontal' : 'vertical'}
          flexItem
          sx={{ height: { md: '32px' }, alignSelf: 'center', borderColor: '#DDDDDD' }}
        />

        {/* When */}
        <Box
          onClick={(e) => handleFieldClick('dates', e)}
          sx={{
            flex: 1.5,
            px: { xs: 3, md: 3 },
            py: { xs: 1.5, md: 2 },
            width: { xs: '100%', md: 'auto' },
            textAlign: 'left',
            borderRadius: { xs: '24px', md: '40px' },
            cursor: 'pointer',
            transition: fastSpring,
            bgcolor: activeField === 'dates' ? '#EBEBEB' : 'transparent',
            '&:hover': { bgcolor: activeField === 'dates' ? '#EBEBEB' : '#F7F7F7' },
          }}
          onMouseEnter={() => setActiveField('dates')}
          onMouseLeave={() => setActiveField(null)}
        >
          <Typography
            variant="caption"
            display="block"
            sx={{ color: '#222222', fontWeight: 600, fontSize: '12px', letterSpacing: '0.04em' }}
          >
            When
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: checkIn ? '#222222' : '#717171', fontSize: '14px', mt: 0.25 }}
            noWrap
          >
            {checkIn && checkOut
              ? `${checkIn.format('MMM D')} - ${checkOut.format('MMM D')}`
              : checkIn
                ? `${checkIn.format('MMM D')} - Check out`
                : 'Add dates'}
          </Typography>
        </Box>

        <Divider
          orientation={isMobile ? 'horizontal' : 'vertical'}
          flexItem
          sx={{ height: { md: '32px' }, alignSelf: 'center', borderColor: '#DDDDDD' }}
        />

        {/* Who */}
        <Box
          sx={{
            flex: 1.2,
            display: 'flex',
            width: { xs: '100%', md: 'auto' },
            alignItems: 'center',
            pl: { xs: 3, md: 3 },
            pr: { xs: 1.5, md: 1.5 },
            py: { xs: 1, md: 1 },
            borderRadius: { xs: '24px', md: '40px' },
            bgcolor: activeField === 'guests' ? '#EBEBEB' : 'transparent',
            transition: fastSpring,
            '&:hover': { bgcolor: activeField === 'guests' ? '#EBEBEB' : '#F7F7F7' },
          }}
          onMouseEnter={() => setActiveField('guests')}
          onMouseLeave={() => setActiveField(null)}
        >
          <Box
            onClick={(e) => handleFieldClick('guests', e)}
            sx={{ flexGrow: 1, textAlign: 'left', cursor: 'pointer', py: 1 }}
          >
            <Typography
              variant="caption"
              display="block"
              sx={{ color: '#222222', fontWeight: 600, fontSize: '12px', letterSpacing: '0.04em' }}
            >
              Who
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: guests > 0 ? '#222222' : '#717171', fontSize: '14px', mt: 0.25 }}
              noWrap
            >
              {guests} guest{guests !== 1 ? 's' : ''}
            </Typography>
          </Box>

          <IconButton
            onClick={handleSearch}
            sx={{
              width: '48px',
              height: '48px',
              bgcolor: '#FF385C',
              color: 'white',
              transition: springTransition,
              '&:hover': { bgcolor: '#E31C5F', transform: 'scale(1.04)' },
              '&:active': { transform: 'scale(0.96)' },
            }}
          >
            <Search sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </Paper>

      {/* Date Popover */}
      <Popover
        open={Boolean(dateAnchor)}
        anchorEl={dateAnchor}
        onClose={() => setDateAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        PaperProps={{
          sx: {
            p: 2,
            borderRadius: '24px',
            mt: 2,
            boxShadow: '0 8px 28px rgba(0,0,0,0.28)',
            border: 'none',
          },
        }}
        TransitionComponent={Grow}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <DateCalendar
                value={checkIn}
                onChange={(newValue) => {
                  if (!checkIn || (checkIn && checkOut)) {
                    setCheckIn(newValue);
                    setCheckOut(null);
                  } else if (newValue.isAfter(checkIn)) {
                    setCheckOut(newValue);
                    // Optional: close on check-out selection
                  } else {
                    setCheckIn(newValue);
                  }
                }}
                disablePast
                views={['year', 'month', 'day']}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
              <Button
                variant="text"
                sx={{
                  color: '#222222',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  textTransform: 'none',
                  mr: 2
                }}
                onClick={() => { setCheckIn(null); setCheckOut(null); }}
              >
                Clear dates
              </Button>
              <Button
                variant="contained"
                sx={{
                  borderRadius: '8px',
                  bgcolor: '#222222',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  '&:hover': { bgcolor: '#000000' },
                }}
                onClick={() => setDateAnchor(null)}
              >
                Close
              </Button>
            </Box>
          </Box>
        </LocalizationProvider>
      </Popover>

      {/* Guests Popover */}
      <Popover
        open={Boolean(guestAnchor)}
        anchorEl={guestAnchor}
        onClose={() => setGuestAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        PaperProps={{
          sx: {
            p: 3,
            borderRadius: '16px',
            mt: 1.5,
            minWidth: 280,
            boxShadow: '0 4px 32px rgba(0,0,0,0.12)',
            border: '1px solid #EBEBEB',
          },
        }}
        TransitionComponent={Grow}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography fontWeight={600} color="#222222">Guests</Typography>
            <Typography variant="body2" color="#717171">How many guests?</Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              border: '1px solid #DDDDDD',
              borderRadius: '24px',
              px: 1,
              py: 0.5,
            }}
          >
            <IconButton
              size="small"
              onClick={() => setGuests(Math.max(1, guests - 1))}
              disabled={guests <= 1}
              sx={{
                border: '1px solid',
                borderColor: guests <= 1 ? '#EBEBEB' : '#DDDDDD',
                color: guests <= 1 ? '#EBEBEB' : '#222222',
                width: 32,
                height: 32,
                transition: fastSpring,
                '&:hover': { borderColor: '#222222', bgcolor: 'transparent' },
              }}
            >
              <Remove sx={{ fontSize: 16 }} />
            </IconButton>
            <Typography sx={{ minWidth: 24, textAlign: 'center', fontWeight: 600, color: '#222222' }}>
              {guests}
            </Typography>
            <IconButton
              size="small"
              onClick={() => setGuests(Math.min(10, guests + 1))}
              disabled={guests >= 10}
              sx={{
                border: '1px solid',
                borderColor: guests >= 10 ? '#EBEBEB' : '#DDDDDD',
                color: guests >= 10 ? '#EBEBEB' : '#222222',
                width: 32,
                height: 32,
                transition: fastSpring,
                '&:hover': { borderColor: '#222222', bgcolor: 'transparent' },
              }}
            >
              <Add sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>
        <Button
          fullWidth
          variant="contained"
          sx={{
            mt: 3,
            borderRadius: '12px',
            bgcolor: '#222222',
            textTransform: 'none',
            fontWeight: 600,
            py: 1.25,
            '&:hover': { bgcolor: '#000000' },
          }}
          onClick={() => setGuestAnchor(null)}
        >
          Done
        </Button>
      </Popover>
    </Box>
  );

  // Mobile Search Bar (Compact Pill - Airbnb style centered)
  const renderMobileSearchBar = () => (
    <Paper
      onClick={() => setMobileSearchOpen(true)}
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        height: '56px',
        borderRadius: '32px',
        border: '1px solid #DDDDDD',
        boxShadow: '0 3px 12px rgba(0,0,0,0.08)',
        px: 3,
        mx: 2,
        width: '100%',
        maxWidth: '500px',
        bgcolor: '#FFFFFF',
        cursor: 'pointer',
        transition: fastSpring,
        '&:active': {
          transform: 'scale(0.98)',
        },
      }}
    >
      <Search sx={{ fontSize: 20, color: '#222222' }} />
      <Typography
        variant="body2"
        fontWeight={600}
        color="#222222"
        sx={{ letterSpacing: '-0.01em' }}
      >
        Start your search
      </Typography>
    </Paper>
  );

  // Mobile Search Overlay (Full Screen Wizard)
  const renderMobileSearchOverlay = () => (
    <Dialog
      fullScreen
      open={mobileSearchOpen}
      onClose={() => setMobileSearchOpen(false)}
      TransitionComponent={Transition}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid #F7F7F7',
          gap: 2,
        }}
      >
        <IconButton
          edge="start"
          onClick={() => setMobileSearchOpen(false)}
          sx={{
            bgcolor: '#F7F7F7',
            '&:hover': { bgcolor: '#EBEBEB' },
          }}
        >
          <Close sx={{ fontSize: 20 }} />
        </IconButton>
        <Typography variant="h6" fontWeight={700} sx={{ flex: 1, textAlign: 'center', mr: 5 }}>
          Stays
        </Typography>
      </Box>

      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', pb: 10 }}>
        {/* Where Section */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: '24px',
            border: '1px solid',
            borderColor: activeField === 'where' ? '#222222' : '#EBEBEB',
            boxShadow: activeField === 'where' ? '0 6px 16px rgba(0,0,0,0.08)' : 'none',
          }}
          onClick={() => setActiveField('where')}
        >
          <Typography variant="caption" fontWeight={800} color="#222222" sx={{ fontSize: '14px', mb: 1, display: 'block' }}>
            Where to?
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              border: '1px solid #B0B0B0',
              borderRadius: '12px',
              p: 1.5,
            }}
          >
            <Search sx={{ color: '#222222' }} />
            <Typography variant="body1" color={selectedLocation ? '#222222' : '#717171'}>
              {selectedLocation ? `${selectedLocation.city}, ${selectedLocation.country}` : 'Wait, I\'m flexible'}
            </Typography>
          </Box>

          {/* Expanded Where Content (Suggested Destinations) */}
          {activeField === 'where' && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="caption" fontWeight={700} color="#717171" sx={{ mb: 1, display: 'block' }}>
                SUGGESTED DESTINATIONS
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box
                  onClick={(e) => { e.stopPropagation(); setSelectedLocation(null); setActiveField('dates'); }}
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, borderRadius: '8px', '&:active': { bgcolor: '#F7F7F7' } }}
                >
                  <Box sx={{ p: 1, bgcolor: '#F7F7F7', borderRadius: '8px' }}><NearMe sx={{ color: '#FF385C' }} /></Box>
                  <Typography fontWeight={600}>I'm flexible</Typography>
                </Box>
                {locations.slice(0, 3).map((loc) => (
                  <Box
                    key={loc.id}
                    onClick={(e) => { e.stopPropagation(); setSelectedLocation(loc); setActiveField('dates'); }}
                    sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, borderRadius: '8px', '&:active': { bgcolor: '#F7F7F7' } }}
                  >
                    <Box sx={{ p: 1, bgcolor: '#F7F7F7', borderRadius: '8px' }}><LocationOn sx={{ color: '#717171' }} /></Box>
                    <Typography fontWeight={600}>{loc.city}, {loc.country}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Paper>

        {/* When Section */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: '24px',
            border: '1px solid',
            borderColor: activeField === 'dates' ? '#222222' : '#EBEBEB',
            boxShadow: activeField === 'dates' ? '0 6px 16px rgba(0,0,0,0.08)' : 'none',
          }}
          onClick={() => setActiveField('dates')}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" fontWeight={800} color="#222222" sx={{ fontSize: '14px' }}>
              When's your trip?
            </Typography>
            <Typography variant="body2" fontWeight={600} color="#222222">
              {checkIn ? (checkOut ? `${checkIn.format('MMM D')} - ${checkOut.format('MMM D')}` : checkIn.format('MMM D')) : 'Add dates'}
            </Typography>
          </Box>

          {activeField === 'dates' && (
            <Box sx={{ mt: 2 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateCalendar
                  value={checkIn}
                  onChange={(newValue) => {
                    if (!checkIn || (checkIn && checkOut)) {
                      setCheckIn(newValue);
                      setCheckOut(null);
                    } else if (newValue.isAfter(checkIn)) {
                      setCheckOut(newValue);
                      setActiveField('guests'); // Auto-advance
                    } else {
                      setCheckIn(newValue);
                    }
                  }}
                  disablePast
                  views={['day']}
                />
              </LocalizationProvider>
            </Box>
          )}
        </Paper>

        {/* Who Section */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: '24px',
            border: '1px solid',
            borderColor: activeField === 'guests' ? '#222222' : '#EBEBEB',
            boxShadow: activeField === 'guests' ? '0 6px 16px rgba(0,0,0,0.08)' : 'none',
          }}
          onClick={() => setActiveField('guests')}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" fontWeight={800} color="#222222" sx={{ fontSize: '14px' }}>
              Who's coming?
            </Typography>
            <Typography variant="body2" fontWeight={600} color="#222222">
              {guests} guest{guests !== 1 ? 's' : ''}
            </Typography>
          </Box>

          {activeField === 'guests' && (
            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography fontWeight={600}>Adults</Typography>
                <Typography variant="caption" color="#717171">Ages 13 or above</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton
                  onClick={(e) => { e.stopPropagation(); setGuests(Math.max(1, guests - 1)); }}
                  disabled={guests <= 1}
                  sx={{ border: '1px solid #DDDDDD' }}
                >
                  <Remove />
                </IconButton>
                <Typography fontWeight={600}>{guests}</Typography>
                <IconButton
                  onClick={(e) => { e.stopPropagation(); setGuests(Math.min(10, guests + 1)); }}
                  sx={{ border: '1px solid #DDDDDD' }}
                >
                  <Add />
                </IconButton>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Footer */}
      <Paper
        elevation={0}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          borderTop: '1px solid #EBEBEB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: '#FFFFFF',
          zIndex: 10
        }}
      >
        <Button
          variant="text"
          sx={{ fontWeight: 600, color: '#222222', textDecoration: 'underline', textTransform: 'none' }}
          onClick={() => {
            setCheckIn(null);
            setCheckOut(null);
            setSelectedLocation(null);
            setGuests(1);
          }}
        >
          Clear all
        </Button>
        <Button
          variant="contained"
          onClick={() => { setMobileSearchOpen(false); handleSearch(); }}
          startIcon={<Search />}
          sx={{
            bgcolor: '#FF385C',
            color: 'white',
            fontWeight: 600,
            textTransform: 'none',
            px: 3,
            py: 1.5,
            borderRadius: '12px',
            fontSize: '16px',
            '&:hover': { bgcolor: '#E31C5F' }
          }}
        >
          Search
        </Button>
      </Paper>
    </Dialog>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <motion.div
        layout
        transition={gentleSpring}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #EBEBEB',
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 5, lg: 10, xl: 12 } }}>
          {/* Top Row - Logo and Menu (fixed height) */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              justifyContent: 'space-between',
              pt: 2,
              pb: 2,
            }}
          >
            {/* Logo - Left side */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
              }}
              onClick={() => navigate('/')}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #FF385C 0%, #E61E4D 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '18px' }}>H</Typography>
              </Box>
              <Typography sx={{ color: '#FF385C', fontWeight: 700, fontSize: '20px', letterSpacing: '-0.02em' }}>
                Hotels
              </Typography>
            </Box>

            {/* Center - Collapsed search bar when scrolled */}
            <AnimatePresence mode="wait">
              {!isExpanded && (
                <motion.div
                  key="collapsed-search"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  style={{ flex: 1, display: 'flex', justifyContent: 'center' }}
                >
                  {renderCollapsedSearchBar()}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Right side - User Menu */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              {/* Browse Rooms link */}
              <Button
                onClick={() => navigate('/guest/rooms')}
                sx={{
                  color: '#222222',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '14px',
                  borderRadius: '24px',
                  px: 2,
                  py: 1,
                  transition: fastSpring,
                  '&:hover': { bgcolor: '#F7F7F7' },
                }}
              >
                Browse Rooms
              </Button>

              {/* Language Icon */}
              <IconButton size="small">
                <LanguageIcon sx={{ fontSize: 20, color: '#222222' }} />
              </IconButton>

              {/* User Menu Button (Airbnb style) */}
              <Box
                onClick={isAuthenticated ? handleOpenUserMenu : () => navigate('/login')}
                sx={{
                  border: '1px solid #DDDDDD',
                  borderRadius: '24px',
                  p: '5px',
                  pl: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  cursor: 'pointer',
                  transition: fastSpring,
                  '&:hover': {
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <MenuIcon sx={{ fontSize: 16, color: '#717171' }} />
                <Avatar
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor: '#717171',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                  src={user?.avatar}
                >
                  {user ? user.username[0].toUpperCase() : null}
                </Avatar>
              </Box>

              {/* User Dropdown Menu */}
              <Menu
                sx={{ mt: '45px' }}
                anchorEl={anchorElUser}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                keepMounted
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                    mt: 1.5,
                    borderRadius: '12px',
                    minWidth: 240,
                    border: '1px solid #EBEBEB',
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="body2" fontWeight={600} color="#222222">
                    {isAuthenticated ? `Hi, ${user?.first_name || user?.username}` : 'Welcome'}
                  </Typography>
                  {isAuthenticated && (
                    <Typography variant="caption" color="#717171">
                      {user?.email}
                    </Typography>
                  )}
                </Box>
                <Divider />
                <MenuItem
                  onClick={() => { handleCloseUserMenu(); navigate('/guest/rooms'); }}
                  sx={{ py: 1.5, fontSize: '14px' }}
                >
                  Browse Rooms
                </MenuItem>
                <MenuItem
                  onClick={() => { handleCloseUserMenu(); navigate('/guest/my-bookings'); }}
                  sx={{ py: 1.5, fontSize: '14px' }}
                >
                  My Bookings
                </MenuItem>
                <MenuItem
                  onClick={() => { handleCloseUserMenu(); navigate('/guest/profile'); }}
                  sx={{ py: 1.5, fontSize: '14px' }}
                >
                  Account Settings
                </MenuItem>
                <Divider />
                <MenuItem
                  onClick={handleLogout}
                  sx={{ py: 1.5, fontSize: '14px', color: '#717171' }}
                >
                  Log out
                </MenuItem>
              </Menu>
            </Box>
          </Box>

          {/* Second Row - Expanded Search Bar (desktop only) */}
          <AnimatePresence mode="wait">
            {!isMobile && isExpanded && (
              <motion.div
                key="expanded-search"
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  paddingBottom: '20px',
                  overflow: 'hidden',
                }}
              >
                {renderExpandedSearchBar()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Search Bar */}
          {isMobile && (
            <Box
              sx={{
                py: 2,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              {renderMobileSearchBar()}
            </Box>
          )}
        </Container>
      </motion.div>

      {/* Location Popover */}
      <Popover
        open={Boolean(locationAnchor)}
        anchorEl={locationAnchor}
        onClose={() => {
          setLocationAnchor(null);
          setActiveField(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            mt: 1.5,
            minWidth: 400,
            maxWidth: 450,
            boxShadow: '0 4px 32px rgba(0,0,0,0.12)',
            border: '1px solid #EBEBEB',
            overflow: 'hidden',
          },
        }}
        TransitionComponent={Grow}
      >
        <Box sx={{ p: 2.5 }}>
          <Typography
            sx={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#222222',
              letterSpacing: '0.04em',
              mb: 2,
            }}
          >
            SUGGESTED DESTINATIONS
          </Typography>

          {loadingLocations ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} sx={{ color: '#FF385C' }} />
            </Box>
          ) : locations.length === 0 ? (
            <Typography sx={{ color: '#717171', fontSize: '14px', py: 2 }}>
              No destinations available
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {/* Flexible search option */}
              <Box
                onClick={() => {
                  setSelectedLocation(null);
                  setLocationAnchor(null);
                  setActiveField(null);
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1.5,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: fastSpring,
                  '&:hover': { bgcolor: '#F7F7F7' },
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    bgcolor: '#F7F7F7',
                    border: '1px solid #EBEBEB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <NearMe sx={{ fontSize: 24, color: '#FF385C' }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '15px', color: '#222222' }}>
                    I'm flexible
                  </Typography>
                  <Typography sx={{ fontSize: '13px', color: '#717171' }}>
                    Search all destinations
                  </Typography>
                </Box>
              </Box>

              {/* Location options */}
              {locations.map((location) => (
                <Box
                  key={`${location.city}-${location.country}`}
                  onClick={() => handleLocationSelect(location)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 1.5,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: fastSpring,
                    bgcolor: selectedLocation?.city === location.city ? '#F7F7F7' : 'transparent',
                    '&:hover': { bgcolor: '#F7F7F7' },
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      bgcolor: '#F7F7F7',
                      border: '1px solid #EBEBEB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <LocationOn sx={{ fontSize: 24, color: '#717171' }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '15px', color: '#222222' }}>
                      {location.city}
                    </Typography>
                    <Typography sx={{ fontSize: '13px', color: '#717171' }}>
                      {location.country} · {location.hotelCount} {location.hotelCount === 1 ? 'property' : 'properties'}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Popover>
      {renderMobileSearchOverlay()}

      {/* Mobile Bottom Navigation Bar */}
      {isMobile && (
        <Paper
          elevation={0}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            borderTop: '1px solid #EBEBEB',
            bgcolor: '#FFFFFF',
            py: 1,
            px: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
            }}
          >
            {/* Explore */}
            <Box
              onClick={() => navigate('/')}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                py: 0.5,
              }}
            >
              <Search sx={{ fontSize: 24, color: '#FF385C' }} />
              <Typography sx={{ fontSize: '10px', fontWeight: 600, color: '#FF385C' }}>
                Explore
              </Typography>
            </Box>

            {/* Bookings / Wishlists */}
            <Box
              onClick={() => navigate(isAuthenticated ? '/guest/my-bookings' : '/login')}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                py: 0.5,
              }}
            >
              <FavoriteBorder sx={{ fontSize: 24, color: '#717171' }} />
              <Typography sx={{ fontSize: '10px', fontWeight: 500, color: '#717171' }}>
                Bookings
              </Typography>
            </Box>

            {/* Log in / Profile */}
            <Box
              onClick={() => navigate(isAuthenticated ? '/guest/profile' : '/login')}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                py: 0.5,
              }}
            >
              <PersonOutline sx={{ fontSize: 24, color: '#717171' }} />
              <Typography sx={{ fontSize: '10px', fontWeight: 500, color: '#717171' }}>
                {isAuthenticated ? 'Profile' : 'Log in'}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}
    </LocalizationProvider>
  );
};

export default Hero;
