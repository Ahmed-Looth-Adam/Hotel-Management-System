import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordExpired, setPasswordExpired] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState(null);

  // Check password expiration status for staff/manager/admin users
  const checkPasswordStatus = async () => {
    const result = await authService.getPasswordStatus();
    if (result.success) {
      setPasswordStatus(result.data);
      setPasswordExpired(result.data.password_expired || false);
      return result.data;
    }
    return null;
  };

  // Load user from localStorage on mount and verify token validity
  useEffect(() => {
    const loadUser = async () => {
      const currentUser = authService.getCurrentUser();
      const token = authService.getAccessToken();

      if (token && currentUser) {
        // Verify token is valid by attempting to fetch profile
        const result = await authService.getProfile();

        if (result.success) {
          setUser(result.data);
          setIsAuthenticated(true);

          // Check password status for staff/manager/admin
          if (['staff', 'manager', 'admin'].includes(result.data.role)) {
            await checkPasswordStatus();
          }
        } else {
          // Token is invalid or expired, clear everything (without API call to avoid redirect)
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        // No token or user data, ensure clean state
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (username, password) => {
    const result = await authService.login(username, password);

    if (result.success) {
      // Check if 2FA is required
      if (result.data?.two_factor_required) {
        return {
          success: true,
          twoFactorRequired: true,
          tempToken: result.data.temp_token,
          userEmail: result.data.user_email,
        };
      }

      const userData = result.data?.user || authService.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);

      // Check password status for staff/manager/admin after login
      if (['staff', 'manager', 'admin'].includes(userData.role)) {
        await checkPasswordStatus();
      }
    } else {
      // Ensure we clear auth state on failed login
      setUser(null);
      setIsAuthenticated(false);
    }

    return result;
  };

  // Complete login after 2FA verification
  const completeLogin = async (data) => {
    const userData = data.user;
    setUser(userData);
    setIsAuthenticated(true);

    // Check password status for staff/manager/admin
    if (['staff', 'manager', 'admin'].includes(userData.role)) {
      await checkPasswordStatus();
    }

    return { success: true, data };
  };

  const register = async (userData) => {
    return await authService.register(userData);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshToken = async () => {
    const result = await authService.refreshToken();

    if (!result.success) {
      await logout();
      return false;
    }

    return true;
  };

  const updateUser = async () => {
    const result = await authService.getProfile();

    if (result.success) {
      setUser(result.data);
    }

    return result;
  };

  // Call this after successful password change to clear expired state
  const onPasswordChanged = async () => {
    setPasswordExpired(false);
    await checkPasswordStatus();
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    passwordExpired,
    passwordStatus,
    login,
    completeLogin,
    register,
    logout,
    refreshToken,
    updateUser,
    checkPasswordStatus,
    onPasswordChanged,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
