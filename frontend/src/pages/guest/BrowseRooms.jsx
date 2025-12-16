/**
 * Browse Rooms Page - Guest view for browsing available rooms
 *
 * Features:
 * - Search by date range, guests, hotel
 * - Filter by room type, price range
 * - Card-based room display
 * - Direct booking link
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Rating,
  Paper,
  Divider,
  InputAdornment,
  Slider,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  Hotel,
  Person,
  CalendarMonth,
  KingBed,
  MeetingRoom,
  FilterList,
} from '@mui/icons-material';
import { roomService, hotelService } from '../../services';
import { useNotification } from '../../hooks/useNotification';

const BrowseRooms = () => {
  const navigate = useNavigate();
  const { showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [filters, setFilters] = useState({
    hotel: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    roomType: '',
    maxPrice: 500,
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const [roomsResult, hotelsResult] = await Promise.all([
      roomService.getAll({ is_active: true, is_available: true }),
      hotelService.getAll({ is_active: true }),
    ]);

    if (roomsResult.success) {
      setRooms(roomsResult.data.results || roomsResult.data);
    } else {
      showError('Failed to load rooms');
    }

    if (hotelsResult.success) {
      setHotels(hotelsResult.data.results || hotelsResult.data);
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    setLoading(true);
    const params = {
      is_active: true,
      is_available: true,
    };
    if (filters.hotel) params.hotel = filters.hotel;
    if (filters.roomType) params.room_type = filters.roomType;

    const result = await roomService.getAll(params);
    if (result.success) {
      setRooms(result.data.results || result.data);
    } else {
      showError('Search failed');
    }
    setLoading(false);
  };

  const handleBookRoom = (roomId) => {
    const queryParams = new URLSearchParams();
    if (filters.checkIn) queryParams.append('checkIn', filters.checkIn);
    if (filters.checkOut) queryParams.append('checkOut', filters.checkOut);
    if (filters.guests) queryParams.append('guests', filters.guests);
    navigate(`/guest/rooms/${roomId}?${queryParams.toString()}`);
  };

  const getRoomTypeLabel = (type) => {
    const labels = {
      standard: 'Standard',
      superior: 'Superior',
      deluxe: 'Deluxe',
      suite: 'Suite',
      family: 'Family',
    };
    return labels[type] || type;
  };

  const getRoomTypeColor = (type) => {
    const colors = {
      standard: 'default',
      superior: 'primary',
      deluxe: 'secondary',
      suite: 'warning',
      family: 'success',
    };
    return colors[type] || 'default';
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Find Your Perfect Room
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Browse our selection of rooms and book your stay
        </Typography>
      </Box>

      {/* Search Filters */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Hotel</InputLabel>
              <Select
                value={filters.hotel}
                label="Hotel"
                onChange={(e) => setFilters({ ...filters, hotel: e.target.value })}
              >
                <MenuItem value="">All Hotels</MenuItem>
                {hotels.map((hotel) => (
                  <MenuItem key={hotel.id} value={hotel.id}>
                    {hotel.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Check-in"
              type="date"
              value={filters.checkIn}
              onChange={(e) => setFilters({ ...filters, checkIn: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Check-out"
              type="date"
              value={filters.checkOut}
              onChange={(e) => setFilters({ ...filters, checkOut: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={1}>
            <TextField
              fullWidth
              size="small"
              label="Guests"
              type="number"
              value={filters.guests}
              onChange={(e) => setFilters({ ...filters, guests: parseInt(e.target.value) || 1 })}
              InputProps={{ inputProps: { min: 1, max: 10 } }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Room Type</InputLabel>
              <Select
                value={filters.roomType}
                label="Room Type"
                onChange={(e) => setFilters({ ...filters, roomType: e.target.value })}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="standard">Standard</MenuItem>
                <MenuItem value="superior">Superior</MenuItem>
                <MenuItem value="deluxe">Deluxe</MenuItem>
                <MenuItem value="suite">Suite</MenuItem>
                <MenuItem value="family">Family</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Search />}
              onClick={handleSearch}
              sx={{ height: 40 }}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Results */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : rooms.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <MeetingRoom sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No rooms found matching your criteria
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your filters
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {rooms.map((room) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={room.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="div"
                  sx={{
                    height: 180,
                    bgcolor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Hotel sx={{ fontSize: 64, color: 'grey.400' }} />
                </CardMedia>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                    <Typography variant="h6" component="h2">
                      Room {room.room_number}
                    </Typography>
                    <Chip
                      label={getRoomTypeLabel(room.room_type_category)}
                      color={getRoomTypeColor(room.room_type_category)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {room.hotel_name}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Person fontSize="small" color="action" />
                      <Typography variant="body2">{room.max_occupancy} guests</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <KingBed fontSize="small" color="action" />
                      <Typography variant="body2">{room.bed_size}</Typography>
                    </Box>
                  </Box>
                  {room.view_name && (
                    <Typography variant="body2" color="text.secondary">
                      {room.view_name}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleBookRoom(room.id)}
                  >
                    View & Book
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default BrowseRooms;
