"""
Authentication views for SomoAI API.

Provides endpoints for:
- OTP request (phone verification)
- OTP verification (returns JWT for existing users)
- Student registration (for new users)
- Token refresh
"""
import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from students.models import Student
from .serializers import (
    OTPRequestSerializer,
    OTPVerifySerializer,
    StudentRegistrationSerializer,
    TokenSerializer,
    StudentProfileSerializer
)
from .otp_service import OTPService

logger = logging.getLogger('somoai.auth')


@api_view(['POST'])
@permission_classes([AllowAny])
def request_otp(request):
    """
    Request OTP code for phone verification.

    POST /api/auth/request-otp/
    Body: {"phone_number": "+254712345678"}

    Returns:
        200: OTP sent successfully
        400: Invalid phone number or error
    """
    serializer = OTPRequestSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(
            {
                'success': False,
                'errors': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    phone_number = serializer.validated_data['phone_number']

    # Create OTP
    result = OTPService.create_otp(phone_number)

    if result['success']:
        logger.info(f"OTP requested for {phone_number}")
        return Response(
            {
                'success': True,
                'message': result['message'],
                'phone_number': phone_number,
                'expires_in_minutes': OTPService.OTP_EXPIRY_MINUTES
            },
            status=status.HTTP_200_OK
        )
    else:
        logger.error(f"Failed to create OTP for {phone_number}: {result.get('message')}")
        return Response(
            {
                'success': False,
                'message': result.get('message', 'Failed to send OTP')
            },
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """
    Verify OTP code.

    POST /api/auth/verify-otp/
    Body: {"phone_number": "+254712345678", "otp_code": "123456"}

    For existing users: Returns JWT tokens
    For new users: Returns verification success (must register)

    Returns:
        200: OTP verified
        400: Invalid OTP or verification failed
    """
    serializer = OTPVerifySerializer(data=request.data)

    if not serializer.is_valid():
        return Response(
            {
                'success': False,
                'errors': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    phone_number = serializer.validated_data['phone_number']
    otp_code = serializer.validated_data['otp_code']

    # Verify OTP
    result = OTPService.verify_otp(phone_number, otp_code)

    if not result['success']:
        logger.warning(f"OTP verification failed for {phone_number}")
        return Response(
            {
                'success': False,
                'message': result['message']
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # OTP verified successfully
    logger.info(f"OTP verified for {phone_number}")

    # If existing user, return JWT tokens
    if not result['is_new_user']:
        try:
            student = Student.objects.get(id=result['student_id'])

            # Generate JWT tokens
            refresh = RefreshToken.for_user(student)

            profile_serializer = StudentProfileSerializer(student)

            return Response(
                {
                    'success': True,
                    'message': 'Login successful',
                    'is_new_user': False,
                    'tokens': {
                        'access': str(refresh.access_token),
                        'refresh': str(refresh)
                    },
                    'student': profile_serializer.data
                },
                status=status.HTTP_200_OK
            )

        except Student.DoesNotExist:
            logger.error(f"Student not found: {result['student_id']}")
            return Response(
                {
                    'success': False,
                    'message': 'User not found'
                },
                status=status.HTTP_404_NOT_FOUND
            )

    # New user - return verification success
    return Response(
        {
            'success': True,
            'message': 'Phone verified. Please complete registration.',
            'is_new_user': True,
            'otp_id': result['otp_id'],
            'phone_number': phone_number
        },
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def register_student(request):
    """
    Register new student after OTP verification.

    POST /api/auth/register/
    Body: {
        "phone_number": "+254712345678",
        "otp_id": "uuid-of-verified-otp",
        "name": "John Doe",
        "grade_level": 4,
        "school": "school-uuid" (optional),
        "preferred_channel": "sms" (optional),
        "language": "en" (optional)
    }

    Returns:
        201: Registration successful (with JWT tokens)
        400: Invalid data or registration failed
    """
    serializer = StudentRegistrationSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(
            {
                'success': False,
                'errors': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Create student
    student = serializer.save()

    logger.info(f"New student registered: {student.name} ({student.phone_number})")

    # Generate JWT tokens
    refresh = RefreshToken.for_user(student)

    profile_serializer = StudentProfileSerializer(student)

    return Response(
        {
            'success': True,
            'message': 'Registration successful',
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            },
            'student': profile_serializer.data
        },
        status=status.HTTP_201_CREATED
    )


@api_view(['GET'])
def test_auth(request):
    """
    Test endpoint to verify JWT authentication is working.

    GET /api/auth/test/
    Headers: Authorization: Bearer <access_token>

    Returns:
        200: Authentication successful (with user info)
        401: Unauthorized
    """
    student = request.user

    return Response(
        {
            'success': True,
            'message': 'Authentication successful',
            'student': {
                'id': str(student.id),
                'phone_number': student.phone_number,
                'name': student.name,
                'grade_level': student.grade_level
            }
        },
        status=status.HTTP_200_OK
    )
