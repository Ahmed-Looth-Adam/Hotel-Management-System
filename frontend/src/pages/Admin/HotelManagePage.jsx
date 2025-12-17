import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  TablePagination,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
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
  Save as SaveIcon,
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
  Spa as AmenitiesIcon,
  FolderOpen as FolderIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import hotelService from '../../services/hotelService';
import { useNotification } from '../../hooks/useNotification';

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
  { label: 'Amenities', icon: <AmenitiesIcon /> },
  { label: 'Services', icon: <ServicesIcon /> },
  { label: 'Policies', icon: <PolicyIcon /> },
];

const HotelManagePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchHotel();
  }, [id]);

  const fetchHotel = async () => {
    setLoading(true);
    const result = await hotelService.getById(id);
    if (result.success) {
      setHotel(result.data);
      setError('');
    } else {
      setError(typeof result.error === 'string' ? result.error : 'Failed to fetch hotel');
    }
    setLoading(false);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/hotels')}
        >
          Back to Hotels
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Container maxWidth="xl" disableGutters>
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
              <IconButton
                onClick={() => navigate('/admin/hotels')}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
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
                    {hotel?.city && hotel?.country
                      ? `${hotel.address || ''} ${hotel.city}, ${hotel.country}`
                      : 'Location not set'}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        sx={{
                          fontSize: 18,
                          color: i < (hotel?.star_rating || 0) ? '#FFD700' : 'rgba(255,255,255,0.3)',
                        }}
                      />
                    ))}
                  </Box>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {hotel?.room_capacity || 0} rooms capacity
                  </Typography>
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
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  minHeight: 56,
                  gap: 1,
                },
              }}
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  icon={tab.icon}
                  iconPosition="start"
                  label={tab.label}
                />
              ))}
            </Tabs>
          </Box>
        </Paper>

        {/* Tab Content */}
        <TabPanel value={activeTab} index={0}>
          <OverviewTab hotel={hotel} onRefresh={fetchHotel} />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <RoomsTab hotel={hotel} onRefresh={fetchHotel} />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <GalleryTab hotel={hotel} onRefresh={fetchHotel} />
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          <PricingTab hotel={hotel} onRefresh={fetchHotel} />
        </TabPanel>
        <TabPanel value={activeTab} index={4}>
          <AmenitiesTab hotel={hotel} onRefresh={fetchHotel} />
        </TabPanel>
        <TabPanel value={activeTab} index={5}>
          <ServicesTab hotel={hotel} onRefresh={fetchHotel} />
        </TabPanel>
        <TabPanel value={activeTab} index={6}>
          <PoliciesTab hotel={hotel} onRefresh={fetchHotel} />
        </TabPanel>
      </Container>
    </Box>
  );
};

// ============== Overview Tab ==============
const OverviewTab = ({ hotel }) => {
  const [roomCount, setRoomCount] = useState(0);

  useEffect(() => {
    const fetchRoomCount = async () => {
      if (hotel?.id) {
        const result = await hotelService.getRooms(hotel.id);
        if (result.success) {
          const data = Array.isArray(result.data) ? result.data : (result.data?.results || []);
          setRoomCount(data.length);
        }
      }
    };
    fetchRoomCount();
  }, [hotel?.id]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Hotel Overview
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Quick overview of your hotel's information and statistics.
      </Typography>

      {/* Stats Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard title="Rooms" value={`${roomCount} / ${hotel?.room_capacity || 0}`} color="#1976d2" />
        <StatCard title="Star Rating" value={`${hotel?.star_rating || 0} Stars`} color="#FFB400" />
        <StatCard title="Status" value={hotel?.is_active ? 'Active' : 'Inactive'} color={hotel?.is_active ? '#4caf50' : '#9e9e9e'} />
        <StatCard title="Manager" value={hotel?.manager_name || 'Not Assigned'} color="#9c27b0" />
      </Box>

      {/* Description */}
      {hotel?.description && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Description
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {hotel.description}
          </Typography>
        </Box>
      )}

      {/* Check-in/Check-out Times */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2,
        }}
      >
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Default Check-in
          </Typography>
          <Typography variant="subtitle2" fontWeight={600}>
            {hotel?.default_checkin_time || '14:00'}
          </Typography>
        </Box>
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Default Check-out
          </Typography>
          <Typography variant="subtitle2" fontWeight={600}>
            {hotel?.default_checkout_time || '12:00'}
          </Typography>
        </Box>
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Max Late Checkout
          </Typography>
          <Typography variant="subtitle2" fontWeight={600}>
            {hotel?.max_late_checkout_time || '18:00'}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

const StatCard = ({ title, value, color }) => (
  <Box
    sx={{
      p: 2,
      bgcolor: alpha(color, 0.08),
      borderRadius: 2,
      borderLeft: `4px solid ${color}`,
    }}
  >
    <Typography variant="caption" color="text.secondary">
      {title}
    </Typography>
    <Typography variant="h6" fontWeight={700} sx={{ color }}>
      {value}
    </Typography>
  </Box>
);

