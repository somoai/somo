import uuid
from django.db import models
from students.models import Student


class SMSMessage(models.Model):
    """Track all SMS messages sent and received."""

    DIRECTION_CHOICES = [
        ('inbound', 'Inbound'),
        ('outbound', 'Outbound'),
    ]

    STATUS_CHOICES = [
        ('queued', 'Queued'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        Student,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sms_messages',
        help_text="Associated student (if identified)"
    )
    phone_number = models.CharField(max_length=15, db_index=True)
    direction = models.CharField(max_length=10, choices=DIRECTION_CHOICES)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queued')
    cost = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Cost in KES"
    )
    sent_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    provider_message_id = models.CharField(
        max_length=100,
        blank=True,
        help_text="Message ID from Africa's Talking"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'SMS Message'
        verbose_name_plural = 'SMS Messages'
        indexes = [
            models.Index(fields=['phone_number', '-created_at']),
            models.Index(fields=['student', '-created_at']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.direction} - {self.phone_number} - {self.message[:30]}..."


class SMSSession(models.Model):
    """Track SMS conversation sessions."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='sms_sessions'
    )
    started_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    state = models.JSONField(
        default=dict,
        help_text="Session state: current_lesson, current_question_index, waiting_for_answer, etc."
    )
    message_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-last_activity']
        verbose_name = 'SMS Session'
        verbose_name_plural = 'SMS Sessions'
        indexes = [
            models.Index(fields=['student', '-last_activity']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.student.name} - SMS Session ({self.started_at.strftime('%Y-%m-%d %H:%M')})"

    @property
    def duration_minutes(self):
        """Calculate session duration in minutes."""
        if self.started_at and self.last_activity:
            delta = self.last_activity - self.started_at
            return delta.total_seconds() // 60
        return 0
