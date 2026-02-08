// src/pages/dashboard/users/UsersListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Badge from '../../../components/common/Badge';
import Spinner from '../../../components/common/Spinner';
import Alert from '../../../components/common/Alert';
import useUsers from '../../../hooks/useUsers';
import useAuth from '../../../hooks/useAuth';
import { formatDate, getUserRoleLabel, getRoleBadgeVariant } from '../../../utils/helpers';

const UsersListPage = () => {
  const navigate = useNavigate();
  const { canManageUsers } = useAuth();
  const { users, isLoading, error, pagination, fetchUsers, deleteUser } = useUsers();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const params = {};
    if (searchQuery) params.search = searchQuery;
    if (roleFilter !== 'all') params.role = roleFilter;
    if (statusFilter !== 'all') params.is_active = statusFilter === 'active';
    
    fetchUsers(params);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadUsers();
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to deactivate ${user.username}?`)) {
      return;
    }

    try {
      await deleteUser(user.id);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const UserRow = ({ user }) => (
    <tr 
      className="hover:bg-gray-50 cursor-pointer"
      onClick={() => navigate(`/users/${user.id}`)}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{user.username}</div>
            <div className="text-sm text-gray-500">{user.email || '-'}</div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{user.first_name} {user.last_name}</div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={getRoleBadgeVariant(user.role)}>
          {getUserRoleLabel(user.role)}
        </Badge>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={user.is_active ? 'success' : 'default'}>
          {user.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {user.organization || '-'}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(user.date_joined)}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/users/${user.id}/edit`)}
          >
            Edit
          </Button>
          {canManageUsers() && user.is_active && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(user)}
            >
              Deactivate
            </Button>
          )}
        </div>
      </td>
    </tr>
  );

  if (!canManageUsers()) {
    return (
      <Layout>
        <Alert type="warning" message="You don't have permission to view this page" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="text-gray-500 mt-1">Manage system users and permissions</p>
          </div>
          <Button
            variant="primary"
            icon={PlusIcon}
            onClick={() => navigate('/users/create')}
          >
            Add User
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="search"
                  placeholder="Search by username or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={MagnifyingGlassIcon}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                icon={FunnelIcon}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters
              </Button>
              <Button type="submit" variant="primary">
                Search
              </Button>
              <Button
                type="button"
                variant="ghost"
                icon={ArrowPathIcon}
                onClick={loadUsers}
              >
                Refresh
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="program_manager">Program Manager</option>
                    <option value="donor">Donor</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            )}
          </form>
        </Card>

        {/* Users Table */}
        <Card>
          {error && (
            <div className="mb-4">
              <Alert type="error" message="Failed to load users" />
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UserGroupIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No users found</p>
              <p className="text-sm mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Organization
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <UserRow key={user.id} user={user} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between px-4">
                  <div className="text-sm text-gray-500">
                    Showing {users.length} of {pagination.total} users
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() => fetchUsers({ page: pagination.page - 1 })}
                    >
                      Previous
                    </Button>
                    <span className="inline-flex items-center px-4 text-sm text-gray-700">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() => fetchUsers({ page: pagination.page + 1 })}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default UsersListPage;