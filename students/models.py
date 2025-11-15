import uuid
from django.db import models


class School(models.Model):
    """Educational institution model"""
    TYPE_CHOICES = [
        ('public', 'Public'),
        ('private', 'Private'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    county = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    total_students = models.IntegerField(default=0)
    contact_phone = models.CharField(max_length=15)
    is_partner = models.BooleanField(default=False, help_text="Partner schools get additional features")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'School'
        verbose_name_plural = 'Schools'

    def __str__(self):
        return f"{self.name} ({self.county})"


class Student(models.Model):
    """Student/Learner model"""
    GRADE_CHOICES = [(i, f'Grade {i}') for i in range(1, 9)]
    CHANNEL_CHOICES = [
        ('sms', 'SMS'),
        ('ussd', 'USSD'),
        ('app', 'App'),
    ]
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('sw', 'Swahili'),
    ]
    SUBSCRIPTION_CHOICES = [
        ('free', 'Free'),
        ('basic', 'Basic'),
        ('premium', 'Premium'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = models.CharField(max_length=15, unique=True, db_index=True)
    name = models.CharField(max_length=100)
    grade_level = models.IntegerField(choices=GRADE_CHOICES)
    school = models.ForeignKey(
        School,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students'
    )
    date_joined = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    preferred_channel = models.CharField(
        max_length=10,
        choices=CHANNEL_CHOICES,
        default='sms'
    )
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default='en')
    subscription_tier = models.CharField(
        max_length=20,
        choices=SUBSCRIPTION_CHOICES,
        default='free',
        help_text="Subscription tier for SMS quotas"
    )
    settings = models.JSONField(
        default=dict,
        blank=True,
        help_text="User preferences and custom settings"
    )

    class Meta:
        ordering = ['-date_joined']
        verbose_name = 'Student'
        verbose_name_plural = 'Students'
        indexes = [
            models.Index(fields=['phone_number']),
            models.Index(fields=['grade_level']),
            models.Index(fields=['school', 'grade_level']),
        ]

    def __str__(self):
        return f"{self.name} (Grade {self.grade_level})"


class Parent(models.Model):
    """Parent/Guardian model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = models.CharField(max_length=15, unique=True)
    name = models.CharField(max_length=100)
    students = models.ManyToManyField(Student, related_name='parents')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Parent'
        verbose_name_plural = 'Parents'

    def __str__(self):
        return f"{self.name} ({self.phone_number})"


class StudentSession(models.Model):
    """Track user sessions across channels (SMS, USSD, App)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='sessions')
    channel = models.CharField(max_length=10)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    events = models.JSONField(
        default=list,
        help_text="List of events/actions during this session"
    )
    state = models.JSONField(
        default=dict,
        help_text="Session state data (current lesson, progress, etc.)"
    )

    class Meta:
        ordering = ['-started_at']
        verbose_name = 'Student Session'
        verbose_name_plural = 'Student Sessions'
        indexes = [
            models.Index(fields=['student', '-started_at']),
        ]

    def __str__(self):
        return f"{self.student.name} - {self.channel} ({self.started_at.strftime('%Y-%m-%d %H:%M')})"

    @property
    def is_active(self):
        """Check if session is still active"""
        return self.ended_at is None
