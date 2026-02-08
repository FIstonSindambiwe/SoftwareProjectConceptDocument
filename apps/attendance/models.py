# apps/attendance/models.py
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from participants.models import Participant
from programs.models import Program


class AttendanceRecord(models.Model):
    """
    Track participant attendance at program sessions
    Supports both manual and face recognition-based attendance
    """
    participant = models.ForeignKey(
        Participant,
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    program = models.ForeignKey(
        Program,
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    
    date = models.DateField()
    session_name = models.CharField(
        max_length=200,
        blank=True,
        help_text=_("Optional session identifier (e.g., 'Morning Session', 'Workshop A')")
    )
    
    # Attendance status
    present = models.BooleanField(default=False)
    
    # Attendance verification method
    VERIFICATION_METHOD_CHOICES = [
        ('manual', 'Manual Entry'),
        ('face_recognition', 'Face Recognition'),
        ('qr_code', 'QR Code Scan'),
        ('signature', 'Signature'),
        ('other', 'Other'),
    ]
    verification_method = models.CharField(
        max_length=20,
        choices=VERIFICATION_METHOD_CHOICES,
        default='manual'
    )
    
    # Face detection metadata
    verified_by_face = models.BooleanField(
        default=False,
        help_text=_("Whether attendance was verified using face recognition")
    )
    confidence_score = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text=_("Face recognition confidence score (0-1, higher = more confident)")
    )
    face_distance = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text=_("Face matching distance (0-1, lower = better match)")
    )
    face_image = models.ImageField(
        upload_to='attendance/faces/%Y/%m/%d/',
        null=True,
        blank=True,
        help_text=_("Captured face image for verification (optional)")
    )
    
    # Session timing
    arrival_time = models.TimeField(
        null=True, 
        blank=True,
        help_text=_("Time participant arrived")
    )
    departure_time = models.TimeField(
        null=True, 
        blank=True,
        help_text=_("Time participant left")
    )
    
    # Additional information
    notes = models.TextField(
        blank=True,
        help_text=_("Additional notes about attendance")
    )
    late_arrival = models.BooleanField(
        default=False,
        help_text=_("Mark if participant arrived late")
    )
    early_departure = models.BooleanField(
        default=False,
        help_text=_("Mark if participant left early")
    )
    excused_absence = models.BooleanField(
        default=False,
        help_text=_("Mark if absence was excused")
    )
    
    # Metadata
    recorded_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='recorded_attendance'
    )
    recorded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'attendance_records'
        unique_together = ['participant', 'program', 'date', 'session_name']
        ordering = ['-date', 'program', 'participant']
        verbose_name = _('Attendance Record')
        verbose_name_plural = _('Attendance Records')
        indexes = [
            models.Index(fields=['participant', 'program', 'date']),
            models.Index(fields=['program', 'date']),
            models.Index(fields=['date']),
            models.Index(fields=['verified_by_face']),
            models.Index(fields=['present']),
        ]
    
    def __str__(self):
        status = "Present" if self.present else "Absent"
        verification = f" ({self.get_verification_method_display()})" if self.verification_method != 'manual' else ""
        return f"{self.participant.participant_id} - {self.program.name} - {self.date} ({status}{verification})"
    
    @property
    def duration_hours(self):
        """Calculate session duration in hours"""
        if self.arrival_time and self.departure_time:
            from datetime import datetime, timedelta
            arrival = datetime.combine(self.date, self.arrival_time)
            departure = datetime.combine(self.date, self.departure_time)
            
            # Handle case where departure is next day
            if departure < arrival:
                departure += timedelta(days=1)
            
            duration = departure - arrival
            return round(duration.total_seconds() / 3600, 2)
        return None
    
    @property
    def was_on_time(self):
        """Check if participant arrived on time (if session has start time)"""
        if not self.arrival_time or not hasattr(self, 'session'):
            return None
        
        session = AttendanceSession.objects.filter(
            program=self.program,
            session_date=self.date,
            session_name=self.session_name
        ).first()
        
        if session and session.start_time:
            return self.arrival_time <= session.start_time
        
        return None
    
    @property
    def face_recognition_quality(self):
        """Get quality rating for face recognition verification"""
        if not self.verified_by_face or not self.confidence_score:
            return None
        
        if self.confidence_score >= 0.9:
            return "Excellent"
        elif self.confidence_score >= 0.8:
            return "Good"
        elif self.confidence_score >= 0.7:
            return "Fair"
        elif self.confidence_score >= 0.6:
            return "Acceptable"
        else:
            return "Low"
    
    def clean(self):
        """Validate attendance record"""
        from django.core.exceptions import ValidationError
        
        if self.departure_time and self.arrival_time:
            # Allow departure next day, but check reasonable duration
            from datetime import datetime, timedelta
            arrival = datetime.combine(self.date, self.arrival_time)
            departure = datetime.combine(self.date, self.departure_time)
            
            if departure < arrival:
                departure += timedelta(days=1)
            
            duration_hours = (departure - arrival).total_seconds() / 3600
            if duration_hours > 24:
                raise ValidationError(_("Session duration cannot exceed 24 hours"))
        
        if self.verified_by_face and not self.participant.photo_consent_given:
            raise ValidationError(
                _("Cannot use face verification without participant photo consent")
            )
        
        if self.verified_by_face and self.verification_method != 'face_recognition':
            raise ValidationError(
                _("Verification method must be 'face_recognition' when verified_by_face is True")
            )
    
    def save(self, *args, **kwargs):
        # Auto-set verification method based on verified_by_face
        if self.verified_by_face and not self.verification_method:
            self.verification_method = 'face_recognition'
        
        super().save(*args, **kwargs)
        
        # Update enrollment attendance rate
        try:
            enrollment = self.participant.enrollments.get(program=self.program)
            enrollment.update_attendance_rate()
        except:
            pass


