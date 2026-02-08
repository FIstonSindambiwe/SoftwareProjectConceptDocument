# apps/programs/models.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


class Location(models.Model):
    """
    Physical locations where programs are conducted
    """
    name = models.CharField(max_length=200)
    country = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    address = models.TextField(blank=True)
    
    # Geolocation for mapping
    latitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        null=True, 
        blank=True,
        help_text=_("Latitude coordinate")
    )
    longitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        null=True, 
        blank=True,
        help_text=_("Longitude coordinate")
    )
    
    # Contact information
    contact_person = models.CharField(max_length=200, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    
    # Metadata
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'locations'
        ordering = ['country', 'city', 'name']
        verbose_name = _('Location')
        verbose_name_plural = _('Locations')
    
    def __str__(self):
        return f"{self.name} - {self.city}, {self.country}"
    
    @property
    def active_programs_count(self):
        return self.programs.filter(is_active=True).count()


class Program(models.Model):
    """
    Youth development programs
    """
    
    STATUS_CHOICES = [
        ('planning', 'Planning'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('on_hold', 'On Hold'),
        ('cancelled', 'Cancelled'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    location = models.ForeignKey(
        Location, 
        on_delete=models.PROTECT,  # Prevent deletion of locations with programs
        related_name='programs'
    )
    
    # Timeline
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    # Targets
    target_participants = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text=_("Target number of participants")
    )
    
    # Budget and funding
    budget = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text=_("Program budget in USD")
    )
    funding_source = models.CharField(max_length=200, blank=True)
    
    # Program details
    focus_areas = models.JSONField(
        default=list,
        blank=True,
        help_text=_("List of program focus areas (e.g., education, skills, health)")
    )
    age_range_min = models.IntegerField(
        default=10,
        validators=[MinValueValidator(5), MaxValueValidator(25)]
    )
    age_range_max = models.IntegerField(
        default=18,
        validators=[MinValueValidator(5), MaxValueValidator(25)]
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='planning'
    )
    is_active = models.BooleanField(default=True)
    
    # Program manager
    manager = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_programs',
        limit_choices_to={'role__in': ['admin', 'program_manager']}
    )
    
    # Metadata
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'programs'
        ordering = ['-start_date', 'name']
        verbose_name = _('Program')
        verbose_name_plural = _('Programs')
        indexes = [
            models.Index(fields=['location', 'status']),
            models.Index(fields=['start_date', 'end_date']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.location.city})"
    
    @property
    def is_ongoing(self):
        """Check if program is currently active"""
        today = timezone.now().date()
        if self.end_date:
            return self.start_date <= today <= self.end_date
        return self.start_date <= today and self.status == 'active'
    
    @property
    def duration_days(self):
        """Calculate program duration in days"""
        if self.end_date:
            return (self.end_date - self.start_date).days
        return (timezone.now().date() - self.start_date).days
    
    @property
    def enrollment_count(self):
        """Get current enrollment count"""
        return self.enrollments.filter(status__in=['enrolled', 'active']).count()
    
    @property
    def completion_rate(self):
        """Calculate program completion rate"""
        total = self.enrollments.count()
        if total == 0:
            return 0
        completed = self.enrollments.filter(status='completed').count()
        return round((completed / total) * 100, 2)
    
    def clean(self):
        """Validate model data"""
        from django.core.exceptions import ValidationError
        
        if self.end_date and self.end_date < self.start_date:
            raise ValidationError(_("End date cannot be before start date"))
        
        if self.age_range_max < self.age_range_min:
            raise ValidationError(_("Maximum age cannot be less than minimum age"))


class ProgramMilestone(models.Model):
    """
    Track program milestones and achievements
    """
    program = models.ForeignKey(
        Program,
        on_delete=models.CASCADE,
        related_name='milestones'
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    target_date = models.DateField()
    completion_date = models.DateField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'program_milestones'
        ordering = ['target_date']
    
    def __str__(self):
        return f"{self.program.name} - {self.title}"
    
    @property
    def is_overdue(self):
        """Check if milestone is overdue"""
        if self.is_completed:
            return False
        return timezone.now().date() > self.target_date