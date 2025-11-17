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

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
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