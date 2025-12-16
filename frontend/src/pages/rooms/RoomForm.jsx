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
import { roomService, hotelService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import LoadingSpinner from '../../components/loading/LoadingSpinner';
import LoadingButton from '../../components/loading/LoadingButton';

const validationSchema = Yup.object({
  hotel: Yup.number().required('Hotel is required'),
  room_number: Yup.string().required('Room number is required'),
  floor: Yup.number().required('Floor is required'),
  room_type_category: Yup.string().required('Room type is required'),
  bed_size: Yup.string().required('Bed size is required'),
  bed_count: Yup.number().min(1).required('Bed count is required'),
  max_occupancy: Yup.number().min(1).required('Maximum occupancy is required'),
});

const roomTypes = [
  { value: 'standard', label: 'Standard' },
  { value: 'deluxe', label: 'Deluxe' },
  { value: 'suite', label: 'Suite' },
  { value: 'executive', label: 'Executive' },
  { value: 'presidential', label: 'Presidential' },
];

const bedSizes = [
  { value: 'single', label: 'Single' },
  { value: 'double', label: 'Double' },
  { value: 'queen', label: 'Queen' },
  { value: 'king', label: 'King' },
  { value: 'twin', label: 'Twin' },
];

const roomStatuses = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'cleaning', label: 'Cleaning' },
];

const RoomForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [hotels, setHotels] = useState([]);
  const [roomViews, setRoomViews] = useState([]);
  const isEditMode = !!id;

  const formik = useFormik({
    initialValues: {
      hotel: '',
      room_number: '',
      floor: 1,
      room_type_category: 'standard',
      bed_size: 'queen',
      bed_count: 1,
      max_occupancy: 2,
      view: '',
      status: 'available',
      is_available: true,
      is_active: true,
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      const data = { ...values };
      if (!data.view) delete data.view;

      const result = isEditMode
        ? await roomService.update(id, data)
        : await roomService.create(data);

      if (result.success) {
        showSuccess(`Room ${isEditMode ? 'updated' : 'created'} successfully`);
        navigate('/rooms');
      } else {
        showError(result.error?.message || `Failed to ${isEditMode ? 'update' : 'create'} room`);
      }
      setLoading(false);
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      const hotelsResult = await hotelService.getAll();
      if (hotelsResult.success) {
        setHotels(hotelsResult.data.results || hotelsResult.data);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (formik.values.hotel) {
      const fetchRoomViews = async () => {
        const result = await roomService.getRoomViews({ hotel: formik.values.hotel });
        if (result.success) {
          setRoomViews(result.data.results || result.data);
        }
      };
      fetchRoomViews();
    }
  }, [formik.values.hotel]);

  useEffect(() => {
    if (isEditMode) {
      const fetchRoom = async () => {
        const result = await roomService.getById(id);
        if (result.success) {
          const room = result.data;
          formik.setValues({
            hotel: room.hotel?.id || room.hotel || '',
            room_number: room.room_number || '',
            floor: room.floor || 1,
            room_type_category: room.room_type_category || 'standard',
            bed_size: room.bed_size || 'queen',
            bed_count: room.bed_count || 1,
            max_occupancy: room.max_occupancy || 2,
            view: room.view?.id || room.view || '',
            status: room.status || 'available',
            is_available: room.is_available ?? true,
            is_active: room.is_active ?? true,
          });
        } else {
          showError('Failed to fetch room details');
          navigate('/rooms');
        }
        setInitialLoading(false);
      };
      fetchRoom();
    }
  }, [id]);

  if (initialLoading) {
    return <LoadingSpinner message="Loading room details..." />;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/rooms')}>
          Back to Rooms
        </Button>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          {isEditMode ? 'Edit Room' : 'Add New Room'}
        </Typography>

        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Hotel"
                name="hotel"
                value={formik.values.hotel}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.hotel && Boolean(formik.errors.hotel)}
                helperText={formik.touched.hotel && formik.errors.hotel}
              >
                {hotels.map((hotel) => (
                  <MenuItem key={hotel.id} value={hotel.id}>
                    {hotel.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Room Number"
                name="room_number"
                value={formik.values.room_number}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.room_number && Boolean(formik.errors.room_number)}
                helperText={formik.touched.room_number && formik.errors.room_number}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                type="number"
                label="Floor"
                name="floor"
                value={formik.values.floor}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.floor && Boolean(formik.errors.floor)}
                helperText={formik.touched.floor && formik.errors.floor}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Room Type"
                name="room_type_category"
                value={formik.values.room_type_category}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.room_type_category && Boolean(formik.errors.room_type_category)}
                helperText={formik.touched.room_type_category && formik.errors.room_type_category}
              >
                {roomTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="View"
                name="view"
                value={formik.values.view}
                onChange={formik.handleChange}
              >
                <MenuItem value="">No View</MenuItem>
                {roomViews.map((view) => (
                  <MenuItem key={view.id} value={view.id}>
                    {view.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Bed Size"
                name="bed_size"
                value={formik.values.bed_size}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.bed_size && Boolean(formik.errors.bed_size)}
                helperText={formik.touched.bed_size && formik.errors.bed_size}
              >
                {bedSizes.map((size) => (
                  <MenuItem key={size.value} value={size.value}>
                    {size.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Number of Beds"
                name="bed_count"
                value={formik.values.bed_count}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.bed_count && Boolean(formik.errors.bed_count)}
                helperText={formik.touched.bed_count && formik.errors.bed_count}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Max Occupancy"
                name="max_occupancy"
                value={formik.values.max_occupancy}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.max_occupancy && Boolean(formik.errors.max_occupancy)}
                helperText={formik.touched.max_occupancy && formik.errors.max_occupancy}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status"
                name="status"
                value={formik.values.status}
                onChange={formik.handleChange}
              >
                {roomStatuses.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formik.values.is_available}
                      onChange={(e) => formik.setFieldValue('is_available', e.target.checked)}
                      name="is_available"
                    />
                  }
                  label="Available"
                />
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
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => navigate('/rooms')}>
                  Cancel
                </Button>
                <LoadingButton
                  type="submit"
                  variant="contained"
                  loading={loading}
                  startIcon={<Save />}
                >
                  {isEditMode ? 'Update Room' : 'Create Room'}
                </LoadingButton>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default RoomForm;
