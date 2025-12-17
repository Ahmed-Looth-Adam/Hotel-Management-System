/**
 * Sidebar Component - Modern Collapsible Navigation sidebar
 *
 * Features:
 * - Collapsible sidebar (expanded/collapsed modes)
 * - Role-based navigation menu
 * - Collapsible sections
 * - Modern dark theme design
 * - Smooth animations
 * - Tooltips in collapsed mode
 * - Responsive drawer for mobile
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Collapse,
  IconButton,
  Avatar,
  Tooltip,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Hotel as HotelIcon,
  MeetingRoom as RoomIcon,
  EventNote as BookingIcon,
  People as PeopleIcon,
  Assessment as ReportIcon,
  Settings as SettingsIcon,
  AttachMoney as PricingIcon,
  Speed as OperationsIcon,
  ExpandLess,
  ExpandMore,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Search as SearchIcon,
  ListAlt as ListAltIcon,
  Apartment as ApartmentIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH_EXPANDED = 260;
const DRAWER_WIDTH_COLLAPSED = 80;

const Sidebar = ({ open = true, onClose, variant = 'permanent', collapsed = false, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [expandedItems, setExpandedItems] = useState({});

  const drawerWidth = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH_EXPANDED;

  // Menu items based on user role
  const menuItems = [
    // Guest menu items
    {
      title: 'Browse Rooms',
      icon: SearchIcon,
      path: '/guest/rooms',
      roles: ['guest'],
    },
    {
      title: 'My Bookings',
      icon: ListAltIcon,
      path: '/guest/my-bookings',
      roles: ['guest'],
    },
    // Staff/Manager/Admin menu items
    {
      title: 'Dashboard',
      icon: DashboardIcon,
      path: '/dashboard',
      roles: ['staff', 'manager', 'admin'],
    },
    {
      title: 'User Management',
      icon: PeopleIcon,
      path: '/admin/users',
      roles: ['admin'],
    },
    {
      title: 'Hotel Management',
      icon: ApartmentIcon,
      path: '/admin/hotels',
      roles: ['admin'],
    },
    {
      title: 'Operations',
      icon: OperationsIcon,
      path: '/operations',
      roles: ['staff', 'manager', 'admin'],
    },
    {
      title: 'Hotels',
      icon: HotelIcon,
      path: '/hotels',
      roles: ['manager', 'admin'],
    },
    {
      title: 'Rooms',
      icon: RoomIcon,
      path: '/rooms',
      roles: ['staff', 'manager', 'admin'],
    },
    {
      title: 'Bookings',
      icon: BookingIcon,
      path: '/bookings',
      roles: ['staff', 'manager', 'admin'],
    },
    {
      title: 'Pricing',
      icon: PricingIcon,
      path: '/pricing',
      roles: ['manager', 'admin'],
    },
    {
      title: 'Reports',
      icon: ReportIcon,
      roles: ['manager', 'admin'],
      children: [
        { title: 'Occupancy', path: '/reports/occupancy' },
        { title: 'Revenue', path: '/reports/revenue' },
        { title: 'Analytics', path: '/reports/analytics' },
      ],
    },
    {
      title: 'Staff',
      icon: PeopleIcon,
      path: '/staff',
      roles: ['manager', 'admin'],
    },
    {
      title: 'Settings',
      icon: SettingsIcon,
      path: '/settings',
      roles: ['admin'],
    },
  ];

  const handleExpandClick = (title) => {
    if (collapsed) return; // Don't expand in collapsed mode
    setExpandedItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const isActivePath = (path) => location.pathname === path;
  const isActiveParent = (item) => {
    if (item.children) {
      return item.children.some(child => location.pathname === child.path);
    }
    return false;
  };

  const userRole = user?.role || 'guest';

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  const MenuItemContent = ({ item }) => {
    const Icon = item.icon;
    const isActive = item.path && isActivePath(item.path);
    const isParentActive = isActiveParent(item);

    const buttonContent = (
      <ListItemButton
        onClick={() => {
          if (item.children && !collapsed) {
            handleExpandClick(item.title);
          } else if (item.path) {
            handleNavigate(item.path);
          }
        }}
        sx={{
          borderRadius: 2,
          py: 1.25,
          px: collapsed ? 1.25 : 1.5,
          mx: collapsed ? 'auto' : 0,
          width: collapsed ? 48 : 'auto',
          minHeight: 48,
          justifyContent: collapsed ? 'center' : 'flex-start',
          transition: 'all 0.2s ease',
          bgcolor: isActive || isParentActive
            ? alpha('#667eea', 0.15)
            : 'transparent',
          '&:hover': {
            bgcolor: alpha('#667eea', 0.1),
          },
          ...(isActive && !collapsed && {
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 3,
              height: '60%',
              borderRadius: '0 4px 4px 0',
              background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
            },
          }),
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: collapsed ? 0 : 40,
            justifyContent: 'center',
            color: isActive || isParentActive
              ? '#667eea'
              : alpha('#fff', 0.6),
          }}
        >
          <Icon sx={{ fontSize: 22 }} />
        </ListItemIcon>
        {!collapsed && (
          <>
            <ListItemText
              primary={item.title}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: isActive || isParentActive ? 600 : 500,
                color: isActive || isParentActive
                  ? 'white'
                  : alpha('#fff', 0.8),
              }}
            />
            {item.children && (
              expandedItems[item.title] ? (
                <ExpandLess sx={{ color: alpha('#fff', 0.5), fontSize: 20 }} />
              ) : (
                <ExpandMore sx={{ color: alpha('#fff', 0.5), fontSize: 20 }} />
              )
            )}
          </>
        )}
      </ListItemButton>
    );

    if (collapsed) {
      return (
        <Tooltip title={item.title} placement="right" arrow>
          {buttonContent}
        </Tooltip>
      );
    }

    return buttonContent;
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #1a1f37 0%, #0f1225 100%)',
        transition: 'width 0.3s ease',
      }}
    >
      {/* Logo Section */}
      <Box
        sx={{
          p: collapsed ? 2 : 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: 72,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <HotelIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          {!collapsed && (
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  color: 'white',
                  letterSpacing: '0.5px',
                  lineHeight: 1.2,
                }}
              >
                HMS
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: alpha('#fff', 0.5),
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Hotel Management
              </Typography>
            </Box>
          )}
        </Box>
        {isMobile && !collapsed && (
          <IconButton onClick={onClose} sx={{ color: alpha('#fff', 0.7) }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      {/* Collapse Toggle Button - Desktop Only */}
      {!isMobile && onToggleCollapse && (
        <Box sx={{ px: collapsed ? 1 : 2, mb: 1 }}>
          <IconButton
            onClick={onToggleCollapse}
            sx={{
              width: '100%',
              borderRadius: 2,
              py: 1,
              color: alpha('#fff', 0.6),
              bgcolor: alpha('#fff', 0.05),
              '&:hover': {
                bgcolor: alpha('#fff', 0.1),
                color: '#fff',
              },
            }}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>
      )}

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, px: collapsed ? 1 : 2, py: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <List sx={{ py: 0 }}>
          {filteredMenuItems.map((item) => {
            const isActive = item.path && isActivePath(item.path);

            return (
              <Box key={item.title}>
                <ListItem disablePadding sx={{ mb: 0.5, display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start' }}>
                  <MenuItemContent item={item} />
                </ListItem>
                {item.children && !collapsed && (
                  <Collapse in={expandedItems[item.title]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ pl: 2 }}>
                      {item.children.map((child) => {
                        const isChildActive = isActivePath(child.path);
                        return (
                          <ListItemButton
                            key={child.path}
                            onClick={() => handleNavigate(child.path)}
                            sx={{
                              borderRadius: 2,
                              py: 1,
                              pl: 4,
                              mb: 0.5,
                              bgcolor: isChildActive
                                ? alpha('#667eea', 0.15)
                                : 'transparent',
                              '&:hover': {
                                bgcolor: alpha('#667eea', 0.1),
                              },
                            }}
                          >
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                bgcolor: isChildActive
                                  ? '#667eea'
                                  : alpha('#fff', 0.3),
                                mr: 2,
                              }}
                            />
                            <ListItemText
                              primary={child.title}
                              primaryTypographyProps={{
                                fontSize: '0.8rem',
                                fontWeight: isChildActive ? 600 : 400,
                                color: isChildActive
                                  ? 'white'
                                  : alpha('#fff', 0.7),
                              }}
                            />
                          </ListItemButton>
                        );
                      })}
                    </List>
                  </Collapse>
                )}
              </Box>
            );
          })}
        </List>
      </Box>

      {/* User Profile Section */}
      <Box sx={{ p: collapsed ? 1 : 2 }}>
        <Divider sx={{ borderColor: alpha('#fff', 0.1), mb: 2 }} />
        {collapsed ? (
          <Tooltip title={`${user?.first_name || user?.username || 'User'} (${userRole})`} placement="right" arrow>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
              </Avatar>
            </Box>
          </Tooltip>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha('#fff', 0.05),
            }}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  color: 'white',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.first_name || user?.username || 'User'}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: alpha('#fff', 0.5),
                  textTransform: 'capitalize',
                }}
              >
                {userRole}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: open ? drawerWidth : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          border: 'none',
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export { DRAWER_WIDTH_EXPANDED, DRAWER_WIDTH_COLLAPSED };
export default Sidebar;
