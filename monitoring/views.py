"""
Monitoring Views for SomoAI Backend

Provides health check and status endpoints for monitoring and alerting.
Use these endpoints with:
- Railway health checks
- Uptime monitors (UptimeRobot, Pingdom, etc.)
- Load balancers
- Kubernetes probes
"""

from django.http import JsonResponse
from django.db import connection
from django.conf import settings
from django.core.cache import cache
import sys
import os
from datetime import datetime


def health_check(request):
    """
    Comprehensive health check endpoint

    Checks:
    - Database connectivity
    - Redis cache connectivity
    - Python runtime
    - Debug mode status

    Returns:
    - 200 OK if all checks pass
    - 500 Internal Server Error if any check fails

    Example response:
    {
        "status": "healthy",
        "timestamp": "2025-11-17T12:00:00Z",
        "database": "connected",
        "cache": "connected",
        "python_version": "3.11.7",
        "debug": false,
        "environment": "production"
    }
    """
    try:
        # Check database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        database_status = "connected"

    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'error': 'database_error',
            'message': str(e)
        }, status=500)

    try:
        # Check cache connection (Redis)
        cache.set('health_check', 'ok', 10)
        cache_value = cache.get('health_check')

        if cache_value == 'ok':
            cache_status = "connected"
        else:
            raise ValueError("Cache test failed")

    except Exception as e:
        # Cache failure is non-critical, log but don't fail health check
        cache_status = f"error: {str(e)}"

    # Get Python version
    python_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"

    # Determine environment
    environment = 'production' if not settings.DEBUG else 'development'

    return JsonResponse({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'database': database_status,
        'cache': cache_status,
        'python_version': python_version,
        'debug': settings.DEBUG,
        'environment': environment,
    })


def liveness(request):
    """
    Kubernetes liveness probe endpoint

    Simple check that the application is running.
    Returns 200 OK if the process is alive.

    This should never fail unless the process is completely dead.
    """
    return JsonResponse({
        'status': 'alive',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
    })


def readiness(request):
    """
    Kubernetes readiness probe endpoint

    Checks if the application is ready to handle requests.
    - Checks database connection
    - Checks critical services

    Returns:
    - 200 OK if ready
    - 503 Service Unavailable if not ready
    """
    try:
        # Check database
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()

        return JsonResponse({
            'status': 'ready',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
        })

    except Exception as e:
        return JsonResponse({
            'status': 'not_ready',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'error': str(e)
        }, status=503)


def version(request):
    """
    Version and build information endpoint

    Returns application version, Git commit, and environment info.

    Example response:
    {
        "version": "1.0.0",
        "environment": "production",
        "python_version": "3.11.7",
        "django_version": "4.2.7",
        "commit_sha": "abc123",
        "build_date": "2025-11-17"
    }
    """
    import django

    # Try to get Git commit hash
    commit_sha = os.environ.get('RAILWAY_GIT_COMMIT_SHA', 'unknown')
    if commit_sha != 'unknown' and len(commit_sha) > 7:
        commit_sha = commit_sha[:7]  # Short hash

    # Try to get build date from Railway
    build_date = os.environ.get('RAILWAY_GIT_COMMIT_MESSAGE_TIME', 'unknown')

    return JsonResponse({
        'version': '1.0.0',  # Update this with each release
        'environment': 'production' if not settings.DEBUG else 'development',
        'python_version': f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        'django_version': django.get_version(),
        'commit_sha': commit_sha,
        'build_date': build_date,
        'debug': settings.DEBUG,
    })


def stats(request):
    """
    Basic statistics endpoint

    Returns:
    - Total students
    - Total lessons completed
    - Active users (last 7 days)
    - System uptime

    Note: This endpoint is optional and can be secured with authentication
    """
    try:
        from students.models import Student
        from learning_engine.models import StudentAttempt
        from django.utils import timezone
        from datetime import timedelta

        # Get basic stats
        total_students = Student.objects.count()
        total_attempts = StudentAttempt.objects.count()

        # Active users in last 7 days
        seven_days_ago = timezone.now() - timedelta(days=7)
        active_users = Student.objects.filter(
            studentattempt__timestamp__gte=seven_days_ago
        ).distinct().count()

        return JsonResponse({
            'total_students': total_students,
            'total_lesson_attempts': total_attempts,
            'active_users_7d': active_users,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
        })

    except Exception as e:
        return JsonResponse({
            'error': 'Failed to retrieve stats',
            'message': str(e)
        }, status=500)


def ping(request):
    """
    Simple ping endpoint

    Returns "pong" - useful for quick uptime checks
    """
    return JsonResponse({
        'ping': 'pong',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
    })
