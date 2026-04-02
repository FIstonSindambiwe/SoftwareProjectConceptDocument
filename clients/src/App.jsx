// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Password Change Page (Moved outside dashboard for clean access)
import ChangePasswordPage from './pages/auth/ChangePasswordPage';

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

// Enrollments
import EnrollmentsListPage from './pages/dashboard/enrollments/EnrollmentsListPage';
import EnrollmentDetailPage from './pages/dashboard/enrollments/EnrollmentDetailPage';
import CreateEnrollmentPage from './pages/dashboard/enrollments/CreateEnrollmentPage';
import EditEnrollmentPage from './pages/dashboard/enrollments/EditEnrollmentPage';

// Rooms
import RoomsListPage from './pages/dashboard/Rooms/RoomsListPage';
import CreateRoomPage from './pages/dashboard/Rooms/CreateRoomPage';
import EditRoomPage from './pages/dashboard/Rooms/EditRoomPage';
import RoomParticipantsPage from './pages/dashboard/Rooms/RoomParticipantsPage';

// Attendance
import AttendanceListPage from './pages/dashboard/attendance/AttendanceListPage';
import FaceCheckInPage from './pages/dashboard/attendance/FaceCheckInPage';
import BulkAttendancePage from './pages/dashboard/attendance/BulkAttendancePage';
import SessionsListPage from './pages/dashboard/attendance/SessionsListPage';
import CreateSessionPage from './pages/dashboard/attendance/CreateSessionPage';
import SessionAttendancePage from './pages/dashboard/attendance/SessionAttendancePage';
import AttendanceDetailPage from './pages/dashboard/attendance/AttendanceDetailPage';
import AttendanceEditPage from './pages/dashboard/attendance/AttendanceEditPage';

// Milestones
import MilestonesListPage from './pages/dashboard/milestones/MilestonesListPage';
import MilestoneDetailPage from './pages/dashboard/milestones/MilestoneDetailPage';
import CreateMilestonePage from './pages/dashboard/milestones/CreateMilestonePage';
import EditMilestonePage from './pages/dashboard/milestones/EditMilestonePage';

// Assessments
import AssessmentsListPage from './pages/dashboard/assessments/AssessmentsListPage';
import AssessmentDetailPage from './pages/dashboard/assessments/AssessmentDetailPage';
import AssessmentEditPage from './pages/dashboard/assessments/AssessmentEditPage';
import CreateAssessmentPage from './pages/dashboard/assessments/CreateAssessmentPage';
import IndicatorsListPage from './pages/dashboard/assessments/IndicatorsListPage';

// Reports
import GeneralReport from './pages/dashboard/report/GeneralReport';
// Schools  👈 ADD HERE
import SchoolsListPage from './pages/dashboard/schools/SchoolsListPage';
import CreateSchoolPage from './pages/dashboard/schools/CreateSchoolPage';
import SchoolDetailPage from './pages/dashboard/schools/SchoolDetailPage';
import CreateStudentPage from './pages/dashboard/schools/CreateStudentPage';
import StudentDetailPage from './pages/dashboard/schools/StudentDetailPage';

