# apps/schools/models.py
from django.db import models
from django.utils import timezone


class School(models.Model):
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def total_students(self):
        return self.students.count()

    @property
    def active_students(self):
        return self.students.filter(status='active').count()


class Student(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('graduated', 'Graduated'),
        ('dropped_out', 'Dropped Out'),
    ]

    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name='students'
    )
    name = models.CharField(max_length=255)
    age = models.PositiveIntegerField()
    courses = models.CharField(max_length=500)
    parent_name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    midterm_marks = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    final_marks = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    graduated_at = models.DateTimeField(null=True, blank=True)
    dropped_out_at = models.DateTimeField(null=True, blank=True)
    dropout_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - {self.school.name}"