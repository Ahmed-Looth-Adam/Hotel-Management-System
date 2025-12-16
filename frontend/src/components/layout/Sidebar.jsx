/**
 * Sidebar Component - Navigation sidebar for staff/admin panels
 *
 * Features:
 * - Role-based navigation menu
 * - Collapsible sections
 * - Icon-based menu items
 * - Responsive drawer for mobile
 *
 * Note: This is a mock component. Functionality will be added later.
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
  Toolbar,
  Divider,
  Typography,
  Collapse,
  IconButton,
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
  Menu as MenuIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 280;

const Sidebar = ({ open = true, onClose, variant = 'permanent' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [expandedItems, setExpandedItems] = useState({});

  // Menu items based on user role
  const menuItems = [
    {
      title: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      roles: ['staff', 'manager', 'admin'],
    },
    {
      title: 'Operations',
      icon: <OperationsIcon />,
      path: '/operations',
      roles: ['staff', 'manager', 'admin'],
    },
    {
      title: 'Hotels',
      icon: <HotelIcon />,
      path: '/hotels',
      roles: ['manager', 'admin'],
    },
    {
      title: 'Rooms',
      icon: <RoomIcon />,
      path: '/rooms',
      roles: ['staff', 'manager', 'admin'],
    },
    {
      title: 'Bookings',
      icon: <BookingIcon />,
      path: '/bookings',
      roles: ['staff', 'manager', 'admin'],
    },
    {
      title: 'Pricing',
      icon: <PricingIcon />,
      path: '/pricing',
      roles: ['manager', 'admin'],
    },
    {
      title: 'Reports',
      icon: <ReportIcon />,
      roles: ['manager', 'admin'],
      children: [
        { title: 'Occupancy', path: '/reports/occupancy' },
        { title: 'Revenue', path: '/reports/revenue' },
        { title: 'Analytics', path: '/reports/analytics' },
      ],
    },
    {
      title: 'Staff',
      icon: <PeopleIcon />,
      path: '/staff',
      roles: ['manager', 'admin'],
    },
    {
      title: 'Users',
      icon: <PeopleIcon />,
      path: '/admin/users',
      roles: ['admin'],
    },
    {
      title: 'Hotel Management',
      icon: <HotelIcon />,
      path: '/admin/hotels',
      roles: ['admin'],
    },
    {
      title: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
      roles: ['admin'],
    },
  ];

  const handleExpandClick = (title) => {
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

  const userRole = user?.role || 'guest';

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  const drawerContent = (
    <Box>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
        }}
      >
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
          Admin Panel
        </Typography>
        {isMobile && (
          <IconButton onClick={onClose}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List>
        {filteredMenuItems.map((item) => (
          <Box key={item.title}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  if (item.children) {
                    handleExpandClick(item.title);
                  } else if (item.path) {
                    handleNavigate(item.path);
                  }
                }}
                selected={item.path && isActivePath(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.title} />
                {item.children && (
                  expandedItems[item.title] ? <ExpandLess /> : <ExpandMore />
                )}
              </ListItemButton>
            </ListItem>
            {item.children && (
              <Collapse in={expandedItems[item.title]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.children.map((child) => (
                    <ListItemButton
                      key={child.path}
                      sx={{ pl: 4 }}
                      onClick={() => handleNavigate(child.path)}
                      selected={isActivePath(child.path)}
                    >
                      <ListItemText primary={child.title} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </Box>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Logged in as: {user?.username || 'Guest'}
        </Typography>
        <br />
        <Typography variant="caption" color="text.secondary">
          Role: {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: open ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
