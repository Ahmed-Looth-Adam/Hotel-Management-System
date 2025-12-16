// src/pages/auth/PasswordResetConfirm.jsx

import React, { useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useFormik } from 'formik';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { PasswordResetConfirmSchema } from './validationSchema'; // Adjust path
import authService from '../../services/authService'; // Adjust path

const PasswordResetConfirm = () => {
  const { uid, token } = useParams(); // Extract uid and token from the URL
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [resetCompleted, setResetCompleted] = useState(false);

  const formik = useFormik({
    initialValues: {
      new_password: '',
      confirm_new_password: '',
    },
    validationSchema: PasswordResetConfirmSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError('');

      // Check if we have the necessary URL parameters
      if (!uid || !token) {
        setServerError('Missing verification parameters. Please use the link from your email.');
        setSubmitting(false);
        return;
      }

      try {
        const response = await authService.confirmPasswordReset(
          uid,
          token,
          values.new_password
        );

        if (response.success) {
          setResetCompleted(true);
          // Redirect to login after a brief pause
          setTimeout(() => navigate('/login'), 3000);
        } else {
          // This handles backend errors like invalid/expired token or password validation
          setServerError(response.error || 'Password reset failed. Please try again.');
        }
      } catch (error) {
        setServerError('An unexpected network error occurred.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (resetCompleted) {
    return (
      <Container component="main" maxWidth="xs">
        <Box sx={{ marginTop: 8, textAlign: 'center' }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Password reset successful! Redirecting you to the login page...
          </Alert>
          <Link component={RouterLink} to="/login" variant="body2">
            Click here to login immediately
          </Link>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Set New Password
          </Typography>

          {serverError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {serverError}
            </Alert>
          )}

          <Box component="form" onSubmit={formik.handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              name="new_password"
              label="New Password"
              type="password"
              id="new_password"
              value={formik.values.new_password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.new_password && Boolean(formik.errors.new_password)}
              helperText={formik.touched.new_password && formik.errors.new_password}
              disabled={formik.isSubmitting}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirm_new_password"
              label="Confirm New Password"
              type="password"
              id="confirm_new_password"
              value={formik.values.confirm_new_password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.confirm_new_password && Boolean(formik.errors.confirm_new_password)}
              helperText={formik.touched.confirm_new_password && formik.errors.confirm_new_password}
              disabled={formik.isSubmitting}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Change Password'
              )}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default PasswordResetConfirm;