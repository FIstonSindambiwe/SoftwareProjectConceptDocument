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

    if (formData.new_password !== formData.new_password_confirm) {
      newErrors.new_password_confirm = 'Passwords do not match';
    }

    if (formData.old_password === formData.new_password) {
      newErrors.new_password = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    try {
      await changePassword({
        old_password: formData.old_password,
        new_password: formData.new_password,
      });

      setSuccessMessage('Password changed successfully!');
      
      // Clear form
      setFormData({
        old_password: '',
        new_password: '',
        new_password_confirm: '',
      });
      setPasswordStrength(null);

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (error) {
      console.error('Change password error:', error);
      
      if (typeof error === 'object') {
        setErrors(error);
      }
      setErrorMessage(parseApiError(error));
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
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            icon={ArrowLeftIcon}
            onClick={() => navigate('/profile')}
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
            <Alert type="success" message={successMessage} />
          )}
          
          {errorMessage && (
            <Alert type="error" message={errorMessage} onClose={() => setErrorMessage('')} />
          )}

          <Card>
            <div className="space-y-6">
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
              />

              <div className="pt-6 border-t border-gray-200">
                <Input
                  label="New Password"
                  name="new_password"
                  type="password"
                  value={formData.new_password}
                  onChange={handleChange}
                  error={errors.new_password}
                  icon={LockClosedIcon}
                  required
                  helperText="Minimum 8 characters, include uppercase, lowercase, and numbers"
                />

                {/* Password Strength Indicator */}
                {formData.new_password && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">Password Strength:</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength?.strength === 'strong' ? 'text-green-600' :
                        passwordStrength?.strength === 'medium' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {passwordStrength?.strength?.toUpperCase()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${getStrengthColor()}`}
                        style={{ width: getStrengthWidth() }}
                      ></div>
                    </div>
                    
                    {passwordStrength && !passwordStrength.isValid && (
                      <ul className="mt-2 text-xs text-red-600 space-y-1">
                        {passwordStrength.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
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
              />
            </div>
          </Card>

          {/* Security Tips */}
          <Card title="Password Security Tips">
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Use a unique password that you don't use for other accounts
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Include a mix of uppercase and lowercase letters, numbers, and symbols
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Avoid using personal information like birthdays or names
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Consider using a password manager to generate and store strong passwords
              </li>
            </ul>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/profile')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
            >
              Change Password
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default ChangePasswordPage;