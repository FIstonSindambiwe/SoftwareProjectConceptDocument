// src/services/api/authService.js
import api from './axiosConfig';

const authService = {
  /**
   * Login user
   * POST /api/v1/auth/login/
   * Returns: { access, refresh, user, must_change_password? }
   */
  async login(username, password) {
    try {
      console.log('Logging in user:', username);
      const response = await api.post('/auth/login/', {
        username,
        password,
      });

      const { access, refresh, user, must_change_password, message } = response.data;

      // Store tokens and user data
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Store password change requirement
      if (must_change_password) {
        localStorage.setItem('must_change_password', 'true');
      } else {
        localStorage.removeItem('must_change_password');
      }

      console.log('Login successful:', user);
      
      // Return full response with password change flag
      return {
        ...response.data,
        success: true,
        mustChangePassword: must_change_password || false,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Change user password
   * POST /api/v1/auth/change_password/
   * 
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @param {string} newPasswordConfirm - Confirm new password
   */
  async changePassword(oldPassword, newPassword, newPasswordConfirm) {
    try {
      const token = this.getToken();
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await api.post(
        '/auth/change_password/',
        {
          old_password: oldPassword,
          new_password: newPassword,
          new_password_confirm: newPasswordConfirm,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Clear the must_change_password flag after successful password change
      localStorage.removeItem('must_change_password');
      
      console.log('Password changed successfully');
      return {
        success: true,
        message: response.data.message || 'Password changed successfully',
      };
    } catch (error) {
      console.error('Change password error:', error);
      
      // Handle specific error cases
      if (error.response?.data) {
        // Extract validation errors
        const errorData = error.response.data;
        let errorMessage = '';
        
        if (errorData.new_password_confirm) {
          errorMessage = errorData.new_password_confirm[0];
        } else if (errorData.new_password) {
          errorMessage = errorData.new_password[0];
        } else if (errorData.old_password) {
          errorMessage = errorData.old_password[0];
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors[0];
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else {
          errorMessage = 'Password change failed';
        }
        
        throw { message: errorMessage, ...errorData };
      }
      
      throw error;
    }
  },

  /**
   * Reset password for a user (Admin only)
   * POST /api/v1/auth/{userId}/reset_password/
   * 
   * @param {number} userId - ID of user to reset password for
   */
  async resetPassword(userId) {
    try {
      const token = this.getToken();
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await api.post(
        `/auth/${userId}/reset_password/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Password reset successful for user:', userId);
      return {
        success: true,
        message: response.data.message,
        tempPassword: response.data.temp_password, // Only in development
      };
    } catch (error) {
      console.error('Reset password error:', error);
      
      if (error.response?.status === 403) {
        throw { message: 'You do not have permission to reset passwords' };
      }
      
      throw error.response?.data || { message: 'Failed to reset password' };
    }
  },

  /**
   * Check if user must change password on next login
   */
  mustChangePassword() {
    return localStorage.getItem('must_change_password') === 'true';
  },

  /**
   * Logout user
   * POST /api/v1/auth/logout/
   */
  async logout() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        await api.post('/auth/logout/', {
          refresh: refreshToken,
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('must_change_password');
    }
  },

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh/
   */
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/auth/refresh/', {
        refresh: refreshToken,
      });

      const { access } = response.data;
      localStorage.setItem('access_token', access);

      return access;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.logout();
      throw error;
    }
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  },

  /**
   * Update current user in localStorage
   */
  updateCurrentUser(userData) {
    const currentUser = this.getCurrentUser();
    const updatedUser = { ...currentUser, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  },

  /**
   * Get access token
   */
  getToken() {
    return localStorage.getItem('access_token');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const token = this.getToken();
    return !!token;
  },

  /**
   * Check if user is authenticated and not required to change password
   */
  isFullyAuthenticated() {
    return this.isAuthenticated() && !this.mustChangePassword();
  },

  /**
   * Get user role
   */
  getUserRole() {
    const user = this.getCurrentUser();
    return user?.role || null;
  },

  /**
   * Check if user is admin
   */
  isAdmin() {
    return this.getUserRole() === 'admin';
  },

  /**
   * Check if user is teacher
   */
  isTeacher() {
    return this.getUserRole() === 'teacher';
  },

  /**
   * Check if user is donor
   */
  isDonor() {
    return this.getUserRole() === 'donor';
  },

  /**
   * Check if user is program manager
   */
  isProgramManager() {
    return this.getUserRole() === 'program_manager';
  },

  /**
   * Check if user can edit data
   */
  canEditData() {
    const role = this.getUserRole();
    return ['admin', 'teacher', 'program_manager'].includes(role);
  },

  /**
   * Check if user can manage users (admin only)
   */
  canManageUsers() {
    return this.isAdmin();
  },

  /**
   * Check if user can view reports (all authenticated users)
   */
  canViewReports() {
    return this.isAuthenticated();
  },

  /**
   * Check if user can manage programs
   */
  canManagePrograms() {
    const role = this.getUserRole();
    return ['admin', 'program_manager'].includes(role);
  },

  /**
   * Check if user can manage attendance
   */
  canManageAttendance() {
    const role = this.getUserRole();
    return ['admin', 'teacher', 'program_manager'].includes(role);
  },

  /**
   * Check if user can manage assessments
   */
  canManageAssessments() {
    const role = this.getUserRole();
    return ['admin', 'teacher', 'program_manager'].includes(role);
  },

  /**
   * Clear all auth data (for testing/debugging)
   */
  clearAuthData() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('must_change_password');
  },

  /**
   * Get user permissions summary
   */
  getUserPermissions() {
    return {
      isAuthenticated: this.isAuthenticated(),
      isFullyAuthenticated: this.isFullyAuthenticated(),
      role: this.getUserRole(),
      isAdmin: this.isAdmin(),
      isTeacher: this.isTeacher(),
      isDonor: this.isDonor(),
      isProgramManager: this.isProgramManager(),
      canEditData: this.canEditData(),
      canManageUsers: this.canManageUsers(),
      canViewReports: this.canViewReports(),
      canManagePrograms: this.canManagePrograms(),
      canManageAttendance: this.canManageAttendance(),
      canManageAssessments: this.canManageAssessments(),
      mustChangePassword: this.mustChangePassword(),
    };
  },
};

export default authService;