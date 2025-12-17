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
  Card,
  CardContent,
  Grid,
  Avatar,
  TextField,
  InputAdornment,
  Fade,
  Divider,
  CircularProgress,
  alpha,
  useTheme,
  Dialog,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Person as StaffIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import authService from '../../services/authService';
import UserFormModal from '../../components/admin/UserFormModal';

const StatsCard = ({ title, value, icon: Icon, color, subtitle }) => {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        minHeight: 140,
        background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
        border: `1px solid ${alpha(color, 0.2)}`,
        borderRadius: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 25px ${alpha(color, 0.25)}`,
        },
      }}
    >
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom noWrap>
              {title}
            </Typography>
            <Typography variant="h3" fontWeight={700} sx={{ color }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {subtitle || '\u00A0'}
            </Typography>
          </Box>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.7)} 100%)`,
              boxShadow: `0 4px 14px ${alpha(color, 0.4)}`,
            }}
          >
            <Icon sx={{ fontSize: 28, color: '#fff' }} />
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

const ManagerStaffManagement = () => {
  const theme = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    // Only fetch staff users
    const result = await authService.getUsers('staff');
    if (result.success) {
      const data = Array.isArray(result.data) ? result.data : (result.data?.results || []);
      setUsers(data);
    } else {
      setError('Failed to fetch staff members');
    }
    setLoading(false);
  };

  const handleOpenModal = (user = null) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleSaveUser = async (userId, formData) => {
    const isNew = !selectedUser;

    // Force role to be staff for managers
    formData.set('role', 'staff');

    const result = isNew
      ? await authService.createUser(formData)
      : await authService.updateUser(userId, formData);

    if (result.success) {
      setSuccess(isNew ? `Staff member ${result.data.username} created successfully.` : `Staff member ${result.data.username} updated successfully.`);
      fetchStaff();
      handleCloseModal();
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  };

  const handleToggleActive = async (user) => {
    const result = await authService.updateUser(user.id, { is_active: !user.is_active });
    if (result.success) {
      setSuccess(`Staff member ${user.is_active ? 'deactivated' : 'activated'} successfully.`);
      fetchStaff();
    } else {
      setError('Failed to update staff member status');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog.user) return;
    const result = await authService.deleteUser(deleteDialog.user.id);
    if (result.success) {
      setSuccess(`Staff member "${deleteDialog.user.username}" deleted successfully.`);
      fetchStaff();
    } else {
      setError('Failed to delete staff member');
    }
    setDeleteDialog({ open: false, user: null });
  };

  const getFullName = (user) => {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
  };

  const getInitials = (user) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.username?.[0]?.toUpperCase() || 'S';
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #388e3c 0%, #66bb6a 100%)',
            px: 4,
            py: 3,
            color: '#fff',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: 'rgba(255,255,255,0.2)',
                }}
              >
                <PeopleIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  Staff Management
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  Manage front desk staff for your hotel
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => handleOpenModal()}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: '#fff',
                px: 3,
                py: 1.25,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.3)',
                },
              }}
            >
              Add Staff
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatsCard
            title="Total Staff"
            value={stats.total}
            icon={PeopleIcon}
            color="#388e3c"
            subtitle="Front desk staff members"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatsCard
            title="Active Staff"
            value={stats.active}
            icon={ActiveIcon}
            color="#2e7d32"
            subtitle={`${Math.round((stats.active / stats.total) * 100) || 0}% of total`}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatsCard
            title="Inactive Staff"
            value={stats.inactive}
            icon={InactiveIcon}
            color="#9e9e9e"
            subtitle="Deactivated accounts"
          />
        </Grid>
      </Grid>

      {/* Search Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <TextField
          fullWidth
          placeholder="Search staff by name, username, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            sx: { borderRadius: 2 },
          }}
          size="small"
        />
      </Paper>

      {/* Staff List */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : filteredUsers.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <PeopleIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {searchQuery ? 'No staff members found matching your search' : 'No staff members yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Click "Add Staff" to create a new staff member
            </Typography>
          </Box>
        ) : (
          <Box>
            {filteredUsers.map((user, index) => (
              <Fade in key={user.id} timeout={300} style={{ transitionDelay: `${index * 50}ms` }}>
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 2.5,
                      gap: 2,
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: alpha('#388e3c', 0.04),
                      },
                    }}
                  >
                    {/* Avatar */}
                    <Avatar
                      src={user.profile_picture ? `http://localhost:8000${user.profile_picture}` : undefined}
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: '#388e3c',
                        fontWeight: 600,
                      }}
                    >
                      {getInitials(user)}
                    </Avatar>

                    {/* User Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight={600} noWrap>
                          {getFullName(user) || user.username}
                        </Typography>
                        <Chip
                          label="Staff"
                          size="small"
                          sx={{
                            bgcolor: '#e8f5e9',
                            color: '#388e3c',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            height: 22,
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmailIcon sx={{ fontSize: 14 }} />
                          {user.email}
                        </Typography>
                        {user.phone_number && (
                          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: 14 }} />
                            {user.phone_number}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Tooltip title={user.is_active ? 'Active' : 'Inactive'}>
                        <Switch
                          checked={user.is_active}
                          onChange={() => handleToggleActive(user)}
                          color="success"
                          size="small"
                        />
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleOpenModal(user)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteDialog({ open: true, user })}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  {index < filteredUsers.length - 1 && <Divider />}
                </Box>
              </Fade>
            ))}
          </Box>
        )}
      </Paper>

      {/* User Form Modal - Force staff role */}
      <UserFormModal
        open={isModalOpen}
        handleClose={handleCloseModal}
        handleSave={handleSaveUser}
        userToEdit={selectedUser}
        forceRole="staff"
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, user: null })}
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
          },
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(180deg, #d32f2f 0%, #b71c1c 100%)',
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
                background: 'rgba(255,255,255,0.2)',
                width: 36,
                height: 36,
              }}
            >
              <WarningIcon fontSize="small" />
            </Avatar>
            <Typography variant="subtitle1" fontWeight={600}>
              Delete Staff Member
            </Typography>
          </Box>
          <IconButton
            onClick={() => setDeleteDialog({ open: false, user: null })}
            sx={{ color: '#ffffff' }}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Typography>
            Are you sure you want to permanently delete{' '}
            <strong>{deleteDialog.user?.username}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
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
            onClick={() => setDeleteDialog({ open: false, user: null })}
            color="inherit"
            sx={{ borderRadius: 2, px: 3, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteUser}
            sx={{ borderRadius: 2, px: 3, textTransform: 'none', fontWeight: 600 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManagerStaffManagement;
