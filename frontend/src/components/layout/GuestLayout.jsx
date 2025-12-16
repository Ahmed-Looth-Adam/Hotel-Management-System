/**
 * Guest Layout Component - Customer-facing layout for guests
 *
 * Features:
 * - Top navigation bar (no sidebar)
 * - Clean, modern hotel booking site feel
 * - Browse rooms, My Bookings navigation
 * - Mobile responsive
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Container,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  ListAlt as BookingsIcon,
  AccountCircle,
  Logout as LogoutIcon,
  Hotel as HotelIcon,
} from '@mui/icons-material';

const GuestLayout = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);

  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const handleLogout = async () => {
    handleCloseUserMenu();
    await logout();
    navigate('/');
  };

  const isActivePath = (path) => location.pathname === path;

  const navItems = [
    { label: 'Browse Rooms', path: '/guest/rooms', icon: <SearchIcon /> },
    { label: 'My Bookings', path: '/guest/my-bookings', icon: <BookingsIcon /> },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Navigation */}
      <AppBar
        position="sticky"
        sx={{
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: '70px' }}>
            {/* Mobile Menu Button */}
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

            {/* Logo */}
            <Box
              component={Link}
              to="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                mr: 4,
              }}
            >
              <HotelIcon sx={{ color: 'primary.main', fontSize: 32, mr: 1 }} />
              <Typography
                variant="h5"
                noWrap
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  letterSpacing: '-0.5px',
                }}
              >
                HotelMgmt
              </Typography>
            </Box>

            {/* Desktop Navigation */}
            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    component={Link}
                    to={item.path}
                    startIcon={item.icon}
                    sx={{
                      color: isActivePath(item.path) ? 'primary.main' : 'text.secondary',
                      fontWeight: isActivePath(item.path) ? 600 : 400,
                      borderBottom: isActivePath(item.path) ? '2px solid' : 'none',
                      borderColor: 'primary.main',
                      borderRadius: 0,
                      px: 2,
                      '&:hover': {
                        bgcolor: 'transparent',
                        color: 'primary.main',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>
            )}

            {/* Spacer */}
            {isMobile && <Box sx={{ flexGrow: 1 }} />}

            {/* User Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {!isMobile && isAuthenticated && (
                <Typography variant="body2" color="text.secondary">
                  Welcome, {user?.first_name || user?.username}
                </Typography>
              )}

              <Box
                sx={{
                  border: '1px solid #ddd',
                  borderRadius: 30,
                  p: '4px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  '&:hover': { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
                }}
                onClick={isAuthenticated ? handleOpenUserMenu : () => navigate('/login')}
              >
                <MenuIcon fontSize="small" />
                <Avatar
                  sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
                >
                  {user?.username?.[0]?.toUpperCase() || '?'}
                </Avatar>
              </Box>

              {/* User Dropdown Menu */}
              <Menu
                sx={{ mt: '45px' }}
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
                    borderRadius: 2,
                    minWidth: 200,
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {user?.first_name || user?.username}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/guest/rooms'); }}>
                  <SearchIcon sx={{ mr: 1.5, fontSize: 20 }} />
                  Browse Rooms
                </MenuItem>
                <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/guest/my-bookings'); }}>
                  <BookingsIcon sx={{ mr: 1.5, fontSize: 20 }} />
                  My Bookings
                </MenuItem>
                <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/profile'); }}>
                  <AccountCircle sx={{ mr: 1.5, fontSize: 20 }} />
                  Profile
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        <Box sx={{ width: 280, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <HotelIcon sx={{ color: 'primary.main', fontSize: 28, mr: 1 }} />
            <Typography variant="h6" fontWeight="bold" color="primary">
              HotelMgmt
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />

          <Typography variant="overline" color="text.secondary" sx={{ px: 2 }}>
            Navigation
          </Typography>
          <List>
            {navItems.map((item) => (
              <ListItemButton
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                selected={isActivePath(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography variant="overline" color="text.secondary" sx={{ px: 2 }}>
            Account
          </Typography>
          <List>
            <ListItemButton onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}>
              <ListItemIcon><AccountCircle /></ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItemButton>
            <ListItemButton onClick={handleLogout} sx={{ color: 'error.main' }}>
              <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: '#fafafa',
          minHeight: 'calc(100vh - 70px)',
        }}
      >
        {children}
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          bgcolor: 'white',
          borderTop: '1px solid #eee',
        }}
      >
        <Container maxWidth="xl">
          <Typography variant="body2" color="text.secondary" align="center">
            Hotel Management System - University Project
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default GuestLayout;
