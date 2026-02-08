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
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Spinner from '../../../components/common/Spinner';
import useUsers from '../../../hooks/useUsers';

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoading, fetchUser, patchUser } = useUsers();
  const [isUpdating, setIsUpdating] = useState(false);
  const [localUser, setLocalUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      await fetchUser(id);
    } catch (error) {
      console.error('Error loading user:', error);
      toast.error('Failed to load user');
    }
  };

  // Update local user when the fetched user changes
  useEffect(() => {
    if (user) {
      setLocalUser(user);
    }
  }, [user]);

  const handleToggleStatus = async () => {
    if (!localUser) return;

    setIsUpdating(true);
    try {
      const newStatus = !localUser.is_active;
      
      // Call patchUser directly
      const updatedUser = await patchUser(id, { is_active: newStatus });
      
      toast.success(
        `User "${localUser.username || 'User'}" has been ${newStatus ? 'activated' : 'deactivated'}`
      );
      
      // Update local state immediately with the response
      if (updatedUser) {
        setLocalUser(prev => ({
          ...prev,
          is_active: newStatus,
          ...updatedUser
        }));
      } else {
        // Fallback: just toggle the status
        setLocalUser(prev => ({
          ...prev,
          is_active: newStatus
        }));
      }
      
      // Reload user data from server after a short delay
      setTimeout(() => {
        loadUser();
      }, 500);
      
    } catch (error) {
      console.error('Toggle status error:', error);
      
      let errorMessage = 'Failed to update user status';
      
      if (error.response?.data) {
        if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
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
      setIsUpdating(false);
    }
  };

  if (isLoading && !localUser) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!localUser) {
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

  // Safe avatar display
  const getAvatarInitial = () => {
    if (localUser.username) {
      return localUser.username.charAt(0).toUpperCase();
    } else if (localUser.email) {
      return localUser.email.charAt(0).toUpperCase();
    } else if (localUser.first_name) {
      return localUser.first_name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    if (localUser.full_name) return localUser.full_name;
    if (localUser.first_name && localUser.last_name) {
      return `${localUser.first_name} ${localUser.last_name}`;
    }
    if (localUser.first_name) return localUser.first_name;
    if (localUser.username) return localUser.username;
    if (localUser.email) return localUser.email.split('@')[0];
    return 'Unknown User';
  };

  const getUsername = () => {
    if (localUser.username) return `@${localUser.username}`;
    if (localUser.email) return localUser.email;
    return '';
  };

  return (
    <Layout>
      <div className="space-y-6">
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
                  {localUser.avatar ? (
                    <img
                      src={localUser.avatar}
                      alt={getDisplayName()}
                      className="h-20 w-20 rounded-full ring-4 ring-blue-100"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ring-4 ring-blue-100 shadow-lg">
                      <span className="text-white font-bold text-2xl">
                        {getAvatarInitial()}
                      </span>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {getDisplayName()}
                    </h1>
                    {localUser.role && (
                      <Badge variant={getRoleBadgeVariant(localUser.role)}>
                        {localUser.role_display || localUser.role}
                      </Badge>
                    )}
                    <Badge variant={localUser.is_active ? 'success' : 'default'}>
                      {localUser.is_active ? '● Active' : '○ Inactive'}
                    </Badge>
                  </div>
                  {getUsername() && <p className="text-gray-600">{getUsername()}</p>}
                  {localUser.email && (
                    <p className="text-sm text-gray-500 mt-1">
                      <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                      {localUser.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button
                variant="primary"
                icon={PencilIcon}
                onClick={() => navigate(`/users/${id}/edit`)}
              >
                Edit User
              </Button>
              <Button
                variant={localUser.is_active ? 'danger' : 'success'}
                icon={localUser.is_active ? NoSymbolIcon : CheckCircleIcon}
                onClick={handleToggleStatus}
                isLoading={isUpdating}
              >
                {localUser.is_active ? 'Deactivate' : 'Activate'}
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
                <InfoRow label="First Name" value={localUser.first_name} />
                <InfoRow label="Last Name" value={localUser.last_name} />
                <InfoRow label="Email Address" value={localUser.email} icon={EnvelopeIcon} />
                <InfoRow label="Phone Number" value={localUser.phone_number} icon={PhoneIcon} />
                <InfoRow label="Organization" value={localUser.organization} icon={BuildingOfficeIcon} />
              </div>
              
              {localUser.bio && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Bio</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{localUser.bio}</p>
                </div>
              )}
            </Card>

            {/* Permissions & Access */}
            <Card title="Permissions & Access">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Admin Access</span>
                    <ShieldCheckIcon className={`h-5 w-5 ${localUser.role === 'admin' ? 'text-red-600' : 'text-gray-400'}`} />
                  </div>
                  <Badge variant={localUser.role === 'admin' ? 'danger' : 'default'} size="sm">
                    {localUser.role === 'admin' ? 'Yes' : 'No'}
                  </Badge>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Can Edit Data</span>
                    <PencilIcon className={`h-5 w-5 ${localUser.can_edit_data ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <Badge variant={localUser.can_edit_data ? 'primary' : 'default'} size="sm">
                    {localUser.can_edit_data ? 'Yes' : 'No'}
                  </Badge>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Account Status</span>
                    {localUser.is_active ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    ) : (
                      <NoSymbolIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <Badge variant={localUser.is_active ? 'success' : 'default'} size="sm">
                    {localUser.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">User Role</span>
                    <UserCircleIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <Badge variant={getRoleBadgeVariant(localUser.role)} size="sm">
                    {localUser.role_display || localUser.role || 'None'}
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
                  value={localUser.date_joined 
                    ? new Date(localUser.date_joined).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : '-'
                  } 
                  icon={CalendarIcon}
                />
                <InfoRow 
                  label="Last Login" 
                  value={localUser.last_login 
                    ? new Date(localUser.last_login).toLocaleString('en-US', {
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
                  value={localUser.updated_at || localUser.date_joined
                    ? new Date(localUser.updated_at || localUser.date_joined).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : '-'
                  }
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
                  icon={localUser.is_active ? NoSymbolIcon : CheckCircleIcon}
                  onClick={handleToggleStatus}
                  className={`w-full justify-start ${
                    localUser.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
                  }`}
                  isLoading={isUpdating}
                >
                  {localUser.is_active ? 'Deactivate Account' : 'Activate Account'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserDetailPage;