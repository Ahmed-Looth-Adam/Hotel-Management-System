/**
 * Home Page - Landing page with modern hotel booking aesthetic
 *
 * Features:
 * - Hero with functional search
 * - Featured Hotels from API
 * - Room Types with pricing
 * - Why Choose Us section
 * - Clean, modern design
 *
 * Refactored By: Agent
 */

import React from 'react';
import { Box } from '@mui/material';
import Hero from '../components/landing/Hero';
import FeaturedListings from '../components/landing/FeaturedListings';
import RoomTypesSection from '../components/landing/RoomTypesSection';
import WhyChooseUs from '../components/landing/WhyChooseUs';
import { Footer } from '../components/layout';

function Home() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Hero />
      <FeaturedListings />
      <RoomTypesSection />
      <WhyChooseUs />
      <Footer />
    </Box>
  );
}

export default Home;
