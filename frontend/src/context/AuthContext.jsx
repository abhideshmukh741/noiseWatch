/**
 * Authentication Context
 * Manages user session, login/logout, and role-based access.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('noisewatch_token');
    const savedUser = localStorage.getItem('noisewatch_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('noisewatch_token');
        localStorage.removeItem('noisewatch_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await authAPI.login(email, password);
    const data = response.data;
    const userData = {
      id: data.user_id,
      email: email,
      role: data.role,
      display_name: data.display_name,
    };
    setToken(data.access_token);
    setUser(userData);
    localStorage.setItem('noisewatch_token', data.access_token);
    localStorage.setItem('noisewatch_user', JSON.stringify(userData));
    return userData;
  }, []);

  const register = useCallback(async (email, password, displayName) => {
    const response = await authAPI.register(email, password, displayName);
    const data = response.data;
    const userData = {
      id: data.user_id,
      email: email,
      role: data.role,
      display_name: data.display_name,
    };
    setToken(data.access_token);
    setUser(userData);
    localStorage.setItem('noisewatch_token', data.access_token);
    localStorage.setItem('noisewatch_user', JSON.stringify(userData));
    return userData;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('noisewatch_token');
    localStorage.removeItem('noisewatch_user');
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    isReviewer: user?.role === 'reviewer' || user?.role === 'admin',
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
