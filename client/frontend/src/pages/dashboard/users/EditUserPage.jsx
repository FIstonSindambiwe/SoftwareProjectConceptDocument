// src/pages/dashboard/users/EditUserPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Alert from '../../../components/common/Alert';
import Spinner from '../../../components/common/Spinner';
import useUsers from '../../../hooks/useUsers';
import { parseApiError } from '../../../utils/helpers';

const EditUserPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoading, fetchUser, updateUser } = useUsers();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'donor',
    phone_number: '',
    organization: '',
    bio: '',
    is_active: true,
  });
  
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      const userData = await fetchUser(id);
      setFormData({
        username: userData.username || '',
        email: userData.email || '',
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        role: userData.role || 'donor',
        phone_number: userData.phone_number || '',
        organization: userData.organization || '',
        bio: userData.bio || '',
        is_active: userData.is_active ?? true,
      });
    } catch (error) {
      console.error('Error loading user:', error);
      setGeneralError('Failed to load user');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear field error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      await updateUser(id, formData);
      navigate(`/users/${id}`);
    } catch (error) {
      console.error('Update user error:', error);
      
      if (typeof error === 'object') {
        setErrors(error);
      }
      setGeneralError(parseApiError(error));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !user) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            icon={ArrowLeftIcon}
            onClick={() => navigate(`/users/${id}`)}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
            <p className="text-gray-500">Update user information and permissions</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {generalError && (
            <Alert type="error" message={generalError} onClose={() => setGeneralError('')} />
          )}

          <Card title="Account Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                error={errors.username}
                required
                helperText="Unique username for login"
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
                  rows={3}
                  value={formData.bio}
                  onChange={handleChange}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Brief bio or description"
                />
              </div>
            </div>
          </Card>

          <Card title="Role & Permissions">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="admin">Admin - Full system access</option>
                  <option value="teacher">Teacher - Can manage attendance & assessments</option>
                  <option value="program_manager">Program Manager - Can manage programs</option>
                  <option value="donor">Donor - Read-only access to reports</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Account is active (user can login)
                </label>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/users/${id}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditUserPage;