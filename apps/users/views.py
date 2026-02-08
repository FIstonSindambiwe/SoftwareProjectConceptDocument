# apps/users/views.py
"""
User ViewSet with Role-Based Access Control
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from django.contrib.auth import authenticate
from django.db.models import Count, Q
from .models import User, AuditLog
from .serializers import (
    UserSerializer, 
    UserCreateSerializer,
    UserUpdateSerializer,
    UserListSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
    LoginSerializer,
    UserStatsSerializer,
    AuditLogSerializer
)
from .permissions import (
    IsAdmin, 
    CanManageUsers, 
    IsOwnerOrAdmin,
    CanEditData,
)


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """
    Login endpoint - Returns JWT tokens and user data
    
    POST /api/v1/auth/login/
    Body: {"username": "...", "password": "..."}
    """
    serializer = LoginSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get authenticated user from serializer
    user = serializer.validated_data['user']
    
    # Update last login IP
    try:
        ip_address = get_client_ip(request)
        user.last_login_ip = ip_address
        user.save(update_fields=['last_login_ip', 'last_login'])
    except Exception:
        pass
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    
    # Serialize user data
    user_serializer = UserSerializer(user, context={'request': request})
    
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': user_serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """
    Logout endpoint - Blacklists the refresh token
    
    POST /api/v1/auth/logout/
    """
    try:
        refresh_token = request.data.get('refresh')
        
        if refresh_token:
            # Blacklist specific token
            token = RefreshToken(refresh_token)
            token.blacklist()
        else:
            # Blacklist all user's tokens
            try:
                tokens = OutstandingToken.objects.filter(user=request.user)
                for token in tokens:
                    BlacklistedToken.objects.get_or_create(token=token)
            except Exception:
                # Token blacklist not installed, just return success
                pass
        
        return Response(
            {'message': 'Logout successful'},
            status=status.HTTP_200_OK
        )
    
    except Exception as e:
        return Response(
            {'error': 'Invalid token or logout failed'},
            status=status.HTTP_400_BAD_REQUEST
        )


# apps/users/views.py
class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for User model with role-based access control
    
    Permissions:
    - List/Retrieve: Admin only (or own profile)
    - Create: Admin only
    - Update/Delete: Admin only (or own profile with limited fields)
    - Profile actions: Own profile or admin
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        """
        Assign permissions based on action
        """
        if self.action in ['list', 'create', 'destroy']:
            # Only admins can list all users, create users, or delete users
            permission_classes = [permissions.IsAuthenticated, CanManageUsers]
        elif self.action in ['retrieve', 'update', 'partial_update']:
            # Admins can access any user, others only their own profile
            permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
        elif self.action in ['me', 'update_profile', 'change_password', 'my_activity']:
            # Any authenticated user can access their own profile
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['stats', 'audit_logs']:
            # Only admins can view user statistics and audit logs
            permission_classes = [permissions.IsAuthenticated, IsAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        """
        Use different serializers for different actions
        """
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            # Check if user is updating themselves
            try:
                obj = self.get_object()
                if obj == self.request.user:
                    return UserProfileSerializer
            except:
                pass
            return UserUpdateSerializer
        elif self.action == 'list':
            return UserListSerializer
        elif self.action in ['me', 'update_profile']:
            return UserProfileSerializer
        elif self.action == 'change_password':
            return ChangePasswordSerializer
        elif self.action == 'stats':
            return UserStatsSerializer
        return UserSerializer
    
    def get_queryset(self):
        """
        Filter queryset based on user role and query parameters
        """
        user = self.request.user
        queryset = User.objects.all()
        
        # Admins see all users
        if user.role == 'admin':
            # Apply filters
            search = self.request.query_params.get('search', None)
            role = self.request.query_params.get('role', None)
            is_active = self.request.query_params.get('is_active', None)
            
            if search:
                queryset = queryset.filter(
                    Q(username__icontains=search) |
                    Q(email__icontains=search) |
                    Q(first_name__icontains=search) |
                    Q(last_name__icontains=search)
                )
            
            if role:
                queryset = queryset.filter(role=role)
            
            if is_active is not None:
                is_active_bool = is_active.lower() in ['true', '1', 'yes']
                queryset = queryset.filter(is_active=is_active_bool)
            
            return queryset.order_by('-date_joined')
        
        # Others only see themselves
        return User.objects.filter(id=user.id)
    
    def partial_update(self, request, *args, **kwargs):
        """
        Handle PATCH requests - allows admins to update any user field
        """
        instance = self.get_object()
        
        # Log the update attempt
        print(f"PATCH request for user {instance.id} by {request.user.username}")
        print(f"Data received: {request.data}")
        
        # Allow admin to update any field via PATCH
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Log the update
        print(f"User {instance.id} updated successfully")
        print(f"Updated data: {serializer.data}")
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Get current user profile
        
        GET /api/v1/auth/me/
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_profile(self, request):
        """
        Update current user profile
        
        PUT/PATCH /api/v1/auth/update_profile/
        """
        serializer = self.get_serializer(
            request.user, 
            data=request.data, 
            partial=request.method == 'PATCH',
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """
        Change user password
        
        POST /api/v1/auth/change_password/
        Body: {
            "old_password": "...",
            "new_password": "...",
            "new_password_confirm": "..."
        }
        """
        serializer = self.get_serializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get user statistics (Admin only)
        
        GET /api/v1/auth/stats/
        """
        stats = {
            'total_users': User.objects.count(),
            'active_users': User.objects.filter(is_active=True).count(),
            'inactive_users': User.objects.filter(is_active=False).count(),
            'by_role': list(User.objects.values('role').annotate(count=Count('id'))),
        }
        
        return Response(stats)
    
    @action(detail=True, methods=['get'])
    def audit_logs(self, request, pk=None):
        """
        Get audit logs for a specific user (Admin only)
        
        GET /api/v1/auth/{id}/audit_logs/
        """
        user = self.get_object()
        logs = AuditLog.objects.filter(user=user).order_by('-timestamp')[:50]
        serializer = AuditLogSerializer(logs, many=True)
        
        return Response({
            'user': user.username,
            'logs': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def my_activity(self, request):
        """
        Get current user's activity logs
        
        GET /api/v1/auth/my_activity/
        """
        logs = AuditLog.objects.filter(user=request.user).order_by('-timestamp')[:50]
        serializer = AuditLogSerializer(logs, many=True)
        
        return Response({
            'user': request.user.username,
            'activity': serializer.data
        })
    
    def perform_destroy(self, instance):
        """
        Deactivate user instead of deleting (soft delete)
        """
        instance.is_active = False
        instance.save()
        
        # Log the deactivation
        print(f"User {instance.username} (ID: {instance.id}) deactivated by {self.request.user.username}")
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """
        Toggle user active status
        POST /api/v1/auth/{id}/toggle_active/
        """
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can toggle user status'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = self.get_object()
        
        print(f"Toggling user {user.id} ({user.username})")
        print(f"Current is_active: {user.is_active}")
        
        user.is_active = not user.is_active
        user.save()
        
        print(f"New is_active: {user.is_active}")
        
        serializer = self.get_serializer(user)
        return Response({
            'message': f'User {user.username} {"activated" if user.is_active else "deactivated"}',
            'user': serializer.data
        })    

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for AuditLog model (Read-only)
    
    Permissions:
    - List: Admin only
    - Retrieve: Admin only
    - my_activity: Any authenticated user (own logs)
    """
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    
    def get_queryset(self):
        """
        Filter audit logs based on permissions
        """
        user = self.request.user
        
        if user.role == 'admin':
            return AuditLog.objects.all().order_by('-timestamp')
        
        # Non-admins only see their own logs
        return AuditLog.objects.filter(user=user).order_by('-timestamp')
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_activity(self, request):
        """
        Get current user's activity logs
        
        GET /api/v1/audit-logs/my_activity/
        """
        logs = AuditLog.objects.filter(user=request.user).order_by('-timestamp')[:100]
        serializer = self.get_serializer(logs, many=True)
        
        return Response({
            'user': request.user.username,
            'total_logs': logs.count(),
            'logs': serializer.data
        })