/**
 * Analytics Dashboard Page - Comprehensive analytics view
 *
 * Features:
 * - Guest demographics
 * - Booking trends
 * - Key performance indicators
 * - Summary statistics
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { useState, useEffect } from 'react';
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
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  Analytics,
  TrendingUp,
  TrendingDown,
  People,
  Public,
  Hotel,
  EventNote,
  Star,
} from '@mui/icons-material';
import reportService from '../../services/reportService';
import { hotelService } from '../../services';
import { useNotification } from '../../hooks/useNotification';

const AnalyticsDashboard = () => {
  const { showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [demographics, setDemographics] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchHotels();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedHotel]);

  const fetchHotels = async () => {
    const result = await hotelService.getAll();
    if (result.success) {
      setHotels(result.data.results || result.data);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const params = {};
    if (selectedHotel) params.hotel_id = selectedHotel;

    const [demoResult, summaryResult] = await Promise.all([
      reportService.getGuestDemographics(params),
      reportService.getDashboardSummary(params),
    ]);

    if (demoResult.success) {
      setDemographics(demoResult.data);
    } else {
      showError('Failed to load demographics');
    }

    if (summaryResult.success) {
      setSummary(summaryResult.data);
    } else {
      showError('Failed to load summary');
    }

    setLoading(false);
  };

  const StatCard = ({ title, value, subtitle, icon, color, trend }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography variant="h4" component="div" sx={{ color }}>
                {value}
              </Typography>
              {trend && (
                <Chip
                  size="small"
                  icon={trend > 0 ? <TrendingUp /> : <TrendingDown />}
                  label={`${trend > 0 ? '+' : ''}${trend}%`}
                  color={trend > 0 ? 'success' : 'error'}
                  variant="outlined"
                />
              )}
            </Box>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color, opacity: 0.3 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount || 0);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Analytics color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" component="h1">
          Analytics Dashboard
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Hotel</InputLabel>
              <Select
                value={selectedHotel}
                label="Hotel"
                onChange={(e) => setSelectedHotel(e.target.value)}
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
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* KPI Summary Cards */}
          {summary && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Bookings"
                  value={summary.total_bookings || 0}
                  subtitle="All time"
                  icon={<EventNote sx={{ fontSize: 48 }} />}
                  color="primary.main"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Revenue"
                  value={formatCurrency(summary.total_revenue)}
                  subtitle="All time"
                  icon={<TrendingUp sx={{ fontSize: 48 }} />}
                  color="success.main"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Active Guests"
                  value={summary.active_guests || 0}
                  subtitle="Currently checked in"
                  icon={<People sx={{ fontSize: 48 }} />}
                  color="info.main"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Occupancy Rate"
                  value={`${summary.occupancy_rate?.toFixed(1) || 0}%`}
                  subtitle="Current"
                  icon={<Hotel sx={{ fontSize: 48 }} />}
                  color="warning.main"
                />
              </Grid>
            </Grid>
          )}

          {/* Demographics Section */}
          <Grid container spacing={3}>
            {/* Guest Demographics by Country */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Public color="primary" />
                  <Typography variant="h6">
                    Guest Demographics
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {demographics?.by_country && demographics.by_country.length > 0 ? (
                  <TableContainer sx={{ maxHeight: 400 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Country</TableCell>
                          <TableCell align="center">Guests</TableCell>
                          <TableCell align="center">Percentage</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {demographics.by_country.map((country, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {country.country || 'Unknown'}
                              </Box>
                            </TableCell>
                            <TableCell align="center">{country.count}</TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={country.percentage || 0}
                                  sx={{ width: 60, height: 6, borderRadius: 3 }}
                                />
                                <Typography variant="body2">
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
                  <Typography color="text.secondary">No demographic data available</Typography>
                )}
              </Paper>
            </Grid>

            {/* Booking Status Distribution */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <EventNote color="primary" />
                  <Typography variant="h6">
                    Booking Status Distribution
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {summary?.bookings_by_status && summary.bookings_by_status.length > 0 ? (
                  <Box>
                    {summary.bookings_by_status.map((status, index) => {
                      const statusColors = {
                        pending: 'warning',
                        confirmed: 'info',
                        checked_in: 'success',
                        checked_out: 'default',
                        cancelled: 'error',
                        completed: 'success',
                      };
                      return (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: 2,
                            borderBottom: index < summary.bookings_by_status.length - 1 ? '1px solid' : 'none',
                            borderColor: 'divider',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Chip
                              label={status.status?.replace('_', ' ')}
                              color={statusColors[status.status] || 'default'}
                              size="small"
                            />
                            <Typography variant="body2" color="text.secondary">
                              {status.count} bookings
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: 150 }}>
                            <LinearProgress
                              variant="determinate"
                              value={status.percentage || 0}
                              color={statusColors[status.status] || 'primary'}
                              sx={{ flex: 1, height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="body2" sx={{ minWidth: 40 }}>
                              {status.percentage?.toFixed(0) || 0}%
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                ) : (
                  <Typography color="text.secondary">No booking status data available</Typography>
                )}
              </Paper>
            </Grid>

            {/* Top Performing Hotels */}
            {summary?.top_hotels && summary.top_hotels.length > 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Star color="primary" />
                    <Typography variant="h6">
                      Top Performing Hotels
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Rank</TableCell>
                          <TableCell>Hotel</TableCell>
                          <TableCell align="center">Bookings</TableCell>
                          <TableCell align="right">Revenue</TableCell>
                          <TableCell align="center">Occupancy</TableCell>
                          <TableCell align="center">Rating</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {summary.top_hotels.map((hotel, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Chip
                                label={`#${index + 1}`}
                                size="small"
                                color={index === 0 ? 'warning' : index === 1 ? 'default' : 'default'}
                                variant={index < 3 ? 'filled' : 'outlined'}
                              />
                            </TableCell>
                            <TableCell>{hotel.name}</TableCell>
                            <TableCell align="center">{hotel.bookings}</TableCell>
                            <TableCell align="right">{formatCurrency(hotel.revenue)}</TableCell>
                            <TableCell align="center">
                              <LinearProgress
                                variant="determinate"
                                value={hotel.occupancy_rate || 0}
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                <Star sx={{ color: 'warning.main', fontSize: 18 }} />
                                <Typography variant="body2">{hotel.rating || '-'}</Typography>
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
        </>
      )}
    </Container>
  );
};

export default AnalyticsDashboard;
