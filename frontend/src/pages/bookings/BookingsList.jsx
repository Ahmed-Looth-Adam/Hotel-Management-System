import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  TextField,
  InputAdornment,
  Avatar,
  Tooltip,
  Collapse,
  Button,
} from '@mui/material';
import {
  Visibility,
  EventAvailable,
  Business as BusinessIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
  MeetingRoom as RoomIcon,
  Groups as GuestsIcon,
  Today as TodayIcon,
  DateRange as DateRangeIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import DataTable from '../../components/common/DataTable';
import { bookingService, hotelService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';

// Helper to format date nicely
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

// Helper to format date for API (YYYY-MM-DD)
const formatDateForApi = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

// Helper to get date ranges
const getDateRange = (preset) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const nextMonth = new Date(today);
  nextMonth.setDate(nextMonth.getDate() + 30);

  switch (preset) {
    case 'today':
      return { from: formatDateForApi(today), to: formatDateForApi(today) };
    case 'tomorrow':
      return { from: formatDateForApi(tomorrow), to: formatDateForApi(tomorrow) };
    case 'week':
      return { from: formatDateForApi(today), to: formatDateForApi(nextWeek) };
    case 'upcoming':
      return { from: formatDateForApi(today), to: '' };
    case 'past':
      return { from: '', to: formatDateForApi(new Date(today.setDate(today.getDate() - 1))) };
    default:
      return { from: '', to: '' };
  }
};

// Date filter presets
const datePresets = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'week', label: 'This Week' },
  { id: 'upcoming', label: 'Upcoming' },
];

// Filter mode options
const filterModes = [
  { id: 'checkin', label: 'Check-in' },
  { id: 'checkout', label: 'Check-out' },
];

const statusConfig = {
  confirmed: { color: '#1976d2', bg: '#e3f2fd', label: 'Confirmed' },
  checked_in: { color: '#2e7d32', bg: '#e8f5e9', label: 'Checked In' },
  checked_out: { color: '#616161', bg: '#f5f5f5', label: 'Checked Out' },
  cancelled: { color: '#d32f2f', bg: '#ffebee', label: 'Cancelled' },
  no_show: { color: '#ed6c02', bg: '#fff3e0', label: 'No Show' },
};

const paymentConfig = {
  paid: { color: '#2e7d32', label: 'Paid' },
  partial: { color: '#1976d2', label: 'Partial' },
  refunded: { color: '#616161', label: 'Refunded' },
};

