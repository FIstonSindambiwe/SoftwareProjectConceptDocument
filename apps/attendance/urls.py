# attendance/urls.py
"""
Attendance Management URLs

Endpoints for managing attendance records and sessions with face recognition support.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AttendanceRecordViewSet, AttendanceSessionViewSet

app_name = 'attendance'

router = DefaultRouter()
router.register(r'records', AttendanceRecordViewSet, basename='attendancerecord')
router.register(r'sessions', AttendanceSessionViewSet, basename='attendancesession')

urlpatterns = [
    path('', include(router.urls)),
]

"""
ATTENDANCE APP ENDPOINTS
========================

Attendance Records:
-------------------
GET    /records/                       - List all attendance records
POST   /records/                       - Create attendance record
GET    /records/{id}/                  - Retrieve attendance details
PUT    /records/{id}/                  - Update attendance
PATCH  /records/{id}/                  - Partial update attendance
DELETE /records/{id}/                  - Delete attendance
POST   /records/bulk-record/           - Record attendance for multiple participants
GET    /records/stats/                 - Get attendance statistics
POST   /records/face-verify/           - Verify attendance using face recognition
POST   /records/identify-and-record/   - Identify participant and record attendance

Attendance Sessions:
--------------------
GET    /sessions/                      - List all sessions
POST   /sessions/                      - Create session
GET    /sessions/{id}/                 - Retrieve session details
PUT    /sessions/{id}/                 - Update session
PATCH  /sessions/{id}/                 - Partial update session
DELETE /sessions/{id}/                 - Delete session
POST   /sessions/{id}/complete/        - Mark session as completed
POST   /sessions/{id}/cancel/          - Cancel session
GET    /sessions/{id}/attendance/      - Get attendance records for session

Endpoint Details:
-----------------

1. Bulk Record Attendance:
   POST /records/bulk-record/
   
   Body:
   {
     "program": 1,
     "date": "2024-02-04",
     "session_name": "Morning Session",
     "attendance_records": [
       {"participant_id": "YP-2024-001", "present": true},
       {"participant_id": "YP-2024-002", "present": false}
     ]
   }
   
   Response:
   {
     "created_count": 2,
     "records": [...],
     "errors": []
   }

2. Get Attendance Statistics:
   GET /records/stats/?program=1&date_from=2024-01-01&date_to=2024-02-04
   
   Response:
   {
     "total_records": 150,
     "present_count": 138,
     "absent_count": 12,
     "attendance_rate": 92.0,
     "face_verified_count": 45,
     "average_confidence_score": 0.95
   }

3. Face Verification:
   POST /records/face-verify/
   Content-Type: multipart/form-data
   
   Body:
   - participant_id: "YP-2024-001"
   - program: 1
   - date: "2024-02-04"
   - session_name: "Morning Session"
   - image: <file>
   
   Response (Success):
   {
     "verified": true,
     "confidence": 0.95,
     "attendance": {
       "id": 123,
       "participant": {...},
       "present": true,
       "verified_by_face": true,
       ...
     },
     "message": "Attendance verified successfully"
   }
   
   Response (Failure):
   {
     "verified": false,
     "confidence": 0.45,
     "message": "Face verification failed - identity could not be confirmed",
     "threshold": 0.6
   }

4. Identify and Record:
   POST /records/identify-and-record/
   Content-Type: multipart/form-data
   
   Body:
   - program: 1
   - date: "2024-02-04"
   - session_name: "Morning Session"
   - image: <file>
   
   Response (Success):
   {
     "identified": true,
     "participant_id": "YP-2024-001",
     "confidence": 0.92,
     "attendance": {...},
     "message": "Participant YP-2024-001 identified and attendance recorded"
   }
   
   Response (Failure):
   {
     "identified": false,
     "message": "Could not identify participant with sufficient confidence",
     "confidence": 0.45,
     "top_matches": [
       {"participant_id": "YP-2024-002", "confidence": 0.45},
       {"participant_id": "YP-2024-003", "confidence": 0.38}
     ]
   }

5. Complete Session:
   POST /sessions/{id}/complete/
   
   Response:
   {
     "id": 5,
     "session_name": "Morning Session",
     "is_completed": true,
     ...
   }

6. Cancel Session:
   POST /sessions/{id}/cancel/
   
   Body:
   {
     "reason": "Facilitator unavailable"
   }
   
   Response:
   {
     "id": 5,
     "is_cancelled": true,
     "cancellation_reason": "Facilitator unavailable",
     ...
   }

7. Get Session Attendance:
   GET /sessions/{id}/attendance/
   
   Response:
   [
     {
       "id": 101,
       "participant": {...},
       "present": true,
       "date": "2024-02-04",
       ...
     },
     ...
   ]

Query Parameters:
-----------------
Records:
?program={id}              - Filter by program
?participant={id}          - Filter by participant
?present={true|false}      - Filter by presence
?date={YYYY-MM-DD}         - Filter by date
?date_from={YYYY-MM-DD}    - From date
?date_to={YYYY-MM-DD}      - To date
?verified_by_face={true|false} - Filter face-verified records
?search={query}            - Search participant ID, program, session
?ordering={field}          - Order results (e.g., -date, participant__participant_id)

Sessions:
?program={id}              - Filter by program
?is_completed={true|false} - Filter completed sessions
?is_cancelled={true|false} - Filter cancelled sessions
?search={query}            - Search session name, program name
?ordering={field}          - Order results (e.g., -session_date)

Face Recognition Features:
--------------------------
The attendance system includes advanced face recognition capabilities:

1. Face Verification: Verify a specific participant's identity
   - Requires stored face data for the participant
   - Returns confidence score (0-1)
   - Automatically records attendance if verified

2. Face Identification: Identify unknown participant from photo
   - Searches all participants in the program
   - Returns top matches with confidence scores
   - Records attendance for identified participant

3. Confidence Thresholds:
   - Verification: Typically 0.6 (60%)
   - Identification: Typically 0.7 (70%)
   - Configurable in face_recognition_service.py

Use Cases:
----------

1. Manual Attendance:
   POST /records/bulk-record/
   (Batch record for entire class)

2. Face Recognition Check-in:
   POST /records/identify-and-record/
   (Take photo at entrance, auto-identify and record)

3. Verify Specific Participant:
   POST /records/face-verify/
   (Confirm identity of participant claiming to be someone)

4. Session Management:
   POST /sessions/
   POST /sessions/{id}/complete/
   GET /sessions/{id}/attendance/

5. Attendance Analysis:
   GET /records/stats/
   (Generate attendance reports and metrics)

Error Responses:
----------------
400 Bad Request:
{
  "error": "Missing required fields: participant_id, program, date, image"
}

404 Not Found:
{
  "error": "Participant YP-2024-999 not found"
}

{
  "error": "Program 999 not found"
}

Permissions:
------------
- All endpoints: IsAuthenticated
- Create/Update/Delete: CanEditData permission
- Donors: Read-only access (IsDonorReadOnly)
- Face verification endpoints: CanEditData

Security Considerations:
------------------------
- Face images should be encrypted in transit (HTTPS required)
- Face encodings are stored securely, not raw images
- Confidence scores are logged for audit purposes
- Failed verification attempts should be monitored
- Consider GDPR/privacy compliance for biometric data

Related Models:
---------------
- AttendanceRecord: Individual attendance entries
- AttendanceSession: Scheduled sessions/classes
- Participant: Youth participants (required for attendance)
- Program: Programs running sessions

Note: Face recognition requires the face_recognition_service.py module
and participants must have face encodings stored in their profiles.
"""