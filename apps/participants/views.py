# apps/participants/views.py
from django.db import models
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Avg, Q
from .models import Participant, Enrollment, ParticipantNote, Room
from .serializers import (
    ParticipantSerializer, ParticipantListSerializer,
    EnrollmentSerializer, EnrollmentListSerializer,
    ParticipantNoteSerializer, ParticipantProgressSerializer,
    RoomSerializer, RoomListSerializer,
    FinishProgramSerializer, DropoutSerializer, ScholarshipSerializer
)
from users.permissions import CanEditData, IsDonorReadOnly


class RoomViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing rooms/classrooms
    
    Endpoints:
    - GET /rooms/ - List all rooms
    - POST /rooms/ - Create new room
    - GET /rooms/{id}/ - Retrieve room details
    - PUT/PATCH /rooms/{id}/ - Update room
    - DELETE /rooms/{id}/ - Delete room (if no participants assigned)
    - GET /rooms/{id}/participants/ - Get participants in room
    - POST /rooms/{id}/assign_teacher/ - Assign teacher to room
    - GET /rooms/stats/ - Get room statistics
    """
    queryset = Room.objects.select_related('program', 'teacher').all()
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated, CanEditData, IsDonorReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'program__name', 'teacher__first_name', 'teacher__last_name']
    ordering_fields = ['name', 'capacity', 'created_at']
    filterset_fields = ['program', 'teacher', 'is_active']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return RoomListSerializer
        return RoomSerializer
    
    @action(detail=True, methods=['get'])
    def participants(self, request, pk=None):
        """
        Get all participants in a room
        GET /rooms/{id}/participants/
        """
        room = self.get_object()
        participants = room.participants.filter(is_active=True)
        
        serializer = ParticipantListSerializer(participants, many=True)
        return Response({
            'room_name': room.name,
            'teacher': room.teacher_name,
            'capacity': room.capacity,
            'current_count': room.current_enrollment_count,
            'available_spots': room.available_spots,
            'participants': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def assign_teacher(self, request, pk=None):
        """
        Assign a teacher to a room
        POST /rooms/{id}/assign_teacher/
        
        Body:
        {
            "teacher_id": 5
        }
        """
        from users.models import User
        
        room = self.get_object()
        teacher_id = request.data.get('teacher_id')
        
        if not teacher_id:
            return Response(
                {'error': 'teacher_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            teacher = User.objects.get(id=teacher_id)
            if teacher.role not in ['admin', 'program_manager', 'data_entry']:
                return Response(
                    {'error': 'User must have admin, program_manager, or data_entry role to be a teacher'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            room.teacher = teacher
            room.save()
            
            serializer = self.get_serializer(room)
            return Response(serializer.data)
            
        except User.DoesNotExist:
            return Response(
                {'error': f'User with id {teacher_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get room statistics
        GET /rooms/stats/
        """
        stats = {
            'total_rooms': Room.objects.count(),
            'active_rooms': Room.objects.filter(is_active=True).count(),
            'rooms_with_teachers': Room.objects.filter(teacher__isnull=False).count(),
            'full_rooms': Room.objects.filter(
                id__in=[room.id for room in Room.objects.all() if room.is_full]
            ).count(),
            'total_capacity': Room.objects.aggregate(total=models.Sum('capacity'))['total'] or 0,
            'total_participants': Participant.objects.filter(is_active=True).count(),
        }
        
        return Response(stats)


class ParticipantViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing participants
    """
    queryset = Participant.objects.select_related('room', 'room__teacher', 'room__program').all()
    serializer_class = ParticipantSerializer
    permission_classes = [IsAuthenticated, CanEditData, IsDonorReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['participant_id', 'first_name', 'last_name']
    ordering_fields = ['enrollment_date', 'age', 'created_at', 'first_name', 'last_name']
    filterset_fields = ['gender', 'is_active', 'education_level', 'room']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return ParticipantListSerializer
        elif self.action == 'progress':
            return ParticipantProgressSerializer
        return ParticipantSerializer
    
    def perform_create(self, serializer):
        """Set created_by field when creating participant"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        """
        Get comprehensive progress report for a participant
        GET /participants/{id}/progress/
        """
        participant = self.get_object()
        enrollments = participant.enrollments.all()
        recent_notes = participant.progress_notes.order_by('-note_date')[:5]
        
        progress_data = {
            'participant_id': participant.participant_id,
            'full_name': participant.full_name,
            'first_name': participant.first_name,
            'last_name': participant.last_name,
            'age': participant.age,
            'gender': participant.get_gender_display(),
            'room_name': participant.room.name if participant.room else None,
            'assigned_teacher': participant.assigned_teacher_name,
            
            'enrollments': EnrollmentListSerializer(enrollments, many=True).data,
            'total_programs': enrollments.count(),
            'completed_programs': enrollments.filter(has_finished=True).count(),
            'active_programs': enrollments.filter(status__in=['enrolled', 'active']).count(),
            'dropped_programs': enrollments.filter(has_dropped_out=True).count(),
            'scholarships_received': enrollments.filter(has_scholarship=True).count(),
            
            'average_attendance': enrollments.aggregate(avg=Avg('attendance_rate'))['avg'] or 0,
            'recent_notes': ParticipantNoteSerializer(recent_notes, many=True).data
        }
        
        return Response(progress_data)


class EnrollmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing enrollments with finish, dropout, and scholarship tracking
    """
    queryset = Enrollment.objects.select_related('participant', 'program').all()
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated, CanEditData, IsDonorReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['participant__participant_id', 'participant__first_name', 'participant__last_name', 'program__name']
    ordering_fields = ['enrollment_date', 'completion_date', 'attendance_rate']
    filterset_fields = [
        'status', 'participant', 'program',
        'has_finished', 'has_dropped_out', 'has_scholarship'
    ]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return EnrollmentListSerializer
        return EnrollmentSerializer
    
    def perform_create(self, serializer):
        """Set enrolled_by field when creating enrollment"""
        serializer.save(enrolled_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def finish(self, request, pk=None):
        """
        Mark participant as successfully finished the program
        POST /enrollments/{id}/finish/
        
        Body:
        {
            "finish_date": "2024-12-31",  // optional
            "final_grade": "A"             // optional: A, B, C, D, F
        }
        """
        enrollment = self.get_object()
        serializer = FinishProgramSerializer(data=request.data)
        
        if serializer.is_valid():
            enrollment.mark_as_finished(
                finish_date=serializer.validated_data.get('finish_date'),
                final_grade=serializer.validated_data.get('final_grade')
            )
            
            result_serializer = self.get_serializer(enrollment)
            return Response({
                'success': True,
                'message': f'Participant {enrollment.participant.full_name} marked as finished',
                'enrollment': result_serializer.data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def dropout(self, request, pk=None):
        """
        Mark participant as dropped out
        POST /enrollments/{id}/dropout/
        
        Body:
        {
            "dropout_date": "2024-06-15",  // optional
            "dropout_reason": "dropout_personal",  // required
            "dropout_notes": "Family relocation"   // optional
        }
        """
        enrollment = self.get_object()
        serializer = DropoutSerializer(data=request.data)
        
        if serializer.is_valid():
            enrollment.mark_as_dropout(
                dropout_reason=serializer.validated_data['dropout_reason'],
                dropout_date=serializer.validated_data.get('dropout_date'),
                notes=serializer.validated_data.get('dropout_notes', '')
            )
            
            result_serializer = self.get_serializer(enrollment)
            return Response({
                'success': True,
                'message': f'Participant {enrollment.participant.full_name} marked as dropped out',
                'enrollment': result_serializer.data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def award_scholarship(self, request, pk=None):
        """
        Award scholarship to participant
        POST /enrollments/{id}/award_scholarship/
        
        Body:
        {
            "scholarship_type": "full",           // required
            "scholarship_amount": 5000.00,        // optional
            "scholarship_provider": "ABC Foundation",  // optional
            "scholarship_date": "2024-08-01",     // optional
            "scholarship_notes": "Merit-based"    // optional
        }
        """
        enrollment = self.get_object()
        serializer = ScholarshipSerializer(data=request.data)
        
        if serializer.is_valid():
            enrollment.award_scholarship(
                scholarship_type=serializer.validated_data['scholarship_type'],
                amount=serializer.validated_data.get('scholarship_amount'),
                provider=serializer.validated_data.get('scholarship_provider', ''),
                scholarship_date=serializer.validated_data.get('scholarship_date'),
                notes=serializer.validated_data.get('scholarship_notes', '')
            )
            
            result_serializer = self.get_serializer(enrollment)
            return Response({
                'success': True,
                'message': f'Scholarship awarded to {enrollment.participant.full_name}',
                'enrollment': result_serializer.data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get enrollment statistics
        GET /enrollments/stats/
        """
        stats = {
            'total_enrollments': Enrollment.objects.count(),
            'enrollments_by_status': {
                status[0]: Enrollment.objects.filter(status=status[0]).count()
                for status in Enrollment.STATUS_CHOICES
            },
            'finished_count': Enrollment.objects.filter(has_finished=True).count(),
            'dropout_count': Enrollment.objects.filter(has_dropped_out=True).count(),
            'scholarship_count': Enrollment.objects.filter(has_scholarship=True).count(),
            'average_attendance_rate': Enrollment.objects.aggregate(
                avg=Avg('attendance_rate')
            )['avg'] or 0,
            'completion_rate': self._calculate_completion_rate(),
            'dropout_rate': self._calculate_dropout_rate(),
            'scholarship_rate': self._calculate_scholarship_rate(),
        }
        
        return Response(stats)
    
    def _calculate_completion_rate(self):
        """Calculate overall completion rate"""
        total = Enrollment.objects.count()
        if total == 0:
            return 0
        completed = Enrollment.objects.filter(has_finished=True).count()
        return round((completed / total) * 100, 2)
    
    def _calculate_dropout_rate(self):
        """Calculate dropout rate"""
        total = Enrollment.objects.count()
        if total == 0:
            return 0
        dropped = Enrollment.objects.filter(has_dropped_out=True).count()
        return round((dropped / total) * 100, 2)
    
    def _calculate_scholarship_rate(self):
        """Calculate scholarship rate"""
        total = Enrollment.objects.count()
        if total == 0:
            return 0
        scholarships = Enrollment.objects.filter(has_scholarship=True).count()
        return round((scholarships / total) * 100, 2)


class ParticipantNoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing participant notes
    """
    queryset = ParticipantNote.objects.select_related('participant', 'created_by').all()
    serializer_class = ParticipantNoteSerializer
    permission_classes = [IsAuthenticated, CanEditData, IsDonorReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['content', 'participant__participant_id', 'participant__first_name', 'participant__last_name']
    ordering_fields = ['note_date', 'created_at']
    filterset_fields = ['participant', 'note_type', 'is_confidential']
    
    def get_queryset(self):
        """Filter confidential notes based on user role"""
        queryset = super().get_queryset()
        
        # Donors cannot see confidential notes
        if self.request.user.role == 'donor':
            queryset = queryset.filter(is_confidential=False)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set created_by field when creating note"""
        serializer.save(created_by=self.request.user)