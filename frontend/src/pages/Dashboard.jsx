import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Chip,
  Skeleton,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Login as CheckInIcon,
  Logout as CheckOutIcon,
  Hotel as HotelIcon,
  EventAvailable as BookingIcon,
  AttachMoney as RevenueIcon,
  People as PeopleIcon,
  Assessment as ReportIcon,
  Refresh as RefreshIcon,
  CalendarMonth as CalendarIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { reportService, bookingService, hotelService, roomService } from '../services';

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#9c27b0'];

const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, trendValue, onClick }) => (
  <Card
    elevation={0}
    onClick={onClick}
    sx={{
      height: '100%',
      background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
      border: `1px solid ${alpha(color, 0.2)}`,
      borderRadius: 3,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.3s ease',
      '&:hover': onClick ? {
        transform: 'translateY(-4px)',
        boxShadow: `0 8px 25px ${alpha(color, 0.25)}`,
      } : {},
    }}
  >
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ color, mb: 0.5 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
              {trend === 'up' ? (
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
              )}
              <Typography
                variant="caption"
                sx={{ color: trend === 'up' ? 'success.main' : 'error.main', fontWeight: 600 }}
              >
                {trendValue}
              </Typography>
            </Box>
          )}
        </Box>
        <Avatar
          sx={{
            bgcolor: alpha(color, 0.15),
            color: color,
            width: 56,
            height: 56,
          }}
        >
          <Icon sx={{ fontSize: 28 }} />
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const QuickActionCard = ({ title, description, icon: Icon, color, onClick }) => (
  <Card
    elevation={0}
    onClick={onClick}
    sx={{
      cursor: 'pointer',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      transition: 'all 0.2s ease',
      '&:hover': {
        borderColor: color,
        bgcolor: alpha(color, 0.02),
        transform: 'translateY(-2px)',
        boxShadow: `0 4px 12px ${alpha(color, 0.15)}`,
      },
    }}
  >
    <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
      <Avatar sx={{ bgcolor: alpha(color, 0.1), color }}>
        <Icon />
      </Avatar>
      <Box>
        <Typography variant="subtitle2" fontWeight={600}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {description}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState('all');
  const [dashboardData, setDashboardData] = useState(null);
  const [allBookings, setAllBookings] = useState([]); // Store all bookings for trend calculations
  const [bookingTrends, setBookingTrends] = useState([]);
  const [trendPeriod, setTrendPeriod] = useState('7d');
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [servicePopularity, setServicePopularity] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);

  // Check user role for hotel access
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isStaff = user?.role === 'staff';
  const hasAssignedHotel = user?.assigned_hotel;

  // Fetch hotels on mount
  useEffect(() => {
    const fetchHotels = async () => {
      const result = await hotelService.getAll({ is_active: true });
      if (result.success) {
        let hotelList = result.data.results || result.data || [];

        // For manager, filter to hotels they manage
        if (isManager && hasAssignedHotel) {
          hotelList = hotelList.filter(h => h.id === user.assigned_hotel);
        }
        // For staff, filter to their assigned hotel
        if (isStaff && hasAssignedHotel) {
          hotelList = hotelList.filter(h => h.id === user.assigned_hotel);
        }

        setHotels(hotelList);

        // Auto-select hotel for staff/manager with assigned hotel
        if ((isStaff || isManager) && hasAssignedHotel) {
          setSelectedHotel(user.assigned_hotel);
        }
      }
    };
    fetchHotels();
  }, [user]);

  // Helper function to calculate booking revenue (including cancellation fees)
  const getBookingRevenue = (booking) => {
    if (['confirmed', 'checked_in', 'checked_out'].includes(booking.status)) {
      return parseFloat(booking.total_price || 0);
    }
    if (booking.status === 'cancelled') {
      return parseFloat(booking.cancellation_fee_amount || 0);
    }
    return 0;
  };

  // Calculate booking trends based on selected time period
  const calculateTrends = (period, bookings) => {
    if (!bookings || bookings.length === 0) return [];

    const trends = [];
    const now = new Date();
    let daysBack, groupBy;

    switch (period) {
      case '7d':
        daysBack = 7;
        groupBy = 'day';
        break;
      case '1m':
        daysBack = 30;
        groupBy = 'day';
        break;
      case '3m':
        daysBack = 90;
        groupBy = 'week';
        break;
      case '6m':
        daysBack = 180;
        groupBy = 'week';
        break;
      case '1y':
        daysBack = 365;
        groupBy = 'month';
        break;
      case 'all':
        daysBack = null;
        groupBy = 'year';
        break;
      default:
        daysBack = 7;
        groupBy = 'day';
    }

    const startDate = daysBack ? new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000) : null;
    const filteredBookings = startDate
      ? bookings.filter(b => b.created_at && new Date(b.created_at) >= startDate)
      : bookings;

    if (groupBy === 'day') {
      for (let i = daysBack - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayBookings = filteredBookings.filter(b => b.created_at?.startsWith(dateStr));
        // Format: "Mon 19" for 7d, "19 Dec" for 1m
        const dateFormat = period === '7d'
          ? { weekday: 'short', day: 'numeric' }
          : { day: 'numeric', month: 'short' };
        trends.push({
          date: date.toLocaleDateString('en-GB', dateFormat),
          bookings: dayBookings.length,
          revenue: dayBookings.reduce((sum, b) => sum + getBookingRevenue(b), 0),
        });
      }
    } else if (groupBy === 'week') {
      const weeks = Math.ceil(daysBack / 7);
      for (let i = weeks - 1; i >= 0; i--) {
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - i * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        const weekBookings = filteredBookings.filter(b => {
          const bookingDate = new Date(b.created_at);
          return bookingDate >= weekStart && bookingDate <= weekEnd;
        });
        // Format: "19 Dec" for weeks
        trends.push({
          date: weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          bookings: weekBookings.length,
          revenue: weekBookings.reduce((sum, b) => sum + getBookingRevenue(b), 0),
        });
      }
    } else if (groupBy === 'month') {
      // Group by month - show all 12 months for the past year
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      // Create entries for the last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

        const monthBookings = filteredBookings.filter(b => {
          if (!b.created_at) return false;
          const bookingDate = new Date(b.created_at);
          return bookingDate >= monthStart && bookingDate <= monthEnd;
        });

        trends.push({
          date: monthNames[date.getMonth()],
          bookings: monthBookings.length,
          revenue: monthBookings.reduce((sum, b) => sum + getBookingRevenue(b), 0),
        });
      }
    } else if (groupBy === 'year') {
      // Group by year - show all years from 2020 to current year
      const currentYear = new Date().getFullYear();
      const startYear = 2020;

      for (let year = startYear; year <= currentYear; year++) {
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31, 23, 59, 59);

        const yearBookings = filteredBookings.filter(b => {
          if (!b.created_at) return false;
          const bookingDate = new Date(b.created_at);
          return bookingDate >= yearStart && bookingDate <= yearEnd;
        });

        trends.push({
          date: year.toString(),
          bookings: yearBookings.length,
          revenue: yearBookings.reduce((sum, b) => sum + getBookingRevenue(b), 0),
        });
      }
    }

    return trends;
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Build query params for rooms - use high page_size to get all rooms
      const roomParams = { is_active: true, page_size: 1000 };
      if (selectedHotel && selectedHotel !== 'all') {
        roomParams.hotel = selectedHotel;
      }

      // Fetch rooms to get accurate count
      const roomsResult = await roomService.getAll(roomParams);
      const rooms = roomsResult.success
        ? (roomsResult.data.results || roomsResult.data || [])
        : [];
      const totalRooms = rooms.length;

      // Build booking query params - use high page_size to get all bookings
      const bookingParams = { page_size: 1000 };
      if (selectedHotel && selectedHotel !== 'all') {
        bookingParams.hotel = selectedHotel;
      }

      // Fetch all bookings for comprehensive stats
      const bookingsResult = await bookingService.getAll(bookingParams);
      if (bookingsResult.success) {
        const bookings = bookingsResult.data.results || bookingsResult.data || [];
        setRecentBookings(bookings.slice(0, 5));

        // Calculate stats from actual booking data
        const today = new Date().toISOString().split('T')[0];

        // Today's check-ins (bookings with check_in_date = today and status confirmed)
        const todaysCheckins = bookings.filter(b =>
          b.check_in_date === today && b.status === 'confirmed'
        ).length;

        // Today's check-outs (bookings with check_out_date = today and status checked_in)
        const todaysCheckouts = bookings.filter(b =>
          b.check_out_date === today && b.status === 'checked_in'
        ).length;

        // Currently checked in (occupied rooms)
        const checkedInBookings = bookings.filter(b => b.status === 'checked_in');
        const occupiedRooms = checkedInBookings.length;

        // Total confirmed bookings (active bookings)
        const confirmedBookings = bookings.filter(b =>
          ['confirmed', 'checked_in'].includes(b.status)
        ).length;

        // Pending bookings
        const pendingBookings = bookings.filter(b => b.status === 'pending').length;

        // All cancelled bookings
        const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

        // For monthly calculations
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Monthly revenue (bookings created this month)
        const monthlyRevenue = bookings
          .filter(b => b.created_at && new Date(b.created_at) >= startOfMonth)
          .reduce((sum, b) => sum + getBookingRevenue(b), 0);

        // Yearly revenue
        const startOfYear = new Date();
        startOfYear.setMonth(0, 1);
        startOfYear.setHours(0, 0, 0, 0);
        const yearlyRevenue = bookings
          .filter(b => b.created_at && new Date(b.created_at) >= startOfYear)
          .reduce((sum, b) => sum + getBookingRevenue(b), 0);

        // Total revenue (all time)
        const totalRevenue = bookings
          .reduce((sum, b) => sum + getBookingRevenue(b), 0);

        // Calculate occupancy rate
        const occupancyRate = totalRooms > 0
          ? Math.round((occupiedRooms / totalRooms) * 100)
          : 0;

        // Set dashboard data with calculated values
        setDashboardData({
          todays_checkins: todaysCheckins,
          todays_checkouts: todaysCheckouts,
          current_occupancy: {
            occupied_rooms: occupiedRooms,
            total_rooms: totalRooms,
            occupancy_rate: occupancyRate,
          },
          monthly_revenue: monthlyRevenue,
          yearly_revenue: yearlyRevenue,
          total_revenue: totalRevenue,
          pending_bookings: pendingBookings,
          confirmed_bookings: confirmedBookings,
          cancelled_bookings: cancelledBookings,
          total_bookings: bookings.length,
        });

        // Store bookings for trend calculations and calculate initial trends
        setAllBookings(bookings);
        setBookingTrends(calculateTrends(trendPeriod, bookings));

        // Calculate status distribution
        const statusCounts = {};
        bookings.forEach(b => {
          statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
        });
        const distribution = Object.entries(statusCounts).map(([name, value]) => ({
          name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value,
        }));
        setStatusDistribution(distribution);
      }

      // Fetch service popularity data
      const serviceParams = {};
      if (selectedHotel && selectedHotel !== 'all') {
        serviceParams.hotel_id = selectedHotel;
      }
      const serviceResult = await reportService.getServicePopularity(serviceParams);
      if (serviceResult.success && serviceResult.data.data) {
        setServicePopularity(serviceResult.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedHotel]);

  // Recalculate trends locally when period changes (no API call needed)
  useEffect(() => {
    if (allBookings.length > 0) {
      setBookingTrends(calculateTrends(trendPeriod, allBookings));
    }
  }, [trendPeriod]);

  const handleHotelChange = (event) => {
    setSelectedHotel(event.target.value);
  };

  const handleTrendPeriodChange = (event, newPeriod) => {
    if (newPeriod !== null) {
      setTrendPeriod(newPeriod);
    }
  };

  const trendPeriodLabels = {
    '7d': 'Last 7 Days',
    '1m': 'Last Month',
    '3m': 'Last 3 Months',
    '6m': 'Last 6 Months',
    '1y': 'Last Year',
    'all': 'All Time',
  };

  const selectedHotelName = selectedHotel === 'all'
    ? 'All Hotels'
    : hotels.find(h => h.id === selectedHotel)?.name || 'Selected Hotel';

  const occupancy = dashboardData?.current_occupancy || {};
  const occupancyRate = occupancy.occupancy_rate || 0;

  const quickActions = [
    {
      title: 'View Bookings',
      description: 'Manage all reservations',
      icon: BookingIcon,
      color: '#1976d2',
      path: '/bookings',
    },
    {
      title: 'Reports',
      description: 'View analytics & reports',
      icon: ReportIcon,
      color: '#9c27b0',
      path: '/reports/analytics',
    },
    ...(user?.role === 'admin' ? [
      {
        title: 'Manage Users',
        description: 'Staff & user accounts',
        icon: PeopleIcon,
        color: '#ed6c02',
        path: '/admin/users',
      },
      {
        title: 'Manage Hotels',
        description: 'Hotel properties',
        icon: HotelIcon,
        color: '#2e7d32',
        path: '/admin/hotels',
      },
    ] : []),
  ];

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', py: 3 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} color="text.primary">
              Welcome back, {user?.first_name || user?.username}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Here's what's happening{selectedHotel !== 'all' ? ` at ${selectedHotelName}` : ''} today.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {/* Hotel Filter - Show for admin or users with multiple hotels */}
            {(isAdmin || hotels.length > 1) && (
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Filter by Hotel</InputLabel>
                <Select
                  value={selectedHotel}
                  label="Filter by Hotel"
                  onChange={handleHotelChange}
                  sx={{
                    bgcolor: 'white',
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'divider',
                    },
                  }}
                >
                  {isAdmin && <MenuItem value="all">All Hotels</MenuItem>}
                  {hotels.map((hotel) => (
                    <MenuItem key={hotel.id} value={hotel.id}>
                      {hotel.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {/* Show assigned hotel chip for staff/manager with single hotel */}
            {!isAdmin && hotels.length === 1 && (
              <Chip
                icon={<HotelIcon />}
                label={hotels[0]?.name}
                sx={{
                  bgcolor: alpha('#1976d2', 0.1),
                  color: '#1976d2',
                  fontWeight: 600,
                  '& .MuiChip-icon': { color: '#1976d2' },
                }}
              />
            )}
            <Chip
              label={new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              icon={<CalendarIcon />}
              sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}
            />
            <IconButton
              onClick={fetchDashboardData}
              sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}
              title="Refresh data"
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
            gap: 3,
            mb: 4,
          }}
        >
          {loading ? (
            [...Array(4)].map((_, i) => (
              <Skeleton key={i} variant="rounded" height={140} sx={{ borderRadius: 3 }} />
            ))
          ) : (
            <>
              <StatCard
                title="Total Bookings"
                value={dashboardData?.total_bookings || 0}
                subtitle={`${dashboardData?.confirmed_bookings || 0} active bookings`}
                icon={BookingIcon}
                color="#1976d2"
                onClick={() => navigate('/bookings')}
              />
              <StatCard
                title="Checked In"
                value={occupancy.occupied_rooms || 0}
                subtitle={`${dashboardData?.todays_checkins || 0} arriving today`}
                icon={CheckInIcon}
                color="#2e7d32"
                onClick={() => navigate('/bookings?status=checked_in')}
              />
              <StatCard
                title="Current Occupancy"
                value={`${occupancyRate}%`}
                subtitle={`${occupancy.occupied_rooms || 0} of ${occupancy.total_rooms || 0} rooms`}
                icon={HotelIcon}
                color="#9c27b0"
              />
              <StatCard
                title="Total Revenue"
                value={`£${(dashboardData?.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                subtitle={`This month: £${(dashboardData?.monthly_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={RevenueIcon}
                color="#ed6c02"
                onClick={() => navigate('/reports/revenue')}
              />
            </>
          )}
        </Box>

        {/* Secondary Stats */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
            gap: 3,
            mb: 4,
          }}
        >
          {loading ? (
            [...Array(4)].map((_, i) => (
              <Skeleton key={i} variant="rounded" height={100} sx={{ borderRadius: 3 }} />
            ))
          ) : (
            <>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
                  <Avatar sx={{ bgcolor: alpha('#1976d2', 0.1), color: '#1976d2' }}>
                    <BookingIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>{dashboardData?.confirmed_bookings || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">Confirmed Bookings</Typography>
                  </Box>
                </CardContent>
              </Card>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
                  <Avatar sx={{ bgcolor: alpha('#9c27b0', 0.1), color: '#9c27b0' }}>
                    <CheckOutIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>{dashboardData?.todays_checkouts || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">Checking Out Today</Typography>
                  </Box>
                </CardContent>
              </Card>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
                  <Avatar sx={{ bgcolor: alpha('#d32f2f', 0.1), color: '#d32f2f' }}>
                    <CancelIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>{dashboardData?.cancelled_bookings || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">Cancellations</Typography>
                  </Box>
                </CardContent>
              </Card>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
                  <Avatar sx={{ bgcolor: alpha('#2e7d32', 0.1), color: '#2e7d32' }}>
                    <HotelIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>{occupancy.total_rooms || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Rooms</Typography>
                  </Box>
                </CardContent>
              </Card>
            </>
          )}
        </Box>

        {/* Charts Row */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
            gap: 3,
            mb: 4,
          }}
        >
          {/* Booking Trends Chart */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                Booking Trends ({trendPeriodLabels[trendPeriod]})
              </Typography>
              <ToggleButtonGroup
                value={trendPeriod}
                exclusive
                onChange={handleTrendPeriodChange}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.75rem',
                    textTransform: 'none',
                    borderColor: 'divider',
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                    },
                  },
                }}
              >
                <ToggleButton value="7d">7D</ToggleButton>
                <ToggleButton value="1m">1M</ToggleButton>
                <ToggleButton value="3m">3M</ToggleButton>
                <ToggleButton value="6m">6M</ToggleButton>
                <ToggleButton value="1y">1Y</ToggleButton>
                <ToggleButton value="all">All</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Box sx={{ height: 300 }}>
              {loading ? (
                <Skeleton variant="rounded" height="100%" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={bookingTrends}>
                    <defs>
                      <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1976d2" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2e7d32" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="bookings"
                      stroke="#1976d2"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorBookings)"
                      name="Bookings"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>

          {/* Status Distribution */}
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
              Booking Status Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              {loading ? (
                <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto', mt: 4 }} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Revenue Chart */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            mb: 4,
          }}
        >
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Revenue Trends ({trendPeriodLabels[trendPeriod]})
          </Typography>
          <Box sx={{ height: 250 }}>
            {loading ? (
              <Skeleton variant="rounded" height="100%" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `£${v}`} />
                  <Tooltip
                    formatter={(value) => [`£${value.toFixed(2)}`, 'Revenue']}
                    contentStyle={{
                      borderRadius: 8,
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar dataKey="revenue" fill="#2e7d32" radius={[4, 4, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>
        </Paper>

        {/* Service Popularity Chart */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            mb: 4,
          }}
        >
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Most Popular Services
          </Typography>
          <Box sx={{ height: 250 }}>
            {loading ? (
              <Skeleton variant="rounded" height="100%" />
            ) : servicePopularity.length === 0 ? (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography color="text.secondary">
                  No service data available yet
                </Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={servicePopularity} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e0e0e0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={120}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'bookings') return [value, 'Bookings'];
                      if (name === 'revenue') return [`£${value.toFixed(2)}`, 'Revenue'];
                      return [value, name];
                    }}
                    contentStyle={{
                      borderRadius: 8,
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="bookings" fill="#1976d2" radius={[0, 4, 4, 0]} name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>
        </Paper>

        {/* Quick Actions */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Quick Actions
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gap: 2,
            }}
          >
            {quickActions.map((action, index) => (
              <QuickActionCard
                key={index}
                title={action.title}
                description={action.description}
                icon={action.icon}
                color={action.color}
                onClick={() => navigate(action.path)}
              />
            ))}
          </Box>
        </Box>

        {/* Recent Bookings */}
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
            <Typography variant="h6" fontWeight={600}>
              Recent Bookings
            </Typography>
            <Chip
              label="View All"
              size="small"
              onClick={() => navigate('/bookings')}
              sx={{ cursor: 'pointer' }}
            />
          </Box>
          {loading ? (
            [...Array(3)].map((_, i) => (
              <Skeleton key={i} variant="rounded" height={60} sx={{ mb: 1, borderRadius: 2 }} />
            ))
          ) : recentBookings.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              No recent bookings found
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {recentBookings.map((booking) => (
                <Box
                  key={booking.id}
                  onClick={() => navigate(`/bookings/${booking.id}`)}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'grey.50',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'grey.100',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                      {booking.user_name?.[0] || 'G'}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {booking.user_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {booking.booking_reference} | {booking.hotel_name}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" fontWeight={600}>
                        £{parseFloat(booking.total_price || 0).toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {booking.check_in_date} - {booking.check_out_date}
                      </Typography>
                    </Box>
                    <Chip
                      label={booking.status?.replace('_', ' ')}
                      size="small"
                      color={
                        booking.status === 'confirmed' ? 'info' :
                        booking.status === 'checked_in' ? 'success' :
                        booking.status === 'checked_out' ? 'default' :
                        booking.status === 'cancelled' ? 'error' : 'warning'
                      }
                      sx={{ textTransform: 'capitalize', minWidth: 90 }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default Dashboard;
