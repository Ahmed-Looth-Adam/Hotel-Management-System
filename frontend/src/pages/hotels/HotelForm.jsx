import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  MenuItem,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { hotelService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import LoadingSpinner from '../../components/loading/LoadingSpinner';
import LoadingButton from '../../components/loading/LoadingButton';

const validationSchema = Yup.object({
  name: Yup.string().required('Hotel name is required'),
  location: Yup.string().required('Location is required'),
  address: Yup.string().required('Address is required'),
  city: Yup.string().required('City is required'),
  country: Yup.string().required('Country is required'),
  star_rating: Yup.number().min(1).max(5).required('Star rating is required'),
  room_capacity: Yup.number().min(1).required('Room capacity is required'),
  default_checkin_time: Yup.string().required('Check-in time is required'),
  default_checkout_time: Yup.string().required('Check-out time is required'),
});

const HotelForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const isEditMode = !!id;

  const formik = useFormik({
    initialValues: {
      name: '',
      location: '',
      address: '',
      city: '',
      country: '',
      description: '',
      star_rating: 3,
      room_capacity: 10,
      is_active: true,
      default_checkin_time: '14:00',
      default_checkout_time: '11:00',
      max_late_checkout_time: '14:00',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      const result = isEditMode
        ? await hotelService.update(id, values)
        : await hotelService.create(values);

      if (result.success) {
        showSuccess(`Hotel ${isEditMode ? 'updated' : 'created'} successfully`);
        navigate('/hotels');
      } else {
        showError(result.error?.message || `Failed to ${isEditMode ? 'update' : 'create'} hotel`);
      }
      setLoading(false);
    },
  });

  useEffect(() => {
    if (isEditMode) {
      const fetchHotel = async () => {
        const result = await hotelService.getById(id);
        if (result.success) {
          formik.setValues({
            name: result.data.name || '',
            location: result.data.location || '',
            address: result.data.address || '',
            city: result.data.city || '',
            country: result.data.country || '',
            description: result.data.description || '',
            star_rating: result.data.star_rating || 3,
            room_capacity: result.data.room_capacity || 10,
            is_active: result.data.is_active ?? true,
            default_checkin_time: result.data.default_checkin_time || '14:00',
            default_checkout_time: result.data.default_checkout_time || '11:00',
            max_late_checkout_time: result.data.max_late_checkout_time || '14:00',
          });
        } else {
          showError('Failed to fetch hotel details');
          navigate('/hotels');
        }
        setInitialLoading(false);
      };
      fetchHotel();
    }
  }, [id]);

  if (initialLoading) {
    return <LoadingSpinner message="Loading hotel details..." />;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/hotels')}>
          Back to Hotels
        </Button>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          {isEditMode ? 'Edit Hotel' : 'Add New Hotel'}
        </Typography>

        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hotel Name"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formik.values.location}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.location && Boolean(formik.errors.location)}
                helperText={formik.touched.location && formik.errors.location}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Star Rating"
                name="star_rating"
                value={formik.values.star_rating}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.star_rating && Boolean(formik.errors.star_rating)}
                helperText={formik.touched.star_rating && formik.errors.star_rating}
              >
                {[1, 2, 3, 4, 5].map((rating) => (
                  <MenuItem key={rating} value={rating}>
                    {'★'.repeat(rating)} ({rating} star{rating > 1 ? 's' : ''})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formik.values.address}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.address && Boolean(formik.errors.address)}
                helperText={formik.touched.address && formik.errors.address}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formik.values.city}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.city && Boolean(formik.errors.city)}
                helperText={formik.touched.city && formik.errors.city}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                name="country"
                value={formik.values.country}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.country && Boolean(formik.errors.country)}
                helperText={formik.touched.country && formik.errors.country}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                name="description"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Room Capacity"
                name="room_capacity"
                value={formik.values.room_capacity}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.room_capacity && Boolean(formik.errors.room_capacity)}
                helperText={formik.touched.room_capacity && formik.errors.room_capacity}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.is_active}
                    onChange={(e) => formik.setFieldValue('is_active', e.target.checked)}
                    name="is_active"
                  />
                }
                label="Active"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="time"
                label="Check-in Time"
                name="default_checkin_time"
                value={formik.values.default_checkin_time}
                onChange={formik.handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="time"
                label="Check-out Time"
                name="default_checkout_time"
                value={formik.values.default_checkout_time}
                onChange={formik.handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="time"
                label="Max Late Checkout"
                name="max_late_checkout_time"
                value={formik.values.max_late_checkout_time}
                onChange={formik.handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => navigate('/hotels')}>
                  Cancel
                </Button>
                <LoadingButton
                  type="submit"
                  variant="contained"
                  loading={loading}
                  startIcon={<Save />}
                >
                  {isEditMode ? 'Update Hotel' : 'Create Hotel'}
                </LoadingButton>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default HotelForm;
