from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Subject, Concept, Lesson, Question, LessonAttempt, ConceptMastery
from .serializers import (
    SubjectSerializer,
    ConceptSerializer,
    ConceptListSerializer,
    LessonSerializer,
    LessonListSerializer,
    QuestionSerializer,
    LessonAttemptSerializer,
    LessonAttemptCreateSerializer,
    LessonSubmitSerializer,
    ConceptMasterySerializer
)


class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing subjects.
    Public endpoint - no authentication required for viewing subjects.
    """
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [AllowAny]  # Public access for subjects
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class ConceptViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing concepts.
    Read-only for students, with filtering by subject and grade.
    """
    queryset = Concept.objects.all().select_related('subject').prefetch_related('prerequisites')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['subject', 'grade_level']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'grade_level', 'created_at']
    ordering = ['grade_level', 'name']

    def get_serializer_class(self):
        """Use simpler serializer for list action"""
        if self.action == 'list':
            return ConceptListSerializer
        return ConceptSerializer

    @action(detail=True, methods=['get'])
    def prerequisites(self, request, pk=None):
        """
        Get prerequisite tree for a concept.
        Returns all prerequisites recursively.
        """
        concept = self.get_object()

        def get_prerequisite_tree(concept_obj, visited=None):
            if visited is None:
                visited = set()

            if concept_obj.id in visited:
                return []

            visited.add(concept_obj.id)

            prereqs = []
            for prereq in concept_obj.prerequisites.all():
                prereqs.append({
                    'id': str(prereq.id),
                    'name': prereq.name,
                    'code': prereq.code,
                    'grade_level': prereq.grade_level,
                    'prerequisites': get_prerequisite_tree(prereq, visited)
                })

            return prereqs

        tree = get_prerequisite_tree(concept)
        return Response({
            'concept': ConceptListSerializer(concept).data,
            'prerequisite_tree': tree
        })


class LessonViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for lessons.
    Students can view published lessons, start attempts, and submit answers.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['concept', 'difficulty_level', 'content_type']
    search_fields = ['title', 'concept__name']
    ordering_fields = ['title', 'difficulty_level', 'order']
    ordering = ['concept', 'order']

    def get_queryset(self):
        """Only show published lessons"""
        return Lesson.objects.filter(is_published=True).select_related(
            'concept', 'concept__subject'
        ).prefetch_related('questions')

    def get_serializer_class(self):
        """Use simpler serializer for list action"""
        if self.action == 'list':
            return LessonListSerializer
        return LessonSerializer

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """
        Start a lesson attempt.
        Creates a new LessonAttempt record.
        """
        lesson = self.get_object()

        # Get student from request (for now using passed data, will use auth later)
        serializer = LessonAttemptCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Check if there's an incomplete attempt
        incomplete_attempt = LessonAttempt.objects.filter(
            student=serializer.validated_data['student'],
            lesson=lesson,
            completed_at__isnull=True
        ).first()

        if incomplete_attempt:
            return Response(
                {
                    'detail': 'You have an incomplete attempt for this lesson',
                    'attempt_id': str(incomplete_attempt.id)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create new attempt
        attempt = serializer.save(lesson=lesson)

        return Response({
            'attempt_id': str(attempt.id),
            'lesson': LessonSerializer(lesson, context={'request': request}).data,
            'started_at': attempt.started_at
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """
        Submit answers for a lesson.
        Calculates score and updates the lesson attempt.
        """
        lesson = self.get_object()

        # Validate submission
        submit_serializer = LessonSubmitSerializer(data=request.data)
        submit_serializer.is_valid(raise_exception=True)

        answers_data = submit_serializer.validated_data['answers']
        time_spent = submit_serializer.validated_data.get('time_spent')

        # Get the attempt (for now, find the most recent incomplete attempt)
        # TODO: Should pass attempt_id in request
        student_id = request.data.get('student_id')
        if not student_id:
            return Response(
                {'detail': 'student_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        attempt = LessonAttempt.objects.filter(
            student_id=student_id,
            lesson=lesson,
            completed_at__isnull=True
        ).first()

        if not attempt:
            return Response(
                {'detail': 'No incomplete attempt found for this lesson'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get all questions for this lesson
        questions = {str(q.id): q for q in lesson.questions.all()}

        # Process answers and calculate score
        processed_answers = []
        correct_count = 0

        for answer_data in answers_data:
            question_id = answer_data['question_id']
            student_answer = answer_data['answer']

            question = questions.get(question_id)
            if not question:
                continue

            # Check if answer is correct
            correct_answer = question.correct_answer
            is_correct = False

            if isinstance(correct_answer, list):
                # Multiple correct answers
                is_correct = student_answer in correct_answer
            else:
                # Single correct answer
                is_correct = student_answer == correct_answer

            if is_correct:
                correct_count += 1

            processed_answers.append({
                'question_id': question_id,
                'answer': student_answer,
                'correct': is_correct,
                'correct_answer': correct_answer,
                'explanation': question.explanation
            })

        # Calculate score
        total_questions = len(questions)
        score = (correct_count / total_questions * 100) if total_questions > 0 else 0

        # Update attempt
        attempt.answers = processed_answers
        attempt.score = score
        attempt.completed_at = timezone.now()
        if time_spent:
            attempt.time_spent = time_spent
        attempt.save()

        # Return results
        return Response({
            'attempt_id': str(attempt.id),
            'score': score,
            'correct_count': correct_count,
            'total_questions': total_questions,
            'answers': processed_answers,
            'completed_at': attempt.completed_at
        })


class LessonAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing lesson attempts.
    Students can view their own attempts.
    """
    queryset = LessonAttempt.objects.all().select_related(
        'student', 'lesson', 'lesson__concept'
    )
    serializer_class = LessonAttemptSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['student', 'lesson', 'channel']
    ordering_fields = ['started_at', 'score']
    ordering = ['-started_at']

    def get_queryset(self):
        """
        Optionally filter by student.
        """
        queryset = super().get_queryset()
        student_id = self.request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        return queryset


class ConceptMasteryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing concept mastery levels.
    Shows student progress on concepts.
    """
    queryset = ConceptMastery.objects.all().select_related(
        'student', 'concept', 'concept__subject'
    )
    serializer_class = ConceptMasterySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['student', 'concept', 'concept__subject', 'concept__grade_level']
    ordering_fields = ['mastery_level', 'last_practiced', 'next_review_date']
    ordering = ['-mastery_level']

    def get_queryset(self):
        """
        Optionally filter by student.
        """
        queryset = super().get_queryset()
        student_id = self.request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        return queryset