class AttendanceSession(models.Model):
    """
    Scheduled program sessions for attendance tracking
    Defines when and where sessions occur
    """
    program = models.ForeignKey(
        Program,
        on_delete=models.CASCADE,
        related_name='sessions'
    )
    
    session_name = models.CharField(
        max_length=200,
        help_text=_("Session identifier (e.g., 'Morning Session', 'Workshop 1')")
    )
    session_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    # Location
    location = models.CharField(
        max_length=200, 
        blank=True,
        help_text=_("Specific location within program site")
    )
    room = models.CharField(
        max_length=100,
        blank=True,
        help_text=_("Room number or name")
    )
    
    # Session details
    description = models.TextField(
        blank=True,
        help_text=_("Session description or agenda")
    )
    session_type = models.CharField(
        max_length=50,
        blank=True,
        choices=[
            ('class', 'Class/Lecture'),
            ('workshop', 'Workshop'),
            ('activity', 'Activity'),
            ('assessment', 'Assessment'),
            ('field_trip', 'Field Trip'),
            ('other', 'Other'),
        ],
        help_text=_("Type of session")
    )
    
    # Capacity
    max_capacity = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text=_("Maximum number of participants")
    )
    
    # Session status
    is_completed = models.BooleanField(
        default=False,
        help_text=_("Mark when session has ended")
    )
    is_cancelled = models.BooleanField(
        default=False,
        help_text=_("Mark if session was cancelled")
    )
    cancellation_reason = models.TextField(
        blank=True,
        help_text=_("Reason for cancellation")
    )
    
    # Face recognition settings for this session
    require_face_verification = models.BooleanField(
        default=False,
        help_text=_("Require face recognition for this session")
    )
    allow_manual_override = models.BooleanField(
        default=True,
        help_text=_("Allow manual attendance entry if face recognition fails")
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_sessions'
    )
    
    class Meta:
        db_table = 'attendance_sessions'
        ordering = ['-session_date', 'start_time']
        verbose_name = _('Attendance Session')
        verbose_name_plural = _('Attendance Sessions')
        indexes = [
            models.Index(fields=['program', 'session_date']),
            models.Index(fields=['session_date']),
            models.Index(fields=['is_completed', 'is_cancelled']),
        ]
    
    def __str__(self):
        return f"{self.program.name} - {self.session_name} ({self.session_date})"
    
    @property
    def duration_hours(self):
        """Calculate session duration in hours"""
        from datetime import datetime, timedelta
        start = datetime.combine(self.session_date, self.start_time)
        end = datetime.combine(self.session_date, self.end_time)
        
        # Handle overnight sessions
        if end < start:
            end += timedelta(days=1)
        
        duration = end - start
        return round(duration.total_seconds() / 3600, 2)
    
    @property
    def attendance_count(self):
        """Count of participants marked present"""
        return AttendanceRecord.objects.filter(
            program=self.program,
            date=self.session_date,
            session_name=self.session_name,
            present=True
        ).count()
    
    @property
    def expected_attendance(self):
        """Expected number of attendees (enrolled participants)"""
        return self.program.enrollments.filter(
            status__in=['enrolled', 'active']
        ).count()
    
    @property
    def attendance_rate(self):
        """Calculate attendance rate for this session"""
        expected = self.expected_attendance
        
        if expected == 0:
            return 0.0
        
        present_count = self.attendance_count
        return round((present_count / expected * 100), 2)
    
    @property
    def face_verification_rate(self):
        """Percentage of attendance verified by face recognition"""
        total = AttendanceRecord.objects.filter(
            program=self.program,
            date=self.session_date,
            session_name=self.session_name
        ).count()
        
        if total == 0:
            return 0.0
        
        face_verified = AttendanceRecord.objects.filter(
            program=self.program,
            date=self.session_date,
            session_name=self.session_name,
            verified_by_face=True
        ).count()
        
        return round((face_verified / total * 100), 2)
    
    @property
    def is_ongoing(self):
        """Check if session is currently in progress"""
        from django.utils import timezone
        now = timezone.now()
        
        if self.is_cancelled or self.is_completed:
            return False
        
        # Check if today is session date
        if now.date() != self.session_date:
            return False
        
        # Check if current time is within session time
        current_time = now.time()
        return self.start_time <= current_time <= self.end_time
    
    @property
    def is_upcoming(self):
        """Check if session is in the future"""
        from django.utils import timezone
        now = timezone.now()
        
        if self.is_cancelled or self.is_completed:
            return False
        
        return self.session_date > now.date() or \
               (self.session_date == now.date() and self.start_time > now.time())
    
    @property
    def capacity_percentage(self):
        """Calculate capacity usage percentage"""
        if not self.max_capacity:
            return None
        
        return round((self.attendance_count / self.max_capacity * 100), 2)
    
    @property
    def is_full(self):
        """Check if session is at capacity"""
        if not self.max_capacity:
            return False
        
        return self.attendance_count >= self.max_capacity
    
    def clean(self):
        """Validate session data"""
        from django.core.exceptions import ValidationError
        from datetime import datetime, timedelta
        
        # Validate time
        start = datetime.combine(self.session_date, self.start_time)
        end = datetime.combine(self.session_date, self.end_time)
        
        if end < start:
            end += timedelta(days=1)
        
        duration_hours = (end - start).total_seconds() / 3600
        
        if duration_hours > 24:
            raise ValidationError(_("Session duration cannot exceed 24 hours"))
        
        if duration_hours < 0.25:  # 15 minutes minimum
            raise ValidationError(_("Session must be at least 15 minutes long"))
        
        # Validate cancellation
        if self.is_cancelled and not self.cancellation_reason:
            raise ValidationError(_("Cancellation reason required when session is cancelled"))


