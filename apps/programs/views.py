# apps/programs/views.py
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from .models import Location, Program, ProgramMilestone
from .serializers import (
    LocationSerializer, LocationListSerializer,
    ProgramSerializer, ProgramListSerializer, ProgramSummarySerializer,
    ProgramCreateUpdateSerializer, ProgramMilestoneSerializer
)
from users.permissions import CanEditData, IsDonorReadOnly


class LocationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing locations
    
    Endpoints:
    - GET /locations/ - List all locations
    - POST /locations/ - Create new location
    - GET /locations/{id}/ - Retrieve location details
    - PUT/PATCH /locations/{id}/ - Update location
    - DELETE /locations/{id}/ - Delete location
    - GET /locations/active/ - List only active locations
    """
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticated, CanEditData, IsDonorReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'city', 'country']
    ordering_fields = ['name', 'city', 'country', 'created_at']
    filterset_fields = ['country', 'city', 'is_active']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return LocationListSerializer
        return LocationSerializer
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Get only active locations
        GET /locations/active/
        """
        active_locations = self.queryset.filter(is_active=True)
        serializer = LocationListSerializer(active_locations, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def programs(self, request, pk=None):
        """
        Get all programs for a specific location
        GET /locations/{id}/programs/
        """
        location = self.get_object()
        programs = location.programs.all()
        
        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            programs = programs.filter(status=status_filter)
        
        serializer = ProgramListSerializer(programs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get location statistics
        GET /locations/stats/
        """
        stats = {
            'total_locations': Location.objects.count(),
            'active_locations': Location.objects.filter(is_active=True).count(),
            'locations_by_country': list(
                Location.objects.values('country')
                .annotate(count=Count('id'))
                .order_by('-count')
            ),
            'locations_with_programs': Location.objects.filter(
                programs__isnull=False
            ).distinct().count()
        }
        return Response(stats)


class ProgramViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing programs
    
    Endpoints:
    - GET /programs/ - List all programs
    - POST /programs/ - Create new program
    - GET /programs/{id}/ - Retrieve program details
    - PUT/PATCH /programs/{id}/ - Update program
    - DELETE /programs/{id}/ - Delete program
    - GET /programs/active/ - List only active programs
    - GET /programs/ongoing/ - List ongoing programs
    - GET /programs/{id}/summary/ - Get program summary
    - GET /programs/stats/ - Get program statistics
    """
    queryset = Program.objects.select_related('location', 'manager').prefetch_related('milestones')
    serializer_class = ProgramSerializer
    permission_classes = [IsAuthenticated, CanEditData, IsDonorReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'description', 'location__name', 'location__city']
    ordering_fields = ['name', 'start_date', 'end_date', 'created_at']
    filterset_fields = ['status', 'is_active', 'location', 'manager']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return ProgramListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProgramCreateUpdateSerializer
        elif self.action == 'summary':
            return ProgramSummarySerializer
        return ProgramSerializer
    
    def get_queryset(self):
        """Filter queryset based on query parameters"""
        queryset = super().get_queryset()
        
        # Filter by date range
        start_date_from = self.request.query_params.get('start_date_from')
        start_date_to = self.request.query_params.get('start_date_to')
        
        if start_date_from:
            queryset = queryset.filter(start_date__gte=start_date_from)
        if start_date_to:
            queryset = queryset.filter(start_date__lte=start_date_to)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Get only active programs
        GET /programs/active/
        """
        active_programs = self.queryset.filter(is_active=True)
        serializer = ProgramListSerializer(active_programs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def ongoing(self, request):
        """
        Get ongoing programs (currently running)
        GET /programs/ongoing/
        """
        from django.utils import timezone
        today = timezone.now().date()
        
        ongoing_programs = self.queryset.filter(
            Q(start_date__lte=today) &
            (Q(end_date__gte=today) | Q(end_date__isnull=True)) &
            Q(status='active')
        )
        
        serializer = ProgramListSerializer(ongoing_programs, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        """
        Get program summary with key metrics
        GET /programs/{id}/summary/
        """
        program = self.get_object()
        serializer = ProgramSummarySerializer(program)
        
        # Add additional metrics
        from participants.models import Enrollment
        from attendance.models import AttendanceRecord
        
        enrollments = Enrollment.objects.filter(program=program)
        
        data = serializer.data
        data['metrics'] = {
            'total_enrolled': enrollments.count(),
            'active_participants': enrollments.filter(status='active').count(),
            'completed': enrollments.filter(status='completed').count(),
            'dropped': enrollments.filter(status='dropped').count(),
            'average_attendance': self._calculate_average_attendance(program),
        }
        
        return Response(data)
    
    def _calculate_average_attendance(self, program):
        """Calculate average attendance rate for a program"""
        from attendance.models import AttendanceRecord
        from django.db.models import Avg
        
        attendance_records = AttendanceRecord.objects.filter(program=program)
        if not attendance_records.exists():
            return 0
        
        total_records = attendance_records.count()
        present_records = attendance_records.filter(present=True).count()
        
        return round((present_records / total_records) * 100, 2) if total_records > 0 else 0
    
    @action(detail=True, methods=['get'])
    def participants(self, request, pk=None):
        """
        Get all participants enrolled in a program
        GET /programs/{id}/participants/
        """
        program = self.get_object()
        from participants.serializers import EnrollmentListSerializer
        
        enrollments = program.enrollments.select_related('participant').all()
        
        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            enrollments = enrollments.filter(status=status_filter)
        
        serializer = EnrollmentListSerializer(enrollments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get program statistics
        GET /programs/stats/
        """
        from django.utils import timezone
        today = timezone.now().date()
        
        stats = {
            'total_programs': Program.objects.count(),
            'active_programs': Program.objects.filter(is_active=True).count(),
            'programs_by_status': {
                status[0]: Program.objects.filter(status=status[0]).count()
                for status in Program.STATUS_CHOICES
            },
            'ongoing_programs': Program.objects.filter(
                Q(start_date__lte=today) &
                (Q(end_date__gte=today) | Q(end_date__isnull=True)) &
                Q(status='active')
            ).count(),
            'programs_by_location': list(
                Program.objects.values('location__name', 'location__city')
                .annotate(count=Count('id'))
                .order_by('-count')[:10]
            ),
        }
        
        return Response(stats)
    
    @action(detail=True, methods=['post'])
    def add_milestone(self, request, pk=None):
        """
        Add a milestone to a program
        POST /programs/{id}/add_milestone/
        """
        program = self.get_object()
        serializer = ProgramMilestoneSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(program=program)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProgramMilestoneViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing program milestones
    
    Endpoints:
    - GET /milestones/ - List all milestones
    - POST /milestones/ - Create new milestone
    - GET /milestones/{id}/ - Retrieve milestone details
    - PUT/PATCH /milestones/{id}/ - Update milestone
    - DELETE /milestones/{id}/ - Delete milestone
    - POST /milestones/{id}/complete/ - Mark milestone as completed
    """
    queryset = ProgramMilestone.objects.select_related('program').all()
    serializer_class = ProgramMilestoneSerializer
    permission_classes = [IsAuthenticated, CanEditData, IsDonorReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['title', 'description']
    ordering_fields = ['target_date', 'created_at']
    filterset_fields = ['program', 'is_completed']
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Mark a milestone as completed
        POST /milestones/{id}/complete/
        """
        from django.utils import timezone
        
        milestone = self.get_object()
        milestone.is_completed = True
        milestone.completion_date = timezone.now().date()
        milestone.save()
        
        serializer = self.get_serializer(milestone)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """
        Get all overdue milestones
        GET /milestones/overdue/
        """
        from django.utils import timezone
        today = timezone.now().date()
        
        overdue_milestones = self.queryset.filter(
            is_completed=False,
            target_date__lt=today
        )
        
        serializer = self.get_serializer(overdue_milestones, many=True)
        return Response(serializer.data)