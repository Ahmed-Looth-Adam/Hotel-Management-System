/**
 * Layout Component - Main layout wrapper with Navbar
 *
 * Features:
 * - Includes Navbar component
 * - Provides consistent layout structure
 * - Content area with proper spacing
 * - Conditionally hides navbar on auth pages
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  const location = useLocation();

  // Hide navbar on authentication pages
  const hideNavbar = ['/login', '/register'].includes(location.pathname);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!hideNavbar && <Navbar />}
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
