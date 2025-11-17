"""
Django Production Settings for SomoAI Backend

This file extends the base settings.py with production-specific configurations.
Use this for deployment on Railway, DigitalOcean, AWS, or any production environment.

IMPORTANT: Never commit secrets to version control!
All sensitive values should be set as environment variables.
"""

from .settings import *
import os

# ============================================================================
# SECURITY SETTINGS
# ============================================================================

# CRITICAL: Disable debug mode in production
DEBUG = False

# Allowed hosts for production
# Add your production domains here
ALLOWED_HOSTS = [
    'api.somoai.co.ke',           # Custom domain
    'somoai-backend.railway.app',  # Railway default domain
    '.railway.app',                # All Railway subdomains
    'localhost',                   # For local testing
]

# CRITICAL: Use a strong secret key from environment
# Generate with: python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    raise ValueError('SECRET_KEY environment variable must be set in production!')

# ============================================================================
# HTTPS & SECURITY
# ============================================================================

# Force HTTPS redirects
SECURE_SSL_REDIRECT = True

# Session cookies only sent over HTTPS
SESSION_COOKIE_SECURE = True

# CSRF cookies only sent over HTTPS
CSRF_COOKIE_SECURE = True

# Don't transmit session cookie over HTTP accidentally
SESSION_COOKIE_HTTPONLY = True

# Don't transmit CSRF cookie over HTTP accidentally
CSRF_COOKIE_HTTPONLY = True

# Browser XSS filter
SECURE_BROWSER_XSS_FILTER = True

# Prevent MIME-sniffing
SECURE_CONTENT_TYPE_NOSNIFF = True

# X-Frame-Options header (prevent clickjacking)
X_FRAME_OPTIONS = 'DENY'

# Strict Transport Security (HSTS)
# Force HTTPS for 1 year
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Referrer policy
SECURE_REFERRER_POLICY = 'same-origin'

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

# PostgreSQL database (Railway provides these automatically)
# Railway sets DATABASE_URL, but you can also use individual variables
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('PGDATABASE', 'railway'),
        'USER': os.environ.get('PGUSER', 'postgres'),
        'PASSWORD': os.environ.get('PGPASSWORD'),
        'HOST': os.environ.get('PGHOST', 'postgres.railway.internal'),
        'PORT': os.environ.get('PGPORT', '5432'),
        'CONN_MAX_AGE': 600,  # Connection pooling (10 minutes)
        'OPTIONS': {
            'sslmode': 'require',  # Require SSL connection
        },
    }
}

# ============================================================================
# STATIC & MEDIA FILES
# ============================================================================

# Static files (CSS, JavaScript, images)
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATIC_URL = '/static/'

# WhiteNoise for static file serving
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Add WhiteNoise to middleware (after SecurityMiddleware)
MIDDLEWARE.insert(
    MIDDLEWARE.index('django.middleware.security.SecurityMiddleware') + 1,
    'whitenoise.middleware.WhiteNoiseMiddleware',
)

# Media files (user uploads)
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
MEDIA_URL = '/media/'

# Maximum file upload size (5MB)
DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880

# ============================================================================
# CORS CONFIGURATION
# ============================================================================

# CORS settings for production
CORS_ALLOWED_ORIGINS = [
    'https://somoai.co.ke',
    'https://www.somoai.co.ke',
    'https://app.somoai.co.ke',
]

# CORS headers
CORS_ALLOW_CREDENTIALS = True

# Allowed CORS methods
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Allowed CORS headers
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# ============================================================================
# AFRICA'S TALKING CONFIGURATION (Production)
# ============================================================================

# Production Africa's Talking credentials
AFRICAS_TALKING_API_KEY = os.environ.get('AFRICAS_TALKING_API_KEY')
AFRICAS_TALKING_USERNAME = os.environ.get('AFRICAS_TALKING_USERNAME')
AFRICAS_TALKING_SHORTCODE = os.environ.get('AFRICAS_TALKING_SHORTCODE', '22500')

if not AFRICAS_TALKING_API_KEY:
    raise ValueError('AFRICAS_TALKING_API_KEY must be set in production!')

# ============================================================================
# EMAIL CONFIGURATION
# ============================================================================

# Email backend for admin notifications and error reports
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.environ.get('EMAIL_HOST_USER', 'noreply@somoai.co.ke')

# Admin email for error notifications
ADMINS = [
    ('SomoAI Admin', os.environ.get('ADMIN_EMAIL', 'admin@somoai.co.ke')),
]

