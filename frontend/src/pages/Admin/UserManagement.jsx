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
  Card,
  CardContent,
  Grid,
  Avatar,
  TextField,
  InputAdornment,
  Fade,
  Divider,
  LinearProgress,
  alpha,
  useTheme,
  FormControl,
  InputLabel,
  Badge,
  Snackbar,
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
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as ManagerIcon,
  Person as StaffIcon,
  PersonOutline as GuestIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  FilterList as FilterIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
} from '@mui/icons-material';
import authService from '../../services/authService';
import UserFormModal from '../../components/admin/UserFormModal';
import { useNotificationContext } from '../../context/NotificationContext';

const STAFF_ROLES = ['admin', 'manager', 'staff'];
const ROLES = ['admin', 'manager', 'staff', 'guest'];

const roleConfig = {
  admin: { color: '#d32f2f', bgColor: '#ffebee', icon: AdminIcon, label: 'Admin' },
  manager: { color: '#1976d2', bgColor: '#e3f2fd', icon: ManagerIcon, label: 'Manager' },
  staff: { color: '#388e3c', bgColor: '#e8f5e9', icon: StaffIcon, label: 'Staff' },
  guest: { color: '#7b1fa2', bgColor: '#f3e5f5', icon: GuestIcon, label: 'Guest' },
};

const StatsCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const theme = useTheme();
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
              bgcolor: alpha(color, 0.15),
              color: color,
              width: 56,
              height: 56,
              flexShrink: 0,
            }}
          >
            <Icon sx={{ fontSize: 28 }} />
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

const RoleBadge = ({ role }) => {
  const config = roleConfig[role] || roleConfig.guest;
  const Icon = config.icon;
  return (
    <Chip
      icon={<Icon sx={{ fontSize: 16 }} />}
      label={config.label}
      size="small"
      sx={{
        bgcolor: config.bgColor,
        color: config.color,
        fontWeight: 600,
        fontSize: '0.75rem',
        '& .MuiChip-icon': { color: config.color },
      }}
    />
  );
};

