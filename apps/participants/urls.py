# apps/participants/urls.py
"""
URL Configuration for Participants App
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ParticipantViewSet, EnrollmentViewSet, ParticipantNoteViewSet

# Create router for participants app
router = DefaultRouter()
router.register(r'participants', ParticipantViewSet, basename='participant')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollment')
router.register(r'notes', ParticipantNoteViewSet, basename='participantnote')

app_name = 'participants'

urlpatterns = [
    path('', include(router.urls)),
]

"""
Participants App Endpoints:
---------------------------
Participants:
  GET    /participants/participants/                    - List all participants
  POST   /participants/participants/                    - Create participant
  GET    /participants/participants/{id}/               - Get participant details
  PUT    /participants/participants/{id}/               - Update participant
  PATCH  /participants/participants/{id}/               - Partial update participant
  DELETE /participants/participants/{id}/               - Deactivate participant
  GET    /participants/participants/active/             - List active participants
  GET    /participants/participants/{id}/progress/      - Participant progress report
  GET    /participants/participants/{id}/enrollments/   - Participant enrollments
  GET    /participants/participants/stats/              - Participant statistics
  POST   /participants/participants/{id}/add_note/      - Add progress note
  POST   /participants/participants/{id}/upload_photo/  - Upload photo & generate face encoding
  POST   /participants/participants/{id}/update_face_encoding/ - Regenerate face encoding
  GET    /participants/participants/{id}/face_encoding_status/ - Check face recognition readiness

Face Recognition Management:
  POST   /participants/participants/{id}/upload_photo/
         Body (multipart/form-data):
           - photo: file (participant photo)
           - photo_consent_given: bool (default: true)
         Returns: Photo uploaded + face encoding generated
  
  POST   /participants/participants/{id}/update_face_encoding/
         Regenerates face encoding from existing photo
         Returns: Updated encoding info
  
  GET    /participants/participants/{id}/face_encoding_status/
         Returns: {
           has_photo, has_encoding, photo_consent_given,
           encoding_date, can_use_face_recognition
         }

Enrollments:
  GET    /participants/enrollments/                     - List all enrollments
  POST   /participants/enrollments/                     - Create enrollment
  GET    /participants/enrollments/{id}/                - Get enrollment details
  PUT    /participants/enrollments/{id}/                - Update enrollment
  PATCH  /participants/enrollments/{id}/                - Partial update enrollment
  DELETE /participants/enrollments/{id}/                - Delete enrollment
  POST   /participants/enrollments/{id}/complete/       - Mark enrollment as completed
  POST   /participants/enrollments/{id}/dropout/        - Mark participant as dropped out
  POST   /participants/enrollments/{id}/update_attendance/ - Recalculate attendance rate
  GET    /participants/enrollments/stats/               - Enrollment statistics

Participant Notes:
  GET    /participants/notes/                           - List all notes
  POST   /participants/notes/                           - Create note
  GET    /participants/notes/{id}/                      - Get note details
  PUT    /participants/notes/{id}/                      - Update note
  PATCH  /participants/notes/{id}/                      - Partial update note
  DELETE /participants/notes/{id}/                      - Delete note
"""