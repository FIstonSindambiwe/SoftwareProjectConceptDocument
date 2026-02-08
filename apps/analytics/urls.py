# apps/analytics/urls.py
"""
Analytics & Dashboard URLs

Endpoints for analytics, trends, comparisons, and dashboard data.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnalyticsViewSet

app_name = 'analytics'

router = DefaultRouter()
router.register(r'analytics', AnalyticsViewSet, basename='analytics')

urlpatterns = [
    path('', include(router.urls)),
]

"""
ANALYTICS APP ENDPOINTS
========================

Analytics & Dashboard:
----------------------
GET    /analytics/overview/           - Get program overview with KPIs
GET    /analytics/trends/              - Get trend analysis for indicators
GET    /analytics/compare/             - Compare multiple programs
GET    /analytics/dashboard/           - Get overall dashboard statistics

Endpoint Details:
-----------------

1. Program Overview:
   GET /analytics/overview/
   
   Query Parameters:
   - program (required): Program ID
   - date_from (optional): Start date (YYYY-MM-DD)
   - date_to (optional): End date (YYYY-MM-DD)
   
   Example:
   GET /analytics/overview/?program=1&date_from=2024-01-01&date_to=2024-12-31
   
   Response:
   {
     "program_id": 1,
     "program_name": "Youth Leadership Program",
     "total_participants": 45,
     "active_participants": 42,
     "completion_rate": 85.5,
     "attendance_rate": 92.3,
     "average_performance": 78.5,
     "kpi_summary": {
       "reading_score": {
         "average": 82.0,
         "min": 45.0,
         "max": 98.0,
         "trend": "increasing"
       },
       "math_score": {
         "average": 75.0,
         "min": 40.0,
         "max": 95.0,
         "trend": "stable"
       }
     },
     "milestones_achieved": 23,
     "recent_achievements": [...]
   }

2. Trend Analysis:
   GET /analytics/trends/
   
   Query Parameters:
   - indicator (required): Indicator ID
   - program (optional): Filter by program
   - period (optional): Time period (1month, 3months, 6months, 1year, all)
                        Default: 6months
   
   Example:
   GET /analytics/trends/?indicator=1&program=1&period=6months
   
   Response:
   {
     "indicator_id": 1,
     "indicator_name": "Reading Comprehension Score",
     "period": "6months",
     "data_points": [
       {
         "date": "2024-01-01",
         "average_value": 72.5,
         "min_value": 45.0,
         "max_value": 95.0,
         "participant_count": 45
       },
       {
         "date": "2024-02-01",
         "average_value": 75.2,
         "min_value": 48.0,
         "max_value": 96.0,
         "participant_count": 46
       },
       ...
     ],
     "trend": "increasing",
     "percentage_change": 12.5,
     "statistical_significance": "high"
   }

3. Program Comparison:
   GET /analytics/compare/
   
   Query Parameters:
   - programs (required): Comma-separated program IDs
   
   Example:
   GET /analytics/compare/?programs=1,2,3
   
   Response:
   [
     {
       "program_id": 1,
       "program_name": "Youth Leadership Program",
       "location": "Kigali",
       "total_participants": 45,
       "active_participants": 42,
       "completion_rate": 85.5,
       "attendance_rate": 92.3,
       "average_performance": 78.5,
       "budget_utilization": 87.2,
       "cost_per_participant": 450.00
     },
     {
       "program_id": 2,
       "program_name": "Tech Skills Training",
       "location": "Musanze",
       "total_participants": 38,
       "active_participants": 35,
       "completion_rate": 88.2,
       "attendance_rate": 89.5,
       "average_performance": 82.1,
       "budget_utilization": 92.5,
       "cost_per_participant": 520.00
     },
     {
       "program_id": 3,
       "program_name": "Arts & Culture",
       "location": "Huye",
       "total_participants": 52,
       "active_participants": 48,
       "completion_rate": 82.8,
       "attendance_rate": 94.1,
       "average_performance": 75.3,
       "budget_utilization": 78.9,
       "cost_per_participant": 380.00
     }
   ]

4. Dashboard Overview:
   GET /analytics/dashboard/
   
   No parameters required.
   
   Response:
   {
     "overview": {
       "total_programs": 12,
       "total_participants": 485,
       "active_enrollments": 452
     },
     "recent_programs": [
       {
         "id": 5,
         "name": "Youth Leadership Program",
         "location__name": "Kigali",
         "start_date": "2024-01-15"
       },
       {
         "id": 4,
         "name": "Tech Skills Training",
         "location__name": "Musanze",
         "start_date": "2024-01-10"
       },
       ...
     ]
   }

Common Query Parameters:
------------------------
All analytics endpoints support:
- date_from: Filter from date (YYYY-MM-DD)
- date_to: Filter to date (YYYY-MM-DD)
- program: Filter by program ID
- location: Filter by location ID

Period Options (for trends):
----------------------------
- 1month: Last 30 days
- 3months: Last 90 days
- 6months: Last 180 days (default)
- 1year: Last 365 days
- all: All available data

Use Cases:
----------

1. Program Manager Dashboard:
   GET /analytics/dashboard/
   GET /analytics/overview/?program=1

2. Monitor Indicator Progress:
   GET /analytics/trends/?indicator=1&period=6months

3. Compare Program Performance:
   GET /analytics/compare/?programs=1,2,3

4. Donor Reporting:
   GET /analytics/overview/?program=1&date_from=2024-01-01&date_to=2024-03-31
   GET /analytics/trends/?indicator=1&program=1&period=1year

5. Strategic Planning:
   GET /analytics/compare/?programs=1,2,3,4,5
   GET /analytics/trends/?indicator=1&period=all

Response Time Considerations:
------------------------------
- Dashboard: Fast (< 500ms)
- Overview: Medium (< 2s)
- Trends: Medium (< 2s)
- Compare: Slower for many programs (< 5s for 10 programs)

For large datasets, consider:
- Limiting date ranges
- Using caching
- Implementing pagination for comparison results

Error Responses:
----------------
400 Bad Request:
{
  "error": "program parameter is required"
}

{
  "error": "indicator parameter is required"
}

{
  "error": "programs parameter is required (comma-separated IDs)"
}

404 Not Found:
{
  "detail": "Program not found"
}

Permissions:
------------
- All endpoints: IsAuthenticated
- Donors can only access programs they have visibility to
- Admins and Program Managers can access all programs

Data Aggregation:
-----------------
Analytics data is aggregated from:
- Participants (enrollment, demographics)
- Measurements (KPI values)
- Attendance Records (attendance rates)
- Milestones (achievements)
- Goals (progress tracking)

The analytics service handles:
- Data filtering and aggregation
- Trend calculation
- Statistical analysis
- Performance comparisons

Related Endpoints:
------------------
- /programs/ - Base program data
- /participants/stats/ - Participant statistics
- /indicators/{id}/stats/ - Indicator statistics
- /attendance-records/stats/ - Attendance statistics

Note: Analytics data may be cached for performance.
Cache TTL is typically 5-15 minutes depending on endpoint.
"""