import React, { useState } from 'react';
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
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';


const UserSchema = (isNewUser) => Yup.object().shape({
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(150, 'Username must not exceed 150 characters')
    .required(isNewUser ? 'Username is required' : false), // Only required for new users
  email: Yup.string()
    .email('Invalid email')
    .required(isNewUser ? 'Email is required' : false),
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
  const { user: currentUser } = useAuth();

  const isNewUser = !userToEdit;
  const title = isNewUser ? 'Create New User' : `Edit User: ${userToEdit?.username}`;

  const initialValues = {
    username: userToEdit?.username || '',
    email: userToEdit?.email || '',
    first_name: userToEdit?.first_name || '',
    last_name: userToEdit?.last_name || '',
    role: userToEdit?.role || 'staff',
    password: '',
    password2: ''
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    
    const payload = isNewUser ? values : {};

    if (!isNewUser) {
        // Only send fields that have changed from initial values
        Object.keys(values).forEach(key => {
            if (values[key] !== initialValues[key]) {
                payload[key] = values[key];
            }
        });

        // If password field is populated, send it for reset
        if (values.password) {
            payload.password = values.password;
        }

        // If payload is empty, there is nothing to update
        if (Object.keys(payload).length === 0) {
            setError('No changes detected.');
            setLoading(false);
            return;
        }
        
        // Remove password2 for updates since it's not needed
        delete payload.password2;
    }
    
    // Handle Admin Self-Downgrade Protection (Preventing admin from changing their own role)
    if (!isNewUser && userToEdit.id === currentUser.id && payload.role && payload.role !== currentUser.role) {
        setError('You cannot change your own role.');
        setLoading(false);
        return;
    }


    const result = await handleSave(userToEdit?.id, payload);

    if (result.success) {
      handleClose();
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

                {/* First Name & Last Name (Optional) */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Field
                        as={TextField}
                        name="first_name"
                        label="First Name (Optional)"
                        fullWidth
                    />
                    <Field
                        as={TextField}
                        name="last_name"
                        label="Last Name (Optional)"
                        fullWidth
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