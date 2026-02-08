// src/hooks/useUsers.js
import { useState, useEffect } from 'react';
import userService from '../services/api/userService';

const useUsers = (userId = null) => {
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Fetch all users
  const fetchUsers = async (params = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await userService.getUsers(params);
      setUsers(data.results || data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch single user
  const fetchUser = async (id) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await userService.getUser(id);
      setUser(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch user');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Create new user
  const createUser = async (userData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await userService.createUser(userData);
      setUsers(prev => [...prev, data]);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to create user');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user (full update)
  const updateUser = async (id, userData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await userService.updateUser(id, userData);
      setUsers(prev => prev.map(u => u.id === id ? data : u));
      setUser(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to update user');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Partial update user (PATCH)
  const patchUser = async (id, userData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await userService.patchUser(id, userData);
      setUsers(prev => prev.map(u => u.id === id ? data : u));
      setUser(data);
      return data;
    } catch (err) {
      console.error('Error in patchUser:', err);
      setError(err.message || 'Failed to update user');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete user
  const deleteUser = async (id) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await userService.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      return true;
    } catch (err) {
      setError(err.message || 'Failed to delete user');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user stats
  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await userService.getStats();
      setStats(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch stats');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch user if userId is provided
  useEffect(() => {
    if (userId) {
      fetchUser(userId);
    }
  }, [userId]);

  return {
    // State
    users,
    user,
    isLoading,
    error,
    stats,
    
    // Methods
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    patchUser,
    deleteUser,
    fetchStats,
  };
};

export default useUsers;