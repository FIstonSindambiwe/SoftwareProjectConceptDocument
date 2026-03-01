# apps/participants/serializers.py
from rest_framework import serializers
from .models import Participant, Enrollment, ParticipantNote, Room


class RoomSerializer(serializers.ModelSerializer):
    """
    Serializer for Room model
    """
    program_name = serializers.CharField(source='program.name', read_only=True)
    teacher_name = serializers.ReadOnlyField()
    current_enrollment_count = serializers.ReadOnlyField()
    is_full = serializers.ReadOnlyField()
    available_spots = serializers.ReadOnlyField()
    
    class Meta:
        model = Room
        fields = [
            'id', 'name', 'program', 'program_name',
            'teacher', 'teacher_name',
            'capacity', 'schedule', 'description',
            'current_enrollment_count', 'is_full', 'available_spots',
            'is_active', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class RoomListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for room listings
    """
    program_name = serializers.CharField(source='program.name', read_only=True)
    teacher_name = serializers.ReadOnlyField()
    current_enrollment_count = serializers.ReadOnlyField()
    available_spots = serializers.ReadOnlyField()
    
    class Meta:
        model = Room
        fields = [
            'id', 'name', 'program_name', 'teacher_name',
            'capacity', 'current_enrollment_count', 'available_spots', 'is_active'
        ]


class ParticipantSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for Participant model
    """
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    education_level_display = serializers.CharField(source='get_education_level_display', read_only=True)
    full_name = serializers.ReadOnlyField()
    display_name = serializers.ReadOnlyField()
    active_enrollments_count = serializers.ReadOnlyField()
    completed_programs_count = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    # Room information
    room_name = serializers.CharField(source='room.name', read_only=True)
    assigned_teacher_name = serializers.ReadOnlyField()
    
    class Meta:
        model = Participant
        fields = [
            'id', 'participant_id', 'first_name', 'last_name', 'full_name', 'display_name',
            'age', 'gender', 'gender_display',
            'room', 'room_name', 'assigned_teacher_name',
            'photo', 'photo_consent_given', 'data_sharing_consent',
            'education_level', 'education_level_display', 'special_needs',
            'enrollment_date', 'is_active', 'notes',
            'active_enrollments_count', 'completed_programs_count',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'participant_id', 'full_name', 'display_name', 'created_at', 'updated_at']
    
    def validate(self, attrs):
        """Validate participant data"""
        # Check room capacity
        room = attrs.get('room')
        if room and not self.instance:  # Only for creation
            if room.is_full:
                raise serializers.ValidationError({
                    'room': f'Room "{room.name}" is at full capacity ({room.capacity} participants)'
                })
        
        # Check photo consent
        if attrs.get('photo') and not attrs.get('photo_consent_given', False):
            raise serializers.ValidationError({
                'photo': 'Photo consent must be given before uploading a photo'
            })
        
        return attrs


class ParticipantListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for participant listings
    """
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    full_name = serializers.ReadOnlyField()
    active_enrollments_count = serializers.ReadOnlyField()
    room_name = serializers.CharField(source='room.name', read_only=True)
    assigned_teacher_name = serializers.ReadOnlyField()
    
    class Meta:
        model = Participant
        fields = [
            'id', 'participant_id', 'first_name', 'last_name', 'full_name',
            'age', 'gender', 'gender_display',
            'room_name', 'assigned_teacher_name',
            'enrollment_date', 'is_active', 'active_enrollments_count'
        ]


class EnrollmentSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for Enrollment model with scholarship and finish/dropout tracking
    """
    participant_id = serializers.CharField(source='participant.participant_id', read_only=True)
    participant_name = serializers.CharField(source='participant.full_name', read_only=True)
    participant_age = serializers.IntegerField(source='participant.age', read_only=True)
    participant_gender = serializers.CharField(source='participant.get_gender_display', read_only=True)
    participant_room = serializers.CharField(source='participant.room.name', read_only=True)
    
    program_name = serializers.CharField(source='program.name', read_only=True)
    program_location = serializers.CharField(source='program.location.name', read_only=True)
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    dropout_reason_display = serializers.CharField(source='get_dropout_reason_display', read_only=True)
    scholarship_type_display = serializers.CharField(source='get_scholarship_type_display', read_only=True)
    final_grade_display = serializers.CharField(source='get_final_grade_display', read_only=True)
    
    duration_days = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()
    outcome_status = serializers.ReadOnlyField()
    enrolled_by_name = serializers.CharField(source='enrolled_by.get_full_name', read_only=True)
    
    class Meta:
        model = Enrollment
        fields = [
            'id', 'participant', 'participant_id', 'participant_name', 
            'participant_age', 'participant_gender', 'participant_room',
            'program', 'program_name', 'program_location',
            'enrollment_date', 'completion_date', 'expected_completion_date',
            'status', 'status_display', 'attendance_rate',
            
            # Finish tracking
            'has_finished', 'finish_date', 'final_grade', 'final_grade_display',
            
            # Dropout tracking
            'has_dropped_out', 'dropout_date', 'dropout_reason', 'dropout_reason_display', 'dropout_notes',
            
            # Scholarship tracking
            'has_scholarship', 'scholarship_type', 'scholarship_type_display',
            'scholarship_amount', 'scholarship_provider', 'scholarship_date', 'scholarship_notes',
            
            'exit_reason', 'exit_date', 'notes',
            'duration_days', 'is_active', 'outcome_status',
            'enrolled_by', 'enrolled_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'attendance_rate', 'created_at', 'updated_at']


class EnrollmentListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for enrollment listings
    """
    participant_id = serializers.CharField(source='participant.participant_id', read_only=True)
    participant_name = serializers.CharField(source='participant.full_name', read_only=True)
    program_name = serializers.CharField(source='program.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    outcome_status = serializers.ReadOnlyField()
    
    class Meta:
        model = Enrollment
        fields = [
            'id', 'participant_id', 'participant_name', 'program_name',
            'enrollment_date', 'status', 'status_display',
            'attendance_rate', 'has_finished', 'has_dropped_out', 'has_scholarship',
            'outcome_status'
        ]


class FinishProgramSerializer(serializers.Serializer):
    """
    Serializer for marking participant as finished
    """
    finish_date = serializers.DateField(required=False)
    final_grade = serializers.ChoiceField(
        choices=[('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D'), ('F', 'F')],
        required=False
    )


class DropoutSerializer(serializers.Serializer):
    """
    Serializer for marking participant as dropped out
    """
    dropout_date = serializers.DateField(required=False)
    dropout_reason = serializers.ChoiceField(
        choices=Enrollment.EXIT_REASON_CHOICES,
        required=True
    )
    dropout_notes = serializers.CharField(required=False, allow_blank=True)


class ScholarshipSerializer(serializers.Serializer):
    """
    Serializer for awarding scholarships
    """
    scholarship_type = serializers.ChoiceField(
        choices=[
            ('full', 'Full Scholarship'),
            ('partial', 'Partial Scholarship'),
            ('merit', 'Merit-Based Scholarship'),
            ('need', 'Need-Based Scholarship'),
            ('vocational', 'Vocational Training Scholarship'),
            ('university', 'University Scholarship'),
            ('other', 'Other Scholarship'),
        ],
        required=True
    )
    scholarship_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True
    )
    scholarship_provider = serializers.CharField(required=False, allow_blank=True)
    scholarship_date = serializers.DateField(required=False)
    scholarship_notes = serializers.CharField(required=False, allow_blank=True)


class ParticipantNoteSerializer(serializers.ModelSerializer):
    """
    Serializer for participant notes
    """
    participant_id = serializers.CharField(source='participant.participant_id', read_only=True)
    participant_name = serializers.CharField(source='participant.full_name', read_only=True)
    note_type_display = serializers.CharField(source='get_note_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = ParticipantNote
        fields = [
            'id', 'participant', 'participant_id', 'participant_name', 'enrollment',
            'note_date', 'note_type', 'note_type_display',
            'content', 'is_confidential',
            'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at']


class ParticipantProgressSerializer(serializers.Serializer):
    """
    Serializer for participant progress overview
    """
    participant_id = serializers.CharField()
    full_name = serializers.CharField()
    age = serializers.IntegerField()
    gender = serializers.CharField()
    room_name = serializers.CharField()
    assigned_teacher = serializers.CharField()
    
    enrollments = EnrollmentListSerializer(many=True)
    
    total_programs = serializers.IntegerField()
    completed_programs = serializers.IntegerField()
    active_programs = serializers.IntegerField()
    dropped_programs = serializers.IntegerField()
    scholarships_received = serializers.IntegerField()
    
    average_attendance = serializers.FloatField()
    
    recent_notes = ParticipantNoteSerializer(many=True)