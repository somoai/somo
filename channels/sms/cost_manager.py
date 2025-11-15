"""
SMS Cost Manager - Manage SMS costs and enforce daily limits.
"""
from typing import Dict
from django.utils import timezone
from django.db.models import Count, Sum
from datetime import timedelta
import logging

from students.models import Student
from channels.models import SMSMessage

logger = logging.getLogger('somoai.channels')


class SMSCostManager:
    """
    Manage SMS costs and enforce daily limits.

    Tier limits:
    - Free: 5 SMS/day
    - Basic (Ksh 99): 20 SMS/day
    - Premium (Ksh 299): Unlimited
    """

    SMS_COST = 0.80  # Ksh per SMS

    TIER_LIMITS = {
        'free': 5,
        'basic': 20,
        'premium': 999999  # Unlimited
    }

    def check_daily_limit(self, student_id: str) -> bool:
        """
        Check if student has SMS quota remaining today.

        Args:
            student_id: UUID of the student

        Returns:
            True if student can send SMS, False if limit reached
        """
        try:
            student = Student.objects.get(id=student_id)
            tier = student.subscription_tier

            # Get limit for tier
            daily_limit = self.TIER_LIMITS.get(tier, self.TIER_LIMITS['free'])

            # Get today's SMS count
            today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)

            today_count = SMSMessage.objects.filter(
                student=student,
                direction='outbound',
                created_at__gte=today_start
            ).count()

            can_send = today_count < daily_limit

            if not can_send:
                logger.warning(
                    f"Student {student_id} reached daily SMS limit: "
                    f"{today_count}/{daily_limit} ({tier} tier)"
                )

            return can_send

        except Student.DoesNotExist:
            logger.error(f"Student {student_id} not found")
            return False
        except Exception as e:
            logger.error(f"Error checking daily limit for student {student_id}: {str(e)}")
            return False

    def get_student_tier(self, student_id: str) -> str:
        """
        Get student's subscription tier.

        Args:
            student_id: UUID of the student

        Returns:
            Subscription tier ('free', 'basic', or 'premium')
        """
        try:
            student = Student.objects.get(id=student_id)
            return student.subscription_tier
        except Student.DoesNotExist:
            return 'free'

    def record_sms_cost(self, message_id: str, cost: float) -> None:
        """
        Record cost of sent SMS.

        Args:
            message_id: UUID of SMS message
            cost: Cost in KES
        """
        try:
            message = SMSMessage.objects.get(id=message_id)
            message.cost = cost
            message.save(update_fields=['cost'])

            logger.info(f"Recorded SMS cost: {cost} KES for message {message_id}")

        except SMSMessage.DoesNotExist:
            logger.error(f"SMS message {message_id} not found")
        except Exception as e:
            logger.error(f"Error recording SMS cost: {str(e)}")

    def get_daily_usage(self, student_id: str) -> Dict:
        """
        Get today's SMS usage for student.

        Args:
            student_id: UUID of the student

        Returns:
            Dictionary with usage statistics
        """
        try:
            student = Student.objects.get(id=student_id)
            tier = student.subscription_tier
            daily_limit = self.TIER_LIMITS.get(tier, self.TIER_LIMITS['free'])

            # Get today's messages
            today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)

            today_messages = SMSMessage.objects.filter(
                student=student,
                direction='outbound',
                created_at__gte=today_start
            )

            sent_count = today_messages.count()
            total_cost = today_messages.aggregate(Sum('cost'))['cost__sum'] or 0

            remaining = max(0, daily_limit - sent_count)

            return {
                'student_id': student_id,
                'tier': tier,
                'sent_today': sent_count,
                'daily_limit': daily_limit,
                'remaining': remaining,
                'total_cost_today': float(total_cost),
                'can_send': sent_count < daily_limit
            }

        except Student.DoesNotExist:
            return {
                'error': 'Student not found',
                'can_send': False
            }
        except Exception as e:
            logger.error(f"Error getting daily usage: {str(e)}")
            return {
                'error': str(e),
                'can_send': False
            }

    def should_send_sms(self, student_id: str, priority: str = 'normal') -> bool:
        """
        Determine if SMS should be sent.

        Priority SMS (answers, urgent) may bypass limits in some cases.

        Args:
            student_id: UUID of the student
            priority: Priority level ('low', 'normal', 'high', 'urgent')

        Returns:
            True if SMS should be sent
        """
        # Urgent messages always send (e.g., password resets, critical alerts)
        if priority == 'urgent':
            return True

        # Check daily limit
        return self.check_daily_limit(student_id)

    def get_upgrade_message(self, student_id: str) -> str:
        """
        Get upgrade message when limit is reached.

        Args:
            student_id: UUID of the student

        Returns:
            Upgrade message
        """
        try:
            student = Student.objects.get(id=student_id)
            tier = student.subscription_tier

            if tier == 'free':
                return (
                    "Daily SMS limit reached (5/5). "
                    "Upgrade to Basic (Ksh 99/month) for 20 SMS/day. "
                    "Reply UPGRADE for details."
                )
            elif tier == 'basic':
                return (
                    "Daily SMS limit reached (20/20). "
                    "Upgrade to Premium (Ksh 299/month) for unlimited SMS. "
                    "Reply UPGRADE for details."
                )
            else:
                return "You're on Premium - unlimited SMS!"

        except Student.DoesNotExist:
            return "Daily SMS limit reached. Please register first."
