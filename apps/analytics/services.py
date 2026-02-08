# apps/analytics/services.py
"""
Business logic for analytics calculations and dashboard data
"""
from django.db.models import Count, Avg, Q, F, Sum
from django.utils import timezone
from datetime import timedelta
from programs.models import Program
from participants.models import Participant, Enrollment
from attendance.models import AttendanceRecord
from assessments.models import Assessment, Indicator


class AnalyticsService:
    """
    Service class for calculating analytics and KPIs
    """
    
    @staticmethod
    def get_program_overview(program_id, date_from=None, date_to=None):
        """
        Get comprehensive overview of a program's performance
        """
        program = Program.objects.get(id=program_id)
        enrollments = program.enrollments.all()
        
        if date_from:
            enrollments = enrollments.filter(enrollment_date__gte=date_from)
        if date_to:
            enrollments = enrollments.filter(enrollment_date__lte=date_to)
        
        total_enrolled = enrollments.count()
        
        return {
            'program': {
                'id': program.id,
                'name': program.name,
                'location': program.location.name,
                'status': program.status,
            },
            'enrollment': {
                'total_participants': total_enrolled,
                'active_participants': enrollments.filter(status='active').count(),
                'completed': enrollments.filter(status='completed').count(),
                'dropped': enrollments.filter(status='dropped').count(),
                'completion_rate': round(
                    (enrollments.filter(status='completed').count() / total_enrolled * 100)
                    if total_enrolled > 0 else 0, 2
                ),
            },
            'demographics': AnalyticsService._get_demographics(enrollments),
            'attendance': AnalyticsService._get_attendance_stats(program, date_from, date_to),
            'performance': AnalyticsService._get_performance_stats(program, date_from, date_to),
        }
    
    @staticmethod
    def _get_demographics(enrollments):
        """Calculate demographic breakdowns"""
        participants = Participant.objects.filter(
            enrollments__in=enrollments
        ).distinct()
        
        gender_dist = participants.values('gender').annotate(
            count=Count('id')
        )
        
        age_ranges = {
            '5-9': participants.filter(age__gte=5, age__lte=9).count(),
            '10-14': participants.filter(age__gte=10, age__lte=14).count(),
            '15-18': participants.filter(age__gte=15, age__lte=18).count(),
            '19-22': participants.filter(age__gte=19, age__lte=22).count(),
            '23-25': participants.filter(age__gte=23, age__lte=25).count(),
        }
        
        return {
            'gender_distribution': {
                item['gender']: item['count'] for item in gender_dist
            },
            'age_distribution': age_ranges,
        }
    
    @staticmethod
    def _get_attendance_stats(program, date_from=None, date_to=None):
        """Calculate attendance statistics"""
        attendance_records = AttendanceRecord.objects.filter(program=program)
        
        if date_from:
            attendance_records = attendance_records.filter(date__gte=date_from)
        if date_to:
            attendance_records = attendance_records.filter(date__lte=date_to)
        
        total_records = attendance_records.count()
        present_records = attendance_records.filter(present=True).count()
        
        return {
            'total_sessions': attendance_records.values('date').distinct().count(),
            'total_records': total_records,
            'average_attendance_rate': round(
                (present_records / total_records * 100) if total_records > 0 else 0, 2
            ),
        }
    
    @staticmethod
    def _get_performance_stats(program, date_from=None, date_to=None):
        """Calculate performance metrics based on assessments"""
        assessments = Assessment.objects.filter(program=program)
        
        if date_from:
            assessments = assessments.filter(assessment_date__gte=date_from)
        if date_to:
            assessments = assessments.filter(assessment_date__lte=date_to)
        
        indicator_stats = assessments.values(
            'indicator__name', 'indicator__category'
        ).annotate(
            average_score=Avg('score'),
            count=Count('id')
        ).order_by('indicator__category')
        
        return {
            'total_assessments': assessments.count(),
            'indicators': list(indicator_stats),
        }
    
    @staticmethod
    def get_trend_data(indicator_id, program_id=None, period='6months'):
        """
        Get time series data for an indicator
        """
        end_date = timezone.now().date()
        
        if period == '3months':
            start_date = end_date - timedelta(days=90)
        elif period == '6months':
            start_date = end_date - timedelta(days=180)
        elif period == '1year':
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=180)
        
        assessments = Assessment.objects.filter(
            indicator_id=indicator_id,
            assessment_date__gte=start_date,
            assessment_date__lte=end_date
        )
        
        if program_id:
            assessments = assessments.filter(program_id=program_id)
        
        # Group by month
        monthly_data = assessments.extra(
            select={'month': "DATE_TRUNC('month', assessment_date)"}
        ).values('month').annotate(
            average_score=Avg('score'),
            count=Count('id')
        ).order_by('month')
        
        return {
            'indicator': Indicator.objects.get(id=indicator_id).name,
            'period': period,
            'data_points': list(monthly_data),
        }
    
    @staticmethod
    def compare_programs(program_ids):
        """
        Compare multiple programs across key metrics
        """
        programs = Program.objects.filter(id__in=program_ids)
        
        comparison_data = []
        
        for program in programs:
            enrollments = program.enrollments.all()
            total_enrolled = enrollments.count()
            
            comparison_data.append({
                'program_id': program.id,
                'program_name': program.name,
                'location': program.location.name,
                'total_participants': total_enrolled,
                'completion_rate': round(
                    (enrollments.filter(status='completed').count() / total_enrolled * 100)
                    if total_enrolled > 0 else 0, 2
                ),
                'average_attendance': AnalyticsService._calculate_program_attendance(program),
                'average_performance': AnalyticsService._calculate_program_performance(program),
            })
        
        return comparison_data
    
    @staticmethod
    def _calculate_program_attendance(program):
        """Calculate average attendance rate for a program"""
        attendance_records = AttendanceRecord.objects.filter(program=program)
        total = attendance_records.count()
        
        if total == 0:
            return 0
        
        present = attendance_records.filter(present=True).count()
        return round((present / total * 100), 2)
    
    @staticmethod
    def _calculate_program_performance(program):
        """Calculate average performance across all indicators"""
        avg_score = Assessment.objects.filter(program=program).aggregate(
            avg=Avg('score')
        )['avg']
        
        return round(avg_score, 2) if avg_score else 0