"""
OTP Service - Generate, verify, and send OTP codes.
"""
import random
import logging
from typing import Dict, Optional
from django.utils import timezone
from datetime import timedelta

from .models import OTPVerification
from students.models import Student

logger = logging.getLogger('somoai.auth')


class OTPService:
    """
    Service for managing OTP generation, verification, and delivery.

    Handles:
    - Generating secure 6-digit OTP codes
    - Creating OTP records with expiration
    - Verifying OTP codes with attempt tracking
    - Sending OTPs via SMS (integrates with channels.sms)
    """

    OTP_LENGTH = 6
    OTP_EXPIRY_MINUTES = 5
    MAX_ATTEMPTS = 3

    @staticmethod
    def generate_otp() -> str:
        """
        Generate a random 6-digit OTP code.

        Returns:
            str: 6-digit OTP code
        """
        return ''.join([str(random.randint(0, 9)) for _ in range(OTPService.OTP_LENGTH)])

    @staticmethod
    def create_otp(phone_number: str) -> Dict:
        """
        Create a new OTP record for a phone number.

        Invalidates any previous unverified OTPs for this number.

        Args:
            phone_number: Phone number in E.164 format (e.g., +254712345678)

        Returns:
            Dictionary with OTP details:
            {
                'success': bool,
                'otp_id': str (UUID),
                'phone_number': str,
                'expires_at': datetime,
                'message': str
            }
        """
        try:
            # Invalidate previous unverified OTPs for this number
            OTPVerification.objects.filter(
                phone_number=phone_number,
                is_verified=False
            ).delete()

            # Generate new OTP
            otp_code = OTPService.generate_otp()

            # Create OTP record
            otp = OTPVerification.objects.create(
                phone_number=phone_number,
                otp_code=otp_code
            )

            logger.info(f"Created OTP for {phone_number}: {otp.id}")

            # Send OTP via SMS
            sms_sent = OTPService.send_otp_sms(phone_number, otp_code)

            if not sms_sent:
                logger.warning(f"Failed to send OTP SMS to {phone_number}")

            return {
                'success': True,
                'otp_id': str(otp.id),
                'phone_number': phone_number,
                'expires_at': otp.expires_at,
                'message': f'OTP sent to {phone_number}. Valid for {OTPService.OTP_EXPIRY_MINUTES} minutes.'
            }

        except Exception as e:
            logger.error(f"Error creating OTP for {phone_number}: {str(e)}")
            return {
                'success': False,
                'message': f'Error generating OTP: {str(e)}'
            }

    @staticmethod
    def verify_otp(phone_number: str, otp_code: str) -> Dict:
        """
        Verify an OTP code for a phone number.

        Checks:
        - OTP exists and matches
        - OTP not expired
        - OTP not already verified
        - Attempts not exceeded

        Args:
            phone_number: Phone number in E.164 format
            otp_code: 6-digit OTP code to verify

        Returns:
            Dictionary with verification result:
            {
                'success': bool,
                'message': str,
                'is_new_user': bool (if success),
                'student_id': str (if existing user),
                'otp_id': str (UUID of verified OTP)
            }
        """
        try:
            # Get most recent OTP for this phone number
            otp = OTPVerification.objects.filter(
                phone_number=phone_number,
                is_verified=False
            ).order_by('-created_at').first()

            # Check if OTP exists
            if not otp:
                logger.warning(f"No pending OTP found for {phone_number}")
                return {
                    'success': False,
                    'message': 'No OTP request found. Please request a new OTP.'
                }

            # Check if expired
            if otp.is_expired:
                logger.warning(f"Expired OTP verification attempt for {phone_number}")
                return {
                    'success': False,
                    'message': 'OTP has expired. Please request a new OTP.'
                }

            # Check if max attempts exceeded
            if otp.attempts >= otp.max_attempts:
                logger.warning(f"Max attempts exceeded for {phone_number}")
                return {
                    'success': False,
                    'message': 'Maximum verification attempts exceeded. Please request a new OTP.'
                }

            # Increment attempt counter
            otp.attempts += 1
            otp.save(update_fields=['attempts'])

            # Check if OTP code matches
            if otp.otp_code != otp_code:
                remaining = otp.attempts_remaining
                logger.warning(
                    f"Invalid OTP attempt for {phone_number}. "
                    f"Attempts: {otp.attempts}/{otp.max_attempts}"
                )
                return {
                    'success': False,
                    'message': f'Invalid OTP code. {remaining} attempt(s) remaining.'
                }

            # OTP is valid - mark as verified
            otp.is_verified = True
            otp.save(update_fields=['is_verified'])

            logger.info(f"Successfully verified OTP for {phone_number}")

            # Check if user already exists
            try:
                student = Student.objects.get(phone_number=phone_number)
                is_new_user = False
                student_id = str(student.id)
                logger.info(f"Existing user verified: {phone_number}")
            except Student.DoesNotExist:
                is_new_user = True
                student_id = None
                logger.info(f"New user verified: {phone_number}")

            return {
                'success': True,
                'message': 'OTP verified successfully.',
                'is_new_user': is_new_user,
                'student_id': student_id,
                'otp_id': str(otp.id),
                'phone_number': phone_number
            }

        except Exception as e:
            logger.error(f"Error verifying OTP for {phone_number}: {str(e)}")
            return {
                'success': False,
                'message': f'Error verifying OTP: {str(e)}'
            }

    @staticmethod
    def send_otp_sms(phone_number: str, otp_code: str) -> bool:
        """
        Send OTP code via SMS.

        Integrates with channels.sms to send OTP message.

        Args:
            phone_number: Phone number in E.164 format
            otp_code: 6-digit OTP code

        Returns:
            bool: True if SMS sent successfully, False otherwise
        """
        try:
            from channels.models import SMSMessage

            # Format OTP message
            message = f"Your SOMO AI verification code is: {otp_code}\nValid for {OTPService.OTP_EXPIRY_MINUTES} minutes."

            # Create outbound SMS message
            sms = SMSMessage.objects.create(
                phone_number=phone_number,
                direction='outbound',
                message=message,
                status='queued',
                cost=0.80  # Standard SMS cost in KES
            )

            # TODO: Integrate with actual SMS provider (Africa's Talking)
            # For now, just log the OTP (development mode)
            logger.info(f"OTP SMS queued for {phone_number}: {otp_code} (ID: {sms.id})")

            # In production, this would trigger Celery task to send via Africa's Talking
            # celery_app.send_task('channels.tasks.send_sms', args=[str(sms.id)])

            # Mark as sent (in dev mode)
            sms.status = 'sent'
            sms.sent_at = timezone.now()
            sms.save(update_fields=['status', 'sent_at'])

            return True

        except Exception as e:
            logger.error(f"Error sending OTP SMS to {phone_number}: {str(e)}")
            return False

    @staticmethod
    def cleanup_expired_otps() -> int:
        """
        Delete expired OTP records.

        Should be run periodically (e.g., daily cron job).

        Returns:
            int: Number of OTP records deleted
        """
        try:
            cutoff_time = timezone.now() - timedelta(hours=24)
            deleted_count, _ = OTPVerification.objects.filter(
                created_at__lt=cutoff_time
            ).delete()

            logger.info(f"Cleaned up {deleted_count} expired OTP records")
            return deleted_count

        except Exception as e:
            logger.error(f"Error cleaning up expired OTPs: {str(e)}")
            return 0

    @staticmethod
    def get_otp_status(phone_number: str) -> Dict:
        """
        Get status of most recent OTP for a phone number.

        Args:
            phone_number: Phone number in E.164 format

        Returns:
            Dictionary with OTP status or None if no OTP found
        """
        try:
            otp = OTPVerification.objects.filter(
                phone_number=phone_number
            ).order_by('-created_at').first()

            if not otp:
                return {
                    'exists': False,
                    'message': 'No OTP found for this phone number'
                }

            return {
                'exists': True,
                'is_verified': otp.is_verified,
                'is_expired': otp.is_expired,
                'attempts': otp.attempts,
                'attempts_remaining': otp.attempts_remaining,
                'created_at': otp.created_at,
                'expires_at': otp.expires_at
            }

        except Exception as e:
            logger.error(f"Error getting OTP status for {phone_number}: {str(e)}")
            return {
                'exists': False,
                'error': str(e)
            }
