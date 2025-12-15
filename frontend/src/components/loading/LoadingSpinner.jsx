/**
 * LoadingSpinner - Reusable loading spinner component
 *
 * Features:
 * - Multiple sizes (small, medium, large)
 * - Centered or inline display
 * - Optional loading text
 * - Customizable color
 * - Full-screen overlay option
 *
 * Usage:
 * <LoadingSpinner />
 * <LoadingSpinner size="small" text="Loading..." />
 * <LoadingSpinner fullScreen />
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingSpinner = ({
  size = 'medium',
  text = '',
  fullScreen = false,
  centered = true,
  color = 'primary',
}) => {
  // Size mapping
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60,
  };

  const spinnerSize = sizeMap[size] || sizeMap.medium;

  const spinner = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <CircularProgress size={spinnerSize} color={color} />
      {text && (
        <Typography variant="body2" color="text.secondary">
          {text}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.9)',
          zIndex: 9999,
        }}
      >
        {spinner}
      </Box>
    );
  }

  if (centered) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          width: '100%',
        }}
      >
        {spinner}
      </Box>
    );
  }

  return spinner;
};

export default LoadingSpinner;
