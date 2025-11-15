"""
Learning Engine API Views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import logging

from .lesson_selector import LessonSelector
from .spaced_repetition import SpacedRepetitionScheduler
from .progress_tracker import ProgressTracker
from .concept_graph import ConceptDependencyGraph
from .mastery_calculator import MasteryCalculator

logger = logging.getLogger('somoai.learning_engine')


class LearningViewSet(viewsets.ViewSet):
    """
    API endpoints for adaptive learning engine.
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def next_lesson(self, request):
        """
        GET /api/learning/next-lesson/

        Get adaptive next lesson recommendation.

        Query params:
        - student_id: UUID of student (required)
        - subject: Subject code (optional, e.g., 'MATH')

        Returns:
            Recommended lesson with reasoning
        """
        try:
            student_id = request.query_params.get('student_id')
            subject_code = request.query_params.get('subject')

            if not student_id:
                return Response(
                    {'error': 'student_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            selector = LessonSelector(student_id)
            recommendation = selector.select_next_lesson(subject_code)

            return Response(recommendation)

        except Exception as e:
            logger.error(f"Error getting next lesson: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def lesson_sequence(self, request):
        """
        GET /api/learning/lesson-sequence/

        Get sequence of recommended lessons.

        Query params:
        - student_id: UUID of student (required)
        - count: Number of lessons (default: 5)
        - subject: Subject code (optional)

        Returns:
            List of recommended lessons in order
        """
        try:
            student_id = request.query_params.get('student_id')
            count = int(request.query_params.get('count', 5))
            subject_code = request.query_params.get('subject')

            if not student_id:
                return Response(
                    {'error': 'student_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            selector = LessonSelector(student_id)
            sequence = selector.get_lesson_sequence(count, subject_code)

            return Response({
                'student_id': student_id,
                'count': len(sequence),
                'sequence': sequence
            })

        except Exception as e:
            logger.error(f"Error getting lesson sequence: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def review_session(self, request):
        """
        GET /api/learning/review-session/

        Get spaced repetition review session.

        Query params:
        - student_id: UUID of student (required)
        - duration: Available time in minutes (default: 15)

        Returns:
            Optimized review session plan
        """
        try:
            student_id = request.query_params.get('student_id')
            duration = int(request.query_params.get('duration', 15))

            if not student_id:
                return Response(
                    {'error': 'student_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            scheduler = SpacedRepetitionScheduler(student_id)
            session = scheduler.get_optimal_review_session(duration)

            return Response(session)

        except Exception as e:
            logger.error(f"Error getting review session: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def due_reviews(self, request):
        """
        GET /api/learning/due-reviews/

        Get all concepts due for review.

        Query params:
        - student_id: UUID of student (required)

        Returns:
            List of concepts due for review
        """
        try:
            student_id = request.query_params.get('student_id')

            if not student_id:
                return Response(
                    {'error': 'student_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            scheduler = SpacedRepetitionScheduler(student_id)
            due_reviews = scheduler.get_due_reviews()

            return Response({
                'student_id': student_id,
                'total_due': len(due_reviews),
                'reviews': due_reviews
            })

        except Exception as e:
            logger.error(f"Error getting due reviews: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def progress(self, request):
        """
        GET /api/learning/progress/

        Get comprehensive progress summary.

        Query params:
        - student_id: UUID of student (required)

        Returns:
            Progress summary with mastery, time, streaks, etc.
        """
        try:
            student_id = request.query_params.get('student_id')

            if not student_id:
                return Response(
                    {'error': 'student_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            tracker = ProgressTracker()
            progress = tracker.get_progress_summary(student_id)

            return Response(progress)

        except Exception as e:
            logger.error(f"Error getting progress: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def knowledge_gaps(self, request):
        """
        GET /api/learning/knowledge-gaps/

        Get concepts student is struggling with.

        Query params:
        - student_id: UUID of student (required)

        Returns:
            List of knowledge gaps with severity
        """
        try:
            student_id = request.query_params.get('student_id')

            if not student_id:
                return Response(
                    {'error': 'student_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            tracker = ProgressTracker()
            gaps = tracker.identify_knowledge_gaps(student_id)

            return Response({
                'student_id': student_id,
                'total_gaps': len(gaps),
                'gaps': gaps
            })

        except Exception as e:
            logger.error(f"Error getting knowledge gaps: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def learning_path(self, request):
        """
        GET /api/learning/learning-path/

        Generate optimal learning path to target concept.

        Query params:
        - student_id: UUID of student (required)
        - target_concept: UUID of target concept (required)

        Returns:
            Ordered list of concepts to master
        """
        try:
            student_id = request.query_params.get('student_id')
            target_concept_id = request.query_params.get('target_concept')

            if not student_id or not target_concept_id:
                return Response(
                    {'error': 'student_id and target_concept are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            graph = ConceptDependencyGraph()
            path = graph.get_learning_path(student_id, target_concept_id)

            return Response({
                'student_id': student_id,
                'target_concept_id': target_concept_id,
                'path_length': len(path),
                'path': path
            })

        except Exception as e:
            logger.error(f"Error getting learning path: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def can_attempt(self, request):
        """
        GET /api/learning/can-attempt/

        Check if student can attempt a concept (prerequisites met).

        Query params:
        - student_id: UUID of student (required)
        - concept_id: UUID of concept (required)

        Returns:
            Eligibility status with prerequisite details
        """
        try:
            student_id = request.query_params.get('student_id')
            concept_id = request.query_params.get('concept_id')

            if not student_id or not concept_id:
                return Response(
                    {'error': 'student_id and concept_id are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            graph = ConceptDependencyGraph()
            eligibility = graph.can_attempt_concept(student_id, concept_id)

            return Response(eligibility)

        except Exception as e:
            logger.error(f"Error checking concept eligibility: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def record_completion(self, request):
        """
        POST /api/learning/record-completion/

        Record a lesson completion and update mastery.

        Request body:
        - lesson_attempt_id: UUID of completed lesson attempt

        Returns:
            Updated mastery and spaced repetition schedule
        """
        try:
            lesson_attempt_id = request.data.get('lesson_attempt_id')

            if not lesson_attempt_id:
                return Response(
                    {'error': 'lesson_attempt_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            tracker = ProgressTracker()
            result = tracker.record_lesson_completion(lesson_attempt_id)

            if result.get('success'):
                return Response(result)
            else:
                return Response(
                    result,
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            logger.error(f"Error recording completion: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def update_mastery(self, request):
        """
        POST /api/learning/update-mastery/

        Recalculate mastery for all concepts.

        Request body:
        - student_id: UUID of student

        Returns:
            Update summary
        """
        try:
            student_id = request.data.get('student_id')

            if not student_id:
                return Response(
                    {'error': 'student_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            calculator = MasteryCalculator()
            result = calculator.update_all_mastery(student_id)

            return Response(result)

        except Exception as e:
            logger.error(f"Error updating mastery: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
