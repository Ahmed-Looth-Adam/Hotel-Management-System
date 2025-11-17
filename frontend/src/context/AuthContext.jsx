import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      const currentUser = authService.getCurrentUser();
      const token = authService.getAccessToken();

      if (token && currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
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
