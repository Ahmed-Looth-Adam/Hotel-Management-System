import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Collapse,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  ExpandMore,
  ExpandLess,
  Phone as PhoneIcon,
  Home as HomeIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import authService from '../../services/authService';

// Hotel background image (different from login for variety)
const HOTEL_BG_IMAGE = '/images/register-bg.jpg';

const validationSchema = Yup.object({
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(150, 'Username must not exceed 150 characters')
    .required('Username is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Must contain uppercase, lowercase, and number'
    )
    .required('Password is required'),
  password2: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Please confirm your password'),
  first_name: Yup.string()
    .max(150, 'First name must not exceed 150 characters'),
  last_name: Yup.string()
    .max(150, 'Last name must not exceed 150 characters'),
  phone_number: Yup.string()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, {
      message: 'Invalid phone number',
      excludeEmptyString: true,
    })
    .nullable(),
  date_of_birth: Yup.date()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .max(new Date(), 'Date of birth cannot be in the future')
    .nullable(),
  address: Yup.string()
    .max(500, 'Address must not exceed 500 characters'),
  city: Yup.string()
    .max(100, 'City must not exceed 100 characters'),
  country: Yup.string()
    .max(100, 'Country must not exceed 100 characters'),
  postal_code: Yup.string()
    .max(20, 'Postal code must not exceed 20 characters'),
});

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const formik = useFormik({
    initialValues: {
      username: '',
      email: '',
      password: '',
      password2: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      date_of_birth: '',
      address: '',
      city: '',
      country: '',
      postal_code: '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError('');
      setSuccess('');

      // Clean up empty optional fields (remove empty strings and null values)
      const cleanedValues = Object.fromEntries(
        Object.entries(values).filter(([_, v]) => v !== '' && v !== null)
      );

      const result = await authService.register(cleanedValues);

      if (result.success) {
        // Check if email verification is required
        if (result.data?.email_verification_required) {
          setSuccess('Registration successful! Redirecting to email verification...');
          setTimeout(() => {
            navigate('/verify-email', { state: { email: result.data.email } });
          }, 1500);
        } else {
          setSuccess('Registration successful! Redirecting to login...');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      } else {
        const errors = result.error;
        if (typeof errors === 'object') {
          const errorMessages = Object.entries(errors)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('; ');
          setError(errorMessages);
        } else {
          setError(errors || 'Registration failed. Please try again.');
        }
      }

      setSubmitting(false);
    },
  });

  // Common text field styling
  const textFieldSx = {
    mb: 2,
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
  };

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
          display: { xs: 'none', lg: 'flex' },
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
              fontSize: { lg: '2.5rem', xl: '3rem' },
              lineHeight: 1.2,
              mb: 2,
              letterSpacing: '-0.02em',
            }}
          >
            Start your journey today
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
            Create an account to unlock exclusive deals and manage your bookings with ease.
          </Typography>
        </Box>
      </Box>

      {/* Right Side - Registration Form */}
      <Box
        sx={{
          flex: { xs: 1, lg: '0 0 540px' },
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'white',
          borderRadius: { xs: 0, lg: '32px 0 0 32px' },
          boxShadow: { lg: '-20px 0 60px rgba(0,0,0,0.15)' },
          overflowY: 'auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box sx={{ p: { xs: 3, sm: 5 }, maxWidth: 480, mx: 'auto', width: '100%' }}>
          {/* Mobile Logo */}
          <Box
            sx={{
              display: { xs: 'flex', lg: 'none' },
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
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
            Create Account
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              mb: 3,
            }}
          >
            Fill in your details to get started
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius: 1,
              }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert
              severity="success"
              sx={{
                mb: 2,
                borderRadius: 1,
              }}
            >
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={formik.handleSubmit} noValidate>
            {/* Account Information */}
            <Typography
              variant="subtitle2"
              sx={{
                color: '#667eea',
                fontWeight: 600,
                mb: 2,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.75rem',
              }}
            >
              Account Information
            </Typography>

            <TextField
              fullWidth
              id="username"
              name="username"
              label="Username"
              placeholder="Choose a username"
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.username && Boolean(formik.errors.username)}
              helperText={formik.touched.username && formik.errors.username}
              required
              autoFocus
              sx={textFieldSx}
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
              id="email"
              name="email"
              label="Email Address"
              placeholder="Enter your email"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              required
              sx={textFieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                id="password"
                name="password"
                label="Password"
                placeholder="Create password"
                type={showPassword ? 'text' : 'password'}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                required
                sx={textFieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
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

              <TextField
                fullWidth
                id="password2"
                name="password2"
                label="Confirm"
                placeholder="Confirm password"
                type={showPassword2 ? 'text' : 'password'}
                value={formik.values.password2}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password2 && Boolean(formik.errors.password2)}
                helperText={formik.touched.password2 && formik.errors.password2}
                required
                sx={textFieldSx}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword2(!showPassword2)}
                        edge="end"
                        size="small"
                      >
                        {showPassword2 ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Optional Information Toggle */}
            <Button
              fullWidth
              onClick={() => setShowOptional(!showOptional)}
              endIcon={showOptional ? <ExpandLess /> : <ExpandMore />}
              sx={{
                mt: 1,
                mb: 2,
                py: 1.5,
                borderRadius: 1,
                textTransform: 'none',
                color: 'text.secondary',
                bgcolor: '#f8f9fa',
                border: '1px dashed #e0e0e0',
                fontWeight: 500,
                '&:hover': {
                  bgcolor: '#f0f0f0',
                  border: '1px dashed #bdbdbd',
                },
              }}
            >
              {showOptional ? 'Hide' : 'Add'} Personal Details (Optional)
            </Button>

            <Collapse in={showOptional}>
              <Box sx={{ pt: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: '#667eea',
                    fontWeight: 600,
                    mb: 2,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontSize: '0.75rem',
                  }}
                >
                  Personal Details
                </Typography>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    id="first_name"
                    name="first_name"
                    label="First Name"
                    placeholder="First name"
                    value={formik.values.first_name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.first_name && Boolean(formik.errors.first_name)}
                    helperText={formik.touched.first_name && formik.errors.first_name}
                    sx={textFieldSx}
                  />

                  <TextField
                    fullWidth
                    id="last_name"
                    name="last_name"
                    label="Last Name"
                    placeholder="Last name"
                    value={formik.values.last_name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.last_name && Boolean(formik.errors.last_name)}
                    helperText={formik.touched.last_name && formik.errors.last_name}
                    sx={textFieldSx}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    id="phone_number"
                    name="phone_number"
                    label="Phone Number"
                    placeholder="+44 123 456 7890"
                    value={formik.values.phone_number}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.phone_number && Boolean(formik.errors.phone_number)}
                    helperText={formik.touched.phone_number && formik.errors.phone_number}
                    sx={textFieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    id="date_of_birth"
                    name="date_of_birth"
                    label="Date of Birth"
                    type="date"
                    value={formik.values.date_of_birth}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.date_of_birth && Boolean(formik.errors.date_of_birth)}
                    helperText={formik.touched.date_of_birth && formik.errors.date_of_birth}
                    sx={textFieldSx}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Typography
                  variant="subtitle2"
                  sx={{
                    color: '#667eea',
                    fontWeight: 600,
                    mb: 2,
                    mt: 1,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontSize: '0.75rem',
                  }}
                >
                  Address
                </Typography>

                <TextField
                  fullWidth
                  id="address"
                  name="address"
                  label="Street Address"
                  placeholder="Enter your address"
                  value={formik.values.address}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.address && Boolean(formik.errors.address)}
                  helperText={formik.touched.address && formik.errors.address}
                  sx={textFieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <HomeIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    id="city"
                    name="city"
                    label="City"
                    placeholder="City"
                    value={formik.values.city}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.city && Boolean(formik.errors.city)}
                    helperText={formik.touched.city && formik.errors.city}
                    sx={textFieldSx}
                  />

                  <TextField
                    fullWidth
                    id="postal_code"
                    name="postal_code"
                    label="Postal Code"
                    placeholder="Postal code"
                    value={formik.values.postal_code}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.postal_code && Boolean(formik.errors.postal_code)}
                    helperText={formik.touched.postal_code && formik.errors.postal_code}
                    sx={textFieldSx}
                  />
                </Box>

                <TextField
                  fullWidth
                  id="country"
                  name="country"
                  label="Country"
                  placeholder="Country"
                  value={formik.values.country}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.country && Boolean(formik.errors.country)}
                  helperText={formik.touched.country && formik.errors.country}
                  sx={textFieldSx}
                />
              </Box>
            </Collapse>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={formik.isSubmitting}
              sx={{
                mt: 2,
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
                  <span>Creating Account...</span>
                </Box>
              ) : (
                'Create Account'
              )}
            </Button>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link
                  to="/login"
                  style={{
                    textDecoration: 'none',
                    color: '#667eea',
                    fontWeight: 600,
                  }}
                >
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              By creating an account, you agree to our{' '}
              <Link
                to="#"
                style={{
                  textDecoration: 'none',
                  color: '#667eea',
                }}
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                to="#"
                style={{
                  textDecoration: 'none',
                  color: '#667eea',
                }}
              >
                Privacy Policy
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Register;
