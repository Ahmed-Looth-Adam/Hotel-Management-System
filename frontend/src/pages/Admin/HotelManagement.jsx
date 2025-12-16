import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Switch,
  Alert,
  IconButton,
  Tooltip,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Hotel as HotelIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import hotelService from '../../services/hotelService';
import HotelFormModal from '../../components/admin/HotelFormModal';

const HotelManagement = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [hotelToEdit, setHotelToEdit] = useState(null);

  // Delete Confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hotelToDelete, setHotelToDelete] = useState(null);

  useEffect(() => {
    fetchHotels();
  }, [statusFilter]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchHotels();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchHotels = async () => {
    setLoading(true);
    const params = {};
    if (statusFilter !== '') {
      params.is_active = statusFilter;
    }

    const result = await hotelService.getAll(params);
    if (result.success) {
      let data = result.data.results || result.data;
      // Ensure data is an array
      if (!Array.isArray(data)) {
        data = [];
      }
      // Client-side search filter
      if (searchQuery) {
        data = data.filter((hotel) =>
          hotel.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      setHotels(data);
      setError('');
    } else {
      setError(typeof result.error === 'string' ? result.error : 'Failed to fetch hotels');
    }
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setHotelToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (hotel) => {
    setHotelToEdit(hotel);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setHotelToEdit(null);
  };

  const handleSaveHotel = async (hotelId, payload) => {
    let result;
    if (!hotelId) {
      result = await hotelService.create(payload);
      if (result.success) {
        setSuccess(`Hotel "${result.data.name}" created successfully.`);
        fetchHotels();
      }
    } else {
      result = await hotelService.update(hotelId, payload);
      if (result.success) {
        setSuccess(`Hotel "${result.data.name}" updated successfully.`);
        fetchHotels();
      }
    }
    setTimeout(() => setSuccess(''), 3000);
    return result;
  };

  const handleStatusToggle = async (hotelId, currentStatus) => {
    // Optimistic update
    setHotels((prev) =>
      prev.map((h) => (h.id === hotelId ? { ...h, is_active: !currentStatus } : h))
    );

    const result = await hotelService.patch(hotelId, { is_active: !currentStatus });

    if (result.success) {
      setSuccess(`Hotel ${!currentStatus ? 'activated' : 'deactivated'} successfully.`);
    } else {
      // Revert on failure
      setHotels((prev) =>
        prev.map((h) => (h.id === hotelId ? { ...h, is_active: currentStatus } : h))
      );
      setError(typeof result.error === 'string' ? result.error : 'Failed to update status');
    }
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 3000);
  };

  const handleOpenDeleteDialog = (hotel) => {
    setHotelToDelete(hotel);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setHotelToDelete(null);
  };

  const handleDeleteHotel = async () => {
    if (!hotelToDelete) return;

    const result = await hotelService.delete(hotelToDelete.id);
    if (result.success) {
      setSuccess(`Hotel "${hotelToDelete.name}" deleted successfully.`);
      fetchHotels();
    } else {
      setError(typeof result.error === 'string' ? result.error : 'Failed to delete hotel');
    }
    handleCloseDeleteDialog();
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 3000);
  };

  // DataGrid Columns
  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Hotel Name', width: 200, flex: 1 },
    {
      field: 'description',
      headerName: 'Description',
      width: 200,
      renderCell: (params) => (
        <Tooltip title={params.value || ''}>
          <span>
            {params.value
              ? params.value.substring(0, 50) + (params.value.length > 50 ? '...' : '')
              : '-'}
          </span>
        </Tooltip>
      ),
    },
    {
      field: 'star_rating',
      headerName: 'Rating',
      width: 140,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              sx={{
                fontSize: 18,
                color: i < params.value ? 'gold' : 'grey.300',
              }}
            />
          ))}
        </Box>
      ),
    },
    {
      field: 'room_capacity',
      headerName: 'Capacity',
      width: 100,
      renderCell: (params) => `${params.value} rooms`,
    },
    {
      field: 'manager',
      headerName: 'Manager',
      width: 180,
      renderCell: (params) => {
        const manager = params.row.manager;
        if (!manager) {
          return <em style={{ color: 'grey' }}>Not assigned</em>;
        }
        return (
          <Box>
            <Typography variant="body2">{manager.username}</Typography>
            <Typography variant="caption" color="text.secondary">
              {manager.email}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Tooltip title={params.value ? 'Deactivate' : 'Activate'}>
          <Switch
            checked={params.value}
            onChange={() => handleStatusToggle(params.row.id, params.value)}
            color="primary"
            size="small"
          />
        </Tooltip>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      width: 100,
      renderCell: (params) => (
        <>
          <Tooltip title="Edit Hotel">
            <IconButton size="small" onClick={() => handleOpenEdit(params.row)}>
              <EditIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Hotel">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleOpenDeleteDialog(params.row)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HotelIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            Hotel Management
          </Typography>
        </Box>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{ mr: 1 }}
          >
            Add Hotel
          </Button>
          <IconButton onClick={fetchHotels} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search by hotel name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 250 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* DataGrid */}
      <Paper elevation={3} sx={{ height: 600, width: '100%', p: 2 }}>
        <DataGrid
          rows={hotels}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 20]}
          disableSelectionOnClick
          components={{ Toolbar: GridToolbar }}
          sx={{ border: 0 }}
        />
      </Paper>

      {/* Form Modal */}
      <HotelFormModal
        open={modalOpen}
        handleClose={handleCloseModal}
        hotelToEdit={hotelToEdit}
        handleSave={handleSaveHotel}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Hotel</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{hotelToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteHotel} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HotelManagement;
