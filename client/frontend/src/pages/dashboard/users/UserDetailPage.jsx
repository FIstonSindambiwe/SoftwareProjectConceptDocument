// src/pages/dashboard/users/UserDetailPage.jsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Spinner from '../../../components/common/Spinner';
import Alert from '../../../components/common/Alert';
import useUsers from '../../../hooks/useUsers';
import useAuth from '../../../hooks/useAuth';
import { 
  formatDate, 
  formatDateTime, 
  getUserRoleLabel, 
  getRoleBadgeVariant 
} from '../../../utils/helpers';

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canManageUsers } = useAuth();
  const { user, isLoading, fetchUser, deleteUser } = useUsers();

  useEffect(() => {
    fetchUser(id);
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to deactivate ${user.username}?`)) {
      return;
    }

    try {
      await deleteUser(id);
      navigate('/users');
    } catch (error) {
      console.error('Delete user error:', error);
      alert('Failed to deactivate user');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <Alert type="error" message="User not found" />
      </Layout>
    );
  }

  const InfoRow = ({ label, value, icon: Icon }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {Icon ? (
        <div className="mt-1 flex items-center text-sm text-gray-900">
          <Icon className="h-4 w-4 mr-2 text-gray-400" />
          {value || '-'}
        </div>
      ) : (
        <p className="mt-1 text-sm text-gray-900">{value || '-'}</p>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              icon={ArrowLeftIcon}
              onClick={() => navigate('/users')}
            >
              Back
            </Button>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {getUserRoleLabel(user.role)}
                </Badge>
                <Badge variant={user.is_active ? 'success' : 'default'}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-gray-500 mt-1">{user.email}</p>
            </div>
          </div>

          {canManageUsers() && (
            <div className="flex space-x-2">
              <Button
                variant="primary"
                icon={PencilIcon}
                onClick={() => navigate(`/users/${id}/edit`)}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                icon={TrashIcon}
                onClick={handleDelete}
              >
                Deactivate
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card title="Personal Information">
              <div className="grid grid-cols-2 gap-6">
                <InfoRow label="First Name" value={user.first_name} />
                <InfoRow label="Last Name" value={user.last_name} />
                <InfoRow label="Email" value={user.email} icon={EnvelopeIcon} />
                <InfoRow label="Phone" value={user.phone_number} icon={PhoneIcon} />
                <InfoRow label="Organization" value={user.organization} icon={BuildingOfficeIcon} />
              </div>
              
              {user.bio && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <p className="text-sm text-gray-900">{user.bio}</p>
                </div>
              )}
            </Card>

            {/* Recent Activity */}
            <Card title="Recent Activity">
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No recent activity</p>
                <p className="text-sm mt-2">Activity logs will appear here</p>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Details */}
            <Card title="Account Details">
              <div className="space-y-4">
                <InfoRow 
                  label="Member Since" 
                  value={formatDate(user.date_joined)} 
                  icon={CalendarIcon}
                />
                <InfoRow 
                  label="Last Login" 
                  value={user.last_login ? formatDateTime(user.last_login) : 'Never'}
                />
                <InfoRow 
                  label="Last Login IP" 
                  value={user.last_login_ip}
                />
                <InfoRow 
                  label="Updated" 
                  value={formatDateTime(user.updated_at)}
                />
              </div>
            </Card>

            {/* Permissions */}
            <Card title="Permissions">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Can Edit Data</span>
                  <Badge variant={user.can_edit_data ? 'success' : 'default'} size="sm">
                    {user.can_edit_data ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Is Admin</span>
                  <Badge variant={user.role === 'admin' ? 'danger' : 'default'} size="sm">
                    {user.role === 'admin' ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Is Active</span>
                  <Badge variant={user.is_active ? 'success' : 'default'} size="sm">
                    {user.is_active ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Statistics */}
            <Card title="Statistics">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Total Logins</span>
                  <span className="text-sm font-medium text-gray-900">-</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Actions Today</span>
                  <span className="text-sm font-medium text-gray-900">-</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Sessions This Week</span>
                  <span className="text-sm font-medium text-gray-900">-</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserDetailPage;