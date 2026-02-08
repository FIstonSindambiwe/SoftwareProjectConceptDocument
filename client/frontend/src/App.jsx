// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';

// Users
import UsersListPage from './pages/dashboard/users/UsersListPage';
import UserDetailPage from './pages/dashboard/users/UserDetailPage';
import CreateUserPage from './pages/dashboard/users/CreateUserPage';
import EditUserPage from './pages/dashboard/users/EditUserPage';

// Profile
import ProfilePage from './pages/dashboard/profile/ProfilePage';
import ChangePasswordPage from './pages/dashboard/profile/ChangePasswordPage';

// Auth Service
import authService from './services/api/authService';

// Private Route Component
const PrivateRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/forgot-password" 
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          } 
        />

        {/* Private Routes - Dashboard */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          } 
        />

        {/* Private Routes - Users */}
        <Route 
          path="/users" 
          element={
            <PrivateRoute>
              <UsersListPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/users/create" 
          element={
            <PrivateRoute>
              <CreateUserPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/users/:id" 
          element={
            <PrivateRoute>
              <UserDetailPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/users/:id/edit" 
          element={
            <PrivateRoute>
              <EditUserPage />
            </PrivateRoute>
          } 
        />

        {/* Private Routes - Profile */}
        <Route 
          path="/profile" 
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/profile/change-password" 
          element={
            <PrivateRoute>
              <ChangePasswordPage />
            </PrivateRoute>
          } 
        />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;