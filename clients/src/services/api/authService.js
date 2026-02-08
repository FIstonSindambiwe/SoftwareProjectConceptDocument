// src/services/api/authService.js
import api from './axiosConfig';

const authService = {
  /**
   * Login user
   * POST /api/v1/auth/login/
   */
  async login(username, password) {
    try {
      console.log('Logging in user:', username);
      const response = await api.post('/auth/login/', {
        username,
        password,
      });

      const { access, refresh, user } = response.data;

      // Store tokens and user data
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));

      console.log('Login successful:', user);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error.response?.data || error;
    }
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
   * Check if user can edit data
   */
  canEditData() {
    const role = this.getUserRole();
    return ['admin', 'teacher', 'program_manager'].includes(role);
  },
};

export default authService;