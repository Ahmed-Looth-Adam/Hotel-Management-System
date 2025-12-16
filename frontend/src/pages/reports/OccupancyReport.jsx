/**
 * Occupancy Report Page - View hotel occupancy analytics
 *
 * Features:
 * - Occupancy rate display
 * - Room availability breakdown
 * - Date range filtering
 * - Hotel filtering
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
  LinearProgress,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Assessment,
  Hotel,
  MeetingRoom,
  CheckCircle,
  DoNotDisturb,
  EventBusy,
} from '@mui/icons-material';
import reportService from '../../services/reportService';
import { hotelService } from '../../services';
import { useNotification } from '../../hooks/useNotification';

const OccupancyReport = () => {
  const { showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState([]);
  const [filters, setFilters] = useState({
    hotel: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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

    const result = await reportService.getOccupancy(params);
    if (result.success) {
      setData(result.data);
    } else {
      showError('Failed to load occupancy report');
    }
    setLoading(false);
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
        <Assessment color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" component="h1">
          Occupancy Report
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
                title="Occupancy Rate"
                value={`${data.occupancy_rate?.toFixed(1) || 0}%`}
                subtitle="Current period"
                icon={<Assessment sx={{ fontSize: 48 }} />}
                color="primary.main"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Rooms"
                value={data.total_rooms || 0}
                subtitle="Across all hotels"
                icon={<MeetingRoom sx={{ fontSize: 48 }} />}
                color="info.main"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Occupied Rooms"
                value={data.occupied_rooms || 0}
                subtitle="Currently booked"
                icon={<CheckCircle sx={{ fontSize: 48 }} />}
                color="success.main"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Available Rooms"
                value={data.available_rooms || 0}
                subtitle="Ready to book"
                icon={<Hotel sx={{ fontSize: 48 }} />}
                color="warning.main"
              />
            </Grid>
          </Grid>

          {/* Occupancy by Room Type */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Occupancy by Room Type
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {data.by_room_type && data.by_room_type.length > 0 ? (
              <Grid container spacing={2}>
                {data.by_room_type.map((type, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                          {type.room_type}
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {type.occupancy_rate?.toFixed(1) || 0}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={type.occupancy_rate || 0}
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {type.occupied || 0} / {type.total || 0} rooms
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography color="text.secondary">No room type data available</Typography>
            )}
          </Paper>

          {/* Hotels Breakdown */}
          {data.by_hotel && data.by_hotel.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Occupancy by Hotel
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Hotel</TableCell>
                      <TableCell align="center">Total Rooms</TableCell>
                      <TableCell align="center">Occupied</TableCell>
                      <TableCell align="center">Available</TableCell>
                      <TableCell align="center">Occupancy Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.by_hotel.map((hotel, index) => (
                      <TableRow key={index}>
                        <TableCell>{hotel.name}</TableCell>
                        <TableCell align="center">{hotel.total_rooms}</TableCell>
                        <TableCell align="center">{hotel.occupied}</TableCell>
                        <TableCell align="center">{hotel.available}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={hotel.occupancy_rate || 0}
                              sx={{ width: 100, height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="body2">
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
          )}
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Assessment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No data available
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default OccupancyReport;
