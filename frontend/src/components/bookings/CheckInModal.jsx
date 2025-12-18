import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Hotel as HotelIcon,
  Badge as BadgeIcon,
  Close as CloseIcon,
  MeetingRoom as RoomIcon,
  Public as NationalityIcon,
  CalendarMonth as CalendarIcon,
  Home as AddressIcon,
} from '@mui/icons-material';
import { bookingService } from '../../services';

const emptyGuest = {
  guest_type: 'primary',
  full_name: '',
  date_of_birth: '',
  nationality: '',
  id_type: 'passport',
  id_number: '',
  id_expiry_date: '',
  address: '',
  phone: '',
  email: '',
};

const idTypeOptions = [
  { value: 'passport', label: 'Passport' },
  { value: 'national_id', label: 'National ID' },
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'other', label: 'Other' },
];

const SectionHeader = ({ icon: Icon, title }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
    <Icon sx={{ fontSize: 16, color: 'primary.main' }} />
    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {title}
    </Typography>
  </Box>
);

const CheckInModal = ({ open, onClose, booking, onSuccess }) => {
  const [guests, setGuests] = useState([{ ...emptyGuest }]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && booking) {
      fetchAvailableRooms();
      // Reset form
      setGuests([{ ...emptyGuest }]);
      setSelectedRoom('');
      setNotes('');
      setError('');
    }
  }, [open, booking]);

  const fetchAvailableRooms = async () => {
    setLoadingRooms(true);
    const result = await bookingService.getAvailableRooms(booking.id);
    if (result.success) {
      setAvailableRooms(result.data.available_rooms || []);
    } else {
      setError('Failed to fetch available rooms');
    }
    setLoadingRooms(false);
  };

  const handleGuestChange = (index, field, value) => {
    const updatedGuests = [...guests];
    updatedGuests[index] = { ...updatedGuests[index], [field]: value };
    setGuests(updatedGuests);
  };

  const addGuest = () => {
    setGuests([...guests, { ...emptyGuest, guest_type: 'additional' }]);
  };

  const removeGuest = (index) => {
    if (guests.length > 1) {
      const updatedGuests = guests.filter((_, i) => i !== index);
      // Ensure first guest is always primary
      if (index === 0 && updatedGuests.length > 0) {
        updatedGuests[0].guest_type = 'primary';
      }
      setGuests(updatedGuests);
    }
  };

  const validateForm = () => {
    // Check if room is selected
    if (!selectedRoom) {
      setError('Please select a room');
      return false;
    }

    // Validate each guest
    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i];
      if (!guest.full_name.trim()) {
        setError(`Guest ${i + 1}: Full name is required`);
        return false;
      }
      if (!guest.date_of_birth) {
        setError(`Guest ${i + 1}: Date of birth is required`);
        return false;
      }
      if (!guest.nationality.trim()) {
        setError(`Guest ${i + 1}: Nationality is required`);
        return false;
      }
      if (!guest.id_number.trim()) {
        setError(`Guest ${i + 1}: ID/Passport number is required`);
        return false;
      }
      if (!guest.address.trim()) {
        setError(`Guest ${i + 1}: Address is required`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const checkInData = {
      room_id: selectedRoom,
      guests: guests.map((guest, index) => ({
        ...guest,
        guest_type: index === 0 ? 'primary' : 'additional',
      })),
      notes,
    };

    const result = await bookingService.checkIn(booking.id, checkInData);

    if (result.success) {
      onSuccess(result.data);
      onClose();
    } else {
      setError(result.error?.detail || result.error?.message || 'Failed to check in');
    }

    setLoading(false);
  };

  const selectedRoomData = availableRooms.find(r => r.id === selectedRoom);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
          overflow: 'hidden',
        },
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
            <BadgeIcon fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#ffffff' }}>
              Guest Check-In
            </Typography>
            {booking && (
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {booking.booking_reference} | {booking.user_name}
              </Typography>
            )}
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#ffffff' }} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          px: 3,
          py: 2,
          maxHeight: 'calc(90vh - 140px)',
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'transparent',
            borderRadius: '3px',
            transition: 'background 0.2s ease',
          },
          '&:hover::-webkit-scrollbar-thumb': {
            background: 'rgba(0, 0, 0, 0.2)',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(0, 0, 0, 0.3)',
          },
          scrollbarWidth: 'thin',
          scrollbarColor: 'transparent transparent',
          '&:hover': {
            scrollbarColor: 'rgba(0, 0, 0, 0.2) transparent',
          },
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Room Selection Section */}
        <SectionHeader icon={RoomIcon} title="Room Assignment" />
        <Box sx={{ mb: 3 }}>
          {loadingRooms ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : availableRooms.length === 0 ? (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              No rooms available for this booking. Please check room availability.
            </Alert>
          ) : (
            <>
              <FormControl fullWidth size="small">
                <InputLabel>Select Room</InputLabel>
                <Select
                  value={selectedRoom}
                  label="Select Room"
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  {availableRooms.map((room) => (
                    <MenuItem key={room.id} value={room.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <span>Room {room.room_number} - Floor {room.floor}</span>
                        <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
                          <Chip label={room.room_type_display} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                          <Chip label={`${room.max_occupancy} pax`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedRoomData && (
                <Box
                  sx={{
                    mt: 1.5,
                    p: 1.5,
                    bgcolor: alpha('#1976d2', 0.08),
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: alpha('#1976d2', 0.2),
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    <strong>Selected:</strong> Room {selectedRoomData.room_number} | {selectedRoomData.room_type_display} |{' '}
                    {selectedRoomData.bed_count} {selectedRoomData.bed_size} bed(s) | Max {selectedRoomData.max_occupancy} guests
                    {selectedRoomData.view && ` | ${selectedRoomData.view} view`}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>

        {/* Guest Details Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <SectionHeader icon={PersonIcon} title={`Guest Details (${guests.length})`} />
          <Button
            startIcon={<AddIcon />}
            onClick={addGuest}
            size="small"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Add Guest
          </Button>
        </Box>

        {guests.map((guest, index) => (
          <Box
            key={index}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: index === 0 ? alpha('#1976d2', 0.02) : 'transparent',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Chip
                label={index === 0 ? 'Primary Guest' : `Additional Guest ${index}`}
                size="small"
                sx={{
                  bgcolor: index === 0 ? '#1976d2' : 'grey.200',
                  color: index === 0 ? 'white' : 'text.primary',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                }}
              />
              {guests.length > 1 && (
                <IconButton
                  size="small"
                  onClick={() => removeGuest(index)}
                  sx={{
                    bgcolor: 'error.50',
                    color: 'error.main',
                    '&:hover': { bgcolor: 'error.100' },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField
                  fullWidth
                  label="Full Name (as on ID)"
                  value={guest.full_name}
                  onChange={(e) => handleGuestChange(index, 'full_name', e.target.value)}
                  required
                  size="small"
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  value={guest.date_of_birth}
                  onChange={(e) => handleGuestChange(index, 'date_of_birth', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                  size="small"
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField
                  fullWidth
                  label="Nationality"
                  value={guest.nationality}
                  onChange={(e) => handleGuestChange(index, 'nationality', e.target.value)}
                  required
                  size="small"
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
                <FormControl fullWidth size="small">
                  <InputLabel>ID Type</InputLabel>
                  <Select
                    value={guest.id_type}
                    label="ID Type"
                    onChange={(e) => handleGuestChange(index, 'id_type', e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    {idTypeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField
                  fullWidth
                  label="ID/Passport Number"
                  value={guest.id_number}
                  onChange={(e) => handleGuestChange(index, 'id_number', e.target.value)}
                  required
                  size="small"
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
                <TextField
                  fullWidth
                  label="ID Expiry Date"
                  type="date"
                  value={guest.id_expiry_date}
                  onChange={(e) => handleGuestChange(index, 'id_expiry_date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
              </Box>
              <TextField
                fullWidth
                label="Address (as on ID)"
                value={guest.address}
                onChange={(e) => handleGuestChange(index, 'address', e.target.value)}
                multiline
                rows={2}
                required
                size="small"
                InputProps={{ sx: { borderRadius: 2 } }}
              />
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField
                  fullWidth
                  label="Phone (optional)"
                  value={guest.phone}
                  onChange={(e) => handleGuestChange(index, 'phone', e.target.value)}
                  size="small"
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
                <TextField
                  fullWidth
                  label="Email (optional)"
                  type="email"
                  value={guest.email}
                  onChange={(e) => handleGuestChange(index, 'email', e.target.value)}
                  size="small"
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
              </Box>
            </Box>
          </Box>
        ))}

        {/* Notes Section */}
        <SectionHeader icon={CalendarIcon} title="Check-in Notes" />
        <TextField
          fullWidth
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          multiline
          rows={2}
          size="small"
          placeholder="Any special notes or remarks for this check-in..."
          InputProps={{ sx: { borderRadius: 2 } }}
        />
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
          onClick={onClose}
          disabled={loading}
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
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || loadingRooms || availableRooms.length === 0}
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
            '&.Mui-disabled': {
              bgcolor: 'grey.300',
              color: 'grey.500',
            },
          }}
        >
          {loading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Complete Check-In'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CheckInModal;
