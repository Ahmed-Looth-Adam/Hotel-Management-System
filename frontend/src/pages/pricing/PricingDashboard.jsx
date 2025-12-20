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
  Avatar,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
} from '@mui/icons-material';
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
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const handleDeleteClick = (id) => {
    setDeleteDialog({ open: true, id });
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    const id = deleteDialog.id;

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
      setDeleteDialog({ open: false, id: null });
      fetchPricingData();
    } else {
      showError('Failed to delete pricing rule');
    }
    setDeleteLoading(false);
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
            <IconButton size="small" onClick={() => handleDeleteClick(row.id)} color="error"><Delete /></IconButton>
          )},
        ];
      case 'view':
        return [
          { id: 'view_name', label: 'View Type', sortable: true },
          { id: 'modifier_type_display', label: 'Modifier Type' },
          { id: 'modifier_value', label: 'Value', render: (row) => row.modifier_type === 'percentage' ? `${row.modifier_value}%` : `£${row.modifier_value}` },
          { id: 'is_active', label: 'Status', render: (row) => <Chip label={row.is_active ? 'Active' : 'Inactive'} color={row.is_active ? 'success' : 'default'} size="small" /> },
          { id: 'actions', label: 'Actions', sortable: false, render: (row) => (
            <IconButton size="small" onClick={() => handleDeleteClick(row.id)} color="error"><Delete /></IconButton>
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
            <IconButton size="small" onClick={() => handleDeleteClick(row.id)} color="error"><Delete /></IconButton>
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
            <IconButton size="small" onClick={() => handleDeleteClick(row.id)} color="error"><Delete /></IconButton>
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
            <IconButton size="small" onClick={() => handleDeleteClick(row.id)} color="error"><Delete /></IconButton>
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
          },
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(180deg, #7f1d1d 0%, #450a0a 100%)',
            color: '#ffffff',
            px: 3,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                width: 36,
                height: 36,
              }}
            >
              <Delete fontSize="small" />
            </Avatar>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#ffffff' }}>
              Delete Pricing Rule
            </Typography>
          </Box>
          <IconButton onClick={() => setDeleteDialog({ open: false, id: null })} sx={{ color: '#ffffff' }} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Are you sure you want to <strong>delete</strong> this pricing rule? This action cannot be undone.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 1.5,
            bgcolor: 'grey.50',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Button
            onClick={() => setDeleteDialog({ open: false, id: null })}
            disabled={deleteLoading}
            color="inherit"
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={deleteLoading}
            sx={{
              borderRadius: 2,
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#dc2626',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
              '&:hover': {
                bgcolor: '#b91c1c',
              },
              '&.Mui-disabled': {
                bgcolor: 'grey.300',
                color: 'grey.500',
              },
            }}
          >
            {deleteLoading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PricingDashboard;
