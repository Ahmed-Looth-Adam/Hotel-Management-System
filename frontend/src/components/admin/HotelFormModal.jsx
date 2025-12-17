import React, { useState, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Box,
  Alert,
  Switch,
  Rating,
  Typography,
  Avatar,
  IconButton,
  InputAdornment,
  Chip,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  Hotel as HotelIcon,
  Edit as EditIcon,
  Star as StarIcon,
  MeetingRoom as RoomIcon,
  Person as ManagerIcon,
  LocationCity as LocationIcon,
  ToggleOn as StatusIcon,
  Place as AddressIcon,
  Public as CountryIcon,
} from '@mui/icons-material';
import authService from '../../services/authService';

const HotelSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must not exceed 255 characters')
    .required('Hotel name is required'),
  location: Yup.string()
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location must not exceed 100 characters')
    .required('Location is required'),
  address: Yup.string()
    .min(5, 'Address must be at least 5 characters')
    .required('Address is required'),
  city: Yup.string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must not exceed 100 characters')
    .required('City is required'),
  country: Yup.string()
    .min(2, 'Country must be at least 2 characters')
    .max(100, 'Country must not exceed 100 characters')
    .required('Country is required'),
  description: Yup.string().nullable(),
  star_rating: Yup.number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must not exceed 5')
    .required('Star rating is required'),
  room_capacity: Yup.number()
    .min(0, 'Room capacity cannot be negative')
    .integer('Room capacity must be a whole number')
    .required('Room capacity is required'),
  manager_id: Yup.number().nullable(),
  is_active: Yup.boolean(),
});

