import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Link,
} from '@mui/material';
import {
  Smartphone as PhoneIcon,
  Email as EmailIcon,
  Key as KeyIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import authService from '../../services/authService';

const TwoFactorVerify = ({ tempToken, userEmail, onSuccess, onCancel }) => {
  const [method, setMethod] = useState('totp');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleMethodChange = (event, newMethod) => {
    if (newMethod) {
      setMethod(newMethod);
      setCode('');
      setError('');
    }
  };

  const handleSendEmailCode = async () => {
    setSendingEmail(true);
    setError('');

    const result = await authService.requestEmailOTP(tempToken);

    if (result.success) {
      setEmailSent(true);
    } else {
      setError(result.error);
    }

    setSendingEmail(false);
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      setError('Please enter a code');
      return;
    }

    setLoading(true);
    setError('');

    const result = await authService.verify2FA(tempToken, code, method);

    if (result.success) {
      onSuccess(result.data);
    } else {
      setError(result.error);
      if (result.remainingAttempts !== undefined) {
        setError(`${result.error} (${result.remainingAttempts} attempts remaining)`);
      }
    }

    setLoading(false);
  };

  const getCodePlaceholder = () => {
    switch (method) {
      case 'totp':
        return '000000';
      case 'email':
        return '000000';
      case 'backup':
        return 'XXXX-XXXX';
      default:
        return '';
    }
  };

  const getCodeLabel = () => {
    switch (method) {
      case 'totp':
        return 'Enter code from your authenticator app';
      case 'email':
        return 'Enter code sent to your email';
      case 'backup':
        return 'Enter one of your backup codes';
      default:
        return 'Enter verification code';
    }
  };

  const handleCodeChange = (e) => {
    let val = e.target.value;
    if (method === 'totp' || method === 'email') {
      val = val.replace(/\D/g, '').slice(0, 6);
    } else {
      val = val.toUpperCase().slice(0, 9);
    }
    setCode(val);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Icon */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SecurityIcon sx={{ fontSize: 28, color: '#667eea' }} />
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, textAlign: 'center' }}>
        Choose a verification method to complete your login.
      </Typography>

      {/* Compact Toggle Buttons */}
      <ToggleButtonGroup
        value={method}
        exclusive
        onChange={handleMethodChange}
        fullWidth
        size="small"
        sx={{
          mb: 2.5,
          '& .MuiToggleButton-root': {
            py: 0.75,
            px: 1,
            fontSize: '0.75rem',
            textTransform: 'none',
            borderRadius: '8px !important',
            border: '1px solid',
            borderColor: 'divider',
            '&.Mui-selected': {
              bgcolor: 'rgba(102, 126, 234, 0.1)',
              borderColor: '#667eea',
              color: '#667eea',
              '&:hover': {
                bgcolor: 'rgba(102, 126, 234, 0.15)',
              },
            },
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.04)',
            },
          },
          '& .MuiToggleButtonGroup-grouped:not(:first-of-type)': {
            marginLeft: '8px',
            borderLeft: '1px solid',
            borderColor: 'divider',
          },
          '& .MuiToggleButtonGroup-grouped:first-of-type': {
            borderRadius: '8px !important',
          },
          '& .MuiToggleButtonGroup-grouped:last-of-type': {
            borderRadius: '8px !important',
          },
        }}
      >
        <ToggleButton value="totp">
          <PhoneIcon sx={{ fontSize: 16, mr: 0.5 }} />
          App
        </ToggleButton>
        <ToggleButton value="email">
          <EmailIcon sx={{ fontSize: 16, mr: 0.5 }} />
          Email
        </ToggleButton>
        <ToggleButton value="backup">
          <KeyIcon sx={{ fontSize: 16, mr: 0.5 }} />
          Backup
        </ToggleButton>
      </ToggleButtonGroup>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            borderRadius: 2,
            '& .MuiAlert-icon': { alignItems: 'center' },
          }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {method === 'email' && !emailSent && (
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            We&apos;ll send a verification code to {userEmail || 'your email'}.
          </Typography>
          <Button
            variant="outlined"
            onClick={handleSendEmailCode}
            disabled={sendingEmail}
            size="small"
            startIcon={sendingEmail ? <CircularProgress size={16} /> : <EmailIcon sx={{ fontSize: 18 }} />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            {sendingEmail ? 'Sending...' : 'Send Code'}
          </Button>
        </Box>
      )}

      {(method !== 'email' || emailSent) && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
            {getCodeLabel()}
          </Typography>
          <TextField
            fullWidth
            value={code}
            onChange={handleCodeChange}
            placeholder={getCodePlaceholder()}
            size="small"
            inputProps={{
              style: {
                textAlign: 'center',
                fontSize: '1.25rem',
                letterSpacing: method === 'backup' ? '0.1rem' : '0.4rem',
                fontFamily: 'monospace',
                padding: '10px 14px',
              },
            }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </>
      )}

      {method === 'email' && emailSent && (
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Alert severity="success" sx={{ mb: 1, borderRadius: 2, py: 0 }}>
            <Typography variant="body2">Code sent to {userEmail}</Typography>
          </Alert>
          <Link
            component="button"
            variant="body2"
            onClick={handleSendEmailCode}
            disabled={sendingEmail}
            sx={{ fontSize: '0.8rem' }}
          >
            Resend code
          </Link>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={loading}
          fullWidth
          sx={{
            borderRadius: 2,
            py: 1,
            textTransform: 'none',
            fontWeight: 500,
            borderColor: 'divider',
            color: 'text.secondary',
            '&:hover': {
              borderColor: 'text.secondary',
              bgcolor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleVerify}
          disabled={loading || !code.trim() || (method === 'email' && !emailSent)}
          fullWidth
          sx={{
            borderRadius: 2,
            py: 1,
            textTransform: 'none',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
            },
            '&.Mui-disabled': {
              background: '#e0e0e0',
              color: '#9e9e9e',
            },
          }}
        >
          {loading ? (
            <CircularProgress size={20} sx={{ color: 'white' }} />
          ) : (
            'Verify'
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default TwoFactorVerify;
