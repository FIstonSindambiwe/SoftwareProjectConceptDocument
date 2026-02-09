# apps/participants/views.py
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Avg, Q
from .models import *
from .serializers import *
from users.permissions import *

class ParticipantViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing participants
    
    Endpoints:
    - GET /participants/ - List all participants
    - POST /participants/ - Create new participant
    - GET /participants/{id}/ - Retrieve participant details
    - PUT/PATCH /participants/{id}/ - Update participant
    - DELETE /participants/{id}/ - Deactivate participant
    - GET /participants/active/ - List active participants
    - GET /participants/{id}/progress/ - Get participant progress
    - GET /participants/{id}/enrollments/ - Get participant enrollments
    - GET /participants/stats/ - Get participant statistics
    """
    queryset = Participant.objects.all()
    serializer_class = ParticipantSerializer
    permission_classes = [IsAuthenticated, CanEditData, IsDonorReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['participant_id']
    ordering_fields = ['enrollment_date', 'age', 'created_at']
    filterset_fields = ['gender', 'is_active', 'education_level']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return ParticipantListSerializer
        elif self.action == 'create':
            return ParticipantCreateSerializer
        elif self.action == 'progress':
            return ParticipantProgressSerializer
        return ParticipantSerializer
    
    def get_queryset(self):
        """Filter queryset based on query parameters"""
        queryset = super().get_queryset()
        
        # Filter by age range
        age_min = self.request.query_params.get('age_min')
        age_max = self.request.query_params.get('age_max')
        
        if age_min:
            queryset = queryset.filter(age__gte=age_min)
        if age_max:
            queryset = queryset.filter(age__lte=age_max)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set created_by field when creating participant"""
        serializer.save(created_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete by setting is_active=False"""
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Get only active participants
        GET /participants/active/
        """
        active_participants = self.queryset.filter(is_active=True)
        serializer = ParticipantListSerializer(active_participants, many=True)
        return Response(serializer.data)
    
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
            'age': participant.age,
            'gender': participant.get_gender_display(),
            'enrollments': EnrollmentListSerializer(enrollments, many=True).data,
            'total_programs': enrollments.count(),
            'completed_programs': enrollments.filter(status='completed').count(),
            'active_programs': enrollments.filter(status__in=['enrolled', 'active']).count(),
            'average_attendance': enrollments.aggregate(
                avg=Avg('attendance_rate')
            )['avg'] or 0,
            'recent_notes': ParticipantNoteSerializer(recent_notes, many=True).data
        }
        
        return Response(progress_data)
    
    @action(detail=True, methods=['get'])
    def enrollments(self, request, pk=None):
        """
        Get all enrollments for a participant
        GET /participants/{id}/enrollments/
        """
        participant = self.get_object()
        enrollments = participant.enrollments.select_related('program').all()
        
        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            enrollments = enrollments.filter(status=status_filter)
        
        serializer = EnrollmentListSerializer(enrollments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get participant statistics
        GET /participants/stats/
        """
        stats = {
            'total_participants': Participant.objects.count(),
            'active_participants': Participant.objects.filter(is_active=True).count(),
            'participants_by_gender': {
                gender[0]: Participant.objects.filter(gender=gender[0]).count()
                for gender in Participant.GENDER_CHOICES
            },
            'participants_by_age_group': self._get_age_distribution(),
            'participants_by_education': {
                level[0]: Participant.objects.filter(education_level=level[0]).count()
                for level in Participant._meta.get_field('education_level').choices
            } if hasattr(Participant._meta.get_field('education_level'), 'choices') else {},
            'average_age': Participant.objects.aggregate(avg=Avg('age'))['avg'] or 0,
        }
        
        return Response(stats)
    
    def _get_age_distribution(self):
        """Calculate age distribution"""
        return {
            '5-9': Participant.objects.filter(age__gte=5, age__lte=9).count(),
            '10-14': Participant.objects.filter(age__gte=10, age__lte=14).count(),
            '15-18': Participant.objects.filter(age__gte=15, age__lte=18).count(),
            '19-22': Participant.objects.filter(age__gte=19, age__lte=22).count(),
            '23-25': Participant.objects.filter(age__gte=23, age__lte=25).count(),
        }
    
    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        """
        Add a note for a participant
        POST /participants/{id}/add_note/
        """
        participant = self.get_object()
        serializer = ParticipantNoteSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(participant=participant, created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def upload_photo(self, request, pk=None):
        """
        Upload photo and generate face encoding for participant
        POST /participants/{id}/upload_photo/
        
        Body (multipart/form-data):
        - photo: file (image file)
        - photo_consent_given: bool (optional, default: true if uploading)
        """
        from attendance.face_recognition_service import FaceRecognitionService
        
        participant = self.get_object()
        photo = request.FILES.get('photo')
        
        if not photo:
            return Response(
                {'error': 'No photo file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check photo quality first
        quality_result = FaceRecognitionService.get_face_quality_score(photo)
        
        if not quality_result['suitable']:
            return Response({
                'error': 'Photo quality insufficient for face recognition',
                'quality_score': quality_result['quality_score'],
                'recommendations': quality_result['recommendations'],
                'face_found': quality_result['face_found']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update consent if provided
        consent_given = request.data.get('photo_consent_given', 'true').lower() == 'true'
        
        if not participant.photo_consent_given and not consent_given:
            return Response(
                {'error': 'Photo consent is required before uploading photo'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Save photo
        participant.photo = photo
        participant.photo_consent_given = consent_given
        participant.save(update_fields=['photo', 'photo_consent_given'])
        
        # Generate face encoding
        encoding_result = FaceRecognitionService.update_participant_encoding(
            participant,
            photo
        )
        
        if encoding_result['success']:
            serializer = self.get_serializer(participant)
            return Response({
                'success': True,
                'message': 'Photo uploaded and face encoding generated successfully',
                'quality_score': quality_result['quality_score'],
                'participant': serializer.data
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': encoding_result['error'],
                'photo_uploaded': True,
                'encoding_generated': False
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def update_face_encoding(self, request, pk=None):
        """
        Regenerate face encoding from existing photo
        POST /participants/{id}/update_face_encoding/
        """
        from attendance.face_recognition_service import FaceRecognitionService
        
        participant = self.get_object()
        
        if not participant.photo:
            return Response(
                {'error': 'No photo on file for this participant'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Regenerate encoding
        encoding_result = FaceRecognitionService.update_participant_encoding(
            participant,
            participant.photo.path
        )
        
        if encoding_result['success']:
            serializer = self.get_serializer(participant)
            return Response({
                'success': True,
                'message': 'Face encoding updated successfully',
                'encoding_date': participant.face_encoding_date,
                'participant': serializer.data
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': encoding_result['error']
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def face_encoding_status(self, request, pk=None):
        """
        Get face encoding status for participant
        GET /participants/{id}/face_encoding_status/
        """
        participant = self.get_object()
        
        status_info = {
            'participant_id': participant.participant_id,
            'has_photo': bool(participant.photo),
            'has_encoding': bool(participant.face_encoding),
            'photo_consent_given': participant.photo_consent_given,
            'encoding_date': participant.face_encoding_date,
            'can_use_face_recognition': bool(
                participant.photo and 
                participant.face_encoding and 
                participant.photo_consent_given
            )
        }
        
        return Response(status_info)


class EnrollmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing enrollments
    
    Endpoints:
    - GET /enrollments/ - List all enrollments
    - POST /enrollments/ - Create new enrollment
    - GET /enrollments/{id}/ - Retrieve enrollment details
    - PUT/PATCH /enrollments/{id}/ - Update enrollment
    - DELETE /enrollments/{id}/ - Delete enrollment
    - POST /enrollments/{id}/complete/ - Mark enrollment as completed
    - POST /enrollments/{id}/dropout/ - Mark participant as dropped out
    - POST /enrollments/{id}/update_attendance/ - Recalculate attendance rate
    """
    queryset = Enrollment.objects.select_related('participant', 'program').all()
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated, CanEditData, IsDonorReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['participant__participant_id', 'program__name']
    ordering_fields = ['enrollment_date', 'completion_date', 'attendance_rate']
    filterset_fields = ['status', 'participant', 'program']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return EnrollmentListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return EnrollmentCreateUpdateSerializer
        return EnrollmentSerializer
    
    def perform_create(self, serializer):
        """Set enrolled_by field when creating enrollment"""
        serializer.save(enrolled_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Mark enrollment as completed
        POST /enrollments/{id}/complete/
        """
        from django.utils import timezone
        
        enrollment = self.get_object()
        enrollment.status = 'completed'
        enrollment.completion_date = timezone.now().date()
        enrollment.save()
        
        serializer = self.get_serializer(enrollment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def dropout(self, request, pk=None):
        """
        Mark participant as dropped out
        POST /enrollments/{id}/dropout/
        """
        from django.utils import timezone
        
        enrollment = self.get_object()
        enrollment.status = 'dropped'
        enrollment.exit_date = timezone.now().date()
        enrollment.exit_reason = request.data.get('reason', '')
        enrollment.save()
        
        serializer = self.get_serializer(enrollment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_attendance(self, request, pk=None):
        """
        Recalculate attendance rate
        POST /enrollments/{id}/update_attendance/
        """
        enrollment = self.get_object()
        enrollment.update_attendance_rate()
        
        serializer = self.get_serializer(enrollment)
        return Response(serializer.data)
    
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
            'average_attendance_rate': Enrollment.objects.aggregate(
                avg=Avg('attendance_rate')
            )['avg'] or 0,
            'completion_rate': self._calculate_completion_rate(),
            'dropout_rate': self._calculate_dropout_rate(),
        }
        
        return Response(stats)
    
    def _calculate_completion_rate(self):
        """Calculate overall completion rate"""
        total = Enrollment.objects.count()
        if total == 0:
            return 0
        completed = Enrollment.objects.filter(status='completed').count()
        return round((completed / total) * 100, 2)
    
    def _calculate_dropout_rate(self):
        """Calculate dropout rate"""
        total = Enrollment.objects.count()
        if total == 0:
            return 0
        dropped = Enrollment.objects.filter(status='dropped').count()
        return round((dropped / total) * 100, 2)


class ParticipantNoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing participant notes
    
    Endpoints:
    - GET /participant-notes/ - List all notes
    - POST /participant-notes/ - Create new note
    - GET /participant-notes/{id}/ - Retrieve note details
    - PUT/PATCH /participant-notes/{id}/ - Update note
    - DELETE /participant-notes/{id}/ - Delete note
    """
    queryset = ParticipantNote.objects.select_related('participant', 'created_by').all()
    serializer_class = ParticipantNoteSerializer
    permission_classes = [IsAuthenticated, CanEditData, IsDonorReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['content', 'participant__participant_id']
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