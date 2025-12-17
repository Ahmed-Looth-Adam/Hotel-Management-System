import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  alpha,
} from '@mui/material';
import {
  KingBed as BedIcon,
  Person as PersonIcon,
  ArrowForward,
  Star as StarIcon,
} from '@mui/icons-material';

const roomTypes = [
  {
    id: 'standard',
    name: 'Standard Double',
    description: 'Comfortable room with a double bed, perfect for couples or solo travelers.',
    capacity: 2,
    offPeakPrice: 120,
    peakPrice: 180,
    amenities: ['Free WiFi', 'TV', 'Air Conditioning', 'Private Bathroom'],
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
    popular: false,
  },
  {
    id: 'deluxe',
    name: 'Deluxe King',
    description: 'Spacious room with a king-size bed and premium amenities for a luxurious stay.',
    capacity: 2,
    offPeakPrice: 180,
    peakPrice: 250,
    amenities: ['Free WiFi', 'Smart TV', 'Minibar', 'Safe', 'Bathrobe'],
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
    popular: true,
  },
  {
    id: 'suite',
    name: 'Family Suite',
    description: 'Large suite ideal for families, featuring separate sleeping areas and extra space.',
    capacity: 4,
    offPeakPrice: 240,
    peakPrice: 320,
    amenities: ['Free WiFi', 'Smart TV', 'Living Area', 'Kitchenette', 'Safe'],
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800',
    popular: false,
  },
  {
    id: 'penthouse',
    name: 'Penthouse',
    description: 'Ultimate luxury penthouse with panoramic views and exclusive amenities.',
    capacity: 4,
    offPeakPrice: 500,
    peakPrice: 750,
    amenities: ['Private Terrace', 'Jacuzzi', 'Butler Service', 'Kitchen', 'Living Area'],
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
    popular: false,
  },
];

const RoomTypeCard = ({ room, onClick }) => (
  <Card
    sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 4,
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      position: 'relative',
      '&:hover': {
        transform: 'translateY(-8px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
      },
    }}
    onClick={onClick}
  >
    {/* Image */}
    <Box
      sx={{
        position: 'relative',
        height: 200,
        backgroundImage: `url(${room.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {room.popular && (
        <Chip
          icon={<StarIcon sx={{ fontSize: 14 }} />}
          label="Most Popular"
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            bgcolor: '#FFB400',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.7rem',
          }}
        />
      )}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          p: 2,
          pt: 4,
        }}
      >
        <Typography variant="h6" fontWeight={700} color="white">
          {room.name}
        </Typography>
      </Box>
    </Box>

    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
        {room.description}
      </Typography>

      {/* Capacity */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        <Typography variant="body2" color="text.secondary">
          Up to {room.capacity} guests
        </Typography>
      </Box>

      {/* Amenities */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 3 }}>
        {room.amenities.slice(0, 4).map((amenity) => (
          <Chip
            key={amenity}
            label={amenity}
            size="small"
            sx={{
              bgcolor: alpha('#1a1f37', 0.05),
              fontSize: '0.7rem',
              height: 24,
            }}
          />
        ))}
        {room.amenities.length > 4 && (
          <Chip
            label={`+${room.amenities.length - 4} more`}
            size="small"
            sx={{
              bgcolor: alpha('#1a1f37', 0.05),
              fontSize: '0.7rem',
              height: 24,
            }}
          />
        )}
      </Box>

      {/* Price */}
      <Box sx={{ mt: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography variant="h5" fontWeight={800} color="primary">
            £{room.offPeakPrice}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            / night
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Peak season from £{room.peakPrice}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

const RoomTypesSection = () => {
  const navigate = useNavigate();

  const handleRoomClick = (roomType) => {
    navigate(`/guest/rooms?roomType=${roomType.id}`);
  };

  return (
    <Box sx={{ bgcolor: '#f8f9fa', py: { xs: 6, md: 10 } }}>
      <Container maxWidth="xl">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h3"
            fontWeight={800}
            sx={{ mb: 2, letterSpacing: '-0.02em' }}
          >
            Our Room Types
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 600, mx: 'auto', fontWeight: 400 }}
          >
            From cozy standard rooms to luxurious penthouses, find the perfect space for your stay.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 3,
            mb: 4,
          }}
        >
          {roomTypes.map((room) => (
            <RoomTypeCard
              key={room.id}
              room={room}
              onClick={() => handleRoomClick(room)}
            />
          ))}
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            onClick={() => navigate('/guest/rooms')}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            Browse All Rooms
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default RoomTypesSection;
