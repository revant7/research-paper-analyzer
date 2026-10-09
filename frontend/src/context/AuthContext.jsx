import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../services/api';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const profile = await authService.getProfile();
          setUser(profile);
        } catch (error) {
          console.error("Auth init error", error);
          setToken(null);
          setUser(null);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    const authToken = data.access_token || data.token;
    setToken(authToken);
    setUser(data.user);
    localStorage.setItem('token', authToken);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authService.register(name, email, password);
    const authToken = data.access_token || data.token;
    setToken(authToken);
    setUser(data.user);
    localStorage.setItem('token', authToken);
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const updateProfile = async (data) => {
    const updatedUser = await authService.updateProfile(data);
    setUser(updatedUser);
    return updatedUser;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user || !!token,
    login,
    register,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 font-medium">Loading workspace...</span>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};
