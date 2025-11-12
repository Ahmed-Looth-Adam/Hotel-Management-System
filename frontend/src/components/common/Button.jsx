/**
 * Button Component - Reusable MUI Button wrapper with Tailwind enhancements
 *
 * A consistent button component that combines MUI's Button with Tailwind utility classes
 * for the Hotel Management System. Supports all MUI Button variants and colors.
 *
 * Usage:
 *   <Button variant="contained" color="primary">Click Me</Button>
 *   <Button variant="outlined" size="large" fullWidth>Submit</Button>
 *   <Button variant="text" startIcon={<AddIcon />}>Add Room</Button>
 *
 * Edited By:
 * -> Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { Button as MuiButton } from '@mui/material';
import PropTypes from 'prop-types';

function Button({
  children,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  startIcon,
  endIcon,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  // Tailwind classes for additional styling
  const tailwindClasses = `
    transition-all duration-200 ease-in-out
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim();

  return (
    <MuiButton
      variant={variant}
      color={color}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      startIcon={startIcon}
      endIcon={endIcon}
      className={tailwindClasses}
      onClick={onClick}
      type={type}
      sx={{
        textTransform: 'none', // Remove uppercase (already in theme)
        fontWeight: 500,
        borderRadius: 2,
        px: size === 'large' ? 4 : size === 'small' ? 2 : 3,
        py: size === 'large' ? 1.5 : size === 'small' ? 0.75 : 1,
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </MuiButton>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['contained', 'outlined', 'text']),
  color: PropTypes.oneOf([
    'primary',
    'secondary',
    'success',
    'error',
    'warning',
    'info',
    'inherit',
  ]),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  className: PropTypes.string,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

export default Button;
