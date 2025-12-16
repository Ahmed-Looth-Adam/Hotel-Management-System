/**
 * Staff Management Page - Manage hotel staff members
 *
 * Features:
 * - List staff by hotel
 * - Add/Edit/Remove staff
 * - Role management
 * - Staff details
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
  Button,
  TextField,
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
  CircularProgress,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
} from '@mui/material';
import {
  People,
  Add,
  Edit,
  Delete,
  Search,
  Email,
  Phone,
  Badge,
} from '@mui/icons-material';
import { authService, hotelService } from '../../services';
import { useNotification } from '../../hooks/useNotification';

const roleColors = {
  admin: 'error',
  manager: 'warning',
  staff: 'primary',
  guest: 'default',
};

const StaffManagement = () => {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [filters, setFilters] = useState({
    hotel: '',
    role: '',
    search: '',
  });
  const [dialog, setDialog] = useState({ open: false, mode: 'create', staff: null });
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'staff',
    phone_number: '',
    password: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [filters]);

  const fetchData = async () => {
    const hotelsResult = await hotelService.getAll();
    if (hotelsResult.success) {
      setHotels(hotelsResult.data.results || hotelsResult.data);
    }
    await fetchStaff();
  };

  const fetchStaff = async () => {
    setLoading(true);
    // Get staff and managers
    const result = await authService.getUsers('staff,manager');
    if (result.success) {
      let staffData = result.data.results || result.data;

      // Apply search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        staffData = staffData.filter(s =>
          s.username?.toLowerCase().includes(search) ||
          s.email?.toLowerCase().includes(search) ||
          s.first_name?.toLowerCase().includes(search) ||
          s.last_name?.toLowerCase().includes(search)
        );
      }

      // Apply role filter
      if (filters.role) {
        staffData = staffData.filter(s => s.role === filters.role);
      }

      setStaff(staffData);
    } else {
      showError('Failed to load staff');
    }
    setLoading(false);
  };

  const handleOpenDialog = (mode, staffMember = null) => {
    if (mode === 'edit' && staffMember) {
      setFormData({
        username: staffMember.username,
        email: staffMember.email,
        first_name: staffMember.first_name || '',
        last_name: staffMember.last_name || '',
        role: staffMember.role,
        phone_number: staffMember.phone_number || '',
        password: '',
      });
    } else {
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role: 'staff',
        phone_number: '',
        password: '',
      });
    }
    setDialog({ open: true, mode, staff: staffMember });
  };

  const handleCloseDialog = () => {
    setDialog({ open: false, mode: 'create', staff: null });
  };

  const handleSave = async () => {
    setSaving(true);
    let result;

    if (dialog.mode === 'create') {
      result = await authService.createUser(formData);
    } else {
      const updateData = { ...formData };
      if (!updateData.password) delete updateData.password;
      result = await authService.updateUser(dialog.staff.id, updateData);
    }

    if (result.success) {
      showSuccess(`Staff member ${dialog.mode === 'create' ? 'created' : 'updated'} successfully`);
      handleCloseDialog();
      fetchStaff();
    } else {
      showError(result.error?.message || `Failed to ${dialog.mode} staff member`);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;

    const result = await authService.deleteUser(id);
    if (result.success) {
      showSuccess('Staff member deleted successfully');
      fetchStaff();
    } else {
      showError(result.error?.message || 'Failed to delete staff member');
    }
  };

  const getInitials = (user) => {
    const first = user.first_name?.[0] || user.username?.[0] || '';
    const last = user.last_name?.[0] || '';
    return (first + last).toUpperCase();
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <People color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            Staff Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog('create')}
        >
          Add Staff
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select
                value={filters.role}
                label="Role"
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Staff Table */}
      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : staff.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <People sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No staff members found
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Staff Member</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getInitials(member)}
                        </Avatar>
                        <Box>
                          <Typography variant="body1">
                            {member.first_name} {member.last_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            @{member.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Email fontSize="small" color="action" />
                        {member.email}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {member.phone_number ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Phone fontSize="small" color="action" />
                          {member.phone_number}
                        </Box>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={member.role}
                        color={roleColors[member.role] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={member.is_active ? 'Active' : 'Inactive'}
                        color={member.is_active ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog('edit', member)}
                        title="Edit"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(member.id)}
                        title="Delete"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialog.open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialog.mode === 'create' ? 'Add Staff Member' : 'Edit Staff Member'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                disabled={dialog.mode === 'edit'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={dialog.mode === 'create' ? 'Password' : 'New Password (leave blank to keep current)'}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={dialog.mode === 'create'}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StaffManagement;
