import React, { useState, useRef, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Dialog,
  DialogTitle,
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
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';


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

const ROLES = ['manager', 'staff'];

const UserFormModal = ({ open, handleClose, userToEdit, handleSave }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(userToEdit?.profile_picture || null);
  const fileInputRef = useRef(null);
  const { user: currentUser } = useAuth();

  const isNewUser = !userToEdit;
  const title = isNewUser ? 'Create New User' : `Edit User: ${userToEdit?.username}`;

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
    role: userToEdit?.role || 'staff',
    password: '',
    password2: ''
  };

  // Reset state when modal opens or userToEdit changes
  useEffect(() => {
    if (open) {
      setError(null);
      setProfilePicture(null);
      setPreviewUrl(userToEdit?.profile_picture || null);
    }
  }, [open, userToEdit]);

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
      // Handle Django's detailed error structure (e.g., email already exists)
      const detailError = result.error?.email?.[0] || result.error?.username?.[0] || result.error?.password2?.[0] || result.error?.error || 'An unexpected error occurred.';
      setError(detailError);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <Formik
        initialValues={initialValues}
        validationSchema={UserSchema(isNewUser)}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, values, setFieldValue }) => (
          <Form>
            <DialogContent dividers>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                {/* Profile Picture Upload */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Avatar
                    src={previewUrl}
                    sx={{ width: 80, height: 80 }}
                  >
                    {values.first_name?.[0] || values.username?.[0] || '?'}
                  </Avatar>
                  <Box>
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<PhotoCamera />}
                      onClick={() => fileInputRef.current?.click()}
                      size="small"
                    >
                      Upload Photo
                    </Button>
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                      Optional: JPG, PNG (max 2MB)
                    </Typography>
                  </Box>
                </Box>

                {/* Username */}
                <Field
                  as={TextField}
                  name="username"
                  label="Username"
                  fullWidth
                  required={isNewUser}
                  error={touched.username && Boolean(errors.username)}
                  helperText={touched.username && errors.username}
                />
                
                {/* Email */}
                <Field
                  as={TextField}
                  name="email"
                  label="Email"
                  fullWidth
                  required={isNewUser}
                  error={touched.email && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                />

                {/* First Name & Last Name */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Field
                        as={TextField}
                        name="first_name"
                        label="First Name"
                        fullWidth
                        required
                        error={touched.first_name && Boolean(errors.first_name)}
                        helperText={touched.first_name && errors.first_name}
                    />
                    <Field
                        as={TextField}
                        name="last_name"
                        label="Last Name"
                        fullWidth
                        required
                        error={touched.last_name && Boolean(errors.last_name)}
                        helperText={touched.last_name && errors.last_name}
                    />
                </Box>

                {/* Phone Number - Country Code and Number */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Field
                    as={TextField}
                    name="country_code"
                    label="Country Code"
                    placeholder="+44"
                    sx={{ width: '30%' }}
                    error={touched.country_code && Boolean(errors.country_code)}
                    helperText={touched.country_code && errors.country_code}
                  />
                  <Field
                    as={TextField}
                    name="phone_number"
                    label="Phone Number"
                    placeholder="1234567890"
                    sx={{ width: '70%' }}
                    error={touched.phone_number && Boolean(errors.phone_number)}
                    helperText={touched.phone_number && errors.phone_number}
                  />
                </Box>

                {/* Role Assignment Dropdown */}
                <Field
                  as={TextField}
                  name="role"
                  label="Role"
                  select
                  fullWidth
                  error={touched.role && Boolean(errors.role)}
                  helperText={touched.role && errors.role}
                >
                  {ROLES.map((role) => (
                    <MenuItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                    </MenuItem>
                  ))}
                </Field>

                {/* Password Field */}
                <Field
                  as={TextField}
                  name="password"
                  label={isNewUser ? "Password" : "New Password (Leave blank to keep current)"}
                  type="password"
                  fullWidth
                  required={isNewUser}
                  error={touched.password && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                />
                
                {/* Confirm Password Field - only for new users */}
                {isNewUser && (
                  <Field
                    as={TextField}
                    name="password2"
                    label="Confirm Password"
                    type="password"
                    fullWidth
                    required={isNewUser}
                    error={touched.password2 && Boolean(errors.password2)}
                    helperText={touched.password2 && errors.password2}
                    inputProps={{ autoComplete: 'new-password' }}
                  />
                )}
                
                {!isNewUser && (
                  <Typography variant="caption" color="text.secondary">
                    Use the New Password field above to reset the user's password.
                  </Typography>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} color="inherit">
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="primary" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : (isNewUser ? 'Create User' : 'Save Changes')}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default UserFormModal;