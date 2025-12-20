/**
 * App Component - Main application with routing
 *
 * Features:
 * - Global toast notification system using notistack
 * - Authentication state management
 * - Protected and public routes
 * - Consistent layout structure
 *
 * Edited By:
 * -> Ismail Wasiu Abdul Samad, UWE ID: 24050765
 * -> Ibrahim Waseem, UWE ID: 24053101
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import GuestOnlyRoute from './components/GuestOnlyRoute';
import { Layout } from './components/layout';
import NotificationInitializer from './components/NotificationInitializer';

// Public pages
import Home from './pages/Home';
import ComponentDemo from './components/ComponentDemo';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import EmailVerification from './pages/auth/EmailVerification';

// Protected pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/profile/profile';
import PasswordReset from './pages/profile/PasswordReset';
import PasswordResetConfirm from './pages/profile/PasswordResetConfirm';

// Hotel management pages
import { BookingsList, BookingDetail } from './pages/bookings';

// Admin pages
import UserManagement from './pages/admin/UserManagement';
import HotelManagement from './pages/Admin/HotelManagement';
import HotelManagePage from './pages/Admin/HotelManagePage';

// Manager pages
import ManagerHotelView from './pages/Manager/ManagerHotelView';
import ManagerStaffManagement from './pages/Manager/ManagerStaffManagement';

// Staff pages
import RoomManagement from './pages/Staff/RoomManagement';

// Guest pages
import BrowseRooms from './pages/guest/BrowseRooms';
import RoomDetails from './pages/guest/RoomDetails';
import BookingConfirmation from './pages/guest/BookingConfirmation';
import MyBookings from './pages/guest/MyBookings';

// Report pages
import ReportsDashboard from './pages/reports/ReportsDashboard';
import OccupancyReport from './pages/reports/OccupancyReport';
import RevenueReport from './pages/reports/RevenueReport';
import AnalyticsDashboard from './pages/reports/AnalyticsDashboard';

// Settings page
import Settings from './pages/settings/Settings';

// Examples
import NotificationExample from './examples/NotificationExample';
import LoadingExample from './examples/LoadingExample';

// Profile Route Guard - redirects staff/manager/admin to settings
import { useAuth } from './context/AuthContext';

const GuestProfileRoute = ({ children }) => {
  const { user } = useAuth();

  // Redirect staff/manager/admin to settings page
  if (user && ['admin', 'manager', 'staff'].includes(user.role)) {
    return <Navigate to="/settings" replace />;
  }

  return children;
};

function App() {
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      autoHideDuration={3000}
    >
      <NotificationInitializer />
      <AuthProvider>
        <NotificationProvider>
          <Router>
          <Layout>
            <Routes>
              {/* Public Routes - Guest Only (Admin/Staff redirected to dashboard) */}
              <Route path="/" element={
                <GuestOnlyRoute>
                  <Home />
                </GuestOnlyRoute>
              } />
              <Route path="/demo" element={<ComponentDemo />} />
              <Route path="/notification-demo" element={<NotificationExample />} />
              <Route path="/loading-demo" element={<LoadingExample />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<EmailVerification />} />

              {/* === PASSWORD RESET ROUTES (MUST BE PUBLIC) === */}
              <Route
                path="/auth/password-reset"
                element={<PasswordReset />}
              />
              <Route
                path="/auth/password-reset-confirm/:uid/:token"
                element={<PasswordResetConfirm />}
              />

              {/* ============================================== */}

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager', 'staff']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <GuestProfileRoute>
                      <Profile />
                    </GuestProfileRoute>
                  </ProtectedRoute>
                }
              />

              {/* Admin Route - User Management */}
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <UserManagement />
                  </ProtectedRoute>
                }
              />

              {/* Admin Route - Hotel Management */}
              <Route
                path="/admin/hotels"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <HotelManagement />
                  </ProtectedRoute>
                }
              />

              {/* Admin Route - Hotel Manage Page */}
              <Route
                path="/admin/hotels/:id/manage"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <HotelManagePage />
                  </ProtectedRoute>
                }
              />

              {/* Manager Routes */}
              <Route
                path="/manager/hotel"
                element={
                  <ProtectedRoute requiredRole="manager">
                    <ManagerHotelView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/staff"
                element={
                  <ProtectedRoute requiredRole="manager">
                    <ManagerStaffManagement />
                  </ProtectedRoute>
                }
              />

              {/* Settings (Admin/Manager/Staff) */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager', 'staff']}>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Guest Portal Routes - Public (no login required to browse) */}
              {/* Admin/Staff are redirected to dashboard */}
              <Route path="/guest/rooms" element={
                <GuestOnlyRoute>
                  <BrowseRooms />
                </GuestOnlyRoute>
              } />
              <Route path="/guest/rooms/:id" element={
                <GuestOnlyRoute>
                  <RoomDetails />
                </GuestOnlyRoute>
              } />

              {/* Guest Portal Routes - Protected (login required) */}
              <Route
                path="/guest/booking/:id/confirm"
                element={
                  <ProtectedRoute>
                    <BookingConfirmation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/guest/my-bookings"
                element={
                  <ProtectedRoute>
                    <MyBookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/guest/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Reports (Manager/Admin) */}
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={['manager', 'admin']}>
                    <ReportsDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/occupancy"
                element={
                  <ProtectedRoute allowedRoles={['manager', 'admin']}>
                    <OccupancyReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/revenue"
                element={
                  <ProtectedRoute allowedRoles={['manager', 'admin']}>
                    <RevenueReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/analytics"
                element={
                  <ProtectedRoute allowedRoles={['manager', 'admin']}>
                    <AnalyticsDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Bookings Management - Staff Only */}
              <Route
                path="/bookings"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager', 'staff']}>
                    <BookingsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookings/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager', 'staff']}>
                    <BookingDetail />
                  </ProtectedRoute>
                }
              />

              {/* Room Management (Staff/Manager/Admin) */}
              <Route
                path="/staff/rooms"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager', 'staff']}>
                    <RoomManagement />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </SnackbarProvider>
  );
}

export default App;
