/**
 * Navbar Component - Navigation bar with role-based menu items
 *
 * Features:
 * - React Router v7 integration for navigation
 * - Role-based menu items (guest, staff, manager, admin)
 * - Responsive design with mobile menu
 * - Authentication state management
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
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
  Dashboard as DashboardIcon,
  Hotel as HotelIcon,
  EventNote as BookingIcon,
  People as PeopleIcon,
  Assessment as ReportIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Define navigation items based on user role
  const getNavigationItems = () => {
    if (!isAuthenticated || !user) {
      // Don't show Home button when already on home page
      if (location.pathname === '/') {
        return [];
      }
      return [
        { label: 'Home', path: '/', icon: <HotelIcon /> },
      ];
    }

    const commonItems = [
      { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon />, roles: ['guest', 'staff', 'manager', 'admin'] },
      { label: 'My Bookings', path: '/bookings', icon: <BookingIcon />, roles: ['guest', 'staff', 'manager', 'admin'] },
    ];

    const roleBasedItems = [
      // Staff items
      { label: 'Manage Bookings', path: '/bookings/manage', icon: <BookingIcon />, roles: ['staff', 'manager', 'admin'] },
      { label: 'Rooms', path: '/rooms', icon: <HotelIcon />, roles: ['staff', 'manager', 'admin'] },

      // Manager items
      { label: 'Reports', path: '/reports', icon: <ReportIcon />, roles: ['manager', 'admin'] },
      { label: 'Staff', path: '/staff', icon: <PeopleIcon />, roles: ['manager', 'admin'] },

      // Admin items
      { label: 'Users', path: '/users', icon: <PeopleIcon />, roles: ['admin'] },
      { label: 'Settings', path: '/settings', icon: <SettingsIcon />, roles: ['admin'] },
    ];

    // Filter items based on user role
    const userRole = user.role || 'guest';
    const filteredItems = [...commonItems, ...roleBasedItems].filter(
      item => item.roles && item.roles.includes(userRole)
    );

    return filteredItems;
  };

  const navigationItems = getNavigationItems();

  // User menu handlers
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = async () => {
    handleCloseUserMenu();
    setMobileMenuOpen(false);
    navigate('/');
    await logout();
  };

  const handleNavigate = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    handleCloseUserMenu();
  };

  // Mobile drawer toggle
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Check if current path matches
  const isActivePath = (path) => location.pathname === path;

  return (
    <>
    <AppBar position="sticky" elevation={2}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo / Brand */}
          <HotelIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            Hotel Management
          </Typography>

          {/* Mobile Menu Icon */}
          {isMobile && (
            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                size="large"
                aria-label="menu"
                aria-controls="mobile-menu"
                aria-haspopup="true"
                onClick={toggleMobileMenu}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
            </Box>
          )}

          {/* Mobile Logo */}
          <HotelIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            HMS
          </Typography>

          {/* Desktop Navigation */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                startIcon={item.icon}
                onClick={() => handleNavigate(item.path)}
                sx={{
                  color: 'white',
                  display: 'flex',
                  backgroundColor: isActivePath(item.path) ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {/* User Menu / Auth Buttons */}
          {isAuthenticated && user ? (
            <Box sx={{ flexGrow: 0 }}>
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt={user.username || 'User'} sx={{ bgcolor: 'secondary.main' }}>
                  {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </Avatar>
              </IconButton>
              <Menu
                sx={{ mt: '45px' }}
                id="user-menu"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <MenuItem disabled>
                  <Box>
                    <Typography variant="subtitle2">{user.username}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Guest'}
                    </Typography>
                  </Box>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => handleNavigate('/profile')}>
                  <AccountCircle sx={{ mr: 1 }} fontSize="small" />
                  Profile
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            !isMobile && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  onClick={() => setLoginModalOpen(true)}
                  variant="outlined"
                  sx={{
                    color: 'white',
                    borderColor: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Login
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  color="secondary"
                >
                  Register
                </Button>
              </Box>
            )
          )}
        </Toolbar>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={toggleMobileMenu}
        sx={{
          display: { xs: 'block', md: 'none' },
        }}
      >
        <Box sx={{ width: 250 }} role="presentation">
          <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Hotel Management
            </Typography>
            {isAuthenticated && user && (
              <Typography variant="caption">
                {user.username} ({user.role})
              </Typography>
            )}
          </Box>
          <Divider />
          <List>
            {navigationItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={isActivePath(item.path)}
                  onClick={() => handleNavigate(item.path)}
                >
                  <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                    {item.icon}
                  </Box>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          {isAuthenticated && user && (
            <>
              <Divider />
              <List>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleNavigate('/profile')}>
                    <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                      <AccountCircle />
                    </Box>
                    <ListItemText primary="Profile" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton onClick={handleLogout}>
                    <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                      <LogoutIcon />
                    </Box>
                    <ListItemText primary="Logout" />
                  </ListItemButton>
                </ListItem>
              </List>
            </>
          )}
        </Box>
      </Drawer>
    </AppBar>

      {/* Login Modal */}
      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSwitchToRegister={() => navigate('/register')}
      />
    </>
  );
};

export default Navbar;
