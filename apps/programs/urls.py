# apps/programs/urls.py
"""
URL Configuration for Programs App
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LocationViewSet, ProgramViewSet, ProgramMilestoneViewSet

# Create router for programs app
router = DefaultRouter()
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'programs', ProgramViewSet, basename='program')
router.register(r'milestones', ProgramMilestoneViewSet, basename='milestone')

app_name = 'programs'

urlpatterns = [
    path('', include(router.urls)),
]

"""
Programs App Endpoints:
-----------------------
Locations:
  GET    /programs/locations/                    - List all locations
  POST   /programs/locations/                    - Create location
  GET    /programs/locations/{id}/               - Get location details
  PUT    /programs/locations/{id}/               - Update location
  PATCH  /programs/locations/{id}/               - Partial update location
  DELETE /programs/locations/{id}/               - Delete location
  GET    /programs/locations/active/             - List active locations
  GET    /programs/locations/{id}/programs/      - Programs at this location
  GET    /programs/locations/stats/              - Location statistics

Programs:
  GET    /programs/programs/                     - List all programs
  POST   /programs/programs/                     - Create program
  GET    /programs/programs/{id}/                - Get program details
  PUT    /programs/programs/{id}/                - Update program
  PATCH  /programs/programs/{id}/                - Partial update program
  DELETE /programs/programs/{id}/                - Delete program
  GET    /programs/programs/active/              - List active programs
  GET    /programs/programs/ongoing/             - List ongoing programs
  GET    /programs/programs/{id}/summary/        - Program summary with metrics
  GET    /programs/programs/{id}/participants/   - Participants in program
  GET    /programs/programs/stats/               - Program statistics
  POST   /programs/programs/{id}/add_milestone/  - Add milestone to program

Milestones:
  GET    /programs/milestones/                   - List all milestones
  POST   /programs/milestones/                   - Create milestone
  GET    /programs/milestones/{id}/              - Get milestone details
  PUT    /programs/milestones/{id}/              - Update milestone
  PATCH  /programs/milestones/{id}/              - Partial update milestone
  DELETE /programs/milestones/{id}/              - Delete milestone
  POST   /programs/milestones/{id}/complete/     - Mark milestone as completed
  GET    /programs/milestones/overdue/           - Get overdue milestones
"""