const BookingsList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showError } = useNotification();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if user is staff/manager and needs hotel assignment
  const isStaffOrManager = user?.role === 'staff' || user?.role === 'manager';
  const hasAssignedHotel = user?.assigned_hotel;
  const showNoHotelAssigned = isStaffOrManager && !hasAssignedHotel;

  const [filters, setFilters] = useState({
    hotel: hasAssignedHotel ? user.assigned_hotel : (searchParams.get('hotel') || ''),
    status: '',
    search: '',
  });

  // Date filter state
  const [filterMode, setFilterMode] = useState('checkin'); // 'checkin' or 'checkout'
  const [datePreset, setDatePreset] = useState('all');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  const fetchData = async () => {
    if (showNoHotelAssigned) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const params = {};
    if (filters.hotel) params.hotel = filters.hotel;
    if (filters.status) params.status = filters.status;
    if (filters.search) params.search = filters.search;

    // Add date filters based on filter mode (checkin or checkout)
    const isCheckout = filterMode === 'checkout';
    const fromKey = isCheckout ? 'checkout_from' : 'date_from';
    const toKey = isCheckout ? 'checkout_to' : 'date_to';

    if (showCustomDate) {
      // Use custom date range
      if (customDateFrom) params[fromKey] = customDateFrom;
      if (customDateTo) params[toKey] = customDateTo;
    } else if (datePreset !== 'all') {
      // Use preset date range
      const range = getDateRange(datePreset);
      if (range.from) params[fromKey] = range.from;
      if (range.to) params[toKey] = range.to;
    }

    const [bookingsResult, hotelsResult] = await Promise.all([
      bookingService.getAll(params),
      hotelService.getAll(),
    ]);

    if (bookingsResult.success) {
      setBookings(bookingsResult.data.results || bookingsResult.data);
    } else {
      showError('Failed to fetch bookings');
    }

    if (hotelsResult.success) {
      setHotels(hotelsResult.data.results || hotelsResult.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [filters, showNoHotelAssigned, filterMode, datePreset, showCustomDate, customDateFrom, customDateTo]);

  // Handle preset click
  const handlePresetClick = (presetId) => {
    setDatePreset(presetId);
    setShowCustomDate(false);
    setCustomDateFrom('');
    setCustomDateTo('');
  };

  // Handle custom date toggle
  const handleCustomClick = () => {
    setShowCustomDate(true);
    setDatePreset('custom');
  };

  // Clear custom date
  const clearCustomDate = () => {
    setShowCustomDate(false);
    setCustomDateFrom('');
    setCustomDateTo('');
    setDatePreset('all');
  };

  // Handle filter mode change
  const handleFilterModeChange = (mode) => {
    setFilterMode(mode);
    // Reset date filters when switching modes
    setDatePreset('all');
    setShowCustomDate(false);
    setCustomDateFrom('');
    setCustomDateTo('');
  };

  // Build columns - conditionally include hotel column
  const columns = [
    {
      id: 'booking_info',
      label: 'Booking',
      sortable: true,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={row.user_profile_picture || undefined}
            sx={{
              width: 36,
              height: 36,
              bgcolor: row.user_profile_picture ? 'transparent' : (statusConfig[row.status]?.bg || '#f5f5f5'),
              color: statusConfig[row.status]?.color || '#616161',
              fontSize: '0.75rem',
              fontWeight: 600,
              border: row.user_profile_picture ? `2px solid ${statusConfig[row.status]?.color || '#616161'}` : 'none',
            }}
          >
            {row.user_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'G'}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ color: '#222', lineHeight: 1.3 }}>
              {row.user_name || 'Guest'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#666' }}>
              {row.booking_reference}
            </Typography>
          </Box>
        </Box>
      ),
    },
    // Only show hotel column for admin users (not for staff/manager with assigned hotel)
    ...(!isStaffOrManager || !hasAssignedHotel ? [{
      id: 'hotel_name',
      label: 'Hotel',
      sortable: true,
      render: (row) => (
        <Typography variant="body2" sx={{ color: '#444' }}>
          {row.hotel_name || '-'}
        </Typography>
      ),
    }] : []),
    {
      id: 'room_info',
      label: 'Room',
      sortable: true,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RoomIcon sx={{ fontSize: 18, color: '#999' }} />
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {row.room_number || 'TBA'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#888' }}>
              {row.guests_count} {row.guests_count === 1 ? 'guest' : 'guests'}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'stay_dates',
      label: 'Stay',
      sortable: true,
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={500} sx={{ color: '#333' }}>
            {formatDate(row.check_in_date)} → {formatDate(row.check_out_date)}
          </Typography>
          <Typography variant="caption" sx={{ color: '#888' }}>
            {row.number_of_nights || ((new Date(row.check_out_date) - new Date(row.check_in_date)) / (1000 * 60 * 60 * 24))} nights
          </Typography>
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => {
        const status = statusConfig[row.status] || { color: '#616161', bg: '#f5f5f5', label: row.status };
        const payment = paymentConfig[row.payment_status] || { color: '#616161', label: row.payment_status };
        return (
          <Box>
            <Chip
              label={status.label}
              size="small"
              sx={{
                bgcolor: status.bg,
                color: status.color,
                fontWeight: 600,
                fontSize: '0.7rem',
                height: 24,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 0.5,
                color: payment.color,
                fontWeight: 500,
              }}
            >
              {payment.label}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: 'total_price',
      label: 'Total',
      render: (row) => (
        <Typography variant="body2" fontWeight={600} sx={{ color: '#222' }}>
          £{parseFloat(row.total_price || 0).toFixed(2)}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: '',
      sortable: false,
      render: (row) => (
        <Tooltip title="View Details">
          <IconButton
            size="small"
            onClick={() => navigate(`/bookings/${row.id}`)}
            sx={{
              bgcolor: '#f5f5f5',
              '&:hover': { bgcolor: '#e0e0e0' },
            }}
          >
            <Visibility sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  // Get assigned hotel name for display
  const assignedHotelName = hotels.find(h => h.id === user?.assigned_hotel)?.name || user?.assigned_hotel_name;

  // Show "No hotel assigned" message for staff/manager without assigned hotel
  if (showNoHotelAssigned) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventAvailable color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h4" component="h1">Bookings</Typography>
          </Box>
        </Box>
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <BusinessIcon sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No Hotel Assigned
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
            You are not currently assigned to any hotel. Please contact your administrator to be assigned to a hotel.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={700} sx={{ color: '#1a1a2e', mb: 0.5 }}>
          Bookings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage guest reservations and check-ins
        </Typography>
      </Box>

      {/* Date Filter Chips */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          mb: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: '#fafafa',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {/* Filter Mode Toggle */}
          <Box
            sx={{
              display: 'flex',
              bgcolor: 'white',
              borderRadius: 2,
              border: '1px solid #ddd',
              p: 0.25,
              mr: 1,
            }}
          >
            {filterModes.map((mode) => (
              <Button
                key={mode.id}
                size="small"
                onClick={() => handleFilterModeChange(mode.id)}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  minWidth: 'auto',
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  bgcolor: filterMode === mode.id ? '#1a1a2e' : 'transparent',
                  color: filterMode === mode.id ? 'white' : '#666',
                  '&:hover': {
                    bgcolor: filterMode === mode.id ? '#1a1a2e' : '#f5f5f5',
                  },
                }}
              >
                {mode.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ width: '1px', height: 24, bgcolor: '#ddd', mx: 0.5 }} />

          {datePresets.map((preset) => (
            <Chip
              key={preset.id}
              label={preset.label}
              size="small"
              onClick={() => handlePresetClick(preset.id)}
              sx={{
                fontWeight: 500,
                bgcolor: datePreset === preset.id && !showCustomDate ? '#1a1a2e' : 'white',
                color: datePreset === preset.id && !showCustomDate ? 'white' : '#666',
                border: '1px solid',
                borderColor: datePreset === preset.id && !showCustomDate ? '#1a1a2e' : '#ddd',
                '&:hover': {
                  bgcolor: datePreset === preset.id && !showCustomDate ? '#1a1a2e' : '#f0f0f0',
                },
              }}
            />
          ))}
          <Chip
            icon={<DateRangeIcon sx={{ fontSize: 16 }} />}
            label="Custom"
            size="small"
            onClick={handleCustomClick}
            sx={{
              fontWeight: 500,
              bgcolor: showCustomDate ? '#1a1a2e' : 'white',
              color: showCustomDate ? 'white' : '#666',
              border: '1px solid',
              borderColor: showCustomDate ? '#1a1a2e' : '#ddd',
              '&:hover': {
                bgcolor: showCustomDate ? '#1a1a2e' : '#f0f0f0',
              },
              '& .MuiChip-icon': {
                color: showCustomDate ? 'white' : '#666',
              },
            }}
          />
        </Box>

        {/* Custom Date Range Picker */}
        <Collapse in={showCustomDate}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, flexWrap: 'wrap' }}>
            <TextField
              type="date"
              size="small"
              label="From"
              value={customDateFrom}
              onChange={(e) => setCustomDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                width: 160,
                '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' },
              }}
            />
            <Typography variant="body2" color="text.secondary">to</Typography>
            <TextField
              type="date"
              size="small"
              label="To"
              value={customDateTo}
              onChange={(e) => setCustomDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                width: 160,
                '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' },
              }}
            />
            <Tooltip title="Clear custom date">
              <IconButton size="small" onClick={clearCustomDate} sx={{ color: '#999' }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Collapse>
      </Paper>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {/* Search Field */}
        <TextField
          size="small"
          placeholder="Search guest or reference..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          sx={{
            minWidth: 280,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: '#fafafa',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Show hotel dropdown only for admin, show assigned hotel name for staff/manager */}
        {isStaffOrManager && hasAssignedHotel ? (
          <Chip
            icon={<BusinessIcon />}
            label={assignedHotelName || 'Assigned Hotel'}
            sx={{
              height: 36,
              px: 1,
              fontSize: '0.8rem',
              fontWeight: 500,
              bgcolor: '#e3f2fd',
              color: '#1976d2',
              '& .MuiChip-icon': { color: '#1976d2' },
            }}
          />
        ) : (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Hotel</InputLabel>
            <Select
              value={filters.hotel}
              label="Hotel"
              onChange={(e) => setFilters({ ...filters, hotel: e.target.value })}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All Hotels</MenuItem>
              {hotels.map((hotel) => (
                <MenuItem key={hotel.id} value={hotel.id}>{hotel.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status}
            label="Status"
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="checked_in">Checked In</MenuItem>
            <MenuItem value="checked_out">Checked Out</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
            <MenuItem value="no_show">No Show</MenuItem>
          </Select>
        </FormControl>

        {/* Results count */}
        <Box sx={{ ml: 'auto' }}>
          <Typography variant="body2" color="text.secondary">
            {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </Paper>

      {/* Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <DataTable
          columns={columns}
          data={bookings}
          emptyMessage={loading ? 'Loading bookings...' : 'No bookings found'}
        />
      </Paper>
    </Container>
  );
};

export default BookingsList;
