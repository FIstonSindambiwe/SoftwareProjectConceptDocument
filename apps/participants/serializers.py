# apps/participants/serializers.py
from rest_framework import serializers
from .models import Participant, Enrollment, ParticipantNote


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
    
    class Meta:
        model = Participant
        fields = [
            'id', 'participant_id', 'first_name', 'last_name', 'full_name', 'display_name',
            'age', 'gender', 'gender_display',
            'photo', 'photo_consent_given', 'data_sharing_consent',
            'education_level', 'education_level_display', 'special_needs',
            'enrollment_date', 'is_active', 'notes',
            'active_enrollments_count', 'completed_programs_count',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'participant_id', 'full_name', 'display_name', 'created_at', 'updated_at']
    
    def validate_photo(self, value):
        """Ensure photo consent is given before uploading photo"""
        if value and not self.initial_data.get('photo_consent_given', False):
            raise serializers.ValidationError(
                "Photo consent must be given before uploading a photo"
            )
        return value


class ParticipantListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for participant listings
    """
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    full_name = serializers.ReadOnlyField()
    active_enrollments_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Participant
        fields = [
            'id', 'participant_id', 'first_name', 'last_name', 'full_name',
            'age', 'gender', 'gender_display',
            'enrollment_date', 'is_active', 'active_enrollments_count'
        ]


class ParticipantCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating participants
    Note: participant_id is auto-generated
    """
    participant_id = serializers.CharField(read_only=True)
    id = serializers.IntegerField(read_only=True)
    full_name = serializers.ReadOnlyField()
    display_name = serializers.ReadOnlyField()
    
    class Meta:
        model = Participant
        fields = [
            'id', 'participant_id', 'first_name', 'last_name', 'full_name', 'display_name',
            'age', 'gender', 'photo',
            'photo_consent_given', 'data_sharing_consent',
            'education_level', 'special_needs', 'enrollment_date', 'notes'
        ]
        read_only_fields = ['id', 'participant_id', 'full_name', 'display_name']
    
    def validate(self, attrs):
        """Validate participant data"""
        if attrs.get('photo') and not attrs.get('photo_consent_given', False):
            raise serializers.ValidationError({
                'photo': 'Photo consent must be given before uploading a photo'
            })
        
        # Ensure first_name and last_name are provided
        if not attrs.get('first_name'):
            raise serializers.ValidationError({
                'first_name': 'First name is required'
            })
        if not attrs.get('last_name'):
            raise serializers.ValidationError({
                'last_name': 'Last name is required'
            })
        
        return attrs


class EnrollmentSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for Enrollment model
    """
    participant_id = serializers.CharField(source='participant.participant_id', read_only=True)
    participant_name = serializers.CharField(source='participant.full_name', read_only=True)
    participant_age = serializers.IntegerField(source='participant.age', read_only=True)
    participant_gender = serializers.CharField(source='participant.get_gender_display', read_only=True)
    
    program_name = serializers.CharField(source='program.name', read_only=True)
    program_location = serializers.CharField(source='program.location.name', read_only=True)
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    duration_days = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()
    enrolled_by_name = serializers.CharField(source='enrolled_by.get_full_name', read_only=True)
    
    class Meta:
        model = Enrollment
        fields = [
            'id', 'participant', 'participant_id', 'participant_name', 
            'participant_age', 'participant_gender',
            'program', 'program_name', 'program_location',
            'enrollment_date', 'completion_date', 'expected_completion_date',
            'status', 'status_display', 'attendance_rate',
            'exit_reason', 'exit_date', 'notes',
            'duration_days', 'is_active',
            'enrolled_by', 'enrolled_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'attendance_rate', 'created_at', 'updated_at']
    
    def validate(self, attrs):
        """Validate enrollment data"""
        if 'completion_date' in attrs and 'enrollment_date' in attrs:
            if attrs['completion_date'] and attrs['completion_date'] < attrs['enrollment_date']:
                raise serializers.ValidationError({
                    'completion_date': 'Completion date cannot be before enrollment date'
                })
        
        if 'exit_date' in attrs and 'enrollment_date' in attrs:
            if attrs['exit_date'] and attrs['exit_date'] < attrs['enrollment_date']:
                raise serializers.ValidationError({
                    'exit_date': 'Exit date cannot be before enrollment date'
                })
        
        # Check for duplicate enrollment
        if self.instance is None:  # Only for creation
            participant = attrs.get('participant')
            program = attrs.get('program')
            if Enrollment.objects.filter(participant=participant, program=program).exists():
                raise serializers.ValidationError(
                    "This participant is already enrolled in this program"
                )
        
        return attrs


class EnrollmentListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for enrollment listings
    """
    participant_id = serializers.CharField(source='participant.participant_id', read_only=True)
    participant_name = serializers.CharField(source='participant.full_name', read_only=True)
    program_name = serializers.CharField(source='program.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Enrollment
        fields = [
            'id', 'participant_id', 'participant_name', 'program_name',
            'enrollment_date', 'status', 'status_display',
            'attendance_rate'
        ]


class EnrollmentCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating enrollments
    """
    class Meta:
        model = Enrollment
        fields = [
            'participant', 'program', 'enrollment_date',
            'completion_date', 'expected_completion_date',
            'status', 'exit_reason', 'exit_date', 'notes'
        ]
    
    def validate(self, attrs):
        """Validate enrollment data"""
        if 'completion_date' in attrs and 'enrollment_date' in attrs:
            if attrs['completion_date'] and attrs['completion_date'] < attrs['enrollment_date']:
                raise serializers.ValidationError({
                    'completion_date': 'Completion date cannot be before enrollment date'
                })
        
        if 'exit_date' in attrs and 'enrollment_date' in attrs:
            if attrs['exit_date'] and attrs['exit_date'] < attrs['enrollment_date']:
                raise serializers.ValidationError({
                    'exit_date': 'Exit date cannot be before enrollment date'
                })
        
        return attrs


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
    
    enrollments = EnrollmentListSerializer(many=True)
    
    total_programs = serializers.IntegerField()
    completed_programs = serializers.IntegerField()
    active_programs = serializers.IntegerField()
    
    average_attendance = serializers.FloatField()
    
    recent_notes = ParticipantNoteSerializer(many=True)