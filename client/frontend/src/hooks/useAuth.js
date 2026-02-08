// src/hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/api/authService';

const useAuth = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const initAuth = () => {
      const currentUser = authService.getCurrentUser();
      const authenticated = authService.isAuthenticated();
      
      setUser(currentUser);
      setIsAuthenticated(authenticated);
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Login function
  const login = useCallback(async (username, password) => {
    try {
      setIsLoading(true);
      const data = await authService.login(username, password);
      
      setUser(data.user);
      setIsAuthenticated(true);
      
      return { success: true, data };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.detail || 'Login failed. Please check your credentials.' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    }
  }, [navigate]);

  // Update user profile
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  // Check if user has specific role
  const hasRole = useCallback((role) => {
    return user?.role === role;
  }, [user]);

  // Check if user is admin
  const isAdmin = useCallback(() => {
    return user?.role === 'admin';
  }, [user]);

  // Check if user is teacher
  const isTeacher = useCallback(() => {
    return user?.role === 'teacher';
  }, [user]);

  // Check if user is program manager
  const isProgramManager = useCallback(() => {
    return user?.role === 'program_manager';
  }, [user]);

  // Check if user is donor
  const isDonor = useCallback(() => {
    return user?.role === 'donor';
  }, [user]);

  // Check if user can edit data
  const canEditData = useCallback(() => {
    return ['admin', 'teacher', 'program_manager'].includes(user?.role);
  }, [user]);

  // Check if user can view reports
  const canViewReports = useCallback(() => {
    // All authenticated users can view reports
    return isAuthenticated;
  }, [isAuthenticated]);

  // Check if user can manage users
  const canManageUsers = useCallback(() => {
    return user?.role === 'admin';
  }, [user]);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    hasRole,
    isAdmin,
    isTeacher,
    isProgramManager,
    isDonor,
    canEditData,
    canViewReports,
    canManageUsers,
  };
};

export default useAuth;