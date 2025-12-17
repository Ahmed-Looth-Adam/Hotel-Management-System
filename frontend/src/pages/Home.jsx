/**
 * Home Page - Landing page with modern hotel booking aesthetic
 *
 * Features:
 * - Hero with functional search
 * - Featured Hotels from API
 * - Clean, modern design
 *
 * Refactored By: Agent
 */

import React from 'react';
import { Box } from '@mui/material';
import Hero from '../components/landing/Hero';
import FeaturedListings from '../components/landing/FeaturedListings';
import { Footer } from '../components/layout';

function Home() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Hero />
      <FeaturedListings />
      <Footer />
    </Box>
  );
}

export default Home;
