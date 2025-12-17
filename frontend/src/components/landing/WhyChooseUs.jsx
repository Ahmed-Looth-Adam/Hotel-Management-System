import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  alpha,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Support as SupportIcon,
  Payment as PaymentIcon,
  Star as StarIcon,
  LocalOffer as OfferIcon,
  Wifi as WifiIcon,
} from '@mui/icons-material';

const features = [
  {
    icon: StarIcon,
    title: 'Premium Quality',
    description: '5-star hotels across London, Paris, New York, and Dubai with exceptional service.',
    color: '#FFB400',
  },
  {
    icon: SecurityIcon,
    title: 'Secure Booking',
    description: 'Your data is protected with industry-standard encryption and secure payment processing.',
    color: '#4caf50',
  },
  {
    icon: OfferIcon,
    title: 'Best Price Guarantee',
    description: 'We offer competitive rates with flexible cancellation policies for peace of mind.',
    color: '#2196f3',
  },
  {
    icon: SupportIcon,
    title: '24/7 Support',
    description: 'Our dedicated team is available around the clock to assist with your needs.',
    color: '#9c27b0',
  },
  {
    icon: PaymentIcon,
    title: 'Easy Payments',
    description: 'Multiple payment options including all major credit cards for your convenience.',
    color: '#ff5722',
  },
  {
    icon: WifiIcon,
    title: 'Modern Amenities',
    description: 'Free WiFi, smart TVs, and premium amenities in every room for a comfortable stay.',
    color: '#00bcd4',
  },
];

const FeatureCard = ({ feature }) => (
  <Paper
    elevation={0}
    sx={{
      p: 4,
      height: '100%',
      borderRadius: 4,
      border: '1px solid',
      borderColor: 'divider',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
        borderColor: alpha(feature.color, 0.5),
      },
    }}
  >
    <Box
      sx={{
        width: 56,
        height: 56,
        borderRadius: 3,
        bgcolor: alpha(feature.color, 0.1),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 2,
      }}
    >
      <feature.icon sx={{ fontSize: 28, color: feature.color }} />
    </Box>
    <Typography variant="h6" fontWeight={700} gutterBottom>
      {feature.title}
    </Typography>
    <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
      {feature.description}
    </Typography>
  </Paper>
);

const WhyChooseUs = () => {
  return (
    <Container maxWidth="xl" sx={{ py: { xs: 6, md: 10 } }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography
          variant="h3"
          fontWeight={800}
          sx={{ mb: 2, letterSpacing: '-0.02em' }}
        >
          Why Choose Us
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ maxWidth: 600, mx: 'auto', fontWeight: 400 }}
        >
          Experience unparalleled hospitality with our world-class services and amenities.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 3,
        }}
      >
        {features.map((feature, index) => (
          <FeatureCard key={index} feature={feature} />
        ))}
      </Box>
    </Container>
  );
};

export default WhyChooseUs;
