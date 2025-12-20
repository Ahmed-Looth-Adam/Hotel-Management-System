import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  MarkEmailRead as EmailIcon,
  Refresh as ResendIcon,
} from '@mui/icons-material';
import authService from '../../services/authService';

// Hotel background image (same as register for consistency)
const HOTEL_BG_IMAGE = '/images/register-bg.jpg';

const EmailVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Redirect if no email in state
  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleCodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(val);
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    const result = await authService.verifyEmail(email, code);

    if (result.success) {
      setSuccess('Email verified successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { state: { verified: true } });
      }, 2000);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleResend = async () => {
    setResending(true);
    setError('');

    const result = await authService.resendVerificationEmail(email);

    if (result.success) {
      setSuccess('Verification code sent to your email.');
      setCountdown(60); // 60 second cooldown
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error);
    }

    setResending(false);
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
            Almost there!
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
            Verify your email to complete registration and start exploring our world-class hotels.
          </Typography>
        </Box>
      </Box>

      {/* Right Side - Verification Form */}
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

          {/* Icon */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <EmailIcon sx={{ fontSize: 32, color: '#667eea' }} />
            </Box>
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#1a1a2e',
              mb: 1,
              textAlign: 'center',
            }}
          >
            Verify Your Email
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              mb: 4,
              textAlign: 'center',
            }}
          >
            We sent a verification code to<br />
            <strong>{email}</strong>
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3, borderRadius: 2 }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              {success}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
            Enter the 6-digit code
          </Typography>

          <TextField
            fullWidth
            value={code}
            onChange={handleCodeChange}
            placeholder="000000"
            inputProps={{
              maxLength: 6,
              style: {
                textAlign: 'center',
                fontSize: '1.5rem',
                letterSpacing: '0.4rem',
                fontFamily: 'monospace',
                padding: '14px',
              },
            }}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: '#f8f9fa',
                '&:hover': {
                  bgcolor: '#f8f9fa',
                },
                '&.Mui-focused': {
                  bgcolor: 'white',
                },
              },
            }}
          />

          <Button
            fullWidth
            variant="contained"
            onClick={handleVerify}
            disabled={loading || code.length !== 6}
            sx={{
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                transform: 'translateY(-1px)',
              },
              '&.Mui-disabled': {
                background: '#e0e0e0',
                color: '#9e9e9e',
              },
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} sx={{ color: 'white' }} />
                <span>Verifying...</span>
              </Box>
            ) : (
              'Verify Email'
            )}
          </Button>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Didn&apos;t receive the code?
            </Typography>
            <Button
              variant="text"
              onClick={handleResend}
              disabled={resending || countdown > 0}
              startIcon={resending ? <CircularProgress size={16} /> : <ResendIcon />}
              sx={{
                textTransform: 'none',
                color: '#667eea',
                fontWeight: 500,
                '&:hover': {
                  bgcolor: 'rgba(102, 126, 234, 0.08)',
                },
              }}
            >
              {countdown > 0
                ? `Resend in ${countdown}s`
                : resending
                ? 'Sending...'
                : 'Resend Code'}
            </Button>
          </Box>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Wrong email?{' '}
              <Link
                to="/register"
                style={{
                  textDecoration: 'none',
                  color: '#667eea',
                  fontWeight: 600,
                }}
              >
                Register again
              </Link>
            </Typography>
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

export default EmailVerification;
