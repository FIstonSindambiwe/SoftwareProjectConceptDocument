// src/pages/dashboard/users/UsersListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  EyeIcon,
  PencilIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Layout from '../../../components/layout/Layout';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import Spinner from '../../../components/common/Spinner';
import UserFilter from '../../../components/users/UserFilter';
import UserStats from '../../../components/users/UserStats';
import useUsers from '../../../hooks/useUsers';

const UsersListPage = () => {
  const navigate = useNavigate();
  const { users, isLoading, fetchUsers, patchUser } = useUsers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingUser, setUpdatingUser] = useState(null);
  const [localUsers, setLocalUsers] = useState([]);

  // Update local users when the fetched users change
  useEffect(() => {
    if (Array.isArray(users)) {
      setLocalUsers(users);
    }
  }, [users]);

  // Fetch users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.is_active = statusFilter === 'active';
      
      await fetchUsers(params);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    }
  };

  // Reload when filters change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadUsers();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, roleFilter, statusFilter]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
  };

  const handleToggleStatus = async (user) => {
    setUpdatingUser(user.id);
    
    try {
      const newStatus = !user.is_active;
      
      await patchUser(user.id, { is_active: newStatus });
      
      toast.success(
        `User "${user.username || 'User'}" has been ${newStatus ? 'activated' : 'deactivated'}`
      );
      
      // Update local state immediately
      setLocalUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === user.id 
            ? { ...u, is_active: newStatus }
            : u
        )
      );
      
      // Reload users after a short delay to get fresh data
      setTimeout(() => {
        loadUsers();
      }, 500);
      
    } catch (error) {
      console.error('Toggle error:', error);
      
      let errorMessage = 'Failed to update user status';
      
      if (error.response?.data) {
        if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (typeof error.response.data === 'object') {
          const errors = Object.values(error.response.data).flat();
          errorMessage = errors[0] || errorMessage;
        }
      }
      
      if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to change user status';
      }
      
      toast.error(errorMessage);
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleRefresh = () => {
    loadUsers();
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800 border-red-200',
      teacher: 'bg-blue-100 text-blue-800 border-blue-200',
      program_manager: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      staff: 'bg-purple-100 text-purple-800 border-purple-200',
      donor: 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Safe helper functions
  const getAvatarInitial = (user) => {
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    } else if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    } else if (user?.first_name) {
      return user.first_name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = (user) => {
    if (user?.full_name) return user.full_name;
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user?.first_name) return user.first_name;
    if (user?.username) return user.username;
    if (user?.email) return user.email.split('@')[0];
    return 'Unknown User';
  };

  const getUsername = (user) => {
    if (user?.username) return `@${user.username}`;
    if (user?.email) return user.email;
    return '';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage system users, roles, and permissions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/dashboard/users/create')}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Add New User</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* User Statistics */}
        <UserStats />

        {/* Filters */}
        <UserFilter
          searchTerm={searchTerm}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          onSearchChange={setSearchTerm}
          onRoleChange={setRoleFilter}
          onStatusChange={setStatusFilter}
          onClearFilters={handleClearFilters}
        />

        {/* Results Count */}
        <Card className="flex items-center justify-between px-6 py-3">
          <div className="text-sm text-gray-600">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                <span>Loading users...</span>
              </span>
            ) : (
              <span>
                Showing <span className="font-semibold text-gray-900">{localUsers.length}</span> user{localUsers.length !== 1 ? 's' : ''}
                {(searchTerm || roleFilter || statusFilter) && (
                  <span className="text-gray-400"> (filtered)</span>
                )}
              </span>
            )}
          </div>
          <button 
            onClick={handleRefresh} 
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 lg:hidden"
            disabled={isLoading}
          >
            <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </Card>

        {/* Users Table */}
        {isLoading && localUsers.length === 0 ? (
          <div className="flex justify-center items-center py-20 bg-white rounded-lg border border-gray-200">
            <div className="flex flex-col items-center gap-4">
              <Spinner size="lg" />
              <p className="text-sm text-gray-500">Loading users...</p>
            </div>
          </div>
        ) : localUsers.length === 0 ? (
          <Card className="text-center py-16">
            <div className="max-w-sm mx-auto">
              <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <UserGroupIcon className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-sm text-gray-500 mb-6">
                {searchTerm || roleFilter || statusFilter
                  ? 'Try adjusting your filters to find what you\'re looking for.'
                  : 'Get started by creating your first user account.'}
              </p>
              {!searchTerm && !roleFilter && !statusFilter ? (
                <Button
                  variant="primary"
                  onClick={() => navigate('/dashboard/users/create')}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Your First User
                </Button>
              ) : (
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden" padding={false}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Organization
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Joined
                    </th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {localUsers.map((user) => (
                    <tr 
                      key={user.id} 
                      className="hover:bg-blue-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {user.avatar ? (
                              <img
                                className="h-10 w-10 rounded-full ring-2 ring-blue-100 object-cover"
                                src={user.avatar}
                                alt={getDisplayName(user)}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ring-2 ring-blue-100">
                                <span className="text-white font-semibold text-sm">
                                  {getAvatarInitial(user)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {getDisplayName(user)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {getUsername(user)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email || '-'}</div>
                        {user.phone_number && (
                          <div className="text-xs text-gray-500">{user.phone_number}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full border ${getRoleBadgeColor(user.role)}`}>
                          {user.role_display || user.role || 'None'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.organization || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full border ${
                            user.is_active
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          <span className={`mr-1.5 h-2 w-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(user.date_joined)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View button - icon only */}
                          <button
                            onClick={() => navigate(`/dashboard/users/${user.id}`)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="View Details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          
                          {/* Edit button - icon only */}
                          <button
                            onClick={() => navigate(`/dashboard/users/${user.id}/edit`)}
                            className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            title="Edit User"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          
                          {/* Toggle Status button - icon only */}
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={updatingUser === user.id}
                            className={`p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                              user.is_active
                                ? 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                                : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                            }`}
                            title={user.is_active ? 'Deactivate User' : 'Activate User'}
                          >
                            {updatingUser === user.id ? (
                              <Spinner size="sm" />
                            ) : user.is_active ? (
                              <NoSymbolIcon className="h-5 w-5" />
                            ) : (
                              <CheckCircleIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Table footer with record count */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              <div className="flex items-center justify-between">
                <span>
                  Showing {localUsers.length} of {localUsers.length} users
                </span>
                <span className="text-gray-400">
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default UsersListPage;