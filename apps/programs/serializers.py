# apps/programs/serializers.py
from rest_framework import serializers
from .models import Location, Program, ProgramMilestone


class LocationSerializer(serializers.ModelSerializer):
    """
    Serializer for Location model
    """
    active_programs_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Location
        fields = [
            'id', 'name', 'country', 'city', 'address',
            'latitude', 'longitude', 'contact_person',
            'contact_email', 'contact_phone', 'is_active',
            'notes', 'active_programs_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LocationListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for location listings
    """
    active_programs_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Location
        fields = ['id', 'name', 'city', 'country', 'is_active', 'active_programs_count']


class ProgramMilestoneSerializer(serializers.ModelSerializer):
    """
    Serializer for program milestones
    """
    is_overdue = serializers.ReadOnlyField()
    
    class Meta:
        model = ProgramMilestone
        fields = [
            'id', 'program', 'title', 'description',
            'target_date', 'completion_date', 'is_completed',
            'is_overdue', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProgramSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for Program model
    """
    location_name = serializers.CharField(source='location.name', read_only=True)
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    # Computed fields
    is_ongoing = serializers.ReadOnlyField()
    duration_days = serializers.ReadOnlyField()
    enrollment_count = serializers.ReadOnlyField()
    completion_rate = serializers.ReadOnlyField()
    
    # Nested milestones
    milestones = ProgramMilestoneSerializer(many=True, read_only=True)
    
    class Meta:
        model = Program
        fields = [
            'id', 'name', 'description', 'location', 'location_name',
            'start_date', 'end_date', 'target_participants',
            'budget', 'funding_source', 'focus_areas',
            'age_range_min', 'age_range_max', 'status', 'status_display',
            'is_active', 'manager', 'manager_name', 'notes',
            'is_ongoing', 'duration_days', 'enrollment_count',
            'completion_rate', 'milestones',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, attrs):
        """Validate program data"""
        if 'end_date' in attrs and 'start_date' in attrs:
            if attrs['end_date'] and attrs['end_date'] < attrs['start_date']:
                raise serializers.ValidationError({
                    'end_date': 'End date cannot be before start date'
                })
        
        if 'age_range_max' in attrs and 'age_range_min' in attrs:
            if attrs['age_range_max'] < attrs['age_range_min']:
                raise serializers.ValidationError({
                    'age_range_max': 'Maximum age cannot be less than minimum age'
                })
        
        return attrs


class ProgramListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for program listings
    """
    location_name = serializers.CharField(source='location.name', read_only=True)
    location_city = serializers.CharField(source='location.city', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    enrollment_count = serializers.ReadOnlyField()
    is_ongoing = serializers.ReadOnlyField()
    
    class Meta:
        model = Program
        fields = [
            'id', 'name', 'location_name', 'location_city',
            'start_date', 'end_date', 'status', 'status_display',
            'target_participants', 'enrollment_count',
            'is_ongoing', 'is_active'
        ]


class ProgramSummarySerializer(serializers.ModelSerializer):
    """
    Summary serializer for dashboard/analytics views
    """
    location_name = serializers.CharField(source='location.name', read_only=True)
    enrollment_count = serializers.ReadOnlyField()
    completion_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = Program
        fields = [
            'id', 'name', 'location_name', 'start_date', 'end_date',
            'status', 'enrollment_count', 'completion_rate'
        ]


class ProgramCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating programs (no computed fields)
    """
    class Meta:
        model = Program
        fields = [
            'name', 'description', 'location', 'start_date', 'end_date',
            'target_participants', 'budget', 'funding_source',
            'focus_areas', 'age_range_min', 'age_range_max',
            'status', 'is_active', 'manager', 'notes'
        ]
    
    def validate(self, attrs):
        """Validate program data"""
        if 'end_date' in attrs and 'start_date' in attrs:
            if attrs['end_date'] and attrs['end_date'] < attrs['start_date']:
                raise serializers.ValidationError({
                    'end_date': 'End date cannot be before start date'
                })
        
        if 'age_range_max' in attrs and 'age_range_min' in attrs:
            if attrs['age_range_max'] < attrs['age_range_min']:
                raise serializers.ValidationError({
                    'age_range_max': 'Maximum age cannot be less than minimum age'
                })
        
        return attrs