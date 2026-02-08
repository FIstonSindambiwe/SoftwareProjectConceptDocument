// src/pages/dashboard/profile/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircleIcon, KeyIcon } from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Badge from '../../../components/common/Badge';
import Alert from '../../../components/common/Alert';
import useAuth from '../../../hooks/useAuth';
import useUsers from '../../../hooks/useUsers';
import { getUserRoleLabel, getRoleBadgeVariant, parseApiError } from '../../../utils/helpers';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user: authUser, updateUser: updateAuthUser } = useAuth();
  const { updateProfile, isLoading } = useUsers(); // Fixed: using updateProfile instead of updateCurrentProfile
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    organization: '',
    bio: '',
  });
  
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (authUser) {
      setFormData({
        username: authUser.username || '',
        email: authUser.email || '',
        first_name: authUser.first_name || '',
        last_name: authUser.last_name || '',
        phone_number: authUser.phone_number || '',
        organization: authUser.organization || '',
        bio: authUser.bio || '',
      });
    }
  }, [authUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const updatedUser = await updateProfile(formData); // Fixed: using updateProfile
      updateAuthUser(updatedUser);
      setSuccessMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      
      if (typeof error === 'object') {
        setErrors(error);
      }
      setErrorMessage(parseApiError(error));
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your account information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {successMessage && (
                <Alert type="success" message={successMessage} onClose={() => setSuccessMessage('')} />
              )}
              
              {errorMessage && (
                <Alert type="error" message={errorMessage} onClose={() => setErrorMessage('')} />
              )}

              <Card title="Account Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    error={errors.username}
                    disabled
                    helperText="Username cannot be changed"
                  />

                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    required
                  />
                </div>
              </Card>

              <Card title="Personal Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="First Name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    error={errors.first_name}
                  />

                  <Input
                    label="Last Name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    error={errors.last_name}
                  />

                  <Input
                    label="Phone Number"
                    name="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={handleChange}
                    error={errors.phone_number}
                  />

                  <Input
                    label="Organization"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    error={errors.organization}
                  />

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      rows={4}
                      value={formData.bio}
                      onChange={handleChange}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Tell us about yourself..."
                    />
                    {errors.bio && (
                      <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
                    )}
                  </div>
                </div>
              </Card>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Summary */}
            <Card>
              <div className="text-center">
                <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center mb-4">
                  <span className="text-3xl font-bold text-white">
                    {authUser?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  {authUser?.username}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{authUser?.email}</p>
                <div className="mt-3">
                  <Badge variant={getRoleBadgeVariant(authUser?.role)}>
                    {getUserRoleLabel(authUser?.role)}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card title="Quick Actions">
              <div className="space-y-2">
                <Button
                  variant="outline"
                  icon={KeyIcon}
                  onClick={() => navigate('/profile/change-password')}
                  className="w-full justify-start"
                >
                  Change Password
                </Button>
                <Button
                  variant="outline"
                  icon={UserCircleIcon}
                  onClick={() => navigate('/users/audit-logs/my-activity')}
                  className="w-full justify-start"
                >
                  View Activity
                </Button>
              </div>
            </Card>

            {/* Account Status */}
            <Card title="Account Status">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <Badge variant={authUser?.is_active ? 'success' : 'default'} size="sm">
                    {authUser?.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Role</span>
                  <span className="font-medium text-gray-900">
                    {getUserRoleLabel(authUser?.role)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-medium text-gray-900">
                    {authUser?.date_joined ? new Date(authUser.date_joined).toLocaleDateString() : '-'}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;