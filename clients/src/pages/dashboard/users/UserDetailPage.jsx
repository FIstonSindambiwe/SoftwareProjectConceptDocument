// src/pages/dashboard/users/UserDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Spinner from '../../../components/common/Spinner';
import Modal from '../../../components/common/Modal';
import useUsers from '../../../hooks/useUsers';

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoading, fetchUser, patchUser } = useUsers();
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      console.log(`Loading user with ID: ${id}`);
      await fetchUser(id);
    } catch (error) {
      console.error('Error loading user:', error);
      toast.error('Failed to load user');
    }
  };

  // Simple toggle handler - just opens modal
  const handleToggleClick = () => {
    console.log('Toggle button clicked, opening modal');
    console.log('Current user:', user);
    console.log('Current user status:', user?.is_active);
    setToggleModalOpen(true);
  };

  const handleToggleConfirm = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      const newStatus = !user.is_active;
      console.log('=== CONFIRM TOGGLE ===');
      console.log('User ID:', id);
      console.log('Username:', user.username);
      console.log('Current status:', user.is_active);
      console.log('New status:', newStatus);

      // Get current user for debugging
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('Current user role:', currentUser.role);

      // Call patchUser with clean data
      await patchUser(id, { is_active: newStatus });
      
      toast.success(
        `User "${user.username}" has been ${newStatus ? 'activated' : 'deactivated'}`
      );
      
      setToggleModalOpen(false);
      
      // Reload user data
      await loadUser();
      
    } catch (error) {
      console.error('Toggle status error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to update user status';
      
      // Extract meaningful error message
      if (error.response?.data) {
        if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data === 'object') {
          // Try to get first error message
          const errors = Object.values(error.response.data).flat();
          errorMessage = errors[0] || errorMessage;
        }
      }
      
      // Check for permission errors
      if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to change user status';
      }
      
      // Check for validation errors
      if (error.response?.status === 400) {
        console.log('Validation errors:', error.response.data);
        
        // If it's an is_active validation error, try alternative approach
        if (error.response.data.is_active) {
          errorMessage = `Cannot change status: ${error.response.data.is_active[0]}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  // Test API endpoints directly
  const testDirectToggle = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      console.log('=== DIRECT TOGGLE TEST ===');
      
      const token = localStorage.getItem('access_token');
      const newStatus = !user.is_active;
      
      const response = await fetch(`http://localhost:8000/api/v1/auth/${id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: newStatus }),
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Success! Response:', data);
        toast.success('Direct toggle successful');
        loadUser();
      } else {
        const text = await response.text();
        console.error('Error response text:', text);
        try {
          const errorData = JSON.parse(text);
          console.error('Error response JSON:', errorData);
          toast.error(`Toggle failed: ${response.status} - ${JSON.stringify(errorData)}`);
        } catch (e) {
          console.error('Error response is not JSON:', text);
          toast.error(`Toggle failed: ${response.status} ${response.statusText}`);
        }
      }
      
    } catch (error) {
      console.error('Direct toggle error:', error);
      toast.error(`Network error: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading && !user) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-20">
          <UserCircleIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">User not found</h3>
          <p className="mt-2 text-gray-600">The user you're looking for doesn't exist.</p>
          <Button
            variant="primary"
            onClick={() => navigate('/users')}
            className="mt-6"
          >
            Back to Users
          </Button>
        </div>
      </Layout>
    );
  }

  const getRoleBadgeVariant = (role) => {
    const variants = {
      admin: 'danger',
      teacher: 'primary',
      program_manager: 'warning',
      donor: 'success',
    };
    return variants[role] || 'default';
  };

  const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="py-3">
      <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
        {Icon && <Icon className="h-4 w-4 mr-2" />}
        {label}
      </div>
      <p className="text-sm text-gray-900 font-medium">{value || '-'}</p>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Debug Panel (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="bg-yellow-50 border-yellow-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="font-semibold text-yellow-800">Debug Tools</span>
              </div>
              <div className="text-xs text-yellow-600">
                User ID: {id} | Status: {user.is_active ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div className="mt-2 flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={testDirectToggle}
                isLoading={isUpdating}
              >
                Test Direct Toggle
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('Current modal state:', toggleModalOpen);
                  console.log('Current user:', user);
                  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                  console.log('Logged in as:', currentUser);
                }}
              >
                Log Info
              </Button>
            </div>
          </Card>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <Button
                variant="ghost"
                icon={ArrowLeftIcon}
                onClick={() => navigate('/users')}
              >
                Back
              </Button>
              
              <div className="flex items-start space-x-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="h-20 w-20 rounded-full ring-4 ring-blue-100"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ring-4 ring-blue-100 shadow-lg">
                      <span className="text-white font-bold text-2xl">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {user.full_name || user.username}
                    </h1>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role_display || user.role}
                    </Badge>
                    <Badge variant={user.is_active ? 'success' : 'default'}>
                      {user.is_active ? '● Active' : '○ Inactive'}
                    </Badge>
                  </div>
                  <p className="text-gray-600">@{user.username}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons - FIXED */}
            <div className="flex space-x-2">
              <Button
                variant="primary"
                icon={PencilIcon}
                onClick={() => navigate(`/users/${id}/edit`)}
              >
                Edit User
              </Button>
              <Button
                variant={user.is_active ? 'danger' : 'success'}
                icon={user.is_active ? NoSymbolIcon : CheckCircleIcon}
                onClick={handleToggleClick}
                isLoading={isUpdating}
              >
                {user.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card title="Personal Information">
              <div className="divide-y divide-gray-200">
                <InfoRow label="First Name" value={user.first_name} />
                <InfoRow label="Last Name" value={user.last_name} />
                <InfoRow label="Email Address" value={user.email} icon={EnvelopeIcon} />
                <InfoRow label="Phone Number" value={user.phone_number} icon={PhoneIcon} />
                <InfoRow label="Organization" value={user.organization} icon={BuildingOfficeIcon} />
              </div>
              
              {user.bio && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Bio</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{user.bio}</p>
                </div>
              )}
            </Card>

            {/* Permissions & Access */}
            <Card title="Permissions & Access">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Admin Access</span>
                    <ShieldCheckIcon className={`h-5 w-5 ${user.role === 'admin' ? 'text-red-600' : 'text-gray-400'}`} />
                  </div>
                  <Badge variant={user.role === 'admin' ? 'danger' : 'default'} size="sm">
                    {user.role === 'admin' ? 'Yes' : 'No'}
                  </Badge>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Can Edit Data</span>
                    <PencilIcon className={`h-5 w-5 ${user.can_edit_data ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <Badge variant={user.can_edit_data ? 'primary' : 'default'} size="sm">
                    {user.can_edit_data ? 'Yes' : 'No'}
                  </Badge>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Account Status</span>
                    {user.is_active ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    ) : (
                      <NoSymbolIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <Badge variant={user.is_active ? 'success' : 'default'} size="sm">
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">User Role</span>
                    <UserCircleIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
                    {user.role_display || user.role}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Details */}
            <Card title="Account Details">
              <div className="divide-y divide-gray-200">
                <InfoRow 
                  label="Member Since" 
                  value={new Date(user.date_joined).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} 
                  icon={CalendarIcon}
                />
                <InfoRow 
                  label="Last Login" 
                  value={user.last_login 
                    ? new Date(user.last_login).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Never'
                  }
                  icon={ClockIcon}
                />
                <InfoRow 
                  label="Last Updated" 
                  value={new Date(user.updated_at || user.date_joined).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                  icon={CalendarIcon}
                />
              </div>
            </Card>

            {/* Quick Actions */}
            <Card title="Quick Actions">
              <div className="space-y-2">
                <Button
                  variant="outline"
                  icon={PencilIcon}
                  onClick={() => navigate(`/users/${id}/edit`)}
                  className="w-full justify-start"
                >
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  icon={user.is_active ? NoSymbolIcon : CheckCircleIcon}
                  onClick={handleToggleClick}
                  className={`w-full justify-start ${
                    user.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
                  }`}
                  isLoading={isUpdating}
                >
                  {user.is_active ? 'Deactivate Account' : 'Activate Account'}
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Toggle Status Modal */}
        <Modal
          isOpen={toggleModalOpen}
          onClose={() => !isUpdating && setToggleModalOpen(false)}
          title={user?.is_active ? 'Deactivate User' : 'Activate User'}
        >
          <div className="space-y-4">
            <div className={`border-l-4 p-4 ${
              user?.is_active 
                ? 'bg-yellow-50 border-yellow-400' 
                : 'bg-green-50 border-green-400'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {user?.is_active ? (
                    <NoSymbolIcon className="h-5 w-5 text-yellow-400" />
                  ) : (
                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm ${
                    user?.is_active ? 'text-yellow-700' : 'text-green-700'
                  }`}>
                    {user?.is_active
                      ? 'This will deactivate the user account. The user will not be able to log in, but their data will be preserved.'
                      : 'This will reactivate the user account. The user will be able to log in again.'}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-gray-600">
              Are you sure you want to {user?.is_active ? 'deactivate' : 'activate'}{' '}
              <span className="font-semibold text-gray-900">{user?.username}</span>?
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p className="font-medium text-gray-700">Debug Info:</p>
                <p className="text-gray-600">User ID: {user?.id}</p>
                <p className="text-gray-600">Current Status: {user?.is_active ? 'Active' : 'Inactive'}</p>
                <p className="text-gray-600">New Status: {!user?.is_active ? 'Active' : 'Inactive'}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setToggleModalOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                variant={user?.is_active ? 'danger' : 'primary'}
                icon={user?.is_active ? NoSymbolIcon : CheckCircleIcon}
                onClick={handleToggleConfirm}
                isLoading={isUpdating}
              >
                {user?.is_active ? 'Deactivate' : 'Activate'} User
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

export default UserDetailPage;