"""
SomoAI Authentication Tests

Tests for authentication and OTP functionality.
"""

from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status

from authentication.models import OTPVerification
from students.models import Student


class OTPRequestTestCase(TestCase):
    """Test OTP request endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/request-otp/'

    def test_request_otp_with_valid_phone(self):
        """Test OTP request with valid phone number"""
        data = {'phone_number': '+254712345678'}
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['phone_number'], '+254712345678')
        self.assertEqual(response.data['expires_in_minutes'], 5)

        # Verify OTP was created in database
        otp = OTPVerification.objects.filter(phone_number='+254712345678').first()
        self.assertIsNotNone(otp)
        self.assertFalse(otp.is_verified)

    def test_request_otp_with_kenyan_format(self):
        """Test OTP request with Kenyan phone format (07...)"""
        data = {'phone_number': '0712345678'}
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        # Should be converted to international format
        self.assertEqual(response.data['phone_number'], '+254712345678')

    def test_request_otp_with_invalid_phone(self):
        """Test OTP request with invalid phone number"""
        invalid_phones = [
            'invalid',
            '12345',
            '+1234567890',  # Wrong country code
            '+254123',  # Too short
        ]

        for phone in invalid_phones:
            data = {'phone_number': phone}
            response = self.client.post(self.url, data, format='json')

            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertFalse(response.data['success'])
            self.assertIn('phone_number', response.data['errors'])

    def test_request_otp_without_phone(self):
        """Test OTP request without phone number"""
        response = self.client.post(self.url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])

    def test_multiple_otp_requests_same_phone(self):
        """Test multiple OTP requests for same phone number"""
        data = {'phone_number': '+254712345678'}

        # First request
        response1 = self.client.post(self.url, data, format='json')
        self.assertEqual(response1.status_code, status.HTTP_200_OK)

        # Second request (should invalidate first OTP)
        response2 = self.client.post(self.url, data, format='json')
        self.assertEqual(response2.status_code, status.HTTP_200_OK)

        # Only one active OTP should exist
        active_otps = OTPVerification.objects.filter(
            phone_number='+254712345678',
            is_verified=False,
            expires_at__gt=timezone.now()
        ).count()
        self.assertEqual(active_otps, 1)


class OTPVerificationTestCase(TestCase):
    """Test OTP verification endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.request_url = '/api/auth/request-otp/'
        self.verify_url = '/api/auth/verify-otp/'
        self.phone_number = '+254712345678'

    def test_verify_valid_otp(self):
        """Test verifying a valid OTP for existing user"""
        # Create an existing student first
        Student.objects.create(
            phone_number=self.phone_number,
            name='Test Student',
            grade_level=4
        )

        # Request OTP
        self.client.post(
            self.request_url,
            {'phone_number': self.phone_number},
            format='json'
        )

        # Get the OTP code from database (in production this would be sent via SMS)
        otp = OTPVerification.objects.filter(phone_number=self.phone_number).first()
        self.assertIsNotNone(otp)

        # Verify OTP
        data = {
            'phone_number': self.phone_number,
            'otp_code': otp.otp_code
        }
        response = self.client.post(self.verify_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertFalse(response.data['is_new_user'])
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])
        self.assertIn('student', response.data)

    def test_verify_invalid_otp(self):
        """Test verifying an invalid OTP"""
        # Request OTP
        self.client.post(
            self.request_url,
            {'phone_number': self.phone_number},
            format='json'
        )

        # Try with wrong code
        data = {
            'phone_number': self.phone_number,
            'otp_code': '000000'
        }
        response = self.client.post(self.verify_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])

    def test_verify_expired_otp(self):
        """Test verifying an expired OTP"""
        # Create an expired OTP
        otp = OTPVerification.objects.create(
            phone_number=self.phone_number,
            otp_code='123456',
            expires_at=timezone.now() - timedelta(minutes=10)
        )

        # Try to verify expired OTP
        data = {
            'phone_number': self.phone_number,
            'otp_code': otp.otp_code
        }
        response = self.client.post(self.verify_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])

    def test_verify_already_verified_otp(self):
        """Test verifying an already verified OTP"""
        # Request and verify OTP
        self.client.post(
            self.request_url,
            {'phone_number': self.phone_number},
            format='json'
        )

        otp = OTPVerification.objects.filter(phone_number=self.phone_number).first()

        # First verification
        data = {
            'phone_number': self.phone_number,
            'otp_code': otp.otp_code
        }
        response1 = self.client.post(self.verify_url, data, format='json')
        self.assertEqual(response1.status_code, status.HTTP_200_OK)

        # Try to verify again
        response2 = self.client.post(self.verify_url, data, format='json')
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response2.data['success'])


