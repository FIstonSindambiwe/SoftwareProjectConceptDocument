// src/pages/auth/ChangePasswordPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiEye, FiEyeOff, FiLock, FiShield, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Button from '../../components/common/Button';
import authService from '../../services/api/authService';
import useAuth from '../../hooks/useAuth';
import logoImage from '../../assets/images/l-o-g-o.png';

// Password Strength Indicator Component
const PasswordStrength = ({ password }) => {
  const [strength, setStrength] = useState({
    score: 0,
    label: 'Weak',
    color: 'bg-red-500',
    textColor: 'text-red-600',
    requirements: []
  });

  useEffect(() => {
    if (!password) {
      setStrength({
        score: 0,
        label: 'Weak',
        color: 'bg-red-500',
        textColor: 'text-red-600',
        requirements: [
          { met: false, text: 'At least 8 characters' },
          { met: false, text: 'Contains uppercase letter' },
          { met: false, text: 'Contains lowercase letter' },
          { met: false, text: 'Contains number' },
          { met: false, text: 'Contains special character (!@#$%^&*)' }
        ]
      });
      return;
    }

    const requirements = [
      { met: password.length >= 8, text: 'At least 8 characters' },
      { met: /[A-Z]/.test(password), text: 'Contains uppercase letter' },
      { met: /[a-z]/.test(password), text: 'Contains lowercase letter' },
      { met: /[0-9]/.test(password), text: 'Contains number' },
      { met: /[!@#$%^&*]/.test(password), text: 'Contains special character (!@#$%^&*)' }
    ];

    const metCount = requirements.filter(r => r.met).length;
    
    let score, label, color, textColor;
    if (metCount <= 2) {
      score = 1;
      label = 'Weak';
      color = 'bg-red-500';
      textColor = 'text-red-600';
    } else if (metCount <= 3) {
      score = 2;
      label = 'Fair';
      color = 'bg-yellow-500';
      textColor = 'text-yellow-600';
    } else if (metCount <= 4) {
      score = 3;
      label = 'Good';
      color = 'bg-blue-500';
      textColor = 'text-blue-600';
    } else {
      score = 4;
      label = 'Strong';
      color = 'bg-green-500';
      textColor = 'text-green-600';
    }

    setStrength({
      score,
      label,
      color,
      textColor,
      requirements
    });
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">Password Strength:</span>
        <span className={`text-xs font-semibold ${strength.textColor}`}>
          {strength.label}
        </span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              level <= strength.score ? strength.color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
        {strength.requirements.map((req, index) => (
          <div key={index} className="flex items-center text-xs">
            <span className={`mr-2 ${req.met ? 'text-green-500' : 'text-gray-400'}`}>
              {req.met ? '✓' : '○'}
            </span>
            <span className={req.met ? 'text-gray-600' : 'text-gray-400'}>
              {req.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { changePassword, user, refreshAuthState } = useAuth();
  
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    newPasswordConfirm: '',
  });
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Get username from location state or from user context
  const username = location.state?.username || user?.username;
  const fromLogin = location.state?.fromLogin || false;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.oldPassword) {
      newErrors.oldPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (formData.newPassword === formData.oldPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    } else {
      // Check password strength
      const hasUppercase = /[A-Z]/.test(formData.newPassword);
      const hasLowercase = /[a-z]/.test(formData.newPassword);
      const hasNumber = /[0-9]/.test(formData.newPassword);
      const hasSpecial = /[!@#$%^&*]/.test(formData.newPassword);
      
      if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
        newErrors.newPassword = 'Password must contain uppercase, lowercase, number, and special character';
      }
    }

    if (!formData.newPasswordConfirm) {
      newErrors.newPasswordConfirm = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.newPasswordConfirm) {
      newErrors.newPasswordConfirm = 'Passwords do not match';
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

    setIsLoading(true);

    try {
      const result = await changePassword(
        formData.oldPassword,
        formData.newPassword,
        formData.newPasswordConfirm
      );

      if (result.success) {
        setSuccess(true);
        toast.success('Password changed successfully!');
        
        // Refresh auth state to update mustChangePassword flag
        refreshAuthState();
        
        // Redirect after delay
        setTimeout(() => {
          if (fromLogin) {
            navigate('/dashboard');
          } else {
            navigate('/dashboard/profile');
          }
        }, 2000);
      } else {
        toast.error(result.error || 'Failed to change password');
        
        // Handle specific errors
        if (result.error?.toLowerCase().includes('current password')) {
          setErrors({ oldPassword: result.error });
        }
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src={logoImage} 
              alt="Youth Impact Visualizer Logo" 
              className="w-32 h-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
          <p className="text-gray-600 text-sm mt-1">
            {username && `Welcome, ${username}!`} Please set your new password
          </p>
        </div>

        {/* Success Message */}
        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <FiShield className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Password Changed Successfully!
            </h3>
            <p className="text-green-600 text-sm mb-4">
              Your password has been updated. Redirecting to dashboard...
            </p>
            <div className="animate-pulse">
              <div className="h-1 bg-green-500 rounded-full w-32 mx-auto"></div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8">
            {/* Info Banner */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <FiAlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Security Requirement</p>
                  <p>
                    For security purposes, you are required to change your password 
                    on first login. Please create a strong password that you haven't 
                    used before.
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    name="oldPassword"
                    value={formData.oldPassword}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-10 py-3 border ${
                      errors.oldPassword ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                    } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 placeholder-gray-400 text-sm`}
                    placeholder="Enter your current password"
                    required
                    autoFocus
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    {showOldPassword ? (
                      <FiEyeOff className="h-4 w-4" />
                    ) : (
                      <FiEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.oldPassword && (
                  <p className="mt-1 text-xs text-red-600">{errors.oldPassword}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiShield className="h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-10 py-3 border ${
                      errors.newPassword ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                    } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 placeholder-gray-400 text-sm`}
                    placeholder="Enter your new password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    {showNewPassword ? (
                      <FiEyeOff className="h-4 w-4" />
                    ) : (
                      <FiEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-xs text-red-600">{errors.newPassword}</p>
                )}
                <PasswordStrength password={formData.newPassword} />
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="newPasswordConfirm"
                    value={formData.newPasswordConfirm}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-10 py-3 border ${
                      errors.newPasswordConfirm ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                    } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 placeholder-gray-400 text-sm`}
                    placeholder="Confirm your new password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff className="h-4 w-4" />
                    ) : (
                      <FiEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.newPasswordConfirm && (
                  <p className="mt-1 text-xs text-red-600">{errors.newPasswordConfirm}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                disabled={isLoading}
                className="!py-3.5 mt-6"
              >
                {isLoading ? 'Changing Password...' : 'Change Password'}
              </Button>
            </form>

            {/* Help Text */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Your password must be at least 8 characters and include:
                uppercase letters, lowercase letters, numbers, and special characters.
              </p>
            </div>

            {/* Link to Dashboard (if already authenticated) */}
            {!fromLogin && (
              <div className="mt-4 text-center">
                <Link
                  to="/dashboard"
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  ← Back to Dashboard
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordPage;