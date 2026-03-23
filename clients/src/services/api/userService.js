// src/services/api/userService.js
import api from './axiosConfig';

const userService = {
  /**
   * Get list of all users (Admin only)
   * GET /api/v1/auth/
   */
  async getUsers(params = {}) {
    try {
      console.log('Fetching users with params:', params);
      const response = await api.get('/auth/', { params });
      console.log('Users fetched successfully:', response.data.length || 0, 'users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get single user by ID (Admin or self)
   * GET /api/v1/auth/{id}/
   */
  async getUser(id) {
    try {
      console.log('Fetching user:', id);
      const response = await api.get(`/auth/${id}/`);
      console.log('User fetched successfully:', response.data.username);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Create new user (Admin only)
   * Password is auto-generated if not provided
   * POST /api/v1/auth/
   */
  async createUser(userData) {
    try {
      console.log('Creating user with data:', {
        ...userData,
        password: userData.password ? '***' : 'auto-generated',
        password_confirm: userData.password_confirm ? '***' : undefined
      });
      
      const response = await api.post('/auth/', userData);
      
      console.log('User created successfully:', {
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
        email_sent: response.data.email_sent,
        temp_password: response.data.temp_password || undefined
      });
      
      // Show warning if email wasn't sent
      if (response.data.email_sent === false) {
        console.warn('User created but welcome email failed to send');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Reset user password (Admin only)
   * POST /api/v1/auth/{id}/reset_password/
   */
  async resetUserPassword(userId) {
    try {
      console.log('Resetting password for user:', userId);
      const response = await api.post(`/auth/${userId}/reset_password/`);
      console.log('Password reset successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error resetting password:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Update user - Full update (Admin or self)
   * PUT /api/v1/auth/{id}/
   */
  async updateUser(id, userData) {
    try {
      console.log('=== UPDATE USER (PUT) ===');
      console.log('User ID:', id);
      console.log('Data:', userData);
      
      const response = await api.put(`/auth/${id}/`, userData);
      
      console.log('=== UPDATE SUCCESS ===');
      console.log('Status:', response.status);
      console.log('Updated data:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('=== UPDATE ERROR ===');
      console.error('Error:', error);
      console.error('Response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Partial update user (Admin or self)
   * PATCH /api/v1/auth/{id}/
   */
  async patchUser(id, userData) {
    try {
      console.log('=== PATCH USER ===');
      console.log('User ID:', id);
      console.log('Update data:', userData);
      
      // Get current user for debugging
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('Current user role:', currentUser.role);
      
      const response = await api.patch(`/auth/${id}/`, userData);
      
      console.log('=== PATCH SUCCESS ===');
      console.log('Status:', response.status);
      console.log('Response data:', response.data);
      
      if (response.data && 'is_active' in response.data) {
        console.log('✅ is_active updated to:', response.data.is_active);
      }
      
      // Update local storage if updating current user
      if (currentUser && currentUser.id === id) {
        const updatedUser = { ...currentUser, ...response.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        console.log('Updated current user in localStorage');
      }
      
      return response.data;
    } catch (error) {
      console.error('=== PATCH ERROR ===');
      console.error('Error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Check for specific errors
      if (error.response?.status === 403) {
        console.error('Permission denied! Current user role:', currentUser?.role);
        console.error('Target user ID:', id);
      }
      
      if (error.response?.status === 400) {
        console.error('Validation errors:', error.response.data);
      }
      
      throw error.response?.data || error;
    }
  },

  /**
   * Toggle user active status (alternative method)
   * This calls the PATCH endpoint with just is_active field
   */
  async toggleUserStatus(id, newStatus) {
    try {
      console.log('=== TOGGLE USER STATUS ===');
      console.log('User ID:', id);
      console.log('New status:', newStatus);
      
      return await this.patchUser(id, { is_active: newStatus });
    } catch (error) {
      console.error('Toggle user status error:', error);
      throw error;
    }
  },

  /**
   * Delete/Deactivate user (Admin only)
   * DELETE /api/v1/auth/{id}/
   */
  async deleteUser(id) {
    try {
      console.log('Deleting/Deactivating user:', id);
      const response = await api.delete(`/auth/${id}/`);
      console.log('User deleted/deactivated successfully');
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Update current user profile
   * PUT /api/v1/auth/update_profile/
   */
  async updateProfile(userData) {
    try {
      console.log('Updating profile with data:', userData);
      const response = await api.put('/auth/update_profile/', userData);
      console.log('Profile updated successfully:', response.data);
      
      // Update user in localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...response.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get current user
   * GET /api/v1/auth/me/
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me/');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Partial update current user profile
   * PATCH /api/v1/auth/update_profile/
   */
  async patchProfile(userData) {
    try {
      console.log('Patching profile with data:', userData);
      const response = await api.patch('/auth/update_profile/', userData);
      console.log('Profile patched successfully:', response.data);
      
      // Update user in localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...response.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return response.data;
    } catch (error) {
      console.error('Error patching profile:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Change password
   * POST /api/v1/auth/change_password/
   */
  async changePassword(passwordData) {
    try {
      console.log('Changing password...');
      const response = await api.post('/auth/change_password/', passwordData);
      console.log('Password changed successfully');
      
      // Clear must_change_password flag from localStorage if present
      localStorage.removeItem('must_change_password');
      
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get user statistics (Admin only)
   * GET /api/v1/auth/stats/
   */
  async getStats() {
    try {
      const response = await api.get('/auth/stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      console.error('Error response:', error.response?.data);
      // Return null instead of throwing to handle gracefully
      return null;
    }
  },

  /**
   * Get audit logs for specific user (Admin only)
   * GET /api/v1/auth/{id}/audit_logs/
   */
  async getUserAuditLogs(userId) {
    try {
      const response = await api.get(`/auth/${userId}/audit_logs/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get current user's activity logs
   * GET /api/v1/auth/my_activity/
   */
  async getMyActivity() {
    try {
      const response = await api.get('/auth/my_activity/');
      return response.data;
    } catch (error) {
      console.error('Error fetching activity:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get all audit logs (Admin only)
   * GET /api/v1/auth/audit-logs/
   */
  async getAuditLogs(params = {}) {
    try {
      const response = await api.get('/auth/audit-logs/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get specific audit log (Admin only)
   * GET /api/v1/auth/audit-logs/{id}/
   */
  async getAuditLog(id) {
    try {
      const response = await api.get(`/auth/audit-logs/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching audit log:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get own activity logs from audit endpoint
   * GET /api/v1/auth/audit-logs/my_activity/
   */
  async getMyAuditActivity() {
    try {
      const response = await api.get('/auth/audit-logs/my_activity/');
      return response.data;
    } catch (error) {
      console.error('Error fetching activity:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },
  
  /**
   * Resend welcome email to user (Admin only)
   * POST /api/v1/auth/{id}/resend_welcome_email/
   */
  async resendWelcomeEmail(userId) {
    try {
      console.log('Resending welcome email to user:', userId);
      const response = await api.post(`/auth/${userId}/resend_welcome_email/`);
      console.log('Welcome email resent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error resending welcome email:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },
  
  /**
   * Check email status for a user
   * GET /api/v1/auth/{id}/email_status/
   */
  async getEmailStatus(userId) {
    try {
      const response = await api.get(`/auth/${userId}/email_status/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching email status:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  }
};

export default userService;