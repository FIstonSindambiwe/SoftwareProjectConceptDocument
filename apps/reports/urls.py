# apps/reports/urls.py
"""
URL Configuration for Reports App
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportTemplateViewSet, GeneratedReportViewSet

# Create router for reports app
router = DefaultRouter()
router.register(r'templates', ReportTemplateViewSet, basename='template')
router.register(r'generated', GeneratedReportViewSet, basename='generated')

app_name = 'reports'

urlpatterns = [
    path('', include(router.urls)),
]

"""
Reports App Endpoints:
----------------------
Report Templates:
  GET    /reports/templates/                     - List all report templates
  POST   /reports/templates/                     - Create template (admin only)
  GET    /reports/templates/{id}/                - Get template details
  PUT    /reports/templates/{id}/                - Update template (admin only)
  PATCH  /reports/templates/{id}/                - Partial update template
  DELETE /reports/templates/{id}/                - Delete template (admin only)
  GET    /reports/templates/active/              - List active templates

Generated Reports:
  GET    /reports/generated/                     - List all generated reports
  POST   /reports/generated/generate/            - Generate new report
  GET    /reports/generated/{id}/                - Get report details
  DELETE /reports/generated/{id}/                - Delete report
  GET    /reports/generated/{id}/download/       - Download report file

Generate Report Request Body:
{
  "template_id": 1,
  "program_id": 1,                    // Optional
  "date_from": "2024-01-01",          // Optional
  "date_to": "2024-06-30",            // Optional
  "include_demographics": true,       // Optional, default: true
  "include_attendance": true,         // Optional, default: true
  "include_assessments": true         // Optional, default: true
}

Available Template Types:
  - donor_quarterly         - Donor Quarterly Report
  - program_summary         - Program Summary
  - impact_assessment       - Impact Assessment
  - participant_progress    - Participant Progress Report
  - attendance_report       - Attendance Report

Available File Formats:
  - pdf                     - PDF Document
  - excel                   - Excel Spreadsheet

Example Usage:
--------------
# List all templates
GET /reports/templates/

# Generate a donor quarterly report
POST /reports/generated/generate/
{
  "template_id": 1,
  "program_id": 5,
  "date_from": "2024-01-01",
  "date_to": "2024-03-31"
}

# Download generated report
GET /reports/generated/123/download/

Query Parameters:
  ?template={id}          - Filter generated reports by template
  ?program={id}           - Filter generated reports by program
  ?generated_by={user_id} - Filter by who generated the report
  ?is_active={true|false} - Filter templates by active status
  ?file_format={pdf|excel} - Filter templates by file format
"""