import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Chip,
  Switch,
  Alert,
  IconButton,
  Tooltip,
  Button,
  Select,
  MenuItem,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { 
  Edit as EditIcon, 
  Refresh as RefreshIcon,
  Add as AddIcon
} from '@mui/icons-material';
import authService from '../../services/authService';
import UserFormModal from '../../components/admin/UserFormModal';

const ROLES = ['admin', 'manager', 'staff', 'guest'];

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const result = await authService.getUsers();
    if (result.success) {
      setUsers(result.data);
      setError('');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setUserToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setUserToEdit(user);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setUserToEdit(null);
  };

  const handleSaveUser = async (userId, payload) => {
    let result;
    if (!userId) { // Create new user
      result = await authService.createUser(payload);
      if (result.success) {
        setSuccess(`User ${result.data.username} created successfully.`);
        fetchUsers(); // Refresh list to show new user
      }
    } else { // Update existing user
      result = await authService.updateUser(userId, payload);
      if (result.success) {
        setSuccess(`User ${result.data.username} updated successfully.`);
        fetchUsers(); // Refresh list to show updated role/data
      }
    }
    setTimeout(() => setSuccess(''), 3000);
    return result;
  };
  // ----------------------

  // Handle Account Activation/Deactivation
  const handleStatusChange = async (userId, currentStatus) => {
    const isCurrentUser = users.find(u => u.id === userId)?.id === authService.getCurrentUser()?.id;
    if (isCurrentUser) {
      setError('You cannot deactivate your own account.');
      return;
    }
    
    // Optimistic update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));

    const result = await authService.updateUser(userId, { is_active: !currentStatus });
    
    if (result.success) {
      setSuccess('User status updated successfully');
    } else {
      // Revert on failure
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: currentStatus } : u));
      setError(result.error || 'Failed to update status');
    }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  // Handle Role Change
  const handleRoleChange = async (userId, newRole) => {
    const isCurrentUser = users.find(u => u.id === userId)?.id === authService.getCurrentUser()?.id;
    if (isCurrentUser) {
      setError('You cannot change your own role.');
      return;
    }

    // Optimistic update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));

    const result = await authService.updateUser(userId, { role: newRole });
    
    if (result.success) {
      setSuccess(`User role changed to ${newRole}.`);
    } else {
      // Revert on failure
      const oldRole = users.find(u => u.id === userId)?.role;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: oldRole } : u));
      setError(result.error || 'Failed to update role');
    }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };


  // Define DataGrid Columns
  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'username', headerName: 'Username', width: 130 },
    { field: 'email', headerName: 'Email', width: 200 },
    { 
      field: 'role', 
      headerName: 'Role', 
      width: 150,
      renderCell: (params) => (
        <Select
          value={params.value}
          onChange={(e) => handleRoleChange(params.row.id, e.target.value)}
          variant="standard"
          disableUnderline
          size="small"
        >
          {ROLES.map((role) => (
            <MenuItem key={role} value={role}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </MenuItem>
          ))}
        </Select>
      ),
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Tooltip title={params.value ? 'Deactivate Account' : 'Activate Account'}>
          <Switch
            checked={params.value}
            onChange={() => handleStatusChange(params.row.id, params.value)}
            color="primary"
            size="small"
            disabled={params.row.id === authService.getCurrentUser()?.id}
          />
        </Tooltip>
      ),
    },
    { 
      field: 'created_at', 
      headerName: 'Joined', 
      width: 180,
      valueFormatter: (params) => {
        if (!params.value) return 'N/A';
        try {
          const date = new Date(params.value);
          return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
        } catch (e) {
          return 'Invalid Date';
        }
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      width: 100,
      renderCell: (params) => (
        <Tooltip title="Edit User Details / Reset Password">
          <IconButton size="small" onClick={() => handleOpenEdit(params.row)}>
            <EditIcon fontSize="small" color="primary" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
        <Box>
            <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
                sx={{ mr: 1 }}
            >
                Add User
            </Button>
            <IconButton onClick={fetchUsers} disabled={loading}>
                <RefreshIcon />
            </IconButton>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper elevation={3} sx={{ height: 600, width: '100%', p: 2 }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 20]}
          checkboxSelection
          disableSelectionOnClick
          components={{ Toolbar: GridToolbar }}
          sx={{ border: 0 }}
        />
      </Paper>
      
      <UserFormModal
        open={modalOpen}
        handleClose={handleCloseModal}
        userToEdit={userToEdit}
        handleSave={handleSaveUser}
      />

    </Container>
  );
};

export default UserManagement;