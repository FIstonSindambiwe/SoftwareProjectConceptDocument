// src/services/api/userService.js
import axiosInstance from './axiosConfig';

const userService = {
  // Get all users
  getUsers: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/users/users/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user by ID
  getUser: async (id) => {
    try {
      const response = await axiosInstance.get(`/users/users/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get current user profile
  getCurrentUserProfile: async () => {
    try {
      const response = await axiosInstance.get('/users/users/me/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create user
  createUser: async (userData) => {
    try {
      const response = await axiosInstance.post('/users/users/', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update user
  updateUser: async (id, userData) => {
    try {
      const response = await axiosInstance.put(`/users/users/${id}/`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Partial update user
  patchUser: async (id, userData) => {
    try {
      const response = await axiosInstance.patch(`/users/users/${id}/`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update current user profile
  updateCurrentProfile: async (userData) => {
    try {
      const response = await axiosInstance.put('/users/users/me/', userData);
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(response.data));
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete user (deactivate)
  deleteUser: async (id) => {
    try {
      const response = await axiosInstance.delete(`/users/users/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await axiosInstance.post('/users/users/change-password/', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user statistics
  getUserStats: async () => {
    try {
      const response = await axiosInstance.get('/users/users/stats/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get audit logs
  getAuditLogs: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/users/audit-logs/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get my activity logs
  getMyActivity: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/users/audit-logs/my-activity/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default userService;