class TokenRefreshTestCase(TestCase):
    """Test token refresh endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.request_url = '/api/auth/request-otp/'
        self.verify_url = '/api/auth/verify-otp/'
        self.refresh_url = '/api/auth/token/refresh/'
        self.phone_number = '+254712345678'

    def test_refresh_valid_token(self):
        """Test refreshing a valid token"""
        # Create an existing student first
        Student.objects.create(
            phone_number=self.phone_number,
            name='Test Student',
            grade_level=4
        )

        # Get initial tokens
        self.client.post(
            self.request_url,
            {'phone_number': self.phone_number},
            format='json'
        )

        otp = OTPVerification.objects.filter(phone_number=self.phone_number).first()

        verify_response = self.client.post(
            self.verify_url,
            {
                'phone_number': self.phone_number,
                'otp_code': otp.otp_code
            },
            format='json'
        )

        refresh_token = verify_response.data['tokens']['refresh']

        # Refresh the token
        data = {'refresh': refresh_token}
        response = self.client.post(self.refresh_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_refresh_invalid_token(self):
        """Test refreshing with invalid token"""
        data = {'refresh': 'invalid_token_12345'}
        response = self.client.post(self.refresh_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class StudentCreationTestCase(TestCase):
    """Test student creation during OTP verification"""

    def setUp(self):
        self.client = APIClient()
        self.request_url = '/api/auth/request-otp/'
        self.verify_url = '/api/auth/verify-otp/'
        self.register_url = '/api/auth/register/'
        self.phone_number = '+254712345678'

    def test_new_user_flow(self):
        """Test that new users must register after OTP verification"""
        # Request and verify OTP
        self.client.post(
            self.request_url,
            {'phone_number': self.phone_number},
            format='json'
        )

        otp = OTPVerification.objects.filter(phone_number=self.phone_number).first()

        response = self.client.post(
            self.verify_url,
            {
                'phone_number': self.phone_number,
                'otp_code': otp.otp_code
            },
            format='json'
        )

        # Verify new user response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertTrue(response.data['is_new_user'])
        self.assertIn('otp_id', response.data)

        # Verify no student was created yet
        student = Student.objects.filter(phone_number=self.phone_number).first()
        self.assertIsNone(student)

    def test_existing_student_returned_on_login(self):
        """Test that existing student is returned on login"""
        # Create a student first
        existing_student = Student.objects.create(
            phone_number=self.phone_number,
            name='Test Student',
            grade_level=5
        )

        # Login with same phone number
        self.client.post(
            self.request_url,
            {'phone_number': self.phone_number},
            format='json'
        )

        otp = OTPVerification.objects.filter(phone_number=self.phone_number).first()

        response = self.client.post(
            self.verify_url,
            {
                'phone_number': self.phone_number,
                'otp_code': otp.otp_code
            },
            format='json'
        )

        # Verify same student is returned
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_new_user'])
        self.assertEqual(response.data['student']['id'], str(existing_student.id))
        self.assertEqual(response.data['student']['name'], 'Test Student')

        # Verify no duplicate students were created
        student_count = Student.objects.filter(phone_number=self.phone_number).count()
        self.assertEqual(student_count, 1)
