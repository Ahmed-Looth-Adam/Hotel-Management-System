import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Fade,
  Grow,
  Avatar,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
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
} from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';
import hotelService from '../../services/hotelService';

// Airbnb-style animation timing
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Ref for search bar
  const searchBarRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrolled = scrollY > 50;
      setIsScrolled(scrolled);

      // Hysteresis for expansion state to prevent flickering
      if (scrollY > 100) {
        setIsExpanded(false);
        setActiveField(null);
      } else if (scrollY < 50) {
        setIsExpanded(true);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      setLocationAnchor(event.currentTarget);
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
      onClick={() => setIsExpanded(true)}
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
    <Box sx={{ width: '100%', maxWidth: '850px', mx: 'auto' }}>
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

          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{
              minWidth: { xs: '48px', md: 'auto' },
              height: '48px',
              borderRadius: '24px',
              px: { xs: 0, md: 2.5 },
              bgcolor: '#FF385C',
              color: 'white',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '16px',
              boxShadow: 'none',
              transition: springTransition,
              '&:hover': { bgcolor: '#E31C5F', boxShadow: 'none', transform: 'scale(1.04)' },
              '&:active': { transform: 'scale(0.96)' },
            }}
          >
            <Search sx={{ fontSize: 20 }} />
            {!isMobile && <Typography sx={{ ml: 1, fontWeight: 600 }}>Search</Typography>}
          </Button>
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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid #EBEBEB',
          transition: springTransition,
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              py: { xs: 2, md: isExpanded ? 2.5 : 1.5 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: springTransition,
            }}
          >
            {/* Logo - Left side */}
            <Box
              sx={{
                position: 'absolute',
                left: { xs: 16, md: 40 },
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
              }}
              onClick={() => navigate('/')}
            >
              {/* Mobile Menu Icon */}
              {isMobile && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMobileMenuOpen(true);
                  }}
                  sx={{ mr: 0.5 }}
                >
                  <MenuIcon sx={{ fontSize: 24, color: '#222222' }} />
                </IconButton>
              )}
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
              {!isMobile && (
                <Typography sx={{ color: '#FF385C', fontWeight: 700, fontSize: '20px', letterSpacing: '-0.02em' }}>
                  Hotels
                </Typography>
              )}
            </Box>

            {/* Search Bar - Center */}
            <Box
              sx={{
                width: '100%',
                maxWidth: isExpanded ? '850px' : '400px',
                transition: springTransition,
                px: { xs: 8, md: 0 },
              }}
            >
              {isScrolled && !isExpanded ? (
                renderCollapsedSearchBar()
              ) : (
                <Fade in={isExpanded} timeout={300}>
                  <Box>{renderExpandedSearchBar()}</Box>
                </Fade>
              )}
            </Box>

            {/* Right side - User Menu */}
            <Box
              sx={{
                position: 'absolute',
                right: { xs: 16, md: 40 },
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              {/* Browse Rooms link (desktop only) */}
              {!isMobile && (
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
              )}

              {/* Language Icon */}
              <IconButton size="small" sx={{ display: { xs: 'none', md: 'flex' } }}>
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
        </Container>
      </Box>

      {/* Mobile Menu Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{
          sx: { width: 280, borderRadius: '0 16px 16px 0' },
        }}
      >
        <Box sx={{ p: 3 }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #FF385C 0%, #E61E4D 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '22px' }}>H</Typography>
            </Box>
            <Typography sx={{ color: '#FF385C', fontWeight: 700, fontSize: '22px' }}>Hotels</Typography>
          </Box>

          {isAuthenticated && (
            <Box sx={{ mb: 3, pb: 2, borderBottom: '1px solid #EBEBEB' }}>
              <Typography fontWeight={600} color="#222222">
                Hi, {user?.first_name || user?.username}
              </Typography>
              <Typography variant="body2" color="#717171">
                {user?.email}
              </Typography>
            </Box>
          )}

          <List disablePadding>
            <ListItemButton
              onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
              sx={{ borderRadius: '8px', mb: 0.5 }}
            >
              <ListItemText primary="Home" primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
            <ListItemButton
              onClick={() => { navigate('/guest/rooms'); setMobileMenuOpen(false); }}
              sx={{ borderRadius: '8px', mb: 0.5 }}
            >
              <ListItemText primary="Browse Rooms" />
            </ListItemButton>
            {isAuthenticated && (
              <>
                <ListItemButton
                  onClick={() => { navigate('/guest/my-bookings'); setMobileMenuOpen(false); }}
                  sx={{ borderRadius: '8px', mb: 0.5 }}
                >
                  <ListItemText primary="My Bookings" />
                </ListItemButton>
                <ListItemButton
                  onClick={() => { navigate('/guest/profile'); setMobileMenuOpen(false); }}
                  sx={{ borderRadius: '8px', mb: 0.5 }}
                >
                  <ListItemText primary="Account" />
                </ListItemButton>
              </>
            )}
            <Divider sx={{ my: 2 }} />
            {isAuthenticated ? (
              <ListItemButton
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                sx={{ borderRadius: '8px' }}
              >
                <ListItemText primary="Log out" primaryTypographyProps={{ color: '#717171' }} />
              </ListItemButton>
            ) : (
              <>
                <ListItemButton
                  onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                  sx={{ borderRadius: '8px', mb: 0.5 }}
                >
                  <ListItemText primary="Log in" primaryTypographyProps={{ fontWeight: 600 }} />
                </ListItemButton>
                <ListItemButton
                  onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}
                  sx={{ borderRadius: '8px' }}
                >
                  <ListItemText primary="Sign up" />
                </ListItemButton>
              </>
            )}
          </List>
        </Box>
      </Drawer>

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
    </LocalizationProvider>
  );
};

export default Hero;
