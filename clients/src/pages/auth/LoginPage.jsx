// src/pages/auth/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import authService from '../../services/api/authService';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      await authService.login(formData.username, formData.password);
      toast.success('Login successful! Welcome back.');
      
      // Small delay to show toast before redirect
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle field-level errors
      if (error && typeof error === 'object') {
        const fieldErrors = {};
        let hasFieldErrors = false;
        let errorMessage = '';
        
        // Process username/password field errors
        if (error.username) {
          fieldErrors.username = Array.isArray(error.username) 
            ? error.username[0] 
            : error.username;
          hasFieldErrors = true;
        }
        
        if (error.password) {
          fieldErrors.password = Array.isArray(error.password) 
            ? error.password[0] 
            : error.password;
          hasFieldErrors = true;
        }
        
        if (hasFieldErrors) {
          setErrors(fieldErrors);
        }
        
        // Determine error message for toast
        if (error.detail) {
          errorMessage = error.detail;
        } else if (error.non_field_errors) {
          errorMessage = Array.isArray(error.non_field_errors) 
            ? error.non_field_errors[0] 
            : error.non_field_errors;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (!hasFieldErrors) {
          errorMessage = 'Login failed. Please check your credentials.';
        }
        
        // Only show toast if there's a general error message
        if (errorMessage) {
          toast.error(errorMessage);
        } else if (hasFieldErrors) {
          toast.error('Please fix the errors in the form');
        }
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Youth Impact Visualizer
          </h1>
          <p className="text-blue-100">
            Track, Measure, and Visualize Program Impact
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
              icon={EnvelopeIcon}
              required
              autoFocus
              placeholder="Enter your username"
              disabled={isLoading}
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              icon={LockClosedIcon}
              required
              placeholder="Enter your password"
              disabled={isLoading}
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <span className="ml-2 text-gray-600">Remember me</span>
              </label>
              <a 
                href="/forgot-password" 
                className="text-blue-600 hover:text-blue-500"
                tabIndex={isLoading ? -1 : 0}
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Don't have an account?{' '}
              <a 
                href="/contact" 
                className="text-blue-600 hover:text-blue-500 font-medium"
                tabIndex={isLoading ? -1 : 0}
              >
                Contact Administrator
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-white text-sm">
          <p>© 2024 Youth Impact Visualizer. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;