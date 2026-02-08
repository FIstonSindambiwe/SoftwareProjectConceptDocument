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
import Modal from '../../../components/common/Modal';
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
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState(null);
  const [isToggling, setIsToggling] = useState(false);

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
      
      console.log('Loading users with params:', params);
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

  const handleToggleClick = (user, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('Toggle clicked for user:', user);
    setUserToToggle(user);
    setToggleModalOpen(true);
  };

  const handleToggleConfirm = async () => {
    if (!userToToggle) return;

    setIsToggling(true);

    try {
      const newStatus = !userToToggle.is_active;
      console.log('=== LIST TOGGLE START ===');
      console.log('User:', userToToggle.username, 'ID:', userToToggle.id);
      console.log('Current status:', userToToggle.is_active);
      console.log('New status:', newStatus);

      // Get current user for debugging
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('Current user role:', currentUser.role);

      // Use the patchUser method from useUsers hook
      await patchUser(userToToggle.id, { is_active: newStatus });
      
      console.log('=== LIST TOGGLE SUCCESS ===');
      toast.success(
        `User "${userToToggle.username}" has been ${newStatus ? 'activated' : 'deactivated'}`
      );
      
      setToggleModalOpen(false);
      setUserToToggle(null);
      
      // Reload users after a short delay
      setTimeout(() => {
        loadUsers();
      }, 300);
      
    } catch (error) {
      console.error('=== LIST TOGGLE ERROR ===');
      console.error('Full error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to update user status';
      
      if (error.response?.data) {
        if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (typeof error.response.data === 'object') {
          // Try to get first error message
          const errors = Object.values(error.response.data).flat();
          errorMessage = errors[0] || errorMessage;
        }
      }
      
      if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to change user status';
      }
      
      if (error.response?.status === 400) {
        console.log('Validation errors:', error.response.data);
        if (error.response.data.is_active) {
          errorMessage = `Cannot change status: ${error.response.data.is_active[0]}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsToggling(false);
    }
  };

  const handleRefresh = () => {
    console.log('Manual refresh triggered');
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
                Showing <span className="font-semibold text-gray-900">{users.length}</span> user{users.length !== 1 ? 's' : ''}
                {(searchTerm || roleFilter || statusFilter) && (
                  <span className="text-gray-400"> (filtered)</span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Users Table */}
        {isLoading && !users.length ? (
          <div className="flex justify-center items-center py-20 bg-white rounded-lg shadow">
            <Spinner size="lg" />
          </div>
        ) : users.length === 0 ? (
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
                  {users.map((user, index) => (
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
                                alt={user.username}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ring-2 ring-blue-100 shadow-md">
                                <span className="text-white font-bold text-lg">
                                  {user.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {user.full_name || user.username}
                            </div>
                            <div className="text-xs text-gray-500">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{user.email}</div>
                        {user.phone_number && (
                          <div className="text-xs text-gray-500">{user.phone_number}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeColor(user.role)}`}>
                          {user.role_display || user.role}
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
                        {new Date(user.date_joined).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
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
                            onClick={(e) => handleToggleClick(user, e)}
                            className={`p-2.5 rounded-lg transition-all duration-200 hover:scale-110 group ${
                              user.is_active
                                ? 'text-red-600 hover:bg-red-100'
                                : 'text-green-600 hover:bg-green-100'
                            }`}
                            title={user.is_active ? 'Deactivate User' : 'Activate User'}
                          >
                            {user.is_active ? (
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

        {/* Toggle Status Confirmation Modal - FIXED */}
        {toggleModalOpen && userToToggle && (
          <Modal
            isOpen={toggleModalOpen}
            onClose={() => !isToggling && setToggleModalOpen(false)}
            title={userToToggle?.is_active ? 'Deactivate User' : 'Activate User'}
          >
            <div className="space-y-4">
              <div className={`border-l-4 p-4 ${
                userToToggle?.is_active 
                  ? 'bg-yellow-50 border-yellow-400' 
                  : 'bg-green-50 border-green-400'
              }`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {userToToggle?.is_active ? (
                      <NoSymbolIcon className="h-5 w-5 text-yellow-400" />
                    ) : (
                      <CheckCircleIcon className="h-5 w-5 text-green-400" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm ${
                      userToToggle?.is_active ? 'text-yellow-700' : 'text-green-700'
                    }`}>
                      {userToToggle?.is_active
                        ? 'This will deactivate the user account. The user will not be able to log in, but their data will be preserved.'
                        : 'This will reactivate the user account. The user will be able to log in again.'}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-gray-600">
                Are you sure you want to {userToToggle?.is_active ? 'deactivate' : 'activate'}{' '}
                <span className="font-semibold text-gray-900">{userToToggle?.username}</span>?
              </p>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setToggleModalOpen(false)}
                  disabled={isToggling}
                >
                  Cancel
                </Button>
                <Button
                  variant={userToToggle?.is_active ? 'danger' : 'primary'}
                  icon={userToToggle?.is_active ? NoSymbolIcon : CheckCircleIcon}
                  onClick={handleToggleConfirm}
                  isLoading={isToggling}
                >
                  {userToToggle?.is_active ? 'Deactivate' : 'Activate'} User
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
};

export default UsersListPage;