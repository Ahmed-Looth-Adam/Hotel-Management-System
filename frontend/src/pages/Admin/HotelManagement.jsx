import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Chip,
  Switch,
  Alert,
  IconButton,
  Tooltip,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Avatar,
  Fade,
  LinearProgress,
  alpha,
  useTheme,
  Snackbar,
  Dialog,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Hotel as HotelIcon,
  Star as StarIcon,
  Apartment as ApartmentIcon,
  CheckCircle as ActiveIcon,
  MeetingRoom as RoomIcon,
  Person as ManagerIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
} from '@mui/icons-material';
import hotelService from '../../services/hotelService';
import HotelFormModal from '../../components/admin/HotelFormModal';
import { useNotificationContext } from '../../context/NotificationContext';

const StatsCard = ({ title, value, icon: Icon, color, subtitle }) => {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        minHeight: 140,
        background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
        border: `1px solid ${alpha(color, 0.2)}`,
        borderRadius: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 25px ${alpha(color, 0.25)}`,
        },
      }}
    >
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom noWrap>
              {title}
            </Typography>
            <Typography variant="h3" fontWeight={700} sx={{ color }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {subtitle || '\u00A0'}
            </Typography>
          </Box>
          <Avatar
            sx={{
              bgcolor: alpha(color, 0.15),
              color: color,
              width: 56,
              height: 56,
              flexShrink: 0,
            }}
          >
            <Icon sx={{ fontSize: 28 }} />
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

const StarRating = ({ rating }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
    {[...Array(5)].map((_, i) => (
      <StarIcon
        key={i}
        sx={{
          fontSize: 16,
          color: i < rating ? '#FFB400' : 'grey.300',
        }}
      />
    ))}
  </Box>
);

const HotelManagement = () => {
  const theme = useTheme();
  const { addNotification } = useNotificationContext();
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [hotelToEdit, setHotelToEdit] = useState(null);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [hotelToDelete, setHotelToDelete] = useState(null);

  useEffect(() => {
    fetchHotels();
  }, []);

  useEffect(() => {
    filterHotels();
    setCurrentPage(1);
  }, [hotels, searchTerm, statusFilter]);

  const filterHotels = () => {
    let result = [...hotels];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (hotel) =>
          hotel.name?.toLowerCase().includes(term) ||
          hotel.city?.toLowerCase().includes(term) ||
          hotel.country?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((hotel) =>
        statusFilter === 'active' ? hotel.is_active : !hotel.is_active
      );
    }

    setFilteredHotels(result);
  };

  const fetchHotels = async () => {
    setLoading(true);
    const result = await hotelService.getAll();
    if (result.success) {
      let data = result.data.results || result.data;
      if (!Array.isArray(data)) {
        data = [];
      }
      setHotels(data);
      setError('');
    } else {
      setError(typeof result.error === 'string' ? result.error : 'Failed to fetch hotels');
    }
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setHotelToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (hotel) => {
    setHotelToEdit(hotel);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setHotelToEdit(null);
  };

  const handleSaveHotel = async (hotelId, payload) => {
    let result;
    if (!hotelId) {
      result = await hotelService.create(payload);
      if (result.success) {
        setSuccess(`Hotel "${result.data.name}" created successfully.`);
        addNotification(
          `New hotel "${result.data.name}" has been created`,
          'hotel_created',
          '/admin/hotels'
        );
        fetchHotels();
      }
    } else {
      result = await hotelService.update(hotelId, payload);
      if (result.success) {
        setSuccess(`Hotel "${result.data.name}" updated successfully.`);
        fetchHotels();
      }
    }
    setTimeout(() => setSuccess(''), 4000);
    return result;
  };

  const handleStatusToggle = async (hotelId, currentStatus) => {
    setHotels((prev) =>
      prev.map((h) => (h.id === hotelId ? { ...h, is_active: !currentStatus } : h))
    );

    const result = await hotelService.patch(hotelId, { is_active: !currentStatus });

    if (result.success) {
      setSuccess(`Hotel ${!currentStatus ? 'activated' : 'deactivated'} successfully.`);
    } else {
      setHotels((prev) =>
        prev.map((h) => (h.id === hotelId ? { ...h, is_active: currentStatus } : h))
      );
      setError(typeof result.error === 'string' ? result.error : 'Failed to update status');
    }
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 3000);
  };

  const handleOpenDeleteModal = (hotel) => {
    setHotelToDelete(hotel);
    setDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setHotelToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!hotelToDelete) return;

    const hotelId = hotelToDelete.id;
    const deletedHotelName = hotelToDelete.name;
    handleCloseDeleteModal();

    setHotels((prev) => prev.filter((h) => h.id !== hotelId));
    const result = await hotelService.delete(hotelId);

    if (result.success) {
      setSuccess(`Hotel "${deletedHotelName}" deleted permanently.`);
      addNotification(
        `Hotel "${deletedHotelName}" has been permanently deleted`,
        'hotel_deleted',
        '/admin/hotels'
      );
    } else {
      fetchHotels();
      setError(typeof result.error === 'string' ? result.error : 'Failed to delete hotel');
    }
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 3000);
  };

  // Calculate stats
  const stats = {
    total: hotels.length,
    active: hotels.filter((h) => h.is_active).length,
    totalRooms: hotels.reduce((sum, h) => sum + (h.room_capacity || 0), 0),
    avgRating: hotels.length > 0
      ? (hotels.reduce((sum, h) => sum + (h.star_rating || 0), 0) / hotels.length).toFixed(1)
      : 0,
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredHotels.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedHotels = filteredHotels.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Container maxWidth="xl" disableGutters>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box>
              <Typography variant="h4" fontWeight={700} color="text.primary">
                Hotel Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage hotel properties and configurations
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(25, 118, 210, 0.39)',
                }}
              >
                Add Hotel
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Alerts */}
        <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess('')}>
          <Alert severity="success" variant="filled" onClose={() => setSuccess('')}>
            {success}
          </Alert>
        </Snackbar>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
            gap: 3,
            mb: 4,
          }}
        >
          <StatsCard
            title="Total Hotels"
            value={stats.total}
            icon={ApartmentIcon}
            color="#1976d2"
            subtitle="All properties"
          />
          <StatsCard
            title="Active Hotels"
            value={stats.active}
            icon={ActiveIcon}
            color="#2e7d32"
            subtitle={`${Math.round((stats.active / stats.total) * 100) || 0}% of total`}
          />
          <StatsCard
            title="Total Rooms"
            value={stats.totalRooms}
            icon={RoomIcon}
            color="#ed6c02"
            subtitle="Across all hotels"
          />
          <StatsCard
            title="Avg. Rating"
            value={stats.avgRating}
            icon={StarIcon}
            color="#9c27b0"
            subtitle="Star rating"
          />
        </Box>

        {/* Search and Filters */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Search hotels by name, city, or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8f9fa',
                    fontSize: '0.875rem',
                    '& input': {
                      py: 1,
                    },
                    '&:hover': {
                      bgcolor: '#f8f9fa',
                    },
                    '&.Mui-focused': {
                      bgcolor: '#fff',
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.875rem' }}>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    bgcolor: '#f8f9fa',
                    fontSize: '0.875rem',
                    '& .MuiSelect-select': {
                      py: 1,
                    },
                    '&:hover': {
                      bgcolor: '#f8f9fa',
                    },
                    '&.Mui-focused': {
                      bgcolor: '#fff',
                    },
                  }}
                >
                  <MenuItem value="all" sx={{ fontSize: '0.875rem' }}>All Status</MenuItem>
                  <MenuItem value="active" sx={{ fontSize: '0.875rem' }}>Active</MenuItem>
                  <MenuItem value="inactive" sx={{ fontSize: '0.875rem' }}>Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Hotels Table */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          {loading && <LinearProgress />}

          {/* Table Header */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px',
              gap: 2,
              p: 2,
              bgcolor: '#ffffff',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
              HOTEL
            </Typography>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
              RATING
            </Typography>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
              CAPACITY
            </Typography>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
              MANAGER
            </Typography>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
              STATUS
            </Typography>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" align="center">
              ACTIONS
            </Typography>
          </Box>

          {/* Table Body */}
          {filteredHotels.length === 0 && !loading ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <HotelIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No hotels found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search or filters
              </Typography>
            </Box>
          ) : (
            paginatedHotels.map((hotel, index) => (
              <Fade in key={hotel.id} timeout={300 + index * 50}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px',
                    gap: 2,
                    p: 2,
                    alignItems: 'center',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                    '&:last-child': {
                      borderBottom: 'none',
                    },
                  }}
                >
                  {/* Hotel Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: hotel.is_active ? 'primary.main' : 'grey.400',
                        fontWeight: 600,
                      }}
                    >
                      <HotelIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {hotel.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {hotel.city && hotel.country ? `${hotel.city}, ${hotel.country}` : hotel.city || hotel.country || 'Location not set'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Rating */}
                  <Box>
                    <StarRating rating={hotel.star_rating || 0} />
                    <Typography variant="caption" color="text.secondary">
                      {hotel.star_rating || 0} stars
                    </Typography>
                  </Box>

                  {/* Capacity */}
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {hotel.room_capacity || 0} rooms
                    </Typography>
                  </Box>

                  {/* Manager */}
                  <Box>
                    {hotel.manager ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
                          {hotel.manager.username?.[0]?.toUpperCase() || 'M'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 100 }}>
                            {hotel.manager.username}
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Chip
                        size="small"
                        label="Not assigned"
                        sx={{
                          bgcolor: 'grey.100',
                          color: 'grey.600',
                          fontSize: '0.7rem',
                        }}
                      />
                    )}
                  </Box>

                  {/* Status */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Switch
                      checked={hotel.is_active}
                      onChange={() => handleStatusToggle(hotel.id, hotel.is_active)}
                      color="success"
                      size="small"
                    />
                    <Chip
                      size="small"
                      label={hotel.is_active ? 'Active' : 'Inactive'}
                      sx={{
                        bgcolor: hotel.is_active ? 'success.50' : 'grey.100',
                        color: hotel.is_active ? 'success.dark' : 'grey.600',
                        fontWeight: 500,
                        fontSize: '0.7rem',
                      }}
                    />
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                    <Tooltip title="Edit Hotel">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEdit(hotel)}
                        sx={{
                          bgcolor: 'primary.50',
                          color: 'primary.main',
                          '&:hover': { bgcolor: 'primary.100' },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Hotel">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDeleteModal(hotel)}
                        sx={{
                          bgcolor: 'error.50',
                          color: 'error.main',
                          '&:hover': { bgcolor: 'error.100' },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Fade>
            ))
          )}

          {/* Footer with Pagination */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              bgcolor: '#ffffff',
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                sx={{ color: 'text.secondary' }}
              >
                <FirstPageIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                sx={{ color: 'text.secondary' }}
              >
                <ChevronLeftIcon fontSize="small" />
              </IconButton>

              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mx: 2 }}>
                Page {currentPage} of {totalPages || 1}
              </Typography>

              <IconButton
                size="small"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                sx={{ color: 'text.secondary' }}
              >
                <ChevronRightIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage >= totalPages}
                sx={{ color: 'text.secondary' }}
              >
                <LastPageIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Paper>

        <HotelFormModal
          open={modalOpen}
          handleClose={handleCloseModal}
          hotelToEdit={hotelToEdit}
          handleSave={handleSaveHotel}
        />

        {/* Delete Confirmation Modal */}
        <Dialog
          open={deleteModalOpen}
          onClose={handleCloseDeleteModal}
          maxWidth="xs"
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
                  bgcolor: alpha('#f44336', 0.2),
                  width: 36,
                  height: 36,
                }}
              >
                <WarningIcon sx={{ color: '#f44336', fontSize: 20 }} />
              </Avatar>
              <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#ffffff' }}>
                Delete Hotel
              </Typography>
            </Box>
            <IconButton onClick={handleCloseDeleteModal} sx={{ color: '#ffffff' }} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <DialogContent sx={{ px: 3, py: 3 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Are you sure you want to permanently delete this hotel?
            </Typography>
            {hotelToDelete && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: 'primary.main',
                    fontWeight: 600,
                  }}
                >
                  <HotelIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {hotelToDelete.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {hotelToDelete.city && hotelToDelete.country
                      ? `${hotelToDelete.city}, ${hotelToDelete.country}`
                      : 'Location not set'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <StarRating rating={hotelToDelete.star_rating || 0} />
                    <Typography variant="caption" color="text.secondary">
                      • {hotelToDelete.room_capacity || 0} rooms
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
            <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 2, fontWeight: 500 }}>
              This action is permanent and cannot be undone. All hotel data will be removed.
            </Typography>
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
              onClick={handleCloseDeleteModal}
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
              onClick={handleConfirmDelete}
              variant="contained"
              sx={{
                borderRadius: 2,
                px: 3,
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: '#d32f2f',
                '&:hover': {
                  bgcolor: '#b71c1c',
                },
              }}
            >
              Delete Hotel
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default HotelManagement;
