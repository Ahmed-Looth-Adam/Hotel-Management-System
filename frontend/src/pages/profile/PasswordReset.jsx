import React, { useState } from 'react';
import { useFormik } from 'formik';
import { Link as RouterLink } from 'react-router-dom';
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
import { PasswordResetRequestSchema } from './validationSchema'; // Adjust path as needed
import authService from '../../services/authService'; // Adjust path as needed

const PasswordReset = () => {
  const [serverSuccess, setServerSuccess] = useState('');
  const [serverError, setServerError] = useState('');

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: PasswordResetRequestSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError('');
      setServerSuccess('');

      try {
        const response = await authService.requestPasswordReset(values.email);

        if (response.success) {
          setServerSuccess(response.message || 'Check your email for the reset link.');
        } else {
          setServerError(response.error);
        }
      } catch (error) {
        setServerError('An unexpected error occurred. Please try again later.');
      } finally {
        setSubmitting(false);
      }
    },
  });

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
            Reset Password
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
            Enter your email address and we'll send you a link to reset your password.
          </Typography>

          {serverSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {serverSuccess}
            </Alert>
          )}

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
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              disabled={formik.isSubmitting || !!serverSuccess} // Disable if success to prevent double send
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={formik.isSubmitting || !!serverSuccess}
            >
              {formik.isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Send Reset Link'
              )}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link component={RouterLink} to="/login" variant="body2">
                {"Back to Login"}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default PasswordReset;