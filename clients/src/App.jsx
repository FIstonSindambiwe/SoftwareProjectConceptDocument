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

// Participants
import ParticipantsListPage from './pages/dashboard/participants/ParticipantsListPage';
import ParticipantDetailPage from './pages/dashboard/participants/ParticipantDetailPage';
import CreateParticipantPage from './pages/dashboard/participants/CreateParticipantPage';
import EditParticipantPage from './pages/dashboard/participants/EditParticipantPage';

// Attendance
import AttendanceListPage from './pages/dashboard/attendance/AttendanceListPage';
import FaceCheckInPage from './pages/dashboard/attendance/FaceCheckInPage';
import BulkAttendancePage from './pages/dashboard/attendance/BulkAttendancePage';
import SessionsListPage from './pages/dashboard/attendance/SessionsListPage';
import AttendanceDetailPage from './pages/dashboard/attendance/AttendanceDetailPage';
import AttendanceEditPage from './pages/dashboard/attendance/AttendanceEditPage';


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
          path="/dashboard/users" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UsersListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/users/create" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CreateUserPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/users/:id" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/users/:id/edit" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <EditUserPage />
            </ProtectedRoute>
          } 
        />

        {/* Protected Routes - Locations (Admin, Program Manager) */}
        <Route 
          path="/dashboard/locations" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager']}>
              <LocationsListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/locations/create" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager']}>
              <CreateLocationPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/locations/:id" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager']}>
              <LocationDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/locations/:id/edit" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager']}>
              <EditLocationPage />
            </ProtectedRoute>
          } 
        />

        {/* Protected Routes - Programs (All authenticated users can view, Admin/PM can edit) */}
        <Route 
          path="/dashboard/programs" 
          element={
            <ProtectedRoute>
              <ProgramsListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/programs/create" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager']}>
              <CreateProgramPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/programs/:id" 
          element={
            <ProtectedRoute>
              <ProgramDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/programs/:id/edit" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager']}>
              <EditProgramPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Milestone Routes (Admin, Teacher, Program Manager) */}
        <Route
          path="/dashboard/milestones"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager']}>
              <MilestonesListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/milestones/create"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager']}>
              <CreateMilestonePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/milestones/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager']}>
              <MilestoneDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/milestones/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager']}>
              <EditMilestonePage />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes - Participants (All authenticated users can view, Admin/Teacher/PM can edit) */}
        <Route 
          path="/dashboard/participants" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager', 'staff', 'donor']}>
              <ParticipantsListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/participants/create" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager', 'staff']}>
              <CreateParticipantPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/participants/:id" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager', 'staff', 'donor']}>
              <ParticipantDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/participants/:id/edit" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager', 'staff']}>
              <EditParticipantPage />
            </ProtectedRoute>
          } 
        />

        {/* Protected Routes - Attendance (Admin, Teacher, Program Manager, Staff) */}
        <Route 
          path="/dashboard/attendance" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager', 'staff']}>
              <AttendanceListPage />
            </ProtectedRoute>
          } 
        />

        {/* Detail page - All authenticated users can view */}
        <Route 
          path="/dashboard/attendance/:id" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager', 'staff', 'donor']}>
              <AttendanceDetailPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Edit page - Only staff/teachers/managers can edit (donors excluded) */}
        <Route 
          path="/dashboard/attendance/:id/edit" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager', 'staff']}>
              <AttendanceEditPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/attendance/check-in" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager', 'staff']}>
              <FaceCheckInPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/attendance/bulk" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager', 'staff']}>
              <BulkAttendancePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/attendance/sessions" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager', 'staff']}>
              <SessionsListPage />
            </ProtectedRoute>
          } 
        />

        {/* Protected Routes - Assessments (Admin, Teacher, Program Manager) */}
        <Route 
          path="/dashboard/assessments" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager']}>
              <ComingSoonPage pageName="Assessments" />
            </ProtectedRoute>
          } 
        />

        {/* Protected Routes - Reports (All authenticated users) */}
        <Route 
          path="/dashboard/reports" 
          element={
            <ProtectedRoute>
              <ComingSoonPage pageName="Reports" />
            </ProtectedRoute>
          } 
        />

        {/* Protected Routes - Profile (All authenticated users) */}
        <Route 
          path="/dashboard/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/profile/change-password" 
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