# ============================================================================
# REDIS & CACHING
# ============================================================================

# Redis configuration (Railway provides REDIS_URL)
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': REDIS_URL,
        'OPTIONS': {
            'CLIENT_CLASS': 'django.core.cache.backends.redis.RedisClient',
        },
        'KEY_PREFIX': 'somoai_prod',
        'TIMEOUT': 300,  # 5 minutes default
    }
}

# ============================================================================
# CELERY CONFIGURATION (for background tasks)
# ============================================================================

# Celery broker (use Redis)
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL

# Celery settings
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Africa/Nairobi'

# Task time limits
CELERY_TASK_SOFT_TIME_LIMIT = 60  # 1 minute soft limit
CELERY_TASK_TIME_LIMIT = 120  # 2 minutes hard limit

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {name} {module} {process:d} {thread:d} - {message}',
            'style': '{',
        },
        'simple': {
            'format': '[{levelname}] {asctime} - {message}',
            'style': '{',
        },
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file_errors': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/tmp/django_errors.log',
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'mail_admins': {
            'level': 'ERROR',
            'class': 'django.utils.log.AdminEmailHandler',
            'filters': ['require_debug_false'],
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file_errors'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file_errors', 'mail_admins'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console', 'file_errors', 'mail_admins'],
            'level': 'ERROR',
            'propagate': False,
        },
        'django.security': {
            'handlers': ['console', 'file_errors', 'mail_admins'],
            'level': 'ERROR',
            'propagate': False,
        },
        'students': {
            'handlers': ['console', 'file_errors'],
            'level': 'INFO',
            'propagate': False,
        },
        'learning_engine': {
            'handlers': ['console', 'file_errors'],
            'level': 'INFO',
            'propagate': False,
        },
        'channels': {
            'handlers': ['console', 'file_errors'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# ============================================================================
# REST FRAMEWORK
# ============================================================================

# Update REST Framework settings for production
REST_FRAMEWORK.update({
    # Disable browsable API in production
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    # Rate limiting
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',  # Anonymous users
        'user': '1000/hour',  # Authenticated users
    },
})

# ============================================================================
# SESSION & COOKIE CONFIGURATION
# ============================================================================

# Session configuration
SESSION_ENGINE = 'django.contrib.sessions.backends.cached_db'
SESSION_CACHE_ALIAS = 'default'
SESSION_COOKIE_AGE = 1209600  # 2 weeks
SESSION_SAVE_EVERY_REQUEST = False

# Cookie configuration
SESSION_COOKIE_NAME = 'somoai_sessionid'
CSRF_COOKIE_NAME = 'somoai_csrftoken'

# ============================================================================
# PERFORMANCE OPTIMIZATIONS
# ============================================================================

# Database connection pooling
# Persistent database connections
CONN_MAX_AGE = 600  # 10 minutes

# Template caching
TEMPLATES[0]['OPTIONS']['loaders'] = [
    ('django.template.loaders.cached.Loader', [
        'django.template.loaders.filesystem.Loader',
        'django.template.loaders.app_directories.Loader',
    ]),
]

# ============================================================================
# MONITORING & ERROR TRACKING (Optional)
# ============================================================================

# Sentry for error tracking (optional)
# Uncomment and configure if using Sentry
# import sentry_sdk
# from sentry_sdk.integrations.django import DjangoIntegration
#
# sentry_sdk.init(
#     dsn=os.environ.get('SENTRY_DSN'),
#     integrations=[DjangoIntegration()],
#     traces_sample_rate=0.1,
#     send_default_pii=False,
#     environment='production',
# )

# ============================================================================
# CUSTOM SETTINGS
# ============================================================================

# OpenAI API key for AI tutoring
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')

# SMS configuration
SMS_DEFAULT_FROM = os.environ.get('SMS_DEFAULT_FROM', '22500')

# Learning engine settings
MAX_QUESTIONS_PER_LESSON = 5
MASTERY_THRESHOLD = 0.8

# Rate limits for SMS (prevent abuse)
SMS_DAILY_LIMIT_PER_USER = 50
API_DAILY_LIMIT_PER_USER = 1000

print("✅ Production settings loaded successfully!")
print(f"🌍 Environment: PRODUCTION")
print(f"🔒 DEBUG: {DEBUG}")
print(f"🏢 Allowed Hosts: {', '.join(ALLOWED_HOSTS[:3])}")
