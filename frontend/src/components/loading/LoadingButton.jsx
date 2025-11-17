/**
 * LoadingButton - Button with loading state
 *
 * Features:
 * - Shows spinner when loading
 * - Disables interaction during loading
 * - Maintains button size during loading
 * - All Material-UI Button props supported
 *
 * Usage:
 * <LoadingButton loading={isLoading} onClick={handleSubmit}>
 *   Submit
 * </LoadingButton>
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { Button, CircularProgress } from '@mui/material';

const LoadingButton = ({
  loading = false,
  children,
  disabled,
  startIcon,
  ...props
}) => {
  return (
    <Button
      {...props}
      disabled={loading || disabled}
      startIcon={loading ? <CircularProgress size={20} /> : startIcon}
    >
      {children}
    </Button>
  );
};

export default LoadingButton;
