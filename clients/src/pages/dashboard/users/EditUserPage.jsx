// src/pages/dashboard/users/EditUserPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Spinner from '../../../components/common/Spinner';
import useUsers from '../../../hooks/useUsers';

const EditUserPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoading, fetchUser, updateUser } = useUsers();
  
  const [formData, setFormData] = useState({
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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      const userData = await fetchUser(id);
      setFormData({
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
      toast.error('Failed to load user');
      navigate('/users');
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

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setIsSaving(true);
      await updateUser(id, formData);
      
      // Show success toast
      toast.success('User updated successfully!');
      
      // Navigate back to user detail page
      setTimeout(() => {
        navigate(`/users/${id}`);
      }, 1000);
      
    } catch (error) {
      console.error('Update user error:', error);
      
      // Handle field-level errors from backend
      if (error && typeof error === 'object') {
        const fieldErrors = {};
        let hasFieldErrors = false;
        let errorMessage = '';
        
        // Process each error field
        Object.keys(error).forEach(key => {
          // Skip non-field errors
          if (key === 'detail' || key === 'message' || key === 'non_field_errors') {
            return;
          }
          
          // Handle array of error messages (Django DRF format)
          if (Array.isArray(error[key])) {
            fieldErrors[key] = error[key][0];
            hasFieldErrors = true;
          } 
          // Handle string error messages
          else if (typeof error[key] === 'string') {
            fieldErrors[key] = error[key];
            hasFieldErrors = true;
          }
        });
        
        if (hasFieldErrors) {
          setErrors(fieldErrors);
        }
        
        // Determine error message for toast
        if (error.detail) {
          errorMessage = error.detail;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.non_field_errors) {
          errorMessage = Array.isArray(error.non_field_errors) 
            ? error.non_field_errors[0] 
            : error.non_field_errors;
        } else if (hasFieldErrors) {
          errorMessage = 'Please fix the errors in the form';
        } else {
          errorMessage = 'Failed to update user. Please try again.';
        }
        
        toast.error(errorMessage);
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
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
          <Card title="Account Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                  disabled={isSaving}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Note: Username cannot be changed
                </p>
              </div>
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
                disabled={isSaving}
              />

              <Input
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                error={errors.last_name}
                disabled={isSaving}
              />

              <Input
                label="Phone Number"
                name="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={handleChange}
                error={errors.phone_number}
                disabled={isSaving}
              />

              <Input
                label="Organization"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                error={errors.organization}
                disabled={isSaving}
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
                  disabled={isSaving}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Brief bio or description"
                />
                {errors.bio && (
                  <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
                )}
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
                  disabled={isSaving}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  disabled={isSaving}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
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
              disabled={isSaving}
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