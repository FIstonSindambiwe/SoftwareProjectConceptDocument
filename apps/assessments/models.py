# apps/assessments/models.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from participants.models import Participant
from programs.models import Program


class Indicator(models.Model):
    """
    Key Performance Indicators (KPIs) to track youth development
    Examples: Reading Level, Math Skills, Self-Confidence, Physical Fitness
    """
    
    CATEGORY_CHOICES = [
        ('academic', 'Academic Skills'),
        ('social', 'Social-Emotional Development'),
        ('physical', 'Physical Development'),
        ('vocational', 'Vocational Skills'),
        ('life_skills', 'Life Skills'),
        ('other', 'Other'),
    ]
    
    MEASUREMENT_TYPE_CHOICES = [
        ('scale_1_10', 'Scale (1-10)'),
        ('scale_1_5', 'Scale (1-5)'),
        ('percentage', 'Percentage (0-100)'),
        ('binary', 'Pass/Fail'),
        ('score', 'Raw Score'),
    ]
    
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    measurement_type = models.CharField(max_length=20, choices=MEASUREMENT_TYPE_CHOICES)
    
    # Scale configuration
    min_value = models.FloatField(default=0)
    max_value = models.FloatField(default=10)
    
    # Interpretation guidelines
    interpretation_guide = models.TextField(
        blank=True,
        help_text=_("Guidelines for interpreting scores")
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'indicators'
        ordering = ['category', 'name']
        verbose_name = _('Indicator')
        verbose_name_plural = _('Indicators')
    
    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"


class Assessment(models.Model):
    """
    Individual assessment records tracking participant progress on indicators
    """
    participant = models.ForeignKey(
        Participant,
        on_delete=models.CASCADE,
        related_name='assessments'
    )
    program = models.ForeignKey(
        Program,
        on_delete=models.CASCADE,
        related_name='assessments'
    )
    indicator = models.ForeignKey(
        Indicator,
        on_delete=models.PROTECT,
        related_name='assessments'
    )
    
    assessment_date = models.DateField()
    score = models.FloatField(help_text=_("Score based on indicator measurement type"))
    
    # Assessment context
    assessment_type = models.CharField(
        max_length=20,
        choices=[
            ('baseline', 'Baseline'),
            ('progress', 'Progress Check'),
            ('midterm', 'Midterm'),
            ('final', 'Final'),
        ],
        default='progress'
    )
    
    notes = models.TextField(blank=True)
    
    # Assessor information
    assessed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='assessments_conducted'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'assessments'
        ordering = ['-assessment_date']
        verbose_name = _('Assessment')
        verbose_name_plural = _('Assessments')
        indexes = [
            models.Index(fields=['participant', 'indicator']),
            models.Index(fields=['program', 'indicator']),
            models.Index(fields=['assessment_date']),
        ]
    
    def __str__(self):
        return f"{self.participant.participant_id} - {self.indicator.name} ({self.assessment_date})"
    
    def clean(self):
        """Validate assessment score against indicator bounds"""
        from django.core.exceptions import ValidationError
        
        if self.indicator:
            if self.score < self.indicator.min_value or self.score > self.indicator.max_value:
                raise ValidationError(
                    f"Score must be between {self.indicator.min_value} and {self.indicator.max_value}"
                )
