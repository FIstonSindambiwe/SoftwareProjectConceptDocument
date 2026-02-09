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

// Locations
import LocationsListPage from './pages/dashboard/locations/LocationsListPage';
import LocationDetailPage from './pages/dashboard/locations/LocationDetailPage';
import CreateLocationPage from './pages/dashboard/locations/CreateLocationPage';
import EditLocationPage from './pages/dashboard/locations/EditLocationPage';

// Programs
import ProgramsListPage from './pages/dashboard/programs/ProgramsListPage';
import ProgramDetailPage from './pages/dashboard/programs/ProgramDetailPage';
import CreateProgramPage from './pages/dashboard/programs/CreateProgramPage';
import EditProgramPage from './pages/dashboard/programs/EditProgramPage';

// Milestones
import MilestonesListPage from './pages/dashboard/milestones/MilestonesListPage';
import MilestoneDetailPage from './pages/dashboard/milestones/MilestoneDetailPage';
import CreateMilestonePage from './pages/dashboard/milestones/CreateMilestonePage';
import EditMilestonePage from './pages/dashboard/milestones/EditMilestonePage';

// Profile
import ProfilePage from './pages/dashboard/profile/ProfilePage';
import ChangePasswordPage from './pages/dashboard/profile/ChangePasswordPage';

// Components
import ProtectedRoute from "./hooks/ProtectedRoute";
import useAuth from './hooks/useAuth';

// Public Route Component
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

// Placeholder component for pages under development
const ComingSoonPage = ({ pageName }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">{pageName}</h1>
        <p className="text-gray-600">This page is under development</p>
      </div>
    </div>
  );
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

        {/* Protected Routes - Dashboard (All authenticated users) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />

        {/* Protected Routes - Users (Admin only) */}
        <Route 
          path="/users" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UsersListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/users/create" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CreateUserPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/users/:id" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/users/:id/edit" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <EditUserPage />
            </ProtectedRoute>
          } 
        />

        {/* Protected Routes - Locations (Admin, Program Manager) */}
        <Route 
          path="/locations" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager']}>
              <LocationsListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/locations/create" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager']}>
              <CreateLocationPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/locations/:id" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager']}>
              <LocationDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/locations/:id/edit" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager']}>
              <EditLocationPage />
            </ProtectedRoute>
          } 
        />

        {/* Protected Routes - Programs (All authenticated users can view, Admin/PM can edit) */}
        <Route 
          path="/programs" 
          element={
            <ProtectedRoute>
              <ProgramsListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/programs/create" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager']}>
              <CreateProgramPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/programs/:id" 
          element={
            <ProtectedRoute>
              <ProgramDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/programs/:id/edit" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager']}>
              <EditProgramPage />
            </ProtectedRoute>
          } 
        />
        
       {/* Milestone Routes (Admin, Teacher, Program Manager) */}
          <Route
            path="/milestones"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager']}>
                <MilestonesListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/milestones/create"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager']}>
                <CreateMilestonePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/milestones/:id"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager']}>
                <MilestoneDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/milestones/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager']}>
                <EditMilestonePage />
              </ProtectedRoute>
            }
          />

        {/* Protected Routes - Participants (Admin, Teacher, Program Manager) */}
        <Route 
          path="/participants" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager']}>
              <ComingSoonPage pageName="Participants" />
            </ProtectedRoute>
          } 
        />

        {/* Protected Routes - Attendance (Admin, Teacher, Program Manager) */}
        <Route 
          path="/attendance" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager']}>
              <ComingSoonPage pageName="Attendance" />
            </ProtectedRoute>
          } 
        />

        {/* Protected Routes - Assessments (Admin, Teacher, Program Manager) */}
        <Route 
          path="/assessments" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager']}>
              <ComingSoonPage pageName="Assessments" />
            </ProtectedRoute>
          } 
        />

        {/* Protected Routes - Reports (All authenticated users) */}
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute>
              <ComingSoonPage pageName="Reports" />
            </ProtectedRoute>
          } 
        />

        {/* Protected Routes - Profile (All authenticated users) */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile/change-password" 
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
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