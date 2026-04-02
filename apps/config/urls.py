# config/urls.py
"""
Main URL Configuration for Youth Program Impact Visualizer
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Customize admin site
admin.site.site_header = "Youth Program Impact Visualizer Administration"
admin.site.site_title = "Youth Impact Admin"
admin.site.index_title = "Welcome to Youth Impact Visualizer"

from users.views import test_email_view


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include([
        path('auth/', include('users.urls')),  # ← This handles /api/v1/auth/
        path('users/', include('users.urls')),  # ← OR this for /api/v1/users/
        path('programs/', include('programs.urls')),
        path('participants/', include('participants.urls')),
        path('attendance/', include('attendance.urls')),
        path('', include('assessments.urls')),
        path('analytics/', include('analytics.urls')),
        path('reports/', include('reports.urls')),
        path('reports/', include('reports.urls')),
        path('api/v1/test-email/', test_email_view, name='test_email'),
    ])),
]

# Serve media and static files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # Django Debug Toolbar (optional)
    try:
        import debug_toolbar
        urlpatterns += [path('__debug__/', include(debug_toolbar.urls))]
    except ImportError:
        pass  
    
    