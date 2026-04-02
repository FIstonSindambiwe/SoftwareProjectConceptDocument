# apps/schools/serializers.py
from rest_framework import serializers
from .models import School, Student


class StudentListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'name', 'age', 'courses', 'parent_name',
            'status', 'status_display',
            'midterm_marks', 'final_marks',
            'created_at',
        ]


class StudentSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'school', 'name', 'age', 'courses',
            'parent_name', 'status', 'status_display',
            'midterm_marks', 'final_marks',
            'graduated_at', 'dropped_out_at', 'dropout_reason',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'status', 'graduated_at',
            'dropped_out_at', 'created_at', 'updated_at'
        ]


class SchoolListSerializer(serializers.ModelSerializer):
    total_students = serializers.IntegerField(read_only=True)
    active_students = serializers.IntegerField(read_only=True)

    class Meta:
        model = School
        fields = [
            'id', 'name', 'location', 'is_active',
            'total_students', 'active_students',
            'created_at',
        ]


class SchoolSerializer(serializers.ModelSerializer):
    total_students = serializers.IntegerField(read_only=True)
    active_students = serializers.IntegerField(read_only=True)
    students = StudentListSerializer(many=True, read_only=True)

    class Meta:
        model = School
        fields = [
            'id', 'name', 'location', 'is_active',
            'total_students', 'active_students',
            'students', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']