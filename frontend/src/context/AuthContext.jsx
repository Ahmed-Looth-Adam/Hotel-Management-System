import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
      const userData = result.data?.user || authService.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
    } else {
      // Ensure we clear auth state on failed login
      setUser(null);
      setIsAuthenticated(false);
    }

    return result;
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

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
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
