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
  Autocomplete,
  InputAdornment,
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

// Complete countries list with flags
const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫' },
  { code: 'AL', name: 'Albania', flag: '🇦🇱' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿' },
  { code: 'AD', name: 'Andorra', flag: '🇦🇩' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴' },
  { code: 'AG', name: 'Antigua and Barbuda', flag: '🇦🇬' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'AM', name: 'Armenia', flag: '🇦🇲' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿' },
  { code: 'BS', name: 'Bahamas', flag: '🇧🇸' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'BB', name: 'Barbados', flag: '🇧🇧' },
  { code: 'BY', name: 'Belarus', flag: '🇧🇾' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'BZ', name: 'Belize', flag: '🇧🇿' },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯' },
  { code: 'BT', name: 'Bhutan', flag: '🇧🇹' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'BA', name: 'Bosnia and Herzegovina', flag: '🇧🇦' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'BN', name: 'Brunei', flag: '🇧🇳' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮' },
  { code: 'CV', name: 'Cabo Verde', flag: '🇨🇻' },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'CF', name: 'Central African Republic', flag: '🇨🇫' },
  { code: 'TD', name: 'Chad', flag: '🇹🇩' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'KM', name: 'Comoros', flag: '🇰🇲' },
  { code: 'CG', name: 'Congo', flag: '🇨🇬' },
  { code: 'CD', name: 'Congo (DRC)', flag: '🇨🇩' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯' },
  { code: 'DM', name: 'Dominica', flag: '🇩🇲' },
  { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
  { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶' },
  { code: 'ER', name: 'Eritrea', flag: '🇪🇷' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪' },
  { code: 'SZ', name: 'Eswatini', flag: '🇸🇿' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦' },
  { code: 'GM', name: 'Gambia', flag: '🇬🇲' },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'GD', name: 'Grenada', flag: '🇬🇩' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳' },
  { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼' },
  { code: 'GY', name: 'Guyana', flag: '🇬🇾' },
  { code: 'HT', name: 'Haiti', flag: '🇭🇹' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷' },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'KI', name: 'Kiribati', flag: '🇰🇮' },
  { code: 'KP', name: 'North Korea', flag: '🇰🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬' },
  { code: 'LA', name: 'Laos', flag: '🇱🇦' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧' },
  { code: 'LS', name: 'Lesotho', flag: '🇱🇸' },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷' },
  { code: 'LY', name: 'Libya', flag: '🇱🇾' },
  { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'MO', name: 'Macau', flag: '🇲🇴' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'MV', name: 'Maldives', flag: '🇲🇻' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹' },
  { code: 'MH', name: 'Marshall Islands', flag: '🇲🇭' },
  { code: 'MR', name: 'Mauritania', flag: '🇲🇷' },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'FM', name: 'Micronesia', flag: '🇫🇲' },
  { code: 'MD', name: 'Moldova', flag: '🇲🇩' },
  { code: 'MC', name: 'Monaco', flag: '🇲🇨' },
  { code: 'MN', name: 'Mongolia', flag: '🇲🇳' },
  { code: 'ME', name: 'Montenegro', flag: '🇲🇪' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦' },
  { code: 'NR', name: 'Nauru', flag: '🇳🇷' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'MK', name: 'North Macedonia', flag: '🇲🇰' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'PW', name: 'Palau', flag: '🇵🇼' },
  { code: 'PS', name: 'Palestine', flag: '🇵🇸' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦' },
  { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'KN', name: 'Saint Kitts and Nevis', flag: '🇰🇳' },
  { code: 'LC', name: 'Saint Lucia', flag: '🇱🇨' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', flag: '🇻🇨' },
  { code: 'WS', name: 'Samoa', flag: '🇼🇸' },
  { code: 'SM', name: 'San Marino', flag: '🇸🇲' },
  { code: 'ST', name: 'São Tomé and Príncipe', flag: '🇸🇹' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳' },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸' },
  { code: 'SC', name: 'Seychelles', flag: '🇸🇨' },
  { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮' },
  { code: 'SB', name: 'Solomon Islands', flag: '🇸🇧' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'SS', name: 'South Sudan', flag: '🇸🇸' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩' },
  { code: 'SR', name: 'Suriname', flag: '🇸🇷' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'SY', name: 'Syria', flag: '🇸🇾' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
  { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
  { code: 'TO', name: 'Tonga', flag: '🇹🇴' },
  { code: 'TT', name: 'Trinidad and Tobago', flag: '🇹🇹' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲' },
  { code: 'TV', name: 'Tuvalu', flag: '🇹🇻' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿' },
  { code: 'VU', name: 'Vanuatu', flag: '🇻🇺' },
  { code: 'VA', name: 'Vatican City', flag: '🇻🇦' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼' },
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SectionHeader icon={PersonIcon} title={`Guest Details (${guests.length})`} />
          <Button
            startIcon={<AddIcon />}
            onClick={addGuest}
            size="small"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              p: 0,
              minWidth: 'auto',
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
                <Autocomplete
                  fullWidth
                  options={COUNTRIES}
                  size="small"
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return option.name;
                  }}
                  value={COUNTRIES.find(c => c.name === guest.nationality) || guest.nationality || null}
                  onChange={(event, newValue) => {
                    const countryName = typeof newValue === 'string' ? newValue : newValue?.name || '';
                    handleGuestChange(index, 'nationality', countryName);
                  }}
                  onInputChange={(event, newInputValue) => {
                    if (event?.type === 'change') {
                      handleGuestChange(index, 'nationality', newInputValue);
                    }
                  }}
                  freeSolo
                  renderOption={(props, option) => (
                    <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontSize: '14px' }}>
                      <span style={{ fontSize: '18px' }}>{option.flag}</span>
                      <span>{option.name}</span>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Nationality"
                      required
                      InputProps={{
                        ...params.InputProps,
                        sx: { borderRadius: 2 },
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              {COUNTRIES.find(c => c.name === guest.nationality)?.flag ? (
                                <span style={{ fontSize: '18px' }}>{COUNTRIES.find(c => c.name === guest.nationality)?.flag}</span>
                              ) : (
                                <NationalityIcon sx={{ color: '#717171', fontSize: 20 }} />
                              )}
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
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
