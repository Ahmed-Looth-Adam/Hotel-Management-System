/**
 * Settings Page - Account settings, notifications, and system information
 *
 * Features:
 * - Account settings (profile, password)
 * - Notification preferences management
 * - System information (version, build, environment)
 * - Development team credits
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  Avatar,
  Chip,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  alpha,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  Collapse,
} from '@mui/material';
import {
  Info as InfoIcon,
  Code as CodeIcon,
  Storage as StorageIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  EventNote as BookingIcon,
  Cancel as CancelIcon,
  Login as CheckInIcon,
  Logout as CheckOutIcon,
  DeleteSweep as ClearAllIcon,
  Refresh as RefreshIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  PhotoCamera,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  CalendarMonth as CalendarIcon,
  ExpandMore,
  ExpandLess,
  Shield as ShieldIcon,
  Hotel as HotelIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNotificationContext } from '../../context/NotificationContext';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import { hotelService } from '../../services';

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

// Validation Schemas
const ProfileSchema = Yup.object().shape({
  name: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone_number: Yup.string(),
});

const PasswordChangeSchema = Yup.object().shape({
  current_password: Yup.string().required('Current password is required'),
  new_password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain an uppercase letter')
    .matches(/[a-z]/, 'Password must contain a lowercase letter')
    .matches(/[0-9]/, 'Password must contain a number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain a special character')
    .required('New password is required'),
  confirm_new_password: Yup.string()
    .oneOf([Yup.ref('new_password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

const NOTIFICATION_PREFS_KEY = 'hms_notification_preferences';

const defaultPreferences = {
  new_booking: true,
  booking_cancelled: true,
  check_in_today: true,
  check_out_today: true,
  payment_received: true,
  user_created: true,
  hotel_created: true,
};

const Settings = () => {
  const [searchParams] = useSearchParams();
  const initialTab = parseInt(searchParams.get('tab')) || 0;
  const [tabValue, setTabValue] = useState(initialTab);
  const { notifications, unreadCount, markAllAsRead, clearAll, refresh } = useNotificationContext();
  const { showSuccess } = useNotification();
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  // Account settings state
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);

  const [assignedHotelName, setAssignedHotelName] = useState('');

  const [initialValues, setInitialValues] = useState({
    name: '',
    lastName: '',
    email: '',
    phone_number: '',
  });

  // Load notification preferences from localStorage
  const [notificationPrefs, setNotificationPrefs] = useState(() => {
    const stored = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (stored) {
      try {
        return { ...defaultPreferences, ...JSON.parse(stored) };
      } catch {
        return defaultPreferences;
      }
    }
    return defaultPreferences;
  });

  // Fetch profile data on mount
  useEffect(() => {
    if (user) {
      fetchProfileData().then(async (data) => {
        setInitialValues({
          name: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || '',
          phone_number: data.phone_number || '',
        });
        setNewUsername(data.username || '');
        if (data.profile_picture) {
          setPreviewUrl(data.profile_picture.startsWith('http')
            ? data.profile_picture
            : `http://localhost:8000${data.profile_picture}`
          );
        }

        // Fetch assigned hotel name if exists
        if (data.assigned_hotel) {
          try {
            const hotelResult = await hotelService.getById(data.assigned_hotel);
            if (hotelResult.success) {
              setAssignedHotelName(hotelResult.data.name);
            }
          } catch (e) {
            console.error('Error fetching hotel:', e);
          }
        }

        setLoading(false);
      }).catch(error => {
        console.error('Error fetching profile data:', error);
        setProfileError('Failed to load profile data');
        setLoading(false);
      });
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const result = await authService.getProfile();
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch profile');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));

      setUploadingPicture(true);
      try {
        const formData = new FormData();
        formData.append('profile_picture', file);
        const result = await authService.updateProfile(formData);
        if (result.success) {
          await updateUser();
          setProfileSuccess('Profile picture updated successfully!');
          setTimeout(() => setProfileSuccess(''), 3000);
        } else {
          setProfileError('Failed to update profile picture');
          setTimeout(() => setProfileError(''), 3000);
        }
      } catch (error) {
        setProfileError('Failed to upload profile picture');
        setTimeout(() => setProfileError(''), 3000);
      }
      setUploadingPicture(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!newUsername.trim()) {
      setUsernameError('Username cannot be empty');
      return;
    }
    if (newUsername === user?.username) {
      setEditingUsername(false);
      return;
    }

    setSavingUsername(true);
    setUsernameError('');
    try {
      const result = await authService.updateProfile({ username: newUsername });
      if (result.success) {
        await updateUser();
        setUsernameSuccess('Username updated successfully!');
        setEditingUsername(false);
        setTimeout(() => setUsernameSuccess(''), 3000);
      } else {
        setUsernameError(result.error?.username?.[0] || result.error || 'Failed to update username');
      }
    } catch (error) {
      setUsernameError('Failed to update username');
    }
    setSavingUsername(false);
  };

  const profileFormik = useFormik({
    initialValues: initialValues,
    validationSchema: ProfileSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setProfileError('');
        setProfileSuccess('');
        const updateData = {};

        if (values.name !== initialValues.name) updateData.first_name = values.name;
        if (values.lastName !== initialValues.lastName) updateData.last_name = values.lastName;
        if (values.email !== initialValues.email) updateData.email = values.email;
        if (values.phone_number !== initialValues.phone_number) updateData.phone_number = values.phone_number;

        if (Object.keys(updateData).length === 0) {
          setProfileSuccess('No changes detected.');
          setSubmitting(false);
          return;
        }

        const result = await authService.updateProfile(updateData);

        if (result.success) {
          setProfileSuccess('Profile updated successfully!');
          await updateUser();
          setInitialValues({
            name: result.data.first_name || '',
            lastName: result.data.last_name || '',
            email: result.data.email || '',
            phone_number: result.data.phone_number || '',
          });
        } else {
          const errorMsg = result.error?.email || result.error || 'Failed to update profile.';
          setProfileError(errorMsg);
        }
      } catch (error) {
        setProfileError('An unexpected error occurred. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const passwordFormik = useFormik({
    initialValues: {
      current_password: '',
      new_password: '',
      confirm_new_password: '',
    },
    validationSchema: PasswordChangeSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        setPasswordError('');
        setPasswordSuccess('');

        const response = await authService.changePassword(values);
        if (response.success) {
          setPasswordSuccess('Password changed successfully!');
          resetForm();
          setTimeout(() => setShowPasswordSection(false), 2000);
        } else {
          setPasswordError(response.error || 'Password change failed.');
        }
      } catch (error) {
        setPasswordError('Password change failed.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getInitials = () => {
    const first = user?.first_name?.[0] || '';
    const last = user?.last_name?.[0] || '';
    return (first + last).toUpperCase() || user?.username?.[0]?.toUpperCase() || '?';
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case 'admin': return { bg: 'rgba(211, 47, 47, 0.1)', color: '#d32f2f', border: 'rgba(211, 47, 47, 0.2)' };
      case 'manager': return { bg: 'rgba(156, 39, 176, 0.1)', color: '#9c27b0', border: 'rgba(156, 39, 176, 0.2)' };
      case 'staff': return { bg: 'rgba(25, 118, 210, 0.1)', color: '#1976d2', border: 'rgba(25, 118, 210, 0.2)' };
      default: return { bg: 'rgba(102, 126, 234, 0.1)', color: '#667eea', border: 'rgba(102, 126, 234, 0.2)' };
    }
  };

  const roleColors = getRoleColor();

  // Save preferences to localStorage when they change
  const handleTogglePreference = (key) => {
    const newPrefs = { ...notificationPrefs, [key]: !notificationPrefs[key] };
    setNotificationPrefs(newPrefs);
    localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(newPrefs));
    showSuccess(`${key.replace(/_/g, ' ')} notifications ${newPrefs[key] ? 'enabled' : 'disabled'}`);
  };

  const buildDate = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const teamMembers = [
    { name: 'Ismail Wasiu Abdul Samad', id: '24050765', role: 'Lead Developer' },
    { name: 'Ahmed Looth Adam', id: '24050761', role: 'Developer' },
    { name: 'Ibrahim Waseem', id: '24053101', role: 'Developer' },
    { name: 'Mohamed Lujain Shakeeb Ahmed', id: '24050760', role: 'Developer' },
  ];

  const systemInfo = [
    { label: 'Version', value: '1.0.0', icon: CodeIcon, color: '#1976d2' },
    { label: 'Build', value: '2024.12.20', icon: ScheduleIcon, color: '#2e7d32' },
    { label: 'Environment', value: 'Development', icon: StorageIcon, color: '#ed6c02' },
  ];

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    showSuccess('All notifications marked as read');
  };

  const handleClearAll = async () => {
    await clearAll();
    showSuccess('All notifications cleared');
  };

  const handleRefresh = () => {
    refresh();
    showSuccess('Notifications refreshed');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_booking':
        return <BookingIcon sx={{ color: 'primary.main' }} />;
      case 'booking_cancelled':
        return <CancelIcon sx={{ color: 'error.main' }} />;
      case 'check_in_today':
        return <CheckInIcon sx={{ color: 'success.main' }} />;
      case 'check_out_today':
        return <CheckOutIcon sx={{ color: 'warning.main' }} />;
      default:
        return <NotificationsIcon sx={{ color: 'text.secondary' }} />;
    }
  };

  const getNotificationTypeLabel = (type) => {
    const labels = {
      new_booking: 'New Booking',
      booking_cancelled: 'Cancelled',
      check_in_today: 'Check-in',
      check_out_today: 'Check-out',
      payment_received: 'Payment',
      user_created: 'User Created',
      hotel_created: 'Hotel Created',
    };
    return labels[type] || type;
  };

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', py: 3 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your account, notifications, and view system information.
          </Typography>
        </Box>

        {/* Tabs */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            mb: 3,
          }}
        >
          <Tabs
            value={tabValue}
            onChange={(e, v) => setTabValue(v)}
            sx={{
              px: 2,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 56,
              },
            }}
          >
            <Tab icon={<SettingsIcon />} label="Account" iconPosition="start" />
            <Tab
              icon={<NotificationsIcon />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Notifications
                  {unreadCount > 0 && (
                    <Chip
                      label={unreadCount}
                      size="small"
                      color="error"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
              }
              iconPosition="start"
            />
            <Tab icon={<InfoIcon />} label="System Information" iconPosition="start" />
          </Tabs>
        </Paper>

        {/* Account Tab */}
        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Success/Error Alerts */}
              {(profileSuccess || profileError) && (
                <Alert
                  severity={profileError ? "error" : "success"}
                  sx={{ mb: 3, borderRadius: 2 }}
                  onClose={() => { setProfileError(''); setProfileSuccess(''); }}
                >
                  {profileError || profileSuccess}
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
                {/* Left Column - Profile Card */}
                <Box sx={{ width: { xs: '100%', lg: 320 }, flexShrink: 0 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      p: 3,
                      textAlign: 'center',
                    }}
                  >
                    {/* Avatar */}
                    <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                      <Avatar
                        src={previewUrl}
                        sx={{
                          width: 100,
                          height: 100,
                          fontSize: '2rem',
                          fontWeight: 600,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          border: '4px solid #FFFFFF',
                          boxShadow: '0 4px 14px rgba(102, 126, 234, 0.3)',
                        }}
                      >
                        {getInitials()}
                      </Avatar>
                      <IconButton
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPicture}
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          bgcolor: '#FFFFFF',
                          border: '2px solid',
                          borderColor: 'divider',
                          width: 32,
                          height: 32,
                          '&:hover': { bgcolor: '#F7F7F7' },
                        }}
                      >
                        {uploadingPicture ? (
                          <CircularProgress size={14} sx={{ color: '#667eea' }} />
                        ) : (
                          <PhotoCamera sx={{ fontSize: 16, color: '#667eea' }} />
                        )}
                      </IconButton>
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        ref={fileInputRef}
                        onChange={handleFileChange}
                      />
                    </Box>

                    {/* Name */}
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                      {user?.first_name || ''} {user?.last_name || ''}
                    </Typography>

                    {/* Username with edit */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                      {editingUsername ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField
                            size="small"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            error={!!usernameError}
                            helperText={usernameError}
                            sx={{
                              width: 150,
                              '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '14px' }
                            }}
                            autoFocus
                          />
                          <IconButton
                            size="small"
                            onClick={handleSaveUsername}
                            disabled={savingUsername}
                            sx={{ color: 'success.main' }}
                          >
                            {savingUsername ? <CircularProgress size={16} /> : <CheckIcon sx={{ fontSize: 18 }} />}
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => { setEditingUsername(false); setNewUsername(user?.username || ''); setUsernameError(''); }}
                            sx={{ color: 'text.secondary' }}
                          >
                            <CloseIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>
                      ) : (
                        <>
                          <Typography variant="body2" color="text.secondary">
                            @{user?.username}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => setEditingUsername(true)}
                            sx={{ color: 'text.secondary', '&:hover': { color: '#667eea' } }}
                          >
                            <EditIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </>
                      )}
                    </Box>
                    {usernameSuccess && (
                      <Typography variant="caption" color="success.main" sx={{ display: 'block', mb: 1 }}>
                        {usernameSuccess}
                      </Typography>
                    )}

                    {/* Role Badge */}
                    <Chip
                      label={user?.role === 'staff' ? 'Front Desk Staff' : user?.role || 'Staff'}
                      size="small"
                      sx={{
                        bgcolor: roleColors.bg,
                        color: roleColors.color,
                        border: `1px solid ${roleColors.border}`,
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    />

                    <Divider sx={{ my: 2.5 }} />

                    {/* Quick Info */}
                    <Box sx={{ textAlign: 'left' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">Email</Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {user?.email || 'Not set'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">Phone</Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {user?.phone_number || 'Not set'}
                          </Typography>
                        </Box>
                      </Box>
                      {(user?.role === 'staff' || user?.role === 'manager') && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <HotelIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Assigned Hotel</Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {assignedHotelName || 'Not assigned'}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">Member since</Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {formatDate(user?.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                </Box>

                {/* Right Column - Forms */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {/* Personal Information */}
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      p: 3,
                      mb: 3,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <PersonIcon sx={{ color: '#667eea' }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          Personal Information
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Update your personal details
                        </Typography>
                      </Box>
                    </Box>

                    <Box component="form" onSubmit={profileFormik.handleSubmit}>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                        <TextField
                          fullWidth
                          label="First Name"
                          name="name"
                          size="small"
                          value={profileFormik.values.name}
                          onChange={profileFormik.handleChange}
                          onBlur={profileFormik.handleBlur}
                          error={profileFormik.touched.name && Boolean(profileFormik.errors.name)}
                          helperText={profileFormik.touched.name && profileFormik.errors.name}
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        <TextField
                          fullWidth
                          label="Last Name"
                          name="lastName"
                          size="small"
                          value={profileFormik.values.lastName}
                          onChange={profileFormik.handleChange}
                          onBlur={profileFormik.handleBlur}
                          error={profileFormik.touched.lastName && Boolean(profileFormik.errors.lastName)}
                          helperText={profileFormik.touched.lastName && profileFormik.errors.lastName}
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          type="email"
                          size="small"
                          value={profileFormik.values.email}
                          onChange={profileFormik.handleChange}
                          onBlur={profileFormik.handleBlur}
                          error={profileFormik.touched.email && Boolean(profileFormik.errors.email)}
                          helperText={profileFormik.touched.email && profileFormik.errors.email}
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        <TextField
                          fullWidth
                          label="Phone Number"
                          name="phone_number"
                          size="small"
                          value={profileFormik.values.phone_number}
                          onChange={profileFormik.handleChange}
                          onBlur={profileFormik.handleBlur}
                          error={profileFormik.touched.phone_number && Boolean(profileFormik.errors.phone_number)}
                          helperText={profileFormik.touched.phone_number && profileFormik.errors.phone_number}
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      </Box>

                      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={profileFormik.isSubmitting || !profileFormik.dirty}
                          sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: 2,
                            px: 4,
                            py: 1.25,
                            textTransform: 'none',
                            fontWeight: 600,
                            boxShadow: '0 4px 14px rgba(102, 126, 234, 0.35)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
                            },
                            '&.Mui-disabled': {
                              background: '#DDDDDD',
                              color: '#999999',
                            },
                          }}
                        >
                          {profileFormik.isSubmitting ? (
                            <CircularProgress size={20} sx={{ color: '#FFFFFF' }} />
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                      </Box>
                    </Box>
                  </Paper>

                  {/* Security Section */}
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Header - Clickable */}
                    <Box
                      onClick={() => setShowPasswordSection(!showPasswordSection)}
                      sx={{
                        p: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        '&:hover': { bgcolor: alpha('#000', 0.02) },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, rgba(0, 138, 5, 0.1) 0%, rgba(0, 138, 5, 0.05) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <ShieldIcon sx={{ color: '#008A05' }} />
                        </Box>
                        <Box>
                          <Typography variant="h6" fontWeight={600}>
                            Password & Security
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Keep your account secure by updating your password
                          </Typography>
                        </Box>
                      </Box>
                      {showPasswordSection ? (
                        <ExpandLess sx={{ color: 'text.secondary' }} />
                      ) : (
                        <ExpandMore sx={{ color: 'text.secondary' }} />
                      )}
                    </Box>

                    {/* Collapsible Content */}
                    <Collapse in={showPasswordSection}>
                      <Box sx={{ px: 3, pb: 3 }}>
                        <Divider sx={{ mb: 3 }} />

                        {(passwordError || passwordSuccess) && (
                          <Alert
                            severity={passwordError ? "error" : "success"}
                            sx={{ mb: 3, borderRadius: 2 }}
                            onClose={() => { setPasswordError(''); setPasswordSuccess(''); }}
                          >
                            {passwordError || passwordSuccess}
                          </Alert>
                        )}

                        <Box component="form" onSubmit={passwordFormik.handleSubmit}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <TextField
                              fullWidth
                              label="Current Password"
                              name="current_password"
                              size="small"
                              type={showCurrentPassword ? 'text' : 'password'}
                              value={passwordFormik.values.current_password}
                              onChange={passwordFormik.handleChange}
                              onBlur={passwordFormik.handleBlur}
                              error={passwordFormik.touched.current_password && Boolean(passwordFormik.errors.current_password)}
                              helperText={passwordFormik.touched.current_password && passwordFormik.errors.current_password}
                              InputProps={{
                                startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end" size="small">
                                      {showCurrentPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <TextField
                              fullWidth
                              label="New Password"
                              name="new_password"
                              size="small"
                              type={showNewPassword ? 'text' : 'password'}
                              value={passwordFormik.values.new_password}
                              onChange={passwordFormik.handleChange}
                              onBlur={passwordFormik.handleBlur}
                              error={passwordFormik.touched.new_password && Boolean(passwordFormik.errors.new_password)}
                              helperText={passwordFormik.touched.new_password && passwordFormik.errors.new_password}
                              InputProps={{
                                startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end" size="small">
                                      {showNewPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <TextField
                              fullWidth
                              label="Confirm New Password"
                              name="confirm_new_password"
                              size="small"
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={passwordFormik.values.confirm_new_password}
                              onChange={passwordFormik.handleChange}
                              onBlur={passwordFormik.handleBlur}
                              error={passwordFormik.touched.confirm_new_password && Boolean(passwordFormik.errors.confirm_new_password)}
                              helperText={passwordFormik.touched.confirm_new_password && passwordFormik.errors.confirm_new_password}
                              InputProps={{
                                startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small">
                                      {showConfirmPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          </Box>

                          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                              type="submit"
                              variant="contained"
                              disabled={passwordFormik.isSubmitting || !passwordFormik.dirty}
                              sx={{
                                bgcolor: '#222222',
                                borderRadius: 2,
                                px: 4,
                                py: 1.25,
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': { bgcolor: '#000000' },
                                '&.Mui-disabled': {
                                  background: '#DDDDDD',
                                  color: '#999999',
                                },
                              }}
                            >
                              {passwordFormik.isSubmitting ? (
                                <CircularProgress size={20} sx={{ color: '#FFFFFF' }} />
                              ) : (
                                'Update Password'
                              )}
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    </Collapse>
                  </Paper>
                </Box>
              </Box>
            </>
          )}
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={1}>
          {/* Notification History - Horizontal Card */}
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
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationsIcon color="primary" sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      Notification History
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {notifications.length} total ({unreadCount} unread)
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleMarkAllRead}
                  disabled={unreadCount === 0}
                >
                  Mark All Read
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  startIcon={<ClearAllIcon />}
                  onClick={handleClearAll}
                  disabled={notifications.length === 0}
                >
                  Clear All
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Preferences & Recent Notifications */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
            }}
          >
            {/* Notification Preferences */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <NotificationsIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Notification Preferences
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose which notifications you want to receive.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha('#1976d2', 0.04),
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <BookingIcon sx={{ color: 'primary.main' }} />
                    <Box>
                      <Typography fontWeight={600}>New Bookings</Typography>
                      <Typography variant="caption" color="text.secondary">
                        When a new booking is created
                      </Typography>
                    </Box>
                  </Box>
                  <Switch
                    checked={notificationPrefs.new_booking}
                    onChange={() => handleTogglePreference('new_booking')}
                    color="primary"
                  />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha('#d32f2f', 0.04),
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CancelIcon sx={{ color: 'error.main' }} />
                    <Box>
                      <Typography fontWeight={600}>Booking Cancellations</Typography>
                      <Typography variant="caption" color="text.secondary">
                        When a booking is cancelled
                      </Typography>
                    </Box>
                  </Box>
                  <Switch
                    checked={notificationPrefs.booking_cancelled}
                    onChange={() => handleTogglePreference('booking_cancelled')}
                    color="primary"
                  />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha('#2e7d32', 0.04),
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CheckInIcon sx={{ color: 'success.main' }} />
                    <Box>
                      <Typography fontWeight={600}>Guest Check-ins</Typography>
                      <Typography variant="caption" color="text.secondary">
                        When a guest checks in
                      </Typography>
                    </Box>
                  </Box>
                  <Switch
                    checked={notificationPrefs.check_in_today}
                    onChange={() => handleTogglePreference('check_in_today')}
                    color="primary"
                  />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha('#ed6c02', 0.04),
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CheckOutIcon sx={{ color: 'warning.main' }} />
                    <Box>
                      <Typography fontWeight={600}>Guest Check-outs</Typography>
                      <Typography variant="caption" color="text.secondary">
                        When a guest checks out
                      </Typography>
                    </Box>
                  </Box>
                  <Switch
                    checked={notificationPrefs.check_out_today}
                    onChange={() => handleTogglePreference('check_out_today')}
                    color="primary"
                  />
                </Box>
              </Box>
            </Paper>

            {/* Recent Notifications */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={600}>
                  Recent Notifications
                </Typography>
              </Box>
              {notifications.length === 0 ? (
                <Box
                  sx={{
                    py: 8,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 300,
                  }}
                >
                  <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No notifications
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    You're all caught up!
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ maxHeight: 400, overflow: 'auto', flex: 1 }}>
                  {notifications.map((notification, index) => (
                    <Box key={notification.id}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 2,
                          p: 2,
                          bgcolor: notification.is_read ? 'transparent' : alpha('#1976d2', 0.04),
                          '&:hover': { bgcolor: alpha('#1976d2', 0.08) },
                        }}
                      >
                        <Box sx={{ pt: 0.5 }}>
                          {getNotificationIcon(notification.notification_type)}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="body2" fontWeight={notification.is_read ? 400 : 600} noWrap>
                              {notification.title}
                            </Typography>
                            <Chip
                              label={getNotificationTypeLabel(notification.notification_type)}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.6rem',
                                bgcolor: alpha('#1976d2', 0.1),
                                color: '#1976d2',
                              }}
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }} noWrap>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {notification.time_ago}
                          </Typography>
                        </Box>
                        {!notification.is_read && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              mt: 1,
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </Box>
                      {index < notifications.length - 1 && <Divider />}
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Box>
        </TabPanel>

        {/* System Information Tab */}
        <TabPanel value={tabValue} index={2}>
          {/* System Information Cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 3,
              mb: 4,
            }}
          >
            {systemInfo.map((info) => (
              <Card
                key={info.label}
                elevation={0}
                sx={{
                  background: `linear-gradient(135deg, ${alpha(info.color, 0.1)} 0%, ${alpha(info.color, 0.05)} 100%)`,
                  border: `1px solid ${alpha(info.color, 0.2)}`,
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 25px ${alpha(info.color, 0.25)}`,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
                        {info.label}
                      </Typography>
                      <Typography variant="h4" fontWeight={700} sx={{ color: info.color }}>
                        {info.value}
                      </Typography>
                    </Box>
                    <Avatar
                      sx={{
                        bgcolor: alpha(info.color, 0.15),
                        color: info.color,
                        width: 56,
                        height: 56,
                      }}
                    >
                      <info.icon sx={{ fontSize: 28 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* About Section */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
            }}
          >
            {/* System Details */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <InfoIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  System Information
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha('#1976d2', 0.04),
                  }}
                >
                  <Typography color="text.secondary" fontWeight={500}>Application</Typography>
                  <Typography fontWeight={600}>Hotel Management System</Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha('#1976d2', 0.04),
                  }}
                >
                  <Typography color="text.secondary" fontWeight={500}>Framework</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label="Django 5.2" size="small" variant="outlined" />
                    <Chip label="React 19" size="small" variant="outlined" />
                  </Box>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha('#1976d2', 0.04),
                  }}
                >
                  <Typography color="text.secondary" fontWeight={500}>Database</Typography>
                  <Chip label="PostgreSQL 15" size="small" variant="outlined" color="primary" />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha('#1976d2', 0.04),
                  }}
                >
                  <Typography color="text.secondary" fontWeight={500}>Module</Typography>
                  <Typography fontWeight={600}>Advanced Software Development</Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha('#1976d2', 0.04),
                  }}
                >
                  <Typography color="text.secondary" fontWeight={500}>Module Code</Typography>
                  <Chip label="UFCF8S-30-2" size="small" color="primary" />
                </Box>
              </Box>
            </Paper>

            {/* Development Team */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <PersonIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Development Team
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Hotel Management System developed as part of university coursework for the
                Advanced Software Development module at UWE Bristol.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {teamMembers.map((member, index) => (
                  <Box
                    key={member.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha('#9c27b0', 0.04),
                      border: '1px solid',
                      borderColor: alpha('#9c27b0', 0.1),
                    }}
                  >
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        {member.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        UWE ID: {member.id}
                      </Typography>
                    </Box>
                    <Chip
                      label={member.role}
                      size="small"
                      sx={{
                        bgcolor: index === 0 ? alpha('#9c27b0', 0.1) : alpha('#6b7280', 0.1),
                        color: index === 0 ? '#9c27b0' : '#6b7280',
                        fontWeight: 500,
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>

          {/* Footer Note */}
          <Paper
            elevation={0}
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Built with Django REST Framework & React | Last Updated: {buildDate}
            </Typography>
          </Paper>
        </TabPanel>
      </Container>
    </Box>
  );
};

export default Settings;
