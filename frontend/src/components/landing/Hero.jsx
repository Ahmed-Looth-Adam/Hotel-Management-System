import React, { useState } from 'react';
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
  TextField,
  Popover,
  IconButton,
} from '@mui/material';
import { Search, Add, Remove } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const Hero = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Search state
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [guests, setGuests] = useState(2);

  // Popover states
  const [dateAnchor, setDateAnchor] = useState(null);
  const [guestAnchor, setGuestAnchor] = useState(null);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (checkIn) params.set('checkIn', checkIn.format('YYYY-MM-DD'));
    if (checkOut) params.set('checkOut', checkOut.format('YYYY-MM-DD'));
    if (guests) params.set('guests', guests.toString());

    navigate(`/guest/rooms?${params.toString()}`);
  };

  const formatDateRange = () => {
    if (checkIn && checkOut) {
      return `${checkIn.format('MMM D')} - ${checkOut.format('MMM D')}`;
    }
    if (checkIn) {
      return `${checkIn.format('MMM D')} - Add checkout`;
    }
    return 'Add dates';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ position: 'relative', bgcolor: 'black', color: 'white', minHeight: '600px', display: 'flex', alignItems: 'center' }}>
        {/* Background Image */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.6,
            zIndex: 1,
          }}
        />

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ maxWidth: '850px', mx: 'auto', textAlign: 'center' }}>
            <Typography
              variant="h1"
              sx={{
                color: 'white',
                fontWeight: 800,
                mb: 2,
                fontSize: { xs: '2.5rem', md: '4rem' },
                textShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              Find your next stay
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: 'white',
                mb: 6,
                fontWeight: 500,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              Search hotels across London, Paris, New York and more...
            </Typography>

            {/* Search Bar */}
            <Paper
              elevation={3}
              sx={{
                p: '8px',
                borderRadius: { xs: 4, md: 40 },
                bgcolor: 'white',
                maxWidth: '850px',
                width: '100%',
                mx: 'auto',
                boxShadow: '0px 16px 32px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'center',
              }}
            >
              {/* Location - Direct link to browse */}
              <Box
                onClick={() => navigate('/guest/rooms')}
                sx={{
                  flex: 1.2,
                  px: 4,
                  py: 1.5,
                  width: { xs: '100%', md: 'auto' },
                  textAlign: 'left',
                  borderRadius: 30,
                  '&:hover': { bgcolor: '#f7f7f7' },
                  cursor: 'pointer',
                }}
              >
                <Typography variant="caption" display="block" color="text.primary" fontWeight="bold">
                  Where
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  Search all destinations
                </Typography>
              </Box>

              <Divider
                orientation={isMobile ? 'horizontal' : 'vertical'}
                flexItem
                sx={{ my: { xs: 1, md: 0 }, height: { md: '32px' }, alignSelf: 'center' }}
              />

              {/* Dates */}
              <Box
                onClick={(e) => setDateAnchor(e.currentTarget)}
                sx={{
                  flex: 1,
                  px: 4,
                  py: 1.5,
                  width: { xs: '100%', md: 'auto' },
                  textAlign: 'left',
                  borderRadius: 30,
                  '&:hover': { bgcolor: '#f7f7f7' },
                  cursor: 'pointer',
                }}
              >
                <Typography variant="caption" display="block" color="text.primary" fontWeight="bold">
                  Check in - Check out
                </Typography>
                <Typography variant="body2" color={checkIn ? 'text.primary' : 'text.secondary'} noWrap>
                  {formatDateRange()}
                </Typography>
              </Box>

              <Popover
                open={Boolean(dateAnchor)}
                anchorEl={dateAnchor}
                onClose={() => setDateAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                PaperProps={{ sx: { p: 3, borderRadius: 3, mt: 1 } }}
              >
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <DatePicker
                    label="Check-in"
                    value={checkIn}
                    onChange={(newValue) => setCheckIn(newValue)}
                    minDate={dayjs()}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                  <DatePicker
                    label="Check-out"
                    value={checkOut}
                    onChange={(newValue) => setCheckOut(newValue)}
                    minDate={checkIn || dayjs()}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ mt: 2, borderRadius: 2 }}
                  onClick={() => setDateAnchor(null)}
                >
                  Done
                </Button>
              </Popover>

              <Divider
                orientation={isMobile ? 'horizontal' : 'vertical'}
                flexItem
                sx={{ my: { xs: 1, md: 0 }, height: { md: '32px' }, alignSelf: 'center' }}
              />

              {/* Guests + Button Container */}
              <Box
                sx={{
                  flex: 1.3,
                  display: 'flex',
                  width: { xs: '100%', md: 'auto' },
                  alignItems: 'center',
                  pl: 4,
                  pr: 1,
                  py: 0.5,
                  borderRadius: 30,
                }}
              >
                <Box
                  onClick={(e) => setGuestAnchor(e.currentTarget)}
                  sx={{
                    flexGrow: 1,
                    textAlign: 'left',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#f7f7f7' },
                    borderRadius: 2,
                    py: 1,
                    px: 1,
                    ml: -1,
                  }}
                >
                  <Typography variant="caption" display="block" color="text.primary" fontWeight="bold">
                    Who
                  </Typography>
                  <Typography variant="body2" color={guests > 0 ? 'text.primary' : 'text.secondary'} noWrap>
                    {guests} guest{guests !== 1 ? 's' : ''}
                  </Typography>
                </Box>

                <Popover
                  open={Boolean(guestAnchor)}
                  anchorEl={guestAnchor}
                  onClose={() => setGuestAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                  PaperProps={{ sx: { p: 3, borderRadius: 3, mt: 1, minWidth: 200 } }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography fontWeight={500}>Guests</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        disabled={guests <= 1}
                      >
                        <Remove />
                      </IconButton>
                      <Typography sx={{ minWidth: 24, textAlign: 'center' }}>{guests}</Typography>
                      <IconButton
                        size="small"
                        onClick={() => setGuests(Math.min(10, guests + 1))}
                        disabled={guests >= 10}
                      >
                        <Add />
                      </IconButton>
                    </Box>
                  </Box>
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2, borderRadius: 2 }}
                    onClick={() => setGuestAnchor(null)}
                  >
                    Done
                  </Button>
                </Popover>

                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSearch}
                  sx={{
                    minWidth: '48px',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    p: 0,
                    ml: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  }}
                >
                  <Search sx={{ fontSize: 22 }} />
                </Button>
              </Box>
            </Paper>
          </Box>
        </Container>
      </Box>
    </LocalizationProvider>
  );
};

export default Hero;
