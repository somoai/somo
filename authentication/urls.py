"""
Authentication URL configuration.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

app_name = 'authentication'

urlpatterns = [
    # OTP endpoints
    path('request-otp/', views.request_otp, name='request_otp'),
    path('verify-otp/', views.verify_otp, name='verify_otp'),

    # Registration
    path('register/', views.register_student, name='register'),

    # JWT token endpoints
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Test endpoint
    path('test/', views.test_auth, name='test_auth'),
]