class AttendanceException(models.Model):
    """
    Track exceptions to normal attendance (excused absences, late arrivals with reason)
    """
    attendance_record = models.OneToOneField(
        AttendanceRecord,
        on_delete=models.CASCADE,
        related_name='exception'
    )
    
    EXCEPTION_TYPE_CHOICES = [
        ('excused_absence', 'Excused Absence'),
        ('medical', 'Medical Reason'),
        ('family_emergency', 'Family Emergency'),
        ('official_business', 'Official Business'),
        ('late_justified', 'Justified Late Arrival'),
        ('early_justified', 'Justified Early Departure'),
        ('other', 'Other'),
    ]
    
    exception_type = models.CharField(
        max_length=20,
        choices=EXCEPTION_TYPE_CHOICES
    )
    reason = models.TextField(
        help_text=_("Detailed reason for exception")
    )
    
    # Supporting documentation
    documentation_provided = models.BooleanField(
        default=False,
        help_text=_("Whether supporting documentation was provided")
    )
    documentation_file = models.FileField(
        upload_to='attendance/exceptions/%Y/%m/',
        null=True,
        blank=True,
        help_text=_("Upload supporting documentation (e.g., medical note)")
    )
    
    # Approval
    approved = models.BooleanField(
        default=False,
        help_text=_("Whether exception was approved")
    )
    approved_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_exceptions'
    )
    approved_at = models.DateTimeField(
        null=True,
        blank=True
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_exceptions'
    )
    
    class Meta:
        db_table = 'attendance_exceptions'
        ordering = ['-created_at']
        verbose_name = _('Attendance Exception')
        verbose_name_plural = _('Attendance Exceptions')
    
    def __str__(self):
        return f"{self.get_exception_type_display()} - {self.attendance_record.participant.participant_id}"
    
    def approve(self, user):
        """Approve this exception"""
        from django.utils import timezone
        
        self.approved = True
        self.approved_by = user
        self.approved_at = timezone.now()
        self.save()
        
        # Update attendance record if excused absence
        if self.exception_type == 'excused_absence':
            self.attendance_record.excused_absence = True
            self.attendance_record.save()