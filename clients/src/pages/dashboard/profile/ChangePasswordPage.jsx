// src/pages/dashboard/profile/ChangePasswordPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Alert from '../../../components/common/Alert';
import useUsers from '../../../hooks/useUsers';
import { validatePassword, parseApiError } from '../../../utils/helpers';

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { changePassword, isLoading } = useUsers();
  
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });
  
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setSuccessMessage('');
    setErrorMessage('');

    // Check password strength
    if (name === 'new_password') {
      const validation = validatePassword(value);
      setPasswordStrength(validation);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.old_password) {
      newErrors.old_password = 'Current password is required';
    }

    if (!formData.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters';
    }

    if (!formData.new_password_confirm) {
      newErrors.new_password_confirm = 'Please confirm your new password';
    } else if (formData.new_password !== formData.new_password_confirm) {
      newErrors.new_password_confirm = 'Passwords do not match';
    }

    if (formData.old_password && formData.new_password && 
        formData.old_password === formData.new_password) {
      newErrors.new_password = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    setErrors({});
    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      // FIXED: Send both new_password and new_password_confirm to API
      await changePassword({
        old_password: formData.old_password,
        new_password: formData.new_password,
        new_password_confirm: formData.new_password_confirm,
      });

      setSuccessMessage('Password changed successfully! You will be redirected shortly.');
      
      // Clear form
      setFormData({
        old_password: '',
        new_password: '',
        new_password_confirm: '',
      });
      setPasswordStrength(null);

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/profile');
      }, 3000);
    } catch (error) {
      console.error('Change password error:', error);
      
      // Handle API validation errors
      if (error && typeof error === 'object') {
        // Map API field errors to form errors
        const apiErrors = {};
        
        if (error.old_password) {
          apiErrors.old_password = Array.isArray(error.old_password) 
            ? error.old_password[0] 
            : error.old_password;
        }
        
        if (error.new_password) {
          apiErrors.new_password = Array.isArray(error.new_password) 
            ? error.new_password[0] 
            : error.new_password;
        }
        
        if (error.new_password_confirm) {
          apiErrors.new_password_confirm = Array.isArray(error.new_password_confirm) 
            ? error.new_password_confirm[0] 
            : error.new_password_confirm;
        }
        
        if (error.detail) {
          setErrorMessage(typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail));
        } else if (Object.keys(apiErrors).length > 0) {
          setErrors(apiErrors);
        } else {
          setErrorMessage(parseApiError(error));
        }
      } else {
        setErrorMessage(parseApiError(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStrengthColor = () => {
    if (!passwordStrength) return 'bg-gray-200';
    
    switch (passwordStrength.strength) {
      case 'strong':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'weak':
        return 'bg-red-500';
      default:
        return 'bg-gray-200';
    }
  };

  const getStrengthWidth = () => {
    if (!passwordStrength) return '0%';
    
    switch (passwordStrength.strength) {
      case 'strong':
        return '100%';
      case 'medium':
        return '66%';
      case 'weak':
        return '33%';
      default:
        return '0%';
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            icon={ArrowLeftIcon}
            onClick={() => navigate('/profile')}
            className="hover:bg-gray-100"
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
            <p className="text-gray-500 mt-1">Update your account password</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {successMessage && (
            <Alert 
              type="success" 
              message={successMessage}
              onClose={() => setSuccessMessage('')}
            />
          )}
          
          {errorMessage && (
            <Alert 
              type="error" 
              message={errorMessage} 
              onClose={() => setErrorMessage('')} 
            />
          )}

          <Card className="border border-gray-200 rounded-xl shadow-sm">
            <div className="space-y-6">
              <div className="pb-6 border-b border-gray-200">
                <Input
                  label="Current Password"
                  name="old_password"
                  type="password"
                  value={formData.old_password}
                  onChange={handleChange}
                  error={errors.old_password}
                  icon={LockClosedIcon}
                  required
                  autoFocus
                  placeholder="Enter your current password"
                />
              </div>

              <div className="space-y-6">
                <div>
                  <Input
                    label="New Password"
                    name="new_password"
                    type="password"
                    value={formData.new_password}
                    onChange={handleChange}
                    error={errors.new_password}
                    icon={LockClosedIcon}
                    required
                    placeholder="Enter your new password"
                    helperText="Minimum 8 characters, include uppercase, lowercase, and numbers"
                  />

                  {/* Password Strength Indicator */}
                  {formData.new_password && (
                    <div className="mt-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600">Password Strength:</span>
                        <span className={`text-xs font-medium ${
                          passwordStrength?.strength === 'strong' ? 'text-green-600' :
                          passwordStrength?.strength === 'medium' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {passwordStrength?.strength?.toUpperCase() || 'NONE'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                          style={{ width: getStrengthWidth() }}
                        ></div>
                      </div>
                      
                      {passwordStrength && !passwordStrength.isValid && passwordStrength.errors && (
                        <ul className="mt-2 text-xs text-red-600 space-y-1">
                          {passwordStrength.errors.map((error, index) => (
                            <li key={index} className="flex items-center">
                              <span className="mr-1">•</span> {error}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                <Input
                  label="Confirm New Password"
                  name="new_password_confirm"
                  type="password"
                  value={formData.new_password_confirm}
                  onChange={handleChange}
                  error={errors.new_password_confirm}
                  icon={LockClosedIcon}
                  required
                  placeholder="Re-enter your new password"
                />
              </div>
            </div>
          </Card>

          {/* Security Tips */}
          <Card 
            title="Password Security Tips" 
            className="border border-gray-200 rounded-xl shadow-sm"
          >
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start">
                <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-blue-600 text-xs">1</span>
                </div>
                <span>Use a unique password that you don't use for other accounts</span>
              </li>
              <li className="flex items-start">
                <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-blue-600 text-xs">2</span>
                </div>
                <span>Include a mix of uppercase and lowercase letters, numbers, and symbols</span>
              </li>
              <li className="flex items-start">
                <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-blue-600 text-xs">3</span>
                </div>
                <span>Avoid using personal information like birthdays or names</span>
              </li>
              <li className="flex items-start">
                <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-blue-600 text-xs">4</span>
                </div>
                <span>Consider using a password manager to generate and store strong passwords</span>
              </li>
            </ul>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="text-sm text-gray-500">
              <p>Make sure to remember your new password.</p>
            </div>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (formData.old_password || formData.new_password || formData.new_password_confirm) {
                    if (window.confirm('Are you sure? All unsaved changes will be lost.')) {
                      navigate('/profile');
                    }
                  } else {
                    navigate('/profile');
                  }
                }}
                disabled={isSubmitting || isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || isLoading}
                isLoading={isSubmitting || isLoading}
                className="min-w-[140px]"
              >
                {isSubmitting || isLoading ? 'Changing Password...' : 'Change Password'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default ChangePasswordPage;