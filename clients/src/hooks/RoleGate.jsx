// src/components/auth/RoleGate.jsx
import React from 'react';
import useAuth from '../../hooks/useAuth';

/**
 * RoleGate component for conditional rendering based on user roles
 * 
 * Usage:
 * <RoleGate allowedRoles={['admin', 'teacher']}>
 *   <EditButton />
 * </RoleGate>
 */
const RoleGate = ({ 
  children, 
  allowedRoles = [],
  requireAdmin = false,
  requireCanEdit = false,
  requireCanManageUsers = false,
  fallback = null,
  showForAll = false 
}) => {
  const { user, isAdmin, canEditData, canManageUsers } = useAuth();

  // Show for all authenticated users
  if (showForAll && user) {
    return children;
  }

  // Check permission functions
  if (requireAdmin && !isAdmin()) {
    return fallback;
  }

  if (requireCanEdit && !canEditData()) {
    return fallback;
  }

  if (requireCanManageUsers && !canManageUsers()) {
    return fallback;
  }

  // Check specific roles
  if (allowedRoles.length > 0) {
    if (!user || !allowedRoles.includes(user.role)) {
      return fallback;
    }
  }

  return children;
};

// Convenience components
export const AdminOnly = ({ children, fallback = null }) => (
  <RoleGate requireAdmin fallback={fallback}>
    {children}
  </RoleGate>
);

export const TeacherOnly = ({ children, fallback = null }) => (
  <RoleGate allowedRoles={['teacher']} fallback={fallback}>
    {children}
  </RoleGate>
);

export const ProgramManagerOnly = ({ children, fallback = null }) => (
  <RoleGate allowedRoles={['program_manager']} fallback={fallback}>
    {children}
  </RoleGate>
);

export const DonorOnly = ({ children, fallback = null }) => (
  <RoleGate allowedRoles={['donor']} fallback={fallback}>
    {children}
  </RoleGate>
);

export const CanEdit = ({ children, fallback = null }) => (
  <RoleGate requireCanEdit fallback={fallback}>
    {children}
  </RoleGate>
);

export const CanManageUsers = ({ children, fallback = null }) => (
  <RoleGate requireCanManageUsers fallback={fallback}>
    {children}
  </RoleGate>
);

export default RoleGate;