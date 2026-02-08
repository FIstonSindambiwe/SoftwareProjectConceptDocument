# apps/analytics/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services import AnalyticsService
from .serializers import ProgramOverviewSerializer, TrendDataSerializer, ProgramComparisonSerializer


class AnalyticsViewSet(viewsets.ViewSet):
    """
    ViewSet for analytics and dashboard data
    
    Endpoints:
    - GET /analytics/overview/?program={id} - Program overview
    - GET /analytics/trends/?indicator={id}&period={period} - Trend analysis
    - GET /analytics/compare/?programs={id1,id2,id3} - Program comparison
    - GET /analytics/dashboard/ - Overall dashboard data
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def overview(self, request):
        """
        Get program overview with KPIs
        GET /analytics/overview/?program=1&date_from=2024-01-01&date_to=2024-12-31
        """
        program_id = request.query_params.get('program')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        if not program_id:
            return Response(
                {'error': 'program parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        data = AnalyticsService.get_program_overview(
            program_id=program_id,
            date_from=date_from,
            date_to=date_to
        )
        
        serializer = ProgramOverviewSerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def trends(self, request):
        """
        Get trend data for an indicator
        GET /analytics/trends/?indicator=1&program=1&period=6months
        """
        indicator_id = request.query_params.get('indicator')
        program_id = request.query_params.get('program')
        period = request.query_params.get('period', '6months')
        
        if not indicator_id:
            return Response(
                {'error': 'indicator parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        data = AnalyticsService.get_trend_data(
            indicator_id=indicator_id,
            program_id=program_id,
            period=period
        )
        
        serializer = TrendDataSerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def compare(self, request):
        """
        Compare multiple programs
        GET /analytics/compare/?programs=1,2,3
        """
        programs_param = request.query_params.get('programs')
        
        if not programs_param:
            return Response(
                {'error': 'programs parameter is required (comma-separated IDs)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        program_ids = [int(pid) for pid in programs_param.split(',')]
        
        data = AnalyticsService.compare_programs(program_ids)
        
        serializer = ProgramComparisonSerializer(data, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Get overall dashboard statistics
        GET /analytics/dashboard/
        """
        from programs.models import Program
        from participants.models import Participant, Enrollment
        
        data = {
            'overview': {
                'total_programs': Program.objects.filter(is_active=True).count(),
                'total_participants': Participant.objects.filter(is_active=True).count(),
                'active_enrollments': Enrollment.objects.filter(
                    status__in=['enrolled', 'active']
                ).count(),
            },
            'recent_programs': list(
                Program.objects.filter(is_active=True)
                .order_by('-start_date')[:5]
                .values('id', 'name', 'location__name', 'start_date')
            ),
        }
        
        return Response(data)