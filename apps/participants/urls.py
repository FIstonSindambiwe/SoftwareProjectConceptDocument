# apps/participants/urls.py
"""
URL Configuration for Participants App
Enhanced with Room management, Finish, Dropout, and Scholarship tracking
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ParticipantViewSet, EnrollmentViewSet, 
    ParticipantNoteViewSet, RoomViewSet
)

# Create router for participants app
router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'participants', ParticipantViewSet, basename='participant')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollment')
router.register(r'notes', ParticipantNoteViewSet, basename='participantnote')

app_name = 'participants'

urlpatterns = [
    path('', include(router.urls)),
]

"""
PARTICIPANTS APP ENDPOINTS
==========================

Rooms (Classrooms):
-------------------
GET    /rooms/                         - List all rooms
POST   /rooms/                         - Create room
GET    /rooms/{id}/                    - Get room details
PUT    /rooms/{id}/                    - Update room
PATCH  /rooms/{id}/                    - Partial update room
DELETE /rooms/{id}/                    - Delete room
GET    /rooms/{id}/participants/       - Get participants in room
POST   /rooms/{id}/assign_teacher/     - Assign teacher to room
GET    /rooms/stats/                   - Room statistics

Participants:
-------------
GET    /participants/                  - List all participants
POST   /participants/                  - Create participant (MUST assign to room)
GET    /participants/{id}/             - Get participant details
PUT    /participants/{id}/             - Update participant
PATCH  /participants/{id}/             - Partial update participant
DELETE /participants/{id}/             - Deactivate participant
GET    /participants/active/           - List active participants
GET    /participants/{id}/progress/    - Participant progress report
GET    /participants/{id}/enrollments/ - Participant enrollments
GET    /participants/stats/            - Participant statistics
POST   /participants/{id}/add_note/    - Add progress note
POST   /participants/{id}/upload_photo/         - Upload photo & generate face encoding
POST   /participants/{id}/update_face_encoding/ - Regenerate face encoding
GET    /participants/{id}/face_encoding_status/ - Check face recognition readiness

Enrollments:
------------
GET    /enrollments/                   - List all enrollments
POST   /enrollments/                   - Create enrollment
GET    /enrollments/{id}/              - Get enrollment details
PUT    /enrollments/{id}/              - Update enrollment
PATCH  /enrollments/{id}/              - Partial update enrollment
DELETE /enrollments/{id}/              - Delete enrollment
GET    /enrollments/stats/             - Enrollment statistics
POST   /enrollments/{id}/update_attendance/     - Recalculate attendance rate

**NEW: Program Completion Tracking**
POST   /enrollments/{id}/finish/       - Mark participant as finished (COMPLETED)
POST   /enrollments/{id}/dropout/      - Mark participant as dropped out
POST   /enrollments/{id}/award_scholarship/     - Award scholarship to participant

Participant Notes:
------------------
GET    /notes/                         - List all notes
POST   /notes/                         - Create note
GET    /notes/{id}/                    - Get note details
PUT    /notes/{id}/                    - Update note
PATCH  /notes/{id}/                    - Partial update note
DELETE /notes/{id}/                    - Delete note

========================================
DETAILED ENDPOINT DOCUMENTATION
========================================

1. CREATE ROOM
--------------
POST /rooms/

Body:
{
  "name": "Room A",
  "program": 1,
  "teacher": 5,        // optional - teacher user ID
  "capacity": 30,
  "schedule": "Mon-Fri 9AM-12PM",
  "description": "Beginner level class"
}

Response:
{
  "id": 1,
  "name": "Room A",
  "program": 1,
  "program_name": "Youth Leadership",
  "teacher": 5,
  "teacher_name": "John Doe",
  "capacity": 30,
  "current_enrollment_count": 0,
  "is_full": false,
  "available_spots": 30,
  "is_active": true
}

2. CREATE PARTICIPANT (WITH ROOM ASSIGNMENT)
--------------------------------------------
POST /participants/

Body:
{
  "first_name": "Sarah",
  "last_name": "Johnson",
  "age": 15,
  "gender": "F",
  "room": 1,                    // REQUIRED - must assign to room
  "enrollment_date": "2024-01-15",
  "education_level": "secondary",
  "photo_consent_given": true
}

Response:
{
  "id": 10,
  "participant_id": "YP-2024-A3B9C2",
  "first_name": "Sarah",
  "last_name": "Johnson",
  "full_name": "Sarah Johnson",
  "age": 15,
  "gender": "F",
  "room": 1,
  "room_name": "Room A",
  "assigned_teacher_name": "John Doe",
  "is_active": true
}

3. MARK AS FINISHED
-------------------
POST /enrollments/{id}/finish/

Body:
{
  "finish_date": "2024-12-31",  // optional - defaults to today
  "final_grade": "A"             // optional - A, B, C, D, F
}

Response:
{
  "success": true,
  "message": "Participant Sarah Johnson marked as finished",
  "enrollment": {
    "id": 5,
    "participant_id": "YP-2024-A3B9C2",
    "participant_name": "Sarah Johnson",
    "program_name": "Youth Leadership",
    "status": "completed",
    "has_finished": true,
    "finish_date": "2024-12-31",
    "final_grade": "A",
    "final_grade_display": "Excellent (A)",
    "outcome_status": "Completed Successfully"
  }
}

4. MARK AS DROPOUT
------------------
POST /enrollments/{id}/dropout/

Body:
{
  "dropout_date": "2024-06-15",  // optional
  "dropout_reason": "dropout_personal",  // required
  "dropout_notes": "Family relocation to another city"
}

