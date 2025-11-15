"""
Spaced Repetition Scheduler - Implements Leitner system for concept review.
"""
from typing import Dict, List, Optional
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
import logging

from content.models import ConceptMastery, Concept
from students.models import Student

logger = logging.getLogger('somoai.learning_engine')


class SpacedRepetitionScheduler:
    """
    Implements Leitner system with 6 boxes for spaced repetition.

    Intervals (days): Box 1=1, Box 2=3, Box 3=7, Box 4=14, Box 5=30, Box 6=90

    Logic:
    - Performance >= 80%: Promote to next box
    - Performance >= 60%: Keep in same box
    - Performance < 60%: Demote to box 1
    """

    # Leitner box intervals in days
    INTERVALS = {
        1: 1,    # Daily review
        2: 3,    # Every 3 days
        3: 7,    # Weekly
        4: 14,   # Bi-weekly
        5: 30,   # Monthly
        6: 90    # Quarterly
    }

    # Performance thresholds
    PROMOTE_THRESHOLD = 80.0
    MAINTAIN_THRESHOLD = 60.0

    MIN_BOX = 1
    MAX_BOX = 6

    def __init__(self, student_id: str):
        """
        Initialize SpacedRepetitionScheduler for a specific student.

        Args:
            student_id: UUID of the student
        """
        self.student_id = student_id

    def get_due_reviews(self) -> List[Dict]:
        """
        Get all concepts due for review today.

        Returns:
            List of concepts with review details
        """
        try:
            today = timezone.now().date()

            # Get concepts where next_review_date is today or earlier
            due_masteries = ConceptMastery.objects.filter(
                student_id=self.student_id,
                next_review_date__lte=today
            ).select_related('concept', 'concept__subject').order_by('spaced_repetition_box', 'next_review_date')

            reviews = []
            for mastery in due_masteries:
                reviews.append({
                    'concept_id': str(mastery.concept.id),
                    'concept_name': mastery.concept.name,
                    'subject_code': mastery.concept.subject.code,
                    'mastery_level': mastery.mastery_level,
                    'box': mastery.spaced_repetition_box,
                    'next_review_date': mastery.next_review_date,
                    'days_overdue': (today - mastery.next_review_date).days if mastery.next_review_date else 0,
                    'last_practiced': mastery.last_practiced
                })

            logger.info(f"Found {len(reviews)} concepts due for review for student {self.student_id}")
            return reviews

        except Exception as e:
            logger.error(f"Error getting due reviews for student {self.student_id}: {str(e)}")
            return []

    def schedule_next_review(self, concept_id: str, performance: float) -> Dict:
        """
        Update concept's spaced repetition schedule based on performance.

        Args:
            concept_id: UUID of the concept
            performance: Performance score (0-100)

        Returns:
            Dictionary with updated schedule details
        """
        try:
            # Get or create ConceptMastery
            mastery, created = ConceptMastery.objects.get_or_create(
                student_id=self.student_id,
                concept_id=concept_id,
                defaults={
                    'mastery_level': performance,
                    'attempts_count': 1,
                    'spaced_repetition_box': 1,
                    'last_practiced': timezone.now()
                }
            )

            if not created:
                # Update existing mastery
                mastery.attempts_count += 1
                mastery.last_practiced = timezone.now()

            # Determine box movement
            current_box = mastery.spaced_repetition_box
            new_box = current_box

            if performance >= self.PROMOTE_THRESHOLD:
                # Promote to next box
                new_box = min(current_box + 1, self.MAX_BOX)
                action = 'promoted'
            elif performance >= self.MAINTAIN_THRESHOLD:
                # Stay in same box
                new_box = current_box
                action = 'maintained'
            else:
                # Demote to box 1
                new_box = self.MIN_BOX
                action = 'demoted'

            mastery.spaced_repetition_box = new_box

            # Calculate next review date
            interval_days = self.INTERVALS[new_box]
            next_review = timezone.now().date() + timedelta(days=interval_days)
            mastery.next_review_date = next_review

            mastery.save()

            logger.info(
                f"Scheduled review for student {self.student_id}, concept {concept_id}: "
                f"Box {current_box} → {new_box} ({action}), "
                f"Next review: {next_review} ({interval_days} days)"
            )

            return {
                'concept_id': str(concept_id),
                'previous_box': current_box,
                'new_box': new_box,
                'action': action,
                'next_review_date': next_review,
                'interval_days': interval_days,
                'performance': performance
            }

        except Exception as e:
            logger.error(
                f"Error scheduling review for student {self.student_id}, "
                f"concept {concept_id}: {str(e)}"
            )
            raise

    def get_optimal_review_session(self, duration_minutes: int = 15) -> Dict:
        """
        Create review session optimized for available time.

        Prioritizes:
        1. Overdue reviews (oldest first)
        2. Lower boxes (need more frequent practice)
        3. Lower mastery levels

        Args:
            duration_minutes: Available time for review session

        Returns:
            Dictionary with review session plan
        """
        try:
            due_reviews = self.get_due_reviews()

            if not due_reviews:
                return {
                    'concepts': [],
                    'estimated_duration': 0,
                    'message': 'No reviews due today. Great job staying on track!'
                }

            # Sort by priority: overdue (days), then box (lower first), then mastery (lower first)
            sorted_reviews = sorted(
                due_reviews,
                key=lambda x: (-x['days_overdue'], x['box'], x['mastery_level'])
            )

            # Estimate ~3 minutes per concept review
            minutes_per_concept = 3
            max_concepts = duration_minutes // minutes_per_concept

            selected_reviews = sorted_reviews[:max_concepts]

            return {
                'concepts': selected_reviews,
                'estimated_duration': len(selected_reviews) * minutes_per_concept,
                'total_due': len(due_reviews),
                'selected_count': len(selected_reviews),
                'message': f"Review session: {len(selected_reviews)} concepts ({len(selected_reviews) * minutes_per_concept} min)"
            }

        except Exception as e:
            logger.error(
                f"Error creating optimal review session for student {self.student_id}: {str(e)}"
            )
            return {
                'concepts': [],
                'estimated_duration': 0,
                'error': str(e)
            }

    def get_box_distribution(self) -> Dict:
        """
        Get distribution of concepts across Leitner boxes.

        Returns:
            Dictionary with box counts and details
        """
        try:
            masteries = ConceptMastery.objects.filter(
                student_id=self.student_id
            ).values('spaced_repetition_box').annotate(
                count=Count('id')
            )

            distribution = {box: 0 for box in range(1, self.MAX_BOX + 1)}

            for mastery in masteries:
                box = mastery['spaced_repetition_box']
                count = mastery['count']
                distribution[box] = count

            total = sum(distribution.values())

            return {
                'distribution': distribution,
                'total_concepts': total,
                'intervals': self.INTERVALS,
                'percentages': {
                    box: round((count / total * 100) if total > 0 else 0, 1)
                    for box, count in distribution.items()
                }
            }

        except Exception as e:
            logger.error(
                f"Error getting box distribution for student {self.student_id}: {str(e)}"
            )
            return {'distribution': {}, 'total_concepts': 0}
