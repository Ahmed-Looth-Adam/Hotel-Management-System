/**
 * Reports Dashboard - Unified comprehensive reports view
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
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  ButtonGroup,
  LinearProgress,
  alpha,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  useTheme,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  TrendingDown,
  People,
  Public,
  Hotel,
  EventNote,
  CurrencyPound,
  Download,
  Refresh,
  CalendarMonth,
  MeetingRoom,
  CheckCircle,
  RoomService,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ShowChart,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import reportService from '../../services/reportService';
import { hotelService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';

// Color palette for charts
const CHART_COLORS = {
  primary: '#667eea',
  secondary: '#764ba2',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

const PIE_COLORS = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

const STATUS_COLORS = {
  confirmed: '#3b82f6',
  checked_in: '#10b981',
  checked_out: '#6b7280',
  cancelled: '#ef4444',
  no_show: '#f59e0b',
  pending: '#8b5cf6',
};

const ReportsDashboard = () => {
  const { showError, showSuccess } = useNotification();
  const { user } = useAuth();
  const theme = useTheme();
  const printRef = useRef();

  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState('month'); // week, month, quarter, year
  const [filters, setFilters] = useState({
    hotel: '',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Report data states
  const [occupancy, setOccupancy] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [demographics, setDemographics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [servicePopularity, setServicePopularity] = useState(null);

  useEffect(() => {
    fetchHotels();
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [filters]);

  useEffect(() => {
    // Update date range based on preset
    const now = new Date();
    let startDate;

    switch (dateRange) {
      case 'week':
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
    }

    setFilters(prev => ({
      ...prev,
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    }));
  }, [dateRange]);

  const fetchHotels = async () => {
    const result = await hotelService.getAll();
    if (result.success) {
      setHotels(result.data.results || result.data);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    const params = {};
    if (filters.hotel) params.hotel_id = filters.hotel;
    if (filters.startDate) params.start_date = filters.startDate;
    if (filters.endDate) params.end_date = filters.endDate;

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
    if (serviceResult.success) setServicePopularity(serviceResult.data);

    setLoading(false);
  };

  const handleRefresh = () => {
    fetchAllData();
    showSuccess('Reports refreshed');
  };

  const handleExportPDF = () => {
    // Create a printable version
    const printContent = printRef.current;
    if (printContent) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Reports Dashboard - ${new Date().toLocaleDateString()}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #1a1f37; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
              .section { margin-bottom: 30px; page-break-inside: avoid; }
              .section-title { color: #667eea; margin-bottom: 15px; }
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
            <p>Period: ${filters.startDate} to ${filters.endDate}</p>
            ${filters.hotel ? `<p>Hotel: ${hotels.find(h => h.id === filters.hotel)?.name || 'Selected Hotel'}</p>` : '<p>All Hotels</p>'}

            <div class="section">
              <h2 class="section-title">Key Metrics Summary</h2>
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

            <div class="section">
              <h2 class="section-title">Revenue by Room Type</h2>
              <table>
                <tr><th>Room Type</th><th>Bookings</th><th>Revenue</th></tr>
                ${(revenue?.by_room_type || []).map(type => `
                  <tr><td>${type.room_type}</td><td>${type.bookings}</td><td>${formatCurrency(type.revenue)}</td></tr>
                `).join('')}
              </table>
            </div>

            <div class="section">
              <h2 class="section-title">Occupancy by Hotel</h2>
              <table>
                <tr><th>Hotel</th><th>Total Rooms</th><th>Occupied</th><th>Occupancy Rate</th></tr>
                ${(occupancy?.by_hotel || []).map(hotel => `
                  <tr><td>${hotel.name}</td><td>${hotel.total_rooms}</td><td>${hotel.occupied}</td><td>${(hotel.occupancy_rate || 0).toFixed(1)}%</td></tr>
                `).join('')}
              </table>
            </div>

            <div class="section">
              <h2 class="section-title">Guest Demographics</h2>
              <table>
                <tr><th>Country</th><th>Guests</th><th>Percentage</th></tr>
                ${(demographics?.by_country || []).slice(0, 10).map(country => `
                  <tr><td>${country.country || 'Unknown'}</td><td>${country.count}</td><td>${(country.percentage || 0).toFixed(1)}%</td></tr>
                `).join('')}
              </table>
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

  // Stat Card Component
  const StatCard = ({ title, value, subtitle, icon, color, trend, trendLabel }) => (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'visible',
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        border: '1px solid',
        borderColor: alpha(color, 0.1),
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 30px ${alpha(color, 0.2)}`,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
              sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}
            >
              {title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              <Typography variant="h3" component="div" sx={{ color, fontWeight: 800, lineHeight: 1.2 }}>
                {value}
              </Typography>
              {trend !== undefined && (
                <Chip
                  size="small"
                  icon={trend >= 0 ? <TrendingUp sx={{ fontSize: 14 }} /> : <TrendingDown sx={{ fontSize: 14 }} />}
                  label={`${trend >= 0 ? '+' : ''}${trend}%`}
                  color={trend >= 0 ? 'success' : 'error'}
                  variant="outlined"
                  sx={{ height: 24, '& .MuiChip-label': { px: 1 } }}
                />
              )}
            </Box>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 500 }}>
                {subtitle}
              </Typography>
            )}
            {trendLabel && (
              <Typography variant="caption" color="text.secondary">
                {trendLabel}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.7)} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 20px ${alpha(color, 0.35)}`,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Prepare chart data
  const prepareBookingStatusData = () => {
    if (!summary?.bookings_by_status) return [];
    return summary.bookings_by_status.map(item => ({
      name: item.status?.replace('_', ' '),
      value: item.count,
      percentage: item.percentage,
      color: STATUS_COLORS[item.status] || '#6b7280',
    }));
  };

  const prepareRoomTypeRevenueData = () => {
    if (!revenue?.by_room_type) return [];
    return revenue.by_room_type.map(item => ({
      name: item.room_type,
      revenue: item.revenue,
      bookings: item.bookings,
    }));
  };

  const prepareOccupancyByHotelData = () => {
    if (!occupancy?.by_hotel) return [];
    return occupancy.by_hotel.map(item => ({
      name: item.name?.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
      fullName: item.name,
      occupancy: item.occupancy_rate || 0,
      occupied: item.occupied,
      available: item.available,
    }));
  };

  const prepareDemographicsData = () => {
    if (!demographics?.by_country) return [];
    return demographics.by_country.slice(0, 8).map(item => ({
      name: item.country || 'Unknown',
      value: item.count,
      percentage: item.percentage,
    }));
  };

  const prepareServiceData = () => {
    if (!servicePopularity?.services) return [];
    return servicePopularity.services.map(item => ({
      name: item.name,
      bookings: item.booking_count || item.bookings || 0,
      revenue: item.total_revenue || item.revenue || 0,
    }));
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5, boxShadow: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{label}</Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('revenue') || entry.name.includes('Revenue')
                ? formatCurrency(entry.value)
                : entry.value}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha('#667eea', 0.03)} 0%, ${alpha('#764ba2', 0.03)} 100%)`,
        pb: 6,
      }}
      ref={printRef}
    >
      {/* Hero Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 5,
          px: 4,
          mb: 4,
          borderRadius: { xs: 0, md: '0 0 24px 24px' },
          boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
        }}
      >
        <Container maxWidth="xl" disableGutters>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Assessment sx={{ fontSize: 40 }} />
                <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
                  Reports Dashboard
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400, ml: 7 }}>
                Comprehensive analytics and business insights
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Tooltip title="Refresh Data">
                <IconButton
                  onClick={handleRefresh}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                  }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={handleExportPDF}
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  bgcolor: 'white',
                  color: '#667eea',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 25px rgba(0,0,0,0.2)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Export PDF
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" disableGutters sx={{ px: { xs: 2, md: 4 } }}>
        {/* Filters */}
        <Paper
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <CalendarMonth color="primary" />
            <Typography variant="subtitle1" fontWeight={600}>
              Filter Reports
            </Typography>
          </Box>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Hotel</InputLabel>
                <Select
                  value={filters.hotel}
                  label="Hotel"
                  onChange={(e) => setFilters({ ...filters, hotel: e.target.value })}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">All Hotels</MenuItem>
                  {hotels.map((hotel) => (
                    <MenuItem key={hotel.id} value={hotel.id}>
                      {hotel.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <ButtonGroup variant="outlined" size="medium" fullWidth sx={{ height: 40 }}>
                <Button
                  onClick={() => setDateRange('week')}
                  variant={dateRange === 'week' ? 'contained' : 'outlined'}
                  sx={{ borderRadius: '8px 0 0 8px', textTransform: 'none', fontWeight: 600 }}
                >
                  Week
                </Button>
                <Button
                  onClick={() => setDateRange('month')}
                  variant={dateRange === 'month' ? 'contained' : 'outlined'}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Month
                </Button>
                <Button
                  onClick={() => setDateRange('quarter')}
                  variant={dateRange === 'quarter' ? 'contained' : 'outlined'}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Quarter
                </Button>
                <Button
                  onClick={() => setDateRange('year')}
                  variant={dateRange === 'year' ? 'contained' : 'outlined'}
                  sx={{ borderRadius: '0 8px 8px 0', textTransform: 'none', fontWeight: 600 }}
                >
                  Year
                </Button>
              </ButtonGroup>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
        </Paper>

        {loading ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 12,
              gap: 2,
            }}
          >
            <CircularProgress size={56} thickness={4} />
            <Typography variant="body1" color="text.secondary">
              Loading reports data...
            </Typography>
          </Box>
        ) : (
          <>
          {/* KPI Summary Cards */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
              Key Performance Indicators
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Overview of your hotel performance metrics
            </Typography>
          </Box>
          <Grid container spacing={3} sx={{ mb: 5 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Bookings"
                value={summary?.total_bookings || revenue?.total_bookings || 0}
                subtitle="For selected period"
                icon={<EventNote sx={{ color: 'white', fontSize: 28 }} />}
                color={CHART_COLORS.primary}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Revenue"
                value={formatCurrency(summary?.total_revenue || revenue?.total_revenue)}
                subtitle="Gross revenue"
                icon={<CurrencyPound sx={{ color: 'white', fontSize: 28 }} />}
                color={CHART_COLORS.success}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Occupancy Rate"
                value={`${(occupancy?.occupancy_rate || summary?.occupancy_rate || 0).toFixed(1)}%`}
                subtitle={`${occupancy?.occupied_rooms || 0} / ${occupancy?.total_rooms || 0} rooms`}
                icon={<Hotel sx={{ color: 'white', fontSize: 28 }} />}
                color={CHART_COLORS.warning}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Active Guests"
                value={summary?.active_guests || 0}
                subtitle="Currently checked in"
                icon={<People sx={{ color: 'white', fontSize: 28 }} />}
                color={CHART_COLORS.info}
              />
            </Grid>
          </Grid>

          {/* Tabs for different views */}
          <Paper
            sx={{
              mb: 4,
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              overflow: 'hidden',
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                bgcolor: alpha('#667eea', 0.02),
                '& .MuiTab-root': {
                  py: 2.5,
                  px: 3,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  minHeight: 64,
                },
                '& .Mui-selected': {
                  color: '#667eea !important',
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                },
              }}
            >
              <Tab icon={<BarChartIcon />} label="Overview" iconPosition="start" />
              <Tab icon={<ShowChart />} label="Revenue" iconPosition="start" />
              <Tab icon={<Hotel />} label="Occupancy" iconPosition="start" />
              <Tab icon={<People />} label="Demographics" iconPosition="start" />
              <Tab icon={<RoomService />} label="Services" iconPosition="start" />
            </Tabs>
          </Paper>

          {/* Tab Panels */}
          {activeTab === 0 && (
            <Grid container spacing={4}>
              {/* Booking Status Distribution - Pie Chart */}
              <Grid item xs={12} lg={6}>
                <Paper
                  sx={{
                    p: 4,
                    minHeight: 550,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'box-shadow 0.3s ease',
                    '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.12)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${CHART_COLORS.primary} 0%, ${CHART_COLORS.secondary} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PieChartIcon sx={{ color: 'white', fontSize: 22 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Booking Status Distribution
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  {prepareBookingStatusData().length > 0 ? (
                    <ResponsiveContainer width="100%" height={450}>
                      <PieChart>
                        <Pie
                          data={prepareBookingStatusData()}
                          cx="50%"
                          cy="45%"
                          innerRadius={90}
                          outerRadius={150}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percentage }) => `${name} (${percentage?.toFixed(0)}%)`}
                          labelLine={{ stroke: '#666', strokeWidth: 1 }}
                        >
                          {prepareBookingStatusData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: 30 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 450, flexDirection: 'column', gap: 2 }}>
                      <PieChartIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                      <Typography color="text.secondary">No booking data available</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Revenue by Room Type - Bar Chart */}
              <Grid item xs={12} lg={6}>
                <Paper
                  sx={{
                    p: 4,
                    minHeight: 550,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'box-shadow 0.3s ease',
                    '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.12)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${CHART_COLORS.success} 0%, #059669 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <BarChartIcon sx={{ color: 'white', fontSize: 22 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Revenue by Room Type
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  {prepareRoomTypeRevenueData().length > 0 ? (
                    <ResponsiveContainer width="100%" height={450}>
                      <BarChart data={prepareRoomTypeRevenueData()} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                        <defs>
                          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={CHART_COLORS.success} stopOpacity={1} />
                            <stop offset="100%" stopColor={CHART_COLORS.success} stopOpacity={0.6} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 500 }} axisLine={{ stroke: '#e0e0e0' }} />
                        <YAxis tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`} axisLine={{ stroke: '#e0e0e0' }} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Bar dataKey="revenue" name="Revenue" fill="url(#revenueGradient)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 450, flexDirection: 'column', gap: 2 }}>
                      <BarChartIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                      <Typography color="text.secondary">No revenue data available</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Occupancy by Hotel - Horizontal Bar */}
              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'box-shadow 0.3s ease',
                    '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.12)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${CHART_COLORS.info} 0%, #2563eb 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Hotel sx={{ color: 'white', fontSize: 22 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Occupancy Rate by Hotel
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  {prepareOccupancyByHotelData().length > 0 ? (
                    <ResponsiveContainer width="100%" height={Math.max(400, prepareOccupancyByHotelData().length * 80)}>
                      <BarChart data={prepareOccupancyByHotelData()} layout="vertical" margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
                        <defs>
                          <linearGradient id="occupancyGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={1} />
                            <stop offset="100%" stopColor={CHART_COLORS.secondary} stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} axisLine={{ stroke: '#e0e0e0' }} />
                        <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 13, fontWeight: 500 }} axisLine={{ stroke: '#e0e0e0' }} />
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <Paper sx={{ p: 2, boxShadow: 3, borderRadius: 2 }}>
                                  <Typography variant="subtitle2" fontWeight={600}>{data.fullName}</Typography>
                                  <Typography variant="body2" sx={{ mt: 1 }}>Occupancy: <strong>{data.occupancy.toFixed(1)}%</strong></Typography>
                                  <Typography variant="body2">Occupied: {data.occupied} rooms</Typography>
                                  <Typography variant="body2">Available: {data.available} rooms</Typography>
                                </Paper>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="occupancy" name="Occupancy %" fill="url(#occupancyGradient)" radius={[0, 8, 8, 0]} barSize={35} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, flexDirection: 'column', gap: 2 }}>
                      <Hotel sx={{ fontSize: 48, color: 'text.disabled' }} />
                      <Typography color="text.secondary">No occupancy data available</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Grid container spacing={4}>
              {/* Revenue Summary Cards */}
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Revenue"
                  value={formatCurrency(revenue?.total_revenue)}
                  subtitle="For selected period"
                  icon={<CurrencyPound sx={{ color: 'white', fontSize: 28 }} />}
                  color={CHART_COLORS.success}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Average Booking"
                  value={formatCurrency(revenue?.average_booking_value)}
                  subtitle="Per booking"
                  icon={<TrendingUp sx={{ color: 'white', fontSize: 28 }} />}
                  color={CHART_COLORS.info}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Pending Payments"
                  value={formatCurrency(revenue?.pending_revenue)}
                  subtitle="Awaiting payment"
                  icon={<EventNote sx={{ color: 'white', fontSize: 28 }} />}
                  color={CHART_COLORS.warning}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Bookings"
                  value={revenue?.total_bookings || 0}
                  subtitle="Completed bookings"
                  icon={<CheckCircle sx={{ color: 'white', fontSize: 28 }} />}
                  color={CHART_COLORS.primary}
                />
              </Grid>

              {/* Revenue by Payment Status */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 4,
                    height: '100%',
                    minHeight: 500,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'box-shadow 0.3s ease',
                    '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.12)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${CHART_COLORS.success} 0%, #059669 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CurrencyPound sx={{ color: 'white', fontSize: 22 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Revenue by Payment Status
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  {revenue?.by_payment_status?.length > 0 ? (
                    <Box>
                      {revenue.by_payment_status.map((status, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: 2.5,
                            px: 2,
                            borderRadius: 2,
                            mb: 1.5,
                            bgcolor: alpha(
                              status.status === 'paid' ? CHART_COLORS.success :
                              status.status === 'pending' ? CHART_COLORS.warning :
                              status.status === 'partial' ? CHART_COLORS.info : '#6b7280',
                              0.08
                            ),
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: alpha(
                                status.status === 'paid' ? CHART_COLORS.success :
                                status.status === 'pending' ? CHART_COLORS.warning :
                                status.status === 'partial' ? CHART_COLORS.info : '#6b7280',
                                0.15
                              ),
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Chip
                              label={status.status}
                              size="medium"
                              color={
                                status.status === 'paid' ? 'success' :
                                status.status === 'pending' ? 'warning' :
                                status.status === 'partial' ? 'info' : 'default'
                              }
                              sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                            />
                            <Typography variant="body1" color="text.secondary" fontWeight={500}>
                              ({status.count} bookings)
                            </Typography>
                          </Box>
                          <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            {formatCurrency(status.total)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, flexDirection: 'column', gap: 2 }}>
                      <CurrencyPound sx={{ fontSize: 48, color: 'text.disabled' }} />
                      <Typography color="text.secondary">No payment data available</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Revenue by Room Type Chart */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 4,
                    height: '100%',
                    minHeight: 500,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'box-shadow 0.3s ease',
                    '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.12)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${CHART_COLORS.primary} 0%, ${CHART_COLORS.secondary} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PieChartIcon sx={{ color: 'white', fontSize: 22 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Revenue by Room Type
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  {prepareRoomTypeRevenueData().length > 0 ? (
                    <ResponsiveContainer width="100%" height={420}>
                      <PieChart>
                        <Pie
                          data={prepareRoomTypeRevenueData()}
                          cx="50%"
                          cy="45%"
                          innerRadius={80}
                          outerRadius={140}
                          paddingAngle={3}
                          dataKey="revenue"
                          nameKey="name"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {prepareRoomTypeRevenueData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                        <Legend wrapperStyle={{ paddingTop: 30 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 420, flexDirection: 'column', gap: 2 }}>
                      <PieChartIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                      <Typography color="text.secondary">No room type data available</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Revenue by Hotel Table */}
              {revenue?.by_hotel?.length > 0 && (
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 4,
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      transition: 'box-shadow 0.3s ease',
                      '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.12)' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          background: `linear-gradient(135deg, ${CHART_COLORS.info} 0%, #2563eb 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Hotel sx={{ color: 'white', fontSize: 22 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Revenue by Hotel
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: alpha(CHART_COLORS.primary, 0.04) }}>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Hotel</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Bookings</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Revenue</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Avg. Booking</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>% of Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {revenue.by_hotel.map((hotel, index) => (
                            <TableRow
                              key={index}
                              hover
                              sx={{
                                '&:hover': { bgcolor: alpha(CHART_COLORS.primary, 0.04) },
                                transition: 'background-color 0.2s ease',
                              }}
                            >
                              <TableCell sx={{ fontWeight: 600, py: 2 }}>{hotel.name}</TableCell>
                              <TableCell align="center" sx={{ py: 2 }}>
                                <Chip label={hotel.bookings} size="small" variant="outlined" color="primary" />
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, py: 2, color: CHART_COLORS.success }}>
                                {formatCurrency(hotel.revenue)}
                              </TableCell>
                              <TableCell align="right" sx={{ py: 2 }}>{formatCurrency(hotel.average)}</TableCell>
                              <TableCell align="center" sx={{ py: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={hotel.percentage || 0}
                                    sx={{
                                      width: 80,
                                      height: 10,
                                      borderRadius: 5,
                                      bgcolor: alpha(CHART_COLORS.primary, 0.1),
                                      '& .MuiLinearProgress-bar': {
                                        borderRadius: 5,
                                        background: `linear-gradient(90deg, ${CHART_COLORS.primary} 0%, ${CHART_COLORS.secondary} 100%)`,
                                      },
                                    }}
                                  />
                                  <Typography variant="body2" fontWeight={600}>
                                    {hotel.percentage?.toFixed(1) || 0}%
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}

          {activeTab === 2 && (
            <Grid container spacing={4}>
              {/* Occupancy Summary Cards */}
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Occupancy Rate"
                  value={`${(occupancy?.occupancy_rate || 0).toFixed(1)}%`}
                  subtitle="Current period"
                  icon={<Assessment sx={{ color: 'white', fontSize: 28 }} />}
                  color={CHART_COLORS.primary}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Rooms"
                  value={occupancy?.total_rooms || 0}
                  subtitle="Across all hotels"
                  icon={<MeetingRoom sx={{ color: 'white', fontSize: 28 }} />}
                  color={CHART_COLORS.info}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Occupied Rooms"
                  value={occupancy?.occupied_rooms || 0}
                  subtitle="Currently booked"
                  icon={<CheckCircle sx={{ color: 'white', fontSize: 28 }} />}
                  color={CHART_COLORS.success}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Available Rooms"
                  value={occupancy?.available_rooms || 0}
                  subtitle="Ready to book"
                  icon={<Hotel sx={{ color: 'white', fontSize: 28 }} />}
                  color={CHART_COLORS.warning}
                />
              </Grid>

              {/* Occupancy by Room Type */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 4,
                    minHeight: 520,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'box-shadow 0.3s ease',
                    '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.12)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${CHART_COLORS.primary} 0%, ${CHART_COLORS.secondary} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MeetingRoom sx={{ color: 'white', fontSize: 22 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Occupancy by Room Type
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  {occupancy?.by_room_type?.length > 0 ? (
                    <Box>
                      {occupancy.by_room_type.map((type, index) => (
                        <Box
                          key={index}
                          sx={{
                            mb: 3,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: alpha(CHART_COLORS.primary, 0.03),
                            transition: 'all 0.2s ease',
                            '&:hover': { bgcolor: alpha(CHART_COLORS.primary, 0.06) },
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                            <Typography variant="body1" sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
                              {type.room_type}
                            </Typography>
                            <Typography variant="h6" fontWeight={700} color="primary">
                              {type.occupancy_rate?.toFixed(1) || 0}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={type.occupancy_rate || 0}
                            sx={{
                              height: 14,
                              borderRadius: 7,
                              bgcolor: alpha(CHART_COLORS.primary, 0.1),
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 7,
                                background: `linear-gradient(90deg, ${CHART_COLORS.primary} 0%, ${CHART_COLORS.secondary} 100%)`,
                              },
                            }}
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 500 }}>
                            {type.occupied || 0} of {type.total || 0} rooms occupied
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 350, flexDirection: 'column', gap: 2 }}>
                      <MeetingRoom sx={{ fontSize: 48, color: 'text.disabled' }} />
                      <Typography color="text.secondary">No room type data available</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Occupancy by Hotel Chart */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 4,
                    height: '100%',
                    minHeight: 520,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'box-shadow 0.3s ease',
                    '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.12)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${CHART_COLORS.info} 0%, #2563eb 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <BarChartIcon sx={{ color: 'white', fontSize: 22 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Occupancy Comparison
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  {prepareOccupancyByHotelData().length > 0 ? (
                    <ResponsiveContainer width="100%" height={420}>
                      <BarChart data={prepareOccupancyByHotelData()} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 500 }} axisLine={{ stroke: '#e0e0e0' }} />
                        <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} axisLine={{ stroke: '#e0e0e0' }} />
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <Paper sx={{ p: 2, boxShadow: 3, borderRadius: 2 }}>
                                  <Typography variant="subtitle2" fontWeight={600}>{data.fullName}</Typography>
                                  <Typography variant="body2" sx={{ mt: 1 }}>Occupancy: <strong>{data.occupancy.toFixed(1)}%</strong></Typography>
                                </Paper>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="occupancy" name="Occupancy %" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]}>
                          {prepareOccupancyByHotelData().map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.occupancy > 70 ? CHART_COLORS.success : entry.occupancy > 40 ? CHART_COLORS.warning : CHART_COLORS.error}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 420, flexDirection: 'column', gap: 2 }}>
                      <BarChartIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                      <Typography color="text.secondary">No hotel data available</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Occupancy by Hotel Table */}
              {occupancy?.by_hotel?.length > 0 && (
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 4,
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      transition: 'box-shadow 0.3s ease',
                      '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.12)' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          background: `linear-gradient(135deg, ${CHART_COLORS.success} 0%, #059669 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Hotel sx={{ color: 'white', fontSize: 22 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Detailed Occupancy by Hotel
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: alpha(CHART_COLORS.primary, 0.04) }}>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Hotel</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Total Rooms</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Occupied</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Available</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Occupancy Rate</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {occupancy.by_hotel.map((hotel, index) => (
                            <TableRow
                              key={index}
                              hover
                              sx={{
                                '&:hover': { bgcolor: alpha(CHART_COLORS.primary, 0.04) },
                                transition: 'background-color 0.2s ease',
                              }}
                            >
                              <TableCell sx={{ fontWeight: 600, py: 2 }}>{hotel.name}</TableCell>
                              <TableCell align="center" sx={{ py: 2 }}>
                                <Chip label={hotel.total_rooms} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell align="center" sx={{ py: 2 }}>
                                <Chip label={hotel.occupied} size="small" color="success" sx={{ fontWeight: 600 }} />
                              </TableCell>
                              <TableCell align="center" sx={{ py: 2 }}>
                                <Chip label={hotel.available} size="small" color="info" variant="outlined" sx={{ fontWeight: 600 }} />
                              </TableCell>
                              <TableCell align="center" sx={{ py: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={hotel.occupancy_rate || 0}
                                    sx={{
                                      width: 100,
                                      height: 10,
                                      borderRadius: 5,
                                      bgcolor: alpha(CHART_COLORS.primary, 0.1),
                                      '& .MuiLinearProgress-bar': {
                                        borderRadius: 5,
                                        bgcolor: hotel.occupancy_rate > 70 ? CHART_COLORS.success :
                                          hotel.occupancy_rate > 40 ? CHART_COLORS.warning : CHART_COLORS.error,
                                      },
                                    }}
                                  />
                                  <Typography variant="body2" sx={{ minWidth: 50, fontWeight: 700 }}>
                                    {hotel.occupancy_rate?.toFixed(1) || 0}%
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}

          {activeTab === 3 && (
            <Grid container spacing={4}>
              {/* Demographics Summary */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 4,
                    minHeight: 550,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'box-shadow 0.3s ease',
                    '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.12)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${CHART_COLORS.info} 0%, #2563eb 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Public sx={{ color: 'white', fontSize: 22 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Guest Demographics by Country
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  {demographics?.by_country?.length > 0 ? (
                    <TableContainer sx={{ maxHeight: 450 }}>
                      <Table stickyHeader size="medium">
                        <TableHead>
                          <TableRow sx={{ bgcolor: alpha(CHART_COLORS.primary, 0.04) }}>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Country</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Guests</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Percentage</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {demographics.by_country.map((country, index) => (
                            <TableRow
                              key={index}
                              hover
                              sx={{
                                '&:hover': { bgcolor: alpha(CHART_COLORS.primary, 0.04) },
                                transition: 'background-color 0.2s ease',
                              }}
                            >
                              <TableCell sx={{ fontWeight: 600, py: 2 }}>
                                {country.country || 'Unknown'}
                              </TableCell>
                              <TableCell align="center" sx={{ py: 2 }}>
                                <Chip label={country.count} size="small" color="primary" variant="outlined" />
                              </TableCell>
                              <TableCell align="center" sx={{ py: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'center' }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={country.percentage || 0}
                                    sx={{
                                      width: 80,
                                      height: 8,
                                      borderRadius: 4,
                                      bgcolor: alpha(CHART_COLORS.primary, 0.1),
                                      '& .MuiLinearProgress-bar': {
                                        borderRadius: 4,
                                        background: `linear-gradient(90deg, ${CHART_COLORS.primary} 0%, ${CHART_COLORS.secondary} 100%)`,
                                      },
                                    }}
                                  />
                                  <Typography variant="body2" fontWeight={600}>
                                    {country.percentage?.toFixed(1) || 0}%
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, flexDirection: 'column', gap: 2 }}>
                      <Public sx={{ fontSize: 48, color: 'text.disabled' }} />
                      <Typography color="text.secondary">No demographic data available</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Demographics Pie Chart */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 4,
                    height: '100%',
                    minHeight: 550,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'box-shadow 0.3s ease',
                    '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.12)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${CHART_COLORS.primary} 0%, ${CHART_COLORS.secondary} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PieChartIcon sx={{ color: 'white', fontSize: 22 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Guest Distribution
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  {prepareDemographicsData().length > 0 ? (
                    <ResponsiveContainer width="100%" height={450}>
                      <PieChart>
                        <Pie
                          data={prepareDemographicsData()}
                          cx="50%"
                          cy="45%"
                          innerRadius={80}
                          outerRadius={150}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percentage }) => `${name} (${percentage?.toFixed(0)}%)`}
                          labelLine={{ stroke: '#666', strokeWidth: 1 }}
                        >
                          {prepareDemographicsData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend wrapperStyle={{ paddingTop: 30 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 450, flexDirection: 'column', gap: 2 }}>
                      <PieChartIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                      <Typography color="text.secondary">No demographic data available</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Booking Patterns */}
              {demographics?.booking_patterns && (
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 4,
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      background: `linear-gradient(135deg, ${alpha('#667eea', 0.03)} 0%, ${alpha('#764ba2', 0.03)} 100%)`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          background: `linear-gradient(135deg, ${CHART_COLORS.warning} 0%, #d97706 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CalendarMonth sx={{ color: 'white', fontSize: 22 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Booking Patterns
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 4 }} />
                    <Grid container spacing={4}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box
                          sx={{
                            textAlign: 'center',
                            p: 3,
                            borderRadius: 3,
                            bgcolor: 'white',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                            transition: 'all 0.3s ease',
                            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' },
                          }}
                        >
                          <Typography variant="h2" color="primary" sx={{ fontWeight: 800, mb: 1 }}>
                            {demographics.booking_patterns.average_stay?.toFixed(1) || 0}
                          </Typography>
                          <Typography variant="body1" color="text.secondary" fontWeight={500}>
                            Average Stay (nights)
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box
                          sx={{
                            textAlign: 'center',
                            p: 3,
                            borderRadius: 3,
                            bgcolor: 'white',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                            transition: 'all 0.3s ease',
                            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' },
                          }}
                        >
                          <Typography variant="h2" sx={{ fontWeight: 800, mb: 1, color: CHART_COLORS.success }}>
                            {demographics.booking_patterns.repeat_guests || 0}
                          </Typography>
                          <Typography variant="body1" color="text.secondary" fontWeight={500}>
                            Repeat Guests
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box
                          sx={{
                            textAlign: 'center',
                            p: 3,
                            borderRadius: 3,
                            bgcolor: 'white',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                            transition: 'all 0.3s ease',
                            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' },
                          }}
                        >
                          <Typography variant="h2" sx={{ fontWeight: 800, mb: 1, color: CHART_COLORS.info }}>
                            {demographics.booking_patterns.average_lead_time?.toFixed(0) || 0}
                          </Typography>
                          <Typography variant="body1" color="text.secondary" fontWeight={500}>
                            Avg. Lead Time (days)
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box
                          sx={{
                            textAlign: 'center',
                            p: 3,
                            borderRadius: 3,
                            bgcolor: 'white',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                            transition: 'all 0.3s ease',
                            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' },
                          }}
                        >
                          <Typography variant="h2" sx={{ fontWeight: 800, mb: 1, color: CHART_COLORS.warning }}>
                            {demographics.booking_patterns.peak_booking_day || 'N/A'}
                          </Typography>
                          <Typography variant="body1" color="text.secondary" fontWeight={500}>
                            Peak Booking Day
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}

          {activeTab === 4 && (
            <Grid container spacing={4}>
              {/* Service Popularity */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 4,
                    minHeight: 550,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'box-shadow 0.3s ease',
                    '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.12)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${CHART_COLORS.primary} 0%, ${CHART_COLORS.secondary} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <RoomService sx={{ color: 'white', fontSize: 22 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Service Popularity
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  {prepareServiceData().length > 0 ? (
                    <ResponsiveContainer width="100%" height={450}>
                      <BarChart data={prepareServiceData()} layout="vertical" margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
                        <defs>
                          <linearGradient id="serviceGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={1} />
                            <stop offset="100%" stopColor={CHART_COLORS.secondary} stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" horizontal={false} />
                        <XAxis type="number" axisLine={{ stroke: '#e0e0e0' }} />
                        <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 13, fontWeight: 500 }} axisLine={{ stroke: '#e0e0e0' }} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Bar dataKey="bookings" name="Bookings" fill="url(#serviceGradient)" radius={[0, 8, 8, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 450, flexDirection: 'column', gap: 2 }}>
                      <RoomService sx={{ fontSize: 48, color: 'text.disabled' }} />
                      <Typography color="text.secondary">No service data available</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Service Revenue */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 4,
                    height: '100%',
                    minHeight: 550,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'box-shadow 0.3s ease',
                    '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.12)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${CHART_COLORS.success} 0%, #059669 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CurrencyPound sx={{ color: 'white', fontSize: 22 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Service Revenue Breakdown
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  {prepareServiceData().length > 0 ? (
                    <ResponsiveContainer width="100%" height={450}>
                      <PieChart>
                        <Pie
                          data={prepareServiceData()}
                          cx="50%"
                          cy="45%"
                          innerRadius={80}
                          outerRadius={145}
                          paddingAngle={3}
                          dataKey="revenue"
                          nameKey="name"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {prepareServiceData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                        <Legend wrapperStyle={{ paddingTop: 30 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 450, flexDirection: 'column', gap: 2 }}>
                      <PieChartIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                      <Typography color="text.secondary">No service revenue data available</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Service Details Table */}
              {prepareServiceData().length > 0 && (
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 4,
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      transition: 'box-shadow 0.3s ease',
                      '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.12)' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          background: `linear-gradient(135deg, ${CHART_COLORS.info} 0%, #2563eb 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Assessment sx={{ color: 'white', fontSize: 22 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Ancillary Services Details
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: alpha(CHART_COLORS.primary, 0.04) }}>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Service</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Bookings</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Total Revenue</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Avg. per Booking</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {prepareServiceData().map((service, index) => (
                            <TableRow
                              key={index}
                              hover
                              sx={{
                                '&:hover': { bgcolor: alpha(CHART_COLORS.primary, 0.04) },
                                transition: 'background-color 0.2s ease',
                              }}
                            >
                              <TableCell sx={{ fontWeight: 600, py: 2 }}>{service.name}</TableCell>
                              <TableCell align="center" sx={{ py: 2 }}>
                                <Chip label={service.bookings} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, py: 2, color: CHART_COLORS.success }}>
                                {formatCurrency(service.revenue)}
                              </TableCell>
                              <TableCell align="right" sx={{ py: 2, fontWeight: 500 }}>
                                {formatCurrency(service.bookings ? service.revenue / service.bookings : 0)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </>
      )}
      </Container>
    </Box>
  );
};

export default ReportsDashboard;
