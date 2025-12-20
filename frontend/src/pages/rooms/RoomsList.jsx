import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardActions,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogContent,
  DialogActions,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  MeetingRoom,
  ViewList,
  ViewModule,
  KingBed,
  Close as CloseIcon,
} from '@mui/icons-material';
import DataTable from '../../components/common/DataTable';
import { roomService, hotelService } from '../../services';
import { useNotification } from '../../hooks/useNotification';

const statusColors = {
  available: 'success',
  occupied: 'primary',
  maintenance: 'warning',
  cleaning: 'info',
};

const RoomsList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useNotification();
  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table');
  const [filters, setFilters] = useState({
    hotel: searchParams.get('hotel') || '',
    room_type: '',
    status: '',
    is_active: '',
  });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, roomNumber: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const params = {};
    if (filters.hotel) params.hotel = filters.hotel;
    if (filters.room_type) params.room_type = filters.room_type;
    if (filters.status) params.status = filters.status;
    if (filters.is_active !== '') params.is_active = filters.is_active;

    const [roomsResult, hotelsResult] = await Promise.all([
      roomService.getAll(params),
      hotelService.getAll(),
    ]);

    if (roomsResult.success) {
      setRooms(roomsResult.data.results || roomsResult.data);
    } else {
      showError('Failed to fetch rooms');
    }

    if (hotelsResult.success) {
      setHotels(hotelsResult.data.results || hotelsResult.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleDeleteClick = (id, roomNumber) => {
    setDeleteDialog({ open: true, id, roomNumber });
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    const result = await roomService.delete(deleteDialog.id);
    if (result.success) {
      showSuccess('Room deleted successfully');
      setDeleteDialog({ open: false, id: null, roomNumber: '' });
      fetchData();
    } else {
      showError('Failed to delete room');
    }
    setDeleteLoading(false);
  };

  const columns = [
    { id: 'room_number', label: 'Room #', sortable: true },
    { id: 'hotel_name', label: 'Hotel', sortable: true },
    { id: 'room_type_category', label: 'Type', sortable: true },
    { id: 'view_name', label: 'View', sortable: true },
    {
      id: 'bed_info',
      label: 'Bed',
      render: (row) => `${row.bed_count || 1}x ${row.bed_size || 'N/A'}`,
    },
    { id: 'max_occupancy', label: 'Max Guests', sortable: true },
    {
      id: 'status',
      label: 'Status',
      render: (row) => (
        <Chip
          label={row.status}
          color={statusColors[row.status] || 'default'}
          size="small"
        />
      ),
    },
    {
      id: 'is_active',
      label: 'Active',
      render: (row) => (
        <Chip
          label={row.is_active ? 'Yes' : 'No'}
          color={row.is_active ? 'success' : 'default'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row) => (
        <Box>
          <IconButton size="small" onClick={() => navigate(`/rooms/${row.id}`)} title="View">
            <Visibility />
          </IconButton>
          <IconButton size="small" onClick={() => navigate(`/rooms/${row.id}/edit`)} title="Edit">
            <Edit />
          </IconButton>
          <IconButton size="small" onClick={() => handleDeleteClick(row.id, row.room_number)} title="Delete" color="error">
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  const RoomCard = ({ room }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Room {room.room_number}</Typography>
          <Chip label={room.status} color={statusColors[room.status] || 'default'} size="small" />
        </Box>
        <Typography color="text.secondary" gutterBottom>{room.hotel_name}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <KingBed fontSize="small" color="action" />
          <Typography variant="body2">{room.room_type_category}</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {room.bed_count || 1}x {room.bed_size || 'Standard'} | Max {room.max_occupancy} guests
        </Typography>
        {room.view_name && (
          <Typography variant="body2" color="text.secondary">
            View: {room.view_name}
          </Typography>
        )}
      </CardContent>
      <CardActions>
        <Button size="small" onClick={() => navigate(`/rooms/${room.id}`)}>View</Button>
        <Button size="small" onClick={() => navigate(`/rooms/${room.id}/edit`)}>Edit</Button>
      </CardActions>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MeetingRoom color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" component="h1">Rooms</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, val) => val && setViewMode(val)}
            size="small"
          >
            <ToggleButton value="table"><ViewList /></ToggleButton>
            <ToggleButton value="grid"><ViewModule /></ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/rooms/new')}>
            Add Room
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Hotel</InputLabel>
          <Select
            value={filters.hotel}
            label="Hotel"
            onChange={(e) => setFilters({ ...filters, hotel: e.target.value })}
          >
            <MenuItem value="">All Hotels</MenuItem>
            {hotels.map((hotel) => (
              <MenuItem key={hotel.id} value={hotel.id}>{hotel.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Room Type</InputLabel>
          <Select
            value={filters.room_type}
            label="Room Type"
            onChange={(e) => setFilters({ ...filters, room_type: e.target.value })}
          >
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="standard">Standard</MenuItem>
            <MenuItem value="deluxe">Deluxe</MenuItem>
            <MenuItem value="suite">Suite</MenuItem>
            <MenuItem value="executive">Executive</MenuItem>
            <MenuItem value="presidential">Presidential</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status}
            label="Status"
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="available">Available</MenuItem>
            <MenuItem value="occupied">Occupied</MenuItem>
            <MenuItem value="maintenance">Maintenance</MenuItem>
            <MenuItem value="cleaning">Cleaning</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Active</InputLabel>
          <Select
            value={filters.is_active}
            label="Active"
            onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={rooms}
          emptyMessage={loading ? 'Loading rooms...' : 'No rooms found'}
        />
      ) : (
        <Grid container spacing={2}>
          {rooms.map((room) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={room.id}>
              <RoomCard room={room} />
            </Grid>
          ))}
          {rooms.length === 0 && (
            <Grid item xs={12}>
              <Typography color="text.secondary" align="center">
                {loading ? 'Loading rooms...' : 'No rooms found'}
              </Typography>
            </Grid>
          )}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null, roomNumber: '' })}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
          },
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(180deg, #7f1d1d 0%, #450a0a 100%)',
            color: '#ffffff',
            px: 3,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                width: 36,
                height: 36,
              }}
            >
              <Delete fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#ffffff' }}>
                Delete Room
              </Typography>
              {deleteDialog.roomNumber && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Room {deleteDialog.roomNumber}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton onClick={() => setDeleteDialog({ open: false, id: null, roomNumber: '' })} sx={{ color: '#ffffff' }} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Are you sure you want to <strong>delete</strong> this room? This action cannot be undone.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 1.5,
            bgcolor: 'grey.50',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Button
            onClick={() => setDeleteDialog({ open: false, id: null, roomNumber: '' })}
            disabled={deleteLoading}
            color="inherit"
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={deleteLoading}
            sx={{
              borderRadius: 2,
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#dc2626',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
              '&:hover': {
                bgcolor: '#b91c1c',
              },
              '&.Mui-disabled': {
                bgcolor: 'grey.300',
                color: 'grey.500',
              },
            }}
          >
            {deleteLoading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Delete Room'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RoomsList;
