# apps/attendance/urls.py (updated)
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AttendanceRecordViewSet, AttendanceSessionViewSet

app_name = 'attendance'

router = DefaultRouter()
router.register(r'records', AttendanceRecordViewSet, basename='attendancerecord')
router.register(r'sessions', AttendanceSessionViewSet, basename='attendancesession')

# Get the viewset instance to manually add custom endpoints
attendance_viewset = AttendanceRecordViewSet.as_view({
    'post': 'identify_and_record'
})

face_verify_viewset = AttendanceRecordViewSet.as_view({
    'post': 'face_verify'
})

urlpatterns = [
    path('', include(router.urls)),
    
    # Manually add custom endpoints with correct HTTP method mapping
    path('records/identify-and-record/', 
         attendance_viewset, 
         name='attendancerecord-identify-and-record'),
    
    path('records/face-verify/', 
         face_verify_viewset, 
         name='attendancerecord-face-verify'),
]

