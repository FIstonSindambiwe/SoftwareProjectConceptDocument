// src/pages/dashboard/users/CreateUserPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import useUsers from '../../../hooks/useUsers';

const CreateUserPage = () => {
  const navigate = useNavigate();
  const { createUser, isLoading } = useUsers();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    role: 'donor',
    phone_number: '',
    organization: '',
    bio: '',
    is_active: true,
  });
  
  const [errors, setErrors] = useState({});

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
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Passwords do not match';
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
      const newUser = await createUser(formData);
      console.log('User created successfully:', newUser);
      
      // Show success toast
      toast.success('User created successfully!');
      
      // Navigate to user detail or users list
      setTimeout(() => {
        if (newUser && newUser.id) {
          navigate(`/users/${newUser.id}`);
        } else {
          navigate('/users');
        }
      }, 1000);
      
    } catch (error) {
      console.error('Create user error:', error);
      
      // Handle field-level errors from backend
      if (error && typeof error === 'object') {
        const fieldErrors = {};
        let hasFieldErrors = false;
        let errorMessage = '';
        
        // Process each error field
        Object.keys(error).forEach(key => {
          // Skip non-field errors for now
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
          errorMessage = 'Failed to create user. Please try again.';
        }
        
        toast.error(errorMessage);
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            icon={ArrowLeftIcon}
            onClick={() => navigate('/users')}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create User</h1>
            <p className="text-gray-500">Add a new user to the system</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
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
                disabled={isLoading}
              />

              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
                disabled={isLoading}
              />

              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
                helperText="Minimum 8 characters"
                disabled={isLoading}
              />

              <Input
                label="Confirm Password"
                name="password_confirm"
                type="password"
                value={formData.password_confirm}
                onChange={handleChange}
                error={errors.password_confirm}
                required
                disabled={isLoading}
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
                disabled={isLoading}
              />

              <Input
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                error={errors.last_name}
                disabled={isLoading}
              />

              <Input
                label="Phone Number"
                name="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={handleChange}
                error={errors.phone_number}
                disabled={isLoading}
              />

              <Input
                label="Organization"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                error={errors.organization}
                disabled={isLoading}
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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
              onClick={() => navigate('/users')}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
            >
              Create User
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateUserPage;