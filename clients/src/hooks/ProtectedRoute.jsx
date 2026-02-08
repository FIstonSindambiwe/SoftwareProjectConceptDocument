// src/components/auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/**
 * ProtectedRoute component for role-based access control
 * Does NOT wrap content in Layout - that should be done in the page components
 * 
 * Usage:
 * <ProtectedRoute allowedRoles={['admin']}>
 *   <UsersPage />
 * </ProtectedRoute>
 */
const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  requireAuth = true,
  redirectTo = '/login',
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            {/* Warning Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h2>

            <p className="text-gray-600 mb-6">
              You don't have permission to access this page.
            </p>

            {/* Required Roles */}
            {allowedRoles.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Required role(s):</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {allowedRoles.map(role => (
                    <span 
                      key={role}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full capitalize"
                    >
                      {role.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Current Role */}
            {user?.role && (
              <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Your current role:</p>
                <p className="text-lg font-semibold text-gray-900 capitalize mt-1">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.history.back()}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                ← Go Back
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User has access - render children WITHOUT Layout
  return children;
};

export default ProtectedRoute;