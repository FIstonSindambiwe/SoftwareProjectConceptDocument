// src/hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/api/authService';

const useAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Initialize auth state
  useEffect(() => {
    const initAuth = () => {
      try {
        const currentUser = authService.getCurrentUser();
        const authenticated = authService.isAuthenticated();
        const needPasswordChange = authService.mustChangePassword();
        
        setUser(currentUser);
        setIsAuthenticated(authenticated);
        setMustChangePassword(needPasswordChange);
        setUserRole(currentUser?.role || null);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
        setIsAuthenticated(false);
        setMustChangePassword(false);
        setUserRole(null);
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
      setMustChangePassword(data.mustChangePassword || false);
      setUserRole(data.user?.role || null);
      
      // Check if password change is required
      if (data.mustChangePassword) {
        return { 
          success: true, 
          data,
          mustChangePassword: true,
          redirectTo: '/change-password'
        };
      }
      
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
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Change password function
  const changePassword = useCallback(async (oldPassword, newPassword, newPasswordConfirm) => {
    try {
      setIsLoading(true);
      const result = await authService.changePassword(oldPassword, newPassword, newPasswordConfirm);
      
      if (result.success) {
        // Update auth state after successful password change
        setMustChangePassword(false);
        
        // Refresh user data if needed
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setUserRole(currentUser.role);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: error.message || 'Failed to change password'
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset password for a user (admin only)
  const resetPassword = useCallback(async (userId) => {
    try {
      setIsLoading(true);
      const result = await authService.resetPassword(userId);
      return result;
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: error.message || 'Failed to reset password'
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
      setMustChangePassword(false);
      setUserRole(null);
      navigate('/login');
    }
  }, [navigate]);

  // Update user profile
  const updateUser = useCallback((updatedUser) => {
    try {
      setUser(updatedUser);
      setUserRole(updatedUser?.role || null);
      authService.updateCurrentUser(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
    }
  }, []);

  // Refresh auth state (useful after password change or profile updates)
  const refreshAuthState = useCallback(() => {
    try {
      const currentUser = authService.getCurrentUser();
      const authenticated = authService.isAuthenticated();
      const needPasswordChange = authService.mustChangePassword();
      
      setUser(currentUser);
      setIsAuthenticated(authenticated);
      setMustChangePassword(needPasswordChange);
      setUserRole(currentUser?.role || null);
    } catch (error) {
      console.error('Refresh auth error:', error);
    }
  }, []);

  // Check if user is fully authenticated (authenticated and password changed)
  const isFullyAuthenticated = useCallback(() => {
    return isAuthenticated && !mustChangePassword;
  }, [isAuthenticated, mustChangePassword]);

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

  // Check if user can manage assessments
  const canManageAssessments = useCallback(() => {
    return ['admin', 'teacher', 'program_manager'].includes(user?.role);
  }, [user]);

  // Get user permissions summary
  const getUserPermissions = useCallback(() => {
    return {
      isAuthenticated,
      isFullyAuthenticated: isFullyAuthenticated(),
      role: userRole,
      mustChangePassword,
      canEditData: canEditData(),
      canManageUsers: canManageUsers(),
      canViewReports: canViewReports(),
      canManagePrograms: canManagePrograms(),
      canManageAttendance: canManageAttendance(),
      canManageAssessments: canManageAssessments(),
    };
  }, [
    isAuthenticated,
    isFullyAuthenticated,
    userRole,
    mustChangePassword,
    canEditData,
    canManageUsers,
    canViewReports,
    canManagePrograms,
    canManageAttendance,
    canManageAssessments
  ]);

  return {
    user,
    isLoading,
    isAuthenticated,
    mustChangePassword,
    userRole,
    isFullyAuthenticated: isFullyAuthenticated(),
    login,
    logout,
    changePassword,
    resetPassword,
    updateUser,
    refreshAuthState,
    hasRole,
    isAdmin,
    isTeacher,
    isProgramManager,
    isDonor,
    canEditData: canEditData(),
    canViewReports: canViewReports(),
    canManageUsers: canManageUsers(),
    canManagePrograms: canManagePrograms(),
    canManageAttendance: canManageAttendance(),
    canManageAssessments: canManageAssessments(),
    getUserPermissions: getUserPermissions(),
  };
};

export default useAuth;