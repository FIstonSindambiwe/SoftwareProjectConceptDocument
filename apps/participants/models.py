# apps/participants/models.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from django.utils.crypto import get_random_string
from django.utils import timezone
from programs.models import Program


def generate_participant_id():
    """
    Generate a unique random participant ID
    Format: YP-YYYY-XXXXXX (e.g., YP-2024-A3B9C2)
    """
    year = timezone.now().year
    # Generate random 6-character alphanumeric string (uppercase)
    random_code = get_random_string(6, allowed_chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
    return f"YP-{year}-{random_code}"


class Participant(models.Model):
    """
    Youth participants in programs
    Uses anonymized IDs to protect minor privacy
    """
    
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
        ('N', 'Prefer not to say'),
    ]
    
    # Unique identifier (anonymized for privacy)
    # Auto-generated on creation
    participant_id = models.CharField(
        max_length=50, 
        unique=True,
        default=generate_participant_id,
        editable=False,
        help_text=_("Auto-generated unique identifier (e.g., YP-2024-A3B9C2)")
    )
    
    # Demographics (minimal data for privacy)
    age = models.IntegerField(
        validators=[MinValueValidator(5), MaxValueValidator(25)],
        help_text=_("Age at enrollment")
    )
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    
    # Optional: Photo for face recognition (requires consent)
    photo = models.ImageField(
        upload_to='participants/photos/', 
        null=True, 
        blank=True,
        help_text=_("Photo for face recognition attendance (requires guardian consent)")
    )
    
    # Face recognition data
    face_encoding = models.JSONField(
        null=True,
        blank=True,
        help_text=_("Stored face encoding for recognition (auto-generated from photo)")
    )
    face_encoding_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_("When the face encoding was last updated")
    )
    
    # Consent tracking
    photo_consent_given = models.BooleanField(
        default=False,
        help_text=_("Guardian consent for photo storage and face recognition")
    )
    data_sharing_consent = models.BooleanField(
        default=False,
        help_text=_("Consent for sharing anonymized data with donors")
    )
    
    # Background information (optional)
    education_level = models.CharField(
        max_length=50,
        blank=True,
        choices=[
            ('none', 'No Formal Education'),
            ('primary', 'Primary School'),
            ('secondary', 'Secondary School'),
            ('vocational', 'Vocational Training'),
            ('university', 'University'),
        ]
    )
    
    special_needs = models.TextField(
        blank=True,
        help_text=_("Any special needs or accommodations required")
    )
    
    # Enrollment tracking
    enrollment_date = models.DateField()
    is_active = models.BooleanField(default=True)
    
    # Metadata
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_participants'
    )
    
    class Meta:
        db_table = 'participants'
        ordering = ['-enrollment_date']
        verbose_name = _('Participant')
        verbose_name_plural = _('Participants')
        indexes = [
            models.Index(fields=['participant_id']),
            models.Index(fields=['enrollment_date']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return self.participant_id
    
    def save(self, *args, **kwargs):
        """
        Override save to ensure unique participant_id
        Regenerate if collision occurs (very unlikely but safe)
        """
        if not self.participant_id:
            self.participant_id = generate_participant_id()
        
        # Handle rare collision case
        max_attempts = 10
        attempts = 0
        while attempts < max_attempts:
            try:
                super().save(*args, **kwargs)
                break
            except models.IntegrityError:
                # ID collision, regenerate
                attempts += 1
                if attempts >= max_attempts:
                    raise ValueError("Unable to generate unique participant ID after multiple attempts")
                self.participant_id = generate_participant_id()
    
    @property
    def active_enrollments_count(self):
        """Count of active program enrollments"""
        return self.enrollments.filter(status__in=['enrolled', 'active']).count()
    
    @property
    def completed_programs_count(self):
        """Count of completed programs"""
        return self.enrollments.filter(status='completed').count()


class Enrollment(models.Model):
    """
    Tracks participant enrollment in programs
    """
    
    STATUS_CHOICES = [
        ('enrolled', 'Enrolled'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('dropped', 'Dropped Out'),
        ('transferred', 'Transferred'),
    ]
    
    participant = models.ForeignKey(
        Participant,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    program = models.ForeignKey(
        Program,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    
    # Timeline
    enrollment_date = models.DateField()
    completion_date = models.DateField(null=True, blank=True)
    expected_completion_date = models.DateField(null=True, blank=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='enrolled'
    )
    
    # Performance tracking
    attendance_rate = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        help_text=_("Percentage of sessions attended")
    )
    
    # Exit information (for dropped/transferred)
    exit_reason = models.TextField(blank=True)
    exit_date = models.DateField(null=True, blank=True)
    
    # Metadata
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    enrolled_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='enrollments_created'
    )
    
    class Meta:
        db_table = 'enrollments'
        unique_together = ['participant', 'program']
        ordering = ['-enrollment_date']
        verbose_name = _('Enrollment')
        verbose_name_plural = _('Enrollments')
        indexes = [
            models.Index(fields=['participant', 'status']),
            models.Index(fields=['program', 'status']),
            models.Index(fields=['enrollment_date']),
        ]
    
    def __str__(self):
        return f"{self.participant.participant_id} - {self.program.name}"
    
    @property
    def duration_days(self):
        """Calculate enrollment duration in days"""
        from django.utils import timezone
        
        end_date = self.completion_date or self.exit_date or timezone.now().date()
        return (end_date - self.enrollment_date).days
    
    @property
    def is_active(self):
        """Check if enrollment is currently active"""
        return self.status in ['enrolled', 'active']
    
    def update_attendance_rate(self):
        """Recalculate attendance rate based on attendance records"""
        from attendance.models import AttendanceRecord
        
        total_sessions = AttendanceRecord.objects.filter(
            participant=self.participant,
            program=self.program
        ).count()
        
        if total_sessions == 0:
            self.attendance_rate = 0.0
        else:
            attended_sessions = AttendanceRecord.objects.filter(
                participant=self.participant,
                program=self.program,
                present=True
            ).count()
            self.attendance_rate = round((attended_sessions / total_sessions) * 100, 2)
        
        self.save(update_fields=['attendance_rate'])
    
    def clean(self):
        """Validate enrollment data"""
        from django.core.exceptions import ValidationError
        
        if self.completion_date and self.completion_date < self.enrollment_date:
            raise ValidationError(_("Completion date cannot be before enrollment date"))
        
        if self.exit_date and self.exit_date < self.enrollment_date:
            raise ValidationError(_("Exit date cannot be before enrollment date"))


class ParticipantNote(models.Model):
    """
    Progress notes and observations about participants
    """
    participant = models.ForeignKey(
        Participant,
        on_delete=models.CASCADE,
        related_name='progress_notes'
    )
    enrollment = models.ForeignKey(
        Enrollment,
        on_delete=models.CASCADE,
        related_name='participant_notes',  # Changed from 'notes' to 'participant_notes'
        null=True,
        blank=True
    )
    
    note_date = models.DateField()
    note_type = models.CharField(
        max_length=20,
        choices=[
            ('progress', 'Progress Note'),
            ('concern', 'Concern'),
            ('achievement', 'Achievement'),
            ('behavior', 'Behavioral Observation'),
            ('other', 'Other'),
        ],
        default='progress'
    )
    
    content = models.TextField()
    
    # Privacy settings
    is_confidential = models.BooleanField(
        default=False,
        help_text=_("Visible only to authorized staff")
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='participant_notes'
    )
    
    class Meta:
        db_table = 'participant_notes'
        ordering = ['-note_date', '-created_at']
    
    def __str__(self):
        return f"{self.participant.participant_id} - {self.note_date}"