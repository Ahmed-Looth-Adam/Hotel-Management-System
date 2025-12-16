import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Dashboard,
  Login,
  Logout,
  Schedule,
  Hotel,
  CheckCircle,
  Cancel,
  Refresh,
} from '@mui/icons-material';
import { operationsService, hotelService, bookingService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import LoadingSpinner from '../../components/loading/LoadingSpinner';

const OperationsDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(searchParams.get('hotel') || '');
  const [dashboardData, setDashboardData] = useState(null);
  const [lateCheckoutDialog, setLateCheckoutDialog] = useState({ open: false, request: null });
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchHotels = async () => {
      const result = await hotelService.getAll({ is_active: true });
      if (result.success) {
        const hotelList = result.data.results || result.data;
        setHotels(hotelList);
        if (!selectedHotel && hotelList.length > 0) {
          setSelectedHotel(hotelList[0].id);
        }
      }
    };
    fetchHotels();
  }, []);

  const fetchDashboardData = async () => {
    if (!selectedHotel) return;

    setLoading(true);
    const result = await operationsService.getDashboard(selectedHotel);
    if (result.success) {
      setDashboardData(result.data);
    } else {
      showError('Failed to fetch dashboard data');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedHotel]);

  const handleCheckIn = async (bookingId) => {
    const result = await bookingService.checkIn(bookingId);
    if (result.success) {
      showSuccess('Guest checked in successfully');
      fetchDashboardData();
    } else {
      showError(result.error?.message || 'Failed to check in');
    }
  };

  const handleCheckOut = async (bookingId) => {
    const result = await bookingService.checkOut(bookingId);
    if (result.success) {
      showSuccess('Guest checked out successfully');
      fetchDashboardData();
    } else {
      showError(result.error?.message || 'Failed to check out');
    }
  };

  const handleApproveLateCheckout = async () => {
    if (!lateCheckoutDialog.request) return;

    const result = await operationsService.approveLateCheckout(lateCheckoutDialog.request.id, { notes });
    if (result.success) {
      showSuccess('Late checkout approved');
      setLateCheckoutDialog({ open: false, request: null });
      setNotes('');
      fetchDashboardData();
    } else {
      showError(result.error?.message || 'Failed to approve');
    }
  };

  const handleRejectLateCheckout = async () => {
    if (!lateCheckoutDialog.request) return;

    const result = await operationsService.rejectLateCheckout(lateCheckoutDialog.request.id, { reason: notes });
    if (result.success) {
      showSuccess('Late checkout rejected');
      setLateCheckoutDialog({ open: false, request: null });
      setNotes('');
      fetchDashboardData();
    } else {
      showError(result.error?.message || 'Failed to reject');
    }
  };

  if (loading && !dashboardData) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const occupancy = dashboardData?.occupancy || {};
  const todayCheckins = dashboardData?.today_checkins?.bookings || [];
  const todayCheckouts = dashboardData?.today_checkouts?.bookings || [];
  const pendingLateCheckouts = dashboardData?.pending_late_checkouts?.requests || [];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Dashboard color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" component="h1">Operations Dashboard</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Hotel</InputLabel>
            <Select
              value={selectedHotel}
              label="Hotel"
              onChange={(e) => setSelectedHotel(e.target.value)}
            >
              {hotels.map((hotel) => (
                <MenuItem key={hotel.id} value={hotel.id}>{hotel.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton onClick={fetchDashboardData} title="Refresh">
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Occupancy Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary">{occupancy.total_rooms || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Total Rooms</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="success.main">{occupancy.available_rooms || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Available</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="info.main">{occupancy.occupied_rooms || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Occupied</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="warning.main">
                {occupancy.occupancy_rate ? `${(occupancy.occupancy_rate * 100).toFixed(0)}%` : '0%'}
              </Typography>
              <Typography variant="body2" color="text.secondary">Occupancy Rate</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Today's Check-ins */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Login color="success" />
              <Typography variant="h6">Today's Check-ins</Typography>
              <Chip label={todayCheckins.length} size="small" color="success" />
            </Box>
            <Divider sx={{ mb: 2 }} />
            {todayCheckins.length === 0 ? (
              <Typography color="text.secondary" align="center">No check-ins today</Typography>
            ) : (
              <List dense>
                {todayCheckins.map((booking) => (
                  <ListItem key={booking.id}>
                    <ListItemText
                      primary={booking.user_name}
                      secondary={`Room ${booking.room_number} | ${booking.booking_reference}`}
                    />
                    <ListItemSecondaryAction>
                      {booking.status === 'confirmed' ? (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleCheckIn(booking.id)}
                        >
                          Check In
                        </Button>
                      ) : (
                        <Chip label="Checked In" size="small" color="success" />
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Today's Check-outs */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Logout color="primary" />
              <Typography variant="h6">Today's Check-outs</Typography>
              <Chip label={todayCheckouts.length} size="small" color="primary" />
            </Box>
            <Divider sx={{ mb: 2 }} />
            {todayCheckouts.length === 0 ? (
              <Typography color="text.secondary" align="center">No check-outs today</Typography>
            ) : (
              <List dense>
                {todayCheckouts.map((booking) => (
                  <ListItem key={booking.id}>
                    <ListItemText
                      primary={booking.user_name}
                      secondary={`Room ${booking.room_number} | ${booking.booking_reference}`}
                    />
                    <ListItemSecondaryAction>
                      {booking.status === 'checked_in' ? (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => handleCheckOut(booking.id)}
                        >
                          Check Out
                        </Button>
                      ) : (
                        <Chip label="Checked Out" size="small" />
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Late Checkout Requests */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Schedule color="warning" />
              <Typography variant="h6">Late Checkout Requests</Typography>
              <Chip label={pendingLateCheckouts.length} size="small" color="warning" />
            </Box>
            <Divider sx={{ mb: 2 }} />
            {pendingLateCheckouts.length === 0 ? (
              <Typography color="text.secondary" align="center">No pending requests</Typography>
            ) : (
              <List dense>
                {pendingLateCheckouts.map((request) => (
                  <ListItem key={request.id}>
                    <ListItemText
                      primary={request.guest_name}
                      secondary={`Room ${request.room_number} | Until ${request.requested_checkout_time}`}
                    />
                    <ListItemSecondaryAction>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setLateCheckoutDialog({ open: true, request })}
                      >
                        Review
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Late Checkout Review Dialog */}
      <Dialog
        open={lateCheckoutDialog.open}
        onClose={() => setLateCheckoutDialog({ open: false, request: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Review Late Checkout Request</DialogTitle>
        <DialogContent>
          {lateCheckoutDialog.request && (
            <Box sx={{ mt: 2 }}>
              <Typography><strong>Guest:</strong> {lateCheckoutDialog.request.guest_name}</Typography>
              <Typography><strong>Room:</strong> {lateCheckoutDialog.request.room_number}</Typography>
              <Typography><strong>Booking:</strong> {lateCheckoutDialog.request.booking_reference}</Typography>
              <Typography><strong>Requested Time:</strong> {lateCheckoutDialog.request.requested_checkout_time}</Typography>
              {lateCheckoutDialog.request.guest_notes && (
                <Typography><strong>Notes:</strong> {lateCheckoutDialog.request.guest_notes}</Typography>
              )}
              {lateCheckoutDialog.request.has_next_booking && (
                <Chip
                  label="Has next booking"
                  color="warning"
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Manager Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLateCheckoutDialog({ open: false, request: null })}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Cancel />}
            onClick={handleRejectLateCheckout}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            onClick={handleApproveLateCheckout}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OperationsDashboard;
