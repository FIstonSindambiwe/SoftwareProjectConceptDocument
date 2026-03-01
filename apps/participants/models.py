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


class Room(models.Model):
    """
    Physical or virtual classrooms where participants are grouped
    Each room has an assigned teacher
    """
    name = models.CharField(
        max_length=200,
        help_text=_("Room name or identifier (e.g., 'Room A', 'Blue Class')")
    )
    program = models.ForeignKey(
        Program,
        on_delete=models.CASCADE,
        related_name='rooms',
        help_text=_("Program this room belongs to")
    )
    
    # Teacher assignment
    teacher = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_rooms',
        limit_choices_to={'role__in': ['admin', 'program_manager', 'data_entry']},
        help_text=_("Teacher/facilitator assigned to this room")
    )
    
    # Capacity and scheduling
    capacity = models.IntegerField(
        default=30,
        validators=[MinValueValidator(1)],
        help_text=_("Maximum number of participants in this room")
    )
    schedule = models.TextField(
        blank=True,
        help_text=_("Class schedule (e.g., 'Mon-Fri 9AM-12PM')")
    )
    
    # Room details
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    
    # Metadata
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'rooms'
        ordering = ['program', 'name']
        unique_together = ['program', 'name']
        verbose_name = _('Room')
        verbose_name_plural = _('Rooms')
        indexes = [
            models.Index(fields=['program', 'is_active']),
            models.Index(fields=['teacher']),
        ]
    
    def __str__(self):
        return f"{self.program.name} - {self.name}"
    
    @property
    def teacher_name(self):
        """Get teacher's full name"""
        return self.teacher.get_full_name() if self.teacher else "No teacher assigned"
    
    @property
    def current_enrollment_count(self):
        """Get current number of participants in room"""
        return self.participants.filter(is_active=True).count()
    
    @property
    def is_full(self):
        """Check if room is at capacity"""
        return self.current_enrollment_count >= self.capacity
    
    @property
    def available_spots(self):
        """Get number of available spots"""
        return max(0, self.capacity - self.current_enrollment_count)


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
    
    # Personal Information
    first_name = models.CharField(
        max_length=100,
        help_text=_("Participant's first name")
    )
    last_name = models.CharField(
        max_length=100,
        help_text=_("Participant's last name")
    )
    
    # Demographics (minimal data for privacy)
    age = models.IntegerField(
        validators=[MinValueValidator(5), MaxValueValidator(25)],
        help_text=_("Age at enrollment")
    )
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    
    # Room assignment (REQUIRED - every participant must belong to a room)
    room = models.ForeignKey(
    Room,
    on_delete=models.PROTECT,
    related_name='participants',
    null=True,  # ← Add this temporarily
    blank=True,  # ← Add this temporarily
    help_text=_("Room/classroom this participant is assigned to")
    )
    
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
            models.Index(fields=['first_name', 'last_name']),
            models.Index(fields=['enrollment_date']),
            models.Index(fields=['is_active']),
            models.Index(fields=['room']),
        ]
    
    def __str__(self):
        return f"{self.participant_id} - {self.full_name}"
    
    @property
    def full_name(self):
        """Return participant's full name"""
        return f"{self.first_name} {self.last_name}".strip()
    
    @property
    def display_name(self):
        """Return display name (ID + Name)"""
        return f"{self.participant_id} - {self.full_name}"
    
    @property
    def assigned_teacher(self):
        """Get the teacher assigned to this participant's room"""
        return self.room.teacher if self.room else None
    
    @property
    def assigned_teacher_name(self):
        """Get assigned teacher's name"""
        return self.room.teacher_name if self.room else "No teacher assigned"
    
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
    
    def clean(self):
        """Validate participant data"""
        from django.core.exceptions import ValidationError
        
        # Check if room belongs to same program as enrollment
        if self.room and self.pk:
            # Check all enrollments are for the same program as room
            enrollments = self.enrollments.all()
            for enrollment in enrollments:
                if enrollment.program != self.room.program:
                    raise ValidationError(
                        f"Participant's room must belong to the same program. "
                        f"Room is for '{self.room.program.name}' but enrollment is for '{enrollment.program.name}'"
                    )


