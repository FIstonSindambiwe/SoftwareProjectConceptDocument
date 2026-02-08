# apps/analytics/serializers.py
from rest_framework import serializers


class ProgramOverviewSerializer(serializers.Serializer):
    """Serializer for program overview data"""
    program = serializers.DictField()
    enrollment = serializers.DictField()
    demographics = serializers.DictField()
    attendance = serializers.DictField()
    performance = serializers.DictField()


class TrendDataSerializer(serializers.Serializer):
    """Serializer for trend analysis data"""
    indicator = serializers.CharField()
    period = serializers.CharField()
    data_points = serializers.ListField()


class ProgramComparisonSerializer(serializers.Serializer):
    """Serializer for program comparison data"""
    program_id = serializers.IntegerField()
    program_name = serializers.CharField()
    location = serializers.CharField()
    total_participants = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    average_attendance = serializers.FloatField()
    average_performance = serializers.FloatField()