"""
Progress Tracker - Records learning events and updates mastery levels.
"""
from typing import Dict, List
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import timedelta
import logging

from content.models import LessonAttempt, ConceptMastery, Concept
from students.models import Student
from .mastery_calculator import MasteryCalculator
from .spaced_repetition import SpacedRepetitionScheduler

logger = logging.getLogger('somoai.learning_engine')


class ProgressTracker:
    """
    Records learning events and updates mastery levels.
    """

    def __init__(self):
        """Initialize ProgressTracker."""
        self.mastery_calculator = MasteryCalculator()

    def record_lesson_completion(self, lesson_attempt_id: str) -> Dict:
        """
        Process completed lesson and update mastery.

        Args:
            lesson_attempt_id: UUID of the completed lesson attempt

        Returns:
            Dictionary with update results
        """
        try:
            # Get the lesson attempt
            attempt = LessonAttempt.objects.select_related(
                'lesson', 'lesson__concept', 'student'
            ).get(id=lesson_attempt_id)

            if not attempt.completed_at:
                logger.warning(f"Attempt {lesson_attempt_id} not completed yet")
                return {
                    'success': False,
                    'error': 'Lesson not completed'
                }

            student_id = str(attempt.student.id)
            concept_id = str(attempt.lesson.concept.id)
            score = attempt.score if attempt.score is not None else 0

            # Update concept mastery
            new_mastery = self.mastery_calculator.calculate_mastery(student_id, concept_id)

            mastery, created = ConceptMastery.objects.get_or_create(
                student_id=student_id,
                concept_id=concept_id,
                defaults={
                    'mastery_level': new_mastery,
                    'attempts_count': 1,
                    'last_practiced': timezone.now()
                }
            )

            if not created:
                mastery.attempts_count += 1

            mastery.mastery_level = new_mastery
            mastery.last_practiced = timezone.now()
            mastery.save()

            # Update spaced repetition schedule
            scheduler = SpacedRepetitionScheduler(student_id)
            schedule = scheduler.schedule_next_review(concept_id, score)

            logger.info(
                f"Recorded lesson completion for student {student_id}, "
                f"concept {concept_id}: mastery={new_mastery:.1f}%, "
                f"next review={schedule['next_review_date']}"
            )

            return {
                'success': True,
                'student_id': student_id,
                'concept_id': concept_id,
                'concept_name': attempt.lesson.concept.name,
                'mastery_level': new_mastery,
                'mastery_change': 'created' if created else 'updated',
                'spaced_repetition': schedule
            }

        except LessonAttempt.DoesNotExist:
            logger.error(f"Lesson attempt {lesson_attempt_id} not found")
            return {
                'success': False,
                'error': 'Lesson attempt not found'
            }
        except Exception as e:
            logger.error(f"Error recording lesson completion {lesson_attempt_id}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    def get_progress_summary(self, student_id: str) -> Dict:
        """
        Get comprehensive progress summary.

        Returns:
        - Total mastery by subject
        - Lessons completed
        - Time spent learning
        - Current streak
        - Concepts mastered/in-progress/not-started

        Args:
            student_id: UUID of the student

        Returns:
            Dictionary with progress summary
        """
        try:
            # Get student
            student = Student.objects.get(id=student_id)

            # Total lessons completed
            lessons_stats = LessonAttempt.objects.filter(
                student_id=student_id,
                completed_at__isnull=False
            ).aggregate(
                total_lessons=Count('id'),
                total_time=Sum('time_spent'),
                avg_score=Avg('score')
            )

            # Time spent (convert seconds to minutes)
            total_minutes = (lessons_stats['total_time'] or 0) // 60

            # Get mastery by subject
            mastery_by_subject = self.mastery_calculator.get_mastery_by_subject(student_id)

            # Get mastery distribution
            mastery_distribution = self.mastery_calculator.get_mastery_distribution(student_id)

            # Calculate current streak
            streak = self._calculate_learning_streak(student_id)

            # Recent activity
            recent_activity = self._get_recent_activity(student_id, days=7)

            return {
                'student_id': student_id,
                'student_name': student.name,
                'grade_level': student.grade_level,
                'lessons_completed': lessons_stats['total_lessons'] or 0,
                'total_time_minutes': total_minutes,
                'average_score': round(lessons_stats['avg_score'] or 0, 1),
                'current_streak_days': streak,
                'mastery_by_subject': mastery_by_subject,
                'mastery_distribution': mastery_distribution,
                'recent_activity': recent_activity
            }

        except Student.DoesNotExist:
            logger.error(f"Student {student_id} not found")
            return {
                'error': 'Student not found'
            }
        except Exception as e:
            logger.error(f"Error getting progress summary for student {student_id}: {str(e)}")
            return {
                'error': str(e)
            }

    def identify_knowledge_gaps(self, student_id: str) -> List[Dict]:
        """
        Find concepts student is struggling with (< 60% mastery).

        Args:
            student_id: UUID of the student

        Returns:
            List of knowledge gaps with details
        """
        try:
            STRUGGLE_THRESHOLD = 60.0

            gaps = ConceptMastery.objects.filter(
                student_id=student_id,
                mastery_level__lt=STRUGGLE_THRESHOLD
            ).select_related('concept', 'concept__subject').order_by('mastery_level')

            return [
                {
                    'concept_id': str(gap.concept.id),
                    'concept_name': gap.concept.name,
                    'concept_code': gap.concept.code,
                    'subject': gap.concept.subject.name,
                    'grade_level': gap.concept.grade_level,
                    'mastery_level': gap.mastery_level,
                    'attempts_count': gap.attempts_count,
                    'last_practiced': gap.last_practiced,
                    'severity': self._calculate_gap_severity(gap.mastery_level, gap.attempts_count)
                }
                for gap in gaps
            ]

        except Exception as e:
            logger.error(f"Error identifying knowledge gaps for student {student_id}: {str(e)}")
            return []

    def _calculate_learning_streak(self, student_id: str) -> int:
        """
        Calculate current consecutive days of learning.

        Args:
            student_id: UUID of the student

        Returns:
            Number of consecutive days
        """
        try:
            # Get all unique dates with completed lessons
            completed_dates = LessonAttempt.objects.filter(
                student_id=student_id,
                completed_at__isnull=False
            ).values_list('completed_at__date', flat=True).distinct().order_by('-completed_at__date')

            if not completed_dates:
                return 0

            completed_dates = list(completed_dates)
            today = timezone.now().date()
            streak = 0

            # Check if there's activity today or yesterday (to maintain streak)
            if completed_dates[0] == today:
                streak = 1
                check_date = today - timedelta(days=1)
            elif completed_dates[0] == today - timedelta(days=1):
                streak = 1
                check_date = completed_dates[0] - timedelta(days=1)
            else:
                # Streak broken
                return 0

            # Count consecutive days
            for date in completed_dates[1:]:
                if date == check_date:
                    streak += 1
                    check_date -= timedelta(days=1)
                else:
                    break

            return streak

        except Exception as e:
            logger.error(f"Error calculating streak for student {student_id}: {str(e)}")
            return 0

    def _get_recent_activity(self, student_id: str, days: int = 7) -> List[Dict]:
        """
        Get recent learning activity.

        Args:
            student_id: UUID of the student
            days: Number of days to look back

        Returns:
            List of recent activities
        """
        try:
            since_date = timezone.now() - timedelta(days=days)

            recent_attempts = LessonAttempt.objects.filter(
                student_id=student_id,
                completed_at__gte=since_date
            ).select_related('lesson', 'lesson__concept').order_by('-completed_at')[:10]

            return [
                {
                    'lesson_title': attempt.lesson.title,
                    'concept_name': attempt.lesson.concept.name,
                    'score': attempt.score,
                    'completed_at': attempt.completed_at,
                    'time_spent_minutes': (attempt.time_spent or 0) // 60
                }
                for attempt in recent_attempts
            ]

        except Exception as e:
            logger.error(f"Error getting recent activity for student {student_id}: {str(e)}")
            return []

    def _calculate_gap_severity(self, mastery_level: float, attempts_count: int) -> str:
        """
        Calculate severity of knowledge gap.

        Args:
            mastery_level: Current mastery level
            attempts_count: Number of attempts

        Returns:
            Severity level: 'critical', 'high', 'medium', 'low'
        """
        if mastery_level < 30 and attempts_count >= 3:
            return 'critical'  # Multiple attempts, still very low
        elif mastery_level < 30:
            return 'high'  # Very low mastery
        elif mastery_level < 50 and attempts_count >= 3:
            return 'high'  # Not improving despite attempts
        elif mastery_level < 50:
            return 'medium'  # Low mastery
        else:
            return 'low'  # Just below threshold
