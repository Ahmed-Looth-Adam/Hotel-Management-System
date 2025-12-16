/**
 * Settings Page - System configuration and preferences
 *
 * Features:
 * - System settings
 * - Notification preferences
 * - Security settings
 * - About information
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Tabs,
  Tab,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications,
  Security,
  Info,
  Email,
  Schedule,
  Storage,
  Language,
  Palette,
  Save,
  Refresh,
} from '@mui/icons-material';
import { useNotification } from '../../hooks/useNotification';

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const Settings = () => {
  const { showSuccess, showInfo } = useNotification();
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState({
    // General
    hotelName: 'Hotel Management System',
    defaultCurrency: 'GBP',
    timezone: 'Europe/London',
    language: 'en',
    // Notifications
    emailNotifications: true,
    bookingAlerts: true,
    paymentAlerts: true,
    maintenanceAlerts: false,
    // Security
    sessionTimeout: 30,
    twoFactorAuth: false,
    passwordExpiry: 90,
    loginAttempts: 5,
  });

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleSave = () => {
    // In production, this would save to backend
    showSuccess('Settings saved successfully');
  };

  const handleReset = () => {
    showInfo('Settings reset to default values');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <SettingsIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" component="h1">
          Settings
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<SettingsIcon />} label="General" iconPosition="start" />
          <Tab icon={<Notifications />} label="Notifications" iconPosition="start" />
          <Tab icon={<Security />} label="Security" iconPosition="start" />
          <Tab icon={<Info />} label="About" iconPosition="start" />
        </Tabs>

        {/* General Settings */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="System Name"
                  value={settings.hotelName}
                  onChange={(e) => handleChange('hotelName', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Default Currency"
                  value={settings.defaultCurrency}
                  onChange={(e) => handleChange('defaultCurrency', e.target.value)}
                  select
                  SelectProps={{ native: true }}
                >
                  <option value="GBP">GBP (£)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Timezone"
                  value={settings.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  select
                  SelectProps={{ native: true }}
                >
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Language"
                  value={settings.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  select
                  SelectProps={{ native: true }}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </TextField>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Notification Settings */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Email />
                </ListItemIcon>
                <ListItemText
                  primary="Email Notifications"
                  secondary="Receive important updates via email"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider variant="inset" component="li" />
              <ListItem>
                <ListItemIcon>
                  <Notifications />
                </ListItemIcon>
                <ListItemText
                  primary="Booking Alerts"
                  secondary="Get notified for new bookings and changes"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.bookingAlerts}
                    onChange={(e) => handleChange('bookingAlerts', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider variant="inset" component="li" />
              <ListItem>
                <ListItemIcon>
                  <Notifications />
                </ListItemIcon>
                <ListItemText
                  primary="Payment Alerts"
                  secondary="Notifications for payment activities"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.paymentAlerts}
                    onChange={(e) => handleChange('paymentAlerts', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider variant="inset" component="li" />
              <ListItem>
                <ListItemIcon>
                  <Notifications />
                </ListItemIcon>
                <ListItemText
                  primary="Maintenance Alerts"
                  secondary="System maintenance and update notifications"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.maintenanceAlerts}
                    onChange={(e) => handleChange('maintenanceAlerts', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Box>
        </TabPanel>

        {/* Security Settings */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Security settings affect all users. Changes take effect immediately.
            </Alert>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Session Timeout (minutes)"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 5, max: 120 } }}
                  helperText="Automatically log out inactive users"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Login Attempts"
                  type="number"
                  value={settings.loginAttempts}
                  onChange={(e) => handleChange('loginAttempts', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 3, max: 10 } }}
                  helperText="Lock account after failed attempts"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Password Expiry (days)"
                  type="number"
                  value={settings.passwordExpiry}
                  onChange={(e) => handleChange('passwordExpiry', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 30, max: 365 } }}
                  helperText="Force password change after this period"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.twoFactorAuth}
                      onChange={(e) => handleChange('twoFactorAuth', e.target.checked)}
                    />
                  }
                  label="Require Two-Factor Authentication for Admin Users"
                />
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* About */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      System Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="text.secondary">Version</Typography>
                        <Typography>1.0.0</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="text.secondary">Build</Typography>
                        <Typography>2024.12.16</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="text.secondary">Environment</Typography>
                        <Typography>Development</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Development Team
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body2" paragraph>
                      Hotel Management System developed as part of university coursework.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Contributors:
                    </Typography>
                    <Typography variant="body2">
                      - Ismail Wasiu Abdul Samad (24050765)
                    </Typography>
                    <Typography variant="body2">
                      - Ahmed Looth Adam (24050761)
                    </Typography>
                    <Typography variant="body2">
                      - Ibrahim Waseem (24053101)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>

      {/* Action Buttons */}
      {tabValue < 3 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleReset}
          >
            Reset to Default
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default Settings;
