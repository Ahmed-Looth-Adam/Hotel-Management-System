import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  Hotel,
} from '@mui/icons-material';
import DataTable from '../../components/common/DataTable';
import { hotelService } from '../../services';
import { useNotification } from '../../hooks/useNotification';

const HotelsList = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: '',
    is_active: '',
  });

  const fetchHotels = async () => {
    setLoading(true);
    const params = {};
    if (filters.city) params.city = filters.city;
    if (filters.is_active !== '') params.is_active = filters.is_active;

    const result = await hotelService.getAll(params);
    if (result.success) {
      setHotels(result.data.results || result.data);
    } else {
      showError('Failed to fetch hotels');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHotels();
  }, [filters]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this hotel?')) {
      const result = await hotelService.delete(id);
      if (result.success) {
        showSuccess('Hotel deleted successfully');
        fetchHotels();
      } else {
        showError('Failed to delete hotel');
      }
    }
  };

  const columns = [
    { id: 'name', label: 'Hotel Name', sortable: true },
    { id: 'city', label: 'City', sortable: true },
    { id: 'country', label: 'Country', sortable: true },
    {
      id: 'star_rating',
      label: 'Rating',
      render: (row) => (
        <Box>
          {'★'.repeat(row.star_rating || 0)}
          {'☆'.repeat(5 - (row.star_rating || 0))}
        </Box>
      ),
    },
    {
      id: 'room_count',
      label: 'Rooms',
      render: (row) => row.room_count || 0,
    },
    {
      id: 'is_active',
      label: 'Status',
      render: (row) => (
        <Chip
          label={row.is_active ? 'Active' : 'Inactive'}
          color={row.is_active ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => navigate(`/hotels/${row.id}`)}
            title="View"
          >
            <Visibility />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => navigate(`/hotels/${row.id}/edit`)}
            title="Edit"
          >
            <Edit />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(row.id)}
            title="Delete"
            color="error"
          >
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Hotel color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            Hotels
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/hotels/new')}
        >
          Add Hotel
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search by city..."
          value={filters.city}
          onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.is_active}
            label="Status"
            onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <DataTable
        columns={columns}
        data={hotels}
        emptyMessage={loading ? 'Loading hotels...' : 'No hotels found'}
      />
    </Container>
  );
};

export default HotelsList;
