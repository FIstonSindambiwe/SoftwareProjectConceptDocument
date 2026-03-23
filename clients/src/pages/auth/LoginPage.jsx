// src/pages/auth/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { EnvelopeIcon, LockClosedIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Button from '../../components/common/Button';
import authService from '../../services/api/authService';
import youthImage from '../../assets/images/background.jpeg';
import logoImage from '../../assets/images/l-o-g-o.png';

// Typewriter Text Component
const TypewriterText = ({ text, delay = 50, className = '' }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, delay]);

  return (
    <span className={className}>
      {displayedText}
      {currentIndex < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
};

// Feature Item Component
const FeatureItem = ({ icon: Icon, text }) => {
  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 mt-1">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-white text-base leading-relaxed">{text}</p>
    </div>
  );
};

// Animation Styles
const animationStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .animate-fade-in-up {
    animation: fadeInUp 1s ease-out forwards;
  }

  .animate-slide-in-left {
    animation: slideInLeft 0.8s ease-out forwards;
  }

  .animate-slide-in-right {
    animation: slideInRight 0.8s ease-out forwards;
  }

  .animation-delay-200 {
    animation-delay: 0.2s;
    opacity: 0;
  }

  .animation-delay-400 {
    animation-delay: 0.4s;
    opacity: 0;
  }

  .animation-delay-600 {
    animation-delay: 0.6s;
    opacity: 0;
  }

  .animation-delay-800 {
    animation-delay: 0.8s;
    opacity: 0;
  }

  .animation-delay-1000 {
    animation-delay: 1s;
    opacity: 0;
  }
`;

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
      const result = await authService.login(formData.username, formData.password);
      
      toast.success('Login successful! Welcome back.');
      
      // Check if user needs to change password
      if (result.mustChangePassword) {
        // Small delay to show toast before redirect
        setTimeout(() => {
          navigate('/change-password', { 
            state: { 
              username: formData.username,
              fromLogin: true 
            } 
          });
        }, 500);
      } else {
        // Small delay to show toast before redirect
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      }
      
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
    <>
      <style>{animationStyles}</style>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="w-full max-w-6xl flex bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[600px] max-h-[700px]">
          
          {/* Left Side - Youth Impact Visualizer (Brand/Features) */}
          <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
            {/* Background Image - Pure/Clear */}
            <div className="absolute inset-0">
              <img 
                src={youthImage} 
                alt="Youth Impact Visualizer" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content with text shadow for readability */}
            <div className="relative z-10 flex flex-col justify-center px-16 text-white">
              {/* Brand Name */}
              <div className="mb-12 animate-slide-in-left">
              </div>

              {/* Tagline */}
              <div className="mb-12">
                <h2 className="text-4xl font-bold mb-4 leading-tight" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                  <TypewriterText 
                    text="Track, Measure, and Visualize Program Impact" 
                    delay={80}
                  />
                </h2>
                <p className="text-white text-lg leading-relaxed animate-fade-in-up animation-delay-200" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>
                  Comprehensive youth program management platform designed 
                  to track participant progress and measure meaningful outcomes.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>
                <div className="animate-fade-in-up animation-delay-400">
                  <FeatureItem 
                    icon={CheckCircleIcon}
                    text="Real-time Attendance Tracking with Face Recognition"
                  />
                </div>
                <div className="animate-fade-in-up animation-delay-600">
                  <FeatureItem 
                    icon={CheckCircleIcon}
                    text="Custom Assessment & Progress Indicators"
                  />
                </div>
                <div className="animate-fade-in-up animation-delay-800">
                  <FeatureItem 
                    icon={CheckCircleIcon}
                    text="Multi-Program Enrollment Management"
                  />
                </div>
                <div className="animate-fade-in-up animation-delay-1000">
                  <FeatureItem 
                    icon={CheckCircleIcon}
                    text="Analytics Dashboard & Impact Reports"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto pt-12 text-white text-sm" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                <p>© 2025 Youth Impact Visualizer. All rights reserved.</p>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form with Logo */}
          <div className="flex-1 flex items-center justify-center p-6 lg:p-8">
            <div className="w-full max-w-md">
              {/* Logo at top of form - Desktop */}
              <div className="hidden lg:flex justify-center mb-6 animate-slide-in-right">
                <div className="flex items-center justify-center">
                  <img 
                    src={logoImage} 
                    alt="Youth Impact Visualizer Logo" 
                    className="w-40 h-auto object-contain"
                  />
                </div>
              </div>

              {/* Mobile Logo */}
              <div className="lg:hidden text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <img 
                    src={logoImage} 
                    alt="Youth Impact Visualizer Logo" 
                    className="w-32 h-auto object-contain"
                  />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Youth Impact Visualizer</h1>
                <p className="text-gray-600 text-sm">Track, Measure, Visualize</p>
              </div>

              {/* Login Card */}
              <div className="bg-white rounded-2xl p-6 lg:p-8">
                {/* Header */}
                <div className="mb-8">
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    Sign in to your account
                  </h2>
                  <p className="text-gray-600 text-sm lg:text-base">
                    Access your program management dashboard
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Username Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Username
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      </div>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className={`block w-full pl-10 lg:pl-12 pr-4 py-3 lg:py-3.5 border ${
                          errors.username ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                        } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 placeholder-gray-400 text-sm lg:text-base`}
                        placeholder="Enter your username"
                        required
                        autoFocus
                        disabled={isLoading}
                      />
                    </div>
                    {errors.username && (
                      <p className="mt-1 text-xs text-red-600">{errors.username}</p>
                    )}
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`block w-full pl-10 lg:pl-12 pr-10 lg:pr-12 py-3 lg:py-3.5 border ${
                          errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                        } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 placeholder-gray-400 text-sm lg:text-base`}
                        placeholder="Enter your password"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <FiEyeOff className="h-4 w-4 lg:h-5 lg:w-5" />
                        ) : (
                          <FiEye className="h-4 w-4 lg:h-5 lg:w-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                    )}
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        disabled={isLoading}
                      />
                      <span className="ml-2 lg:ml-3 text-sm text-gray-700 group-hover:text-gray-900">
                        Remember Me
                      </span>
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                      tabIndex={isLoading ? -1 : 0}
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  {/* Login Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isLoading}
                    disabled={isLoading}
                    className="!py-3.5"
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-gray-500">
                      Need Access?
                    </span>
                  </div>
                </div>

                {/* Contact Admin Link */}
                <div className="mt-6 text-center">
                  <p className="text-gray-600 text-sm">
                    Don't have an account?{' '}
                    <Link
                      to="/contact"
                      className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      tabIndex={isLoading ? -1 : 0}
                    >
                      Contact Administrator
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;