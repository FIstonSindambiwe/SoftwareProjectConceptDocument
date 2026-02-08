# apps/attendance/serializers.py
from rest_framework import serializers
from .models import AttendanceRecord, AttendanceSession


class AttendanceRecordSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for attendance records
    """
    participant_id = serializers.CharField(source='participant.participant_id', read_only=True)
    program_name = serializers.CharField(source='program.name', read_only=True)
    verification_method_display = serializers.CharField(source='get_verification_method_display', read_only=True)
    duration_hours = serializers.ReadOnlyField()
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True)
    
    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'participant', 'participant_id', 'program', 'program_name',
            'date', 'session_name', 'present', 'verification_method',
            'verification_method_display', 'verified_by_face', 'confidence_score',
            'face_image', 'arrival_time', 'departure_time', 'duration_hours',
            'notes', 'recorded_by', 'recorded_by_name', 'recorded_at', 'updated_at'
        ]
        read_only_fields = ['id', 'recorded_at', 'updated_at']
    
    def validate(self, attrs):
        """Validate attendance data"""
        if attrs.get('departure_time') and attrs.get('arrival_time'):
            if attrs['departure_time'] < attrs['arrival_time']:
                raise serializers.ValidationError({
                    'departure_time': 'Departure time cannot be before arrival time'
                })
        
        if attrs.get('verified_by_face') and 'participant' in attrs:
            if not attrs['participant'].photo_consent_given:
                raise serializers.ValidationError(
                    "Cannot use face verification without participant photo consent"
                )
        
        return attrs


class AttendanceRecordListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for attendance listings
    """
    participant_id = serializers.CharField(source='participant.participant_id', read_only=True)
    program_name = serializers.CharField(source='program.name', read_only=True)
    
    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'participant_id', 'program_name', 'date',
            'session_name', 'present', 'verification_method'
        ]


class AttendanceSessionSerializer(serializers.ModelSerializer):
    """
    Serializer for attendance sessions
    """
    program_name = serializers.CharField(source='program.name', read_only=True)
    duration_hours = serializers.ReadOnlyField()
    attendance_rate = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = AttendanceSession
        fields = [
            'id', 'program', 'program_name', 'session_name',
            'session_date', 'start_time', 'end_time', 'duration_hours',
            'location', 'description', 'is_completed', 'is_cancelled',
            'cancellation_reason', 'attendance_rate',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, attrs):
        """Validate session data"""
        if 'end_time' in attrs and 'start_time' in attrs:
            if attrs['end_time'] <= attrs['start_time']:
                raise serializers.ValidationError({
                    'end_time': 'End time must be after start time'
                })
        return attrs


class BulkAttendanceSerializer(serializers.Serializer):
    """
    Serializer for bulk attendance recording
    """
    program = serializers.IntegerField()
    date = serializers.DateField()
    session_name = serializers.CharField(required=False, allow_blank=True)
    attendance_records = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField())
    )
    
    def validate_attendance_records(self, value):
        """Validate attendance records structure"""
        for record in value:
            if 'participant_id' not in record or 'present' not in record:
                raise serializers.ValidationError(
                    "Each record must have 'participant_id' and 'present' fields"
                )
        return value
