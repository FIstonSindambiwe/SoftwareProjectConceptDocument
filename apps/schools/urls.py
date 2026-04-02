# apps/schools/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SchoolViewSet, StudentViewSet

router = DefaultRouter()
router.register(r'', SchoolViewSet, basename='school')
router.register(r'students', StudentViewSet, basename='student')

urlpatterns = [
    path('', include(router.urls)),
]