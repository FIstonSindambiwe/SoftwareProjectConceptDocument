# apps/users/permissions.py
"""
Custom Permission Classes for Role-Based Access Control
"""
from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """
    Permission class that allows only admin users
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'admin'
        )


class IsTeacher(permissions.BasePermission):
    """
    Permission class that allows only teacher users
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'teacher'
        )


class IsProgramManager(permissions.BasePermission):
    """
    Permission class that allows only program manager users
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'program_manager'
        )


class IsDonor(permissions.BasePermission):
    """
    Permission class that allows only donor users
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'donor'
        )


class CanEditData(permissions.BasePermission):
    """
    Permission class that allows users who can edit data
    (admin, teacher, program_manager)
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['admin', 'teacher', 'program_manager']
        )


class CanManageUsers(permissions.BasePermission):
    """
    Permission class that allows only users who can manage other users
    (admin only)
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'admin'
        )


class CanViewReports(permissions.BasePermission):
    """
    Permission class that allows all authenticated users to view reports
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission class that allows users to access their own data or admin to access all
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Admin can access everything
        if request.user.role == 'admin':
            return True
        
        # Check if the object has a user/owner field
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        if hasattr(obj, 'id'):
            # For User objects, check if it's the same user
            return obj.id == request.user.id
        
        return False


class ReadOnlyOrCanEdit(permissions.BasePermission):
    """
    Read-only for donors, full access for others who can edit
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Read-only for safe methods (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for users who can edit
        return request.user.role in ['admin', 'teacher', 'program_manager']


class RoleBasedPermission(permissions.BasePermission):
    """
    Dynamic role-based permission
    Usage: Set `allowed_roles` on the view
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        allowed_roles = getattr(view, 'allowed_roles', [])
        
        # If no roles specified, allow all authenticated users
        if not allowed_roles:
            return True
        
        return request.user.role in allowed_roles


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Admin has full access, others have read-only
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Read permissions for all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for admin
        return request.user.role == 'admin'


class CanManagePrograms(permissions.BasePermission):
    """
    Permission for managing programs (admin and program_manager)
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['admin', 'program_manager']
        )


class CanManageAttendance(permissions.BasePermission):
    """
    Permission for managing attendance (admin, teacher, program_manager)
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['admin', 'teacher', 'program_manager']
        )


class CanManageAssessments(permissions.BasePermission):
    """
    Permission for managing assessments (admin, teacher, program_manager)
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['admin', 'teacher', 'program_manager']
        )


# Aliases for backward compatibility
IsDonorReadOnly = ReadOnlyOrCanEdit
IsOwner = IsOwnerOrAdmin