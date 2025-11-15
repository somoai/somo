"""
Authentication models for SomoAI.
"""
import uuid
from django.db import models
from django.utils import timezone
from datetime import timedelta


class OTPVerification(models.Model):
    """
    One-Time Password verification records.

    Used to verify phone numbers during registration and login.
    OTPs expire after 5 minutes and allow max 3 verification attempts.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = models.CharField(
        max_length=15,
        db_index=True,
        help_text="Phone number in E.164 format (e.g., +254712345678)"
    )
    otp_code = models.CharField(
        max_length=6,
        help_text="6-digit OTP code"
    )
    is_verified = models.BooleanField(
        default=False,
        help_text="Whether this OTP has been successfully verified"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(
        help_text="OTP expiration time (5 minutes from creation)"
    )
    attempts = models.IntegerField(
        default=0,
        help_text="Number of verification attempts made"
    )
    max_attempts = models.IntegerField(
        default=3,
        help_text="Maximum allowed verification attempts"
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'OTP Verification'
        verbose_name_plural = 'OTP Verifications'
        indexes = [
            models.Index(fields=['phone_number', '-created_at']),
        ]

    def __str__(self):
        return f"{self.phone_number} - {'Verified' if self.is_verified else 'Pending'}"

    @property
    def is_expired(self):
        """Check if OTP has expired."""
        return timezone.now() > self.expires_at

    @property
    def attempts_remaining(self):
        """Get number of verification attempts remaining."""
        return max(0, self.max_attempts - self.attempts)

    def can_verify(self):
        """
        Check if this OTP can still be verified.

        Returns:
            bool: True if OTP is not expired, not verified, and has attempts remaining
        """
        return (
            not self.is_expired and
            not self.is_verified and
            self.attempts < self.max_attempts
        )

    def save(self, *args, **kwargs):
        """Set expiration time on creation."""
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=5)
        super().save(*args, **kwargs)
