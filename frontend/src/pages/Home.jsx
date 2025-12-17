/**
 * Home Page - Airbnb-style landing page
 *
 * Features:
 * - Sticky search header with Airbnb-style animations
 * - Category tabs for filtering
 * - Hotel grid with card carousel
 * - Smooth animations throughout
 */

import React, { useState } from 'react';
import { Box } from '@mui/material';
import Hero from '../components/landing/Hero';
import CategoryTabs from '../components/landing/CategoryTabs';
import FeaturedListings from '../components/landing/FeaturedListings';
import { Footer } from '../components/layout';

function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FFFFFF' }}>
      {/* Sticky Header with Search */}
      <Hero />

      {/* Category Tabs */}
      <CategoryTabs
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Hotel Listings */}
      <FeaturedListings />

      {/* Footer */}
      <Footer />
    </Box>
  );
}

export default Home;
