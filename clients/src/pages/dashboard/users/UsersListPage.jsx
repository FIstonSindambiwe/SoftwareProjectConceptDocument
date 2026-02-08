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
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Layout from '../../../components/layout/Layout';
import Button from '../../../components/common/Button';
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
      if (statusFilter) params.is_active = statusFilter;
      
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
      
      // Use the patchUser method directly
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">
              Manage system users, roles, and permissions
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              icon={ArrowPathIcon}
              onClick={handleRefresh}
              isLoading={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              icon={PlusIcon}
              onClick={() => navigate('/users/create')}
              size="lg"
            >
              Add New User
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
        <div className="flex items-center justify-between bg-white px-6 py-3 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">
            {isLoading ? (
              <span className="flex items-center">
                <Spinner size="sm" />
                <span className="ml-2">Loading users...</span>
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
        </div>

        {/* Users Table */}
        {isLoading && localUsers.length === 0 ? (
          <div className="flex justify-center items-center py-20 bg-white rounded-lg shadow">
            <Spinner size="lg" />
          </div>
        ) : localUsers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-20 w-20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || roleFilter || statusFilter
                ? 'Try adjusting your filters to find what you\'re looking for.'
                : 'Get started by creating your first user account.'}
            </p>
            {!searchTerm && !roleFilter && !statusFilter && (
              <Button
                variant="primary"
                icon={PlusIcon}
                onClick={() => navigate('/users/create')}
              >
                Create Your First User
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {localUsers.map((user, index) => (
                    <tr 
                      key={user.id} 
                      className={`transition-all duration-200 hover:bg-blue-50 hover:shadow-md ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-12 w-12 flex-shrink-0">
                            {user.avatar ? (
                              <img
                                className="h-12 w-12 rounded-full ring-2 ring-blue-100"
                                src={user.avatar}
                                alt={getDisplayName(user)}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ring-2 ring-blue-100 shadow-md">
                                <span className="text-white font-bold text-lg">
                                  {getAvatarInitial(user)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {getDisplayName(user)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {getUsername(user)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{user.email || '-'}</div>
                        {user.phone_number && (
                          <div className="text-xs text-gray-500">{user.phone_number}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeColor(user.role || '')}`}>
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
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                            user.is_active
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {user.is_active ? '● Active' : '○ Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.date_joined 
                          ? new Date(user.date_joined).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => navigate(`/users/${user.id}`)}
                            className="p-2.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-110 group"
                            title="View Details"
                          >
                            <EyeIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={() => navigate(`/users/${user.id}/edit`)}
                            className="p-2.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-all duration-200 hover:scale-110 group"
                            title="Edit User"
                          >
                            <PencilIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={updatingUser === user.id}
                            className={`p-2.5 rounded-lg transition-all duration-200 hover:scale-110 group disabled:opacity-50 disabled:cursor-not-allowed ${
                              user.is_active
                                ? 'text-red-600 hover:bg-red-100'
                                : 'text-green-600 hover:bg-green-100'
                            }`}
                            title={user.is_active ? 'Deactivate User' : 'Activate User'}
                          >
                            {updatingUser === user.id ? (
                              <Spinner size="sm" />
                            ) : user.is_active ? (
                              <NoSymbolIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            ) : (
                              <CheckCircleIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UsersListPage;