Dropout Reason Options:
- completed: Successfully Completed Program
- dropout_personal: Dropout - Personal Reasons
- dropout_financial: Dropout - Financial Difficulties
- dropout_relocation: Dropout - Family Relocation
- dropout_health: Dropout - Health Issues
- dropout_behavior: Dropout - Behavioral Issues
- transferred: Transferred to Another Program
- scholarship: Received Scholarship for Further Education
- other: Other

Response:
{
  "success": true,
  "message": "Participant Sarah Johnson marked as dropped out",
  "enrollment": {
    "id": 5,
    "participant_id": "YP-2024-A3B9C2",
    "participant_name": "Sarah Johnson",
    "status": "dropped",
    "has_dropped_out": true,
    "dropout_date": "2024-06-15",
    "dropout_reason": "dropout_personal",
    "dropout_reason_display": "Dropout - Personal Reasons",
    "dropout_notes": "Family relocation to another city",
    "outcome_status": "Dropped Out - Dropout - Personal Reasons"
  }
}

5. AWARD SCHOLARSHIP
--------------------
POST /enrollments/{id}/award_scholarship/

Body:
{
  "scholarship_type": "full",           // required
  "scholarship_amount": 5000.00,        // optional
  "scholarship_provider": "ABC Foundation",
  "scholarship_date": "2024-08-01",     // optional
  "scholarship_notes": "Merit-based scholarship for outstanding performance"
}

Scholarship Type Options:
- full: Full Scholarship
- partial: Partial Scholarship
- merit: Merit-Based Scholarship
- need: Need-Based Scholarship
- vocational: Vocational Training Scholarship
- university: University Scholarship
- other: Other Scholarship

Response:
{
  "success": true,
  "message": "Scholarship awarded to Sarah Johnson",
  "enrollment": {
    "id": 5,
    "participant_id": "YP-2024-A3B9C2",
    "participant_name": "Sarah Johnson",
    "status": "scholarship",
    "has_scholarship": true,
    "scholarship_type": "full",
    "scholarship_type_display": "Full Scholarship",
    "scholarship_amount": "5000.00",
    "scholarship_provider": "ABC Foundation",
    "scholarship_date": "2024-08-01",
    "scholarship_notes": "Merit-based scholarship",
    "outcome_status": "Scholarship Awarded - Full Scholarship"
  }
}

6. ASSIGN TEACHER TO ROOM
-------------------------
POST /rooms/{id}/assign_teacher/

Body:
{
  "teacher_id": 5
}

Response:
{
  "id": 1,
  "name": "Room A",
  "teacher": 5,
  "teacher_name": "John Doe",
  "current_enrollment_count": 15,
  "available_spots": 15
}

7. GET ROOM PARTICIPANTS
------------------------
GET /rooms/{id}/participants/

Response:
{
  "room_name": "Room A",
  "teacher": "John Doe",
  "capacity": 30,
  "current_count": 15,
  "available_spots": 15,
  "participants": [
    {
      "id": 10,
      "participant_id": "YP-2024-A3B9C2",
      "full_name": "Sarah Johnson",
      "age": 15,
      "gender_display": "Female",
      "is_active": true
    },
    ...
  ]
}

8. GET ENROLLMENT STATISTICS
----------------------------
GET /enrollments/stats/

Response:
{
  "total_enrollments": 150,
  "enrollments_by_status": {
    "enrolled": 30,
    "active": 50,
    "completed": 40,
    "dropped": 20,
    "transferred": 5,
    "scholarship": 5
  },
  "finished_count": 40,
  "dropout_count": 20,
  "scholarship_count": 5,
  "average_attendance_rate": 87.5,
  "completion_rate": 26.67,
  "dropout_rate": 13.33,
  "scholarship_rate": 3.33
}

========================================
QUERY PARAMETERS
========================================

Rooms:
?program={id}         - Filter by program
?teacher={id}         - Filter by teacher
?is_active={bool}     - Filter by active status
?search={query}       - Search name, program name, teacher name
?ordering={field}     - Order results (e.g., name, -capacity)

Participants:
?room={id}            - Filter by room
?gender={M|F|O|N}     - Filter by gender
?is_active={bool}     - Filter by active status
?age_min={number}     - Minimum age
?age_max={number}     - Maximum age
?search={query}       - Search participant_id, first_name, last_name
?ordering={field}     - Order results

Enrollments:
?participant={id}     - Filter by participant
?program={id}         - Filter by program
?status={status}      - Filter by status
?has_finished={bool}  - Filter finished programs
?has_dropped_out={bool} - Filter dropouts
?has_scholarship={bool} - Filter scholarship recipients
?search={query}       - Search participant name, ID, program name
?ordering={field}     - Order results

========================================
KEY FEATURES
========================================

✅ Room Management:
   - Every participant MUST belong to a room
   - Each room has an assigned teacher
   - Room capacity tracking
   - Prevent deletion if participants assigned

✅ Program Completion Tracking:
   - Mark as finished (with optional grade)
   - Track dropout with reason
   - Award scholarships with details
   - Comprehensive outcome reporting

✅ Teacher Assignment:
   - Teachers assigned at room level
   - All participants in room share same teacher
   - Easy bulk teacher management

✅ Statistics & Reporting:
   - Completion rates
   - Dropout rates
   - Scholarship awards
   - Room utilization
   - Teacher workload

✅ Data Integrity:
   - Participants must be in rooms
   - Rooms must belong to programs
   - Cannot delete rooms with participants
   - Validation for finish/dropout dates

========================================
BUSINESS RULES
========================================

1. Every participant MUST be assigned to a room
2. A room belongs to one program
3. A room has one assigned teacher
4. Participants can:
   - Finish successfully (with grade)
   - Drop out (with reason)
   - Receive scholarship (with details)
5. Cannot delete room if participants are assigned
6. Participant's room must match their enrollment program
7. Room capacity is enforced on participant creation

"""