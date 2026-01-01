/**
 * Room Management Page - Staff Room Status Management
 *
 * Features:
 * - View all rooms with status indicators
 * - Quick status change buttons (Available, Cleaning, Out of Service)
 * - Hotel filter for multi-property support
 * - Status statistics dashboard
 * - Real-time updates with notifications
 */

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Paper,
  CircularProgress,
  ButtonGroup,
  Tooltip,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  MeetingRoom,
  CheckCircle,
  Hotel,
  CleaningServices,
  Build,
  ViewModule,
  ViewList,
} from '@mui/icons-material';
import { roomService, hotelService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';

const statusConfig = {
  available: {
    label: 'Available',
    color: 'success',
    icon: CheckCircle,
    bgColor: 'rgba(46, 125, 50, 0.08)',
    borderColor: 'rgba(46, 125, 50, 0.3)',
  },
  occupied: {
    label: 'Occupied',
    color: 'primary',
    icon: Hotel,
    bgColor: 'rgba(25, 118, 210, 0.08)',
    borderColor: 'rgba(25, 118, 210, 0.3)',
  },
  cleaning: {
    label: 'Cleaning',
    color: 'info',
    icon: CleaningServices,
    bgColor: 'rgba(2, 136, 209, 0.08)',
    borderColor: 'rgba(2, 136, 209, 0.3)',
  },
  out_of_service: {
    label: 'Out of Service',
    color: 'warning',
    icon: Build,
    bgColor: 'rgba(237, 108, 2, 0.08)',
    borderColor: 'rgba(237, 108, 2, 0.3)',
  },
};

const RoomManagement = () => {
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null); // Track which room is being updated
  const [selectedHotel, setSelectedHotel] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'

  const roomTypeOptions = [
    { value: 'standard', label: 'Standard Double' },
    { value: 'deluxe', label: 'Deluxe King' },
    { value: 'suite', label: 'Family Suite' },
    { value: 'penthouse', label: 'Penthouse' },
  ];

  // Check user role for hotel access
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isStaff = user?.role === 'staff';
  const hasAssignedHotel = user?.assigned_hotel;

  const fetchData = async () => {
    setLoading(true);
    const params = { page_size: 1000 }; // Fetch all rooms (bypass pagination)
    if (selectedHotel) params.hotel = selectedHotel;

    const [roomsResult, hotelsResult] = await Promise.all([
      roomService.getAll(params),
      hotelService.getAll({ page_size: 100, is_active: true }),
    ]);

    if (roomsResult.success) {
      setRooms(roomsResult.data.results || roomsResult.data);
    } else {
      showError('Failed to fetch rooms');
    }

    if (hotelsResult.success) {
      let hotelList = hotelsResult.data.results || hotelsResult.data;

      // For staff, filter to their assigned hotel
      // Note: Managers don't need client-side filtering - backend already filters by manager
      if (isStaff && hasAssignedHotel) {
        hotelList = hotelList.filter(h => h.id === user.assigned_hotel);
      }

      setHotels(hotelList);

      // Auto-select hotel for staff with assigned hotel
      if (!selectedHotel && isStaff && hasAssignedHotel) {
        setSelectedHotel(user.assigned_hotel);
      }
      // Auto-select first hotel for managers (they manage hotels, not assigned to one)
      else if (!selectedHotel && isManager && hotelList.length > 0) {
        setSelectedHotel(hotelList[0].id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedHotel]);

  // Get unique floors from rooms for the filter dropdown
  const uniqueFloors = [...new Set(rooms.map(room => room.floor))].sort((a, b) => a - b);

  // Filter rooms based on selected filters
  const filteredRooms = rooms.filter(room => {
    if (selectedFloor && room.floor !== parseInt(selectedFloor)) return false;
    if (selectedStatus && room.status !== selectedStatus) return false;
    if (selectedRoomType && room.room_type_category !== selectedRoomType) return false;
    return true;
  });

  const handleStatusChange = async (roomId, newStatus) => {
    setUpdating(roomId);
    const result = await roomService.patch(roomId, { status: newStatus });
    if (result.success) {
      showSuccess(`Room status updated to ${statusConfig[newStatus].label}`);
      // Update local state
      setRooms(prevRooms =>
        prevRooms.map(room =>
          room.id === roomId ? { ...room, status: newStatus } : room
        )
      );
    } else {
      showError('Failed to update room status');
    }
    setUpdating(null);
  };

  // Calculate status statistics
  const statusStats = rooms.reduce((acc, room) => {
    acc[room.status] = (acc[room.status] || 0) + 1;
    return acc;
  }, {});

  const StatCard = ({ status, count }) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          bgcolor: config.bgColor,
          border: `1px solid ${config.borderColor}`,
          borderRadius: 3,
          height: '100%',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 25px ${config.borderColor}`,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Icon color={config.color} sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {count || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {config.label}
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  };

  const RoomCard = ({ room }) => {
    const config = statusConfig[room.status] || statusConfig.available;
    const isUpdating = updating === room.id;

    return (
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${config.borderColor}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: 3,
          },
        }}
      >
        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              Room {room.room_number}
            </Typography>
            <Chip
              label={config.label}
              color={config.color}
              size="small"
              sx={{ fontWeight: 500 }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {room.hotel_name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Floor: {room.floor}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Type: {room.room_type_category}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Max Guests: {room.max_occupancy}
          </Typography>
        </CardContent>

        {/* Only show status buttons if room is not occupied */}
        {room.status !== 'occupied' ? (
          <Box sx={{ px: 2, pb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Change Status:
            </Typography>
            <ButtonGroup
              size="small"
              variant="outlined"
              disabled={isUpdating}
              fullWidth
            >
              <Tooltip title="Mark as Available">
                <Button
                  color="success"
                  onClick={() => handleStatusChange(room.id, 'available')}
                  variant={room.status === 'available' ? 'contained' : 'outlined'}
                  sx={room.status === 'available' ? {
                    '&:hover': { bgcolor: 'success.dark' },
                  } : {}}
                >
                  {isUpdating ? <CircularProgress size={16} /> : <CheckCircle fontSize="small" />}
                </Button>
              </Tooltip>
              <Tooltip title="Mark as Cleaning">
                <Button
                  color="info"
                  onClick={() => handleStatusChange(room.id, 'cleaning')}
                  variant={room.status === 'cleaning' ? 'contained' : 'outlined'}
                  sx={room.status === 'cleaning' ? {
                    '&:hover': { bgcolor: 'info.dark' },
                  } : {}}
                >
                  <CleaningServices fontSize="small" />
                </Button>
              </Tooltip>
              <Tooltip title="Mark as Out of Service">
                <Button
                  color="warning"
                  onClick={() => handleStatusChange(room.id, 'out_of_service')}
                  variant={room.status === 'out_of_service' ? 'contained' : 'outlined'}
                  sx={room.status === 'out_of_service' ? {
                    '&:hover': { bgcolor: 'warning.dark' },
                  } : {}}
                >
                  <Build fontSize="small" />
                </Button>
              </Tooltip>
            </ButtonGroup>
          </Box>
        ) : (
          <Box sx={{ px: 2, pb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Status managed by check-in/check-out
            </Typography>
          </Box>
        )}
      </Card>
    );
  };

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', py: 3 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} color="text.primary">
              Room Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage room statuses and availability
            </Typography>
          </Box>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, val) => val && setViewMode(val)}
            size="small"
            sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}
          >
            <ToggleButton value="card">
              <Tooltip title="Card View">
                <ViewModule />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="table">
              <Tooltip title="Table View">
                <ViewList />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Hotel</InputLabel>
            <Select
              value={selectedHotel}
              label="Hotel"
              onChange={(e) => setSelectedHotel(e.target.value)}
              sx={{ bgcolor: 'white', borderRadius: 2 }}
            >
              <MenuItem value="">All Hotels</MenuItem>
              {hotels.map((hotel) => (
                <MenuItem key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Floor</InputLabel>
            <Select
              value={selectedFloor}
              label="Floor"
              onChange={(e) => setSelectedFloor(e.target.value)}
              sx={{ bgcolor: 'white', borderRadius: 2 }}
            >
              <MenuItem value="">All Floors</MenuItem>
              {uniqueFloors.map((floor) => (
                <MenuItem key={floor} value={floor}>
                  Floor {floor}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Room Type</InputLabel>
            <Select
              value={selectedRoomType}
              label="Room Type"
              onChange={(e) => setSelectedRoomType(e.target.value)}
              sx={{ bgcolor: 'white', borderRadius: 2 }}
            >
              <MenuItem value="">All Types</MenuItem>
              {roomTypeOptions.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedStatus}
              label="Status"
              onChange={(e) => setSelectedStatus(e.target.value)}
              sx={{ bgcolor: 'white', borderRadius: 2 }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <MenuItem key={key} value={key}>
                  {config.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Status Statistics */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
            gap: 3,
            mb: 4,
          }}
        >
          {Object.keys(statusConfig).map((status) => (
            <StatCard key={status} status={status} count={statusStats[status]} />
          ))}
        </Box>

        {/* Info Alert */}
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          Use the status buttons to mark rooms as Available, Cleaning, or Out of Service.
          Occupied status is set automatically when a guest checks in.
        </Alert>

        {/* Room Display */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredRooms.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <MeetingRoom sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No rooms found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedHotel || selectedFloor || selectedStatus || selectedRoomType
                ? 'No rooms match the selected filters.'
                : 'Select a hotel to view rooms.'}
            </Typography>
          </Paper>
        ) : viewMode === 'card' ? (
          /* Card View */
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
                xl: 'repeat(5, 1fr)',
              },
              gap: 2,
              width: '100%',
            }}
          >
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </Box>
        ) : (
          /* Table View */
          <TableContainer component={Paper} sx={{ borderRadius: 2, width: '100%' }}>
            <Table sx={{ minWidth: '100%' }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600, width: '10%' }}>Room</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '20%' }}>Hotel</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '10%' }}>Floor</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '15%' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '10%' }}>Max Guests</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '15%' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '20%' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRooms.map((room) => {
                  const config = statusConfig[room.status] || statusConfig.available;
                  const isUpdating = updating === room.id;
                  return (
                    <TableRow key={room.id} hover>
                      <TableCell>
                        <Typography fontWeight={600}>{room.room_number}</Typography>
                      </TableCell>
                      <TableCell>{room.hotel_name}</TableCell>
                      <TableCell>{room.floor}</TableCell>
                      <TableCell>{room.room_type_category}</TableCell>
                      <TableCell>{room.max_occupancy}</TableCell>
                      <TableCell>
                        <Chip
                          label={config.label}
                          color={config.color}
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell>
                        {room.status !== 'occupied' ? (
                          <ButtonGroup size="small" variant="outlined" disabled={isUpdating}>
                            <Tooltip title="Available">
                              <Button
                                color="success"
                                onClick={() => handleStatusChange(room.id, 'available')}
                                variant={room.status === 'available' ? 'contained' : 'outlined'}
                                sx={{
                                  minWidth: 36,
                                  ...(room.status === 'available' && { '&:hover': { bgcolor: 'success.dark' } }),
                                }}
                              >
                                {isUpdating ? <CircularProgress size={14} /> : <CheckCircle fontSize="small" />}
                              </Button>
                            </Tooltip>
                            <Tooltip title="Cleaning">
                              <Button
                                color="info"
                                onClick={() => handleStatusChange(room.id, 'cleaning')}
                                variant={room.status === 'cleaning' ? 'contained' : 'outlined'}
                                sx={{
                                  minWidth: 36,
                                  ...(room.status === 'cleaning' && { '&:hover': { bgcolor: 'info.dark' } }),
                                }}
                              >
                                <CleaningServices fontSize="small" />
                              </Button>
                            </Tooltip>
                            <Tooltip title="Out of Service">
                              <Button
                                color="warning"
                                onClick={() => handleStatusChange(room.id, 'out_of_service')}
                                variant={room.status === 'out_of_service' ? 'contained' : 'outlined'}
                                sx={{
                                  minWidth: 36,
                                  ...(room.status === 'out_of_service' && { '&:hover': { bgcolor: 'warning.dark' } }),
                                }}
                              >
                                <Build fontSize="small" />
                              </Button>
                            </Tooltip>
                          </ButtonGroup>
                        ) : (
                          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            Check-in/out managed
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </Box>
  );
};

export default RoomManagement;
