import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

// Hotel background image
const HOTEL_BG_IMAGE = '/images/login-bg.jpg';

const validationSchema = Yup.object({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required'),
});

// Get redirect path based on user role
const getRedirectPath = (user) => {
  const role = user?.role;
  console.log('getRedirectPath called with user:', user, 'role:', role);

  if (!role) {
    console.log('No role found, redirecting to home');
    return '/';
  }

  switch (role) {
    case 'admin':
      return '/dashboard';
    case 'manager':
      return '/manager/hotel';
    case 'staff':
      return '/dashboard';
    case 'guest':
    default:
      return '/';
  }
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // If user was trying to access a specific page, redirect there after login
  // Otherwise, use role-based redirect
  // Preserve both pathname AND search query string (for booking details, etc.)
  const fromLocation = location.state?.from;
  const intendedPath = fromLocation
    ? `${fromLocation.pathname}${fromLocation.search || ''}`
    : null;

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
      remember: false,
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setError('');

        const result = await login(values.username, values.password);

        if (result.success) {
          // Get user from response or from localStorage as fallback
          const userFromResponse = result.data?.user;
          const userFromStorage = JSON.parse(localStorage.getItem('user'));
          const loggedInUser = userFromResponse || userFromStorage;

          console.log('Login successful!');
          console.log('result.data:', result.data);
          console.log('userFromResponse:', userFromResponse);
          console.log('userFromStorage:', userFromStorage);
          console.log('loggedInUser:', loggedInUser);

          // Use intended path if user was redirected, otherwise use role-based redirect
          const redirectPath = intendedPath || getRedirectPath(loggedInUser);
          console.log('Redirecting to:', redirectPath);
          navigate(redirectPath, { replace: true });
        } else {
          setError(result.error || 'Incorrect username or password. Please try again.');
        }
      } catch (err) {
        setError('An unexpected error occurred. Please try again.');
        console.error('Login error:', err);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: '#f5f5f5',
      }}
    >
      {/* Left Side - Hotel Image */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          p: 6,
          pr: 10,
          mr: -6,
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: `url(${HOTEL_BG_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.2) 100%)',
          }}
        />

        {/* Content */}
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 500 }}>
          {/* Logo */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mb: 4,
            }}
          >
            <Box
              component="img"
              src="/logo-admin.png"
              alt="LuxeStay Hotels"
              sx={{
                height: 48,
                width: 'auto',
                borderRadius: 1,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
            />
          </Box>

          <Typography
            sx={{
              color: 'white',
              fontWeight: 600,
              fontSize: { md: '2.5rem', lg: '3rem' },
              lineHeight: 1.2,
              mb: 2,
              letterSpacing: '-0.02em',
            }}
          >
            Welcome back to luxury
          </Typography>

          <Typography
            sx={{
              color: 'rgba(255,255,255,0.85)',
              fontWeight: 400,
              fontSize: '1.1rem',
              lineHeight: 1.6,
              maxWidth: 400,
            }}
          >
            Sign in to manage your bookings and discover exceptional stays around the world.
          </Typography>
        </Box>
      </Box>

      {/* Right Side - Login Form */}
      <Box
        sx={{
          flex: { xs: 1, md: '0 0 480px' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          bgcolor: 'white',
          borderRadius: { xs: 0, md: '32px 0 0 32px' },
          boxShadow: { md: '-20px 0 60px rgba(0,0,0,0.15)' },
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box sx={{ p: { xs: 4, sm: 6 }, maxWidth: 400, mx: 'auto', width: '100%' }}>
          {/* Mobile Logo */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              justifyContent: 'center',
              mb: 4,
            }}
          >
            <Box
              component="img"
              src="/logo-admin.png"
              alt="LuxeStay Hotels"
              sx={{
                height: 48,
                width: 'auto',
                borderRadius: 1,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
            />
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#1a1a2e',
              mb: 1,
            }}
          >
            Sign In
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              mb: 4,
            }}
          >
            Enter your credentials to access your account
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 1,
                '& .MuiAlert-icon': {
                  alignItems: 'center',
                },
              }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={formik.handleSubmit} noValidate>
            <TextField
              fullWidth
              id="username"
              name="username"
              label="Username"
              placeholder="Enter your username"
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.username && Boolean(formik.errors.username)}
              helperText={formik.touched.username && formik.errors.username}
              autoComplete="username"
              autoFocus
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  bgcolor: '#f8f9fa',
                  '&:hover': {
                    bgcolor: '#f8f9fa',
                  },
                  '&.Mui-focused': {
                    bgcolor: 'white',
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              id="password"
              name="password"
              label="Password"
              placeholder="Enter your password"
              type={showPassword ? 'text' : 'password'}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              autoComplete="current-password"
              sx={{
                mb: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  bgcolor: '#f8f9fa',
                  '&:hover': {
                    bgcolor: '#f8f9fa',
                  },
                  '&.Mui-focused': {
                    bgcolor: 'white',
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    id="remember"
                    name="remember"
                    checked={formik.values.remember}
                    onChange={formik.handleChange}
                    size="small"
                    sx={{
                      color: 'text.secondary',
                      '&.Mui-checked': {
                        color: '#667eea',
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    Remember me
                  </Typography>
                }
              />

              <Link
                to="/auth/password-reset"
                style={{
                  textDecoration: 'none',
                  color: '#667eea',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={formik.isSubmitting}
              sx={{
                py: 1.5,
                borderRadius: 1,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                  transform: 'translateY(-1px)',
                },
                '&:disabled': {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  opacity: 0.7,
                },
              }}
            >
              {formik.isSubmitting ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} sx={{ color: 'white' }} />
                  <span>Signing in...</span>
                </Box>
              ) : (
                'Sign In'
              )}
            </Button>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  style={{
                    textDecoration: 'none',
                    color: '#667eea',
                    fontWeight: 600,
                  }}
                >
                  Create account
                </Link>
              </Typography>
            </Box>
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 6, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              &copy; {new Date().getFullYear()} LuxeStay Hotels. All rights reserved.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
