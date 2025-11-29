import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Grid, 
  List, 
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LockIcon from '@mui/icons-material/Lock';
import { ProfileSchema, PasswordChangeSchema } from './validationSchema';
import authService from '../../services/authService';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const navigate = useNavigate();

  const [initialValues, setInitialValues] = useState({
    name: '',
    email: '',
    phone_number: '',
  });

  useEffect(() => {
    if (user) {
      fetchProfileData().then(data => {
        setInitialValues({
          name: data.first_name || '',
          email: data.email || '',
          phone_number: data.phone_number || '',
        });
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

  const profileFormik = useFormik({
    initialValues: initialValues,
    validationSchema: ProfileSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setProfileError('');
        setProfileSuccess('');
        const updateData = {};
        if (values.name !== initialValues.name) {
          updateData.first_name = values.name;
        }
        if (values.email !== initialValues.email) {
          updateData.email = values.email;
        }
        if (values.phone_number !== initialValues.phone_number) {
          updateData.phone_number = values.phone_number;
        }

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
            email: result.data.email || '',
            phone_number: result.data.phone_number || '',
          });
        } else {
          setProfileError(result.error || 'Failed to update profile.');
        }
      } catch (error) {
        setProfileError('An unexpected error occurred. Please try again.');
        console.error('Profile update error:', error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const formatJoinDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
          const date = new Date(dateString);
          return date.toLocaleDateString();
      } catch (e) {
          return dateString;
      }
    }

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
        
        try {
            const response = await authService.changePassword(values);

            if (response.success) {
                setPasswordSuccess('Password changed successfully');
                resetForm();
            } else {
                setPasswordError(response.error || 'Password change failed.');
            }
        } catch (error) {
            console.error('Unexpected error:', error);
        }
      } catch (error) {
        setPasswordError('Password change failed.');
        console.error('Password change error:', error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'text.primary' }}>
        Welcome, {user?.username || initialValues.name}!
      </Typography>
      <Typography variant="subtitle1" gutterBottom sx={{ mb: 4, color: 'text.secondary' }}>
        This is your user profile dashboard. Update your personal details and manage your security settings.
      </Typography>
      {/* Dashboard grid */}
      <Grid container spacing={4}> 
        {/* New: user Information card */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 4, height: '100%' }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
                Account Status
            </Typography>
            <List disablePadding>
              <ListItem disableGutters>
                <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
                <ListItemText 
                    primary="Username" 
                    secondary={user?.username || 'N/A'} 
                />
              </ListItem>
              <ListItem disableGutters>
                <ListItemIcon><EmailIcon color="primary" /></ListItemIcon>
                <ListItemText 
                    primary="Verified Email" 
                    secondary={user?.email || initialValues.email} 
                />
              </ListItem>
              {/* Assuming your 'user' object from context or the fetched data has a date_joined field */}
              <ListItem disableGutters>
                <ListItemIcon><CalendarMonthIcon color="primary" /></ListItemIcon>
                <ListItemText 
                    primary="Member Since" 
                    secondary={formatJoinDate(user?.date_joined || user?.created_at)}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Profile Details Card (editable) - Moved to the right */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 4, mb: 4, height: '100%' }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
              Update Personal Details
            </Typography>
            <Box component="form" onSubmit={profileFormik.handleSubmit} noValidate>
              {(profileError || profileSuccess) && (
                <Alert 
                  severity={profileError ? "error" : "success"} 
                  sx={{ mb: 2 }}
                >
                  {profileError || profileSuccess}
                </Alert>
              )}

              <TextField
                fullWidth
                id="name"
                name="name"
                label="Name"
                margin="normal"
                value={profileFormik.values.name}
                onChange={profileFormik.handleChange}
                onBlur={profileFormik.handleBlur}
                error={profileFormik.touched.name && Boolean(profileFormik.errors.name)}
                helperText={profileFormik.touched.name && profileFormik.errors.name}
              />
              
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email"
                type="email"
                margin="normal"
                value={profileFormik.values.email}
                onChange={profileFormik.handleChange}
                onBlur={profileFormik.handleBlur}
                error={profileFormik.touched.email && Boolean(profileFormik.errors.email)}
                helperText={profileFormik.touched.email && profileFormik.errors.email}
                disabled={true}
              />
              
              <TextField
                fullWidth
                id="phone_number"
                name="phone_number"
                label="Phone Number"
                margin="normal"
                value={profileFormik.values.phone_number}
                onChange={profileFormik.handleChange}
                onBlur={profileFormik.handleBlur}
                error={profileFormik.touched.phone_number && Boolean(profileFormik.errors.phone_number)}
                helperText={profileFormik.touched.phone_number && profileFormik.errors.phone_number}
              />

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={profileFormik.isSubmitting || !profileFormik.dirty}
                >
                  {profileFormik.isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Save Profile Details'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      <Box sx={{ mt: 4 }}>
        <Grid container spacing={4}>
          {/* Security Card */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 4 }}>
              <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
                Security & Access
              </Typography>
              {/* Password Change Form */}
              <Box component="form" onSubmit={passwordFormik.handleSubmit} noValidate>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    {(passwordError || passwordSuccess) && (
                      <Alert 
                        severity={passwordError ? "error" : "success"} 
                        sx={{ mb: 2 }}
                      >
                        {passwordError || passwordSuccess}
                      </Alert>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      id="current_password"
                      name="current_password"
                      label="Current Password"
                      type="password"
                      margin="normal"
                      value={passwordFormik.values.current_password}
                      onChange={passwordFormik.handleChange}
                      onBlur={passwordFormik.handleBlur}
                      error={passwordFormik.touched.current_password && Boolean(passwordFormik.errors.current_password)}
                      helperText={passwordFormik.touched.current_password && passwordFormik.errors.current_password}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      id="new_password"
                      name="new_password"
                      label="New Password"
                      type="password"
                      margin="normal"
                      value={passwordFormik.values.new_password}
                      onChange={passwordFormik.handleChange}
                      onBlur={passwordFormik.handleBlur}
                      error={passwordFormik.touched.new_password && Boolean(passwordFormik.errors.new_password)}
                      helperText={passwordFormik.touched.new_password && passwordFormik.errors.new_password}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      id="confirm_new_password"
                      name="confirm_new_password"
                      label="Confirm New Password"
                      type="password"
                      margin="normal"
                      value={passwordFormik.values.confirm_new_password}
                      onChange={passwordFormik.handleChange}
                      onBlur={passwordFormik.handleBlur}
                      error={passwordFormik.touched.confirm_new_password && Boolean(passwordFormik.errors.confirm_new_password)}
                      helperText={passwordFormik.touched.confirm_new_password && passwordFormik.errors.confirm_new_password}
                    />
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="secondary"
                    disabled={passwordFormik.isSubmitting || !passwordFormik.isValid} 
                  >
                    {passwordFormik.isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Change Password'}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      {/* End Dashboard grid */}
    </Container>
  );
};

export default Profile;