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
} from '@mui/material';
import {
  Visibility,
  EventAvailable,
  Business as BusinessIcon,
} from '@mui/icons-material';
import DataTable from '../../components/common/DataTable';
import { bookingService, hotelService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';

const statusColors = {
  confirmed: 'info',
  checked_in: 'success',
  checked_out: 'default',
  cancelled: 'error',
  no_show: 'warning',
};

const paymentColors = {
  paid: 'success',
  partial: 'info',
  refunded: 'default',
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
  });

  const fetchData = async () => {
    if (showNoHotelAssigned) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const params = {};
    if (filters.hotel) params.hotel = filters.hotel;
    if (filters.status) params.status = filters.status;

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
  }, [filters, showNoHotelAssigned]);

  const columns = [
    { id: 'booking_reference', label: 'Reference', sortable: true },
    { id: 'user_name', label: 'Guest', sortable: true },
    { id: 'hotel_name', label: 'Hotel', sortable: true },
    { id: 'room_number', label: 'Room', sortable: true },
    { id: 'check_in_date', label: 'Check-in', sortable: true },
    { id: 'check_out_date', label: 'Check-out', sortable: true },
    { id: 'guests_count', label: 'Guests', sortable: true },
    {
      id: 'status',
      label: 'Status',
      render: (row) => (
        <Chip
          label={row.status?.replace('_', ' ')}
          color={statusColors[row.status] || 'default'}
          size="small"
        />
      ),
    },
    {
      id: 'payment_status',
      label: 'Payment',
      render: (row) => (
        <Chip
          label={row.payment_status}
          color={paymentColors[row.payment_status] || 'default'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      id: 'total_price',
      label: 'Total',
      render: (row) => `£${parseFloat(row.total_price || 0).toFixed(2)}`,
    },
    {
      id: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row) => (
        <IconButton size="small" onClick={() => navigate(`/bookings/${row.id}`)} title="View">
          <Visibility />
        </IconButton>
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventAvailable color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" component="h1">Bookings</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {/* Show hotel dropdown only for admin, show assigned hotel name for staff/manager */}
        {isStaffOrManager && hasAssignedHotel ? (
          <Chip
            icon={<BusinessIcon />}
            label={assignedHotelName || 'Assigned Hotel'}
            sx={{
              height: 40,
              px: 1,
              fontSize: '0.875rem',
              fontWeight: 500,
              bgcolor: '#e3f2fd',
              color: '#1976d2',
              '& .MuiChip-icon': { color: '#1976d2' },
            }}
          />
        ) : (
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
        )}

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status}
            label="Status"
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="checked_in">Checked In</MenuItem>
            <MenuItem value="checked_out">Checked Out</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
            <MenuItem value="no_show">No Show</MenuItem>
          </Select>
        </FormControl>

      </Box>

      <DataTable
        columns={columns}
        data={bookings}
        emptyMessage={loading ? 'Loading bookings...' : 'No bookings found'}
      />
    </Container>
  );
};

export default BookingsList;
