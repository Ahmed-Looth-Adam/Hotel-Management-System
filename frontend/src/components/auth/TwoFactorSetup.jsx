import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  QrCode2 as QrCodeIcon,
  Security as SecurityIcon,
  Close as CloseIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import authService from '../../services/authService';

const steps = ['Scan QR Code', 'Verify Code', 'Save Backup Codes'];

const TwoFactorSetup = ({ open, onClose, onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [copied, setCopied] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    setError('');

    const result = await authService.setup2FA();

    if (result.success) {
      setQrCode(result.data.qr_code);
      setSecret(result.data.secret);
      setActiveStep(0);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    const result = await authService.confirm2FA(verificationCode);

    if (result.success) {
      setBackupCodes(result.data.backup_codes);
      setActiveStep(2);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleComplete = () => {
    onComplete?.();
    handleClose();
  };

  const handleClose = () => {
    setActiveStep(0);
    setQrCode('');
    setSecret('');
    setVerificationCode('');
    setBackupCodes([]);
    setError('');
    setCopied(false);
    onClose();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBackupCodes = () => {
    const content = `Hotel Management System - 2FA Backup Codes
================================================
Generated: ${new Date().toLocaleString()}

Keep these codes in a safe place. Each code can only be used once.

${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

================================================
If you lose access to your authenticator app, you can use one of
these codes to log in. After using a code, it becomes invalid.
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hms-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const SectionHeader = ({ icon: Icon, title }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
      <Icon sx={{ fontSize: 16, color: 'primary.main' }} />
      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </Typography>
    </Box>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            {!qrCode ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                  }}
                >
                  <SecurityIcon sx={{ fontSize: 40, color: '#667eea' }} />
                </Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Enable Two-Factor Authentication
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 360, mx: 'auto' }}>
                  Add an extra layer of security to your account using an authenticator app
                  like Google Authenticator or Authy.
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleStart}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <QrCodeIcon />}
                  sx={{
                    borderRadius: 2,
                    px: 4,
                    py: 1.25,
                    textTransform: 'none',
                    fontWeight: 600,
                    bgcolor: '#000000',
                    '&:hover': { bgcolor: '#1a1a1a' },
                  }}
                >
                  {loading ? 'Setting up...' : 'Start Setup'}
                </Button>
              </Box>
            ) : (
              <Box>
                <SectionHeader icon={QrCodeIcon} title="Scan QR Code" />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Open your authenticator app and scan this QR code to add your account.
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mb: 3,
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: 'white',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <img
                      src={`data:image/png;base64,${qrCode}`}
                      alt="2FA QR Code"
                      style={{ width: 180, height: 180, display: 'block' }}
                    />
                  </Paper>
                </Box>

                <SectionHeader icon={SecurityIcon} title="Manual Entry" />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Can&apos;t scan? Enter this code manually in your app:
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1.5,
                    bgcolor: 'grey.50',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.95rem',
                      letterSpacing: 2,
                      flex: 1,
                      wordBreak: 'break-all',
                    }}
                  >
                    {secret}
                  </Typography>
                  <Tooltip title={copied ? "Copied!" : "Copy secret"}>
                    <IconButton size="small" onClick={() => copyToClipboard(secret)}>
                      {copied ? <CheckIcon fontSize="small" color="success" /> : <CopyIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <SectionHeader icon={SecurityIcon} title="Verify Setup" />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter the 6-digit code from your authenticator app to confirm setup.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <TextField
                value={verificationCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerificationCode(val);
                }}
                placeholder="000000"
                inputProps={{
                  maxLength: 6,
                  style: {
                    textAlign: 'center',
                    fontSize: '1.75rem',
                    letterSpacing: '0.5rem',
                    fontFamily: 'monospace',
                    padding: '12px 16px',
                  },
                }}
                sx={{
                  width: 220,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
              The code refreshes every 30 seconds
            </Typography>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Alert
              severity="success"
              sx={{
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-icon': { alignItems: 'center' },
              }}
            >
              Two-factor authentication is now enabled!
            </Alert>

            <SectionHeader icon={SecurityIcon} title="Backup Codes" />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Save these backup codes in a secure location. You can use them to log in if you
              lose access to your authenticator app.
            </Typography>

            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              Each code can only be used once. These codes will not be shown again.
            </Alert>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 1,
                }}
              >
                {backupCodes.map((code, index) => (
                  <Typography
                    key={index}
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      p: 1,
                      bgcolor: 'white',
                      borderRadius: 1,
                      textAlign: 'center',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {code}
                  </Typography>
                ))}
              </Box>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<CopyIcon />}
                onClick={() => copyToClipboard(backupCodes.join('\n'))}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                {copied ? 'Copied!' : 'Copy All'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={downloadBackupCodes}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                Download
              </Button>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(180deg, #1a1f37 0%, #0f1225 100%)',
          color: '#ffffff',
          px: 3,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              width: 36,
              height: 36,
            }}
          >
            <SecurityIcon fontSize="small" />
          </Avatar>
          <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#ffffff' }}>
            Two-Factor Authentication Setup
          </Typography>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: '#ffffff' }} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          px: 3,
          py: 2,
          maxHeight: 'calc(90vh - 140px)',
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'transparent',
            borderRadius: '3px',
            transition: 'background 0.2s ease',
          },
          '&:hover::-webkit-scrollbar-thumb': {
            background: 'rgba(0, 0, 0, 0.2)',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(0, 0, 0, 0.3)',
          },
          scrollbarWidth: 'thin',
          scrollbarColor: 'transparent transparent',
          '&:hover': {
            scrollbarColor: 'rgba(0, 0, 0, 0.2) transparent',
          },
        }}
      >
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 3, pt: 1 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {renderStepContent()}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 1.5,
          bgcolor: 'grey.50',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        {activeStep === 2 ? (
          <Button
            variant="contained"
            onClick={handleComplete}
            sx={{
              borderRadius: 2,
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#000000',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              '&:hover': {
                bgcolor: '#1a1a1a',
              },
            }}
          >
            Done
          </Button>
        ) : (
          <>
            <Button
              onClick={handleClose}
              color="inherit"
              disabled={loading}
              sx={{
                borderRadius: 2,
                px: 3,
                textTransform: 'none',
                fontWeight: 500,
              }}
            >
              Cancel
            </Button>
            {qrCode && activeStep === 0 && (
              <Button
                variant="contained"
                onClick={() => setActiveStep(1)}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: '#000000',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                  '&:hover': {
                    bgcolor: '#1a1a1a',
                  },
                }}
              >
                Next
              </Button>
            )}
            {activeStep === 1 && (
              <>
                <Button
                  variant="outlined"
                  onClick={() => setActiveStep(0)}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 500,
                  }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleVerify}
                  disabled={loading || verificationCode.length !== 6}
                  sx={{
                    borderRadius: 2,
                    px: 4,
                    textTransform: 'none',
                    fontWeight: 600,
                    bgcolor: '#000000',
                    color: '#ffffff',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                    '&:hover': {
                      bgcolor: '#1a1a1a',
                    },
                    '&.Mui-disabled': {
                      bgcolor: '#cccccc',
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={22} sx={{ color: 'white' }} />
                  ) : (
                    'Verify'
                  )}
                </Button>
              </>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TwoFactorSetup;
