// src/services/api/authService.js
import axiosInstance from './axiosConfig';

const authService = {
  // Login user
  login: async (username, password) => {
    try {
      const response = await axiosInstance.post('/users/auth/login/', {
        username,
        password,
      });

      const { access, refresh, user } = response.data;

      // Store tokens and user data
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Logout user
  logout: async () => {
    try {
      await axiosInstance.post('/users/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call result
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  // Get user role
  getUserRole: () => {
    const user = authService.getCurrentUser();
    return user?.role || null;
  },

  // Check if user has specific role
  hasRole: (role) => {
    const userRole = authService.getUserRole();
    return userRole === role;
  },

  // Check if user is admin
  isAdmin: () => {
    return authService.hasRole('admin');
  },

  // Check if user is teacher
  isTeacher: () => {
    return authService.hasRole('teacher');
  },

  // Check if user can edit data
  canEditData: () => {
    const role = authService.getUserRole();
    return ['admin', 'teacher', 'program_manager'].includes(role);
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      const response = await axiosInstance.post('/auth/refresh/', {
        refresh: refreshToken,
      });

      const { access } = response.data;
      localStorage.setItem('access_token', access);

      return access;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default authService;