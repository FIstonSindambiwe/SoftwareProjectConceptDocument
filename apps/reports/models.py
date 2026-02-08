# apps/reports/models.py
from django.db import models
from django.utils.translation import gettext_lazy as _
from programs.models import Program


class ReportTemplate(models.Model):
    """
    Predefined report templates
    """
    
    TEMPLATE_TYPE_CHOICES = [
        ('donor_quarterly', 'Donor Quarterly Report'),
        ('program_summary', 'Program Summary'),
        ('impact_assessment', 'Impact Assessment'),
        ('participant_progress', 'Participant Progress Report'),
        ('attendance_report', 'Attendance Report'),
    ]
    
    FILE_FORMAT_CHOICES = [
        ('pdf', 'PDF'),
        ('excel', 'Excel'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    template_type = models.CharField(max_length=30, choices=TEMPLATE_TYPE_CHOICES)
    file_format = models.CharField(max_length=10, choices=FILE_FORMAT_CHOICES)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'report_templates'
        ordering = ['template_type', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_file_format_display()})"


class GeneratedReport(models.Model):
    """
    Track generated reports
    """
    template = models.ForeignKey(
        ReportTemplate,
        on_delete=models.CASCADE,
        related_name='generated_reports'
    )
    program = models.ForeignKey(
        Program,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='reports'
    )
    
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='reports/%Y/%m/')
    
    # Report parameters (stored as JSON)
    parameters = models.JSONField(
        help_text=_("Report filters and parameters")
    )
    
    # Metadata
    generated_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='generated_reports'
    )
    generated_at = models.DateTimeField(auto_now_add=True)
    file_size = models.IntegerField(default=0, help_text=_("File size in bytes"))
    
    class Meta:
        db_table = 'generated_reports'
        ordering = ['-generated_at']
    
    def __str__(self):
        return f"{self.title} ({self.generated_at.strftime('%Y-%m-%d')})"
