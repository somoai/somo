"""
Difficulty Adjuster - Determines optimal difficulty level based on performance.
"""
from typing import Dict, Optional
from django.db.models import Avg, Count, Q
from django.utils import timezone
from datetime import timedelta
import logging

from content.models import LessonAttempt, Subject

logger = logging.getLogger('somoai.learning_engine')


class DifficultyAdjuster:
    """
    Determines optimal difficulty level for next lesson based on recent performance.

    Algorithm:
    - Analyzes last 10 lesson attempts for a subject
    - Calculates success rate (score >= 70%)
    - Calculates average time ratio (actual time / expected time)

    Rules:
    - Success rate >= 80% AND time < 120% expected → Increase difficulty
    - Success rate < 50% OR time > 200% expected → Decrease difficulty
    - Success rate 60-80% → Maintain difficulty
    - Otherwise → Slight decrease
    """

    # Constants
    PERFORMANCE_WINDOW = 10  # Look at last 10 lessons
    SUCCESS_THRESHOLD = 70.0  # Score >= 70% is considered success
    HIGH_PERFORMANCE_THRESHOLD = 80.0
    LOW_PERFORMANCE_THRESHOLD = 50.0
    MODERATE_PERFORMANCE_MIN = 60.0

    TIME_EFFICIENT_THRESHOLD = 1.2  # 120% of expected time
    TIME_STRUGGLING_THRESHOLD = 2.0  # 200% of expected time

    MIN_DIFFICULTY = 1
    MAX_DIFFICULTY = 5

    def __init__(self, student_id: str):
        """
        Initialize DifficultyAdjuster for a specific student.

        Args:
            student_id: UUID of the student
        """
        self.student_id = student_id
        self.performance_window = self.PERFORMANCE_WINDOW

    def calculate_next_difficulty(self, subject_code: str) -> int:
        """
        Calculate appropriate difficulty (1-5) for next lesson.

        Args:
            subject_code: Subject code (e.g., 'MATH', 'ENG')

        Returns:
            Recommended difficulty level (1-5)
        """
        try:
            # Get recent performance data
            performance = self.get_recent_performance(subject_code)

            if not performance or performance['attempts_count'] == 0:
                # No history, start with easy difficulty
                logger.info(
                    f"No performance history for student {self.student_id} in {subject_code}. "
                    "Starting with difficulty 2."
                )
                return 2

            current_difficulty = performance['avg_difficulty']
            success_rate = performance['success_rate']
            avg_time_ratio = performance['avg_time_ratio']

            # Decision logic
            if success_rate >= self.HIGH_PERFORMANCE_THRESHOLD and avg_time_ratio < self.TIME_EFFICIENT_THRESHOLD:
                # Student is excelling - increase difficulty
                new_difficulty = min(current_difficulty + 1, self.MAX_DIFFICULTY)
                logger.info(
                    f"Student {self.student_id} excelling in {subject_code} "
                    f"(success: {success_rate}%, time: {avg_time_ratio:.1f}x). "
                    f"Increasing difficulty {current_difficulty} → {new_difficulty}"
                )
                return int(new_difficulty)

            elif success_rate < self.LOW_PERFORMANCE_THRESHOLD or avg_time_ratio > self.TIME_STRUGGLING_THRESHOLD:
                # Student is struggling - decrease difficulty
                new_difficulty = max(current_difficulty - 1, self.MIN_DIFFICULTY)
                logger.info(
                    f"Student {self.student_id} struggling in {subject_code} "
                    f"(success: {success_rate}%, time: {avg_time_ratio:.1f}x). "
                    f"Decreasing difficulty {current_difficulty} → {new_difficulty}"
                )
                return int(new_difficulty)

            elif self.MODERATE_PERFORMANCE_MIN <= success_rate <= self.HIGH_PERFORMANCE_THRESHOLD:
                # Student is doing well - maintain difficulty
                logger.info(
                    f"Student {self.student_id} maintaining good progress in {subject_code} "
                    f"(success: {success_rate}%). "
                    f"Keeping difficulty at {current_difficulty}"
                )
                return int(current_difficulty)

            else:
                # Slightly below threshold - slight decrease
                new_difficulty = max(current_difficulty - 1, self.MIN_DIFFICULTY)
                logger.info(
                    f"Student {self.student_id} needs support in {subject_code} "
                    f"(success: {success_rate}%). "
                    f"Slightly decreasing difficulty {current_difficulty} → {new_difficulty}"
                )
                return int(new_difficulty)

        except Exception as e:
            logger.error(
                f"Error calculating difficulty for student {self.student_id} "
                f"in {subject_code}: {str(e)}"
            )
            return 2  # Default to medium difficulty on error

    def get_recent_performance(self, subject_code: str) -> Optional[Dict]:
        """
        Get recent lesson attempts statistics.

        Args:
            subject_code: Subject code to analyze

        Returns:
            Dictionary with performance metrics or None if no data
        """
        try:
            # Get subject
            try:
                subject = Subject.objects.get(code=subject_code)
            except Subject.DoesNotExist:
                logger.warning(f"Subject {subject_code} not found")
                return None

            # Get recent completed attempts for this subject
            recent_attempts = LessonAttempt.objects.filter(
                student_id=self.student_id,
                lesson__concept__subject=subject,
                completed_at__isnull=False
            ).select_related('lesson').order_by('-completed_at')[:self.performance_window]

            if not recent_attempts.exists():
                return None

            # Calculate metrics
            attempts_list = list(recent_attempts)
            total_attempts = len(attempts_list)

            # Success rate (score >= 70%)
            successful_attempts = sum(
                1 for attempt in attempts_list
                if attempt.score and attempt.score >= self.SUCCESS_THRESHOLD
            )
            success_rate = (successful_attempts / total_attempts * 100) if total_attempts > 0 else 0

            # Average difficulty
            avg_difficulty = sum(attempt.difficulty_level for attempt in attempts_list) / total_attempts

            # Average time ratio (actual vs expected)
            time_ratios = []
            for attempt in attempts_list:
                if attempt.time_spent and attempt.lesson.estimated_duration:
                    ratio = attempt.time_spent / attempt.lesson.estimated_duration
                    time_ratios.append(ratio)

            avg_time_ratio = sum(time_ratios) / len(time_ratios) if time_ratios else 1.0

            # Average score
            scores = [attempt.score for attempt in attempts_list if attempt.score is not None]
            avg_score = sum(scores) / len(scores) if scores else 0

            return {
                'attempts_count': total_attempts,
                'success_rate': success_rate,
                'avg_difficulty': avg_difficulty,
                'avg_time_ratio': avg_time_ratio,
                'avg_score': avg_score,
                'recent_attempts': [
                    {
                        'lesson_title': attempt.lesson.title,
                        'score': attempt.score,
                        'difficulty': attempt.difficulty_level,
                        'completed_at': attempt.completed_at
                    }
                    for attempt in attempts_list
                ]
            }

        except Exception as e:
            logger.error(
                f"Error getting performance for student {self.student_id} "
                f"in {subject_code}: {str(e)}"
            )
            return None