// ============== Rooms Tab ==============
const RoomsTab = ({ hotel }) => {
  const [rooms, setRooms] = useState([]);
  const [roomViews, setRoomViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
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
      occupied: '#ff9800',
      cleaning: '#2196f3',
      out_of_service: '#f44336',
    };
    return colors[status] || '#9e9e9e';
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
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
          size="small"
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
        <>
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
                {rooms
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((room) => (
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
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingRoom(room);
                            setDialogOpen(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(room.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={rooms.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          />
        </>
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

        <DialogContent sx={{ px: 3, py: 2, maxHeight: '70vh', overflowY: 'auto' }}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
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
            onClick={handleSave}
            sx={{
              borderRadius: 2,
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#000000',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              '&:hover': {
                bgcolor: '#1a1a1a',
              },
            }}
          >
            {editingRoom?.id ? 'Save Changes' : 'Create Room'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

// ============== Gallery Tab ==============
const GalleryTab = ({ hotel }) => {
  const [galleries, setGalleries] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingGallery, setEditingGallery] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedGalleryForImages, setSelectedGalleryForImages] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (hotel?.id) {
      fetchGalleries();
      fetchRooms();
    }
  }, [hotel?.id]);

  // Update selectedGalleryForImages when galleries change
  useEffect(() => {
    if (selectedGalleryForImages && galleries.length > 0) {
      const updated = galleries.find(g => g.id === selectedGalleryForImages.id);
      if (updated) {
        setSelectedGalleryForImages(updated);
      }
    }
  }, [galleries]);

  const fetchGalleries = async () => {
    if (!hotel?.id) return;
    setLoading(true);
    const result = await hotelService.getGalleries(hotel.id);
    if (result.success) {
      const data = Array.isArray(result.data) ? result.data : (result.data?.results || []);
      setGalleries(data);
    }
    setLoading(false);
  };

  const fetchRooms = async () => {
    if (!hotel?.id) return;
    const result = await hotelService.getRooms(hotel.id);
    if (result.success) {
      const data = Array.isArray(result.data) ? result.data : (result.data?.results || []);
      setRooms(data);
    }
  };

  const hotelGallery = galleries.find(g => g.gallery_type === 'hotel');
  const roomGalleries = galleries.filter(g => g.gallery_type === 'room');

  const handleSave = async () => {
    const isNew = !editingGallery.id;
    const data = {
      hotel: hotel.id,
      name: editingGallery.name,
      description: editingGallery.description || '',
      gallery_type: 'room', // Room galleries only
    };

    const result = isNew
      ? await hotelService.createGallery(data)
      : await hotelService.updateGallery(editingGallery.id, data);

    if (result.success) {
      showSuccess(isNew ? 'Room gallery created' : 'Gallery updated');
      fetchGalleries();
      setDialogOpen(false);
    } else {
      showError(result.error?.detail || 'Failed to save gallery');
    }
  };

  const handleUpdateHotelGallery = async () => {
    if (!hotelGallery) return;
    const data = {
      hotel: hotel.id,
      name: editingGallery.name,
      description: editingGallery.description || '',
      gallery_type: 'hotel',
    };

    const result = await hotelService.updateGallery(hotelGallery.id, data);
    if (result.success) {
      showSuccess('Hotel gallery updated');
      fetchGalleries();
      setDialogOpen(false);
    } else {
      showError(result.error?.detail || 'Failed to update gallery');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this gallery and all its images? Rooms assigned to it will be unassigned.')) return;
    const result = await hotelService.deleteGallery(id);
    if (result.success) {
      showSuccess('Gallery deleted');
      fetchGalleries();
      fetchRooms();
    } else {
      showError(result.error?.error || 'Failed to delete gallery');
    }
  };

  const openAssignDialog = (gallery) => {
    setSelectedGallery(gallery);
    setSelectedRoomIds(gallery.assigned_rooms?.map(r => r.id) || []);
    setAssignDialogOpen(true);
  };

  const handleAssignRooms = async () => {
    if (!selectedGallery) return;

    // Get currently assigned room IDs
    const currentlyAssigned = selectedGallery.assigned_rooms?.map(r => r.id) || [];

    // Find rooms to assign (newly selected)
    const toAssign = selectedRoomIds.filter(id => !currentlyAssigned.includes(id));
    // Find rooms to unassign (previously assigned but now deselected)
    const toUnassign = currentlyAssigned.filter(id => !selectedRoomIds.includes(id));

    let success = true;

    if (toAssign.length > 0) {
      const result = await hotelService.assignRoomsToGallery(selectedGallery.id, toAssign);
      if (!result.success) {
        showError('Failed to assign some rooms');
        success = false;
      }
    }

    if (toUnassign.length > 0) {
      const result = await hotelService.unassignRoomsFromGallery(selectedGallery.id, toUnassign);
      if (!result.success) {
        showError('Failed to unassign some rooms');
        success = false;
      }
    }

    if (success) {
      showSuccess('Room assignments updated');
    }

    fetchGalleries();
    fetchRooms();
    setAssignDialogOpen(false);
  };

  const getUnassignedRooms = () => {
    return rooms.filter(room => !room.gallery || room.gallery === selectedGallery?.id);
  };

  const openImageDialog = (gallery) => {
    setSelectedGalleryForImages(gallery);
    setImageDialogOpen(true);
  };

  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedGalleryForImages) return;

    setUploading(true);
    let successCount = 0;

    for (const file of files) {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('alt_text', file.name);

      const result = await hotelService.uploadGalleryImage(selectedGalleryForImages.id, formData);
      if (result.success) {
        successCount++;
      }
    }

    if (successCount > 0) {
      showSuccess(`Uploaded ${successCount} image${successCount > 1 ? 's' : ''}`);
      fetchGalleries();
      // Refresh the selected gallery to show new images
      const updatedGallery = galleries.find(g => g.id === selectedGalleryForImages.id);
      if (updatedGallery) {
        setSelectedGalleryForImages(updatedGallery);
      }
    } else {
      showError('Failed to upload images');
    }

    setUploading(false);
    event.target.value = ''; // Reset input
  };

  const handleDeleteImage = async (imageId) => {
    const result = await hotelService.deleteGalleryImage(imageId);
    if (result.success) {
      showSuccess('Image deleted');
      fetchGalleries();
      // Update the selected gallery images
      if (selectedGalleryForImages) {
        setSelectedGalleryForImages({
          ...selectedGalleryForImages,
          images: selectedGalleryForImages.images.filter(img => img.id !== imageId),
          image_count: selectedGalleryForImages.image_count - 1,
        });
      }
    } else {
      showError('Failed to delete image');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Hotel Gallery Section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Hotel Gallery
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Main photo gallery for the hotel
            </Typography>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : hotelGallery ? (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#1976d2', 0.04) }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HotelIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="subtitle1" fontWeight={600}>{hotelGallery.name}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {hotelGallery.image_count} images
                </Typography>
                {hotelGallery.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {hotelGallery.description}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Manage Images">
                  <IconButton size="small" onClick={() => openImageDialog(hotelGallery)}>
                    <PhotoLibraryIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit Details">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditingGallery({ ...hotelGallery, isHotelGallery: true });
                      setDialogOpen(true);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Paper>
        ) : (
          <Box sx={{ p: 4, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">No hotel gallery found.</Typography>
          </Box>
        )}
      </Paper>

      {/* Room Galleries Section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Room Galleries
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create galleries and assign multiple rooms to share the same photos
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingGallery({
                name: '',
                description: '',
                gallery_type: 'room',
              });
              setDialogOpen(true);
            }}
            size="small"
          >
            Add Room Gallery
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : roomGalleries.length === 0 ? (
          <Box sx={{ p: 4, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
            <GalleryIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
            <Typography color="text.secondary">No room galleries yet. Create one to share photos across multiple rooms.</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {roomGalleries.map((gallery) => (
              <Paper key={gallery.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>{gallery.name}</Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {gallery.image_count} images
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        •
                      </Typography>
                      <Typography variant="body2" color={gallery.assigned_rooms_count > 0 ? 'primary.main' : 'text.secondary'}>
                        {gallery.assigned_rooms_count > 0
                          ? `${gallery.assigned_rooms_count} rooms assigned`
                          : 'Unassigned'}
                      </Typography>
                    </Box>
                    {gallery.assigned_rooms_count > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                        {gallery.assigned_rooms?.map(room => (
                          <Chip key={room.id} label={`Room ${room.room_number}`} size="small" variant="outlined" />
                        ))}
                      </Box>
                    )}
                    {gallery.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {gallery.description}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Manage Images">
                      <IconButton size="small" onClick={() => openImageDialog(gallery)}>
                        <PhotoLibraryIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Assign Rooms">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => openAssignDialog(gallery)}
                      >
                        <RoomIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingGallery(gallery);
                          setDialogOpen(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(gallery.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Paper>

      {/* Gallery Edit Dialog */}
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
              {editingGallery?.id ? <EditIcon fontSize="small" /> : <GalleryIcon fontSize="small" />}
            </Avatar>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#ffffff' }}>
              {editingGallery?.isHotelGallery
                ? 'Edit Hotel Gallery'
                : editingGallery?.id
                ? 'Edit Room Gallery'
                : 'Add Room Gallery'}
            </Typography>
          </Box>
          <IconButton onClick={() => setDialogOpen(false)} sx={{ color: '#ffffff' }} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 3, py: 2 }}>
          {/* Gallery Details */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
            <GalleryIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Gallery Details
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Gallery Name"
              value={editingGallery?.name || ''}
              onChange={(e) => setEditingGallery({ ...editingGallery, name: e.target.value })}
              placeholder={editingGallery?.isHotelGallery ? 'e.g., Hotel Photos' : 'e.g., Deluxe Room Photos'}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <GalleryIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 },
              }}
            />
            <TextField
              label="Description"
              value={editingGallery?.description || ''}
              onChange={(e) => setEditingGallery({ ...editingGallery, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
              size="small"
              placeholder="Brief description of the gallery..."
              InputProps={{
                sx: { borderRadius: 2 },
              }}
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
            onClick={editingGallery?.isHotelGallery ? handleUpdateHotelGallery : handleSave}
            sx={{
              borderRadius: 2,
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#000000',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              '&:hover': {
                bgcolor: '#1a1a1a',
              },
            }}
          >
            {editingGallery?.id ? 'Save Changes' : 'Create Gallery'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Rooms Dialog */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
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
              <RoomIcon fontSize="small" />
            </Avatar>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#ffffff' }}>
              Assign Rooms to Gallery
            </Typography>
          </Box>
          <IconButton onClick={() => setAssignDialogOpen(false)} sx={{ color: '#ffffff' }} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 3, py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
            <GalleryIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {selectedGallery?.name}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select rooms that should share this gallery's photos. Rooms can only be assigned to one gallery at a time.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
              maxHeight: 300,
              overflow: 'auto',
              p: 1,
              bgcolor: 'grey.50',
              borderRadius: 2,
            }}
          >
            {rooms.map((room) => {
              const isAssignedToOther = room.gallery && room.gallery !== selectedGallery?.id;
              const otherGallery = isAssignedToOther
                ? roomGalleries.find(g => g.id === room.gallery)
                : null;

              return (
                <Box
                  key={room.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1,
                    bgcolor: 'white',
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: selectedRoomIds.includes(room.id) ? 'primary.main' : 'divider',
                    opacity: isAssignedToOther ? 0.6 : 1,
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      Room {room.room_number}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {room.room_type_category}
                      {isAssignedToOther && ` • Assigned to: ${otherGallery?.name || 'Another gallery'}`}
                    </Typography>
                  </Box>
                  <Switch
                    checked={selectedRoomIds.includes(room.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRoomIds([...selectedRoomIds, room.id]);
                      } else {
                        setSelectedRoomIds(selectedRoomIds.filter(id => id !== room.id));
                      }
                    }}
                    disabled={isAssignedToOther}
                    size="small"
                  />
                </Box>
              );
            })}
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
            onClick={() => setAssignDialogOpen(false)}
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
            onClick={handleAssignRooms}
            sx={{
              borderRadius: 2,
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#000000',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              '&:hover': {
                bgcolor: '#1a1a1a',
              },
            }}
          >
            Save Assignments
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Management Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="md"
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
              <PhotoLibraryIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#ffffff' }}>
                {selectedGalleryForImages?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {selectedGalleryForImages?.image_count || 0} images
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="gallery-image-upload"
              multiple
              type="file"
              onChange={handleImageUpload}
            />
            <label htmlFor="gallery-image-upload">
              <Button
                variant="contained"
                component="span"
                size="small"
                startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : <UploadIcon />}
                disabled={uploading}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: 'rgba(255,255,255,0.15)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.25)',
                  },
                }}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </label>
            <IconButton onClick={() => setImageDialogOpen(false)} sx={{ color: '#ffffff' }} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <DialogContent sx={{ px: 3, py: 2 }}>
          {selectedGalleryForImages?.images?.length > 0 ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 2,
              }}
            >
              {selectedGalleryForImages.images.map((image) => (
                <Paper
                  key={image.id}
                  variant="outlined"
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 2,
                    aspectRatio: '1',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: 3,
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={image.image_url || image.image}
                    alt={image.alt_text || 'Gallery image'}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bgcolor: 'rgba(0,0,0,0.6)',
                      borderBottomLeftRadius: 8,
                    }}
                  >
                    <IconButton
                      size="small"
                      sx={{ color: 'white' }}
                      onClick={() => handleDeleteImage(image.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  {image.is_primary && (
                    <Chip
                      label="Primary"
                      size="small"
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        left: 8,
                        bgcolor: 'primary.main',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.65rem',
                      }}
                    />
                  )}
                </Paper>
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                py: 8,
                textAlign: 'center',
                bgcolor: 'grey.50',
                borderRadius: 2,
              }}
            >
              <ImageIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
              <Typography color="text.secondary" fontWeight={500}>
                No images yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload some images to get started
              </Typography>
            </Box>
          )}
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
            onClick={() => setImageDialogOpen(false)}
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 500,
              bgcolor: '#000000',
              color: '#ffffff',
              '&:hover': {
                bgcolor: '#1a1a1a',
              },
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ============== Pricing Tab ==============
const PricingTab = ({ hotel }) => {
  const [roomTypePricing, setRoomTypePricing] = useState([]);
  const [seasonalPricing, setSeasonalPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPricing, setEditingPricing] = useState(null);
  const [editingSeason, setEditingSeason] = useState(null);
  const [pricingDialog, setPricingDialog] = useState(false);
  const [seasonDialog, setSeasonDialog] = useState(false);
  const { showSuccess, showError } = useNotification();

  const ROOM_TYPE_CHOICES = [
    { value: 'standard', label: 'Standard Double' },
    { value: 'deluxe', label: 'Deluxe King' },
    { value: 'suite', label: 'Family Suite' },
    { value: 'penthouse', label: 'Penthouse' },
  ];

  const DEFAULT_PRICES = {
    standard: { off_peak: 120, peak: 180 },
    deluxe: { off_peak: 180, peak: 250 },
    suite: { off_peak: 240, peak: 320 },
    penthouse: { off_peak: 500, peak: 750 },
  };

  useEffect(() => {
    if (hotel?.id) {
      fetchPricing();
    }
  }, [hotel?.id]);

  const fetchPricing = async () => {
    if (!hotel?.id) return;
    setLoading(true);
    const [pricingResult, seasonResult] = await Promise.all([
      hotelService.getRoomTypePricing(hotel.id),
      hotelService.getSeasonalPricing(hotel.id),
    ]);
    if (pricingResult.success) {
      const data = Array.isArray(pricingResult.data) ? pricingResult.data : (pricingResult.data?.results || []);
      setRoomTypePricing(data);
    }
    if (seasonResult.success) {
      const data = Array.isArray(seasonResult.data) ? seasonResult.data : (seasonResult.data?.results || []);
      setSeasonalPricing(data);
    }
    setLoading(false);
  };

  const handleSavePricing = async () => {
    const isNew = !editingPricing.id;
    const data = {
      hotel: hotel.id,
      room_type: editingPricing.room_type,
      off_peak_price: editingPricing.off_peak_price,
      peak_price: editingPricing.peak_price,
      currency: editingPricing.currency || 'GBP',
      is_active: editingPricing.is_active ?? true,
    };

    const result = isNew
      ? await hotelService.createRoomTypePricing(data)
      : await hotelService.updateRoomTypePricing(editingPricing.id, data);

    if (result.success) {
      showSuccess(isNew ? 'Pricing created' : 'Pricing updated');
      fetchPricing();
      setPricingDialog(false);
    } else {
      showError(result.error?.detail || 'Failed to save pricing');
    }
  };

  const handleDeletePricing = async (id) => {
    if (!confirm('Delete this pricing entry?')) return;
    const result = await hotelService.deleteRoomTypePricing(id);
    if (result.success) {
      showSuccess('Pricing deleted');
      fetchPricing();
    } else {
      showError('Failed to delete pricing');
    }
  };

  const handleSaveSeason = async () => {
    const isNew = !editingSeason.id;
    const data = {
      hotel: hotel.id,
      season_name: editingSeason.season_name,
      start_date: editingSeason.start_date,
      end_date: editingSeason.end_date,
      is_peak_season: editingSeason.is_peak_season ?? false,
      is_active: editingSeason.is_active ?? true,
    };

    const result = isNew
      ? await hotelService.createSeasonalPricing(data)
      : await hotelService.updateSeasonalPricing(editingSeason.id, data);

    if (result.success) {
      showSuccess(isNew ? 'Season created' : 'Season updated');
      fetchPricing();
      setSeasonDialog(false);
    } else {
      showError(result.error?.detail || 'Failed to save season');
    }
  };

  const handleDeleteSeason = async (id) => {
    if (!confirm('Delete this season?')) return;
    const result = await hotelService.deleteSeasonalPricing(id);
    if (result.success) {
      showSuccess('Season deleted');
      fetchPricing();
    } else {
      showError('Failed to delete season');
    }
  };

  const openNewPricing = () => {
    const existingTypes = roomTypePricing.map((p) => p.room_type);
    const availableTypes = ROOM_TYPE_CHOICES.filter((t) => !existingTypes.includes(t.value));
    if (availableTypes.length === 0) {
      showError('All room types already have pricing');
      return;
    }
    const firstType = availableTypes[0].value;
    setEditingPricing({
      room_type: firstType,
      off_peak_price: DEFAULT_PRICES[firstType]?.off_peak || 100,
      peak_price: DEFAULT_PRICES[firstType]?.peak || 150,
      currency: 'GBP',
      is_active: true,
    });
    setPricingDialog(true);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Room Type Pricing Section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Room Type Pricing
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Set off-peak and peak season prices per room type
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openNewPricing}
            size="small"
          >
            Add Pricing
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : roomTypePricing.length === 0 ? (
          <Box sx={{ p: 4, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
            <PricingIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
            <Typography color="text.secondary">No pricing configured yet.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Room Type</TableCell>
                  <TableCell align="right">Off-Peak Price</TableCell>
                  <TableCell align="right">Peak Price</TableCell>
                  <TableCell>Currency</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roomTypePricing.map((pricing) => (
                  <TableRow key={pricing.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{pricing.room_type_display}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        icon={<OffPeakIcon sx={{ fontSize: 16 }} />}
                        label={`${pricing.currency} ${pricing.off_peak_price}`}
                        size="small"
                        sx={{ bgcolor: alpha('#2196f3', 0.1), color: '#1565c0' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        icon={<PeakIcon sx={{ fontSize: 16 }} />}
                        label={`${pricing.currency} ${pricing.peak_price}`}
                        size="small"
                        sx={{ bgcolor: alpha('#ff9800', 0.1), color: '#e65100' }}
                      />
                    </TableCell>
                    <TableCell>{pricing.currency}</TableCell>
                    <TableCell>
                      <Chip
                        label={pricing.is_active ? 'Yes' : 'No'}
                        size="small"
                        color={pricing.is_active ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingPricing(pricing);
                            setPricingDialog(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeletePricing(pricing.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Seasonal Pricing Section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Seasonal Pricing
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Define peak and off-peak seasons by date range
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingSeason({
                season_name: '',
                start_date: '',
                end_date: '',
                is_peak_season: false,
                is_active: true,
              });
              setSeasonDialog(true);
            }}
            size="small"
          >
            Add Season
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : seasonalPricing.length === 0 ? (
          <Box sx={{ p: 4, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
            <DateRangeIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
            <Typography color="text.secondary">No seasons defined. Off-peak prices will apply.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Season Name</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {seasonalPricing.map((season) => (
                  <TableRow key={season.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{season.season_name}</Typography>
                    </TableCell>
                    <TableCell>{season.start_date}</TableCell>
                    <TableCell>{season.end_date}</TableCell>
                    <TableCell>
                      <Chip
                        icon={season.is_peak_season ? <PeakIcon sx={{ fontSize: 16 }} /> : <OffPeakIcon sx={{ fontSize: 16 }} />}
                        label={season.is_peak_season ? 'Peak' : 'Off-Peak'}
                        size="small"
                        sx={{
                          bgcolor: alpha(season.is_peak_season ? '#ff9800' : '#2196f3', 0.1),
                          color: season.is_peak_season ? '#e65100' : '#1565c0',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={season.is_active ? 'Yes' : 'No'}
                        size="small"
                        color={season.is_active ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingSeason(season);
                            setSeasonDialog(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteSeason(season.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Pricing Dialog */}
      <Dialog
        open={pricingDialog}
        onClose={() => setPricingDialog(false)}
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
              {editingPricing?.id ? <EditIcon fontSize="small" /> : <PricingIcon fontSize="small" />}
            </Avatar>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#ffffff' }}>
              {editingPricing?.id ? 'Edit Room Type Pricing' : 'Add Room Type Pricing'}
            </Typography>
          </Box>
          <IconButton onClick={() => setPricingDialog(false)} sx={{ color: '#ffffff' }} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 3, py: 2 }}>
          {/* Room Type */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
            <CategoryIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Room Type
            </Typography>
          </Box>
          <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
            <Select
              value={editingPricing?.room_type || ''}
              onChange={(e) => {
                const type = e.target.value;
                setEditingPricing({
                  ...editingPricing,
                  room_type: type,
                  off_peak_price: DEFAULT_PRICES[type]?.off_peak || editingPricing?.off_peak_price,
                  peak_price: DEFAULT_PRICES[type]?.peak || editingPricing?.peak_price,
                });
              }}
              disabled={!!editingPricing?.id}
              sx={{ borderRadius: 2 }}
              displayEmpty
            >
              <MenuItem value="" disabled>Select room type</MenuItem>
              {ROOM_TYPE_CHOICES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Pricing */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
            <PricingIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Pricing (Per Night)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
            <TextField
              label="Off-Peak Price"
              type="number"
              value={editingPricing?.off_peak_price || ''}
              onChange={(e) => setEditingPricing({ ...editingPricing, off_peak_price: e.target.value })}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    £
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 },
              }}
            />
            <TextField
              label="Peak Price"
              type="number"
              value={editingPricing?.peak_price || ''}
              onChange={(e) => setEditingPricing({ ...editingPricing, peak_price: e.target.value })}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    £
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 },
              }}
            />
          </Box>

          {/* Status */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.5,
              bgcolor: (editingPricing?.is_active ?? true) ? alpha('#2e7d32', 0.08) : alpha('#757575', 0.08),
              borderRadius: 2,
              border: '1px solid',
              borderColor: (editingPricing?.is_active ?? true) ? alpha('#2e7d32', 0.2) : alpha('#757575', 0.2),
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: (editingPricing?.is_active ?? true) ? 'success.main' : 'grey.400',
                }}
              />
              <Typography variant="body2" fontWeight={500}>
                {(editingPricing?.is_active ?? true) ? 'Pricing is Active' : 'Pricing is Inactive'}
              </Typography>
            </Box>
            <Switch
              checked={editingPricing?.is_active ?? true}
              onChange={(e) => setEditingPricing({ ...editingPricing, is_active: e.target.checked })}
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
            onClick={() => setPricingDialog(false)}
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
            onClick={handleSavePricing}
            sx={{
              borderRadius: 2,
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#000000',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              '&:hover': {
                bgcolor: '#1a1a1a',
              },
            }}
          >
            {editingPricing?.id ? 'Save Changes' : 'Create Pricing'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Season Dialog */}
      <Dialog
        open={seasonDialog}
        onClose={() => setSeasonDialog(false)}
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
              {editingSeason?.id ? <EditIcon fontSize="small" /> : <DateRangeIcon fontSize="small" />}
            </Avatar>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#ffffff' }}>
              {editingSeason?.id ? 'Edit Season' : 'Add Season'}
            </Typography>
          </Box>
          <IconButton onClick={() => setSeasonDialog(false)} sx={{ color: '#ffffff' }} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 3, py: 2 }}>
          {/* Season Name */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
            <DateRangeIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Season Details
            </Typography>
          </Box>
          <TextField
            label="Season Name"
            value={editingSeason?.season_name || ''}
            onChange={(e) => setEditingSeason({ ...editingSeason, season_name: e.target.value })}
            placeholder="e.g., Summer Peak, Christmas"
            fullWidth
            size="small"
            sx={{ mb: 2.5 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <DateRangeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
              sx: { borderRadius: 2 },
            }}
          />

          {/* Date Range */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
            <DateRangeIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Date Range
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
            <TextField
              label="Start Date"
              type="date"
              value={editingSeason?.start_date || ''}
              onChange={(e) => setEditingSeason({ ...editingSeason, start_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
              InputProps={{
                sx: { borderRadius: 2 },
              }}
            />
            <TextField
              label="End Date"
              type="date"
              value={editingSeason?.end_date || ''}
              onChange={(e) => setEditingSeason({ ...editingSeason, end_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
              InputProps={{
                sx: { borderRadius: 2 },
              }}
            />
          </Box>

          {/* Peak Season Toggle */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.5,
              mb: 1.5,
              bgcolor: (editingSeason?.is_peak_season ?? false) ? alpha('#ff9800', 0.08) : alpha('#2196f3', 0.08),
              borderRadius: 2,
              border: '1px solid',
              borderColor: (editingSeason?.is_peak_season ?? false) ? alpha('#ff9800', 0.2) : alpha('#2196f3', 0.2),
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {(editingSeason?.is_peak_season ?? false) ? (
                <PeakIcon sx={{ color: 'warning.main', fontSize: 20 }} />
              ) : (
                <OffPeakIcon sx={{ color: 'info.main', fontSize: 20 }} />
              )}
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  {(editingSeason?.is_peak_season ?? false) ? 'Peak Season' : 'Off-Peak Season'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(editingSeason?.is_peak_season ?? false) ? 'Higher prices apply' : 'Standard prices apply'}
                </Typography>
              </Box>
            </Box>
            <Switch
              checked={editingSeason?.is_peak_season ?? false}
              onChange={(e) => setEditingSeason({ ...editingSeason, is_peak_season: e.target.checked })}
              color="warning"
            />
          </Box>

          {/* Status */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.5,
              bgcolor: (editingSeason?.is_active ?? true) ? alpha('#2e7d32', 0.08) : alpha('#757575', 0.08),
              borderRadius: 2,
              border: '1px solid',
              borderColor: (editingSeason?.is_active ?? true) ? alpha('#2e7d32', 0.2) : alpha('#757575', 0.2),
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: (editingSeason?.is_active ?? true) ? 'success.main' : 'grey.400',
                }}
              />
              <Typography variant="body2" fontWeight={500}>
                {(editingSeason?.is_active ?? true) ? 'Season is Active' : 'Season is Inactive'}
              </Typography>
            </Box>
            <Switch
              checked={editingSeason?.is_active ?? true}
              onChange={(e) => setEditingSeason({ ...editingSeason, is_active: e.target.checked })}
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
            onClick={() => setSeasonDialog(false)}
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
            onClick={handleSaveSeason}
            sx={{
              borderRadius: 2,
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#000000',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              '&:hover': {
                bgcolor: '#1a1a1a',
              },
            }}
          >
            {editingSeason?.id ? 'Save Changes' : 'Create Season'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ============== Amenities Tab ==============
const AmenitiesTab = ({ hotel }) => {
  const [categories, setCategories] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingAmenity, setEditingAmenity] = useState(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [amenityDialogOpen, setAmenityDialogOpen] = useState(false);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (hotel?.id) {
      fetchData();
    }
  }, [hotel?.id]);

  const fetchData = async () => {
    if (!hotel?.id) return;
    setLoading(true);
    const [catResult, amenResult] = await Promise.all([
      hotelService.getAmenityCategories(hotel.id),
      hotelService.getAmenities(hotel.id),
    ]);
    if (catResult.success) {
      const data = Array.isArray(catResult.data) ? catResult.data : (catResult.data?.results || []);
      setCategories(data);
      // Auto-expand all categories initially
      const expanded = {};
      data.forEach(cat => { expanded[cat.id] = true; });
      setExpandedCategories(expanded);
    }
    if (amenResult.success) {
      const data = Array.isArray(amenResult.data) ? amenResult.data : (amenResult.data?.results || []);
      setAmenities(data);
    }
    setLoading(false);
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const getAmenitiesByCategory = (categoryId) => {
    return amenities.filter(a => a.category === categoryId);
  };

  // Category CRUD
  const handleSaveCategory = async () => {
    const isNew = !editingCategory.id;
    const data = {
      hotel: hotel.id,
      name: editingCategory.name,
      description: editingCategory.description || '',
      sort_order: editingCategory.sort_order || 0,
      is_active: editingCategory.is_active ?? true,
    };

    const result = isNew
      ? await hotelService.createAmenityCategory(data)
      : await hotelService.updateAmenityCategory(editingCategory.id, data);

    if (result.success) {
      showSuccess(isNew ? 'Category created' : 'Category updated');
      fetchData();
      setCategoryDialogOpen(false);
    } else {
      showError(result.error?.detail || result.error?.name?.[0] || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (id) => {
    const categoryAmenities = getAmenitiesByCategory(id);
    if (categoryAmenities.length > 0) {
      showError('Cannot delete category with amenities. Remove amenities first.');
      return;
    }
    if (!confirm('Delete this category?')) return;
    const result = await hotelService.deleteAmenityCategory(id);
    if (result.success) {
      showSuccess('Category deleted');
      fetchData();
    } else {
      showError('Failed to delete category');
    }
  };

  // Amenity CRUD
  const handleSaveAmenity = async () => {
    const isNew = !editingAmenity.id;
    const data = {
      hotel: hotel.id,
      category: editingAmenity.category,
      name: editingAmenity.name,
      description: editingAmenity.description || '',
      icon: editingAmenity.icon || '',
      sort_order: editingAmenity.sort_order || 0,
      is_active: editingAmenity.is_active ?? true,
    };

    const result = isNew
      ? await hotelService.createAmenity(data)
      : await hotelService.updateAmenity(editingAmenity.id, data);

    if (result.success) {
      showSuccess(isNew ? 'Amenity created' : 'Amenity updated');
      fetchData();
      setAmenityDialogOpen(false);
    } else {
      showError(result.error?.detail || result.error?.name?.[0] || 'Failed to save amenity');
    }
  };

  const handleDeleteAmenity = async (id) => {
    if (!confirm('Delete this amenity?')) return;
    const result = await hotelService.deleteAmenity(id);
    if (result.success) {
      showSuccess('Amenity deleted');
      fetchData();
    } else {
      showError('Failed to delete amenity');
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Amenities Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage amenity categories and individual amenities for your hotel.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingCategory({
              name: '',
              description: '',
              sort_order: categories.length,
              is_active: true,
            });
            setCategoryDialogOpen(true);
          }}
          size="small"
        >
          Add Category
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : categories.length === 0 ? (
        <Box sx={{ p: 4, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
          <AmenitiesIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
          <Typography color="text.secondary">No amenity categories yet.</Typography>
          <Typography variant="caption" color="text.secondary">
            Create categories like "Bathroom", "Electronics", "Comfort" to organize your amenities.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {categories.map((category) => (
            <Paper
              key={category.id}
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              {/* Category Header */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  bgcolor: expandedCategories[category.id] ? 'primary.50' : 'grey.50',
                  borderBottom: expandedCategories[category.id] ? '1px solid' : 'none',
                  borderColor: 'divider',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: expandedCategories[category.id] ? 'primary.100' : 'grey.100' },
                }}
                onClick={() => toggleCategory(category.id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {expandedCategories[category.id] ? (
                    <ExpandMoreIcon sx={{ color: 'primary.main' }} />
                  ) : (
                    <ChevronRightIcon sx={{ color: 'text.secondary' }} />
                  )}
                  <FolderIcon sx={{ color: expandedCategories[category.id] ? 'primary.main' : 'text.secondary' }} />
                  <Box>
                    <Typography fontWeight={600}>{category.name}</Typography>
                    {category.description && (
                      <Typography variant="caption" color="text.secondary">
                        {category.description}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={`${getAmenitiesByCategory(category.id).length} amenities`}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                  {!category.is_active && (
                    <Chip label="Inactive" size="small" color="default" />
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="Add Amenity">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => {
                        setEditingAmenity({
                          category: category.id,
                          name: '',
                          description: '',
                          icon: '',
                          sort_order: getAmenitiesByCategory(category.id).length,
                          is_active: true,
                        });
                        setAmenityDialogOpen(true);
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Category">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingCategory(category);
                        setCategoryDialogOpen(true);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Category">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Amenities List */}
              {expandedCategories[category.id] && (
                <Box sx={{ p: 2 }}>
                  {getAmenitiesByCategory(category.id).length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No amenities in this category yet.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {getAmenitiesByCategory(category.id).map((amenity) => (
                        <Chip
                          key={amenity.id}
                          label={amenity.name}
                          variant={amenity.is_active ? 'filled' : 'outlined'}
                          color={amenity.is_active ? 'primary' : 'default'}
                          onDelete={() => handleDeleteAmenity(amenity.id)}
                          onClick={() => {
                            setEditingAmenity(amenity);
                            setAmenityDialogOpen(true);
                          }}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': { bgcolor: amenity.is_active ? 'primary.dark' : 'grey.200' },
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          ))}
        </Box>
      )}

      {/* Category Dialog */}
      <Dialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
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
            <Avatar sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', width: 36, height: 36 }}>
              {editingCategory?.id ? <EditIcon fontSize="small" /> : <FolderIcon fontSize="small" />}
            </Avatar>
            <Typography variant="subtitle1" fontWeight={600}>
              {editingCategory?.id ? 'Edit Category' : 'Add Category'}
            </Typography>
          </Box>
          <IconButton onClick={() => setCategoryDialogOpen(false)} sx={{ color: '#ffffff' }} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 3, py: 2 }}>
          <TextField
            label="Category Name"
            value={editingCategory?.name || ''}
            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            placeholder="e.g., Bathroom, Electronics, Comfort"
          />
          <TextField
            label="Description"
            value={editingCategory?.description || ''}
            onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
            fullWidth
            size="small"
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Sort Order"
            type="number"
            value={editingCategory?.sort_order || 0}
            onChange={(e) => setEditingCategory({ ...editingCategory, sort_order: parseInt(e.target.value) || 0 })}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={editingCategory?.is_active ?? true}
                onChange={(e) => setEditingCategory({ ...editingCategory, is_active: e.target.checked })}
                color="success"
              />
            }
            label="Active"
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setCategoryDialogOpen(false)} color="inherit" sx={{ borderRadius: 2, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveCategory}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#000000',
              '&:hover': { bgcolor: '#1a1a1a' },
            }}
          >
            {editingCategory?.id ? 'Save Changes' : 'Create Category'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Amenity Dialog */}
      <Dialog
        open={amenityDialogOpen}
        onClose={() => setAmenityDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
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
            <Avatar sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', width: 36, height: 36 }}>
              {editingAmenity?.id ? <EditIcon fontSize="small" /> : <AmenitiesIcon fontSize="small" />}
            </Avatar>
            <Typography variant="subtitle1" fontWeight={600}>
              {editingAmenity?.id ? 'Edit Amenity' : 'Add Amenity'}
            </Typography>
          </Box>
          <IconButton onClick={() => setAmenityDialogOpen(false)} sx={{ color: '#ffffff' }} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 3, py: 2 }}>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={editingAmenity?.category || ''}
              onChange={(e) => setEditingAmenity({ ...editingAmenity, category: e.target.value })}
              label="Category"
            >
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Amenity Name"
            value={editingAmenity?.name || ''}
            onChange={(e) => setEditingAmenity({ ...editingAmenity, name: e.target.value })}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            placeholder="e.g., Free WiFi, Air Conditioning, Minibar"
          />
          <TextField
            label="Description"
            value={editingAmenity?.description || ''}
            onChange={(e) => setEditingAmenity({ ...editingAmenity, description: e.target.value })}
            fullWidth
            size="small"
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Icon (optional)"
            value={editingAmenity?.icon || ''}
            onChange={(e) => setEditingAmenity({ ...editingAmenity, icon: e.target.value })}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            placeholder="e.g., wifi, ac_unit, local_bar"
            helperText="Material icon name (optional)"
          />
          <TextField
            label="Sort Order"
            type="number"
            value={editingAmenity?.sort_order || 0}
            onChange={(e) => setEditingAmenity({ ...editingAmenity, sort_order: parseInt(e.target.value) || 0 })}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={editingAmenity?.is_active ?? true}
                onChange={(e) => setEditingAmenity({ ...editingAmenity, is_active: e.target.checked })}
                color="success"
              />
            }
            label="Active"
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setAmenityDialogOpen(false)} color="inherit" sx={{ borderRadius: 2, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAmenity}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#000000',
              '&:hover': { bgcolor: '#1a1a1a' },
            }}
          >
            {editingAmenity?.id ? 'Save Changes' : 'Create Amenity'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

// ============== Services Tab ==============
const ServicesTab = ({ hotel }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { showSuccess, showError } = useNotification();

  const SERVICE_TYPES = [
    { value: 'airport_transfer', label: 'Airport Transfer' },
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'spa', label: 'Spa Access' },
    { value: 'late_checkout', label: 'Late Checkout' },
    { value: 'parking', label: 'Parking' },
    { value: 'minibar', label: 'Minibar' },
    { value: 'laundry', label: 'Laundry' },
    { value: 'room_service', label: 'Room Service' },
    { value: 'other', label: 'Other' },
  ];

  const PRICING_TYPES = [
    { value: 'per_booking', label: 'Per Booking' },
    { value: 'per_person', label: 'Per Person' },
    { value: 'per_person_per_day', label: 'Per Person Per Day' },
    { value: 'per_day', label: 'Per Day' },
    { value: 'one_time', label: 'One Time' },
  ];

  useEffect(() => {
    if (hotel?.id) {
      fetchServices();
    }
  }, [hotel?.id]);

  const fetchServices = async () => {
    if (!hotel?.id) return;
    setLoading(true);
    const result = await hotelService.getAncillaryServices(hotel.id);
    if (result.success) {
      const data = Array.isArray(result.data) ? result.data : (result.data?.results || []);
      setServices(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    const isNew = !editingService.id;
    const data = {
      hotel: hotel.id,
      name: editingService.name,
      service_type: editingService.service_type,
      description: editingService.description || '',
      price: editingService.price,
      currency: editingService.currency || 'GBP',
      pricing_type: editingService.pricing_type || 'one_time',
      is_active: editingService.is_active ?? true,
    };

    const result = isNew
      ? await hotelService.createAncillaryService(data)
      : await hotelService.updateAncillaryService(editingService.id, data);

    if (result.success) {
      showSuccess(isNew ? 'Service created' : 'Service updated');
      fetchServices();
      setDialogOpen(false);
    } else {
      showError(result.error?.detail || 'Failed to save service');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this service?')) return;
    const result = await hotelService.deleteAncillaryService(id);
    if (result.success) {
      showSuccess('Service deleted');
      fetchServices();
    } else {
      showError('Failed to delete service');
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Ancillary Services
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage additional services like airport transfer, breakfast, spa, etc.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingService({
              name: '',
              service_type: 'other',
              description: '',
              price: 0,
              currency: 'GBP',
              pricing_type: 'one_time',
              is_active: true,
            });
            setDialogOpen(true);
          }}
          size="small"
        >
          Add Service
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : services.length === 0 ? (
        <Box sx={{ p: 4, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
          <ServicesIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
          <Typography color="text.secondary">No services configured yet.</Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Service</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell>Pricing Type</TableCell>
                <TableCell>Active</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{service.name}</Typography>
                    {service.description && (
                      <Typography variant="caption" color="text.secondary">
                        {service.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{service.service_type_display}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={600}>
                      {service.currency} {service.price}
                    </Typography>
                  </TableCell>
                  <TableCell>{service.pricing_type_display}</TableCell>
                  <TableCell>
                    <Chip
                      label={service.is_active ? 'Yes' : 'No'}
                      size="small"
                      color={service.is_active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingService(service);
                          setDialogOpen(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(service.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Service Dialog */}
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
              {editingService?.id ? <EditIcon fontSize="small" /> : <ServicesIcon fontSize="small" />}
            </Avatar>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#ffffff' }}>
              {editingService?.id ? 'Edit Ancillary Service' : 'Add Ancillary Service'}
            </Typography>
          </Box>
          <IconButton onClick={() => setDialogOpen(false)} sx={{ color: '#ffffff' }} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 3, py: 2 }}>
          {/* Service Details */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
            <ServicesIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Service Details
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2.5 }}>
            <TextField
              label="Service Name"
              value={editingService?.name || ''}
              onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
              placeholder="e.g., Airport Transfer (One-way)"
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ServicesIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 },
              }}
            />
            <FormControl fullWidth size="small">
              <InputLabel>Service Type</InputLabel>
              <Select
                value={editingService?.service_type || 'other'}
                label="Service Type"
                onChange={(e) => setEditingService({ ...editingService, service_type: e.target.value })}
                sx={{ borderRadius: 2 }}
              >
                {SERVICE_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Description"
              value={editingService?.description || ''}
              onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
              placeholder="Brief description of the service..."
              multiline
              rows={2}
              fullWidth
              size="small"
              InputProps={{
                sx: { borderRadius: 2 },
              }}
            />
          </Box>

          {/* Pricing */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
            <PricingIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Pricing
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
            <TextField
              label="Price"
              type="number"
              value={editingService?.price || ''}
              onChange={(e) => setEditingService({ ...editingService, price: e.target.value })}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    £
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 },
              }}
            />
            <FormControl fullWidth size="small">
              <InputLabel>Pricing Type</InputLabel>
              <Select
                value={editingService?.pricing_type || 'one_time'}
                label="Pricing Type"
                onChange={(e) => setEditingService({ ...editingService, pricing_type: e.target.value })}
                sx={{ borderRadius: 2 }}
              >
                {PRICING_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Status */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.5,
              bgcolor: (editingService?.is_active ?? true) ? alpha('#2e7d32', 0.08) : alpha('#757575', 0.08),
              borderRadius: 2,
              border: '1px solid',
              borderColor: (editingService?.is_active ?? true) ? alpha('#2e7d32', 0.2) : alpha('#757575', 0.2),
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: (editingService?.is_active ?? true) ? 'success.main' : 'grey.400',
                }}
              />
              <Typography variant="body2" fontWeight={500}>
                {(editingService?.is_active ?? true) ? 'Service is Active' : 'Service is Inactive'}
              </Typography>
            </Box>
            <Switch
              checked={editingService?.is_active ?? true}
              onChange={(e) => setEditingService({ ...editingService, is_active: e.target.checked })}
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
            onClick={handleSave}
            sx={{
              borderRadius: 2,
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#000000',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              '&:hover': {
                bgcolor: '#1a1a1a',
              },
            }}
          >
            {editingService?.id ? 'Save Changes' : 'Create Service'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

// ============== Policies Tab ==============
const PoliciesTab = ({ hotel }) => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { showSuccess, showError } = useNotification();

  const POLICY_TYPES = [
    { value: 'cancellation', label: 'Cancellation Policy' },
    { value: 'check_in_out', label: 'Check-in/Check-out Policy' },
    { value: 'payment', label: 'Payment Policy' },
    { value: 'house_rules', label: 'House Rules' },
    { value: 'age_restriction', label: 'Age Restriction Policy' },
    { value: 'damage_deposit', label: 'Damage & Deposit Policy' },
    { value: 'special_requests', label: 'Special Requests Policy' },
  ];

  useEffect(() => {
    if (hotel?.id) {
      fetchPolicies();
    }
  }, [hotel?.id]);

  const fetchPolicies = async () => {
    if (!hotel?.id) return;
    setLoading(true);
    const result = await hotelService.getPolicies(hotel.id);
    if (result.success) {
      const data = Array.isArray(result.data) ? result.data : (result.data?.results || []);
      setPolicies(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    const isNew = !editingPolicy.id;
    const data = {
      hotel: hotel.id,
      policy_type: editingPolicy.policy_type,
      title: editingPolicy.title,
      description: editingPolicy.description,
      is_active: editingPolicy.is_active ?? true,
    };

    const result = isNew
      ? await hotelService.createPolicy(data)
      : await hotelService.updatePolicy(editingPolicy.id, data);

    if (result.success) {
      showSuccess(isNew ? 'Policy created' : 'Policy updated');
      fetchPolicies();
      setDialogOpen(false);
    } else {
      showError(result.error?.detail || 'Failed to save policy');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this policy?')) return;
    const result = await hotelService.deletePolicy(id);
    if (result.success) {
      showSuccess('Policy deleted');
      fetchPolicies();
    } else {
      showError('Failed to delete policy');
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Hotel Policies
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure cancellation, check-in/out, and other policies.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingPolicy({
              policy_type: 'cancellation',
              title: '',
              description: '',
              is_active: true,
            });
            setDialogOpen(true);
          }}
          size="small"
        >
          Add Policy
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : policies.length === 0 ? (
        <Box sx={{ p: 4, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
          <PolicyIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
          <Typography color="text.secondary">No policies configured yet.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {policies.map((policy) => (
            <Paper key={policy.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip label={policy.policy_type_display} size="small" color="primary" variant="outlined" />
                    {!policy.is_active && <Chip label="Inactive" size="small" color="default" />}
                  </Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {policy.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                    {policy.description}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingPolicy(policy);
                        setDialogOpen(true);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(policy.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Policy Dialog */}
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
              {editingPolicy?.id ? <EditIcon fontSize="small" /> : <PolicyIcon fontSize="small" />}
            </Avatar>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#ffffff' }}>
              {editingPolicy?.id ? 'Edit Hotel Policy' : 'Add Hotel Policy'}
            </Typography>
          </Box>
          <IconButton onClick={() => setDialogOpen(false)} sx={{ color: '#ffffff' }} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 3, py: 2 }}>
          {/* Policy Type */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
            <PolicyIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Policy Type
            </Typography>
          </Box>
          <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
            <Select
              value={editingPolicy?.policy_type || 'cancellation'}
              onChange={(e) => setEditingPolicy({ ...editingPolicy, policy_type: e.target.value })}
              sx={{ borderRadius: 2 }}
            >
              {POLICY_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Policy Details */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
            <PolicyIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Policy Details
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2.5 }}>
            <TextField
              label="Title"
              value={editingPolicy?.title || ''}
              onChange={(e) => setEditingPolicy({ ...editingPolicy, title: e.target.value })}
              placeholder="e.g., Standard Cancellation Policy"
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PolicyIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 },
              }}
            />
            <TextField
              label="Description"
              value={editingPolicy?.description || ''}
              onChange={(e) => setEditingPolicy({ ...editingPolicy, description: e.target.value })}
              placeholder="Describe the policy details..."
              multiline
              rows={4}
              fullWidth
              size="small"
              InputProps={{
                sx: { borderRadius: 2 },
              }}
            />
          </Box>

          {/* Status */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.5,
              bgcolor: (editingPolicy?.is_active ?? true) ? alpha('#2e7d32', 0.08) : alpha('#757575', 0.08),
              borderRadius: 2,
              border: '1px solid',
              borderColor: (editingPolicy?.is_active ?? true) ? alpha('#2e7d32', 0.2) : alpha('#757575', 0.2),
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: (editingPolicy?.is_active ?? true) ? 'success.main' : 'grey.400',
                }}
              />
              <Typography variant="body2" fontWeight={500}>
                {(editingPolicy?.is_active ?? true) ? 'Policy is Active' : 'Policy is Inactive'}
              </Typography>
            </Box>
            <Switch
              checked={editingPolicy?.is_active ?? true}
              onChange={(e) => setEditingPolicy({ ...editingPolicy, is_active: e.target.checked })}
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
            onClick={handleSave}
            sx={{
              borderRadius: 2,
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#000000',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              '&:hover': {
                bgcolor: '#1a1a1a',
              },
            }}
          >
            {editingPolicy?.id ? 'Save Changes' : 'Create Policy'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default HotelManagePage;
