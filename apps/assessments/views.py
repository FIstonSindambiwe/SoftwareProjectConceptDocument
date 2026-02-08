# apps/assessments/views.py
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Avg, Count, Max, Min

# Import models and serializers
from .models import Indicator, Assessment
from .serializers import (
    IndicatorSerializer, 
    AssessmentSerializer, 
    AssessmentListSerializer
)
from users.permissions import CanEditData, IsDonorReadOnly


class IndicatorViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing indicators (KPIs)
    
    Endpoints:
    - GET /indicators/ - List all indicators
    - POST /indicators/ - Create indicator
    - GET /indicators/{id}/ - Retrieve indicator details
    - PUT/PATCH /indicators/{id}/ - Update indicator
    - DELETE /indicators/{id}/ - Delete indicator
    - GET /indicators/active/ - List active indicators
    """
    queryset = Indicator.objects.all()
    serializer_class = IndicatorSerializer
    permission_classes = [IsAuthenticated, CanEditData, IsDonorReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'category', 'created_at']
    filterset_fields = ['category', 'measurement_type', 'is_active']
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get only active indicators"""
        active_indicators = self.queryset.filter(is_active=True)
        serializer = self.get_serializer(active_indicators, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def assessments(self, request, pk=None):
        """Get all assessments for a specific indicator"""
        indicator = self.get_object()
        assessments = indicator.assessments.select_related('participant', 'program').all()
        
        serializer = AssessmentListSerializer(assessments, many=True)
        return Response(serializer.data)


class AssessmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing assessments
    
    Endpoints:
    - GET /assessments/ - List all assessments
    - POST /assessments/ - Create assessment
    - GET /assessments/{id}/ - Retrieve assessment details
    - PUT/PATCH /assessments/{id}/ - Update assessment
    - DELETE /assessments/{id}/ - Delete assessment
    - GET /assessments/stats/ - Get assessment statistics
    """
    queryset = Assessment.objects.select_related(
        'participant', 'program', 'indicator', 'assessed_by'
    ).all()
    serializer_class = AssessmentSerializer
    permission_classes = [IsAuthenticated, CanEditData, IsDonorReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['participant__participant_id', 'indicator__name']
    ordering_fields = ['assessment_date', 'score']
    filterset_fields = ['program', 'participant', 'indicator', 'assessment_type']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return AssessmentListSerializer
        return AssessmentSerializer
    
    def get_queryset(self):
        """Filter queryset based on query parameters"""
        queryset = super().get_queryset()
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            queryset = queryset.filter(assessment_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(assessment_date__lte=date_to)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set assessed_by field when creating assessment"""
        serializer.save(assessed_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get assessment statistics
        GET /assessments/stats/
        """
        program_id = request.query_params.get('program')
        indicator_id = request.query_params.get('indicator')
        
        queryset = self.queryset
        
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        if indicator_id:
            queryset = queryset.filter(indicator_id=indicator_id)
        
        stats = {
            'total_assessments': queryset.count(),
            'average_score': queryset.aggregate(avg=Avg('score'))['avg'] or 0,
            'min_score': queryset.aggregate(min=Min('score'))['min'] or 0,
            'max_score': queryset.aggregate(max=Max('score'))['max'] or 0,
            'by_type': {
                atype[0]: queryset.filter(assessment_type=atype[0]).count()
                for atype in Assessment._meta.get_field('assessment_type').choices
            },
            'by_indicator': list(
                queryset.values('indicator__name')
                .annotate(count=Count('id'), avg_score=Avg('score'))
                .order_by('-count')[:10]
            ),
        }
        
        return Response(stats)