const HotelFormModal = ({ open, handleClose, hotelToEdit, handleSave }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  const isNewHotel = !hotelToEdit;

  const initialValues = {
    name: hotelToEdit?.name || '',
    location: hotelToEdit?.location || '',
    address: hotelToEdit?.address || '',
    city: hotelToEdit?.city || '',
    country: hotelToEdit?.country || '',
    description: hotelToEdit?.description || '',
    star_rating: hotelToEdit?.star_rating || 3,
    room_capacity: hotelToEdit?.room_capacity || 0,
    manager_id: hotelToEdit?.manager?.id || hotelToEdit?.manager_id || '',
    is_active: hotelToEdit?.is_active ?? true,
  };

  // Reset error when modal opens
  useEffect(() => {
    if (open) {
      setError(null);
      fetchManagers();
    }
  }, [open]);

  const fetchManagers = async () => {
    setLoadingManagers(true);
    const result = await authService.getUsers('manager');
    if (result.success) {
      const activeManagers = (result.data || []).filter(m => m.is_active);
      setManagers(activeManagers);
    }
    setLoadingManagers(false);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);

    const payload = {
      name: values.name,
      location: values.location,
      address: values.address,
      city: values.city,
      country: values.country,
      description: values.description || '',  // Send empty string, not null
      star_rating: values.star_rating,
      room_capacity: values.room_capacity,
      manager_id: values.manager_id || null,
      is_active: values.is_active,
    };

    const result = await handleSave(hotelToEdit?.id, payload);

    if (result.success) {
      handleClose();
    } else {
      const detailError =
        result.error?.name?.[0] ||
        result.error?.location?.[0] ||
        result.error?.address?.[0] ||
        result.error?.city?.[0] ||
        result.error?.country?.[0] ||
        result.error?.description?.[0] ||
        result.error?.star_rating?.[0] ||
        result.error?.room_capacity?.[0] ||
        result.error?.manager_id?.[0] ||
        result.error?.error ||
        result.error?.detail ||
        (typeof result.error === 'string' ? result.error : 'An unexpected error occurred.');
      setError(detailError);
    }
    setLoading(false);
  };

  const SectionHeader = ({ icon: Icon, title }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
      <Icon sx={{ fontSize: 16, color: 'primary.main' }} />
      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </Typography>
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
        }
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
            {isNewHotel ? <HotelIcon fontSize="small" /> : <EditIcon fontSize="small" />}
          </Avatar>
          <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#ffffff' }}>
            {isNewHotel ? 'Create New Hotel' : `Edit Hotel: ${hotelToEdit?.name}`}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: '#ffffff' }} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Formik
        initialValues={initialValues}
        validationSchema={HotelSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ errors, touched, values, setFieldValue }) => (
          <Form>
            <DialogContent sx={{ px: 3, py: 2, maxHeight: '70vh', overflowY: 'auto' }}>
              {error && (
                <Alert
                  severity="error"
                  sx={{ mb: 2, borderRadius: 2 }}
                  onClose={() => setError(null)}
                >
                  {error}
                </Alert>
              )}

              {/* Hotel Information */}
              <SectionHeader icon={HotelIcon} title="Hotel Information" />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                <Field
                  as={TextField}
                  name="name"
                  label="Hotel Name"
                  placeholder="e.g., Grand Plaza Hotel"
                  fullWidth
                  required
                  size="small"
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <HotelIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2 }
                  }}
                />

                <Field
                  as={TextField}
                  name="description"
                  label="Description"
                  placeholder="Brief description of the hotel..."
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  error={touched.description && Boolean(errors.description)}
                  helperText={touched.description && errors.description}
                  InputProps={{
                    sx: { borderRadius: 2 }
                  }}
                />
              </Box>

              {/* Location Details */}
              <SectionHeader icon={AddressIcon} title="Location Details" />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                <Field
                  as={TextField}
                  name="location"
                  label="Location"
                  placeholder="e.g., Central London, Downtown Manhattan"
                  fullWidth
                  required
                  size="small"
                  error={touched.location && Boolean(errors.location)}
                  helperText={touched.location && errors.location}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2 }
                  }}
                />

                <Field
                  as={TextField}
                  name="address"
                  label="Full Address"
                  placeholder="e.g., 123 Main Street, Suite 100"
                  fullWidth
                  required
                  size="small"
                  error={touched.address && Boolean(errors.address)}
                  helperText={touched.address && errors.address}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AddressIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2 }
                  }}
                />

                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Field
                    as={TextField}
                    name="city"
                    label="City"
                    placeholder="e.g., London"
                    fullWidth
                    required
                    size="small"
                    error={touched.city && Boolean(errors.city)}
                    helperText={touched.city && errors.city}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 2 }
                    }}
                  />

                  <Field
                    as={TextField}
                    name="country"
                    label="Country"
                    placeholder="e.g., United Kingdom"
                    fullWidth
                    required
                    size="small"
                    error={touched.country && Boolean(errors.country)}
                    helperText={touched.country && errors.country}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CountryIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 2 }
                    }}
                  />
                </Box>
              </Box>

              {/* Star Rating */}
              <SectionHeader icon={StarIcon} title="Star Rating" />
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 1.5,
                    bgcolor: alpha('#FFB400', 0.08),
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: alpha('#FFB400', 0.2),
                  }}
                >
                  <Rating
                    name="star_rating"
                    value={values.star_rating}
                    onChange={(event, newValue) => {
                      setFieldValue('star_rating', newValue || 1);
                    }}
                    size="large"
                    sx={{
                      '& .MuiRating-iconFilled': {
                        color: '#FFB400',
                      },
                    }}
                  />
                  <Chip
                    label={`${values.star_rating} Star${values.star_rating > 1 ? 's' : ''}`}
                    size="small"
                    sx={{
                      bgcolor: '#FFB400',
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                </Box>
                {touched.star_rating && errors.star_rating && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    {errors.star_rating}
                  </Typography>
                )}
              </Box>

              {/* Capacity */}
              <SectionHeader icon={RoomIcon} title="Room Capacity" />
              <Box sx={{ mb: 2 }}>
                <Field
                  as={TextField}
                  name="room_capacity"
                  label="Number of Rooms"
                  type="number"
                  fullWidth
                  required
                  size="small"
                  inputProps={{ min: 0 }}
                  error={touched.room_capacity && Boolean(errors.room_capacity)}
                  helperText={touched.room_capacity && errors.room_capacity}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <RoomIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2 }
                  }}
                />
              </Box>

              {/* Manager Assignment */}
              <SectionHeader icon={ManagerIcon} title="Manager Assignment" />
              <Box sx={{ mb: 2 }}>
                <Field
                  as={TextField}
                  name="manager_id"
                  label="Hotel Manager"
                  select
                  fullWidth
                  size="small"
                  error={touched.manager_id && Boolean(errors.manager_id)}
                  helperText={touched.manager_id && errors.manager_id}
                  disabled={loadingManagers}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ManagerIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2 }
                  }}
                >
                  <MenuItem value="">
                    <em>None (No Manager Assigned)</em>
                  </MenuItem>
                  {managers.map((manager) => (
                    <MenuItem key={manager.id} value={manager.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                          {manager.username?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{manager.username}</Typography>
                          <Typography variant="caption" color="text.secondary">{manager.email}</Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Field>
              </Box>

              {/* Status */}
              <SectionHeader icon={StatusIcon} title="Hotel Status" />
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  bgcolor: values.is_active ? alpha('#2e7d32', 0.08) : alpha('#757575', 0.08),
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: values.is_active ? alpha('#2e7d32', 0.2) : alpha('#757575', 0.2),
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: values.is_active ? 'success.main' : 'grey.400',
                    }}
                  />
                  <Typography variant="body2" fontWeight={500}>
                    {values.is_active ? 'Hotel is Active' : 'Hotel is Inactive'}
                  </Typography>
                </Box>
                <Switch
                  checked={values.is_active}
                  onChange={(e) => setFieldValue('is_active', e.target.checked)}
                  color="success"
                />
              </Box>
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
              <Button
                onClick={handleClose}
                color="inherit"
                sx={{
                  borderRadius: 2,
                  px: 3,
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
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
                {loading ? (
                  <CircularProgress size={22} sx={{ color: 'white' }} />
                ) : (
                  isNewHotel ? 'Create Hotel' : 'Save Changes'
                )}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default HotelFormModal;
