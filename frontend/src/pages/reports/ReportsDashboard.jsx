/**
 * Reports Dashboard - Comprehensive reports view
 *
 * Features:
 * - KPI summary cards with trends
 * - Interactive charts (Occupancy, Revenue, Bookings)
 * - Guest demographics visualization
 * - Service popularity breakdown
 * - Date range and hotel filtering
 * - PDF export functionality
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Skeleton,
  Chip,
  Avatar,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  alpha,
} from '@mui/material';
import {
  Assessment as ReportIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Public as PublicIcon,
  Hotel as HotelIcon,
  EventNote as BookingIcon,
  AttachMoney as RevenueIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  CalendarMonth as CalendarIcon,
  RoomService as ServiceIcon,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import reportService from '../../services/reportService';
import { hotelService, bookingService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#9c27b0'];

const STATUS_COLORS = {
  confirmed: '#1976d2',
  checked_in: '#2e7d32',
  checked_out: '#6b7280',
  cancelled: '#d32f2f',
  no_show: '#ed6c02',
  pending: '#9c27b0',
};

// Stat Card matching Dashboard style
const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, trendValue }) => (
  <Card
    elevation={0}
    sx={{
      height: '100%',
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

const ReportsDashboard = () => {
  const { showSuccess } = useNotification();
  const { user } = useAuth();
  const printRef = useRef();

  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState('all');
  const [dateRange, setDateRange] = useState('1m');

  // Report data states
  const [occupancy, setOccupancy] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [demographics, setDemographics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [servicePopularity, setServicePopularity] = useState([]);
  const [bookingTrends, setBookingTrends] = useState([]);
  const [revenueTrends, setRevenueTrends] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);

  // Check user role
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const hasAssignedHotel = user?.assigned_hotel;

  const dateRangeLabels = {
    '7d': 'Last 7 Days',
    '1m': 'Last Month',
    '3m': 'Last 3 Months',
    '6m': 'Last 6 Months',
    '1y': 'Last Year',
    'all': 'All Time',
  };

  const getDateRangeParams = () => {
    const now = new Date();
    let startDate;
    const endDate = now.toISOString().split('T')[0];

    switch (dateRange) {
      case '7d':
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1m':
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3m':
        startDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6m':
        startDate = new Date(now - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = new Date('2020-01-01');
        break;
      default:
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
    }

    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate,
    };
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [selectedHotel, dateRange]);

  const fetchHotels = async () => {
    const result = await hotelService.getAll({ is_active: true });
    if (result.success) {
      let hotelList = result.data.results || result.data || [];
      if ((isManager) && hasAssignedHotel) {
        hotelList = hotelList.filter(h => h.id === user.assigned_hotel);
        if (hotelList.length === 1) {
          setSelectedHotel(user.assigned_hotel);
        }
      }
      setHotels(hotelList);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    const dateParams = getDateRangeParams();
    const params = { ...dateParams };
    if (selectedHotel && selectedHotel !== 'all') {
      params.hotel_id = selectedHotel;
    }

    const [occupancyResult, revenueResult, demoResult, summaryResult, serviceResult] = await Promise.all([
      reportService.getOccupancy(params),
      reportService.getRevenue(params),
      reportService.getGuestDemographics(params),
      reportService.getDashboardSummary(params),
      reportService.getServicePopularity(params),
    ]);

    if (occupancyResult.success) setOccupancy(occupancyResult.data);
    if (revenueResult.success) setRevenue(revenueResult.data);
    if (demoResult.success) setDemographics(demoResult.data);
    if (summaryResult.success) setSummary(summaryResult.data);
    if (serviceResult.success && serviceResult.data.services) {
      // Map backend fields to expected frontend fields
      const mappedServices = serviceResult.data.services.map(s => ({
        name: s.name,
        bookings: s.booking_count || 0,
        revenue: s.total_revenue || 0,
        quantity: s.quantity || 0,
      }));
      setServicePopularity(mappedServices);
    }

    // Fetch bookings for trends and distribution
    const bookingParams = { page_size: 1000 };
    if (selectedHotel && selectedHotel !== 'all') {
      bookingParams.hotel = selectedHotel;
    }
    const bookingsResult = await bookingService.getAll(bookingParams);
    if (bookingsResult.success) {
      const bookings = bookingsResult.data.results || bookingsResult.data || [];
      calculateTrends(bookings);
      calculateStatusDistribution(bookings);
    }

    setLoading(false);
  };

  const calculateTrends = (bookings) => {
    if (!bookings || bookings.length === 0) {
      setBookingTrends([]);
      setRevenueTrends([]);
      return;
    }

    const getBookingRevenue = (booking) => {
      if (['confirmed', 'checked_in', 'checked_out'].includes(booking.status)) {
        return parseFloat(booking.total_price || 0);
      }
      if (booking.status === 'cancelled') {
        return parseFloat(booking.cancellation_fee_amount || 0);
      }
      return 0;
    };

    let daysBack, groupBy;
    switch (dateRange) {
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
        daysBack = 30;
        groupBy = 'day';
    }

    const now = new Date();
    const startDate = daysBack ? new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000) : null;
    const filteredBookings = startDate
      ? bookings.filter(b => b.created_at && new Date(b.created_at) >= startDate)
      : bookings;

    const trends = [];

    if (groupBy === 'day') {
      for (let i = daysBack - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayBookings = filteredBookings.filter(b => b.created_at?.startsWith(dateStr));
        const dateFormat = dateRange === '7d'
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
        trends.push({
          date: weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          bookings: weekBookings.length,
          revenue: weekBookings.reduce((sum, b) => sum + getBookingRevenue(b), 0),
        });
      }
    } else if (groupBy === 'month') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
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
      const currentYear = new Date().getFullYear();
      for (let year = 2020; year <= currentYear; year++) {
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

    setBookingTrends(trends);
    setRevenueTrends(trends);
  };

  const calculateStatusDistribution = (bookings) => {
    const statusCounts = {};
    bookings.forEach(b => {
      if (b.status === 'checked_out') return;
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
    });
    const distribution = Object.entries(statusCounts).map(([name, value]) => ({
      name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value,
      color: STATUS_COLORS[name] || '#6b7280',
    }));
    setStatusDistribution(distribution);
  };

  const handleRefresh = () => {
    fetchAllData();
    showSuccess('Reports refreshed');
  };

  const handleExportPDF = () => {
    const printContent = printRef.current;
    if (printContent) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Reports Dashboard - ${new Date().toLocaleDateString()}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #1a1f37; border-bottom: 2px solid #1976d2; padding-bottom: 10px; }
              .section { margin-bottom: 30px; page-break-inside: avoid; }
              .stat-card { display: inline-block; width: 23%; margin: 1%; padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px; }
              .stat-value { font-size: 24px; font-weight: bold; color: #1a1f37; }
              .stat-label { color: #666; font-size: 12px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e0e0e0; }
              th { background-color: #f5f5f5; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <h1>Hotel Management System - Reports Dashboard</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>Period: ${dateRangeLabels[dateRange]}</p>
            <div class="section">
              <h2>Key Metrics Summary</h2>
              <div class="stat-card">
                <div class="stat-label">Total Bookings</div>
                <div class="stat-value">${summary?.total_bookings || 0}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Total Revenue</div>
                <div class="stat-value">${formatCurrency(summary?.total_revenue || revenue?.total_revenue)}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Occupancy Rate</div>
                <div class="stat-value">${(occupancy?.occupancy_rate || 0).toFixed(1)}%</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Active Guests</div>
                <div class="stat-value">${summary?.active_guests || 0}</div>
              </div>
            </div>
            <div class="footer">
              <p>Hotel Management System - Confidential Report</p>
              <p>Generated by: ${user?.first_name || user?.username || 'System'}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
    showSuccess('PDF export initiated');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount || 0);
  };

  const handleHotelChange = (event) => {
    setSelectedHotel(event.target.value);
  };

  const handleDateRangeChange = (event, newRange) => {
    if (newRange !== null) {
      setDateRange(newRange);
    }
  };

  const selectedHotelName = selectedHotel === 'all'
    ? 'All Hotels'
    : hotels.find(h => h.id === selectedHotel)?.name || 'Selected Hotel';

  // Prepare demographics data for chart
  const demographicsData = demographics?.by_country?.slice(0, 6).map(item => ({
    name: item.country || 'Unknown',
    value: item.count,
  })) || [];

  // Prepare occupancy by hotel data
  const occupancyByHotel = occupancy?.by_hotel?.map(item => ({
    name: item.name?.length > 12 ? item.name.substring(0, 12) + '...' : item.name,
    occupancy: item.occupancy_rate || 0,
    occupied: item.occupied,
    available: item.available,
  })) || [];

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', py: 3 }} ref={printRef}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} color="text.primary">
              Reports & Analytics
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Comprehensive performance insights{selectedHotel !== 'all' ? ` for ${selectedHotelName}` : ''}.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
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
              onClick={handleExportPDF}
              sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}
              title="Export PDF"
            >
              <DownloadIcon />
            </IconButton>
            <IconButton
              onClick={handleRefresh}
              sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}
              title="Refresh data"
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Date Range Filter */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 4,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReportIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={600}>
              Report Period: {dateRangeLabels[dateRange]}
            </Typography>
          </Box>
          <ToggleButtonGroup
            value={dateRange}
            exclusive
            onChange={handleDateRangeChange}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                px: 2,
                py: 0.75,
                fontSize: '0.8rem',
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
            <ToggleButton value="7d">7 Days</ToggleButton>
            <ToggleButton value="1m">1 Month</ToggleButton>
            <ToggleButton value="3m">3 Months</ToggleButton>
            <ToggleButton value="6m">6 Months</ToggleButton>
            <ToggleButton value="1y">1 Year</ToggleButton>
            <ToggleButton value="all">All Time</ToggleButton>
          </ToggleButtonGroup>
        </Paper>

        {/* KPI Stats Cards */}
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
                value={summary?.total_bookings || revenue?.total_bookings || 0}
                subtitle={`${dateRangeLabels[dateRange]}`}
                icon={BookingIcon}
                color="#1976d2"
              />
              <StatCard
                title="Total Revenue"
                value={formatCurrency(summary?.total_revenue || revenue?.total_revenue)}
                subtitle="Gross revenue for period"
                icon={RevenueIcon}
                color="#2e7d32"
              />
              <StatCard
                title="Occupancy Rate"
                value={`${(occupancy?.occupancy_rate || 0).toFixed(1)}%`}
                subtitle={`${occupancy?.occupied_rooms || 0} of ${occupancy?.total_rooms || 0} rooms`}
                icon={HotelIcon}
                color="#ed6c02"
              />
              <StatCard
                title="Active Guests"
                value={summary?.active_guests || 0}
                subtitle="Currently checked in"
                icon={PeopleIcon}
                color="#9c27b0"
              />
            </>
          )}
        </Box>

        {/* Booking Trends & Status Distribution */}
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
              Booking Trends ({dateRangeLabels[dateRange]})
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
              ) : statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend
                      layout="horizontal"
                      align="center"
                      verticalAlign="bottom"
                      formatter={(value) => <span style={{ color: '#333', fontSize: 12 }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography color="text.secondary">No booking data available</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Revenue Trends & Service Popularity */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
            gap: 3,
            mb: 4,
          }}
        >
          {/* Revenue Trends Chart */}
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
              Revenue Trends ({dateRangeLabels[dateRange]})
            </Typography>
            <Box sx={{ height: 300 }}>
              {loading ? (
                <Skeleton variant="rounded" height="100%" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueTrends}>
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
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Most Popular Services
            </Typography>
            <Box sx={{ height: 300 }}>
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
                  <BarChart data={servicePopularity}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => {
                        const labels = {
                          'Full English Breakfast': 'Breakfast',
                          'Airport Transfer (One-way)': 'Airport',
                          'Spa Access': 'Spa',
                          'Late Check-out (until 2 PM)': 'Late Checkout',
                        };
                        return labels[value] || value.split(' ')[0];
                      }}
                    />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value, name, props) => [value, props.payload.name]}
                      contentStyle={{
                        borderRadius: 8,
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Bar dataKey="bookings" radius={[4, 4, 0, 0]}>
                      {servicePopularity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Occupancy by Hotel & Guest Demographics */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: 3,
            mb: 4,
          }}
        >
          {/* Occupancy by Hotel */}
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
              Occupancy by Hotel
            </Typography>
            <Box sx={{ height: Math.max(250, occupancyByHotel.length * 50) }}>
              {loading ? (
                <Skeleton variant="rounded" height="100%" />
              ) : occupancyByHotel.length === 0 ? (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography color="text.secondary">
                    No occupancy data available
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occupancyByHotel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e0e0e0" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip
                      formatter={(value, name, props) => [`${value.toFixed(1)}%`, 'Occupancy']}
                      contentStyle={{
                        borderRadius: 8,
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Bar dataKey="occupancy" fill="#9c27b0" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>

          {/* Guest Demographics */}
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
              Guest Demographics by Country
            </Typography>
            <Box sx={{ height: 300 }}>
              {loading ? (
                <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto', mt: 4 }} />
              ) : demographicsData.length === 0 ? (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography color="text.secondary">
                    No demographic data available
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={demographicsData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {demographicsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, 'Guests']} />
                    <Legend
                      layout="horizontal"
                      align="center"
                      verticalAlign="bottom"
                      formatter={(value) => <span style={{ color: '#333', fontSize: 12 }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Revenue by Room Type & Revenue by Payment Status */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: 3,
            mb: 4,
          }}
        >
          {/* Revenue by Room Type */}
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
              Revenue by Room Type
            </Typography>
            <Box sx={{ height: 300 }}>
              {loading ? (
                <Skeleton variant="rounded" height="100%" />
              ) : !revenue?.by_room_type?.length ? (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography color="text.secondary">
                    No room type revenue data available
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenue.by_room_type}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                    <XAxis dataKey="room_type" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `£${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                    <Tooltip
                      formatter={(value) => [`£${value.toFixed(2)}`, 'Revenue']}
                      contentStyle={{
                        borderRadius: 8,
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Bar dataKey="revenue" fill="#1976d2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>

          {/* Revenue by Payment Status */}
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
              Revenue by Payment Status
            </Typography>
            <Box sx={{ height: 300 }}>
              {loading ? (
                <Skeleton variant="rounded" height="100%" />
              ) : !revenue?.by_payment_status?.length ? (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography color="text.secondary">
                    No payment status data available
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                  {revenue.by_payment_status.map((status, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(
                          status.status === 'paid' ? '#2e7d32' :
                          status.status === 'pending' ? '#ed6c02' :
                          status.status === 'partial' ? '#1976d2' : '#6b7280',
                          0.08
                        ),
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip
                          label={status.status}
                          size="small"
                          color={
                            status.status === 'paid' ? 'success' :
                            status.status === 'pending' ? 'warning' :
                            status.status === 'partial' ? 'info' : 'default'
                          }
                          sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          ({status.count} bookings)
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight={700}>
                        {formatCurrency(status.total)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Revenue & Occupancy Details Tables */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: 3,
            mb: 4,
          }}
        >
          {/* Revenue by Hotel Table */}
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
              Revenue by Hotel
            </Typography>
            <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
              {loading ? (
                <Skeleton variant="rounded" height={200} />
              ) : !revenue?.by_hotel?.length ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No hotel revenue data available</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha('#1976d2', 0.04) }}>
                        <TableCell sx={{ fontWeight: 600 }}>Hotel</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Bookings</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Revenue</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Avg.</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {revenue.by_hotel.map((hotel, index) => (
                        <TableRow key={index} hover>
                          <TableCell sx={{ fontWeight: 500 }}>{hotel.name}</TableCell>
                          <TableCell align="center">
                            <Chip label={hotel.bookings} size="small" variant="outlined" color="primary" />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                            {formatCurrency(hotel.revenue)}
                          </TableCell>
                          <TableCell align="right">{formatCurrency(hotel.average)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Paper>

          {/* Detailed Occupancy by Hotel Table */}
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
              Detailed Occupancy by Hotel
            </Typography>
            <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
              {loading ? (
                <Skeleton variant="rounded" height={200} />
              ) : !occupancy?.by_hotel?.length ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No occupancy data available</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha('#9c27b0', 0.04) }}>
                        <TableCell sx={{ fontWeight: 600 }}>Hotel</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Rooms</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Occupied</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Rate</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {occupancy.by_hotel.map((hotel, index) => (
                        <TableRow key={index} hover>
                          <TableCell sx={{ fontWeight: 500 }}>{hotel.name}</TableCell>
                          <TableCell align="center">{hotel.total_rooms}</TableCell>
                          <TableCell align="center">
                            <Chip label={hotel.occupied} size="small" color="success" />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                              <LinearProgress
                                variant="determinate"
                                value={hotel.occupancy_rate || 0}
                                sx={{
                                  width: 60,
                                  height: 8,
                                  borderRadius: 4,
                                  bgcolor: alpha('#9c27b0', 0.1),
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 4,
                                    bgcolor: hotel.occupancy_rate > 70 ? '#2e7d32' : hotel.occupancy_rate > 40 ? '#ed6c02' : '#d32f2f',
                                  },
                                }}
                              />
                              <Typography variant="body2" fontWeight={600} sx={{ minWidth: 40 }}>
                                {hotel.occupancy_rate?.toFixed(0) || 0}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Occupancy by Room Type & Service Revenue */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: 3,
            mb: 4,
          }}
        >
          {/* Occupancy by Room Type */}
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
              Occupancy by Room Type
            </Typography>
            <Box sx={{ pt: 1 }}>
              {loading ? (
                <Skeleton variant="rounded" height={200} />
              ) : !occupancy?.by_room_type?.length ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No room type occupancy data available</Typography>
                </Box>
              ) : (
                occupancy.by_room_type.map((type, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha('#1976d2', 0.03),
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1" sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
                        {type.room_type}
                      </Typography>
                      <Typography variant="body1" fontWeight={700} color="primary">
                        {type.occupancy_rate?.toFixed(1) || 0}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={type.occupancy_rate || 0}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        bgcolor: alpha('#1976d2', 0.1),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 5,
                          bgcolor: type.occupancy_rate > 70 ? '#2e7d32' : type.occupancy_rate > 40 ? '#ed6c02' : '#d32f2f',
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {type.occupied || 0} of {type.total || 0} rooms occupied
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Paper>

          {/* Service Revenue Breakdown */}
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
              Service Revenue Breakdown
            </Typography>
            <Box sx={{ height: 300 }}>
              {loading ? (
                <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto', mt: 4 }} />
              ) : servicePopularity.length === 0 ? (
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No service revenue data available</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={servicePopularity.map(s => ({ name: s.name, value: s.revenue || 0 }))}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {servicePopularity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend
                      layout="horizontal"
                      align="center"
                      verticalAlign="bottom"
                      formatter={(value) => <span style={{ color: '#333', fontSize: 12 }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Ancillary Services Details & Guest Demographics Table */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: 3,
            mb: 4,
          }}
        >
          {/* Ancillary Services Details Table */}
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
              Ancillary Services Details
            </Typography>
            <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
              {loading ? (
                <Skeleton variant="rounded" height={200} />
              ) : servicePopularity.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No service data available</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha('#ed6c02', 0.04) }}>
                        <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Bookings</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Revenue</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Avg.</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {servicePopularity.map((service, index) => (
                        <TableRow key={index} hover>
                          <TableCell sx={{ fontWeight: 500 }}>{service.name}</TableCell>
                          <TableCell align="center">
                            <Chip label={service.bookings} size="small" variant="outlined" color="primary" />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                            {formatCurrency(service.revenue || 0)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(service.bookings ? (service.revenue || 0) / service.bookings : 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Paper>

          {/* Guest Demographics Table */}
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
              Guest Demographics by Country
            </Typography>
            <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
              {loading ? (
                <Skeleton variant="rounded" height={200} />
              ) : !demographics?.by_country?.length ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No demographic data available</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha('#1976d2', 0.04) }}>
                        <TableCell sx={{ fontWeight: 600 }}>Country</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Guests</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Percentage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {demographics.by_country.map((country, index) => (
                        <TableRow key={index} hover>
                          <TableCell sx={{ fontWeight: 500 }}>{country.country || 'Unknown'}</TableCell>
                          <TableCell align="center">
                            <Chip label={country.count} size="small" variant="outlined" color="primary" />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                              <LinearProgress
                                variant="determinate"
                                value={country.percentage || 0}
                                sx={{
                                  width: 60,
                                  height: 8,
                                  borderRadius: 4,
                                  bgcolor: alpha('#1976d2', 0.1),
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 4,
                                    bgcolor: '#1976d2',
                                  },
                                }}
                              />
                              <Typography variant="body2" fontWeight={600} sx={{ minWidth: 40 }}>
                                {country.percentage?.toFixed(1) || 0}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Booking Patterns Summary */}
        {demographics?.booking_patterns && (
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
              Booking Patterns
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
                gap: 3,
                mt: 2,
              }}
            >
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  textAlign: 'center',
                  p: 2,
                }}
              >
                <Typography variant="h3" fontWeight={700} color="#1976d2">
                  {demographics.booking_patterns.average_stay?.toFixed(1) || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Average Stay (nights)
                </Typography>
              </Card>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  textAlign: 'center',
                  p: 2,
                }}
              >
                <Typography variant="h3" fontWeight={700} color="#2e7d32">
                  {demographics.booking_patterns.repeat_guests || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Repeat Guests
                </Typography>
              </Card>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  textAlign: 'center',
                  p: 2,
                }}
              >
                <Typography variant="h3" fontWeight={700} color="#9c27b0">
                  {demographics.booking_patterns.average_lead_time?.toFixed(0) || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Avg. Lead Time (days)
                </Typography>
              </Card>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  textAlign: 'center',
                  p: 2,
                }}
              >
                <Typography variant="h3" fontWeight={700} color="#ed6c02">
                  {demographics.booking_patterns.peak_booking_day || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Peak Booking Day
                </Typography>
              </Card>
            </Box>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default ReportsDashboard;
