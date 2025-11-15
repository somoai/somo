from django.contrib import admin
from django.utils import timezone
from .models import OTPVerification


@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    """Admin interface for OTP verifications."""

    list_display = [
        'phone_number',
        'otp_code',
        'is_verified',
        'created_at',
        'expires_at',
        'attempts',
        'attempts_remaining',
        'is_expired_status'
    ]
    list_filter = ['is_verified', 'created_at']
    search_fields = ['phone_number', 'otp_code']
    readonly_fields = [
        'id',
        'created_at',
        'is_expired_status',
        'attempts_remaining'
    ]
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Contact Information', {
            'fields': ('phone_number',)
        }),
        ('OTP Details', {
            'fields': ('otp_code', 'is_verified', 'attempts', 'max_attempts', 'attempts_remaining')
        }),
        ('Timing', {
            'fields': ('created_at', 'expires_at', 'is_expired_status')
        }),
        ('Metadata', {
            'fields': ('id',),
            'classes': ('collapse',)
        }),
    )

    def is_expired_status(self, obj):
        """Display expiration status."""
        return obj.is_expired
    is_expired_status.short_description = 'Expired'
    is_expired_status.boolean = True

    def get_queryset(self, request):
        """Optimize queryset."""
        qs = super().get_queryset(request)
        return qs

    def has_add_permission(self, request):
        """Prevent manual creation of OTP records in admin."""
        return False
