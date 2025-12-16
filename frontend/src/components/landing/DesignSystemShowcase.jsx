import React from 'react';
import { Box, Container, Typography, Grid, Paper, Button, Chip, Stack, useTheme } from '@mui/material';

const ColorSwatch = ({ color, name, hex }) => (
    <Box sx={{ mb: 2 }}>
        <Box
            sx={{
                width: '100%',
                height: 100,
                bgcolor: color,
                borderRadius: 2,
                mb: 1,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
        />
        <Typography variant="subtitle2" fontWeight="bold">{name}</Typography>
        <Typography variant="caption" color="text.secondary">{hex}</Typography>
    </Box>
);

const DesignSystemShowcase = () => {
    const theme = useTheme();

    return (
        <Box sx={{ py: 8, bgcolor: '#f7f7f7' }}>
            <Container maxWidth="lg">
                <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 1 }}>
                    Design System
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 6 }}>
                    Airbnb-inspired "Emerald & Sand" Aesthetic.
                </Typography>

                {/* Colors Section */}
                <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">Color Palette</Typography>
                    <Grid container spacing={4}>
                        <Grid item xs={6} md={3}>
                            <ColorSwatch color="primary.main" name="Primary (Emerald)" hex={theme.palette.primary.main} />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <ColorSwatch color="primary.light" name="Primary Light" hex={theme.palette.primary.light} />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <ColorSwatch color="primary.dark" name="Primary Dark" hex={theme.palette.primary.dark} />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <ColorSwatch color="secondary.main" name="Secondary (Coral)" hex={theme.palette.secondary.main} />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <ColorSwatch color="#F2A900" name="Accent (Sand)" hex="#F2A900" />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <ColorSwatch color="text.primary" name="Text Primary" hex={theme.palette.text.primary} />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <ColorSwatch color="text.secondary" name="Text Secondary" hex={theme.palette.text.secondary} />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Typography Section */}
                <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>Typography</Typography>
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Typography variant="h1" gutterBottom>Heading 1</Typography>
                            <Typography variant="h2" gutterBottom>Heading 2</Typography>
                            <Typography variant="h3" gutterBottom>Heading 3</Typography>
                            <Typography variant="h4" gutterBottom>Heading 4</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" gutterBottom>Subtitle 1 - Used for emphasizing text</Typography>
                            <Typography variant="body1" gutterBottom>Body 1 - The quick brown fox jumps over the lazy dog. Standard body text for paragraphs.</Typography>
                            <Typography variant="body2" gutterBottom>Body 2 - Smaller text for descriptions and secondary information.</Typography>
                            <Button variant="text">Button Text</Button>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Components Section */}
                <Paper sx={{ p: 4, borderRadius: 3 }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>Interactive Components</Typography>

                    <Stack direction="row" spacing={2} sx={{ mb: 4 }} flexWrap="wrap">
                        <Button variant="contained" color="primary">Primary Action</Button>
                        <Button variant="outlined" color="primary">Secondary Action</Button>
                        <Button variant="text" color="primary">Tertiary Action</Button>
                        <Button variant="contained" disabled>Disabled</Button>
                    </Stack>

                    <Stack direction="row" spacing={2} sx={{ mb: 4 }} flexWrap="wrap">
                        <Button variant="contained" color="secondary">Accent Action</Button>
                        <Button variant="outlined" color="secondary">Accent Outlined</Button>
                    </Stack>

                    <Stack direction="row" spacing={2}>
                        <Chip label="Chip Default" />
                        <Chip label="Chip Primary" color="primary" />
                        <Chip label="Chip Secondary" color="secondary" />
                        <Chip label="Chip Outlined" variant="outlined" />
                    </Stack>
                </Paper>

            </Container>
        </Box>
    );
};

export default DesignSystemShowcase;