// Profile (Regular profile page, not password change)
import ProfilePage from './pages/dashboard/profile/ProfilePage';

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
        {/* ================================
            PUBLIC ROUTES
            ================================ */}
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
        
        {/* Password Change Route - Special handling */}
        {/* This route requires authentication but allows access even if password needs change */}
        <Route 
          path="/change-password" 
          element={
            <ProtectedRoute requireAuth={true} requireFullAuth={false}>
              <ChangePasswordPage />
            </ProtectedRoute>
          } 
        />

        {/* ================================
            PROTECTED ROUTES - DASHBOARD
            Require full authentication (password changed)
            ================================ */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute requireFullAuth={true}>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />

        {/* ================================
            USERS ROUTES (Admin only)
            ================================ */}
        <Route 
          path="/dashboard/users" 
          element={
            <ProtectedRoute allowedRoles={['admin']} requireFullAuth={true}>
              <UsersListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/users/create" 
          element={
            <ProtectedRoute allowedRoles={['admin']} requireFullAuth={true}>
              <CreateUserPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/users/:id" 
          element={
            <ProtectedRoute allowedRoles={['admin']} requireFullAuth={true}>
              <UserDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/users/:id/edit" 
          element={
            <ProtectedRoute allowedRoles={['admin']} requireFullAuth={true}>
              <EditUserPage />
            </ProtectedRoute>
          } 
        />

        {/* ================================
            LOCATIONS ROUTES (Admin, Program Manager)
            ================================ */}
        <Route 
          path="/dashboard/locations" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager']} requireFullAuth={true}>
              <LocationsListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/locations/create" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager']} requireFullAuth={true}>
              <CreateLocationPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/locations/:id" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager']} requireFullAuth={true}>
              <LocationDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/locations/:id/edit" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager']} requireFullAuth={true}>
              <EditLocationPage />
            </ProtectedRoute>
          } 
        />

        {/* ================================
            PROGRAMS ROUTES
            All authenticated users can view, Admin/PM can edit
            ================================ */}
        <Route 
          path="/dashboard/programs" 
          element={
            <ProtectedRoute requireFullAuth={true}>
              <ProgramsListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/programs/create" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager']} requireFullAuth={true}>
              <CreateProgramPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/programs/:id" 
          element={
            <ProtectedRoute requireFullAuth={true}>
              <ProgramDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/programs/:id/edit" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager']} requireFullAuth={true}>
              <EditProgramPage />
            </ProtectedRoute>
          } 
        />
        
        {/* ================================
            MILESTONE ROUTES (Admin, Teacher, Program Manager)
            ================================ */}
        <Route
          path="/dashboard/milestones"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager']} requireFullAuth={true}>
              <MilestonesListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/milestones/create"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager']} requireFullAuth={true}>
              <CreateMilestonePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/milestones/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager']} requireFullAuth={true}>
              <MilestoneDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/milestones/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager']} requireFullAuth={true}>
              <EditMilestonePage />
            </ProtectedRoute>
          }
        />

        {/* ================================
            ROOMS ROUTES
            ================================ */}
        <Route 
          path="/dashboard/participants/rooms" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager', 'teacher']} requireFullAuth={true}>
              <RoomsListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/participants/rooms/create" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager']} requireFullAuth={true}>
              <CreateRoomPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/participants/rooms/:id/edit" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager', 'teacher']} requireFullAuth={true}>
              <EditRoomPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/participants/rooms/:id/participants" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager', 'teacher', 'staff']} requireFullAuth={true}>
              <RoomParticipantsPage />
            </ProtectedRoute>
          } 
        />

        {/* ================================
            ENROLLMENTS ROUTES
            ================================ */}
        <Route 
          path="/dashboard/enrollments" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager', 'teacher', 'staff']} requireFullAuth={true}>
              <EnrollmentsListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/enrollments/create" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager', 'teacher', 'staff']} requireFullAuth={true}>
              <CreateEnrollmentPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/enrollments/:id" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager', 'teacher', 'staff', 'donor']} requireFullAuth={true}>
              <EnrollmentDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/enrollments/:id/edit" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager', 'teacher', 'staff']} requireFullAuth={true}>
              <EditEnrollmentPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Special enrollment actions */}
        <Route 
          path="/dashboard/enrollments/:id/dropout" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager', 'teacher']} requireFullAuth={true}>
              <ComingSoonPage pageName="Record Dropout" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/enrollments/:id/award-scholarship" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager']} requireFullAuth={true}>
              <ComingSoonPage pageName="Award Scholarship" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/enrollments/:id/temporary-leave" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager', 'teacher']} requireFullAuth={true}>
              <ComingSoonPage pageName="Temporary Leave" />
            </ProtectedRoute>
          } 
        />

        {/* ================================
            PARTICIPANTS ROUTES
            ================================ */}
        <Route 
          path="/dashboard/participants" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager', 'staff', 'donor']} requireFullAuth={true}>
              <ParticipantsListPage />
            </ProtectedRoute>
          } 
        />


        
        <Route 
          path="/dashboard/participants/create" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager', 'staff']} requireFullAuth={true}>
              <CreateParticipantPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/participants/:id" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager', 'staff', 'donor']} requireFullAuth={true}>
              <ParticipantDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/participants/:id/edit" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager', 'staff']} requireFullAuth={true}>
              <EditParticipantPage />
            </ProtectedRoute>
          } 
        />
        

        {/* ================================
            ATTENDANCE ROUTES
            ================================ */}
        <Route 
          path="/dashboard/attendance" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager', 'staff']} requireFullAuth={true}>
              <AttendanceListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/attendance/:id" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager', 'staff', 'donor']} requireFullAuth={true}>
              <AttendanceDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/attendance/:id/edit" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager', 'staff']} requireFullAuth={true}>
              <AttendanceEditPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/attendance/check-in" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager', 'staff']} requireFullAuth={true}>
              <FaceCheckInPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/attendance/bulk" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager', 'staff']} requireFullAuth={true}>
              <BulkAttendancePage />
            </ProtectedRoute>
          } 
        />
         <Route 
          path="/dashboard/attendance/sessions" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager', 'staff']} requireFullAuth={true}>
              <SessionsListPage />
            </ProtectedRoute>
          } 
        />

        {/* NEW - Create Session Route */}
        <Route 
          path="/dashboard/attendance/sessions/create" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager', 'staff']} requireFullAuth={true}>
              <CreateSessionPage />
            </ProtectedRoute>
          } 
        />

        <Route 
  path="/dashboard/attendance/sessions/:id/attendance" 
  element={
    <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager', 'staff']} requireFullAuth={true}>
      <SessionAttendancePage />
    </ProtectedRoute>
  } 
