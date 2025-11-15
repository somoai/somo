"""
Authentication serializers for SomoAI API.
"""
import re
from rest_framework import serializers
from django.core.exceptions import ValidationError

from students.models import Student
from .models import OTPVerification


class OTPRequestSerializer(serializers.Serializer):
    """
    Serializer for OTP request.

    Used when a user requests an OTP code to verify their phone number.
    """
    phone_number = serializers.CharField(
        max_length=15,
        help_text="Phone number in E.164 format (e.g., +254712345678)"
    )

    def validate_phone_number(self, value):
        """
        Validate Kenyan phone number format.

        Accepts:
        - +254712345678 (E.164 format)
        - 254712345678
        - 0712345678 (converts to +254)

        Returns:
            str: Phone number in E.164 format (+254...)
        """
        # Remove whitespace
        phone = value.strip().replace(' ', '').replace('-', '')

        # Convert 0712345678 to +254712345678
        if phone.startswith('0'):
            phone = '+254' + phone[1:]

        # Add + if missing
        if not phone.startswith('+'):
            phone = '+' + phone

        # Validate format: +254 followed by 9 digits
        if not re.match(r'^\+254\d{9}$', phone):
            raise serializers.ValidationError(
                'Invalid phone number format. Use format: +254712345678 or 0712345678'
            )

        return phone


class OTPVerifySerializer(serializers.Serializer):
    """
    Serializer for OTP verification.

    Used when a user submits an OTP code to verify their phone number.
    """
    phone_number = serializers.CharField(
        max_length=15,
        help_text="Phone number in E.164 format"
    )
    otp_code = serializers.CharField(
        max_length=6,
        min_length=6,
        help_text="6-digit OTP code"
    )

    def validate_phone_number(self, value):
        """Validate phone number format (same as OTPRequestSerializer)."""
        phone = value.strip().replace(' ', '').replace('-', '')

        if phone.startswith('0'):
            phone = '+254' + phone[1:]

        if not phone.startswith('+'):
            phone = '+' + phone

        if not re.match(r'^\+254\d{9}$', phone):
            raise serializers.ValidationError(
                'Invalid phone number format. Use format: +254712345678 or 0712345678'
            )

        return phone

    def validate_otp_code(self, value):
        """Validate OTP code is exactly 6 digits."""
        if not re.match(r'^\d{6}$', value):
            raise serializers.ValidationError('OTP code must be exactly 6 digits')
        return value


class StudentRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for student registration after OTP verification.

    Used when a new user completes registration after verifying their phone number.
    """
    phone_number = serializers.CharField(
        max_length=15,
        help_text="Phone number in E.164 format (must be OTP-verified)"
    )
    otp_id = serializers.UUIDField(
        write_only=True,
        help_text="UUID of verified OTP record"
    )

    class Meta:
        model = Student
        fields = [
            'phone_number',
            'otp_id',
            'name',
            'grade_level',
            'school',
            'preferred_channel',
            'language'
        ]
        extra_kwargs = {
            'name': {'required': True},
            'grade_level': {'required': True},
            'school': {'required': False},
            'preferred_channel': {'required': False, 'default': 'sms'},
            'language': {'required': False, 'default': 'en'}
        }

    def validate_phone_number(self, value):
        """Validate phone number format and check if already registered."""
        # Normalize phone number
        phone = value.strip().replace(' ', '').replace('-', '')

        if phone.startswith('0'):
            phone = '+254' + phone[1:]

        if not phone.startswith('+'):
            phone = '+' + phone

        if not re.match(r'^\+254\d{9}$', phone):
            raise serializers.ValidationError(
                'Invalid phone number format. Use format: +254712345678 or 0712345678'
            )

        # Check if already registered
        if Student.objects.filter(phone_number=phone).exists():
            raise serializers.ValidationError(
                'This phone number is already registered. Please login instead.'
            )

        return phone

    def validate_otp_id(self, value):
        """Validate that OTP exists and is verified."""
        try:
            otp = OTPVerification.objects.get(id=value)

            if not otp.is_verified:
                raise serializers.ValidationError(
                    'OTP not verified. Please verify your OTP first.'
                )

            if otp.is_expired:
                raise serializers.ValidationError(
                    'OTP has expired. Please request a new OTP.'
                )

            return value

        except OTPVerification.DoesNotExist:
            raise serializers.ValidationError('Invalid OTP ID.')

    def validate_grade_level(self, value):
        """Validate grade level is between 1 and 8."""
        if not (1 <= value <= 8):
            raise serializers.ValidationError('Grade level must be between 1 and 8.')
        return value

    def validate(self, attrs):
        """
        Cross-field validation.

        Ensure phone number in registration matches phone number in OTP record.
        """
        phone_number = attrs.get('phone_number')
        otp_id = attrs.get('otp_id')

        try:
            otp = OTPVerification.objects.get(id=otp_id)

            if otp.phone_number != phone_number:
                raise serializers.ValidationError({
                    'phone_number': 'Phone number does not match OTP record.'
                })

        except OTPVerification.DoesNotExist:
            raise serializers.ValidationError({
                'otp_id': 'Invalid OTP ID.'
            })

        return attrs

    def create(self, validated_data):
        """Create new student record."""
        # Remove otp_id from validated_data (not part of Student model)
        validated_data.pop('otp_id', None)

        # Create student
        student = Student.objects.create(**validated_data)

        return student


class TokenSerializer(serializers.Serializer):
    """
    Serializer for JWT token response.

    Returns access and refresh tokens after successful authentication.
    """
    access = serializers.CharField(read_only=True)
    refresh = serializers.CharField(read_only=True)
    student_id = serializers.UUIDField(read_only=True)
    phone_number = serializers.CharField(read_only=True)


class StudentProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for student profile (returned after registration/login).
    """
    class Meta:
        model = Student
        fields = [
            'id',
            'phone_number',
            'name',
            'grade_level',
            'school',
            'subscription_tier',
            'preferred_channel',
            'language',
            'is_active',
            'date_joined'
        ]
        read_only_fields = ['id', 'subscription_tier', 'date_joined']
