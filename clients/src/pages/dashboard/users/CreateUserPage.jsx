// src/pages/dashboard/users/CreateUserPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  InformationCircleIcon, 
  EyeIcon, 
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  EnvelopeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import useUsers from '../../../hooks/useUsers';

// Password Strength Indicator Component
const PasswordStrengthIndicator = ({ password }) => {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        {strength.requirements.map((req, index) => (
          <div key={index} className="flex items-center text-xs">
            {req.met ? (
              <CheckCircleIcon className="h-3 w-3 text-green-500 mr-1.5" />
            ) : (
              <XCircleIcon className="h-3 w-3 text-gray-400 mr-1.5" />
            )}
            <span className={req.met ? 'text-gray-600' : 'text-gray-400'}>
              {req.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Role Badge Component
const RoleBadge = ({ role, selected, onSelect }) => {
  const roleConfig = {
    admin: { color: 'indigo', label: 'Admin', description: 'Full system access', icon: '👑' },
    teacher: { color: 'green', label: 'Teacher', description: 'Manage attendance & assessments', icon: '📚' },
    program_manager: { color: 'amber', label: 'Program Manager', description: 'Manage programs & enrollments', icon: '📊' },
    donor: { color: 'pink', label: 'Donor', description: 'Read-only access to reports', icon: '❤️' }
  };

  const config = roleConfig[role];
  const color = config.color;
  
  const selectedClasses = {
    indigo: 'border-indigo-500 ring-2 ring-indigo-500 bg-indigo-50',
    green: 'border-green-500 ring-2 ring-green-500 bg-green-50',
    amber: 'border-amber-500 ring-2 ring-amber-500 bg-amber-50',
    pink: 'border-pink-500 ring-2 ring-pink-500 bg-pink-50'
  };
  
  const defaultClasses = {
    indigo: 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50',
    green: 'border-gray-200 hover:border-green-300 hover:bg-green-50',
    amber: 'border-gray-200 hover:border-amber-300 hover:bg-amber-50',
    pink: 'border-gray-200 hover:border-pink-300 hover:bg-pink-50'
  };

  return (
    <div
      onClick={() => onSelect(role)}
      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
        selected ? selectedClasses[color] : defaultClasses[color]
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{config.icon}</span>
          <div>
            <p className={`font-semibold ${selected ? `text-${color}-700` : 'text-gray-700'}`}>
              {config.label}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{config.description}</p>
          </div>
        </div>
        {selected && (
          <CheckCircleIcon className={`h-5 w-5 text-${color}-500`} />
        )}
      </div>
    </div>
  );
};

// Email Status Alert Component
const EmailStatusAlert = ({ emailSent, tempPassword }) => {
  if (emailSent === undefined) return null;
  
  if (emailSent === true) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
        <div className="flex items-start">
          <EnvelopeIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-green-700">
            <p className="font-medium">✓ Welcome email sent successfully!</p>
            <p className="mt-1">Login credentials have been sent to the user's email address.</p>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-yellow-700">
            <p className="font-medium">⚠️ Email delivery issue</p>
            <p className="mt-1">
              The welcome email could not be sent. Please check email configuration.
              {tempPassword && (
                <span className="block mt-2 font-mono text-xs bg-yellow-100 p-2 rounded">
                  Temporary password (development only): <strong>{tempPassword}</strong>
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }
};

const CreateUserPage = () => {
  const navigate = useNavigate();
  const { createUser, isLoading } = useUsers();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '', // Optional - will be auto-generated if empty
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [useCustomPassword, setUseCustomPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(null);
  const [tempPassword, setTempPassword] = useState(null);

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
    
    // Reset email status when form changes
    setEmailSent(null);
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password validation - only if user chose to use custom password
    if (useCustomPassword) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/[A-Z]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one uppercase letter';
      } else if (!/[a-z]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one lowercase letter';
      } else if (!/[0-9]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one number';
      } else if (!/[!@#$%^&*]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one special character (!@#$%^&*)';
      }
      
      // Password confirmation validation
      if (!formData.password_confirm) {
        newErrors.password_confirm = 'Please confirm your password';
      } else if (formData.password !== formData.password_confirm) {
        newErrors.password_confirm = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      // Prepare user data for API
      const userData = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        phone_number: formData.phone_number,
        organization: formData.organization,
        bio: formData.bio,
        is_active: formData.is_active,
      };
      
      // Only include password fields if using custom password
      if (useCustomPassword && formData.password) {
        userData.password = formData.password;
        userData.password_confirm = formData.password_confirm;
      }
      
      console.log('Sending user data to backend:', {
        ...userData,
        password: userData.password ? '***' : 'auto-generated',
        password_confirm: userData.password_confirm ? '***' : undefined
      });
      
      const newUser = await createUser(userData);
      console.log('User created successfully:', newUser);
      
      // Store email status from response
      setEmailSent(newUser.email_sent);
      if (newUser.temp_password) {
        setTempPassword(newUser.temp_password);
      }
      
      // Show appropriate success message
      if (newUser.email_sent === true) {
        toast.success(
          'User created successfully! A welcome email with login credentials has been sent.',
          { duration: 6000 }
        );
      } else if (newUser.email_sent === false) {
        toast.warning(
          'User created but welcome email could not be sent. Please check email configuration.',
          { duration: 8000 }
        );
        if (newUser.temp_password) {
          toast.info(
            `Development mode - Temporary password: ${newUser.temp_password}`,
            { duration: 10000 }
          );
        }
      } else {
        toast.success('User created successfully!');
      }
      
      // Redirect after delay
      setTimeout(() => {
        if (newUser && newUser.id) {
          navigate(`/dashboard/users/${newUser.id}`);
        } else {
          navigate('/dashboard/users');
        }
      }, 3000);
      
    } catch (error) {
      console.error('Create user error details:', error);
      
      // Better error handling
      if (error && typeof error === 'object') {
        const fieldErrors = {};
        let errorMessage = '';
        
        // Check for specific field errors
        if (error.username) {
          fieldErrors.username = Array.isArray(error.username) ? error.username[0] : error.username;
        }
        if (error.email) {
          fieldErrors.email = Array.isArray(error.email) ? error.email[0] : error.email;
        }
        if (error.password) {
          fieldErrors.password = Array.isArray(error.password) ? error.password[0] : error.password;
        }
        if (error.password_confirm) {
          fieldErrors.password_confirm = Array.isArray(error.password_confirm) ? error.password_confirm[0] : error.password_confirm;
        }
        if (error.role) {
          fieldErrors.role = Array.isArray(error.role) ? error.role[0] : error.role;
        }
        
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
          errorMessage = 'Please fix the errors in the form';
        } else if (error.detail) {
          errorMessage = error.detail;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.non_field_errors) {
          errorMessage = Array.isArray(error.non_field_errors) 
            ? error.non_field_errors[0] 
            : error.non_field_errors;
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
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            icon={ArrowLeftIcon}
            onClick={() => navigate('/dashboard/users')}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
            <p className="text-gray-500">Add a new user to the system with appropriate permissions</p>
          </div>
        </div>

        {/* Auto-Generate Password Info Alert */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start">
            <SparklesIcon className="h-5 w-5 text-purple-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-purple-700">
              <p className="font-medium mb-1">✨ Automatic Password Generation</p>
              <p>
                You can leave the password fields empty. A secure random password will be generated 
                automatically and sent to the user's email. The user will be required to change their 
                password on first login for security.
              </p>
            </div>
          </div>
        </div>

        {/* Toggle for custom password */}
        <div className="flex items-center justify-end">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={useCustomPassword}
              onChange={(e) => {
                setUseCustomPassword(e.target.checked);
                if (!e.target.checked) {
                  setFormData(prev => ({ ...prev, password: '', password_confirm: '' }));
                }
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">
              Use custom password (optional)
            </span>
          </label>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Personal Information Card */}
          <Card title="Personal Information" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                helperText="Optional"
              />

              <Input
                label="Organization"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                error={errors.organization}
                disabled={isLoading}
                helperText="Optional"
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
                  placeholder="Brief bio or description (optional)"
                />
                {errors.bio && (
                  <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Account Information Card */}
          <Card title="Account Information">
            <div className="space-y-5">
              <Input
                label="Username *"
                name="username"
                value={formData.username}
                onChange={handleChange}
                onBlur={() => handleBlur('username')}
                error={touched.username && errors.username}
                required
                helperText="Unique username for login (letters, numbers, underscores only)"
                disabled={isLoading}
              />

              <Input
                label="Email *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleBlur('email')}
                error={touched.email && errors.email}
                required
                helperText="Login credentials will be sent to this email"
                disabled={isLoading}
              />

              {useCustomPassword && (
                <>
                  <div>
                    <div className="relative">
                      <Input
                        label="Password *"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={() => handleBlur('password')}
                        error={touched.password && errors.password}
                        required
                        helperText="Must be at least 8 characters with uppercase, lowercase, numbers, and special characters"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                    <PasswordStrengthIndicator password={formData.password} />
                  </div>

                  <div className="relative">
                    <Input
                      label="Confirm Password *"
                      name="password_confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.password_confirm}
                      onChange={handleChange}
                      onBlur={() => handleBlur('password_confirm')}
                      error={touched.password_confirm && errors.password_confirm}
                      required
                      helperText="Confirm your password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </>
              )}

              {!useCustomPassword && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="h-5 w-5 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      A secure random password will be generated automatically.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          
          
          {/* Role Selection Card */}
          <Card title="Role & Permissions" className="mt-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  User Role *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <RoleBadge
                    role="admin"
                    selected={formData.role === 'admin'}
                    onSelect={(role) => setFormData(prev => ({ ...prev, role }))}
                  />
                  <RoleBadge
                    role="teacher"
                    selected={formData.role === 'teacher'}
                    onSelect={(role) => setFormData(prev => ({ ...prev, role }))}
                  />
                  <RoleBadge
                    role="program_manager"
                    selected={formData.role === 'program_manager'}
                    onSelect={(role) => setFormData(prev => ({ ...prev, role }))}
                  />
                  <RoleBadge
                    role="donor"
                    selected={formData.role === 'donor'}
                    onSelect={(role) => setFormData(prev => ({ ...prev, role }))}
                  />
                </div>
                {errors.role && (
                  <p className="mt-2 text-sm text-red-600">{errors.role}</p>
                )}
              </div>

              <div className="flex items-center pt-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Account is active (user can login immediately)
                </label>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> The user will receive an email with their login credentials 
                  and will be required to change their password on first login for security purposes.
                </p>
              </div>
            </div>
          </Card>

          {/* Email Status Alert */}
          <EmailStatusAlert emailSent={emailSent} tempPassword={tempPassword} />

          {/* Actions */}
          <div className="flex justify-end space-x-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard/users')}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Creating User...' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateUserPage;