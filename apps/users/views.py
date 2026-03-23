# apps/users/views.py
"""
User ViewSet with Role-Based Access Control
"""
from datetime import timezone

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

from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse

import logging

logger = logging.getLogger(__name__)


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
    Also checks if user must change password
    
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
    
    # Check if user must change password
    must_change_password = user.must_change_password
    
    # Update last login IP and time
    try:
        ip_address = get_client_ip(request)
        user.last_login_ip = ip_address
        user.last_login = timezone.now()
        user.save(update_fields=['last_login_ip', 'last_login'])
    except Exception as e:
        logger.error(f"Failed to update login info: {str(e)}")
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    
    # Serialize user data
    user_serializer = UserSerializer(user, context={'request': request})
    
    response_data = {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': user_serializer.data
    }
    
    # Add flag for password change requirement
    if must_change_password:
        response_data['must_change_password'] = True
        response_data['message'] = 'Please change your password to continue'
    
    return Response(response_data, status=status.HTTP_200_OK)



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


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for User model with role-based access control
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        """
        Assign permissions based on action
        """
        if self.action in ['list', 'create', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, CanManageUsers]
        elif self.action in ['retrieve', 'update', 'partial_update']:
            permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
        elif self.action in ['me', 'update_profile', 'change_password', 'my_activity']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['stats', 'audit_logs']:
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
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """
        Change user password
        Also clears must_change_password flag
        
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
            'message': 'Password changed successfully',
            'must_change_password': False
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """
        Reset user password (Admin only)
        Generates new password and sends email
        
        POST /api/v1/auth/{id}/reset_password/
        """
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can reset passwords'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = self.get_object()
        new_password = User.generate_default_password()
        
        user.set_password(new_password)
        user.must_change_password = True
        user.save()
        
        # Send email with new password
        try:
            from django.core.mail import send_mail
            subject = "Your Password Has Been Reset"
            message = f"""
            Dear {user.get_full_name() or user.username},
            
            Your password has been reset by an administrator.
            
            New login credentials:
            Username: {user.username}
            Password: {new_password}
            
            Please login and change your password immediately.
            
            If you did not request this, please contact the system administrator.
            
            Best regards,
            System Administrator
            """
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
            
            return Response({
                'message': f'Password reset for user {user.username}. New password sent to {user.email}',
                'temp_password': new_password  # Remove in production, only for testing
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Failed to send reset email: {str(e)}")
            return Response({
                'error': 'Password reset failed - email sending error',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 

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
        
@csrf_exempt
def test_email_view(request):
    """View to test email sending from browser"""
    if request.method == 'POST':
        try:
            recipient = request.POST.get('email', 'shemaroger60@gmail.com')
            
            send_mail(
                subject="Test Email from Youth Impact Visualizer",
                message="This is a test email. Your email configuration is working!",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                fail_silently=False,
            )
            
            return JsonResponse({
                'success': True,
                'message': f'Test email sent successfully to {recipient}'
            })
            
        except Exception as e:
            logger.error(f"Test email failed: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    return JsonResponse({'error': 'POST method required'}, status=405)        