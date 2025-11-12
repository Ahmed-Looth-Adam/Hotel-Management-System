/**
 * Input Component - Reusable MUI TextField wrapper with consistent styling
 *
 * A standardized input component that wraps MUI's TextField with hotel theme styling.
 * Supports all TextField variants, validation states, and helper text.
 *
 * Usage:
 *   <Input label="Email" type="email" required />
 *   <Input label="Password" type="password" helperText="Min 8 characters" />
 *   <Input label="Search" startAdornment={<SearchIcon />} />
 *   <Input label="Price" type="number" endAdornment="USD" error errorText="Invalid price" />
 *
 * Edited By:
 * -> Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { TextField, InputAdornment } from '@mui/material';
import PropTypes from 'prop-types';

function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error = false,
  errorText = '',
  helperText = '',
  required = false,
  disabled = false,
  fullWidth = true,
  multiline = false,
  rows = 4,
  variant = 'outlined',
  size = 'medium',
  startAdornment,
  endAdornment,
  className = '',
  ...props
}) {
  return (
    <TextField
      label={label}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={error}
      helperText={error ? errorText : helperText}
      required={required}
      disabled={disabled}
      fullWidth={fullWidth}
      multiline={multiline}
      rows={multiline ? rows : undefined}
      variant={variant}
      size={size}
      className={className}
      InputProps={{
        startAdornment: startAdornment ? (
          <InputAdornment position="start">{startAdornment}</InputAdornment>
        ) : null,
        endAdornment: endAdornment ? (
          <InputAdornment position="end">{endAdornment}</InputAdornment>
        ) : null,
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          backgroundColor: disabled ? 'action.disabledBackground' : 'background.paper',
          '&:hover fieldset': {
            borderColor: error ? 'error.main' : 'primary.main',
          },
          '&.Mui-focused fieldset': {
            borderWidth: 2,
          },
        },
        '& .MuiInputLabel-root': {
          fontWeight: 500,
        },
        ...props.sx,
      }}
      {...props}
    />
  );
}

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.oneOf([
    'text',
    'email',
    'password',
    'number',
    'tel',
    'url',
    'date',
    'time',
    'datetime-local',
  ]),
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  error: PropTypes.bool,
  errorText: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  multiline: PropTypes.bool,
  rows: PropTypes.number,
  variant: PropTypes.oneOf(['outlined', 'filled', 'standard']),
  size: PropTypes.oneOf(['small', 'medium']),
  startAdornment: PropTypes.node,
  endAdornment: PropTypes.node,
  className: PropTypes.string,
};

export default Input;
