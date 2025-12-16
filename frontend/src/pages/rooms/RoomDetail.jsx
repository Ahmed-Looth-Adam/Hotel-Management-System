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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  KingBed,
  People,
  Visibility,
  CheckCircle,
  MeetingRoom,
} from '@mui/icons-material';
import { roomService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import LoadingSpinner from '../../components/loading/LoadingSpinner';

const statusColors = {
  available: 'success',
  occupied: 'primary',
  maintenance: 'warning',
  cleaning: 'info',
};

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError } = useNotification();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true);
      const result = await roomService.getById(id);
      if (result.success) {
        setRoom(result.data);
      } else {
        showError('Failed to fetch room details');
      }
      setLoading(false);
    };
    fetchRoom();
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Loading room details..." />;
  }

  if (!room) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Room not found</Typography>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/rooms')}>
          Back to Rooms
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/rooms')}>
          Back to Rooms
        </Button>
        <Button
          variant="contained"
          startIcon={<Edit />}
          onClick={() => navigate(`/rooms/${id}/edit`)}
        >
          Edit Room
        </Button>
      </Box>

      <Paper sx={{ p: 4, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <MeetingRoom sx={{ fontSize: 40 }} color="primary" />
              <Typography variant="h4">Room {room.room_number}</Typography>
            </Box>
            {room.hotel && (
              <Typography color="text.secondary">
                {room.hotel.name} - Floor {room.floor}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={room.status}
              color={statusColors[room.status] || 'default'}
            />
            <Chip
              label={room.is_active ? 'Active' : 'Inactive'}
              variant="outlined"
              color={room.is_active ? 'success' : 'default'}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Room Details</Typography>
            <List>
              <ListItem>
                <ListItemIcon><KingBed /></ListItemIcon>
                <ListItemText
                  primary="Room Type"
                  secondary={room.room_type_category || room.room_type?.name}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><KingBed /></ListItemIcon>
                <ListItemText
                  primary="Bed Configuration"
                  secondary={`${room.bed_count || 1}x ${room.bed_size || 'Standard'}`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><People /></ListItemIcon>
                <ListItemText
                  primary="Maximum Occupancy"
                  secondary={`${room.max_occupancy} guests`}
                />
              </ListItem>
              {room.view && (
                <ListItem>
                  <ListItemIcon><Visibility /></ListItemIcon>
                  <ListItemText
                    primary="View"
                    secondary={room.view.name}
                  />
                </ListItem>
              )}
            </List>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Amenities</Typography>
            {room.amenities && room.amenities.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {room.amenities.map((amenity) => (
                  <Chip
                    key={amenity.id}
                    icon={<CheckCircle />}
                    label={amenity.name}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary">No amenities assigned</Typography>
            )}
          </Grid>
        </Grid>

        {room.gallery && room.gallery.images && room.gallery.images.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>Gallery</Typography>
            <Grid container spacing={2}>
              {room.gallery.images.map((image) => (
                <Grid item xs={6} sm={4} md={3} key={image.id}>
                  <Box
                    component="img"
                    src={image.image_url}
                    alt={image.alt_text || 'Room image'}
                    sx={{
                      width: '100%',
                      height: 150,
                      objectFit: 'cover',
                      borderRadius: 1,
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Paper>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={() => navigate(`/bookings?room=${id}`)}>
          View Bookings
        </Button>
        <Button variant="outlined" onClick={() => navigate(`/rooms/${id}/amenities`)}>
          Manage Amenities
        </Button>
      </Box>
    </Container>
  );
};

export default RoomDetail;
