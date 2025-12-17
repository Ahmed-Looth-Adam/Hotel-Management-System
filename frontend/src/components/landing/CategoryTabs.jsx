import React, { useState, useRef, useEffect } from 'react';
import { Box, Container, Typography, IconButton } from '@mui/material';
import {
  Hotel,
  Villa,
  Apartment,
  House,
  BeachAccess,
  Landscape,
  Pool,
  Castle,
  Sailing,
  Spa,
  LocalFireDepartment,
  Cabin,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';

// Airbnb-style animation timing
const springTransition = 'all 0.3s cubic-bezier(0.2, 0, 0, 1)';
const fastSpring = 'all 0.2s cubic-bezier(0.2, 0, 0, 1)';

const categories = [
  { id: 'all', label: 'All', icon: Hotel },
  { id: 'luxury', label: 'Luxury', icon: Castle },
  { id: 'beachfront', label: 'Beachfront', icon: BeachAccess },
  { id: 'city', label: 'City hotels', icon: Apartment },
  { id: 'resort', label: 'Resorts', icon: Pool },
  { id: 'boutique', label: 'Boutique', icon: Villa },
  { id: 'spa', label: 'Spa & Wellness', icon: Spa },
  { id: 'countryside', label: 'Countryside', icon: Landscape },
  { id: 'lakefront', label: 'Lakefront', icon: Sailing },
  { id: 'historic', label: 'Historic', icon: House },
  { id: 'cabin', label: 'Cabins', icon: Cabin },
  { id: 'trending', label: 'Trending', icon: LocalFireDepartment },
];

const CategoryTabs = ({ selectedCategory, onCategoryChange }) => {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener('resize', checkScrollPosition);
    return () => window.removeEventListener('resize', checkScrollPosition);
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScrollPosition, 300);
    }
  };

  return (
    <Box
      sx={{
        position: 'sticky',
        top: { xs: 70, md: 80 },
        zIndex: 99,
        bgcolor: '#FFFFFF',
        borderBottom: '1px solid #EBEBEB',
        py: 2,
      }}
    >
      <Container maxWidth="xl" sx={{ position: 'relative' }}>
        {/* Left Arrow */}
        {showLeftArrow && (
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
              background: 'linear-gradient(to right, #FFFFFF 60%, transparent)',
              pr: 4,
              display: { xs: 'none', md: 'block' },
            }}
          >
            <IconButton
              onClick={() => scroll('left')}
              sx={{
                bgcolor: '#FFFFFF',
                border: '1px solid #DDDDDD',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                width: 32,
                height: 32,
                transition: fastSpring,
                '&:hover': {
                  bgcolor: '#FFFFFF',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                  transform: 'scale(1.04)',
                },
              }}
            >
              <ChevronLeft sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        )}

        {/* Categories */}
        <Box
          ref={scrollRef}
          onScroll={checkScrollPosition}
          sx={{
            display: 'flex',
            gap: { xs: 3, md: 4 },
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            px: { xs: 0, md: 5 },
          }}
        >
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;

            return (
              <Box
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  minWidth: 'fit-content',
                  py: 1,
                  px: 0.5,
                  borderBottom: '2px solid',
                  borderColor: isSelected ? '#222222' : 'transparent',
                  transition: springTransition,
                  opacity: isSelected ? 1 : 0.7,
                  '&:hover': {
                    opacity: 1,
                    borderColor: isSelected ? '#222222' : '#DDDDDD',
                  },
                }}
              >
                <Icon
                  sx={{
                    fontSize: 24,
                    color: isSelected ? '#222222' : '#717171',
                    transition: fastSpring,
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: isSelected ? '#222222' : '#717171',
                    fontWeight: isSelected ? 600 : 500,
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                    transition: fastSpring,
                  }}
                >
                  {category.label}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Right Arrow */}
        {showRightArrow && (
          <Box
            sx={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
              background: 'linear-gradient(to left, #FFFFFF 60%, transparent)',
              pl: 4,
              display: { xs: 'none', md: 'block' },
            }}
          >
            <IconButton
              onClick={() => scroll('right')}
              sx={{
                bgcolor: '#FFFFFF',
                border: '1px solid #DDDDDD',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                width: 32,
                height: 32,
                transition: fastSpring,
                '&:hover': {
                  bgcolor: '#FFFFFF',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                  transform: 'scale(1.04)',
                },
              }}
            >
              <ChevronRight sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default CategoryTabs;
