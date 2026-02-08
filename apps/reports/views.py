# apps/reports/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.files.base import ContentFile
from django.utils import timezone
from reports.generators.pdf_generator import DonorReportGenerator
from users.permissions import IsDonorReadOnly
from analytics.services import AnalyticsService
from programs.models import Program
from reports.models import ReportTemplate, GeneratedReport
from reports.serializers import ReportTemplateSerializer, GeneratedReportSerializer, ReportGenerationRequestSerializer


class ReportTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing report templates
    """
    queryset = ReportTemplate.objects.all()
    serializer_class = ReportTemplateSerializer
    permission_classes = [IsAuthenticated, IsDonorReadOnly]
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active templates"""
        active_templates = self.queryset.filter(is_active=True)
        serializer = self.get_serializer(active_templates, many=True)
        return Response(serializer.data)


class GeneratedReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for generated reports
    """
    queryset = GeneratedReport.objects.select_related('template', 'program', 'generated_by').all()
    serializer_class = GeneratedReportSerializer
    permission_classes = [IsAuthenticated, IsDonorReadOnly]
    
    def get_queryset(self):
        """Filter reports based on user role"""
        queryset = super().get_queryset()
        
        # Donors can only see reports for programs they have access to
        if self.request.user.role == 'donor':
            # Implement donor-specific filtering logic here
            pass
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """
        Generate a new report
        POST /reports/generate/
        """
        serializer = ReportGenerationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        template = ReportTemplate.objects.get(id=serializer.validated_data['template_id'])
        program_id = serializer.validated_data.get('program_id')
        date_from = serializer.validated_data.get('date_from')
        date_to = serializer.validated_data.get('date_to')
        
        # Get analytics data
        if program_id:
            program = Program.objects.get(id=program_id)
            analytics_data = AnalyticsService.get_program_overview(
                program_id=program_id,
                date_from=date_from,
                date_to=date_to
            )
            
            # Generate PDF
            if template.file_format == 'pdf':
                pdf_content = DonorReportGenerator.generate(
                    program=program,
                    date_from=date_from or program.start_date,
                    date_to=date_to or timezone.now().date(),
                    analytics_data=analytics_data
                )
                
                # Save report
                timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
                filename = f"{template.template_type}_{program.name}_{timestamp}.pdf"
                
                report = GeneratedReport.objects.create(
                    template=template,
                    program=program,
                    title=f"{template.name} - {program.name}",
                    parameters=serializer.validated_data,
                    generated_by=request.user,
                    file_size=len(pdf_content)
                )
                
                report.file.save(filename, ContentFile(pdf_content))
                
                result_serializer = GeneratedReportSerializer(report, context={'request': request})
                return Response(result_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(
            {'error': 'Report generation failed'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        Download a generated report
        GET /reports/{id}/download/
        """
        report = self.get_object()
        
        from django.http import FileResponse
        return FileResponse(
            report.file.open('rb'),
            as_attachment=True,
            filename=report.file.name.split('/')[-1]
        )
