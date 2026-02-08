# apps/users/urls.py
"""
URL Configuration for Users App with Role-Based Access Control
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import UserViewSet, AuditLogViewSet, login_view, logout_view

# Create router for users app
router = DefaultRouter()
router.register(r'', UserViewSet, basename='user')

# Create separate router for audit logs
audit_router = DefaultRouter()
audit_router.register(r'', AuditLogViewSet, basename='auditlog')

app_name = 'users'

urlpatterns = [
    # Authentication endpoints (no auth required)
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # Audit logs endpoints
    path('audit-logs/', include(audit_router.urls)),
    
    # User management endpoints (requires auth)
    # This must come last to avoid catching other routes
    path('', include(router.urls)),
]

"""
API Endpoints:
==============

AUTHENTICATION (Public - No Auth Required)
-------------------------------------------
POST   /api/v1/auth/login/              - Login and get JWT tokens
POST   /api/v1/auth/logout/             - Logout (blacklist token)
POST   /api/v1/auth/refresh/            - Refresh access token

USER MANAGEMENT (Requires Authentication)
-----------------------------------------
GET    /api/v1/auth/                    - List all users (admin only)
POST   /api/v1/auth/                    - Create new user (admin only)
GET    /api/v1/auth/{id}/               - Get user details (admin or self)
PUT    /api/v1/auth/{id}/               - Update user (admin or self)
PATCH  /api/v1/auth/{id}/               - Partial update user (admin or self)
DELETE /api/v1/auth/{id}/               - Deactivate user (admin only)

PROFILE ENDPOINTS (Requires Authentication)
-------------------------------------------
GET    /api/v1/auth/me/                 - Get current user profile
PUT    /api/v1/auth/update_profile/     - Update current user profile
PATCH  /api/v1/auth/update_profile/     - Partial update current user profile
POST   /api/v1/auth/change_password/    - Change password

ADMIN ENDPOINTS (Admin Only)
----------------------------
GET    /api/v1/auth/stats/              - Get user statistics
GET    /api/v1/auth/{id}/audit_logs/    - Get audit logs for specific user
GET    /api/v1/auth/my_activity/        - Get current user's activity logs

AUDIT LOGS (Requires Authentication)
------------------------------------
GET    /api/v1/auth/audit-logs/         - List all audit logs (admin only)
GET    /api/v1/auth/audit-logs/{id}/    - Get specific audit log (admin only)
GET    /api/v1/auth/audit-logs/my_activity/ - Get own activity logs
"""