/**
 * Layout Component - Main layout wrapper with role-based rendering
 *
 * Features:
 * - Conditionally renders different layouts based on user role
 * - GuestLayout for guests (top navbar, customer-facing)
 * - AdminLayout for staff/manager/admin (sidebar dashboard)
 * - Public layout for unauthenticated users
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';
import GuestLayout from './GuestLayout';
import AdminLayout from './AdminLayout';

const Layout = ({ children }) => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const userRole = user?.role || 'guest';
  const currentPath = location.pathname;

  // Auth pages - no layout wrapper
  const authPages = ['/login', '/register', '/auth/password-reset'];
  const isAuthPage = authPages.some(page => currentPath.startsWith(page));

  // Home page - uses its own Airbnb-style header
  const isHomePage = currentPath === '/';

  // Public pages that should use the simple Navbar layout
  const publicPages = ['/demo', '/notification-demo', '/loading-demo'];
  const isPublicPage = publicPages.includes(currentPath);

  // Guest portal pages
  const isGuestPage = currentPath.startsWith('/guest/');

  // Admin/Staff dashboard pages
  const isAdminPage = currentPath.startsWith('/admin/') ||
                      currentPath.startsWith('/staff') ||
                      currentPath.startsWith('/settings') ||
                      currentPath.startsWith('/reports/') ||
                      currentPath.startsWith('/dashboard') ||
                      currentPath.startsWith('/hotels') ||
                      currentPath.startsWith('/rooms') ||
                      currentPath.startsWith('/bookings') ||
                      currentPath.startsWith('/operations') ||
                      currentPath.startsWith('/pricing');

  // Auth pages - minimal layout
  if (isAuthPage) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
          {children}
        </Box>
      </Box>
    );
  }

  // Home page - uses its own Airbnb-style header (no separate Navbar)
  if (isHomePage) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
          {children}
        </Box>
      </Box>
    );
  }

  // Guest portal pages - use Airbnb-style layout (no Navbar for unauthenticated)
  if (isGuestPage && !isAuthenticated) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
          {children}
        </Box>
      </Box>
    );
  }

  // Not authenticated - show public layout with Navbar
  if (!isAuthenticated) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
          {children}
        </Box>
      </Box>
    );
  }

  // Authenticated users - route based on role and current path

  // Guests always see GuestLayout (except for public pages)
  if (userRole === 'guest' && !isPublicPage) {
    return <GuestLayout>{children}</GuestLayout>;
  }

  // Staff/Manager/Admin on dashboard pages see AdminLayout
  if (['staff', 'manager', 'admin'].includes(userRole) && (isAdminPage || !isPublicPage)) {
    return <AdminLayout>{children}</AdminLayout>;
  }

  // Default: Public layout with Navbar
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
