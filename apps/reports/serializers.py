# apps/reports/serializers.py
from rest_framework import serializers
from .models import ReportTemplate, GeneratedReport



class ReportTemplateSerializer(serializers.ModelSerializer):
    """Serializer for report templates"""
    template_type_display = serializers.CharField(source='get_template_type_display', read_only=True)
    file_format_display = serializers.CharField(source='get_file_format_display', read_only=True)
    
    class Meta:
        model = ReportTemplate
        fields = [
            'id', 'name', 'description', 'template_type', 'template_type_display',
            'file_format', 'file_format_display', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class GeneratedReportSerializer(serializers.ModelSerializer):
    """Serializer for generated reports"""
    template_name = serializers.CharField(source='template.name', read_only=True)
    program_name = serializers.CharField(source='program.name', read_only=True)
    generated_by_name = serializers.CharField(source='generated_by.get_full_name', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = GeneratedReport
        fields = [
            'id', 'template', 'template_name', 'program', 'program_name',
            'title', 'file', 'file_url', 'file_size', 'parameters',
            'generated_by', 'generated_by_name', 'generated_at'
        ]
        read_only_fields = ['id', 'file_size', 'generated_at']
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class ReportGenerationRequestSerializer(serializers.Serializer):
    """Serializer for report generation requests"""
    template_id = serializers.IntegerField()
    program_id = serializers.IntegerField(required=False)
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    include_demographics = serializers.BooleanField(default=True)
    include_attendance = serializers.BooleanField(default=True)
    include_assessments = serializers.BooleanField(default=True)
