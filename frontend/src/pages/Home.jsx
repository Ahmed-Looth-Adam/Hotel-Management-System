/**
 * Home Page - Landing page with Airbnb-style aesthetic
 *
 * Features:
 * - Airbnb-style Hero with search pill
 * - Featured Listings Grid
 * - Design System Showcase (for developers)
 * - Reuse of existing Footer
 *
 * Refactored By: Agent
 */

import React from 'react';
import { Box, Divider } from '@mui/material';
import Hero from '../components/landing/Hero';
import FeaturedListings from '../components/landing/FeaturedListings';
import DesignSystemShowcase from '../components/landing/DesignSystemShowcase';
import { Footer } from '../components/layout'; // Barrel export

function Home() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Hero />

      <FeaturedListings />

      <Divider sx={{ my: 4 }} />

      {/* Design System Showcase Section (Requested by User) */}
      <DesignSystemShowcase />

      <Footer />
    </Box>
  );
}

export default Home;
