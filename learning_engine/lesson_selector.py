"""
Lesson Selector - Selects next optimal lesson using adaptive logic.
"""
from typing import Dict, List, Optional
from django.db.models import Q
from django.utils import timezone
import logging

from content.models import Lesson, Concept, ConceptMastery, LessonAttempt
from .difficulty_adjuster import DifficultyAdjuster
from .spaced_repetition import SpacedRepetitionScheduler
from .concept_graph import ConceptDependencyGraph

logger = logging.getLogger('somoai.learning_engine')


class LessonSelector:
    """
    Selects next optimal lesson using adaptive logic.

    Priority:
    1. Due reviews (spaced repetition)
    2. Fill knowledge gaps (concepts < 60% mastery)
    3. Continue curriculum sequence
    4. Enrichment (if grade level mastered)
    """

    KNOWLEDGE_GAP_THRESHOLD = 60.0  # Mastery below this is a "gap"
    MASTERY_THRESHOLD = 80.0  # Mastery above this is "mastered"

    def __init__(self, student_id: str):
        """
        Initialize LessonSelector for a specific student.

        Args:
            student_id: UUID of the student
        """
        self.student_id = student_id
        self.difficulty_adjuster = DifficultyAdjuster(student_id)
        self.spaced_repetition = SpacedRepetitionScheduler(student_id)
        self.concept_graph = ConceptDependencyGraph()

    def select_next_lesson(self, subject_code: Optional[str] = None) -> Dict:
        """
        Select optimal next lesson for student.

        Args:
            subject_code: Optional subject filter (e.g., 'MATH')

        Returns:
            Dictionary with recommended lesson and reasoning
        """
        try:
            # Priority 1: Check for due reviews
            due_reviews = self.spaced_repetition.get_due_reviews()

            if due_reviews:
                # Filter by subject if specified
                if subject_code:
                    due_reviews = [r for r in due_reviews if r['subject_code'] == subject_code]

                if due_reviews:
                    # Select highest priority review (most overdue, lowest box)
                    review = due_reviews[0]
                    lesson = self._select_lesson_for_concept(
                        review['concept_id'],
                        review['mastery_level']
                    )

                    if lesson:
                        return {
                            'lesson': lesson,
                            'reason': 'spaced_repetition',
                            'priority': 'high',
                            'details': f"Review: {review['concept_name']} (Box {review['box']}, "
                                     f"{review['days_overdue']} days overdue)"
                        }

            # Priority 2: Fill knowledge gaps
            knowledge_gaps = self._identify_knowledge_gaps(subject_code)

            if knowledge_gaps:
                gap = knowledge_gaps[0]  # Highest priority gap
                lesson = self._select_lesson_for_concept(
                    gap['concept_id'],
                    gap['mastery_level']
                )

                if lesson:
                    return {
                        'lesson': lesson,
                        'reason': 'knowledge_gap',
                        'priority': 'medium',
                        'details': f"Strengthen: {gap['concept_name']} "
                                 f"({gap['mastery_level']:.0f}% mastery)"
                    }

            # Priority 3: Continue curriculum sequence
            next_concept = self._get_next_curriculum_concept(subject_code)

            if next_concept:
                lesson = self._select_lesson_for_concept(
                    str(next_concept.id),
                    0  # New concept
                )

                if lesson:
                    return {
                        'lesson': lesson,
                        'reason': 'curriculum_sequence',
                        'priority': 'normal',
                        'details': f"New concept: {next_concept.name}"
                    }

            # Priority 4: Enrichment - if everything is mastered, offer challenging content
            enrichment_lesson = self._select_enrichment_lesson(subject_code)

            if enrichment_lesson:
                return {
                    'lesson': enrichment_lesson,
                    'reason': 'enrichment',
                    'priority': 'low',
                    'details': 'Challenge yourself with advanced material'
                }

            # Fallback: any available lesson
            return {
                'lesson': None,
                'reason': 'no_lessons_available',
                'priority': 'none',
                'details': 'No lessons currently available'
            }

        except Exception as e:
            logger.error(f"Error selecting next lesson for student {self.student_id}: {str(e)}")
            return {
                'lesson': None,
                'reason': 'error',
                'priority': 'none',
                'details': str(e)
            }

    def get_lesson_sequence(self, count: int = 5, subject_code: Optional[str] = None) -> List[Dict]:
        """
        Get next N lessons in optimal sequence.

        Args:
            count: Number of lessons to return
            subject_code: Optional subject filter

        Returns:
            List of recommended lessons in order
        """
        sequence = []
        already_selected = set()

        for _ in range(count):
            recommendation = self.select_next_lesson(subject_code)

            if recommendation['lesson'] is None:
                break

            lesson = recommendation['lesson']

            # Avoid duplicates
            if lesson['id'] in already_selected:
                break

            already_selected.add(lesson['id'])
            sequence.append(recommendation)

        return sequence

    def _select_lesson_for_concept(self, concept_id: str, current_mastery: float) -> Optional[Dict]:
        """
        Select appropriate lesson for a concept based on mastery level.

        Args:
            concept_id: UUID of the concept
            current_mastery: Current mastery level (0-100)

        Returns:
            Lesson dictionary or None
        """
        try:
            # Determine appropriate difficulty
            if current_mastery >= 80:
                target_difficulty = 4  # Advanced
            elif current_mastery >= 60:
                target_difficulty = 3  # Intermediate
            elif current_mastery >= 40:
                target_difficulty = 2  # Basic
            else:
                target_difficulty = 1  # Beginner

            # Get lessons for this concept
            lessons = Lesson.objects.filter(
                concept_id=concept_id,
                is_published=True,
                difficulty_level=target_difficulty
            ).order_by('order')

            # Check if already completed at this difficulty
            if lessons.exists():
                for lesson in lessons:
                    # Check if this specific lesson was already attempted recently
                    recent_attempt = LessonAttempt.objects.filter(
                        student_id=self.student_id,
                        lesson=lesson
                    ).order_by('-completed_at').first()

                    # If never attempted or last attempt was more than 7 days ago
                    if not recent_attempt or (
                        recent_attempt.completed_at and
                        (timezone.now() - recent_attempt.completed_at).days > 7
                    ):
                        return self._format_lesson(lesson)

            # If all lessons at target difficulty completed, try next difficulty
            if target_difficulty < 5:
                lessons = Lesson.objects.filter(
                    concept_id=concept_id,
                    is_published=True,
                    difficulty_level=target_difficulty + 1
                ).order_by('order').first()

                if lessons:
                    return self._format_lesson(lessons)

            # Fallback: any lesson for this concept
            lesson = Lesson.objects.filter(
                concept_id=concept_id,
                is_published=True
            ).order_by('order').first()

            if lesson:
                return self._format_lesson(lesson)

            return None

        except Exception as e:
            logger.error(f"Error selecting lesson for concept {concept_id}: {str(e)}")
            return None

    def _identify_knowledge_gaps(self, subject_code: Optional[str] = None) -> List[Dict]:
        """
        Identify concepts with mastery below threshold.

        Args:
            subject_code: Optional subject filter

        Returns:
            List of knowledge gaps, sorted by priority
        """
        query = Q(
            student_id=self.student_id,
            mastery_level__lt=self.KNOWLEDGE_GAP_THRESHOLD
        )

        if subject_code:
            query &= Q(concept__subject__code=subject_code)

        gaps = ConceptMastery.objects.filter(query).select_related(
            'concept', 'concept__subject'
        ).order_by('mastery_level', '-last_practiced')

        return [
            {
                'concept_id': str(gap.concept.id),
                'concept_name': gap.concept.name,
                'mastery_level': gap.mastery_level,
                'last_practiced': gap.last_practiced
            }
            for gap in gaps
        ]

    def _get_next_curriculum_concept(self, subject_code: Optional[str] = None) -> Optional[Concept]:
        """
        Get next concept in curriculum sequence that student hasn't started.

        Args:
            subject_code: Optional subject filter

        Returns:
            Next concept to learn or None
        """
        from students.models import Student

        try:
            student = Student.objects.get(id=self.student_id)
            grade_level = student.grade_level

            # Get concepts for student's grade level
            query = Q(grade_level=grade_level)

            if subject_code:
                query &= Q(subject__code=subject_code)

            all_concepts = Concept.objects.filter(query).order_by('subject', 'created_at')

            # Get concepts student has attempted
            attempted_concept_ids = ConceptMastery.objects.filter(
                student_id=self.student_id
            ).values_list('concept_id', flat=True)

            # Find first unattempted concept with satisfied prerequisites
            for concept in all_concepts:
                if concept.id not in attempted_concept_ids:
                    # Check prerequisites
                    eligibility = self.concept_graph.can_attempt_concept(
                        self.student_id,
                        str(concept.id)
                    )

                    if eligibility['can_attempt']:
                        return concept

            return None

        except Exception as e:
            logger.error(f"Error getting next curriculum concept: {str(e)}")
            return None

    def _select_enrichment_lesson(self, subject_code: Optional[str] = None) -> Optional[Dict]:
        """
        Select challenging enrichment lesson.

        Args:
            subject_code: Optional subject filter

        Returns:
            Enrichment lesson or None
        """
        query = Q(is_published=True, difficulty_level__gte=4)

        if subject_code:
            query &= Q(concept__subject__code=subject_code)

        lesson = Lesson.objects.filter(query).order_by('?').first()  # Random selection

        if lesson:
            return self._format_lesson(lesson)

        return None

    def _format_lesson(self, lesson: Lesson) -> Dict:
        """
        Format lesson object as dictionary.

        Args:
            lesson: Lesson model instance

        Returns:
            Formatted lesson dictionary
        """
        from django.utils import timezone

        return {
            'id': str(lesson.id),
            'title': lesson.title,
            'concept_name': lesson.concept.name,
            'concept_id': str(lesson.concept.id),
            'subject': lesson.concept.subject.name,
            'difficulty_level': lesson.difficulty_level,
            'estimated_duration': lesson.estimated_duration,
            'content_type': lesson.content_type
        }
