// src/hooks/useUsers.js
import { useState, useEffect, useCallback } from 'react';
import userService from '../services/api/userService';

const useUsers = (initialParams = {}) => {
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  // Fetch all users
  const fetchUsers = useCallback(async (params = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const mergedParams = { ...initialParams, ...params };
      const response = await userService.getUsers(mergedParams);
      
      // Handle paginated response
      if (response.results) {
        setUsers(response.results);
        setPagination({
          page: params.page || 1,
          pageSize: params.page_size || 20,
          total: response.count,
          totalPages: Math.ceil(response.count / (params.page_size || 20)),
        });
      } else {
        // Handle non-paginated response
        setUsers(response);
      }
      
      return response;
    } catch (err) {
      setError(err);
      console.error('Error fetching users:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [initialParams]);

  // Fetch single user
  const fetchUser = useCallback(async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await userService.getUser(id);
      setUser(data);
      
      return data;
    } catch (err) {
      setError(err);
      console.error('Error fetching user:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch current user profile
  const fetchCurrentProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await userService.getCurrentUserProfile();
      setUser(data);
      
      return data;
    } catch (err) {
      setError(err);
      console.error('Error fetching profile:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create user
  const createUser = useCallback(async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newUser = await userService.createUser(userData);
      
      // Add to users list
      setUsers(prev => [...prev, newUser]);
      
      return newUser;
    } catch (err) {
      setError(err);
      console.error('Error creating user:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update user
  const updateUser = useCallback(async (id, userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedUser = await userService.updateUser(id, userData);
      
      // Update in users list
      setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
      
      // Update single user if it's the current one
      if (user?.id === id) {
        setUser(updatedUser);
      }
      
      return updatedUser;
    } catch (err) {
      setError(err);
      console.error('Error updating user:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Partial update user
  const patchUser = useCallback(async (id, userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedUser = await userService.patchUser(id, userData);
      
      // Update in users list
      setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
      
      // Update single user if it's the current one
      if (user?.id === id) {
        setUser(updatedUser);
      }
      
      return updatedUser;
    } catch (err) {
      setError(err);
      console.error('Error patching user:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Update current profile
  const updateCurrentProfile = useCallback(async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedUser = await userService.updateCurrentProfile(userData);
      setUser(updatedUser);
      
      return updatedUser;
    } catch (err) {
      setError(err);
      console.error('Error updating profile:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete user
  const deleteUser = useCallback(async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await userService.deleteUser(id);
      
      // Remove from users list
      setUsers(prev => prev.filter(u => u.id !== id));
      
      return true;
    } catch (err) {
      setError(err);
      console.error('Error deleting user:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Change password
  const changePassword = useCallback(async (passwordData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await userService.changePassword(passwordData);
      
      return true;
    } catch (err) {
      setError(err);
      console.error('Error changing password:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch user statistics
  const fetchUserStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await userService.getUserStats();
      setStats(data);
      
      return data;
    } catch (err) {
      setError(err);
      console.error('Error fetching user stats:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search users
  const searchUsers = useCallback(async (query) => {
    return fetchUsers({ search: query });
  }, [fetchUsers]);

  // Filter users by role
  const filterByRole = useCallback(async (role) => {
    return fetchUsers({ role });
  }, [fetchUsers]);

  // Filter active users
  const filterActive = useCallback(async (isActive = true) => {
    return fetchUsers({ is_active: isActive });
  }, [fetchUsers]);

  // Go to next page
  const nextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      fetchUsers({ page: pagination.page + 1, page_size: pagination.pageSize });
    }
  }, [pagination, fetchUsers]);

  // Go to previous page
  const previousPage = useCallback(() => {
    if (pagination.page > 1) {
      fetchUsers({ page: pagination.page - 1, page_size: pagination.pageSize });
    }
  }, [pagination, fetchUsers]);

  // Go to specific page
  const goToPage = useCallback((page) => {
    fetchUsers({ page, page_size: pagination.pageSize });
  }, [pagination.pageSize, fetchUsers]);

  // Refresh users list
  const refresh = useCallback(() => {
    fetchUsers({ page: pagination.page, page_size: pagination.pageSize });
  }, [pagination, fetchUsers]);

  return {
    // State
    users,
    user,
    stats,
    isLoading,
    error,
    pagination,
    
    // Actions
    fetchUsers,
    fetchUser,
    fetchCurrentProfile,
    createUser,
    updateUser,
    patchUser,
    updateCurrentProfile,
    deleteUser,
    changePassword,
    fetchUserStats,
    searchUsers,
    filterByRole,
    filterActive,
    refresh,
    
    // Pagination
    nextPage,
    previousPage,
    goToPage,
  };
};

export default useUsers;