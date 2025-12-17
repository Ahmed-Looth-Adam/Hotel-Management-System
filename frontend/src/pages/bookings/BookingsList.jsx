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
  TextField,
} from '@mui/material';
import {
  Add,
  Edit,
  Visibility,
  EventAvailable,
  Login,
  Logout,
  Cancel,
} from '@mui/icons-material';
import DataTable from '../../components/common/DataTable';
import { bookingService, hotelService } from '../../services';
import { useNotification } from '../../hooks/useNotification';

const statusColors = {
  pending: 'warning',
  confirmed: 'info',
  checked_in: 'success',
  checked_out: 'default',
  cancelled: 'error',
};

const paymentColors = {
  pending: 'warning',
  paid: 'success',
  partial: 'info',
  refunded: 'default',
};

const BookingsList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useNotification();
  const [bookings, setBookings] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    hotel: searchParams.get('hotel') || '',
    status: '',
    payment_status: '',
  });

  const fetchData = async () => {
    setLoading(true);
    const params = {};
    if (filters.hotel) params.hotel = filters.hotel;
    if (filters.status) params.status = filters.status;
    if (filters.payment_status) params.payment_status = filters.payment_status;

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
  }, [filters]);

  const handleCheckIn = async (id) => {
    if (window.confirm('Proceed with check-in?')) {
      const result = await bookingService.checkIn(id);
      if (result.success) {
        showSuccess('Guest checked in successfully');
        fetchData();
      } else {
        showError(result.error?.message || 'Failed to check in');
      }
    }
  };

  const handleCheckOut = async (id) => {
    if (window.confirm('Proceed with check-out?')) {
      const result = await bookingService.checkOut(id);
      if (result.success) {
        showSuccess('Guest checked out successfully');
        fetchData();
      } else {
        showError(result.error?.message || 'Failed to check out');
      }
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      const result = await bookingService.cancel(id, { reason: 'Cancelled by staff' });
      if (result.success) {
        showSuccess('Booking cancelled successfully');
        fetchData();
      } else {
        showError(result.error?.message || 'Failed to cancel booking');
      }
    }
  };

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
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={() => navigate(`/bookings/${row.id}`)} title="View">
            <Visibility />
          </IconButton>
          {row.status === 'confirmed' && (
            <IconButton size="small" onClick={() => handleCheckIn(row.id)} title="Check-in" color="success">
              <Login />
            </IconButton>
          )}
          {row.status === 'checked_in' && (
            <IconButton size="small" onClick={() => handleCheckOut(row.id)} title="Check-out" color="primary">
              <Logout />
            </IconButton>
          )}
          {['pending', 'confirmed'].includes(row.status) && (
            <IconButton size="small" onClick={() => handleCancel(row.id)} title="Cancel" color="error">
              <Cancel />
            </IconButton>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventAvailable color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" component="h1">Bookings</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/bookings/new')}>
          New Booking
        </Button>
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
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status}
            label="Status"
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="checked_in">Checked In</MenuItem>
            <MenuItem value="checked_out">Checked Out</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Payment</InputLabel>
          <Select
            value={filters.payment_status}
            label="Payment"
            onChange={(e) => setFilters({ ...filters, payment_status: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="partial">Partial</MenuItem>
            <MenuItem value="refunded">Refunded</MenuItem>
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
