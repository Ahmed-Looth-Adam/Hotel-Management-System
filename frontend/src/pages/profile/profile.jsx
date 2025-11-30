import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFormik } from 'formik';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  CircularProgress,
  Alert
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LockIcon from '@mui/icons-material/Lock';
import PhoneIcon from '@mui/icons-material/Phone';
import CakeIcon from '@mui/icons-material/Cake';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
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
    lastName: '',
    email: '',
    phone_number: '',
    date_of_birth: '',
    address: '',
    city: '',
    country: '',
    postal_code: '',
  });

  useEffect(() => {
    if (user) {
      fetchProfileData().then(data => {
        setInitialValues({
          name: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || '',
          phone_number: data.phone_number || '',
          date_of_birth: data.date_of_birth || '',
          address: data.address || '',
          city: data.city || '',
          country: data.country || '',
          postal_code: data.postal_code || '',
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
        
        // Check all fields for changes
        if (values.name !== initialValues.name) {
          updateData.first_name = values.name;
        }
        if (values.lastName !== initialValues.lastName) {
          updateData.last_name = values.lastName;
        }
        if (values.email !== initialValues.email) {
          updateData.email = values.email;
        }
        if (values.phone_number !== initialValues.phone_number) {
          updateData.phone_number = values.phone_number;
        }
        if (values.date_of_birth !== initialValues.date_of_birth) {
          updateData.date_of_birth = values.date_of_birth;
        }
        if (values.address !== initialValues.address) {
          updateData.address = values.address;
        }
        if (values.city !== initialValues.city) {
          updateData.city = values.city;
        }
        if (values.country !== initialValues.country) {
          updateData.country = values.country;
        }
        if (values.postal_code !== initialValues.postal_code) {
          updateData.postal_code = values.postal_code;
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
          // Update all initialValues to reflect current state
          setInitialValues({
            name: result.data.first_name || '',
            lastName: result.data.last_name || '',
            email: result.data.email || '',
            phone_number: result.data.phone_number || '',
            date_of_birth: result.data.date_of_birth || '',
            address: result.data.address || '',
            city: result.data.city || '',
            country: result.data.country || '',
            postal_code: result.data.postal_code || '',
          });
        } else {
            const errorMsg = result.error?.email || result.error || 'Failed to update profile.';
            setProfileError(errorMsg);
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
      <Grid container spacing={4}>
        {/* User Info Card - Left side */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 4, mb: 4, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  This is user profile customization page in development
                </Typography>
              </Box>
            </Box>
            <List disablePadding>
              <ListItem disableGutters>
                <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
                <ListItemText 
                    primary="Name" 
                    secondary={`${(user?.first_name || initialValues.name) || ''} ${(user?.last_name || initialValues.lastName) || ''}`.trim() || 'N/A'} 
                />
              </ListItem>
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
              <ListItem disableGutters>
                <ListItemIcon><WorkIcon color="primary" /></ListItemIcon>
                <ListItemText 
                    primary="Role" 
                    secondary={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'} 
                />
              </ListItem>
              <ListItem disableGutters>
                <ListItemIcon><PhoneIcon color="primary" /></ListItemIcon>
                <ListItemText 
                    primary="Phone Number" 
                    secondary={user?.phone_number || initialValues.phone_number || 'N/A'} 
                />
              </ListItem>
              <ListItem disableGutters>
                <ListItemIcon><CakeIcon color="primary" /></ListItemIcon>
                <ListItemText 
                    primary="Date of Birth" 
                    secondary={user?.date_of_birth || initialValues.date_of_birth || 'N/A'} 
                />
              </ListItem>
              <ListItem disableGutters>
                <ListItemIcon><CalendarMonthIcon color="primary" /></ListItemIcon>
                <ListItemText 
                    primary="Member Since" 
                    secondary={formatJoinDate(user?.created_at)}
                />
              </ListItem>
              <ListItem disableGutters>
                <ListItemIcon><CalendarMonthIcon color="primary" /></ListItemIcon>
                <ListItemText 
                    primary="Last Updated" 
                    secondary={formatJoinDate(user?.updated_at)}
                />
              </ListItem>
              <ListItem disableGutters>
                <ListItemIcon><LocationOnIcon color="primary" /></ListItemIcon>
                <ListItemText 
                    primary="Address" 
                    secondary={
                      <>
                        {user?.address || initialValues.address || 'N/A'}
                        <br />
                        {[user?.city || initialValues.city, user?.postal_code || initialValues.postal_code].filter(Boolean).join(', ') || 'N/A'}
                        <br />
                        {user?.country || initialValues.country || 'N/A'}
                      </>
                    } 
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Profile Details Card (editable) - Right side */}
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
                label="First Name"
                margin="normal"
                value={profileFormik.values.name}
                onChange={profileFormik.handleChange}
                onBlur={profileFormik.handleBlur}
                error={profileFormik.touched.name && Boolean(profileFormik.errors.name)}
                helperText={profileFormik.touched.name && profileFormik.errors.name}
              />
              
              <TextField
                fullWidth
                id="lastName"
                name="lastName"
                label="Last Name"
                margin="normal"
                value={profileFormik.values.lastName}
                onChange={profileFormik.handleChange}
                onBlur={profileFormik.handleBlur}
                error={profileFormik.touched.lastName && Boolean(profileFormik.errors.lastName)}
                helperText={profileFormik.touched.lastName && profileFormik.errors.lastName}
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
              
              <TextField
                fullWidth
                id="date_of_birth"
                name="date_of_birth"
                label="Date of Birth"
                type="date"
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
                value={profileFormik.values.date_of_birth}
                onChange={profileFormik.handleChange}
                onBlur={profileFormik.handleBlur}
                error={profileFormik.touched.date_of_birth && Boolean(profileFormik.errors.date_of_birth)}
                helperText={profileFormik.touched.date_of_birth && profileFormik.errors.date_of_birth}
              />
              
              <TextField
                fullWidth
                id="address"
                name="address"
                label="Address"
                margin="normal"
                multiline
                rows={3}
                value={profileFormik.values.address}
                onChange={profileFormik.handleChange}
                onBlur={profileFormik.handleBlur}
                error={profileFormik.touched.address && Boolean(profileFormik.errors.address)}
                helperText={profileFormik.touched.address && profileFormik.errors.address}
              />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="city"
                    name="city"
                    label="City"
                    margin="normal"
                    value={profileFormik.values.city}
                    onChange={profileFormik.handleChange}
                    onBlur={profileFormik.handleBlur}
                    error={profileFormik.touched.city && Boolean(profileFormik.errors.city)}
                    helperText={profileFormik.touched.city && profileFormik.errors.city}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="postal_code"
                    name="postal_code"
                    label="Postal Code"
                    margin="normal"
                    value={profileFormik.values.postal_code}
                    onChange={profileFormik.handleChange}
                    onBlur={profileFormik.handleBlur}
                    error={profileFormik.touched.postal_code && Boolean(profileFormik.errors.postal_code)}
                    helperText={profileFormik.touched.postal_code && profileFormik.errors.postal_code}
                  />
                </Grid>
              </Grid>
              
              <TextField
                fullWidth
                id="country"
                name="country"
                label="Country"
                margin="normal"
                value={profileFormik.values.country}
                onChange={profileFormik.handleChange}
                onBlur={profileFormik.handleBlur}
                error={profileFormik.touched.country && Boolean(profileFormik.errors.country)}
                helperText={profileFormik.touched.country && profileFormik.errors.country}
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
      
      {/* Security Section */}
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