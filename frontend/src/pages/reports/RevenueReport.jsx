/**
 * Revenue Report Page - View revenue analytics
 *
 * Features:
 * - Revenue totals and trends
 * - Breakdown by hotel, room type
 * - Payment status summary
 * - Date range filtering
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
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  Receipt,
  AccountBalance,
  CreditCard,
  Payments,
} from '@mui/icons-material';
import reportService from '../../services/reportService';
import { hotelService } from '../../services';
import { useNotification } from '../../hooks/useNotification';

const RevenueReport = () => {
  const { showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState([]);
  const [filters, setFilters] = useState({
    hotel: '',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchHotels();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [filters]);

  const fetchHotels = async () => {
    const result = await hotelService.getAll();
    if (result.success) {
      setHotels(result.data.results || result.data);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    const params = {};
    if (filters.hotel) params.hotel_id = filters.hotel;
    if (filters.startDate) params.start_date = filters.startDate;
    if (filters.endDate) params.end_date = filters.endDate;

    const result = await reportService.getRevenue(params);
    if (result.success) {
      setData(result.data);
    } else {
      showError('Failed to load revenue report');
    }
    setLoading(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount || 0);
  };

  const StatCard = ({ title, value, subtitle, icon, color }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ color }}>
              {value}
            </Typography>
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

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <AttachMoney color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" component="h1">
          Revenue Report
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Hotel</InputLabel>
              <Select
                value={filters.hotel}
                label="Hotel"
                onChange={(e) => setFilters({ ...filters, hotel: e.target.value })}
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
            <TextField
              fullWidth
              size="small"
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
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
            />
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Revenue"
                value={formatCurrency(data.total_revenue)}
                subtitle="For selected period"
                icon={<AttachMoney sx={{ fontSize: 48 }} />}
                color="success.main"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Bookings"
                value={data.total_bookings || 0}
                subtitle="Completed bookings"
                icon={<Receipt sx={{ fontSize: 48 }} />}
                color="primary.main"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Average Booking Value"
                value={formatCurrency(data.average_booking_value)}
                subtitle="Per booking"
                icon={<TrendingUp sx={{ fontSize: 48 }} />}
                color="info.main"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Pending Payments"
                value={formatCurrency(data.pending_revenue)}
                subtitle="Awaiting payment"
                icon={<Payments sx={{ fontSize: 48 }} />}
                color="warning.main"
              />
            </Grid>
          </Grid>

          {/* Revenue by Payment Status */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Revenue by Payment Status
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {data.by_payment_status && data.by_payment_status.length > 0 ? (
                  <Box>
                    {data.by_payment_status.map((status, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 1.5,
                          borderBottom: index < data.by_payment_status.length - 1 ? '1px solid' : 'none',
                          borderColor: 'divider',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={status.status}
                            size="small"
                            color={
                              status.status === 'paid' ? 'success' :
                              status.status === 'pending' ? 'warning' :
                              status.status === 'partial' ? 'info' : 'default'
                            }
                          />
                          <Typography variant="body2" color="text.secondary">
                            ({status.count} bookings)
                          </Typography>
                        </Box>
                        <Typography variant="h6">
                          {formatCurrency(status.total)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography color="text.secondary">No payment data available</Typography>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Revenue by Room Type
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {data.by_room_type && data.by_room_type.length > 0 ? (
                  <Box>
                    {data.by_room_type.map((type, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 1.5,
                          borderBottom: index < data.by_room_type.length - 1 ? '1px solid' : 'none',
                          borderColor: 'divider',
                        }}
                      >
                        <Box>
                          <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                            {type.room_type}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {type.bookings} bookings
                          </Typography>
                        </Box>
                        <Typography variant="h6">
                          {formatCurrency(type.revenue)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography color="text.secondary">No room type data available</Typography>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Revenue by Hotel */}
          {data.by_hotel && data.by_hotel.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Revenue by Hotel
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Hotel</TableCell>
                      <TableCell align="center">Bookings</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">Avg. Booking</TableCell>
                      <TableCell align="center">% of Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.by_hotel.map((hotel, index) => (
                      <TableRow key={index}>
                        <TableCell>{hotel.name}</TableCell>
                        <TableCell align="center">{hotel.bookings}</TableCell>
                        <TableCell align="right">{formatCurrency(hotel.revenue)}</TableCell>
                        <TableCell align="right">{formatCurrency(hotel.average)}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${hotel.percentage?.toFixed(1) || 0}%`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AttachMoney sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No data available
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default RevenueReport;
