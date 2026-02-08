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
      try {
        const currentUser = authService.getCurrentUser();
        const authenticated = authService.isAuthenticated();
        
        setUser(currentUser);
        setIsAuthenticated(authenticated);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
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
      
      // Handle different error formats
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.detail) {
        errorMessage = error.detail;
      } else if (error.non_field_errors) {
        errorMessage = Array.isArray(error.non_field_errors) 
          ? error.non_field_errors[0] 
          : error.non_field_errors;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      return { 
        success: false, 
        error: errorMessage
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
    try {
      setUser(updatedUser);
      authService.updateUser(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
    }
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

  // Check if user can manage programs
  const canManagePrograms = useCallback(() => {
    return ['admin', 'program_manager'].includes(user?.role);
  }, [user]);

  // Check if user can manage attendance
  const canManageAttendance = useCallback(() => {
    return ['admin', 'teacher', 'program_manager'].includes(user?.role);
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
    canManagePrograms,
    canManageAttendance,
  };
};

export default useAuth;