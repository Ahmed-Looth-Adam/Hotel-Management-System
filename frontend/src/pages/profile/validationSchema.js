import * as Yup from 'yup';

const PasswordChangeSchema = Yup.object().shape({
  current_password: Yup.string()
    .min(8, 'Must be at least 8 characters')
    .required('Current password is required to change password.'),
  
  new_password: Yup.string()
    .min(8, 'Must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain at least one lowercase letter')
    .notOneOf([Yup.ref('current_password'), null], 'New password must be different from current password'),
    
  confirm_new_password: Yup.string()
    .oneOf([Yup.ref('new_password'), null], 'Passwords must match')
    .required('Confirm new password is required'),
});

const ProfileSchema = Yup.object().shape({
  name: Yup.string()
    .max(50, 'Too Long!')
    .required('Name is required.'),
  email: Yup.string()
    .email('Invalid email format.')
    .required('Email is required.'),

  phone_number: Yup.string()
    .min(7, 'Must be at least 7 digits.') 
    .nullable(true),
});

export const PasswordResetRequestSchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
});

export const PasswordResetConfirmSchema = Yup.object().shape({
  new_password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('New password is required'),
  confirm_new_password: Yup.string()
    .oneOf([Yup.ref('new_password'), null], 'Passwords must match')
    .required('Confirm new password is required'),
});

export { ProfileSchema, PasswordChangeSchema };
