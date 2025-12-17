import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  CurrencyPound,
  Add,
  Edit,
  Delete,
  Refresh,
  LocalOffer,
  DateRange,
  Visibility,
} from '@mui/icons-material';
import DataTable from '../../components/common/DataTable';
import { pricingService, hotelService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import LoadingSpinner from '../../components/loading/LoadingSpinner';

const PricingDashboard = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [activeTab, setActiveTab] = useState('room_type');
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchHotels = async () => {
      const result = await hotelService.getAll({ is_active: true });
      if (result.success) {
        const hotelList = result.data.results || result.data;
        setHotels(hotelList);
        if (hotelList.length > 0) {
          setSelectedHotel(hotelList[0].id);
        }
      }
    };
    fetchHotels();
  }, []);

  const fetchPricingData = async () => {
    if (!selectedHotel) return;
    setLoading(true);

    let result;
    switch (activeTab) {
      case 'room_type':
        result = await pricingService.getRoomTypePricing({ hotel: selectedHotel });
        break;
      case 'view':
        result = await pricingService.getViewPricing({ hotel: selectedHotel });
        break;
      case 'seasonal':
        result = await pricingService.getSeasonalPricing({ hotel: selectedHotel });
        break;
      case 'day_type':
        result = await pricingService.getDayTypePricing({ hotel: selectedHotel });
        break;
      case 'promotions':
        result = await pricingService.getPromotionalDiscounts({ hotel: selectedHotel });
        break;
      default:
        result = { success: false };
    }

    if (result.success) {
      setData(result.data.results || result.data);
    } else {
      showError('Failed to fetch pricing data');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPricingData();
  }, [selectedHotel, activeTab]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pricing rule?')) return;

    let result;
    switch (activeTab) {
      case 'room_type':
        result = await pricingService.deleteRoomTypePricing(id);
        break;
      case 'view':
        result = await pricingService.deleteViewPricing(id);
        break;
      case 'seasonal':
        result = await pricingService.deleteSeasonalPricing(id);
        break;
      case 'day_type':
        result = await pricingService.deleteDayTypePricing(id);
        break;
      case 'promotions':
        result = await pricingService.deletePromotionalDiscount(id);
        break;
      default:
        result = { success: false };
    }

    if (result.success) {
      showSuccess('Pricing rule deleted successfully');
      fetchPricingData();
    } else {
      showError('Failed to delete pricing rule');
    }
  };

  const getColumns = () => {
    switch (activeTab) {
      case 'room_type':
        return [
          { id: 'room_type_display', label: 'Room Type', sortable: true },
          { id: 'base_price', label: 'Base Price', render: (row) => `£${parseFloat(row.base_price).toFixed(2)}` },
          { id: 'currency', label: 'Currency' },
          { id: 'is_active', label: 'Status', render: (row) => <Chip label={row.is_active ? 'Active' : 'Inactive'} color={row.is_active ? 'success' : 'default'} size="small" /> },
          { id: 'actions', label: 'Actions', sortable: false, render: (row) => (
            <IconButton size="small" onClick={() => handleDelete(row.id)} color="error"><Delete /></IconButton>
          )},
        ];
      case 'view':
        return [
          { id: 'view_name', label: 'View Type', sortable: true },
          { id: 'modifier_type_display', label: 'Modifier Type' },
          { id: 'modifier_value', label: 'Value', render: (row) => row.modifier_type === 'percentage' ? `${row.modifier_value}%` : `£${row.modifier_value}` },
          { id: 'is_active', label: 'Status', render: (row) => <Chip label={row.is_active ? 'Active' : 'Inactive'} color={row.is_active ? 'success' : 'default'} size="small" /> },
          { id: 'actions', label: 'Actions', sortable: false, render: (row) => (
            <IconButton size="small" onClick={() => handleDelete(row.id)} color="error"><Delete /></IconButton>
          )},
        ];
      case 'seasonal':
        return [
          { id: 'season_name', label: 'Season', sortable: true },
          { id: 'start_date', label: 'Start Date', sortable: true },
          { id: 'end_date', label: 'End Date', sortable: true },
          { id: 'modifier_type_display', label: 'Modifier Type' },
          { id: 'modifier_value', label: 'Value', render: (row) => row.modifier_type === 'percentage' ? `${row.modifier_value}%` : `£${row.modifier_value}` },
          { id: 'is_active', label: 'Status', render: (row) => <Chip label={row.is_active ? 'Active' : 'Inactive'} color={row.is_active ? 'success' : 'default'} size="small" /> },
          { id: 'actions', label: 'Actions', sortable: false, render: (row) => (
            <IconButton size="small" onClick={() => handleDelete(row.id)} color="error"><Delete /></IconButton>
          )},
        ];
      case 'day_type':
        return [
          { id: 'day_type_name', label: 'Day Type', sortable: true },
          { id: 'applicable_days', label: 'Days', render: (row) => Array.isArray(row.applicable_days) ? row.applicable_days.join(', ') : row.applicable_days },
          { id: 'modifier_type_display', label: 'Modifier Type' },
          { id: 'modifier_value', label: 'Value', render: (row) => row.modifier_type === 'percentage' ? `${row.modifier_value}%` : `£${row.modifier_value}` },
          { id: 'is_active', label: 'Status', render: (row) => <Chip label={row.is_active ? 'Active' : 'Inactive'} color={row.is_active ? 'success' : 'default'} size="small" /> },
          { id: 'actions', label: 'Actions', sortable: false, render: (row) => (
            <IconButton size="small" onClick={() => handleDelete(row.id)} color="error"><Delete /></IconButton>
          )},
        ];
      case 'promotions':
        return [
          { id: 'promotion_name', label: 'Promotion', sortable: true },
          { id: 'promo_code', label: 'Code' },
          { id: 'discount_type_display', label: 'Type' },
          { id: 'discount_value', label: 'Discount', render: (row) => row.discount_type === 'percentage' ? `${row.discount_value}%` : `£${row.discount_value}` },
          { id: 'start_date', label: 'Start', sortable: true },
          { id: 'end_date', label: 'End', sortable: true },
          { id: 'is_active', label: 'Status', render: (row) => <Chip label={row.is_active ? 'Active' : 'Inactive'} color={row.is_active ? 'success' : 'default'} size="small" /> },
          { id: 'actions', label: 'Actions', sortable: false, render: (row) => (
            <IconButton size="small" onClick={() => handleDelete(row.id)} color="error"><Delete /></IconButton>
          )},
        ];
      default:
        return [];
    }
  };

  const tabs = [
    { value: 'room_type', label: 'Room Type Pricing', icon: <CurrencyPound /> },
    { value: 'view', label: 'View Pricing', icon: <Visibility /> },
    { value: 'seasonal', label: 'Seasonal Pricing', icon: <DateRange /> },
    { value: 'day_type', label: 'Day Type Pricing', icon: <DateRange /> },
    { value: 'promotions', label: 'Promotions', icon: <LocalOffer /> },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CurrencyPound color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" component="h1">Pricing Management</Typography>
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
          <IconButton onClick={fetchPricingData} title="Refresh">
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            variant={activeTab === tab.value ? 'contained' : 'outlined'}
            startIcon={tab.icon}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </Box>

      <Paper sx={{ p: 2 }}>
        {loading ? (
          <LoadingSpinner message="Loading pricing data..." />
        ) : (
          <DataTable
            columns={getColumns()}
            data={data}
            emptyMessage={`No ${activeTab.replace('_', ' ')} pricing rules found`}
          />
        )}
      </Paper>
    </Container>
  );
};

export default PricingDashboard;
