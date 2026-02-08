# apps/assessments/serializers.py
from rest_framework import serializers
from .models import Indicator, Assessment


class IndicatorSerializer(serializers.ModelSerializer):
    """
    Serializer for Indicator model
    """
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    measurement_type_display = serializers.CharField(source='get_measurement_type_display', read_only=True)
    
    class Meta:
        model = Indicator
        fields = [
            'id', 'name', 'description', 'category', 'category_display',
            'measurement_type', 'measurement_type_display',
            'min_value', 'max_value', 'interpretation_guide',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AssessmentSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for Assessment model
    """
    participant_id = serializers.CharField(source='participant.participant_id', read_only=True)
    program_name = serializers.CharField(source='program.name', read_only=True)
    indicator_name = serializers.CharField(source='indicator.name', read_only=True)
    indicator_category = serializers.CharField(source='indicator.get_category_display', read_only=True)
    assessment_type_display = serializers.CharField(source='get_assessment_type_display', read_only=True)
    assessed_by_name = serializers.CharField(source='assessed_by.get_full_name', read_only=True)
    
    class Meta:
        model = Assessment
        fields = [
            'id', 'participant', 'participant_id', 'program', 'program_name',
            'indicator', 'indicator_name', 'indicator_category',
            'assessment_date', 'score', 'assessment_type', 'assessment_type_display',
            'notes', 'assessed_by', 'assessed_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, attrs):
        """Validate assessment score against indicator bounds"""
        if 'score' in attrs and 'indicator' in attrs:
            indicator = attrs['indicator']
            score = attrs['score']
            
            if score < indicator.min_value or score > indicator.max_value:
                raise serializers.ValidationError({
                    'score': f'Score must be between {indicator.min_value} and {indicator.max_value}'
                })
        
        return attrs


class AssessmentListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for assessment listings
    """
    participant_id = serializers.CharField(source='participant.participant_id', read_only=True)
    indicator_name = serializers.CharField(source='indicator.name', read_only=True)
    
    class Meta:
        model = Assessment
        fields = [
            'id', 'participant_id', 'indicator_name',
            'assessment_date', 'score', 'assessment_type'
        ]