from django.contrib import admin
from .models import School, Student, Parent, StudentSession


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ['name', 'county', 'type', 'total_students', 'is_partner', 'created_at']
    list_filter = ['type', 'is_partner', 'county']
    search_fields = ['name', 'county', 'contact_phone']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'county', 'type', 'contact_phone')
        }),
        ('Statistics', {
            'fields': ('total_students', 'is_partner')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class ParentInline(admin.TabularInline):
    model = Parent.students.through
    extra = 0
    verbose_name = "Parent/Guardian"
    verbose_name_plural = "Parents/Guardians"


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone_number', 'grade_level', 'school', 'preferred_channel', 'is_active', 'date_joined']
    list_filter = ['grade_level', 'preferred_channel', 'language', 'is_active', 'school']
    search_fields = ['name', 'phone_number']
    readonly_fields = ['id', 'date_joined']
    inlines = [ParentInline]

    fieldsets = (
        ('Personal Information', {
            'fields': ('name', 'phone_number', 'grade_level', 'school')
        }),
        ('Preferences', {
            'fields': ('preferred_channel', 'language', 'is_active')
        }),
        ('Custom Settings', {
            'fields': ('settings',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id', 'date_joined'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('school')


@admin.register(Parent)
class ParentAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone_number', 'get_students_count', 'created_at']
    search_fields = ['name', 'phone_number']
    readonly_fields = ['id', 'created_at', 'updated_at']
    filter_horizontal = ['students']

    fieldsets = (
        ('Personal Information', {
            'fields': ('name', 'phone_number')
        }),
        ('Children', {
            'fields': ('students',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_students_count(self, obj):
        return obj.students.count()
    get_students_count.short_description = 'Number of Students'


@admin.register(StudentSession)
class StudentSessionAdmin(admin.ModelAdmin):
    list_display = ['student', 'channel', 'started_at', 'ended_at', 'is_active']
    list_filter = ['channel', 'started_at']
    search_fields = ['student__name', 'student__phone_number']
    readonly_fields = ['id', 'started_at', 'is_active']

    fieldsets = (
        ('Session Information', {
            'fields': ('student', 'channel', 'started_at', 'ended_at', 'is_active')
        }),
        ('Session Data', {
            'fields': ('events', 'state'),
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
