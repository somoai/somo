# Procfile for Railway/Heroku deployment

# Web process - serves HTTP requests via Gunicorn
web: gunicorn somoai_backend.wsgi --log-file - --workers 3 --threads 2 --timeout 120 --bind 0.0.0.0:$PORT

# Release phase - runs migrations before deployment
release: python manage.py migrate --noinput && python manage.py collectstatic --noinput

# Worker process - Celery for background tasks (optional, enable if needed)
# worker: celery -A somoai_backend worker --loglevel=info --concurrency=2

# Beat process - Celery scheduler (optional, enable if needed)
# beat: celery -A somoai_backend beat --loglevel=info
