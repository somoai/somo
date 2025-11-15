"""
Mastery Calculator - Calculates concept mastery using weighted average with time decay.
"""
from typing import Dict, List
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
import logging
import math

from content.models import LessonAttempt, ConceptMastery, Concept

logger = logging.getLogger('somoai.learning_engine')


class MasteryCalculator:
    """
    Calculates concept mastery using weighted average with time decay.

    Formula:
    - Recent attempts weighted more heavily
    - Exponential decay factor: 0.95^days_ago
    - Consistency bonus: +10% if last 3 attempts >= 70%
    """

    # Constants
    DECAY_FACTOR = 0.95  # 5% decay per day
    CONSISTENCY_THRESHOLD = 70.0  # Score for consistency check
    CONSISTENCY_BONUS = 10.0  # Bonus percentage for consistent performance
    MIN_ATTEMPTS_FOR_CONSISTENCY = 3

    def __init__(self):
        """Initialize MasteryCalculator."""
        pass

    def calculate_mastery(self, student_id: str, concept_id: str) -> float:
        """
        Calculate mastery level (0-100) for a concept.

        Args:
            student_id: UUID of the student
            concept_id: UUID of the concept

        Returns:
            Mastery level between 0 and 100
        """
        try:
            # Get all completed lesson attempts for this concept
            attempts = LessonAttempt.objects.filter(
                student_id=student_id,
                lesson__concept_id=concept_id,
                completed_at__isnull=False
            ).select_related('lesson').order_by('-completed_at')

            if not attempts.exists():
                return 0.0

            attempts_list = list(attempts)
            now = timezone.now()

            # Calculate weighted average with time decay
            weighted_sum = 0.0
            weight_sum = 0.0

            for attempt in attempts_list:
                score = attempt.score if attempt.score is not None else 0
                days_ago = (now - attempt.completed_at).days

                # Apply exponential decay
                weight = math.pow(self.DECAY_FACTOR, days_ago)

                weighted_sum += score * weight
                weight_sum += weight

            base_mastery = weighted_sum / weight_sum if weight_sum > 0 else 0

            # Check for consistency bonus
            consistency_bonus = 0.0
            if len(attempts_list) >= self.MIN_ATTEMPTS_FOR_CONSISTENCY:
                recent_scores = [
                    a.score for a in attempts_list[:self.MIN_ATTEMPTS_FOR_CONSISTENCY]
                    if a.score is not None
                ]

                if len(recent_scores) == self.MIN_ATTEMPTS_FOR_CONSISTENCY:
                    all_consistent = all(score >= self.CONSISTENCY_THRESHOLD for score in recent_scores)
                    if all_consistent:
                        consistency_bonus = self.CONSISTENCY_BONUS

            # Calculate final mastery (capped at 100)
            final_mastery = min(base_mastery + consistency_bonus, 100.0)

            logger.debug(
                f"Calculated mastery for student {student_id}, concept {concept_id}: "
                f"base={base_mastery:.1f}, bonus={consistency_bonus:.1f}, "
                f"final={final_mastery:.1f} ({len(attempts_list)} attempts)"
            )

            return round(final_mastery, 2)

        except Exception as e:
            logger.error(
                f"Error calculating mastery for student {student_id}, "
                f"concept {concept_id}: {str(e)}"
            )
            return 0.0

    def update_all_mastery(self, student_id: str) -> Dict:
        """
        Recalculate mastery for all concepts student has attempted.

        Args:
            student_id: UUID of the student

        Returns:
            Dictionary with update summary
        """
        try:
            # Get all concepts the student has attempted
            attempted_concepts = Concept.objects.filter(
                lessons__attempts__student_id=student_id,
                lessons__attempts__completed_at__isnull=False
            ).distinct()

            updated_count = 0
            created_count = 0
            masteries = []

            for concept in attempted_concepts:
                # Calculate new mastery level
                mastery_level = self.calculate_mastery(student_id, str(concept.id))

                # Get or create ConceptMastery record
                mastery, created = ConceptMastery.objects.get_or_create(
                    student_id=student_id,
                    concept=concept,
                    defaults={
                        'mastery_level': mastery_level,
                        'attempts_count': 0,
                        'last_practiced': timezone.now()
                    }
                )

                if created:
                    created_count += 1
                else:
                    updated_count += 1

                # Update mastery level
                mastery.mastery_level = mastery_level
                mastery.save(update_fields=['mastery_level', 'updated_at'])

                masteries.append({
                    'concept_id': str(concept.id),
                    'concept_name': concept.name,
                    'mastery_level': mastery_level,
                    'action': 'created' if created else 'updated'
                })

            logger.info(
                f"Updated mastery for student {student_id}: "
                f"{created_count} created, {updated_count} updated"
            )

            return {
                'student_id': student_id,
                'total_concepts': len(masteries),
                'created': created_count,
                'updated': updated_count,
                'masteries': masteries
            }

        except Exception as e:
            logger.error(f"Error updating all mastery for student {student_id}: {str(e)}")
            return {
                'student_id': student_id,
                'total_concepts': 0,
                'created': 0,
                'updated': 0,
                'error': str(e)
            }

    def get_mastery_by_subject(self, student_id: str) -> Dict:
        """
        Get average mastery level by subject.

        Args:
            student_id: UUID of the student

        Returns:
            Dictionary with mastery levels by subject
        """
        try:
            # Get all concept masteries for student
            masteries = ConceptMastery.objects.filter(
                student_id=student_id
            ).select_related('concept', 'concept__subject')

            subject_masteries = {}

            for mastery in masteries:
                subject_name = mastery.concept.subject.name
                subject_code = mastery.concept.subject.code

                if subject_code not in subject_masteries:
                    subject_masteries[subject_code] = {
                        'subject_name': subject_name,
                        'subject_code': subject_code,
                        'concepts': [],
                        'total_mastery': 0,
                        'count': 0
                    }

                subject_masteries[subject_code]['concepts'].append({
                    'concept_name': mastery.concept.name,
                    'mastery_level': mastery.mastery_level
                })
                subject_masteries[subject_code]['total_mastery'] += mastery.mastery_level
                subject_masteries[subject_code]['count'] += 1

            # Calculate averages
            for subject_code, data in subject_masteries.items():
                data['average_mastery'] = round(
                    data['total_mastery'] / data['count'] if data['count'] > 0 else 0,
                    2
                )

            return subject_masteries

        except Exception as e:
            logger.error(f"Error getting mastery by subject for student {student_id}: {str(e)}")
            return {}

    def get_mastery_distribution(self, student_id: str) -> Dict:
        """
        Get distribution of concepts across mastery levels.

        Returns:
            Dictionary with distribution statistics
        """
        try:
            masteries = ConceptMastery.objects.filter(student_id=student_id)

            distribution = {
                'mastered': 0,      # >= 80%
                'proficient': 0,    # 60-79%
                'developing': 0,    # 40-59%
                'beginner': 0,      # < 40%
            }

            for mastery in masteries:
                level = mastery.mastery_level
                if level >= 80:
                    distribution['mastered'] += 1
                elif level >= 60:
                    distribution['proficient'] += 1
                elif level >= 40:
                    distribution['developing'] += 1
                else:
                    distribution['beginner'] += 1

            total = sum(distribution.values())

            return {
                'distribution': distribution,
                'total_concepts': total,
                'percentages': {
                    category: round((count / total * 100) if total > 0 else 0, 1)
                    for category, count in distribution.items()
                }
            }

        except Exception as e:
            logger.error(
                f"Error getting mastery distribution for student {student_id}: {str(e)}"
            )
            return {'distribution': {}, 'total_concepts': 0}
