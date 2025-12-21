import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFormik } from 'formik';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Avatar,
  IconButton,
  InputAdornment,
  Divider,
  Collapse,
  Autocomplete,
  Dialog,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  PhotoCamera,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  Badge as BadgeIcon,
  ExpandMore,
  ExpandLess,
  Shield as ShieldIcon,
  ArrowBack,
  CreditCard as CreditCardIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { ProfileSchema, PasswordChangeSchema } from './validationSchema';
import authService from '../../services/authService';
import { savedCardService } from '../../services';
import Hero from '../../components/landing/Hero';

// Card type logos
const CARD_LOGOS = {
  visa: '/images/cards/visa.svg',
  mastercard: '/images/cards/mastercard.svg',
  amex: '/images/cards/amex.svg',
};

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
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
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

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);

  // Saved cards state
  const [savedCards, setSavedCards] = useState([]);
  const [loadingSavedCards, setLoadingSavedCards] = useState(true);
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState(null);
  const [cardError, setCardError] = useState('');
  const [cardSuccess, setCardSuccess] = useState('');
  const [newCardData, setNewCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    isDefault: false,
  });

  const [initialValues, setInitialValues] = useState({
    name: '',
    lastName: '',
    email: '',
    phone_number: '',
    date_of_birth: '',
    address: '',
    city: '',
    country: '',
    postal_code: '',
  });

  useEffect(() => {
    if (user) {
      fetchProfileData().then(data => {
        setInitialValues({
          name: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || '',
          phone_number: data.phone_number || '',
          date_of_birth: data.date_of_birth || '',
          address: data.address || '',
          city: data.city || '',
          country: data.country || '',
          postal_code: data.postal_code || '',
        });
        setNewUsername(data.username || '');
        if (data.profile_picture) {
          setPreviewUrl(data.profile_picture.startsWith('http')
            ? data.profile_picture
            : `http://localhost:8000${data.profile_picture}`
          );
        }
        setLoading(false);
      }).catch(error => {
        console.error('Error fetching profile data:', error);
        setProfileError('Failed to load profile data');
        setLoading(false);
      });
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const result = await authService.getProfile();
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch profile');
      }
    } catch (error) {
      throw error;
    }
  };

  // Fetch saved cards
  useEffect(() => {
    fetchSavedCards();
  }, []);

  const fetchSavedCards = async () => {
    setLoadingSavedCards(true);
    const result = await savedCardService.getAll();
    if (result.success) {
      setSavedCards(result.data || []);
    }
    setLoadingSavedCards(false);
  };

  // Card form helpers
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const getCardType = (cardNumber) => {
    const num = cardNumber.replace(/\s/g, '');
    if (/^4/.test(num)) return 'visa';
    if (/^5[1-5]/.test(num)) return 'mastercard';
    if (/^3[47]/.test(num)) return 'amex';
    return '';
  };

  const handleCardDataChange = (field) => (e) => {
    let value = e.target.value;

    if (field === 'cardNumber') {
      value = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      value = formatExpiryDate(value.replace('/', ''));
    } else if (field === 'cvv') {
      value = value.replace(/[^0-9]/g, '').substring(0, 4);
    }

    setNewCardData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCard = async () => {
    setCardError('');

    // Validate
    const cardNum = newCardData.cardNumber.replace(/\s/g, '');
    if (!cardNum || cardNum.length < 13) {
      setCardError('Please enter a valid card number');
      return;
    }
    if (!newCardData.expiryDate || !/^\d{2}\/\d{2}$/.test(newCardData.expiryDate)) {
      setCardError('Please enter a valid expiry date (MM/YY)');
      return;
    }
    if (!newCardData.cvv || newCardData.cvv.length < 3) {
      setCardError('Please enter a valid CVV');
      return;
    }
    if (!newCardData.cardholderName.trim()) {
      setCardError('Please enter the cardholder name');
      return;
    }

    setAddingCard(true);
    const result = await savedCardService.create({
      card_number: newCardData.cardNumber,
      expiry_date: newCardData.expiryDate,
      cvv: newCardData.cvv,
      cardholder_name: newCardData.cardholderName,
      is_default: newCardData.isDefault,
    });

    if (result.success) {
      setCardSuccess('Card saved successfully');
      setShowAddCardDialog(false);
      setNewCardData({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: '',
        isDefault: false,
      });
      fetchSavedCards();
      setTimeout(() => setCardSuccess(''), 3000);
    } else {
      setCardError(result.error?.message || result.error?.detail || 'Failed to save card');
    }
    setAddingCard(false);
  };

  const handleDeleteCard = async (cardId) => {
    setDeletingCardId(cardId);
    const result = await savedCardService.delete(cardId);
    if (result.success) {
      setCardSuccess('Card removed successfully');
      fetchSavedCards();
      setTimeout(() => setCardSuccess(''), 3000);
    } else {
      setCardError('Failed to remove card');
      setTimeout(() => setCardError(''), 3000);
    }
    setDeletingCardId(null);
  };

  const handleSetDefaultCard = async (cardId) => {
    const result = await savedCardService.setDefault(cardId);
    if (result.success) {
      setCardSuccess('Default card updated');
      fetchSavedCards();
      setTimeout(() => setCardSuccess(''), 3000);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));

      // Auto-upload the picture
      setUploadingPicture(true);
      try {
        const formData = new FormData();
        formData.append('profile_picture', file);
        const result = await authService.updateProfile(formData);
        if (result.success) {
          await updateUser();
          setProfileSuccess('Profile picture updated successfully!');
          setTimeout(() => setProfileSuccess(''), 3000);
        } else {
          setProfileError('Failed to update profile picture');
          setTimeout(() => setProfileError(''), 3000);
        }
      } catch (error) {
        setProfileError('Failed to upload profile picture');
        setTimeout(() => setProfileError(''), 3000);
      }
      setUploadingPicture(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!newUsername.trim()) {
      setUsernameError('Username cannot be empty');
      return;
    }
    if (newUsername === user?.username) {
      setEditingUsername(false);
      return;
    }

    setSavingUsername(true);
    setUsernameError('');
    try {
      const result = await authService.updateProfile({ username: newUsername });
      if (result.success) {
        await updateUser();
        setUsernameSuccess('Username updated successfully!');
        setEditingUsername(false);
        setTimeout(() => setUsernameSuccess(''), 3000);
      } else {
        setUsernameError(result.error?.username?.[0] || result.error || 'Failed to update username');
      }
    } catch (error) {
      setUsernameError('Failed to update username');
    }
    setSavingUsername(false);
  };

  const profileFormik = useFormik({
    initialValues: initialValues,
    validationSchema: ProfileSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setProfileError('');
        setProfileSuccess('');
        const updateData = {};

        if (values.name !== initialValues.name) updateData.first_name = values.name;
        if (values.lastName !== initialValues.lastName) updateData.last_name = values.lastName;
        if (values.email !== initialValues.email) updateData.email = values.email;
        if (values.phone_number !== initialValues.phone_number) updateData.phone_number = values.phone_number;
        if (values.date_of_birth !== initialValues.date_of_birth) updateData.date_of_birth = values.date_of_birth;
        if (values.address !== initialValues.address) updateData.address = values.address;
        if (values.city !== initialValues.city) updateData.city = values.city;
        if (values.country !== initialValues.country) updateData.country = values.country;
        if (values.postal_code !== initialValues.postal_code) updateData.postal_code = values.postal_code;

        if (Object.keys(updateData).length === 0) {
          setProfileSuccess('No changes detected.');
          setSubmitting(false);
          return;
        }

        const result = await authService.updateProfile(updateData);

        if (result.success) {
          setProfileSuccess('Profile updated successfully!');
          await updateUser();
          setInitialValues({
            name: result.data.first_name || '',
            lastName: result.data.last_name || '',
            email: result.data.email || '',
            phone_number: result.data.phone_number || '',
            date_of_birth: result.data.date_of_birth || '',
            address: result.data.address || '',
            city: result.data.city || '',
            country: result.data.country || '',
            postal_code: result.data.postal_code || '',
          });
        } else {
          const errorMsg = result.error?.email || result.error || 'Failed to update profile.';
          setProfileError(errorMsg);
        }
      } catch (error) {
        setProfileError('An unexpected error occurred. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const passwordFormik = useFormik({
    initialValues: {
      current_password: '',
      new_password: '',
      confirm_new_password: '',
    },
    validationSchema: PasswordChangeSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        setPasswordError('');
        setPasswordSuccess('');

        const response = await authService.changePassword(values);
        if (response.success) {
          setPasswordSuccess('Password changed successfully!');
          resetForm();
          setTimeout(() => setShowPasswordSection(false), 2000);
        } else {
          setPasswordError(response.error || 'Password change failed.');
        }
      } catch (error) {
        setPasswordError('Password change failed.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getInitials = () => {
    const first = user?.first_name?.[0] || '';
    const last = user?.last_name?.[0] || '';
    return (first + last).toUpperCase() || user?.username?.[0]?.toUpperCase() || '?';
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#FFFFFF' }}>
        <Hero initialCollapsed hideBottomNav />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress sx={{ color: '#667eea' }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FAFAFA' }}>
      <Hero initialCollapsed hideBottomNav />

      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 5 }, px: { xs: 2, sm: 3 } }}>
        {/* Page Header */}
        <Box sx={{ mb: { xs: 2, sm: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, mb: 0.5 }}>
            <Box
              onClick={() => navigate(-1)}
              sx={{
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
              }}
            >
              <ArrowBack sx={{ fontSize: { xs: 20, sm: 24 }, color: '#222222' }} />
            </Box>
            <Typography sx={{ fontSize: { xs: '22px', sm: '32px' }, fontWeight: 700, color: '#222222' }}>
              Account Settings
            </Typography>
          </Box>
          <Typography sx={{ fontSize: { xs: '13px', sm: '16px' }, color: '#717171', ml: { xs: '40px', sm: '56px' } }}>
            Manage your personal information and security settings
          </Typography>
        </Box>

        {/* Success/Error Alerts */}
        {(profileSuccess || profileError) && (
          <Alert
            severity={profileError ? "error" : "success"}
            sx={{ mb: 3, borderRadius: '12px' }}
            onClose={() => { setProfileError(''); setProfileSuccess(''); }}
          >
            {profileError || profileSuccess}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: { xs: 2, sm: 4 }, flexDirection: { xs: 'column', lg: 'row' } }}>
          {/* Left Column - Profile Card */}
          <Box sx={{ width: { xs: '100%', lg: 320 }, flexShrink: 0 }}>
            {/* Profile Picture Card */}
            <Box
              sx={{
                bgcolor: '#FFFFFF',
                borderRadius: { xs: '12px', sm: '16px' },
                border: '1px solid #EBEBEB',
                p: { xs: 2.5, sm: 4 },
                mb: { xs: 2, sm: 3 },
                textAlign: 'center',
              }}
            >
              {/* Avatar */}
              <Box sx={{ position: 'relative', display: 'inline-block', mb: { xs: 2, sm: 3 } }}>
                <Avatar
                  src={previewUrl}
                  sx={{
                    width: { xs: 90, sm: 120 },
                    height: { xs: 90, sm: 120 },
                    fontSize: { xs: '2rem', sm: '2.5rem' },
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: '4px solid #FFFFFF',
                    boxShadow: '0 4px 14px rgba(102, 126, 234, 0.3)',
                  }}
                >
                  {getInitials()}
                </Avatar>
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPicture}
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: '#FFFFFF',
                    border: '2px solid #EBEBEB',
                    width: { xs: 30, sm: 36 },
                    height: { xs: 30, sm: 36 },
                    '&:hover': { bgcolor: '#F7F7F7' },
                  }}
                >
                  {uploadingPicture ? (
                    <CircularProgress size={16} sx={{ color: '#667eea' }} />
                  ) : (
                    <PhotoCamera sx={{ fontSize: { xs: 16, sm: 18 }, color: '#667eea' }} />
                  )}
                </IconButton>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </Box>

              {/* Name */}
              <Typography sx={{ fontSize: { xs: '18px', sm: '22px' }, fontWeight: 600, color: '#222222', mb: 0.5 }}>
                {user?.first_name || ''} {user?.last_name || ''}
              </Typography>

              {/* Username with edit */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                {editingUsername ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      size="small"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      error={!!usernameError}
                      helperText={usernameError}
                      sx={{
                        width: { xs: 120, sm: 150 },
                        '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: { xs: '13px', sm: '14px' } }
                      }}
                      autoFocus
                    />
                    <IconButton
                      size="small"
                      onClick={handleSaveUsername}
                      disabled={savingUsername}
                      sx={{ color: '#008A05' }}
                    >
                      {savingUsername ? <CircularProgress size={16} /> : <CheckIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => { setEditingUsername(false); setNewUsername(user?.username || ''); setUsernameError(''); }}
                      sx={{ color: '#717171' }}
                    >
                      <CloseIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                    </IconButton>
                  </Box>
                ) : (
                  <>
                    <Typography sx={{ fontSize: { xs: '13px', sm: '15px' }, color: '#717171' }}>
                      @{user?.username}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setEditingUsername(true)}
                      sx={{ color: '#717171', '&:hover': { color: '#667eea' } }}
                    >
                      <EditIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />
                    </IconButton>
                  </>
                )}
              </Box>
              {usernameSuccess && (
                <Typography sx={{ fontSize: { xs: '12px', sm: '13px' }, color: '#008A05', mb: 1 }}>
                  {usernameSuccess}
                </Typography>
              )}

              {/* Role Badge */}
              <Box
                sx={{
                  display: 'inline-block',
                  px: { xs: 1.5, sm: 2 },
                  py: 0.5,
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  border: '1px solid rgba(102, 126, 234, 0.2)',
                }}
              >
                <Typography sx={{ fontSize: { xs: '12px', sm: '13px' }, fontWeight: 600, color: '#667eea', textTransform: 'capitalize' }}>
                  {user?.role || 'Guest'}
                </Typography>
              </Box>

              <Divider sx={{ my: { xs: 2, sm: 3 } }} />

              {/* Quick Info */}
              <Box sx={{ textAlign: 'left' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, mb: { xs: 1.5, sm: 2 } }}>
                  <EmailIcon sx={{ fontSize: { xs: 18, sm: 20 }, color: '#717171' }} />
                  <Box>
                    <Typography sx={{ fontSize: { xs: '11px', sm: '12px' }, color: '#717171' }}>Email</Typography>
                    <Typography sx={{ fontSize: { xs: '13px', sm: '14px' }, color: '#222222', fontWeight: 500 }}>
                      {user?.email || 'Not set'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, mb: { xs: 1.5, sm: 2 } }}>
                  <PhoneIcon sx={{ fontSize: { xs: 18, sm: 20 }, color: '#717171' }} />
                  <Box>
                    <Typography sx={{ fontSize: { xs: '11px', sm: '12px' }, color: '#717171' }}>Phone</Typography>
                    <Typography sx={{ fontSize: { xs: '13px', sm: '14px' }, color: '#222222', fontWeight: 500 }}>
                      {user?.phone_number || 'Not set'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
                  <CalendarIcon sx={{ fontSize: { xs: 18, sm: 20 }, color: '#717171' }} />
                  <Box>
                    <Typography sx={{ fontSize: { xs: '11px', sm: '12px' }, color: '#717171' }}>Member since</Typography>
                    <Typography sx={{ fontSize: { xs: '13px', sm: '14px' }, color: '#222222', fontWeight: 500 }}>
                      {formatDate(user?.created_at)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Right Column - Forms */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Personal Information */}
            <Box
              sx={{
                bgcolor: '#FFFFFF',
                borderRadius: { xs: '12px', sm: '16px' },
                border: '1px solid #EBEBEB',
                p: { xs: 2, sm: 4 },
                mb: { xs: 2, sm: 3 },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, mb: { xs: 2, sm: 3 } }}>
                <Box
                  sx={{
                    width: { xs: 36, sm: 44 },
                    height: { xs: 36, sm: 44 },
                    borderRadius: { xs: '10px', sm: '12px' },
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PersonIcon sx={{ color: '#667eea', fontSize: { xs: 20, sm: 24 } }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: { xs: '16px', sm: '20px' }, fontWeight: 600, color: '#222222' }}>
                    Personal Information
                  </Typography>
                  <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, color: '#717171' }}>
                    Update your personal details
                  </Typography>
                </Box>
              </Box>

              <Box component="form" onSubmit={profileFormik.handleSubmit}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 2, sm: 2.5 } }}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="name"
                    size="small"
                    value={profileFormik.values.name}
                    onChange={profileFormik.handleChange}
                    onBlur={profileFormik.handleBlur}
                    error={profileFormik.touched.name && Boolean(profileFormik.errors.name)}
                    helperText={profileFormik.touched.name && profileFormik.errors.name}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: '#717171', fontSize: { xs: 18, sm: 20 } }} /></InputAdornment>,
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: { xs: '10px', sm: '12px' } } }}
                  />
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    size="small"
                    value={profileFormik.values.lastName}
                    onChange={profileFormik.handleChange}
                    onBlur={profileFormik.handleBlur}
                    error={profileFormik.touched.lastName && Boolean(profileFormik.errors.lastName)}
                    helperText={profileFormik.touched.lastName && profileFormik.errors.lastName}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: '#717171', fontSize: { xs: 18, sm: 20 } }} /></InputAdornment>,
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: { xs: '10px', sm: '12px' } } }}
                  />
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    size="small"
                    value={profileFormik.values.email}
                    onChange={profileFormik.handleChange}
                    onBlur={profileFormik.handleBlur}
                    error={profileFormik.touched.email && Boolean(profileFormik.errors.email)}
                    helperText={profileFormik.touched.email && profileFormik.errors.email}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: '#717171', fontSize: { xs: 18, sm: 20 } }} /></InputAdornment>,
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: { xs: '10px', sm: '12px' } } }}
                  />
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone_number"
                    size="small"
                    value={profileFormik.values.phone_number}
                    onChange={profileFormik.handleChange}
                    onBlur={profileFormik.handleBlur}
                    error={profileFormik.touched.phone_number && Boolean(profileFormik.errors.phone_number)}
                    helperText={profileFormik.touched.phone_number && profileFormik.errors.phone_number}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ color: '#717171', fontSize: { xs: 18, sm: 20 } }} /></InputAdornment>,
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: { xs: '10px', sm: '12px' } } }}
                  />
                  <TextField
                    fullWidth
                    label="Date of Birth"
                    name="date_of_birth"
                    type="date"
                    size="small"
                    value={profileFormik.values.date_of_birth}
                    onChange={profileFormik.handleChange}
                    onBlur={profileFormik.handleBlur}
                    error={profileFormik.touched.date_of_birth && Boolean(profileFormik.errors.date_of_birth)}
                    helperText={profileFormik.touched.date_of_birth && profileFormik.errors.date_of_birth}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><CalendarIcon sx={{ color: '#717171', fontSize: { xs: 18, sm: 20 } }} /></InputAdornment>,
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: { xs: '10px', sm: '12px' } } }}
                  />
                  <Autocomplete
                    freeSolo
                    options={COUNTRIES}
                    size="small"
                    getOptionLabel={(option) => {
                      if (typeof option === 'string') return option;
                      return option.name;
                    }}
                    value={COUNTRIES.find(c => c.name === profileFormik.values.country) || profileFormik.values.country || null}
                    onChange={(event, newValue) => {
                      // When selecting from dropdown, only store the country name (no flag)
                      const countryName = typeof newValue === 'string' ? newValue : newValue?.name || '';
                      profileFormik.setFieldValue('country', countryName);
                    }}
                    onInputChange={(event, newInputValue) => {
                      // When typing, only store the text (no flag)
                      if (event?.type === 'change') {
                        profileFormik.setFieldValue('country', newInputValue);
                      }
                    }}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontSize: { xs: '13px', sm: '14px' } }}>
                        <span style={{ fontSize: '18px' }}>{option.flag}</span>
                        <span>{option.name}</span>
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        label="Country"
                        name="country"
                        onBlur={profileFormik.handleBlur}
                        error={profileFormik.touched.country && Boolean(profileFormik.errors.country)}
                        helperText={profileFormik.touched.country && profileFormik.errors.country}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                {COUNTRIES.find(c => c.name === profileFormik.values.country)?.flag ? (
                                  <span style={{ fontSize: '18px' }}>{COUNTRIES.find(c => c.name === profileFormik.values.country)?.flag}</span>
                                ) : (
                                  <LocationIcon sx={{ color: '#717171', fontSize: { xs: 18, sm: 20 } }} />
                                )}
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: { xs: '10px', sm: '12px' } } }}
                      />
                    )}
                  />
                </Box>

                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  size="small"
                  value={profileFormik.values.address}
                  onChange={profileFormik.handleChange}
                  onBlur={profileFormik.handleBlur}
                  error={profileFormik.touched.address && Boolean(profileFormik.errors.address)}
                  helperText={profileFormik.touched.address && profileFormik.errors.address}
                  multiline
                  rows={2}
                  sx={{ mt: { xs: 2, sm: 2.5 }, '& .MuiOutlinedInput-root': { borderRadius: { xs: '10px', sm: '12px' } } }}
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 2, sm: 2.5 }, mt: { xs: 2, sm: 2.5 } }}>
                  <TextField
                    fullWidth
                    label="City"
                    name="city"
                    size="small"
                    value={profileFormik.values.city}
                    onChange={profileFormik.handleChange}
                    onBlur={profileFormik.handleBlur}
                    error={profileFormik.touched.city && Boolean(profileFormik.errors.city)}
                    helperText={profileFormik.touched.city && profileFormik.errors.city}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: { xs: '10px', sm: '12px' } } }}
                  />
                  <TextField
                    fullWidth
                    label="Postal Code"
                    name="postal_code"
                    size="small"
                    value={profileFormik.values.postal_code}
                    onChange={profileFormik.handleChange}
                    onBlur={profileFormik.handleBlur}
                    error={profileFormik.touched.postal_code && Boolean(profileFormik.errors.postal_code)}
                    helperText={profileFormik.touched.postal_code && profileFormik.errors.postal_code}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: { xs: '10px', sm: '12px' } } }}
                  />
                </Box>

                <Box sx={{ mt: { xs: 2, sm: 3 }, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={profileFormik.isSubmitting || !profileFormik.dirty}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: { xs: '10px', sm: '12px' },
                      px: { xs: 3, sm: 4 },
                      py: { xs: 1, sm: 1.5 },
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: { xs: '13px', sm: '15px' },
                      boxShadow: '0 4px 14px rgba(102, 126, 234, 0.35)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
                      },
                      '&.Mui-disabled': {
                        background: '#DDDDDD',
                        color: '#999999',
                      },
                    }}
                  >
                    {profileFormik.isSubmitting ? (
                      <CircularProgress size={20} sx={{ color: '#FFFFFF' }} />
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* Security Section */}
            <Box
              sx={{
                bgcolor: '#FFFFFF',
                borderRadius: { xs: '12px', sm: '16px' },
                border: '1px solid #EBEBEB',
                overflow: 'hidden',
              }}
            >
              {/* Header - Clickable */}
              <Box
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                sx={{
                  p: { xs: 2, sm: 4 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  '&:hover': { bgcolor: '#F7F7F7' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
                  <Box
                    sx={{
                      width: { xs: 36, sm: 44 },
                      height: { xs: 36, sm: 44 },
                      borderRadius: { xs: '10px', sm: '12px' },
                      background: 'linear-gradient(135deg, rgba(0, 138, 5, 0.1) 0%, rgba(0, 138, 5, 0.05) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShieldIcon sx={{ color: '#008A05', fontSize: { xs: 20, sm: 24 } }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: { xs: '16px', sm: '20px' }, fontWeight: 600, color: '#222222' }}>
                      Password & Security
                    </Typography>
                    <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, color: '#717171' }}>
                      Keep your account secure by updating your password
                    </Typography>
                  </Box>
                </Box>
                {showPasswordSection ? (
                  <ExpandLess sx={{ color: '#717171', fontSize: { xs: 22, sm: 24 } }} />
                ) : (
                  <ExpandMore sx={{ color: '#717171', fontSize: { xs: 22, sm: 24 } }} />
                )}
              </Box>

              {/* Collapsible Content */}
              <Collapse in={showPasswordSection}>
                <Box sx={{ px: { xs: 2, sm: 4 }, pb: { xs: 2, sm: 4 } }}>
                  <Divider sx={{ mb: { xs: 2, sm: 3 } }} />

                  {(passwordError || passwordSuccess) && (
                    <Alert
                      severity={passwordError ? "error" : "success"}
                      sx={{ mb: { xs: 2, sm: 3 }, borderRadius: { xs: '10px', sm: '12px' } }}
                      onClose={() => { setPasswordError(''); setPasswordSuccess(''); }}
                    >
                      {passwordError || passwordSuccess}
                    </Alert>
                  )}

                  <Box component="form" onSubmit={passwordFormik.handleSubmit}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 2.5 } }}>
                      <TextField
                        fullWidth
                        label="Current Password"
                        name="current_password"
                        size="small"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordFormik.values.current_password}
                        onChange={passwordFormik.handleChange}
                        onBlur={passwordFormik.handleBlur}
                        error={passwordFormik.touched.current_password && Boolean(passwordFormik.errors.current_password)}
                        helperText={passwordFormik.touched.current_password && passwordFormik.errors.current_password}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: '#717171', fontSize: { xs: 18, sm: 20 } }} /></InputAdornment>,
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end" size="small">
                                {showCurrentPassword ? <VisibilityOff sx={{ fontSize: { xs: 18, sm: 20 } }} /> : <Visibility sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: { xs: '10px', sm: '12px' } } }}
                      />
                      <TextField
                        fullWidth
                        label="New Password"
                        name="new_password"
                        size="small"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordFormik.values.new_password}
                        onChange={passwordFormik.handleChange}
                        onBlur={passwordFormik.handleBlur}
                        error={passwordFormik.touched.new_password && Boolean(passwordFormik.errors.new_password)}
                        helperText={passwordFormik.touched.new_password && passwordFormik.errors.new_password}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: '#717171', fontSize: { xs: 18, sm: 20 } }} /></InputAdornment>,
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end" size="small">
                                {showNewPassword ? <VisibilityOff sx={{ fontSize: { xs: 18, sm: 20 } }} /> : <Visibility sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: { xs: '10px', sm: '12px' } } }}
                      />
                      <TextField
                        fullWidth
                        label="Confirm New Password"
                        name="confirm_new_password"
                        size="small"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordFormik.values.confirm_new_password}
                        onChange={passwordFormik.handleChange}
                        onBlur={passwordFormik.handleBlur}
                        error={passwordFormik.touched.confirm_new_password && Boolean(passwordFormik.errors.confirm_new_password)}
                        helperText={passwordFormik.touched.confirm_new_password && passwordFormik.errors.confirm_new_password}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: '#717171', fontSize: { xs: 18, sm: 20 } }} /></InputAdornment>,
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small">
                                {showConfirmPassword ? <VisibilityOff sx={{ fontSize: { xs: 18, sm: 20 } }} /> : <Visibility sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: { xs: '10px', sm: '12px' } } }}
                      />
                    </Box>

                    <Box sx={{ mt: { xs: 2, sm: 3 }, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={passwordFormik.isSubmitting || !passwordFormik.dirty}
                        sx={{
                          bgcolor: '#222222',
                          borderRadius: { xs: '10px', sm: '12px' },
                          px: { xs: 3, sm: 4 },
                          py: { xs: 1, sm: 1.5 },
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: { xs: '13px', sm: '15px' },
                          '&:hover': { bgcolor: '#000000' },
                          '&.Mui-disabled': {
                            background: '#DDDDDD',
                            color: '#999999',
                          },
                        }}
                      >
                        {passwordFormik.isSubmitting ? (
                          <CircularProgress size={20} sx={{ color: '#FFFFFF' }} />
                        ) : (
                          'Update Password'
                        )}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Collapse>
            </Box>

            {/* Saved Payment Methods Section */}
            <Box
              sx={{
                bgcolor: '#FFFFFF',
                borderRadius: { xs: '12px', sm: '16px' },
                border: '1px solid #EBEBEB',
                overflow: 'hidden',
                mt: { xs: 2, sm: 3 },
              }}
            >
              {/* Header - Clickable */}
              <Box
                onClick={() => setShowPaymentSection(!showPaymentSection)}
                sx={{
                  p: { xs: 2, sm: 4 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  '&:hover': { bgcolor: '#F7F7F7' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
                  <Box
                    sx={{
                      width: { xs: 36, sm: 44 },
                      height: { xs: 36, sm: 44 },
                      borderRadius: { xs: '10px', sm: '12px' },
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CreditCardIcon sx={{ color: '#667eea', fontSize: { xs: 20, sm: 24 } }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: { xs: '16px', sm: '20px' }, fontWeight: 600, color: '#222222' }}>
                      Payment Methods
                    </Typography>
                    <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, color: '#717171' }}>
                      {savedCards.length > 0 ? `${savedCards.length} saved card${savedCards.length > 1 ? 's' : ''}` : 'Manage your saved cards'}
                    </Typography>
                  </Box>
                </Box>
                {showPaymentSection ? (
                  <ExpandLess sx={{ color: '#717171', fontSize: { xs: 22, sm: 24 } }} />
                ) : (
                  <ExpandMore sx={{ color: '#717171', fontSize: { xs: 22, sm: 24 } }} />
                )}
              </Box>

              {/* Collapsible Content */}
              <Collapse in={showPaymentSection}>
                <Box sx={{ px: { xs: 2, sm: 4 }, pb: { xs: 2, sm: 4 } }}>
                  <Divider sx={{ mb: { xs: 2, sm: 3 } }} />

                  {(cardError || cardSuccess) && (
                    <Alert
                      severity={cardError ? "error" : "success"}
                      sx={{ mb: { xs: 2, sm: 3 }, borderRadius: { xs: '10px', sm: '12px' } }}
                      onClose={() => { setCardError(''); setCardSuccess(''); }}
                    >
                      {cardError || cardSuccess}
                    </Alert>
                  )}

                  {loadingSavedCards ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                      <CircularProgress size={24} sx={{ color: '#667eea' }} />
                    </Box>
                  ) : savedCards.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <CreditCardIcon sx={{ fontSize: 48, color: '#DDDDDD', mb: 1 }} />
                      <Typography sx={{ fontSize: '15px', color: '#717171', mb: 2 }}>
                        No saved cards yet
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setShowAddCardDialog(true)}
                        sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: '10px',
                          textTransform: 'none',
                          fontWeight: 600,
                          px: 3,
                          py: 1,
                        }}
                      >
                        Add a Card
                      </Button>
                    </Box>
                  ) : (
                    <>
                      {/* Saved Cards List */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {savedCards.map((card) => (
                          <Box
                            key={card.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              p: { xs: 1.5, sm: 2 },
                              borderRadius: '12px',
                              border: card.is_default ? '2px solid #667eea' : '1px solid #EBEBEB',
                              bgcolor: card.is_default ? 'rgba(102, 126, 234, 0.03)' : 'transparent',
                            }}
                          >
                            {/* Card Logo */}
                            <Box
                              sx={{
                                width: 50,
                                height: 32,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: '#F7F7F7',
                                borderRadius: '6px',
                              }}
                            >
                              {CARD_LOGOS[card.card_type] ? (
                                <Box
                                  component="img"
                                  src={CARD_LOGOS[card.card_type]}
                                  alt={card.card_type}
                                  sx={{ width: 36, height: 24, objectFit: 'contain' }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentNode.innerHTML = '<span style="font-size: 12px; color: #717171; text-transform: uppercase;">' + card.card_type + '</span>';
                                  }}
                                />
                              ) : (
                                <CreditCardIcon sx={{ fontSize: 20, color: '#717171' }} />
                              )}
                            </Box>

                            {/* Card Details */}
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontSize: { xs: '14px', sm: '15px' }, fontWeight: 600, color: '#222222' }}>
                                  •••• •••• •••• {card.last_four}
                                </Typography>
                                {card.is_default && (
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 0.5,
                                      px: 1,
                                      py: 0.25,
                                      bgcolor: '#667eea',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    <StarIcon sx={{ fontSize: 10, color: 'white' }} />
                                    <Typography sx={{ fontSize: '10px', color: 'white', fontWeight: 600 }}>
                                      Default
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                              <Typography sx={{ fontSize: { xs: '12px', sm: '13px' }, color: '#717171' }}>
                                {card.cardholder_name} · Expires {card.expiry_display}
                              </Typography>
                            </Box>

                            {/* Actions */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {!card.is_default && (
                                <Button
                                  size="small"
                                  onClick={() => handleSetDefaultCard(card.id)}
                                  sx={{
                                    fontSize: '12px',
                                    textTransform: 'none',
                                    color: '#667eea',
                                    minWidth: 'auto',
                                    px: 1,
                                  }}
                                >
                                  Set default
                                </Button>
                              )}
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteCard(card.id)}
                                disabled={deletingCardId === card.id}
                                sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEE2E2' } }}
                              >
                                {deletingCardId === card.id ? (
                                  <CircularProgress size={16} sx={{ color: '#EF4444' }} />
                                ) : (
                                  <DeleteIcon sx={{ fontSize: 18 }} />
                                )}
                              </IconButton>
                            </Box>
                          </Box>
                        ))}
                      </Box>

                      {/* Add New Card Button */}
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => setShowAddCardDialog(true)}
                        sx={{
                          mt: 2,
                          color: '#667eea',
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '14px',
                          '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.05)' },
                        }}
                      >
                        Add another card
                      </Button>
                    </>
                  )}
                </Box>
              </Collapse>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Add Card Dialog */}
      <Dialog
        open={showAddCardDialog}
        onClose={() => {
          setShowAddCardDialog(false);
          setCardError('');
          setNewCardData({
            cardNumber: '',
            expiryDate: '',
            cvv: '',
            cardholderName: '',
            isDefault: false,
          });
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
      >
        <Box
          sx={{
            bgcolor: '#222222',
            px: 3,
            py: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF' }}>
            Add Payment Card
          </Typography>
          <IconButton
            onClick={() => {
              setShowAddCardDialog(false);
              setCardError('');
            }}
            sx={{ color: '#FFFFFF', p: 0.5 }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          {cardError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>
              {cardError}
            </Alert>
          )}

          {/* Card Number */}
          <TextField
            fullWidth
            label="Card number"
            value={newCardData.cardNumber}
            onChange={handleCardDataChange('cardNumber')}
            placeholder="1234 5678 9012 3456"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CreditCardIcon sx={{ color: '#717171', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: getCardType(newCardData.cardNumber) && CARD_LOGOS[getCardType(newCardData.cardNumber)] && (
                <Box
                  component="img"
                  src={CARD_LOGOS[getCardType(newCardData.cardNumber)]}
                  alt=""
                  sx={{ width: 32, height: 20, objectFit: 'contain' }}
                />
              ),
            }}
            inputProps={{ maxLength: 19 }}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />

          {/* Expiry and CVV */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Expiry date"
              value={newCardData.expiryDate}
              onChange={handleCardDataChange('expiryDate')}
              placeholder="MM/YY"
              size="small"
              inputProps={{ maxLength: 5 }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <TextField
              fullWidth
              label="CVV"
              value={newCardData.cvv}
              onChange={handleCardDataChange('cvv')}
              placeholder="123"
              type="password"
              size="small"
              inputProps={{ maxLength: 4 }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </Box>

          {/* Cardholder Name */}
          <TextField
            fullWidth
            label="Cardholder name"
            value={newCardData.cardholderName}
            onChange={handleCardDataChange('cardholderName')}
            placeholder="Name as shown on card"
            size="small"
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />

          {/* Set as default */}
          <FormControlLabel
            control={
              <Checkbox
                checked={newCardData.isDefault}
                onChange={(e) => setNewCardData(prev => ({ ...prev, isDefault: e.target.checked }))}
                size="small"
                sx={{ '&.Mui-checked': { color: '#667eea' } }}
              />
            }
            label={
              <Typography sx={{ fontSize: '13px', color: '#222222' }}>
                Set as default payment method
              </Typography>
            }
          />

          {/* Security note */}
          <Box
            sx={{
              mt: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1.5,
              bgcolor: '#F7F7F7',
              borderRadius: '8px',
            }}
          >
            <LockIcon sx={{ fontSize: 16, color: '#008A05' }} />
            <Typography sx={{ fontSize: '12px', color: '#717171' }}>
              Your card information is encrypted and secure
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2.5, borderTop: '1px solid #EBEBEB', gap: 1 }}>
          <Button
            onClick={() => {
              setShowAddCardDialog(false);
              setCardError('');
            }}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              px: 3,
              py: 1,
              color: '#222222',
              border: '1px solid #222222',
              '&:hover': { bgcolor: '#F7F7F7' },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddCard}
            disabled={addingCard}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              px: 3,
              py: 1,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
              },
            }}
          >
            {addingCard ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Save Card'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
