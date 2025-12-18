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
import { reportService, bookingService, hotelService } from '../services';

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
  const [bookingTrends, setBookingTrends] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
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

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Build query params
      const params = {};
      if (selectedHotel && selectedHotel !== 'all') {
        params.hotel_id = selectedHotel;
      }

      // Fetch dashboard summary
      const summaryResult = await reportService.getDashboardSummary(params);
      if (summaryResult.success) {
        setDashboardData(summaryResult.data);
      }

      // Build booking query params
      const bookingParams = { limit: 100 };
      if (selectedHotel && selectedHotel !== 'all') {
        bookingParams.hotel = selectedHotel;
      }

      // Fetch recent bookings for trends
      const bookingsResult = await bookingService.getAll(bookingParams);
      if (bookingsResult.success) {
        const bookings = bookingsResult.data.results || bookingsResult.data || [];
        setRecentBookings(bookings.slice(0, 5));

        // Calculate booking trends (last 7 days) based on check-in date
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const dayBookings = bookings.filter(b =>
            b.check_in_date === dateStr || b.created_at?.startsWith(dateStr)
          );
          last7Days.push({
            date: date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
            bookings: dayBookings.length,
            revenue: dayBookings.reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0),
          });
        }
        setBookingTrends(last7Days);

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
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedHotel]);

  const handleHotelChange = (event) => {
    setSelectedHotel(event.target.value);
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
                title="Today's Check-ins"
                value={dashboardData?.todays_checkins || 0}
                subtitle="Guests arriving today"
                icon={CheckInIcon}
                color="#2e7d32"
                onClick={() => navigate('/bookings?status=confirmed')}
              />
              <StatCard
                title="Today's Check-outs"
                value={dashboardData?.todays_checkouts || 0}
                subtitle="Guests leaving today"
                icon={CheckOutIcon}
                color="#1976d2"
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
                title="Monthly Revenue"
                value={`£${(dashboardData?.monthly_revenue || 0).toLocaleString()}`}
                subtitle={`YTD: £${(dashboardData?.yearly_revenue || 0).toLocaleString()}`}
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
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
            gap: 3,
            mb: 4,
          }}
        >
          {loading ? (
            [...Array(3)].map((_, i) => (
              <Skeleton key={i} variant="rounded" height={100} sx={{ borderRadius: 3 }} />
            ))
          ) : (
            <>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
                  <Avatar sx={{ bgcolor: alpha('#ed6c02', 0.1), color: '#ed6c02' }}>
                    <PendingIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>{dashboardData?.pending_bookings || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">Pending Bookings</Typography>
                  </Box>
                </CardContent>
              </Card>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
                  <Avatar sx={{ bgcolor: alpha('#d32f2f', 0.1), color: '#d32f2f' }}>
                    <CancelIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>{dashboardData?.cancellations_this_month || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">Cancellations (This Month)</Typography>
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
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Booking Trends (Last 7 Days)
            </Typography>
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
            Revenue Trends (Last 7 Days)
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
