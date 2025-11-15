from django.contrib import admin
from .models import Subject, Concept, Lesson, Question, LessonAttempt, ConceptMastery


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'get_grade_levels', 'created_at']
    search_fields = ['name', 'code']
    readonly_fields = ['id', 'created_at', 'updated_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'code', 'description')
        }),
        ('Grade Levels', {
            'fields': ('grade_levels',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_grade_levels(self, obj):
        if obj.grade_levels:
            return ', '.join([f'Grade {g}' for g in sorted(obj.grade_levels)])
        return 'None'
    get_grade_levels.short_description = 'Grade Levels'


@admin.register(Concept)
class ConceptAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'subject', 'grade_level', 'get_prerequisites_count', 'created_at']
    list_filter = ['subject', 'grade_level']
    search_fields = ['name', 'code']
    readonly_fields = ['id', 'created_at', 'updated_at']
    filter_horizontal = ['prerequisites']

    fieldsets = (
        ('Basic Information', {
            'fields': ('subject', 'name', 'code', 'grade_level', 'description')
        }),
        ('Learning Structure', {
            'fields': ('prerequisites', 'learning_objectives')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('subject')

    def get_prerequisites_count(self, obj):
        return obj.prerequisites.count()
    get_prerequisites_count.short_description = 'Prerequisites'


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    fields = ['order', 'question_text', 'question_type', 'difficulty_level']
    ordering = ['order']


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ['title', 'concept', 'difficulty_level', 'content_type', 'order', 'is_published', 'get_questions_count']
    list_filter = ['is_published', 'content_type', 'difficulty_level', 'concept__subject', 'concept__grade_level']
    search_fields = ['title', 'concept__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    list_editable = ['is_published']
    inlines = [QuestionInline]
    actions = ['publish_lessons', 'unpublish_lessons']

    fieldsets = (
        ('Basic Information', {
            'fields': ('concept', 'title', 'difficulty_level', 'content_type', 'order')
        }),
        ('Content', {
            'fields': ('content', 'estimated_duration')
        }),
        ('Publishing', {
            'fields': ('is_published',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('concept', 'concept__subject')

    def get_questions_count(self, obj):
        return obj.questions.count()
    get_questions_count.short_description = 'Questions'

    def publish_lessons(self, request, queryset):
        updated = queryset.update(is_published=True)
        self.message_user(request, f'{updated} lessons were published.')
    publish_lessons.short_description = "Publish selected lessons"

    def unpublish_lessons(self, request, queryset):
        updated = queryset.update(is_published=False)
        self.message_user(request, f'{updated} lessons were unpublished.')
    unpublish_lessons.short_description = "Unpublish selected lessons"


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['get_short_text', 'lesson', 'question_type', 'difficulty_level', 'order']
    list_filter = ['question_type', 'difficulty_level', 'lesson__concept__subject']
    search_fields = ['question_text', 'lesson__title']
    readonly_fields = ['id', 'created_at', 'updated_at']

    fieldsets = (
        ('Question Details', {
            'fields': ('lesson', 'order', 'question_type', 'question_text', 'difficulty_level')
        }),
        ('Answer Configuration', {
            'fields': ('options', 'correct_answer', 'explanation')
        }),
        ('Media', {
            'fields': ('media_url',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('lesson', 'lesson__concept')

    def get_short_text(self, obj):
        return obj.question_text[:60] + '...' if len(obj.question_text) > 60 else obj.question_text
    get_short_text.short_description = 'Question'


@admin.register(LessonAttempt)
class LessonAttemptAdmin(admin.ModelAdmin):
    list_display = ['student', 'lesson', 'channel', 'score', 'is_completed', 'started_at', 'completed_at']
    list_filter = ['channel', 'started_at', 'lesson__concept__subject']
    search_fields = ['student__name', 'student__phone_number', 'lesson__title']
    readonly_fields = ['id', 'started_at', 'is_completed']
    date_hierarchy = 'started_at'

    fieldsets = (
        ('Attempt Information', {
            'fields': ('student', 'lesson', 'channel', 'difficulty_level')
        }),
        ('Progress', {
            'fields': ('started_at', 'completed_at', 'is_completed', 'time_spent')
        }),
        ('Results', {
            'fields': ('answers', 'score')
        }),
        ('Metadata', {
            'fields': ('id',),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('student', 'lesson', 'lesson__concept')


@admin.register(ConceptMastery)
class ConceptMasteryAdmin(admin.ModelAdmin):
    list_display = ['student', 'concept', 'mastery_level', 'attempts_count', 'spaced_repetition_box', 'last_practiced', 'next_review_date']
    list_filter = ['spaced_repetition_box', 'concept__subject', 'concept__grade_level']
    search_fields = ['student__name', 'student__phone_number', 'concept__name']
    readonly_fields = ['id', 'updated_at']
    date_hierarchy = 'last_practiced'

    fieldsets = (
        ('Mastery Information', {
            'fields': ('student', 'concept', 'mastery_level', 'attempts_count')
        }),
        ('Spaced Repetition', {
            'fields': ('spaced_repetition_box', 'last_practiced', 'next_review_date')
        }),
        ('Metadata', {
            'fields': ('id', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('student', 'concept', 'concept__subject')
