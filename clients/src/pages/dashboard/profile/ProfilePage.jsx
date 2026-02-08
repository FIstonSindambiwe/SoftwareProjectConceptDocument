// src/pages/dashboard/profile/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserCircleIcon, 
  KeyIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  PencilSquareIcon 
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Badge from '../../../components/common/Badge';
import Alert from '../../../components/common/Alert';
import LoadingSpinner from '../../../components/common/Spinner';
import useAuth from '../../../hooks/useAuth';
import useUsers from '../../../hooks/useUsers';
import { getUserRoleLabel, getRoleBadgeVariant, parseApiError } from '../../../utils/helpers';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user: authUser, updateUser: updateAuthUser } = useAuth();
  const { updateProfile, isLoading } = useUsers();
  
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

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

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setShowSuccessAnimation(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const trimmedValue = value.trim();
    setFormData(prev => ({ ...prev, [name]: trimmedValue }));
    
    // Clear errors for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setErrorMessage('');
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Phone validation (optional)
    if (formData.phone_number && !/^[\d\s\-\+\(\)]{10,}$/.test(formData.phone_number.replace(/\s/g, ''))) {
      newErrors.phone_number = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setErrors({});
    setSuccessMessage('');
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const updatedUser = await updateProfile(formData);
      updateAuthUser(updatedUser);
      
      // Show success animation
      setShowSuccessAnimation(true);
      setSuccessMessage('Profile updated successfully!');
      setLastUpdated(new Date());
      
      // Log success for debugging
      console.log('✅ Profile updated successfully:', updatedUser);
      
    } catch (error) {
      console.error('Profile update error:', error);
      
      if (typeof error === 'object' && error.detail) {
        // Handle API validation errors
        if (error.email) {
          setErrors(prev => ({ ...prev, email: error.email }));
        }
        if (error.phone_number) {
          setErrors(prev => ({ ...prev, phone_number: error.phone_number }));
        }
        if (error.non_field_errors) {
          setErrorMessage(error.non_field_errors.join(', '));
        } else if (error.detail) {
          setErrorMessage(error.detail);
        }
      } else {
        setErrorMessage(parseApiError(error));
      }
      
      // Show error animation
      setTimeout(() => {
        setErrorMessage('');
      }, 8000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFullName = () => {
    if (formData.first_name && formData.last_name) {
      return `${formData.first_name} ${formData.last_name}`;
    }
    return authUser?.username || '';
  };

  if (!authUser) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-12">
          <div className="text-center">
            <UserCircleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Profile...</h2>
            <p className="text-gray-500">Please wait while we load your profile information.</p>
            <div className="mt-6">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header with animated success */}
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600 mt-2">Manage your account information and preferences</p>
            </div>
            
            {showSuccessAnimation && (
              <div className="animate-bounce">
                <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200">
                  <CheckCircleSolid className="h-5 w-5" />
                  <span className="font-medium">Saved!</span>
                </div>
              </div>
            )}
          </div>
          
          {lastUpdated && (
            <div className="flex items-center text-sm text-gray-500 mt-2">
              <ClockIcon className="h-4 w-4 mr-1" />
              Last updated: {formatDate(lastUpdated)}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile Info Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Success/Error Messages */}
            {successMessage && (
              <Alert 
                type="success" 
                message={successMessage} 
                icon={CheckCircleIcon}
                onClose={() => setSuccessMessage('')}
                autoClose={true}
              />
            )}
            
            {errorMessage && (
              <Alert 
                type="error" 
                message={errorMessage} 
                icon={ExclamationCircleIcon}
                onClose={() => setErrorMessage('')}
                autoClose={false}
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Account Information Card */}
              <Card 
                title="Account Information" 
                icon={UserCircleIcon}
                className="border border-gray-200 rounded-xl shadow-sm"
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      error={errors.username}
                      disabled
                      helperText="Username cannot be changed after registration"
                      className="bg-gray-50"
                    />

                    <Input
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email}
                      required
                      placeholder="your.email@example.com"
                      helperText="We'll send important notifications to this email"
                    />
                  </div>
                </div>
              </Card>

              {/* Personal Information Card */}
              <Card 
                title="Personal Information" 
                icon={PencilSquareIcon}
                className="border border-gray-200 rounded-xl shadow-sm"
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="First Name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      error={errors.first_name}
                      placeholder="John"
                    />

                    <Input
                      label="Last Name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      error={errors.last_name}
                      placeholder="Doe"
                    />

                    <Input
                      label="Phone Number"
                      name="phone_number"
                      type="tel"
                      value={formData.phone_number}
                      onChange={handleChange}
                      error={errors.phone_number}
                      placeholder="+1 (555) 123-4567"
                      helperText="Include country code for international numbers"
                    />

                    <Input
                      label="Organization"
                      name="organization"
                      value={formData.organization}
                      onChange={handleChange}
                      error={errors.organization}
                      placeholder="Your company or institution"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                      <span className="text-gray-400 text-sm font-normal ml-1">(Optional)</span>
                    </label>
                    <textarea
                      name="bio"
                      rows={4}
                      value={formData.bio}
                      onChange={handleChange}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition duration-200"
                      placeholder="Tell us about yourself, your role, or your interests..."
                      maxLength={500}
                    />
                    <div className="flex justify-between mt-1">
                      <div>
                        {errors.bio && (
                          <p className="text-sm text-red-600">{errors.bio}</p>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {formData.bio.length}/500 characters
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Form Actions */}
              <div className="sticky bottom-6 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-lg">
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                  <div className="text-sm text-gray-500">
                    <p>Make sure all information is accurate before saving.</p>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (window.confirm('Are you sure? All unsaved changes will be lost.')) {
                          navigate('/dashboard');
                        }
                      }}
                      disabled={isSubmitting || isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isSubmitting || isLoading}
                      loadingText="Saving..."
                      icon={CheckCircleIcon}
                      className="min-w-[120px]"
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-6">
            {/* Profile Summary Card */}
            <Card className="border border-gray-200 rounded-xl shadow-sm">
              <div className="text-center">
                <div className="relative mx-auto h-32 w-32 mb-6">
                  <div className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <span className="text-4xl font-bold text-white">
                      {getFullName().charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-green-500 border-4 border-white flex items-center justify-center shadow-lg">
                    <CheckCircleSolid className="h-5 w-5 text-white" />
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900">
                  {getFullName()}
                </h3>
                <p className="text-gray-500 mt-1">{authUser?.email}</p>
                
                <div className="mt-4">
                  <Badge 
                    variant={getRoleBadgeVariant(authUser?.role)}
                    size="lg"
                    className="px-4 py-1.5"
                  >
                    {getUserRoleLabel(authUser?.role)}
                  </Badge>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    <p>Complete your profile to unlock all features</p>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(
                            (formData.first_name ? 20 : 0) +
                            (formData.last_name ? 20 : 0) +
                            (formData.email ? 20 : 0) +
                            (formData.phone_number ? 20 : 0) +
                            (formData.bio ? 20 : 0)
                          )}%` 
                        }}
                      ></div>
                    </div>
                    <p className="mt-1 text-xs">Profile completeness: {(
                      (formData.first_name ? 20 : 0) +
                      (formData.last_name ? 20 : 0) +
                      (formData.email ? 20 : 0) +
                      (formData.phone_number ? 20 : 0) +
                      (formData.bio ? 20 : 0)
                    )}%</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Actions Card */}
            <Card 
              title="Quick Actions" 
              className="border border-gray-200 rounded-xl shadow-sm"
            >
              <div className="space-y-3">
                <Button
                  variant="outline"
                  icon={KeyIcon}
                  onClick={() => navigate('/profile/change-password')}
                  className="w-full justify-start hover:bg-gray-50 transition-colors duration-200"
                  size="lg"
                >
                  <div className="text-left">
                    <div className="font-medium">Change Password</div>
                    <div className="text-sm text-gray-500">Update your password</div>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  icon={UserCircleIcon}
                  onClick={() => navigate('/users/audit-logs/my-activity')}
                  className="w-full justify-start hover:bg-gray-50 transition-colors duration-200"
                  size="lg"
                >
                  <div className="text-left">
                    <div className="font-medium">View Activity</div>
                    <div className="text-sm text-gray-500">Check your recent actions</div>
                  </div>
                </Button>
              </div>
            </Card>

            {/* Account Status Card */}
            <Card 
              title="Account Status" 
              className="border border-gray-200 rounded-xl shadow-sm"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-gray-600">Status</span>
                  </div>
                  <Badge 
                    variant={authUser?.is_active ? 'success' : 'default'} 
                    size="md"
                    className="px-3"
                  >
                    {authUser?.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Role</span>
                  <span className="font-medium text-gray-900">
                    {getUserRoleLabel(authUser?.role)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-medium text-gray-900">
                    {authUser?.date_joined ? new Date(authUser.date_joined).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Last Login</span>
                  <span className="font-medium text-gray-900">
                    {authUser?.last_login ? formatDate(authUser.last_login) : 'Never'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Help Section */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <h4 className="font-medium text-blue-900 mb-2">Need Help?</h4>
              <p className="text-sm text-blue-700 mb-3">
                Having trouble updating your profile?
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                onClick={() => alert('Contact support at: support@example.com')}
              >
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;