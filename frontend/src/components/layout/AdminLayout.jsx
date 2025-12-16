/**
 * Admin Layout Component - Modern Dashboard layout for Staff/Manager/Admin
 *
 * Features:
 * - Collapsible sidebar navigation
 * - Clean top app bar with search and notifications
 * - Responsive design with mobile drawer
 * - Persisted sidebar state
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar, { DRAWER_WIDTH_EXPANDED, DRAWER_WIDTH_COLLAPSED } from './Sidebar';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
  InputBase,
  Badge,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);

  // Sidebar collapse state - persisted in localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const handleLogout = async () => {
    handleCloseUserMenu();
    await logout();
    navigate('/');
  };

  const handleProfile = () => {
    handleCloseUserMenu();
    navigate('/profile');
  };

  const handleSettings = () => {
    handleCloseUserMenu();
    navigate('/settings');
  };

  const userRole = user?.role || 'guest';
  const drawerWidth = sidebarCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH_EXPANDED;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: '#ffffff',
          borderBottom: '1px solid',
          borderColor: 'divider',
          transition: 'width 0.3s ease, margin-left 0.3s ease',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', gap: 2 }}>
          {/* Left Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Mobile menu button */}
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{
                display: { md: 'none' },
                color: 'text.primary',
              }}
            >
              <MenuIcon />
            </IconButton>

            {/* Search Bar */}
            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                bgcolor: '#f8f9fa',
                borderRadius: 2,
                px: 2,
                py: 0.5,
                minWidth: 280,
                border: '1px solid',
                borderColor: 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'divider',
                },
                '&:focus-within': {
                  borderColor: 'primary.main',
                  bgcolor: '#fff',
                },
              }}
            >
              <SearchIcon sx={{ color: 'text.secondary', fontSize: 20, mr: 1 }} />
              <InputBase
                placeholder="Search..."
                sx={{
                  flex: 1,
                  fontSize: '0.875rem',
                  '& input': {
                    py: 0.75,
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: 'text.disabled',
                  bgcolor: '#e9ecef',
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  fontSize: '0.7rem',
                  fontWeight: 500,
                }}
              >
                /
              </Typography>
            </Box>
          </Box>

          {/* Right Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <Badge
                  badgeContent={3}
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.65rem',
                      height: 18,
                      minWidth: 18,
                    },
                  }}
                >
                  <NotificationsIcon sx={{ fontSize: 22 }} />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Divider */}
            <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1.5 }} />

            {/* User Menu */}
            <Box
              onClick={handleOpenUserMenu}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                cursor: 'pointer',
                py: 0.5,
                px: 1,
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    lineHeight: 1.2,
                  }}
                >
                  {user?.first_name || user?.username || 'User'}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    textTransform: 'capitalize',
                    lineHeight: 1,
                  }}
                >
                  {userRole}
                </Typography>
              </Box>
              <ArrowDownIcon
                sx={{
                  fontSize: 18,
                  color: 'text.secondary',
                  display: { xs: 'none', sm: 'block' },
                }}
              />
            </Box>

            <Menu
              anchorEl={anchorElUser}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 4px 20px rgba(0,0,0,0.08))',
                  mt: 1,
                  borderRadius: 2,
                  minWidth: 200,
                  border: '1px solid',
                  borderColor: 'divider',
                  '&::before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 20,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                    borderLeft: '1px solid',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                  },
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email || `${userRole}@hotel.com`}
                </Typography>
              </Box>
              <Divider />
              <MenuItem
                onClick={handleProfile}
                sx={{
                  py: 1.25,
                  px: 2,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <AccountCircle sx={{ mr: 1.5, fontSize: 20, color: 'text.secondary' }} />
                <Typography variant="body2">My Profile</Typography>
              </MenuItem>
              {userRole === 'admin' && (
                <MenuItem
                  onClick={handleSettings}
                  sx={{
                    py: 1.25,
                    px: 2,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <SettingsIcon sx={{ mr: 1.5, fontSize: 20, color: 'text.secondary' }} />
                  <Typography variant="body2">Settings</Typography>
                </MenuItem>
              )}
              <Divider sx={{ my: 0.5 }} />
              <MenuItem
                onClick={handleLogout}
                sx={{
                  py: 1.25,
                  px: 2,
                  color: 'error.main',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.error.main, 0.08),
                  },
                }}
              >
                <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} />
                <Typography variant="body2" fontWeight={500}>Logout</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar - Mobile */}
      <Sidebar
        open={mobileOpen}
        onClose={handleDrawerToggle}
        variant="temporary"
        collapsed={false}
      />

      {/* Sidebar - Desktop */}
      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
          display: { xs: 'none', md: 'block' },
          transition: 'width 0.3s ease',
        }}
      >
        <Sidebar
          open={true}
          variant="permanent"
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          bgcolor: '#f8f9fa',
          minHeight: '100vh',
          transition: 'width 0.3s ease',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;
