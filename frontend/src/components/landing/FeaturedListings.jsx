import React from 'react';
import { Box, Container, Typography, Card, CardMedia, CardContent, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { FavoriteBorder, Star, ArrowForward } from '@mui/icons-material';

const ListingCard = ({ room, isMobile }) => (
    <Card
        sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            border: 'none',
            boxShadow: 'none',
            bgcolor: 'transparent',
            cursor: 'pointer',
            position: 'relative',
            minWidth: isMobile ? '280px' : 'auto', // Fixed width for scroll items
            maxWidth: isMobile ? '280px' : '100%', // Ensure it doesn't grow
            mx: isMobile ? 1 : 0, // Margin for scroll items
            scrollSnapAlign: 'start', // Snap alignment
            flexShrink: 0, // Prevent shrinking in flex container
        }}
    >
        {/* Image Container */}
        <Box sx={{
            position: 'relative',
            borderRadius: 4,
            overflow: 'hidden',
            mb: 2,
            aspectRatio: '1/1',
            bgcolor: '#f0f0f0'
        }}>
            <CardMedia
                component="img"
                image={room.image}
                alt={room.name}
                sx={{
                    height: '100%',
                    width: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.5s ease',
                    '&:hover': {
                        transform: 'scale(1.05)',
                    }
                }}
            />
            <IconButton
                sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    color: 'white',
                    backdropFilter: 'blur(4px)',
                    bgcolor: 'rgba(0,0,0,0.2)',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.4)' },
                    padding: '8px',
                }}
            >
                <FavoriteBorder sx={{ fontSize: '1.2rem' }} />
            </IconButton>
        </Box>

        <CardContent sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                <Typography variant="h6" fontWeight="700" sx={{ fontSize: '1.1rem', lineHeight: 1.2 }}>
                    {room.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Star sx={{ fontSize: 16 }} />
                    <Typography variant="body2" fontWeight="500">4.9</Typography>
                </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.95rem' }}>
                {room.features[0]} • {room.features[1]}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mt: 1 }}>
                <Typography variant="body1" fontWeight="700" color="text.primary">
                    {room.price}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    night
                </Typography>
            </Box>
        </CardContent>
    </Card>
);

const FeaturedListings = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const roomTypes = [
        {
            id: 1,
            name: 'Standard Room',
            description: 'Comfortable and affordable accommodation for solo travelers or couples',
            price: '£89',
            image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format&fit=crop',
            features: ['Queen Bed', '2 Guests', 'Free WiFi', 'City View'],
        },
        {
            id: 2,
            name: 'Deluxe Suite',
            description: 'Spacious suite with separate living area and premium amenities',
            price: '£159',
            image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&auto=format&fit=crop',
            features: ['King Bed', '4 Guests', 'Living Area', 'Ocean View'],
        },
        {
            id: 3,
            name: 'Presidential Suite',
            description: 'Luxurious suite with panoramic views and exclusive services',
            price: '£299',
            image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop',
            features: ['King Bed', '6 Guests', 'Private Terrace', 'Butler Service'],
        },
        {
            id: 4,
            name: 'Ocean View Villa',
            description: 'Stunning villa right on the beach',
            price: '£450',
            image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&auto=format&fit=crop',
            features: ['3 Beds', '6 Guests', 'Pool', 'Ocean Front'],
        }
    ];

    return (
        <Container maxWidth="xl" sx={{ py: { xs: 4, md: 8 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', mb: 4, px: { xs: 1, md: 0 } }}>
                <Box>
                    <Typography variant="h4" fontWeight="800" sx={{ mb: 1, letterSpacing: '-0.02em' }}>
                        Featured places to stay
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '400px' }}>
                        Curated selection of professionally designed stays.
                    </Typography>
                </Box>
                {!isMobile && (
                    <IconButton sx={{ border: '1px solid #ddd' }}>
                        <ArrowForward />
                    </IconButton>
                )}
            </Box>

            {isMobile ? (
                /* Mobile: Horizontal Scroll */
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    overflowX: 'auto',
                    gap: 2,
                    pb: 2,
                    mx: -2,
                    px: 2,
                    scrollSnapType: 'x mandatory',
                    '&::-webkit-scrollbar': { display: 'none' },
                    scrollbarWidth: 'none',
                    flexWrap: 'nowrap',
                    WebkitOverflowScrolling: 'touch', // Smooth scroll
                }}>
                    {roomTypes.map((room) => (
                        <ListingCard key={room.id} room={room} isMobile={true} />
                    ))}
                </Box>
            ) : (
                /* Desktop: CSS Grid - More robust than MUI Grid for this use case */
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: 'repeat(4, 1fr)'
                    },
                    gap: 4
                }}>
                    {roomTypes.map((room) => (
                        <ListingCard key={room.id} room={room} isMobile={false} />
                    ))}
                </Box>
            )}
        </Container>
    );
};

export default FeaturedListings;