class Enrollment(models.Model):
    """
    Tracks participant enrollment in programs
    Enhanced with scholarship and exit status tracking
    """
    
    STATUS_CHOICES = [
        ('enrolled', 'Enrolled'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('dropped', 'Dropped Out'),
        ('transferred', 'Transferred'),
        ('scholarship', 'Scholarship Awarded'),
    ]
    
    EXIT_REASON_CHOICES = [
        ('completed', 'Successfully Completed Program'),
        ('dropout_personal', 'Dropout - Personal Reasons'),
        ('dropout_financial', 'Dropout - Financial Difficulties'),
        ('dropout_relocation', 'Dropout - Family Relocation'),
        ('dropout_health', 'Dropout - Health Issues'),
        ('dropout_behavior', 'Dropout - Behavioral Issues'),
        ('transferred', 'Transferred to Another Program'),
        ('scholarship', 'Received Scholarship for Further Education'),
        ('other', 'Other'),
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
    
    # Program completion tracking
    has_finished = models.BooleanField(
        default=False,
        help_text=_("Whether participant successfully finished the program")
    )
    finish_date = models.DateField(
        null=True,
        blank=True,
        help_text=_("Date participant completed the program")
    )
    final_grade = models.CharField(
        max_length=10,
        blank=True,
        choices=[
            ('A', 'Excellent (A)'),
            ('B', 'Very Good (B)'),
            ('C', 'Good (C)'),
            ('D', 'Pass (D)'),
            ('F', 'Fail (F)'),
        ],
        help_text=_("Final assessment grade")
    )
    
    # Dropout tracking
    has_dropped_out = models.BooleanField(
        default=False,
        help_text=_("Whether participant dropped out")
    )
    dropout_date = models.DateField(
        null=True,
        blank=True,
        help_text=_("Date participant dropped out")
    )
    dropout_reason = models.CharField(
        max_length=50,
        blank=True,
        choices=EXIT_REASON_CHOICES,
        help_text=_("Reason for dropout")
    )
    dropout_notes = models.TextField(
        blank=True,
        help_text=_("Additional notes about dropout")
    )
    
    # Scholarship tracking
    has_scholarship = models.BooleanField(
        default=False,
        help_text=_("Whether participant received a scholarship")
    )
    scholarship_type = models.CharField(
        max_length=100,
        blank=True,
        choices=[
            ('full', 'Full Scholarship'),
            ('partial', 'Partial Scholarship'),
            ('merit', 'Merit-Based Scholarship'),
            ('need', 'Need-Based Scholarship'),
            ('vocational', 'Vocational Training Scholarship'),
            ('university', 'University Scholarship'),
            ('other', 'Other Scholarship'),
        ],
        help_text=_("Type of scholarship awarded")
    )
    scholarship_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_("Scholarship amount in USD")
    )
    scholarship_provider = models.CharField(
        max_length=200,
        blank=True,
        help_text=_("Organization or individual providing scholarship")
    )
    scholarship_date = models.DateField(
        null=True,
        blank=True,
        help_text=_("Date scholarship was awarded")
    )
    scholarship_notes = models.TextField(
        blank=True,
        help_text=_("Additional scholarship details")
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
            models.Index(fields=['has_finished']),
            models.Index(fields=['has_dropped_out']),
            models.Index(fields=['has_scholarship']),
        ]
    
    def __str__(self):
        return f"{self.participant.full_name} ({self.participant.participant_id}) - {self.program.name}"
    
    @property
    def duration_days(self):
        """Calculate enrollment duration in days"""
        from django.utils import timezone
        
        end_date = self.completion_date or self.exit_date or self.finish_date or self.dropout_date or timezone.now().date()
        return (end_date - self.enrollment_date).days
    
    @property
    def is_active(self):
        """Check if enrollment is currently active"""
        return self.status in ['enrolled', 'active']
    
    @property
    def outcome_status(self):
        """Get the final outcome of enrollment"""
        if self.has_finished:
            return "Completed Successfully"
        elif self.has_dropped_out:
            return f"Dropped Out - {self.get_dropout_reason_display()}"
        elif self.has_scholarship:
            return f"Scholarship Awarded - {self.get_scholarship_type_display()}"
        elif self.status == 'active':
            return "Currently Active"
        return self.get_status_display()
    
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
    
    def mark_as_finished(self, finish_date=None, final_grade=None):
        """Mark enrollment as successfully finished"""
        from django.utils import timezone
        
        self.has_finished = True
        self.finish_date = finish_date or timezone.now().date()
        self.final_grade = final_grade or ''
        self.status = 'completed'
        self.completion_date = self.finish_date
        self.save()
    
    def mark_as_dropout(self, dropout_reason, dropout_date=None, notes=''):
        """Mark participant as dropped out"""
        from django.utils import timezone
        
        self.has_dropped_out = True
        self.dropout_date = dropout_date or timezone.now().date()
        self.dropout_reason = dropout_reason
        self.dropout_notes = notes
        self.status = 'dropped'
        self.exit_date = self.dropout_date
        self.exit_reason = f"Dropout: {self.get_dropout_reason_display()}"
        self.save()
    
    def award_scholarship(self, scholarship_type, amount=None, provider='', scholarship_date=None, notes=''):
        """Award scholarship to participant"""
        from django.utils import timezone
        
        self.has_scholarship = True
        self.scholarship_type = scholarship_type
        self.scholarship_amount = amount
        self.scholarship_provider = provider
        self.scholarship_date = scholarship_date or timezone.now().date()
        self.scholarship_notes = notes
        self.status = 'scholarship'
        self.save()
    
    def clean(self):
        """Validate enrollment data"""
        from django.core.exceptions import ValidationError
        
        if self.completion_date and self.completion_date < self.enrollment_date:
            raise ValidationError(_("Completion date cannot be before enrollment date"))
        
        if self.exit_date and self.exit_date < self.enrollment_date:
            raise ValidationError(_("Exit date cannot be before enrollment date"))
        
        if self.finish_date and self.finish_date < self.enrollment_date:
            raise ValidationError(_("Finish date cannot be before enrollment date"))
        
        if self.dropout_date and self.dropout_date < self.enrollment_date:
            raise ValidationError(_("Dropout date cannot be before enrollment date"))
        
        # Validate participant's room matches program
        if self.participant and self.participant.room:
            if self.participant.room.program != self.program:
                raise ValidationError(
                    f"Participant's room ({self.participant.room}) must belong to this program ({self.program})"
                )


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
        related_name='participant_notes',
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
            ('scholarship', 'Scholarship Related'),
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
        return f"{self.participant.full_name} ({self.participant.participant_id}) - {self.note_date}"