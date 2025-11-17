"""
URL configuration for somoai_backend project.
"""

from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView
)
from monitoring import views as monitoring_views

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),

    # Health & Monitoring (no /api/ prefix for easy access)
    path('health/', monitoring_views.health_check, name='health'),
    path('ping/', monitoring_views.ping, name='ping'),
    path('version/', monitoring_views.version, name='version'),
    path('liveness/', monitoring_views.liveness, name='liveness'),
    path('readiness/', monitoring_views.readiness, name='readiness'),
    path('stats/', monitoring_views.stats, name='stats'),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # API Endpoints
    path('api/auth/', include('authentication.urls')),
    path('api/', include('students.urls')),
    path('api/', include('content.urls')),
    path('api/', include('learning_engine.urls')),
]