/>
        
            { /*ASSESSMENTS ROUTES
            ================================ */}
        <Route 
          path="/dashboard/assessments" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager', 'donor']} requireFullAuth={true}>
              <AssessmentsListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/assessments/create" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager']} requireFullAuth={true}>
              <CreateAssessmentPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/assessments/indicators" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager', 'donor']} requireFullAuth={true}>
              <IndicatorsListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/assessments/:id" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager', 'donor']} requireFullAuth={true}>
              <AssessmentDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/assessments/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'program_manager']} requireFullAuth={true}>
              <AssessmentEditPage />
            </ProtectedRoute>
          } 
        />

        {/* ================================
            REPORTS ROUTES
            ================================ */}
        <Route 
          path="/dashboard/reports/general" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'program_manager', 'director','teacher','donor']} requireFullAuth={true}>
              <GeneralReport />
            </ProtectedRoute>
          } 
        />

        {/* ================================
            PROFILE ROUTES (Regular profile, not password change)
            ================================ */}
        <Route 
          path="/dashboard/profile" 
          element={
            <ProtectedRoute requireFullAuth={true}>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />

{/* ================================
    SCHOOLS ROUTES
    ================================ */}
<Route 
  path="/dashboard/schools" 
  element={
    <ProtectedRoute allowedRoles={['admin', 'program_manager', 'teacher', 'staff']} requireFullAuth={true}>
      <SchoolsListPage />
    </ProtectedRoute>
  } 
/>
<Route 
  path="/dashboard/schools/create" 
  element={
    <ProtectedRoute allowedRoles={['admin', 'program_manager', 'teacher', 'staff']} requireFullAuth={true}>
      <CreateSchoolPage />
    </ProtectedRoute>
  } 
/>
<Route 
  path="/dashboard/schools/:id" 
  element={
    <ProtectedRoute allowedRoles={['admin', 'program_manager', 'teacher', 'staff']} requireFullAuth={true}>
      <SchoolDetailPage />
    </ProtectedRoute>
  } 
/>
<Route 
  path="/dashboard/schools/:schoolId/students/create" 
  element={
    <ProtectedRoute allowedRoles={['admin', 'program_manager', 'teacher', 'staff']} requireFullAuth={true}>
      <CreateStudentPage />
    </ProtectedRoute>
  } 
/>
<Route 
  path="/dashboard/schools/students/:id" 
  element={
    <ProtectedRoute allowedRoles={['admin', 'program_manager', 'teacher', 'staff']} requireFullAuth={true}>
      <StudentDetailPage />
    </ProtectedRoute>
  } 
/>


        {/* ================================
            REDIRECTS
            ================================ */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;