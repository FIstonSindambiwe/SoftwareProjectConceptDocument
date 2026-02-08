// src/pages/auth/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // TODO: Implement password reset API call
      // await authService.requestPasswordReset(email);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Failed to send reset email. Please try again.');
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
            Reset Your Password
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <Link
            to="/login"
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Login
          </Link>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Forgot Password?
          </h2>
          <p className="text-gray-600 mb-6">
            Enter your email address and we'll send you instructions to reset your password.
          </p>

          {success ? (
            <Alert
              type="success"
              message="Password reset instructions have been sent to your email address. Please check your inbox."
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert type="error" message={error} onClose={() => setError('')} />
              )}

              <Input
                label="Email Address"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={EnvelopeIcon}
                required
                autoFocus
                placeholder="your.email@example.com"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full"
              >
                Send Reset Instructions
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Remember your password?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign In
              </Link>
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

export default ForgotPasswordPage;