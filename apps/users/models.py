# apps/users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """
    Custom User model with role-based access control
    Extends Django's AbstractUser to include organizational roles
    """
    
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('teacher', 'Teacher'),
        ('donor', 'Donor'),
        ('program_manager', 'Program Manager'),
    ]
    
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='donor',
        help_text=_("User role determines access permissions")
    )
    organization = models.CharField(
        max_length=200, 
        blank=True,
        help_text=_("Organization or donor agency name")
    )
    phone_number = models.CharField(max_length=20, blank=True)
    
    # Profile
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    
    # Audit fields
    is_active = models.BooleanField(default=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        ordering = ['-date_joined']
        verbose_name = _('User')
        verbose_name_plural = _('Users')
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_admin(self):
        return self.role == 'admin'
    
    @property
    def is_donor(self):
        return self.role == 'donor'
    
    @property
    def is_teacher(self):
        return self.role == 'teacher'
    
    @property
    def can_edit_data(self):
        return self.role in ['admin', 'teacher', 'program_manager']


class AuditLog(models.Model):
    """
    Track all significant actions in the system for accountability
    """
    
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('export', 'Export Data'),
        ('view', 'View Sensitive Data'),
    ]
    
    user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='audit_logs'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100, blank=True)
    object_id = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Store changed data as JSON
    changes = models.JSONField(null=True, blank=True)
    
    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['model_name', 'object_id']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.action} - {self.timestamp}"