const UserManagement = () => {
  const theme = useTheme();
  const { addNotification } = useNotificationContext();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination State - separate for staff and guests
  const [staffPage, setStaffPage] = useState(1);
  const [guestPage, setGuestPage] = useState(1);
  const rowsPerPage = 10;

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
    setStaffPage(1);
    setGuestPage(1);
  }, [users, searchTerm, roleFilter, statusFilter]);

  const filterUsers = () => {
    let result = [...users];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (user) =>
          user.username?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term) ||
          user.first_name?.toLowerCase().includes(term) ||
          user.last_name?.toLowerCase().includes(term)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      result = result.filter((user) => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((user) =>
        statusFilter === 'active' ? user.is_active : !user.is_active
      );
    }

    setFilteredUsers(result);
  };

  const fetchUsers = async () => {
    setLoading(true);
    const result = await authService.getUsers();
    if (result.success) {
      console.log('Users data:', result.data);
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
    if (!userId) {
      result = await authService.createUser(payload);
      if (result.success) {
        setSuccess(`User ${result.data.username} created successfully.`);
        addNotification(
          `New user "${result.data.username}" has been created`,
          'user_created',
          '/admin/users'
        );
        fetchUsers();
      }
    } else {
      result = await authService.updateUser(userId, payload);
      if (result.success) {
        setSuccess(`User ${result.data.username} updated successfully.`);
        fetchUsers();
      }
    }
    setTimeout(() => setSuccess(''), 4000);
    return result;
  };

  const handleStatusChange = async (userId, currentStatus) => {
    const currentUser = authService.getCurrentUser();
    if (userId === currentUser?.id) {
      setError('You cannot deactivate your own account.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u))
    );

    const result = await authService.updateUser(userId, { is_active: !currentStatus });

    if (result.success) {
      setSuccess('User status updated successfully');
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: currentStatus } : u))
      );
      setError(result.error || 'Failed to update status');
    }
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 3000);
  };

  const handleRoleChange = async (userId, newRole) => {
    const currentUser = authService.getCurrentUser();
    if (userId === currentUser?.id) {
      setError('You cannot change your own role.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const oldRole = users.find((u) => u.id === userId)?.role;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));

    const result = await authService.updateUser(userId, { role: newRole });
    if (result.success) {
      setSuccess(`User role changed to ${newRole}.`);
    } else {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: oldRole } : u)));
      setError(result.error || 'Failed to update role');
    }
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 3000);
  };

  const handleOpenDeleteModal = (user) => {
    const currentUser = authService.getCurrentUser();
    if (user.id === currentUser?.id) {
      setError('You cannot delete your own account.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    const userId = userToDelete.id;
    const deletedUsername = userToDelete.username;
    handleCloseDeleteModal();

    // Optimistically remove from UI
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    const result = await authService.deleteUser(userId);

    if (result.success) {
      setSuccess(`User "${deletedUsername}" deleted permanently.`);
      addNotification(
        `User "${deletedUsername}" has been permanently deleted`,
        'user_deleted',
        '/admin/users'
      );
    } else {
      // Restore user if delete failed
      fetchUsers();
      setError(result.error || 'Failed to delete user');
    }
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 3000);
  };

  // Calculate stats
  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    staff: users.filter((u) => u.role === 'staff').length,
    managers: users.filter((u) => u.role === 'manager').length,
  };

  // Separate staff and guest users
  const staffUsers = filteredUsers.filter(u => STAFF_ROLES.includes(u.role));
  const guestUsers = filteredUsers.filter(u => u.role === 'guest');

  // Pagination calculations for staff
  const staffTotalPages = Math.ceil(staffUsers.length / rowsPerPage);
  const staffStartIndex = (staffPage - 1) * rowsPerPage;
  const paginatedStaff = staffUsers.slice(staffStartIndex, staffStartIndex + rowsPerPage);

  // Pagination calculations for guests
  const guestTotalPages = Math.ceil(guestUsers.length / rowsPerPage);
  const guestStartIndex = (guestPage - 1) * rowsPerPage;
  const paginatedGuests = guestUsers.slice(guestStartIndex, guestStartIndex + rowsPerPage);

  const handleStaffPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= staffTotalPages) {
      setStaffPage(newPage);
    }
  };

  const handleGuestPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= guestTotalPages) {
      setGuestPage(newPage);
    }
  };

  const getInitials = (user) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.username?.[0]?.toUpperCase() || '?';
  };

  const getFullName = (user) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.username;
  };

  const getProfilePictureUrl = (profilePicture) => {
    // Handle null, undefined, or empty string
    if (!profilePicture || profilePicture === '') return null;
    // If it's already a full URL, return as is
    if (profilePicture.startsWith('http')) return profilePicture;
    // Otherwise, prepend the backend URL
    const url = `http://localhost:8000${profilePicture}`;
    return url;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Container maxWidth="xl" disableGutters>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box>
              <Typography variant="h4" fontWeight={700} color="text.primary">
                User Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage staff, managers, and system users
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(25, 118, 210, 0.39)',
                }}
              >
                Add User
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Alerts */}
        <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess('')}>
          <Alert severity="success" variant="filled" onClose={() => setSuccess('')}>
            {success}
          </Alert>
        </Snackbar>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
            gap: 3,
            mb: 4,
          }}
        >
          <StatsCard
            title="Total Users"
            value={stats.total}
            icon={PeopleIcon}
            color="#1976d2"
            subtitle="All registered users"
          />
          <StatsCard
            title="Active Users"
            value={stats.active}
            icon={ActiveIcon}
            color="#2e7d32"
            subtitle={`${Math.round((stats.active / stats.total) * 100) || 0}% of total`}
          />
          <StatsCard
            title="Staff Members"
            value={stats.staff}
            icon={StaffIcon}
            color="#ed6c02"
            subtitle="Front desk staff"
          />
          <StatsCard
            title="Managers"
            value={stats.managers}
            icon={ManagerIcon}
            color="#9c27b0"
            subtitle="Hotel managers"
          />
        </Box>

        {/* Search and Filters */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8f9fa',
                    fontSize: '0.875rem',
                    '& input': {
                      py: 1,
                    },
                    '&:hover': {
                      bgcolor: '#f8f9fa',
                    },
                    '&.Mui-focused': {
                      bgcolor: '#fff',
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.875rem' }}>Role</InputLabel>
                <Select
                  value={roleFilter}
                  label="Role"
                  onChange={(e) => setRoleFilter(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    bgcolor: '#f8f9fa',
                    fontSize: '0.875rem',
                    '& .MuiSelect-select': {
                      py: 1,
                    },
                    '&:hover': {
                      bgcolor: '#f8f9fa',
                    },
                    '&.Mui-focused': {
                      bgcolor: '#fff',
                    },
                  }}
                >
                  <MenuItem value="all" sx={{ fontSize: '0.875rem' }}>All Roles</MenuItem>
                  {ROLES.map((role) => (
                    <MenuItem key={role} value={role} sx={{ fontSize: '0.875rem' }}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.875rem' }}>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    bgcolor: '#f8f9fa',
                    fontSize: '0.875rem',
                    '& .MuiSelect-select': {
                      py: 1,
                    },
                    '&:hover': {
                      bgcolor: '#f8f9fa',
                    },
                    '&.Mui-focused': {
                      bgcolor: '#fff',
                    },
                  }}
                >
                  <MenuItem value="all" sx={{ fontSize: '0.875rem' }}>All Status</MenuItem>
                  <MenuItem value="active" sx={{ fontSize: '0.875rem' }}>Active</MenuItem>
                  <MenuItem value="inactive" sx={{ fontSize: '0.875rem' }}>Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Staff Table */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            mb: 4,
          }}
        >
          {loading && <LinearProgress />}

          {/* Staff Table Header */}
          <Box
            sx={{
              px: 3,
              py: 2,
              bgcolor: '#f8f9fa',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" fontWeight={600} color="text.primary">
              Staff Users ({staffUsers.length})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Admins, Managers, and Front Desk Staff
            </Typography>
          </Box>

          {/* Table Column Headers */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px',
              gap: 2,
              p: 2,
              bgcolor: '#ffffff',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
              USER
            </Typography>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
              ROLE
            </Typography>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
              ASSIGNED HOTEL
            </Typography>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
              STATUS
            </Typography>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
              JOINED
            </Typography>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" align="center">
              ACTIONS
            </Typography>
          </Box>

          {/* Staff Table Body */}
          {paginatedStaff.length === 0 && !loading ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <StaffIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No staff users found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search or filters
              </Typography>
            </Box>
          ) : (
            paginatedStaff.map((user, index) => (
              <Fade in key={user.id} timeout={300 + index * 50}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px',
                    gap: 2,
                    p: 2,
                    alignItems: 'center',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                    '&:last-child': {
                      borderBottom: 'none',
                    },
                  }}
                >
                  {/* User Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: user.is_active ? 'success.main' : 'grey.400',
                            border: '2px solid white',
                          }}
                        />
                      }
                    >
                      <Avatar
                        src={getProfilePictureUrl(user.profile_picture)}
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: roleConfig[user.role]?.color || 'grey.400',
                          fontWeight: 600,
                        }}
                      >
                        {getInitials(user)}
                      </Avatar>
                    </Badge>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {getFullName(user)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EmailIcon sx={{ fontSize: 14 }} />
                        {user.email}
                      </Typography>
                      {user.phone_number && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon sx={{ fontSize: 12 }} />
                          {user.phone_number}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Role */}
                  <Box>
                    <Box sx={{ width: 130 }}>
                      <Select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        size="small"
                        fullWidth
                        sx={{
                          '& .MuiSelect-select': {
                            py: 0.75,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          },
                          borderRadius: 2,
                        }}
                        disabled={user.id === authService.getCurrentUser()?.id}
                        renderValue={(value) => (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {React.createElement(roleConfig[value].icon, { sx: { fontSize: 18, color: roleConfig[value].color } })}
                            <span>{roleConfig[value].label}</span>
                          </Box>
                        )}
                      >
                        {ROLES.map((role) => (
                          <MenuItem key={role} value={role}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {React.createElement(roleConfig[role].icon, { sx: { fontSize: 18, color: roleConfig[role].color } })}
                              {roleConfig[role].label}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </Box>
                  </Box>

                  {/* Assigned Hotel */}
                  <Box>
                    {['staff', 'manager'].includes(user.role) && user.assigned_hotel_name ? (
                      <Chip
                        size="small"
                        label={user.assigned_hotel_name}
                        sx={{
                          bgcolor: 'grey.100',
                          color: 'text.secondary',
                          fontWeight: 500,
                          fontSize: '0.7rem',
                          maxWidth: '100%',
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          },
                        }}
                      />
                    ) : ['staff', 'manager'].includes(user.role) ? (
                      <Typography variant="caption" color="text.secondary" fontStyle="italic">
                        Not assigned
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </Box>

                  {/* Status */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Switch
                      checked={user.is_active}
                      onChange={() => handleStatusChange(user.id, user.is_active)}
                      color="success"
                      size="small"
                      disabled={user.id === authService.getCurrentUser()?.id}
                    />
                    <Chip
                      size="small"
                      label={user.is_active ? 'Active' : 'Inactive'}
                      sx={{
                        bgcolor: user.is_active ? 'success.50' : 'grey.100',
                        color: user.is_active ? 'success.dark' : 'grey.600',
                        fontWeight: 500,
                        fontSize: '0.7rem',
                      }}
                    />
                  </Box>

                  {/* Joined Date */}
                  <Typography variant="body2" color="text.secondary">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'N/A'}
                  </Typography>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                    <Tooltip title="Edit User">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEdit(user)}
                        sx={{
                          bgcolor: 'primary.50',
                          color: 'primary.main',
                          '&:hover': { bgcolor: 'primary.100' },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete User">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDeleteModal(user)}
                        disabled={user.id === authService.getCurrentUser()?.id}
                        sx={{
                          bgcolor: 'error.50',
                          color: 'error.main',
                          '&:hover': { bgcolor: 'error.100' },
                          '&.Mui-disabled': { bgcolor: 'grey.100' },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Fade>
            ))
          )}

          {/* Staff Pagination */}
          {staffUsers.length > 0 && (
            <Box
              sx={{
                px: 2,
                py: 1.5,
                bgcolor: '#ffffff',
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton
                  size="small"
                  onClick={() => handleStaffPageChange(1)}
                  disabled={staffPage === 1}
                  sx={{ color: 'text.secondary' }}
                >
                  <FirstPageIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleStaffPageChange(staffPage - 1)}
                  disabled={staffPage === 1}
                  sx={{ color: 'text.secondary' }}
                >
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mx: 2 }}>
                  Page {staffPage} of {staffTotalPages || 1}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleStaffPageChange(staffPage + 1)}
                  disabled={staffPage >= staffTotalPages}
                  sx={{ color: 'text.secondary' }}
                >
                  <ChevronRightIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleStaffPageChange(staffTotalPages)}
                  disabled={staffPage >= staffTotalPages}
                  sx={{ color: 'text.secondary' }}
                >
                  <LastPageIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          )}
        </Paper>

        {/* Guests Table */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          {/* Guests Table Header */}
          <Box
            sx={{
              px: 3,
              py: 2,
              bgcolor: '#f8f9fa',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" fontWeight={600} color="text.primary">
              Guests ({guestUsers.length})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Registered hotel guests
            </Typography>
          </Box>

          {/* Guests Column Headers */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 120px',
              gap: 2,
              p: 2,
              bgcolor: '#ffffff',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
              GUEST
            </Typography>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
              ROLE
            </Typography>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
              STATUS
            </Typography>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
              JOINED
            </Typography>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" align="center">
              ACTIONS
            </Typography>
          </Box>

          {/* Guests Table Body */}
          {paginatedGuests.length === 0 && !loading ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <GuestIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No guests found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Guests will appear here when they register
              </Typography>
            </Box>
          ) : (
            paginatedGuests.map((user, index) => (
              <Fade in key={user.id} timeout={300 + index * 50}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 120px',
                    gap: 2,
                    p: 2,
                    alignItems: 'center',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                    '&:last-child': {
                      borderBottom: 'none',
                    },
                  }}
                >
                  {/* Guest Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: user.is_active ? 'success.main' : 'grey.400',
                            border: '2px solid white',
                          }}
                        />
                      }
                    >
                      <Avatar
                        src={getProfilePictureUrl(user.profile_picture)}
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: roleConfig[user.role]?.color || 'grey.400',
                          fontWeight: 600,
                        }}
                      >
                        {getInitials(user)}
                      </Avatar>
                    </Badge>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {getFullName(user)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EmailIcon sx={{ fontSize: 14 }} />
                        {user.email}
                      </Typography>
                      {user.phone_number && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon sx={{ fontSize: 12 }} />
                          {user.phone_number}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Role */}
                  <Box>
                    <RoleBadge role={user.role} />
                  </Box>

                  {/* Status */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Switch
                      checked={user.is_active}
                      onChange={() => handleStatusChange(user.id, user.is_active)}
                      color="success"
                      size="small"
                    />
                    <Chip
                      size="small"
                      label={user.is_active ? 'Active' : 'Inactive'}
                      sx={{
                        bgcolor: user.is_active ? 'success.50' : 'grey.100',
                        color: user.is_active ? 'success.dark' : 'grey.600',
                        fontWeight: 500,
                        fontSize: '0.7rem',
                      }}
                    />
                  </Box>

                  {/* Joined Date */}
                  <Typography variant="body2" color="text.secondary">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'N/A'}
                  </Typography>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                    <Tooltip title="Edit Guest">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEdit(user)}
                        sx={{
                          bgcolor: 'primary.50',
                          color: 'primary.main',
                          '&:hover': { bgcolor: 'primary.100' },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Guest">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDeleteModal(user)}
                        sx={{
                          bgcolor: 'error.50',
                          color: 'error.main',
                          '&:hover': { bgcolor: 'error.100' },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Fade>
            ))
          )}

          {/* Guests Pagination */}
          {guestUsers.length > 0 && (
            <Box
              sx={{
                px: 2,
                py: 1.5,
                bgcolor: '#ffffff',
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton
                  size="small"
                  onClick={() => handleGuestPageChange(1)}
                  disabled={guestPage === 1}
                  sx={{ color: 'text.secondary' }}
                >
                  <FirstPageIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleGuestPageChange(guestPage - 1)}
                  disabled={guestPage === 1}
                  sx={{ color: 'text.secondary' }}
                >
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mx: 2 }}>
                  Page {guestPage} of {guestTotalPages || 1}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleGuestPageChange(guestPage + 1)}
                  disabled={guestPage >= guestTotalPages}
                  sx={{ color: 'text.secondary' }}
                >
                  <ChevronRightIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleGuestPageChange(guestTotalPages)}
                  disabled={guestPage >= guestTotalPages}
                  sx={{ color: 'text.secondary' }}
                >
                  <LastPageIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          )}
        </Paper>

        <UserFormModal
          open={modalOpen}
          handleClose={handleCloseModal}
          userToEdit={userToEdit}
          handleSave={handleSaveUser}
        />

        {/* Delete Confirmation Modal */}
        <Dialog
          open={deleteModalOpen}
          onClose={handleCloseDeleteModal}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              overflow: 'hidden',
            },
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(180deg, #1a1f37 0%, #0f1225 100%)',
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
                  bgcolor: alpha('#f44336', 0.2),
                  width: 36,
                  height: 36,
                }}
              >
                <WarningIcon sx={{ color: '#f44336', fontSize: 20 }} />
              </Avatar>
              <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#ffffff' }}>
                Delete User
              </Typography>
            </Box>
            <IconButton onClick={handleCloseDeleteModal} sx={{ color: '#ffffff' }} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <DialogContent sx={{ px: 3, py: 3 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Are you sure you want to permanently delete this user?
            </Typography>
            {userToDelete && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Avatar
                  src={getProfilePictureUrl(userToDelete.profile_picture)}
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: roleConfig[userToDelete.role]?.color || 'grey.400',
                    fontWeight: 600,
                  }}
                >
                  {getInitials(userToDelete)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {getFullName(userToDelete)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {userToDelete.email}
                  </Typography>
                  <Chip
                    size="small"
                    label={roleConfig[userToDelete.role]?.label}
                    sx={{
                      mt: 0.5,
                      height: 20,
                      fontSize: '0.7rem',
                      bgcolor: roleConfig[userToDelete.role]?.bgColor,
                      color: roleConfig[userToDelete.role]?.color,
                    }}
                  />
                </Box>
              </Box>
            )}
            <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 2, fontWeight: 500 }}>
              This action is permanent and cannot be undone. All user data will be removed.
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
              onClick={handleCloseDeleteModal}
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
              onClick={handleConfirmDelete}
              variant="contained"
              sx={{
                borderRadius: 2,
                px: 3,
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: '#d32f2f',
                '&:hover': {
                  bgcolor: '#b71c1c',
                },
              }}
            >
              Delete User
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default UserManagement;
