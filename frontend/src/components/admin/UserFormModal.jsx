import React, { useState, useRef, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Box,
  Alert,
  Typography,
  Avatar,
  IconButton,
  InputAdornment,
  Divider,
  alpha,
  Chip,
} from '@mui/material';
import {
  PhotoCamera,
  Close as CloseIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
  Badge as BadgeIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as ManagerIcon,
  Person as StaffIcon,
  Visibility,
  VisibilityOff,
  CloudUpload as UploadIcon,
  Hotel as HotelIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import hotelService from '../../services/hotelService';


const UserSchema = (isNewUser) => Yup.object().shape({
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(150, 'Username must not exceed 150 characters')
    .required(isNewUser ? 'Username is required' : false),
  email: Yup.string()
    .email('Invalid email')
    .required(isNewUser ? 'Email is required' : false),
  first_name: Yup.string()
    .matches(/^[A-Za-z\s\-']+$/, 'First name cannot contain numbers or special characters')
    .required('First name is required'),
  last_name: Yup.string()
    .matches(/^[A-Za-z\s\-']+$/, 'Last name cannot contain numbers or special characters')
    .required('Last name is required'),
  country_code: Yup.string()
    .matches(/^\+\d{1,4}$/, 'Invalid country code (e.g., +44)')
    .nullable(),
  phone_number: Yup.string()
    .matches(/^\d{6,14}$/, 'Phone number must be 6-14 digits')
    .nullable(),
  role: Yup.string()
    .oneOf(['admin', 'manager', 'staff', 'guest'], 'Invalid role selection')
    .required('Role is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .test(
        'password-required',
        'Password is required for new accounts',
        function (value) {
            if (isNewUser) {
                return value != null && value.length >= 6;
            }
            return true;
        }
    ),
  password2: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .test(
        'password2-required',
        'Password confirmation is required for new accounts',
        function (value) {
            if (isNewUser) {
                return value != null && value.length > 0;
            }
            return true;
        }
    )
});

const ROLES = [
  { value: 'manager', label: 'Manager', icon: ManagerIcon, color: '#1976d2', description: 'Can manage hotel operations' },
  { value: 'staff', label: 'Staff', icon: StaffIcon, color: '#388e3c', description: 'Front desk operations' },
];

const UserFormModal = ({ open, handleClose, userToEdit, handleSave, forceRole = null }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(userToEdit?.profile_picture || null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const fileInputRef = useRef(null);
  const { user: currentUser } = useAuth();

  const isNewUser = !userToEdit;
  const isManager = currentUser?.role === 'manager';
  const showHotelField = ['staff', 'manager'].includes(forceRole) || (!forceRole && ['staff', 'manager'].includes(userToEdit?.role));

  // Parse existing phone number into country code and number
  const parsePhoneNumber = (phone) => {
    if (!phone) return { countryCode: '', number: '' };
    const match = phone.match(/^(\+\d{1,4})\s?(.*)$/);
    if (match) {
      return { countryCode: match[1], number: match[2] };
    }
    return { countryCode: '', number: phone };
  };

  const parsedPhone = parsePhoneNumber(userToEdit?.phone_number);

  const initialValues = {
    username: userToEdit?.username || '',
    email: userToEdit?.email || '',
    first_name: userToEdit?.first_name || '',
    last_name: userToEdit?.last_name || '',
    country_code: parsedPhone.countryCode || '+44',
    phone_number: parsedPhone.number || '',
    role: forceRole || userToEdit?.role || 'staff',
    password: '',
    password2: '',
    assigned_hotel: userToEdit?.assigned_hotel || '',
  };

  // Reset state when modal opens or userToEdit changes
  useEffect(() => {
    if (open) {
      setError(null);
      setProfilePicture(null);
      setPreviewUrl(userToEdit?.profile_picture || null);
      setShowPassword(false);
      setShowPassword2(false);
      fetchHotels();
    }
  }, [open, userToEdit]);

  // Fetch hotels for assignment dropdown
  const fetchHotels = async () => {
    setLoadingHotels(true);
    const result = await hotelService.getAll({ is_active: true });
    if (result.success) {
      let hotelList = Array.isArray(result.data) ? result.data : (result.data?.results || []);
      // If manager, filter to only show hotels they manage
      if (isManager) {
        hotelList = hotelList.filter(h => h.manager?.id === currentUser?.id);
      }
      setHotels(hotelList);
    }
    setLoadingHotels(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);

    // Combine country code and phone number
    const combinedPhone = values.phone_number
      ? `${values.country_code} ${values.phone_number}`.trim()
      : '';

    // Use FormData for file upload support
    const formData = new FormData();

    if (isNewUser) {
      // Add all values for new user (except country_code which we combine)
      Object.keys(values).forEach(key => {
        if (key === 'country_code') return; // Skip, we'll use combined phone
        if (key === 'phone_number') {
          if (combinedPhone) formData.append('phone_number', combinedPhone);
          return;
        }
        if (key === 'assigned_hotel') {
          // Only include if a hotel is selected
          if (values[key]) formData.append('assigned_hotel', values[key]);
          return;
        }
        if (values[key]) {
          formData.append(key, values[key]);
        }
      });
    } else {
      // Only send fields that have changed from initial values
      Object.keys(values).forEach(key => {
        if (key === 'country_code') return; // Skip
        if (key === 'phone_number') {
          // Check if phone changed
          const originalPhone = `${initialValues.country_code} ${initialValues.phone_number}`.trim();
          if (combinedPhone !== originalPhone && combinedPhone) {
            formData.append('phone_number', combinedPhone);
          }
          return;
        }
        if (values[key] !== initialValues[key] && values[key]) {
          formData.append(key, values[key]);
        }
      });

      // If password field is populated, send it for reset
      if (values.password) {
        formData.append('password', values.password);
      }

      // Remove password2 for updates since it's not needed
      formData.delete('password2');
    }

    // Add profile picture if selected
    if (profilePicture) {
      formData.append('profile_picture', profilePicture);
    }

    // Check if there's anything to update (for edit mode)
    if (!isNewUser) {
      let hasChanges = false;
      for (let pair of formData.entries()) {
        hasChanges = true;
        break;
      }
      if (!hasChanges) {
        setError('No changes detected.');
        setLoading(false);
        return;
      }
    }

    // Handle Admin Self-Downgrade Protection (Preventing admin from changing their own role)
    if (!isNewUser && userToEdit.id === currentUser.id && values.role && values.role !== currentUser.role) {
        setError('You cannot change your own role.');
        setLoading(false);
        return;
    }

    const result = await handleSave(userToEdit?.id, formData);

    if (result.success) {
      handleClose();
      // Reset state
      setProfilePicture(null);
      setPreviewUrl(null);
    } else {
      // Handle Django's detailed error structure
      let detailError = 'An unexpected error occurred.';

      if (result.error) {
        // Check for specific field errors
        if (result.error.password?.[0]) {
          detailError = `Password: ${result.error.password[0]}`;
        } else if (result.error.email?.[0]) {
          detailError = result.error.email[0];
        } else if (result.error.username?.[0]) {
          detailError = result.error.username[0];
        } else if (result.error.password2?.[0]) {
          detailError = result.error.password2[0];
        } else if (result.error.first_name?.[0]) {
          detailError = `First name: ${result.error.first_name[0]}`;
        } else if (result.error.last_name?.[0]) {
          detailError = `Last name: ${result.error.last_name[0]}`;
        } else if (result.error.phone_number?.[0]) {
          detailError = `Phone: ${result.error.phone_number[0]}`;
        } else if (result.error.error) {
          detailError = result.error.error;
        } else if (typeof result.error === 'string') {
          detailError = result.error;
        }
      }

      setError(detailError);
    }
    setLoading(false);
  };

  const SectionHeader = ({ icon: Icon, title }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
      <Icon sx={{ fontSize: 16, color: 'primary.main' }} />
      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </Typography>
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
          overflow: 'hidden',
        }
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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              width: 36,
              height: 36,
            }}
          >
            {isNewUser ? <PersonIcon fontSize="small" /> : <BadgeIcon fontSize="small" />}
          </Avatar>
          <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#ffffff' }}>
            {isNewUser ? 'Create New User' : `Edit User: ${userToEdit?.username}`}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: '#ffffff' }} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Formik
        initialValues={initialValues}
        validationSchema={UserSchema(isNewUser)}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ errors, touched, values, setFieldValue }) => (
          <Form>
            <DialogContent
              sx={{
                px: 3,
                py: 2,
                maxHeight: 'calc(90vh - 140px)',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'transparent',
                  borderRadius: '3px',
                  transition: 'background 0.2s ease',
                },
                '&:hover::-webkit-scrollbar-thumb': {
                  background: 'rgba(0, 0, 0, 0.2)',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: 'rgba(0, 0, 0, 0.3)',
                },
                scrollbarWidth: 'thin',
                scrollbarColor: 'transparent transparent',
                '&:hover': {
                  scrollbarColor: 'rgba(0, 0, 0, 0.2) transparent',
                },
              }}
            >
              {error && (
                <Alert
                  severity="error"
                  sx={{ mb: 2, borderRadius: 2 }}
                  onClose={() => setError(null)}
                >
                  {error}
                </Alert>
              )}

              {/* Profile Picture Section - Compact Inline */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 2,
                  pb: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={previewUrl}
                    sx={{
                      width: 64,
                      height: 64,
                      fontSize: '1.5rem',
                      bgcolor: 'primary.main',
                      border: '3px solid',
                      borderColor: 'primary.light',
                    }}
                  >
                    {values.first_name?.[0]?.toUpperCase() || values.username?.[0]?.toUpperCase() || '?'}
                  </Avatar>
                  <IconButton
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                      width: 24,
                      height: 24,
                    }}
                    size="small"
                  >
                    <PhotoCamera sx={{ fontSize: 14 }} />
                  </IconButton>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={500}>Profile Photo</Typography>
                  <Typography variant="caption" color="text.secondary">
                    JPG, PNG (max 2MB)
                  </Typography>
                </Box>
              </Box>

              {/* Account Information */}
              <SectionHeader icon={PersonIcon} title="Account Information" />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Field
                    as={TextField}
                    name="first_name"
                    label="First Name"
                    fullWidth
                    required
                    size="small"
                    error={touched.first_name && Boolean(errors.first_name)}
                    helperText={touched.first_name && errors.first_name}
                    InputProps={{
                      sx: { borderRadius: 2 }
                    }}
                  />
                  <Field
                    as={TextField}
                    name="last_name"
                    label="Last Name"
                    fullWidth
                    required
                    size="small"
                    error={touched.last_name && Boolean(errors.last_name)}
                    helperText={touched.last_name && errors.last_name}
                    InputProps={{
                      sx: { borderRadius: 2 }
                    }}
                  />
                </Box>
                <Field
                  as={TextField}
                  name="username"
                  label="Username"
                  fullWidth
                  required={isNewUser}
                  size="small"
                  error={touched.username && Boolean(errors.username)}
                  helperText={touched.username && errors.username}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2 }
                  }}
                />
                <Field
                  as={TextField}
                  name="email"
                  label="Email Address"
                  fullWidth
                  required={isNewUser}
                  size="small"
                  error={touched.email && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2 }
                  }}
                />
              </Box>

              {/* Contact Information */}
              <SectionHeader icon={PhoneIcon} title="Contact Information" />
              <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                <Field
                  as={TextField}
                  name="country_code"
                  label="Code"
                  placeholder="+44"
                  size="small"
                  sx={{ width: 100 }}
                  error={touched.country_code && Boolean(errors.country_code)}
                  helperText={touched.country_code && errors.country_code}
                  InputProps={{
                    sx: { borderRadius: 2 }
                  }}
                />
                <Field
                  as={TextField}
                  name="phone_number"
                  label="Phone Number"
                  placeholder="1234567890"
                  fullWidth
                  size="small"
                  error={touched.phone_number && Boolean(errors.phone_number)}
                  helperText={touched.phone_number && errors.phone_number}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2 }
                  }}
                />
              </Box>

              {/* Role Selection */}
              <SectionHeader icon={BadgeIcon} title="Role Assignment" />
              {forceRole ? (
                // Locked role display when forceRole is provided
                <Box sx={{ mb: 2 }}>
                  {(() => {
                    const role = ROLES.find(r => r.value === forceRole) || { label: forceRole, color: '#388e3c', icon: StaffIcon };
                    const Icon = role.icon;
                    return (
                      <Box
                        sx={{
                          p: 1.5,
                          border: '2px solid',
                          borderColor: role.color,
                          borderRadius: 2,
                          bgcolor: alpha(role.color, 0.08),
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Icon sx={{ color: role.color, fontSize: 18 }} />
                          <Typography variant="body2" fontWeight={600}>
                            {role.label}
                          </Typography>
                          <Chip
                            label="Fixed"
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.6rem',
                              bgcolor: role.color,
                              color: 'white',
                              ml: 'auto',
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })()}
                </Box>
              ) : (
                // Selectable role options
                <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                  {ROLES.map((role) => {
                    const Icon = role.icon;
                    const isSelected = values.role === role.value;
                    return (
                      <Box
                        key={role.value}
                        onClick={() => setFieldValue('role', role.value)}
                        sx={{
                          flex: 1,
                          p: 1.5,
                          border: '2px solid',
                          borderColor: isSelected ? role.color : 'divider',
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          bgcolor: isSelected ? alpha(role.color, 0.08) : 'transparent',
                          '&:hover': {
                            borderColor: role.color,
                            bgcolor: alpha(role.color, 0.04),
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Icon sx={{ color: role.color, fontSize: 18 }} />
                          <Typography variant="body2" fontWeight={600}>
                            {role.label}
                          </Typography>
                          {isSelected && (
                            <Chip
                              label="Selected"
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.6rem',
                                bgcolor: role.color,
                                color: 'white',
                                ml: 'auto',
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {/* Hotel Assignment - Show for staff and manager roles */}
              {(['staff', 'manager'].includes(forceRole) || ['staff', 'manager'].includes(values.role)) && (
                <>
                  <SectionHeader icon={HotelIcon} title="Hotel Assignment" />
                  <Box sx={{ mb: 2 }}>
                    <Field
                      as={TextField}
                      name="assigned_hotel"
                      label="Assigned Hotel"
                      select
                      fullWidth
                      size="small"
                      disabled={loadingHotels}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <HotelIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: 2 }
                      }}
                    >
                      <MenuItem value="">
                        <em>No Hotel Assigned</em>
                      </MenuItem>
                      {hotels.map((hotel) => (
                        <MenuItem key={hotel.id} value={hotel.id}>
                          {hotel.name} - {hotel.city}
                        </MenuItem>
                      ))}
                    </Field>
                    {isManager && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        You can only assign staff to hotels you manage
                      </Typography>
                    )}
                  </Box>
                </>
              )}

              {/* Password Section */}
              <SectionHeader icon={LockIcon} title={isNewUser ? "Set Password" : "Change Password"} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Field
                  as={TextField}
                  name="password"
                  label={isNewUser ? "Password" : "New Password"}
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  required={isNewUser}
                  size="small"
                  error={touched.password && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2 }
                  }}
                />
                {isNewUser && (
                  <Field
                    as={TextField}
                    name="password2"
                    label="Confirm Password"
                    type={showPassword2 ? 'text' : 'password'}
                    fullWidth
                    required
                    size="small"
                    error={touched.password2 && Boolean(errors.password2)}
                    helperText={touched.password2 && errors.password2}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword2(!showPassword2)}
                            edge="end"
                            size="small"
                          >
                            {showPassword2 ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 2 }
                    }}
                  />
                )}
                {!isNewUser && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
                    Leave blank to keep the current password
                  </Typography>
                )}
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
                onClick={handleClose}
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
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: '#000000',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                  '&:hover': {
                    bgcolor: '#1a1a1a',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={22} sx={{ color: 'white' }} />
                ) : (
                  isNewUser ? 'Create User' : 'Save Changes'
                )}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default UserFormModal;
