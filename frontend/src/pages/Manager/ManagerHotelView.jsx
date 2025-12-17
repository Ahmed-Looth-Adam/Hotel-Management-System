import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  IconButton,
  Chip,
  Avatar,
  Skeleton,
  Alert,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Tooltip,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Hotel as HotelIcon,
  MeetingRoom as RoomIcon,
  Collections as GalleryIcon,
  CurrencyPound as PricingIcon,
  RoomService as ServicesIcon,
  Policy as PolicyIcon,
  Dashboard as OverviewIcon,
  Star as StarIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Close as CloseIcon,
  DateRange as DateRangeIcon,
  WbSunny as PeakIcon,
  AcUnit as OffPeakIcon,
  CloudUpload as UploadIcon,
  Image as ImageIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Visibility as ViewIcon,
  Layers as FloorIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import hotelService from '../../services/hotelService';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`hotel-tabpanel-${index}`}
      aria-labelledby={`hotel-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Tab configuration
const tabs = [
  { label: 'Overview', icon: <OverviewIcon /> },
  { label: 'Rooms', icon: <RoomIcon /> },
  { label: 'Gallery', icon: <GalleryIcon /> },
  { label: 'Pricing', icon: <PricingIcon /> },
  { label: 'Services', icon: <ServicesIcon /> },
  { label: 'Policies', icon: <PolicyIcon /> },
];

const ManagerHotelView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [managedHotels, setManagedHotels] = useState([]); // All hotels managed by user
  const [selectedHotelId, setSelectedHotelId] = useState(null); // Currently selected hotel ID
  const [hotel, setHotel] = useState(null); // Full details of selected hotel
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false); // For fade animation
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const { showError } = useNotification();

  useEffect(() => {
    fetchManagerHotels();
  }, []);

  const fetchManagerHotels = async () => {
    setLoading(true);
    try {
      // Fetch all hotels where current user is the manager
      const result = await hotelService.getAll();
      if (result.success) {
        const hotels = Array.isArray(result.data) ? result.data : (result.data?.results || []);
        // Filter hotels where current user is the manager
        const userManagedHotels = hotels.filter(h => h.manager?.id === user?.id);

        if (userManagedHotels.length > 0) {
          setManagedHotels(userManagedHotels);
          // Auto-select the first hotel and fetch its details
          const firstHotelId = userManagedHotels[0].id;
          setSelectedHotelId(firstHotelId);
          setError('');
          // Fetch full details for the first hotel
          const detailResult = await hotelService.getById(firstHotelId);
          if (detailResult.success) {
            setHotel(detailResult.data);
          }
          setLoading(false);
        } else {
          setError('No hotel assigned to your account. Please contact an administrator.');
          setLoading(false);
        }
      } else {
        setError('Failed to fetch hotels');
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred while fetching your hotels');
      setLoading(false);
    }
  };

  const fetchHotelDetails = async (hotelId, withTransition = false) => {
    if (!withTransition) {
      setLoading(true);
    }
    try {
      const detailResult = await hotelService.getById(hotelId);
      if (detailResult.success) {
        setHotel(detailResult.data);
        setError('');
      } else {
        setError('Failed to fetch hotel details');
      }
    } catch (err) {
      setError('An error occurred while fetching hotel details');
    }
    if (!withTransition) {
      setLoading(false);
    } else {
      // Fade back in after data is loaded
      setIsTransitioning(false);
    }
  };

  const handleHotelChange = async (event) => {
    const newHotelId = event.target.value;
    if (newHotelId === selectedHotelId) return;

    // Start fade out
    setIsTransitioning(true);

    // Wait for fade out animation (200ms)
    await new Promise(resolve => setTimeout(resolve, 200));

    // Update selection and fetch new data
    setSelectedHotelId(newHotelId);
    setActiveTab(0); // Reset to overview tab when switching hotels
    await fetchHotelDetails(newHotelId, true);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Refresh current hotel details
  const refreshCurrentHotel = () => {
    if (selectedHotelId) {
      fetchHotelDetails(selectedHotelId);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3, mb: 3 }} />
        <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 2, mb: 3 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Container maxWidth="xl" disableGutters>
        {/* Hotel Selector - Only show if managing multiple hotels */}
        {managedHotels.length > 1 && (
          <Paper
            elevation={0}
            sx={{
              mb: 2,
              p: 2,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Managing {managedHotels.length} hotels:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 250 }}>
              <Select
                value={selectedHotelId || ''}
                onChange={handleHotelChange}
                disabled={isTransitioning}
                sx={{ borderRadius: 2 }}
              >
                {managedHotels.map((h) => (
                  <MenuItem key={h.id} value={h.id}>
                    {h.name} - {h.city}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        )}

        {/* Main Content with Fade Transition */}
        <Box
          sx={{
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'scale(0.98)' : 'scale(1)',
            transition: 'opacity 0.2s ease-in-out, transform 0.2s ease-in-out',
          }}
        >
          {/* Header */}
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              borderRadius: 3,
              border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          {/* Gradient Header */}
          <Box
            sx={{
              background: hotel?.is_active
                ? 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)'
                : 'linear-gradient(135deg, #78909c 0%, #90a4ae 100%)',
              px: 3,
              py: 2.5,
              color: '#fff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: 'rgba(255,255,255,0.2)',
                }}
              >
                <HotelIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight={700}>
                  {hotel?.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <LocationIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {hotel?.city}, {hotel?.country}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                    {[...Array(hotel?.star_rating || 0)].map((_, i) => (
                      <StarIcon key={i} sx={{ fontSize: 16, color: '#FFD700' }} />
                    ))}
                  </Box>
                </Box>
              </Box>
              <Chip
                label={hotel?.is_active ? 'Active' : 'Inactive'}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontWeight: 600,
                }}
              />
            </Box>
          </Box>

          {/* Tabs */}
          <Box sx={{ px: 2, bgcolor: 'background.paper' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 56,
                  textTransform: 'none',
                  fontWeight: 500,
                },
              }}
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={tab.label}
                  icon={tab.icon}
                  label={tab.label}
                  iconPosition="start"
                  sx={{ gap: 1 }}
                />
              ))}
            </Tabs>
          </Box>
        </Paper>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <OverviewTab hotel={hotel} />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <RoomsTab hotel={hotel} onRefresh={refreshCurrentHotel} />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <GalleryTab hotel={hotel} onRefresh={refreshCurrentHotel} />
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          <PricingTab hotel={hotel} onRefresh={refreshCurrentHotel} />
        </TabPanel>
        <TabPanel value={activeTab} index={4}>
          <ServicesTab hotel={hotel} onRefresh={refreshCurrentHotel} />
        </TabPanel>
        <TabPanel value={activeTab} index={5}>
          <PoliciesTab hotel={hotel} onRefresh={refreshCurrentHotel} />
        </TabPanel>
        </Box>
      </Container>
    </Box>
  );
};

// ============== Overview Tab (Read-Only for Managers) ==============
const OverviewTab = ({ hotel }) => {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Hotel Overview
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Overview of your hotel's information.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
        <StatCard title="Total Rooms" value={hotel?.room_capacity || 0} color="#1976d2" />
        <StatCard title="Star Rating" value={`${hotel?.star_rating || 0} Stars`} color="#FFB400" />
        <StatCard title="Status" value={hotel?.is_active ? 'Active' : 'Inactive'} color={hotel?.is_active ? '#4caf50' : '#9e9e9e'} />
        <StatCard title="Location" value={hotel?.city || 'N/A'} color="#9c27b0" />
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Hotel Details
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">Address</Typography>
            <Typography variant="body1">{hotel?.address || 'N/A'}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">City</Typography>
            <Typography variant="body1">{hotel?.city || 'N/A'}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Country</Typography>
            <Typography variant="body1">{hotel?.country || 'N/A'}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Check-in Time</Typography>
            <Typography variant="body1">{hotel?.default_checkin_time || '14:00'}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Check-out Time</Typography>
            <Typography variant="body1">{hotel?.default_checkout_time || '12:00'}</Typography>
          </Box>
        </Box>
      </Box>

      {hotel?.description && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Description
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {hotel.description}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

// Stat Card Component
const StatCard = ({ title, value, color }) => (
  <Box
    sx={{
      p: 2,
      borderRadius: 2,
      bgcolor: alpha(color, 0.1),
      borderLeft: `4px solid ${color}`,
    }}
  >
    <Typography variant="body2" color="text.secondary" gutterBottom>
      {title}
    </Typography>
    <Typography variant="h5" fontWeight={700} color={color}>
      {value}
    </Typography>
  </Box>
);

// ============== Rooms Tab ==============
const RoomsTab = ({ hotel, onRefresh }) => {
  const [rooms, setRooms] = useState([]);
  const [roomViews, setRoomViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { showSuccess, showError } = useNotification();

  const ROOM_TYPE_CHOICES = [
    { value: 'standard', label: 'Standard Double' },
    { value: 'deluxe', label: 'Deluxe King' },
    { value: 'suite', label: 'Family Suite' },
    { value: 'penthouse', label: 'Penthouse' },
  ];

  useEffect(() => {
    if (hotel?.id) {
      fetchRooms();
      fetchRoomViews();
    }
  }, [hotel?.id]);

  const fetchRooms = async () => {
    if (!hotel?.id) return;
    setLoading(true);
    const result = await hotelService.getRooms(hotel.id);
    if (result.success) {
      const data = Array.isArray(result.data) ? result.data : (result.data?.results || []);
      setRooms(data);
    }
    setLoading(false);
  };

  const fetchRoomViews = async () => {
    if (!hotel?.id) return;
    const result = await hotelService.getRoomViews(hotel.id);
    if (result.success) {
      const data = Array.isArray(result.data) ? result.data : (result.data?.results || []);
      setRoomViews(data);
    }
  };

  const handleSave = async () => {
    const isNew = !editingRoom.id;
    const data = {
      hotel: hotel.id,
      room_number: editingRoom.room_number,
      floor: editingRoom.floor,
      room_type_category: editingRoom.room_type_category,
      view: editingRoom.view || null,
      is_active: editingRoom.is_active ?? true,
    };

    const result = isNew
      ? await hotelService.createRoom(data)
      : await hotelService.updateRoom(editingRoom.id, data);

    if (result.success) {
      showSuccess(isNew ? 'Room created' : 'Room updated');
      fetchRooms();
      setDialogOpen(false);
    } else {
      showError(result.error?.detail || result.error?.room_number?.[0] || 'Failed to save room');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this room?')) return;
    const result = await hotelService.deleteRoom(id);
    if (result.success) {
      showSuccess('Room deleted');
      fetchRooms();
    } else {
      showError('Failed to delete room');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: '#4caf50',
      occupied: '#f44336',
      cleaning: '#ff9800',
      out_of_service: '#9e9e9e',
    };
    return colors[status] || '#9e9e9e';
  };

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Rooms Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage rooms for this hotel. Total: {rooms.length} rooms
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingRoom({
              room_number: '',
              floor: 1,
              room_type_category: 'standard',
              view: null,
              is_available: true,
              is_active: true,
            });
            setDialogOpen(true);
          }}
          sx={{
            bgcolor: '#000',
            '&:hover': { bgcolor: '#333' },
            borderRadius: 2,
            textTransform: 'none',
          }}
        >
          Add Room
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : rooms.length === 0 ? (
        <Box sx={{ p: 4, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
          <RoomIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
          <Typography color="text.secondary">No rooms found for this hotel.</Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Room #</TableCell>
                <TableCell>Floor</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Active</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{room.room_number}</TableCell>
                  <TableCell>{room.floor}</TableCell>
                  <TableCell>{room.room_type_name || room.room_type_category}</TableCell>
                  <TableCell>
                    <Chip
                      label={room.status}
                      size="small"
                      sx={{
                        bgcolor: alpha(getStatusColor(room.status), 0.1),
                        color: getStatusColor(room.status),
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={room.is_active ? 'Yes' : 'No'}
                      size="small"
                      color={room.is_active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingRoom(room);
                        setDialogOpen(true);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(room.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Room Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(180deg, #1a1f37 0%, #0f1225 100%)',
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
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                width: 36,
                height: 36,
              }}
            >
              {editingRoom?.id ? <EditIcon fontSize="small" /> : <RoomIcon fontSize="small" />}
            </Avatar>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#ffffff' }}>
              {editingRoom?.id ? `Edit Room ${editingRoom.room_number}` : 'Add New Room'}
            </Typography>
          </Box>
          <IconButton onClick={() => setDialogOpen(false)} sx={{ color: '#ffffff' }} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 3, py: 2 }}>
          {/* Room Identification */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
            <RoomIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Room Identification
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
            <TextField
              label="Room Number"
              value={editingRoom?.room_number || ''}
              onChange={(e) => setEditingRoom({ ...editingRoom, room_number: e.target.value })}
              placeholder="e.g., 101"
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <RoomIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 },
              }}
            />
            <TextField
              label="Floor"
              type="number"
              value={editingRoom?.floor || 1}
              onChange={(e) => setEditingRoom({ ...editingRoom, floor: parseInt(e.target.value) || 1 })}
              fullWidth
              size="small"
              inputProps={{ min: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FloorIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 },
              }}
            />
          </Box>

          {/* Room Type */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
            <CategoryIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Room Type
            </Typography>
          </Box>
          <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
            <Select
              value={editingRoom?.room_type_category || 'standard'}
              onChange={(e) => setEditingRoom({ ...editingRoom, room_type_category: e.target.value })}
              sx={{ borderRadius: 2 }}
              startAdornment={
                <InputAdornment position="start">
                  <CategoryIcon sx={{ color: 'text.secondary', fontSize: 20, ml: 1 }} />
                </InputAdornment>
              }
            >
              {ROOM_TYPE_CHOICES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* View */}
          {roomViews.length > 0 && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
                <ViewIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Room View
                </Typography>
              </Box>
              <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
                <Select
                  value={editingRoom?.view || ''}
                  onChange={(e) => setEditingRoom({ ...editingRoom, view: e.target.value || null })}
                  sx={{ borderRadius: 2 }}
                  displayEmpty
                  startAdornment={
                    <InputAdornment position="start">
                      <ViewIcon sx={{ color: 'text.secondary', fontSize: 20, ml: 1 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">None</MenuItem>
                  {roomViews.map((view) => (
                    <MenuItem key={view.id} value={view.id}>
                      {view.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}

          {/* Room Status */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.5,
              bgcolor: (editingRoom?.is_active ?? true) ? alpha('#2e7d32', 0.08) : alpha('#757575', 0.08),
              borderRadius: 2,
              border: '1px solid',
              borderColor: (editingRoom?.is_active ?? true) ? alpha('#2e7d32', 0.2) : alpha('#757575', 0.2),
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: (editingRoom?.is_active ?? true) ? 'success.main' : 'grey.400',
                }}
              />
              <Typography variant="body2" fontWeight={500}>
                {(editingRoom?.is_active ?? true) ? 'Room is Active' : 'Room is Inactive'}
              </Typography>
            </Box>
            <Switch
              checked={editingRoom?.is_active ?? true}
              onChange={(e) => setEditingRoom({ ...editingRoom, is_active: e.target.checked })}
              color="success"
            />
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
            onClick={() => setDialogOpen(false)}
            color="inherit"
            sx={{ borderRadius: 2, px: 3, textTransform: 'none', fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{
              borderRadius: 2,
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#000000',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              '&:hover': { bgcolor: '#1a1a1a' },
            }}
          >
            {editingRoom?.id ? 'Save Changes' : 'Create Room'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

// ============== Placeholder Tabs (Same as Admin) ==============
// These would be identical to the Admin version - for brevity, showing simplified versions

const GalleryTab = ({ hotel, onRefresh }) => {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Gallery Management
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Manage photos and images for this hotel.
      </Typography>
      {/* Gallery implementation would go here - same as Admin */}
    </Paper>
  );
};

const PricingTab = ({ hotel, onRefresh }) => {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Pricing Management
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Manage room rates and seasonal pricing.
      </Typography>
      {/* Pricing implementation would go here - same as Admin */}
    </Paper>
  );
};

const ServicesTab = ({ hotel, onRefresh }) => {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Services Management
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Manage ancillary services for this hotel.
      </Typography>
      {/* Services implementation would go here - same as Admin */}
    </Paper>
  );
};

const PoliciesTab = ({ hotel, onRefresh }) => {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Policies Management
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Manage hotel policies.
      </Typography>
      {/* Policies implementation would go here - same as Admin */}
    </Paper>
  );
};

export default ManagerHotelView;
