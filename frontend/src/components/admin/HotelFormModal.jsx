import React, { useState, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Box,
  Alert,
  FormControlLabel,
  Switch,
  Rating,
  Typography,
} from '@mui/material';
import authService from '../../services/authService';

const HotelSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must not exceed 255 characters')
    .required('Hotel name is required'),
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
  const title = isNewHotel ? 'Create New Hotel' : `Edit Hotel: ${hotelToEdit?.name}`;

  const initialValues = {
    name: hotelToEdit?.name || '',
    description: hotelToEdit?.description || '',
    star_rating: hotelToEdit?.star_rating || 3,
    room_capacity: hotelToEdit?.room_capacity || 0,
    manager_id: hotelToEdit?.manager?.id || hotelToEdit?.manager_id || '',
    is_active: hotelToEdit?.is_active ?? true,
  };

  // Fetch managers when modal opens
  useEffect(() => {
    if (open) {
      fetchManagers();
    }
  }, [open]);

  const fetchManagers = async () => {
    setLoadingManagers(true);
    const result = await authService.getUsers('manager');
    if (result.success) {
      // Filter to only active managers
      const activeManagers = (result.data || []).filter(m => m.is_active);
      setManagers(activeManagers);
    }
    setLoadingManagers(false);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);

    // Prepare payload
    const payload = {
      name: values.name,
      description: values.description || null,
      star_rating: values.star_rating,
      room_capacity: values.room_capacity,
      manager_id: values.manager_id || null,
      is_active: values.is_active,
    };

    const result = await handleSave(hotelToEdit?.id, payload);

    if (result.success) {
      handleClose();
    } else {
      // Handle Django's detailed error structure
      const detailError =
        result.error?.name?.[0] ||
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

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <Formik
        initialValues={initialValues}
        validationSchema={HotelSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ errors, touched, values, setFieldValue }) => (
          <Form>
            <DialogContent dividers>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Hotel Name */}
                <Field
                  as={TextField}
                  name="name"
                  label="Hotel Name"
                  fullWidth
                  required
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                />

                {/* Description */}
                <Field
                  as={TextField}
                  name="description"
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  error={touched.description && Boolean(errors.description)}
                  helperText={touched.description && errors.description}
                />

                {/* Star Rating */}
                <Box>
                  <Typography component="legend" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Star Rating *
                  </Typography>
                  <Rating
                    name="star_rating"
                    value={values.star_rating}
                    onChange={(event, newValue) => {
                      setFieldValue('star_rating', newValue || 1);
                    }}
                    size="large"
                  />
                  {touched.star_rating && errors.star_rating && (
                    <Typography variant="caption" color="error">
                      {errors.star_rating}
                    </Typography>
                  )}
                </Box>

                {/* Room Capacity */}
                <Field
                  as={TextField}
                  name="room_capacity"
                  label="Room Capacity"
                  type="number"
                  fullWidth
                  required
                  inputProps={{ min: 0 }}
                  error={touched.room_capacity && Boolean(errors.room_capacity)}
                  helperText={touched.room_capacity && errors.room_capacity}
                />

                {/* Manager Assignment */}
                <Field
                  as={TextField}
                  name="manager_id"
                  label="Hotel Manager"
                  select
                  fullWidth
                  error={touched.manager_id && Boolean(errors.manager_id)}
                  helperText={touched.manager_id && errors.manager_id}
                  disabled={loadingManagers}
                >
                  <MenuItem value="">
                    <em>None (No Manager Assigned)</em>
                  </MenuItem>
                  {managers.map((manager) => (
                    <MenuItem key={manager.id} value={manager.id}>
                      {manager.username} ({manager.email})
                    </MenuItem>
                  ))}
                </Field>

                {/* Active Status */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={values.is_active}
                      onChange={(e) => setFieldValue('is_active', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Active"
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} color="inherit">
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="primary" disabled={loading}>
                {loading ? (
                  <CircularProgress size={24} />
                ) : isNewHotel ? (
                  'Create Hotel'
                ) : (
                  'Save Changes'
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
