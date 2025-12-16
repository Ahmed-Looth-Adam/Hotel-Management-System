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
import ProtectedRoute from './components/ProtectedRoute';
import { Layout } from './components/layout';
import NotificationInitializer from './components/NotificationInitializer';

// Public pages
import Home from './pages/Home';
import ComponentDemo from './components/ComponentDemo';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Protected pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/profile/profile';
import PasswordReset from './pages/profile/PasswordReset';
import PasswordResetConfirm from './pages/profile/PasswordResetConfirm';

// Hotel management pages
import { HotelsList, HotelDetail, HotelForm } from './pages/hotels';
import { RoomsList, RoomDetail, RoomForm } from './pages/rooms';
import { BookingsList, BookingDetail, BookingForm } from './pages/bookings';
import { OperationsDashboard } from './pages/operations';
import { PricingDashboard } from './pages/pricing';

// Admin pages
import UserManagement from './pages/admin/UserManagement';
import HotelManagement from './pages/Admin/HotelManagement';
import StaffManagement from './pages/admin/StaffManagement';

// Guest pages
import BrowseRooms from './pages/guest/BrowseRooms';
import RoomDetails from './pages/guest/RoomDetails';
import MyBookings from './pages/guest/MyBookings';

// Report pages
import OccupancyReport from './pages/reports/OccupancyReport';
import RevenueReport from './pages/reports/RevenueReport';
import AnalyticsDashboard from './pages/reports/AnalyticsDashboard';

// Settings page
import Settings from './pages/settings/Settings';

// Examples
import NotificationExample from './examples/NotificationExample';
import LoadingExample from './examples/LoadingExample';

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
        <Router>
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/demo" element={<ComponentDemo />} />
              <Route path="/notification-demo" element={<NotificationExample />} />
              <Route path="/loading-demo" element={<LoadingExample />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

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
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
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

              {/* Staff Management (Manager/Admin) */}
              <Route
                path="/staff"
                element={
                  <ProtectedRoute requiredRole="manager">
                    <StaffManagement />
                  </ProtectedRoute>
                }
              />

              {/* Settings (Admin) */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Guest Portal Routes */}
              <Route
                path="/guest/rooms"
                element={
                  <ProtectedRoute>
                    <BrowseRooms />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/guest/rooms/:id"
                element={
                  <ProtectedRoute>
                    <RoomDetails />
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

              {/* Reports (Manager/Admin) */}
              <Route
                path="/reports/occupancy"
                element={
                  <ProtectedRoute requiredRole="manager">
                    <OccupancyReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/revenue"
                element={
                  <ProtectedRoute requiredRole="manager">
                    <RevenueReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/analytics"
                element={
                  <ProtectedRoute requiredRole="manager">
                    <AnalyticsDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Hotels Management */}
              <Route
                path="/hotels"
                element={
                  <ProtectedRoute>
                    <HotelsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hotels/new"
                element={
                  <ProtectedRoute>
                    <HotelForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hotels/:id"
                element={
                  <ProtectedRoute>
                    <HotelDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hotels/:id/edit"
                element={
                  <ProtectedRoute>
                    <HotelForm />
                  </ProtectedRoute>
                }
              />

              {/* Rooms Management */}
              <Route
                path="/rooms"
                element={
                  <ProtectedRoute>
                    <RoomsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rooms/new"
                element={
                  <ProtectedRoute>
                    <RoomForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rooms/:id"
                element={
                  <ProtectedRoute>
                    <RoomDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rooms/:id/edit"
                element={
                  <ProtectedRoute>
                    <RoomForm />
                  </ProtectedRoute>
                }
              />

              {/* Bookings Management */}
              <Route
                path="/bookings"
                element={
                  <ProtectedRoute>
                    <BookingsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookings/new"
                element={
                  <ProtectedRoute>
                    <BookingForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookings/:id"
                element={
                  <ProtectedRoute>
                    <BookingDetail />
                  </ProtectedRoute>
                }
              />

              {/* Operations Dashboard */}
              <Route
                path="/operations"
                element={
                  <ProtectedRoute>
                    <OperationsDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Pricing Management */}
              <Route
                path="/pricing"
                element={
                  <ProtectedRoute>
                    <PricingDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </SnackbarProvider>
  );
}

export default App;
