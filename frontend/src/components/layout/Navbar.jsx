/**
 * Navbar Component - Modern Minimalist
 *
 * Design:
 * - Pure White / Transparent
 * - Minimal Links (Just text, no buttons)
 * - User Menu Avatar only
 * - Logo text only (Black)
 *
 * Refactored By: Agent
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoginModal from '../auth/LoginModal';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Container,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout as LogoutIcon,
  Language as LanguageIcon, // Global icon often used
} from '@mui/icons-material';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // User menu handlers
  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);
  const handleLogout = async () => {
    handleCloseUserMenu();
    navigate('/');
    await logout();
  };

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          bgcolor: 'white',
          color: 'text.primary',
          borderBottom: '1px solid #f2f2f2',
          boxShadow: 'none'
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: '80px', display: 'flex', justifyContent: 'space-between' }}>

            {/* Left: Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {/* Mobile Menu Icon */}
              {isMobile && (
                <IconButton
                  size="large"
                  onClick={() => setMobileMenuOpen(true)}
                  color="inherit"
                  sx={{ mr: 1 }}
                >
                  <MenuIcon />
                </IconButton>
              )}

              <Typography
                variant="h5"
                noWrap
                component={Link}
                to="/"
                sx={{
                  fontWeight: 800,
                  color: '#ff385c', // Keep slight brand color or use black
                  textDecoration: 'none',
                  letterSpacing: '-0.5px'
                }}
              >
                <Box component="span" sx={{ color: 'primary.main' }}>hotel</Box>
                <Box component="span" sx={{ color: 'primary.main', fontWeight: 400 }}>mgmt</Box>
              </Typography>
            </Box>

            {/* Center: Links (Desktop) */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3 }}>
              <Button
                color="inherit"
                component={Link}
                to="/"
                sx={{ fontWeight: 600, fontSize: '1rem', '&:hover': { bgcolor: 'transparent', opacity: 0.7 } }}
                disableRipple
              >
                Stays
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/bookings"
                sx={{ fontWeight: 400, fontSize: '1rem', color: 'text.secondary', '&:hover': { bgcolor: 'transparent', color: 'text.primary' } }}
                disableRipple
              >
                Experiences
              </Button>
            </Box>

            {/* Right: User Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>

              {!isMobile && (
                <Button
                  color="inherit"
                  sx={{ borderRadius: 4, textTransform: 'none', color: 'text.primary' }}
                  onClick={() => navigate('/hotels')} // Example link
                >
                  Browse Hotels
                </Button>
              )}

              <IconButton size="small">
                <LanguageIcon fontSize="small" />
              </IconButton>

              <Box
                sx={{
                  border: '1px solid #dddddd',
                  borderRadius: 30,
                  p: '4px',
                  pl: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  '&:hover': { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
                }}
                onClick={isAuthenticated ? handleOpenUserMenu : () => setLoginModalOpen(true)}
              >
                <MenuIcon fontSize="small" />
                <Avatar
                  sx={{ width: 32, height: 32, bgcolor: 'text.secondary' }}
                  src={user?.avatar}
                >
                  {user ? user.username[0].toUpperCase() : null}
                </Avatar>
              </Box>

              {/* Dropdown Menu */}
              <Menu
                sx={{ mt: '45px' }}
                id="user-menu"
                anchorEl={anchorElUser}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                keepMounted
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                    mt: 1.5,
                    borderRadius: 3,
                    minWidth: 200
                  }
                }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {isAuthenticated ? `Hi, ${user?.username}` : 'Welcome'}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={() => navigate('/dashboard')}>Dashboard</MenuItem>
                <MenuItem onClick={() => navigate('/bookings')}>My Trips</MenuItem>
                <MenuItem onClick={() => navigate('/profile')}>Account</MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>Log out</MenuItem>
              </Menu>
            </Box>

          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Menu Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        <Box sx={{ width: 250, p: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Menu</Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            <ListItemButton onClick={() => navigate('/')}><ListItemText primary="Home" /></ListItemButton>
            <ListItemButton onClick={() => navigate('/bookings')}><ListItemText primary="My Bookings" /></ListItemButton>
            {isAuthenticated ? (
              <ListItemButton onClick={handleLogout}><ListItemText primary="Log out" /></ListItemButton>
            ) : (
              <ListItemButton onClick={() => setLoginModalOpen(true)}><ListItemText primary="Log in" /></ListItemButton>
            )}
          </List>
        </Box>
      </Drawer>

      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSwitchToRegister={() => navigate('/register')}
      />
    </>
  );
};

export default Navbar;
