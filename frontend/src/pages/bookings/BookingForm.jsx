import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { bookingService, hotelService, roomService, pricingService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import LoadingButton from '../../components/loading/LoadingButton';

const validationSchema = Yup.object({
  hotel_id: Yup.number().required('Hotel is required'),
  room_id: Yup.number().required('Room is required'),
  check_in_date: Yup.date().required('Check-in date is required'),
  check_out_date: Yup.date()
    .required('Check-out date is required')
    .min(Yup.ref('check_in_date'), 'Check-out must be after check-in'),
  guests_count: Yup.number().min(1).required('Number of guests is required'),
});

const steps = ['Select Hotel & Dates', 'Choose Room', 'Confirm Booking'];

const BookingForm = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [hotels, setHotels] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [priceBreakdown, setPriceBreakdown] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const formik = useFormik({
    initialValues: {
      hotel_id: '',
      room_id: '',
      check_in_date: '',
      check_out_date: '',
      guests_count: 1,
      special_requests: '',
      promo_code: '',
      payment_method: 'card',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      const result = await bookingService.create(values);
      if (result.success) {
        showSuccess('Booking created successfully');
        navigate(`/bookings/${result.data.id}`);
      } else {
        showError(result.error?.message || 'Failed to create booking');
      }
      setLoading(false);
    },
  });

  useEffect(() => {
    const fetchHotels = async () => {
      const result = await hotelService.getAll({ is_active: true });
      if (result.success) {
        setHotels(result.data.results || result.data);
      }
    };
    fetchHotels();
  }, []);

  const searchAvailableRooms = async () => {
    if (!formik.values.hotel_id || !formik.values.check_in_date || !formik.values.check_out_date) {
      return;
    }

    setLoadingRooms(true);
    const result = await roomService.checkAvailability({
      hotel_id: formik.values.hotel_id,
      check_in: formik.values.check_in_date,
      check_out: formik.values.check_out_date,
      min_occupancy: formik.values.guests_count,
    });

    if (result.success) {
      setAvailableRooms(result.data.available_rooms || []);
      setActiveStep(1);
    } else {
      showError('Failed to check availability');
    }
    setLoadingRooms(false);
  };

  const selectRoom = async (roomId) => {
    formik.setFieldValue('room_id', roomId);

    const result = await pricingService.calculatePrice({
      room_id: roomId,
      check_in: formik.values.check_in_date,
      check_out: formik.values.check_out_date,
      promo_code: formik.values.promo_code || null,
    });

    if (result.success) {
      setPriceBreakdown(result.data);
    }
    setActiveStep(2);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Hotel"
                name="hotel_id"
                value={formik.values.hotel_id}
                onChange={formik.handleChange}
                error={formik.touched.hotel_id && Boolean(formik.errors.hotel_id)}
                helperText={formik.touched.hotel_id && formik.errors.hotel_id}
              >
                {hotels.map((hotel) => (
                  <MenuItem key={hotel.id} value={hotel.id}>
                    {hotel.name} - {hotel.city}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Check-in Date"
                name="check_in_date"
                value={formik.values.check_in_date}
                onChange={formik.handleChange}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().split('T')[0] }}
                error={formik.touched.check_in_date && Boolean(formik.errors.check_in_date)}
                helperText={formik.touched.check_in_date && formik.errors.check_in_date}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Check-out Date"
                name="check_out_date"
                value={formik.values.check_out_date}
                onChange={formik.handleChange}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: formik.values.check_in_date || new Date().toISOString().split('T')[0] }}
                error={formik.touched.check_out_date && Boolean(formik.errors.check_out_date)}
                helperText={formik.touched.check_out_date && formik.errors.check_out_date}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Number of Guests"
                name="guests_count"
                value={formik.values.guests_count}
                onChange={formik.handleChange}
                inputProps={{ min: 1 }}
                error={formik.touched.guests_count && Boolean(formik.errors.guests_count)}
                helperText={formik.touched.guests_count && formik.errors.guests_count}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Promo Code (Optional)"
                name="promo_code"
                value={formik.values.promo_code}
                onChange={formik.handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <LoadingButton
                variant="contained"
                onClick={searchAvailableRooms}
                loading={loadingRooms}
                disabled={!formik.values.hotel_id || !formik.values.check_in_date || !formik.values.check_out_date}
              >
                Search Available Rooms
              </LoadingButton>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={2}>
            {availableRooms.length === 0 ? (
              <Grid item xs={12}>
                <Typography color="text.secondary" align="center">
                  No rooms available for the selected dates
                </Typography>
              </Grid>
            ) : (
              availableRooms.map((room) => (
                <Grid item xs={12} sm={6} md={4} key={room.id}>
                  <Paper
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: formik.values.room_id === room.id ? '2px solid' : '1px solid',
                      borderColor: formik.values.room_id === room.id ? 'primary.main' : 'divider',
                      '&:hover': { borderColor: 'primary.main' },
                    }}
                    onClick={() => selectRoom(room.id)}
                  >
                    <Typography variant="h6">Room {room.room_number}</Typography>
                    <Typography color="text.secondary">{room.room_type_category}</Typography>
                    <Typography variant="body2">
                      {room.bed_count}x {room.bed_size} | Max {room.max_occupancy} guests
                    </Typography>
                    {room.view_name && (
                      <Typography variant="body2" color="text.secondary">
                        View: {room.view_name}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              ))
            )}
            <Grid item xs={12}>
              <Button onClick={() => setActiveStep(0)}>Back</Button>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Booking Summary</Typography>
              <Typography>Check-in: {formik.values.check_in_date}</Typography>
              <Typography>Check-out: {formik.values.check_out_date}</Typography>
              <Typography>Guests: {formik.values.guests_count}</Typography>

              {priceBreakdown && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="subtitle1">Price Breakdown</Typography>
                  <Typography>Base Price: ${priceBreakdown.base_total?.toFixed(2)}</Typography>
                  {priceBreakdown.discount_amount > 0 && (
                    <Typography color="success.main">
                      Discount: -${priceBreakdown.discount_amount?.toFixed(2)}
                    </Typography>
                  )}
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    Total: ${priceBreakdown.final_total?.toFixed(2)}
                  </Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Special Requests"
                name="special_requests"
                value={formik.values.special_requests}
                onChange={formik.handleChange}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                select
                label="Payment Method"
                name="payment_method"
                value={formik.values.payment_method}
                onChange={formik.handleChange}
              >
                <MenuItem value="card">Credit Card</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button onClick={() => setActiveStep(1)}>Back</Button>
                <LoadingButton
                  variant="contained"
                  onClick={formik.handleSubmit}
                  loading={loading}
                  startIcon={<Save />}
                >
                  Confirm Booking
                </LoadingButton>
              </Box>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/bookings')}>
          Back to Bookings
        </Button>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>New Booking</Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </Paper>
    </Container>
  );
};

export default BookingForm;
