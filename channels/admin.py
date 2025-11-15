from django.contrib import admin
from django.db.models import Sum, Count
from .models import SMSMessage, SMSSession


@admin.register(SMSMessage)
class SMSMessageAdmin(admin.ModelAdmin):
    list_display = ['get_short_message', 'phone_number', 'direction', 'status', 'cost', 'sent_at', 'student']
    list_filter = ['direction', 'status', 'sent_at']
    search_fields = ['phone_number', 'message', 'student__name']
    readonly_fields = ['id', 'created_at', 'updated_at', 'sent_at']
    date_hierarchy = 'sent_at'

    fieldsets = (
        ('Message Details', {
            'fields': ('phone_number', 'student', 'direction', 'message')
        }),
        ('Status', {
            'fields': ('status', 'sent_at', 'delivered_at')
        }),
        ('Cost & Provider', {
            'fields': ('cost', 'provider_message_id')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('student')

    def get_short_message(self, obj):
        return obj.message[:50] + '...' if len(obj.message) > 50 else obj.message
    get_short_message.short_description = 'Message'

    def changelist_view(self, request, extra_context=None):
        # Add cost analytics to changelist
        extra_context = extra_context or {}

        # Calculate total costs
        total_cost = SMSMessage.objects.filter(
            cost__isnull=False
        ).aggregate(Sum('cost'))['cost__sum'] or 0

        # Count by status
        status_counts = SMSMessage.objects.values('status').annotate(
            count=Count('id')
        )

        extra_context['total_sms_cost'] = total_cost
        extra_context['status_counts'] = status_counts

        return super().changelist_view(request, extra_context=extra_context)


@admin.register(SMSSession)
class SMSSessionAdmin(admin.ModelAdmin):
    list_display = ['student', 'started_at', 'last_activity', 'message_count', 'is_active', 'duration_minutes']
    list_filter = ['is_active', 'started_at']
    search_fields = ['student__name', 'student__phone_number']
    readonly_fields = ['id', 'started_at', 'last_activity', 'duration_minutes']
    date_hierarchy = 'started_at'

    fieldsets = (
        ('Session Info', {
            'fields': ('student', 'is_active', 'message_count')
        }),
        ('Timing', {
            'fields': ('started_at', 'last_activity', 'duration_minutes')
        }),
        ('State Data', {
            'fields': ('state',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id',),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('student')
