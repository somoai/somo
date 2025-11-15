import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from students.models import Student


class Subject(models.Model):
    """Core subjects (Math, English, Science, etc.)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, help_text="e.g., Mathematics, English")
    code = models.CharField(max_length=20, unique=True, help_text="e.g., MATH, ENG")
    description = models.TextField()
    grade_levels = models.JSONField(
        default=list,
        help_text="List of grade levels (1-8) this subject is taught"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Subject'
        verbose_name_plural = 'Subjects'

    def __str__(self):
        return self.name


class Concept(models.Model):
    """Learning concepts within subjects"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='concepts')
    name = models.CharField(max_length=200, help_text="e.g., Fractions, Verbs")
    code = models.CharField(max_length=50, unique=True, help_text="e.g., MATH_FRAC_G4")
    description = models.TextField()
    grade_level = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(8)]
    )
    prerequisites = models.ManyToManyField(
        'self',
        symmetrical=False,
        blank=True,
        related_name='dependent_concepts',
        help_text="Concepts that should be learned before this one"
    )
    learning_objectives = models.JSONField(
        default=list,
        help_text="List of learning objectives for this concept"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['grade_level', 'name']
        verbose_name = 'Concept'
        verbose_name_plural = 'Concepts'
        indexes = [
            models.Index(fields=['subject', 'grade_level']),
        ]

    def __str__(self):
        return f"{self.name} (Grade {self.grade_level})"


class Lesson(models.Model):
    """Individual lessons within concepts"""
    CONTENT_TYPE_CHOICES = [
        ('text', 'Text'),
        ('video', 'Video'),
        ('interactive', 'Interactive'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    concept = models.ForeignKey(Concept, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200)
    difficulty_level = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="1=Very Easy, 5=Very Hard"
    )
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES, default='text')
    content = models.JSONField(
        help_text='Structured content: {"introduction": "", "explanation": "", "examples": []}'
    )
    estimated_duration = models.IntegerField(
        help_text="Estimated time in seconds to complete this lesson"
    )
    order = models.IntegerField(
        default=0,
        help_text="Order within the concept"
    )
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['concept', 'order']
        verbose_name = 'Lesson'
        verbose_name_plural = 'Lessons'
        indexes = [
            models.Index(fields=['concept', 'order']),
            models.Index(fields=['is_published']),
        ]
        unique_together = ['concept', 'order']

    def __str__(self):
        return f"{self.title} ({self.concept.name})"


class Question(models.Model):
    """Questions for lessons"""
    QUESTION_TYPE_CHOICES = [
        ('mcq', 'Multiple Choice'),
        ('fill_blank', 'Fill in the Blank'),
        ('true_false', 'True/False'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES)
    options = models.JSONField(
        default=dict,
        blank=True,
        help_text='For MCQ: {"A": "option 1", "B": "option 2", ...}'
    )
    correct_answer = models.JSONField(
        help_text='Single value like "A" or list for multiple correct answers ["A", "C"]'
    )
    explanation = models.TextField(help_text="Explanation of the correct answer")
    difficulty_level = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        default=3
    )
    order = models.IntegerField(default=0)
    media_url = models.URLField(null=True, blank=True, help_text="Optional image/video URL")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['lesson', 'order']
        verbose_name = 'Question'
        verbose_name_plural = 'Questions'
        indexes = [
            models.Index(fields=['lesson', 'order']),
        ]

    def __str__(self):
        return f"Q{self.order}: {self.question_text[:50]}..."


class LessonAttempt(models.Model):
    """Records of student lesson attempts"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='lesson_attempts')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='attempts')
    channel = models.CharField(max_length=10, help_text="sms, ussd, or app")
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    answers = models.JSONField(
        default=list,
        help_text='[{"question_id": "...", "answer": "A", "correct": true}, ...]'
    )
    score = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Score as percentage (0-100)"
    )
    time_spent = models.IntegerField(
        null=True,
        blank=True,
        help_text="Time spent in seconds"
    )
    difficulty_level = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )

    class Meta:
        ordering = ['-started_at']
        verbose_name = 'Lesson Attempt'
        verbose_name_plural = 'Lesson Attempts'
        indexes = [
            models.Index(fields=['student', '-started_at']),
            models.Index(fields=['lesson', '-started_at']),
        ]

    def __str__(self):
        return f"{self.student.name} - {self.lesson.title} ({self.started_at.strftime('%Y-%m-%d')})"

    @property
    def is_completed(self):
        """Check if attempt is completed"""
        return self.completed_at is not None


class ConceptMastery(models.Model):
    """Track student mastery of concepts using spaced repetition"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='concept_masteries')
    concept = models.ForeignKey(Concept, on_delete=models.CASCADE, related_name='student_masteries')
    mastery_level = models.FloatField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Mastery level as percentage (0-100)"
    )
    attempts_count = models.IntegerField(default=0)
    last_practiced = models.DateTimeField(null=True, blank=True)
    next_review_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Suggested date for next review (spaced repetition)"
    )
    spaced_repetition_box = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(6)],
        help_text="Leitner box number for spaced repetition (1-6)"
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'concept']
        ordering = ['-mastery_level']
        verbose_name = 'Concept Mastery'
        verbose_name_plural = 'Concept Masteries'
        indexes = [
            models.Index(fields=['student', '-mastery_level']),
            models.Index(fields=['next_review_date']),
        ]

    def __str__(self):
        return f"{self.student.name} - {self.concept.name}: {self.mastery_level}%"
