# apps/assessments/urls.py
"""
URL Configuration for Assessments App
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IndicatorViewSet, AssessmentViewSet

app_name = 'assessments'

# Create router for assessments app
router = DefaultRouter()
router.register(r'indicators', IndicatorViewSet, basename='indicator')
router.register(r'assessments', AssessmentViewSet, basename='assessment')

urlpatterns = [
    path('', include(router.urls)),
]

"""
ASSESSMENTS APP ENDPOINTS
=========================

Indicators (KPIs):
------------------
GET    /indicators/                    - List all indicators
POST   /indicators/                    - Create indicator
GET    /indicators/{id}/               - Get indicator details
PUT    /indicators/{id}/               - Update indicator
PATCH  /indicators/{id}/               - Partial update indicator
DELETE /indicators/{id}/               - Delete indicator
GET    /indicators/active/             - List active indicators only
GET    /indicators/{id}/assessments/   - Get assessments for this indicator

Assessments:
------------
GET    /assessments/                   - List all assessments
POST   /assessments/                   - Create assessment
GET    /assessments/{id}/              - Get assessment details
PUT    /assessments/{id}/              - Update assessment
PATCH  /assessments/{id}/              - Partial update assessment
DELETE /assessments/{id}/              - Delete assessment
GET    /assessments/stats/             - Get assessment statistics

Endpoint Details:
-----------------

1. List Active Indicators:
   GET /indicators/active/
   
   Response:
   [
     {
       "id": 1,
       "name": "Reading Level",
       "category": "academic",
       "category_display": "Academic Skills",
       "measurement_type": "scale_1_10",
       "measurement_type_display": "Scale (1-10)",
       "min_value": 1.0,
       "max_value": 10.0,
       "is_active": true
     },
     ...
   ]

2. Create Assessment:
   POST /assessments/
   
   Body:
   {
     "participant": 1,
     "program": 1,
     "indicator": 1,
     "assessment_date": "2024-02-04",
     "score": 7.5,
     "assessment_type": "progress",
     "notes": "Good improvement in reading comprehension"
   }
   
   Response:
   {
     "id": 123,
     "participant": 1,
     "participant_id": "YP-2024-001",
     "program": 1,
     "program_name": "Youth Leadership Program",
     "indicator": 1,
     "indicator_name": "Reading Level",
     "indicator_category": "Academic Skills",
     "assessment_date": "2024-02-04",
     "score": 7.5,
     "assessment_type": "progress",
     "assessment_type_display": "Progress Check",
     "notes": "Good improvement in reading comprehension",
     "assessed_by": 5,
     "assessed_by_name": "John Teacher",
     "created_at": "2024-02-04T10:30:00Z",
     "updated_at": "2024-02-04T10:30:00Z"
   }

3. Get Assessment Statistics:
   GET /assessments/stats/?program=1&indicator=1
   
   Response:
   {
     "total_assessments": 150,
     "average_score": 7.2,
     "min_score": 3.0,
     "max_score": 9.5,
     "by_type": {
       "baseline": 30,
       "progress": 80,
       "midterm": 25,
       "final": 15
     },
     "by_indicator": [
       {
         "indicator__name": "Reading Level",
         "count": 45,
         "avg_score": 7.5
       },
       {
         "indicator__name": "Math Skills",
         "count": 42,
         "avg_score": 6.8
       },
       ...
     ]
   }

4. Get Indicator's Assessments:
   GET /indicators/1/assessments/
   
   Response:
   [
     {
       "id": 101,
       "participant_id": "YP-2024-001",
       "indicator_name": "Reading Level",
       "assessment_date": "2024-02-01",
       "score": 7.5,
       "assessment_type": "progress"
     },
     ...
   ]

Query Parameters:
-----------------
Indicators:
?category={category}         - Filter by category (academic, social, physical, etc.)
?measurement_type={type}     - Filter by measurement type
?is_active={true|false}      - Filter by active status
?search={query}              - Search name and description
?ordering={field}            - Order results (e.g., name, -created_at)

Assessments:
?program={id}                - Filter by program
?participant={id}            - Filter by participant
?indicator={id}              - Filter by indicator
?assessment_type={type}      - Filter by type (baseline, progress, midterm, final)
?date_from={YYYY-MM-DD}      - Filter from date
?date_to={YYYY-MM-DD}        - Filter to date
?search={query}              - Search participant ID, indicator name
?ordering={field}            - Order results (e.g., -assessment_date, score)

Available Categories:
---------------------
- academic      - Academic Skills
- social        - Social-Emotional Development
- physical      - Physical Development
- vocational    - Vocational Skills
- life_skills   - Life Skills
- other         - Other

Available Measurement Types:
----------------------------
- scale_1_10    - Scale (1-10)
- scale_1_5     - Scale (1-5)
- percentage    - Percentage (0-100)
- binary        - Pass/Fail
- score         - Raw Score

Assessment Types:
-----------------
- baseline      - Initial assessment
- progress      - Ongoing progress check
- midterm       - Mid-program assessment
- final         - Final assessment

Use Cases:
----------

1. Track Participant Progress:
   GET /assessments/?participant=1&ordering=-assessment_date
   
2. Compare Program Performance:
   GET /assessments/stats/?program=1
   GET /assessments/stats/?program=2
   
3. Monitor Specific Indicator:
   GET /indicators/1/assessments/
   GET /assessments/stats/?indicator=1
   
4. Baseline to Final Comparison:
   GET /assessments/?participant=1&indicator=1&assessment_type=baseline
   GET /assessments/?participant=1&indicator=1&assessment_type=final

Validation:
-----------
- Score must be within indicator's min_value and max_value range
- Assessment date cannot be in the future
- Participant must be enrolled in the specified program
- Indicator must be active

Error Responses:
----------------
400 Bad Request:
{
  "score": ["Score must be between 1.0 and 10.0"]
}

404 Not Found:
{
  "detail": "Not found."
}

Permissions:
------------
- List/Retrieve: IsAuthenticated
- Create/Update/Delete: CanEditData permission
- Donors: Read-only access (IsDonorReadOnly)
- Statistics: IsAuthenticated

Related Endpoints:
------------------
- /participants/ - Participant management
- /programs/ - Program management
- /analytics/ - Advanced analytics and trends
"""