# apps/attendance/views.py
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q, Avg
from .models import AttendanceRecord, AttendanceSession
from .serializers import (
    AttendanceRecordSerializer, AttendanceRecordListSerializer,
    AttendanceSessionSerializer, BulkAttendanceSerializer
)
from users.permissions import CanEditData, IsDonorReadOnly
from participants.models import Participant
from .face_recognition_service import FaceRecognitionService
        

class AttendanceRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing attendance records
    
    Endpoints:
    - GET /attendance/ - List all attendance records
    - POST /attendance/ - Create attendance record
    - GET /attendance/{id}/ - Retrieve attendance details
    - PUT/PATCH /attendance/{id}/ - Update attendance
    - DELETE /attendance/{id}/ - Delete attendance
    - POST /attendance/bulk-record/ - Record attendance for multiple participants
    - GET /attendance/stats/ - Get attendance statistics
    - POST /attendance/face-verify/ - Verify attendance using face recognition
    - POST /attendance/identify-and-record/ - Identify participant and record attendance
    """
    queryset = AttendanceRecord.objects.select_related('participant', 'program', 'recorded_by').all()
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated, CanEditData, IsDonorReadOnly]
    parser_classes = [JSONParser, MultiPartParser, FormParser]  # Support JSON, file uploads, and form data
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['participant__participant_id', 'program__name', 'session_name']
    ordering_fields = ['date', 'recorded_at']
    filterset_fields = ['program', 'participant', 'present', 'date', 'verified_by_face']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return AttendanceRecordListSerializer
        elif self.action == 'bulk_record':
            return BulkAttendanceSerializer
        return AttendanceRecordSerializer
    
    def get_queryset(self):
        """Filter queryset based on query parameters"""
        queryset = super().get_queryset()
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set recorded_by field when creating attendance"""
        serializer.save(recorded_by=self.request.user)
    
    @action(detail=False, methods=['post'])
    def bulk_record(self, request):
        """
        Record attendance for multiple participants at once
        POST /attendance/bulk-record/
        
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
        """
        serializer = BulkAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        program_id = serializer.validated_data['program']
        date = serializer.validated_data['date']
        session_name = serializer.validated_data.get('session_name', '')
        records_data = serializer.validated_data['attendance_records']
        
        created_records = []
        errors = []
        
        for record_data in records_data:
            try:
                participant = Participant.objects.get(
                    participant_id=record_data['participant_id']
                )
                
                attendance, created = AttendanceRecord.objects.update_or_create(
                    participant=participant,
                    program_id=program_id,
                    date=date,
                    session_name=session_name,
                    defaults={
                        'present': record_data['present'].lower() in ['true', '1', 'yes'],
                        'recorded_by': request.user
                    }
                )
                
                created_records.append(AttendanceRecordSerializer(attendance).data)
                
            except Participant.DoesNotExist:
                errors.append(f"Participant {record_data['participant_id']} not found")
            except Exception as e:
                errors.append(f"Error processing {record_data['participant_id']}: {str(e)}")
        
        return Response({
            'created_count': len(created_records),
            'records': created_records,
            'errors': errors
        }, status=status.HTTP_201_CREATED if created_records else status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get attendance statistics
        GET /attendance/stats/
        """
        program_id = request.query_params.get('program')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        queryset = self.queryset
        
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        
        total_records = queryset.count()
        present_count = queryset.filter(present=True).count()
        
        stats = {
            'total_records': total_records,
            'present_count': present_count,
            'absent_count': total_records - present_count,
            'attendance_rate': round((present_count / total_records * 100), 2) if total_records > 0 else 0,
            'face_verified_count': queryset.filter(verified_by_face=True).count(),
            'average_confidence_score': queryset.filter(
                confidence_score__isnull=False
            ).aggregate(avg=Avg('confidence_score'))['avg'] or 0,
        }
        
        return Response(stats)
    
    @action(
        detail=False,
        methods=['POST'],
        parser_classes=[JSONParser, MultiPartParser, FormParser],
        url_path='face-verify',
        url_name='face-verify'
    )
    def face_verify(self, request):
        """
        Verify attendance using face recognition
        POST /attendance/face-verify/
        
        Body (multipart/form-data):
        - participant_id: str (participant to verify)
        - program: int (program ID)
        - date: YYYY-MM-DD
        - session_name: str (optional)
        - image: file (face photo)
        """
        from participants.models import Participant
        from attendance.face_recognition_service import FaceRecognitionService
        
        participant_id = request.data.get('participant_id')
        program_id = request.data.get('program')
        date = request.data.get('date')
        session_name = request.data.get('session_name', '')
        image = request.FILES.get('image')
        
        # Validate required fields
        if not all([participant_id, program_id, date, image]):
            return Response(
                {'error': 'Missing required fields: participant_id, program, date, image'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get participant
        try:
            participant = Participant.objects.get(participant_id=participant_id)
        except Participant.DoesNotExist:
            return Response(
                {'error': f'Participant {participant_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify face
        verification_result = FaceRecognitionService.verify_participant_face(participant, image)
        
        if verification_result['error']:
            return Response(
                {'error': verification_result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create or update attendance record
        if verification_result['verified']:
            attendance, created = AttendanceRecord.objects.update_or_create(
                participant=participant,
                program_id=program_id,
                date=date,
                session_name=session_name,
                defaults={
                    'present': True,
                    'verified_by_face': True,
                    'verification_method': 'face_recognition',
                    'confidence_score': verification_result['confidence'],
                    'recorded_by': request.user,
                }
            )
            
            serializer = AttendanceRecordSerializer(attendance)
            return Response({
                'verified': True,
                'confidence': verification_result['confidence'],
                'attendance': serializer.data,
                'message': 'Attendance verified successfully'
            }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        else:
            return Response({
                'verified': False,
                'confidence': verification_result['confidence'],
                'message': 'Face verification failed - identity could not be confirmed',
                'threshold': FaceRecognitionService.RECOGNITION_THRESHOLD
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(
        detail=False,
        methods=['POST'],
        parser_classes=[JSONParser, MultiPartParser, FormParser],
        url_path='identify-and-record',
        url_name='identify-and-record'
    )
    def identify_and_record(self, request):
        """
        Identify participant from photo and record attendance
        POST /attendance/identify-and-record/
        
        Body (multipart/form-data):
        - program: int (program ID)
        - date: YYYY-MM-DD
        - session_name: str (optional)
        - image: file (face photo)
        """
        from attendance.face_recognition_service import FaceRecognitionService
        from programs.models import Program
        
        program_id = request.data.get('program')
        date = request.data.get('date')
        session_name = request.data.get('session_name', '')
        image = request.FILES.get('image')
        
        # Validate required fields
        if not all([program_id, date, image]):
            return Response(
                {'error': 'Missing required fields: program, date, image'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get program
        try:
            program = Program.objects.get(id=program_id)
        except Program.DoesNotExist:
            return Response(
                {'error': f'Program {program_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Identify participant
        identification_result = FaceRecognitionService.identify_participant_from_image(
            image,
            program=program
        )
        
        if identification_result['error']:
            return Response(
                {
                    'identified': False,
                    'error': identification_result['error'],
                    'top_matches': identification_result.get('matches', [])[:3]
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not identification_result['identified']:
            return Response({
                'identified': False,
                'message': 'Could not identify participant with sufficient confidence',
                'confidence': identification_result['confidence'],
                'top_matches': [
                    {
                        'participant_id': m['participant_id'],
                        'confidence': m['confidence']
                    }
                    for m in identification_result.get('matches', [])[:3]
                ]
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Record attendance
        participant = identification_result['participant']
        
        attendance, created = AttendanceRecord.objects.update_or_create(
            participant=participant,
            program=program,
            date=date,
            session_name=session_name,
            defaults={
                'present': True,
                'verified_by_face': True,
                'verification_method': 'face_recognition',
                'confidence_score': identification_result['confidence'],
                'recorded_by': request.user,
            }
        )
        
        serializer = AttendanceRecordSerializer(attendance)
        
        return Response({
            'identified': True,
            'participant_id': participant.participant_id,
            'confidence': identification_result['confidence'],
            'attendance': serializer.data,
            'message': f'Participant {participant.participant_id} identified and attendance recorded'
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class AttendanceSessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing attendance sessions
    
    Endpoints:
    - GET /attendance-sessions/ - List all sessions
    - POST /attendance-sessions/ - Create session
    - GET /attendance-sessions/{id}/ - Retrieve session details
    - PUT/PATCH /attendance-sessions/{id}/ - Update session
    - DELETE /attendance-sessions/{id}/ - Delete session
    - POST /attendance-sessions/{id}/complete/ - Mark session as completed
    - POST /attendance-sessions/{id}/cancel/ - Cancel session
    """
    queryset = AttendanceSession.objects.select_related('program', 'created_by').all()
    serializer_class = AttendanceSessionSerializer
    permission_classes = [IsAuthenticated, CanEditData, IsDonorReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['session_name', 'program__name']
    ordering_fields = ['session_date', 'start_time']
    filterset_fields = ['program', 'is_completed', 'is_cancelled']
    
    def perform_create(self, serializer):
        """Set created_by field when creating session"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Mark session as completed
        POST /attendance-sessions/{id}/complete/
        """
        session = self.get_object()
        session.is_completed = True
        session.save()
        
        serializer = self.get_serializer(session)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel session
        POST /attendance-sessions/{id}/cancel/
        """
        session = self.get_object()
        session.is_cancelled = True
        session.cancellation_reason = request.data.get('reason', '')
        session.save()
        
        serializer = self.get_serializer(session)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def attendance(self, request, pk=None):
        """
        Get attendance records for a session
        GET /attendance-sessions/{id}/attendance/
        """
        session = self.get_object()
        records = AttendanceRecord.objects.filter(
            program=session.program,
            date=session.session_date,
            session_name=session.session_name
        )
        
        serializer = AttendanceRecordListSerializer(records, many=True)
        return Response(serializer.data)