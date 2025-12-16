import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Chip,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  LocationOn,
  Star,
  AccessTime,
  MeetingRoom,
} from '@mui/icons-material';
import { hotelService, roomService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import LoadingSpinner from '../../components/loading/LoadingSpinner';

const HotelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError } = useNotification();
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [hotelResult, roomsResult] = await Promise.all([
        hotelService.getById(id),
        roomService.getAll({ hotel: id }),
      ]);

      if (hotelResult.success) {
        setHotel(hotelResult.data);
      } else {
        showError('Failed to fetch hotel details');
      }

      if (roomsResult.success) {
        setRooms(roomsResult.data.results || roomsResult.data);
      }
      setLoading(false);
    };

    fetchData();
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Loading hotel details..." />;
  }

  if (!hotel) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Hotel not found</Typography>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/hotels')}>
          Back to Hotels
        </Button>
      </Container>
    );
  }

  const roomStats = {
    total: rooms.length,
    available: rooms.filter((r) => r.is_available && r.status === 'available').length,
    occupied: rooms.filter((r) => r.status === 'occupied').length,
    maintenance: rooms.filter((r) => r.status === 'maintenance').length,
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/hotels')}>
          Back to Hotels
        </Button>
        <Button
          variant="contained"
          startIcon={<Edit />}
          onClick={() => navigate(`/hotels/${id}/edit`)}
        >
          Edit Hotel
        </Button>
      </Box>

      <Paper sx={{ p: 4, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {hotel.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LocationOn color="action" />
              <Typography color="text.secondary">
                {hotel.address}, {hotel.city}, {hotel.country}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Star color="warning" />
              <Typography>
                {'★'.repeat(hotel.star_rating || 0)}
                {'☆'.repeat(5 - (hotel.star_rating || 0))}
                ({hotel.star_rating} stars)
              </Typography>
            </Box>
          </Box>
          <Chip
            label={hotel.is_active ? 'Active' : 'Inactive'}
            color={hotel.is_active ? 'success' : 'default'}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {hotel.description && (
          <Typography paragraph>{hotel.description}</Typography>
        )}

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTime color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary">Check-in</Typography>
                <Typography>{hotel.default_checkin_time || '14:00'}</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTime color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary">Check-out</Typography>
                <Typography>{hotel.default_checkout_time || '11:00'}</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MeetingRoom color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary">Total Rooms</Typography>
                <Typography>{hotel.room_capacity || roomStats.total}</Typography>
              </Box>
            </Box>
          </Grid>
          {hotel.manager_name && (
            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Typography variant="body2" color="text.secondary">Manager</Typography>
                <Typography>{hotel.manager_name}</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      <Typography variant="h5" gutterBottom>
        Room Statistics
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">{roomStats.total}</Typography>
              <Typography variant="body2" color="text.secondary">Total Rooms</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">{roomStats.available}</Typography>
              <Typography variant="body2" color="text.secondary">Available</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">{roomStats.occupied}</Typography>
              <Typography variant="body2" color="text.secondary">Occupied</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">{roomStats.maintenance}</Typography>
              <Typography variant="body2" color="text.secondary">Maintenance</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={() => navigate(`/rooms?hotel=${id}`)}>
          View Rooms
        </Button>
        <Button variant="outlined" onClick={() => navigate(`/bookings?hotel=${id}`)}>
          View Bookings
        </Button>
        <Button variant="outlined" onClick={() => navigate(`/operations?hotel=${id}`)}>
          Operations Dashboard
        </Button>
      </Box>
    </Container>
  );
};

export default HotelDetail;
