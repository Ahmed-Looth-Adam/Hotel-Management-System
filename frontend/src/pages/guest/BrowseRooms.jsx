/**
 * Browse Rooms Page - Guest view for browsing available rooms
 *
 * Features:
 * - Search by date range, guests, hotel
 * - Filter by room type, price range
 * - Card-based room display with images
 * - Direct booking link
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Paper,
  Divider,
  CircularProgress,
  alpha,
  Skeleton,
} from '@mui/material';
import {
  Search,
  Hotel as HotelIcon,
  Person,
  KingBed,
  MeetingRoom,
  Visibility,
  LocationOn,
} from '@mui/icons-material';
import { roomService, hotelService } from '../../services';
import { useNotification } from '../../hooks/useNotification';

// Room types matching CLAUDE.md documentation
const ROOM_TYPES = [
  { value: 'standard', label: 'Standard Double', color: '#607d8b' },
  { value: 'deluxe', label: 'Deluxe King', color: '#1976d2' },
  { value: 'suite', label: 'Family Suite', color: '#7b1fa2' },
  { value: 'penthouse', label: 'Penthouse', color: '#c62828' },
];

const BrowseRooms = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [filters, setFilters] = useState({
    hotel: searchParams.get('hotel') || '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: parseInt(searchParams.get('guests')) || 2,
    roomType: searchParams.get('roomType') || '',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Re-fetch when query params change
  useEffect(() => {
    const hotelParam = searchParams.get('hotel');
    if (hotelParam && hotelParam !== filters.hotel) {
      setFilters((prev) => ({ ...prev, hotel: hotelParam }));
    }
  }, [searchParams]);

  const fetchInitialData = async () => {
    setLoading(true);
    const params = {
      is_active: true,
      is_available: true,
    };

    // Apply initial filters from URL
    const hotelParam = searchParams.get('hotel');
    if (hotelParam) params.hotel = hotelParam;

    const [roomsResult, hotelsResult] = await Promise.all([
      roomService.getAll(params),
      hotelService.getAll({ is_active: true }),
    ]);

    if (roomsResult.success) {
      const data = Array.isArray(roomsResult.data)
        ? roomsResult.data
        : roomsResult.data?.results || [];
      setRooms(data);
    } else {
      showError('Failed to load rooms');
    }

    if (hotelsResult.success) {
      const data = Array.isArray(hotelsResult.data)
        ? hotelsResult.data
        : hotelsResult.data?.results || [];
      setHotels(data);
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
    if (filters.roomType) params.room_type_category = filters.roomType;
    if (filters.guests) params.max_occupancy__gte = filters.guests;

    const result = await roomService.getAll(params);
    if (result.success) {
      const data = Array.isArray(result.data)
        ? result.data
        : result.data?.results || [];
      setRooms(data);
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

  const getRoomTypeInfo = (type) => {
    return ROOM_TYPES.find((t) => t.value === type) || { label: type, color: '#607d8b' };
  };

  const getRoomImage = (room) => {
    // Check if room has gallery images
    if (room.galleries && room.galleries.length > 0) {
      const gallery = room.galleries[0];
      if (gallery.images && gallery.images.length > 0) {
        return `http://localhost:8000${gallery.images[0].image}`;
      }
    }
    return null;
  };

  // Base prices per room type (from CLAUDE.md)
  const getBasePrice = (roomType) => {
    const prices = {
      standard: 120,
      deluxe: 180,
      suite: 240,
      penthouse: 500,
    };
    return prices[roomType] || 120;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Find Your Perfect Room
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Browse our selection of rooms across all hotels
        </Typography>
      </Box>

      {/* Search Filters */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Hotel</InputLabel>
              <Select
                value={filters.hotel}
                label="Hotel"
                onChange={(e) => setFilters({ ...filters, hotel: e.target.value })}
                sx={{ borderRadius: 2 }}
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
              InputProps={{ sx: { borderRadius: 2 } }}
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
              InputProps={{ sx: { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} md={1.5}>
            <TextField
              fullWidth
              size="small"
              label="Guests"
              type="number"
              value={filters.guests}
              onChange={(e) => setFilters({ ...filters, guests: parseInt(e.target.value) || 1 })}
              InputProps={{ inputProps: { min: 1, max: 10 }, sx: { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Room Type</InputLabel>
              <Select
                value={filters.roomType}
                label="Room Type"
                onChange={(e) => setFilters({ ...filters, roomType: e.target.value })}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">All Types</MenuItem>
                {ROOM_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Search />}
              onClick={handleSearch}
              sx={{
                height: 40,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Results Count */}
      {!loading && (
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {rooms.length} room{rooms.length !== 1 ? 's' : ''} found
          </Typography>
          {filters.hotel && hotels.find((h) => h.id == filters.hotel) && (
            <Chip
              label={hotels.find((h) => h.id == filters.hotel)?.name}
              size="small"
              onDelete={() => setFilters({ ...filters, hotel: '' })}
              sx={{ ml: 1 }}
            />
          )}
        </Box>
      )}

      {/* Results */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" width="60%" height={28} />
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="40%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : rooms.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <MeetingRoom sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No rooms found matching your criteria
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Try adjusting your filters or selecting a different hotel
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              setFilters({
                hotel: '',
                checkIn: '',
                checkOut: '',
                guests: 2,
                roomType: '',
              });
              fetchInitialData();
            }}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Clear Filters
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {rooms.map((room) => {
            const typeInfo = getRoomTypeInfo(room.room_type_category);
            const imageUrl = getRoomImage(room);
            const basePrice = getBasePrice(room.room_type_category);

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={room.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                    },
                  }}
                >
                  {/* Room Image */}
                  {imageUrl ? (
                    <CardMedia
                      component="img"
                      height="200"
                      image={imageUrl}
                      alt={`Room ${room.room_number}`}
                      sx={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 200,
                        bgcolor: alpha(typeInfo.color, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <HotelIcon sx={{ fontSize: 64, color: alpha(typeInfo.color, 0.3) }} />
                    </Box>
                  )}

                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Room Type Chip */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                      <Typography variant="h6" fontWeight={600}>
                        Room {room.room_number}
                      </Typography>
                      <Chip
                        label={typeInfo.label}
                        size="small"
                        sx={{
                          bgcolor: alpha(typeInfo.color, 0.1),
                          color: typeInfo.color,
                          fontWeight: 600,
                          fontSize: '0.7rem',
                        }}
                      />
                    </Box>

                    {/* Hotel Name */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                      <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {room.hotel_name}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Room Details */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Person fontSize="small" color="action" />
                        <Typography variant="body2">{room.max_occupancy} guests</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <KingBed fontSize="small" color="action" />
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {room.bed_size}
                        </Typography>
                      </Box>
                    </Box>

                    {/* View */}
                    {room.view_name && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Visibility fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {room.view_name}
                        </Typography>
                      </Box>
                    )}

                    {/* Price */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        From
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                        <Typography variant="h5" fontWeight={700}>
                          £{basePrice}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          / night
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleBookRoom(room.id)}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1.25,
                      }}
                    >
                      View & Book
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default BrowseRooms;
