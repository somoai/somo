# SomoAI

SomoAI is an AI-powered education platform designed for Kenyan students, delivering personalized learning experiences through SMS, USSD, and mobile apps.

## Features

- **Multi-channel Delivery**: SMS, USSD, and mobile app support
- **Personalized Learning**: Adaptive content based on student performance
- **Curriculum Management**: Comprehensive content for grades 1-8
- **Progress Tracking**: Detailed analytics on student mastery and progress
- **School Integration**: Support for both public and private schools

## Tech Stack

- **Framework**: Django 4.2.7 with Django REST Framework
- **Database**: PostgreSQL
- **Cache/Queue**: Redis + Celery
- **API Documentation**: drf-spectacular (OpenAPI 3.0)

## Prerequisites

- Python 3.11+
- PostgreSQL 13+
- Redis 5.0+

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd somo
```

### 2. Create virtual environment

```bash
python3 -m venv venv
source venv/bin/activate  # On Mac/Linux
# OR
venv\Scripts\activate  # On Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your actual values:
- Generate a secure `SECRET_KEY`
- Configure `DATABASE_URL` with your PostgreSQL credentials
- Set `REDIS_URL` for your Redis instance

### 5. Set up PostgreSQL

```bash
# Create database
createdb somoai_db

# Or using psql:
psql postgres
CREATE DATABASE somoai_db;
CREATE USER somoai WITH PASSWORD 'somoai';
GRANT ALL PRIVILEGES ON DATABASE somoai_db TO somoai;
\q
```

### 6. Run migrations

```bash
python manage.py migrate
```

### 7. Create superuser

```bash
python manage.py createsuperuser
```

### 8. Load sample data (optional)

```bash
python manage.py seed_data
```

### 9. Run the development server

```bash
python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000/`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://127.0.0.1:8000/api/schema/swagger-ui/`
- ReDoc: `http://127.0.0.1:8000/api/schema/redoc/`
- OpenAPI Schema: `http://127.0.0.1:8000/api/schema/`

## Project Structure

```
somo/
├── manage.py
├── requirements.txt
├── .env.example
├── .gitignore
├── README.md
├── somoai_backend/          # Main project config
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── students/                # Student management app
│   ├── models.py           # Student, School, Parent models
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
└── content/                 # Curriculum management app
    ├── models.py           # Subject, Concept, Lesson, Question models
    ├── serializers.py
    ├── views.py
    └── urls.py
```

## Key Models

### Students App
- **School**: Educational institutions
- **Student**: Learner profiles with grade level and preferences
- **Parent**: Parent/guardian accounts linked to students
- **StudentSession**: Tracking user sessions across channels

### Content App
- **Subject**: Core subjects (Math, English, Science)
- **Concept**: Learning concepts within subjects
- **Lesson**: Individual lessons with content and questions
- **Question**: Assessment questions with multiple types
- **LessonAttempt**: Student attempt records with scores
- **ConceptMastery**: Spaced repetition tracking

## API Endpoints

### Students
- `GET /api/students/` - List students
- `POST /api/students/` - Register new student
- `GET /api/students/{id}/` - Get student details
- `GET /api/students/me/` - Get current student
- `GET /api/students/{id}/progress/` - Get progress summary

### Content
- `GET /api/subjects/` - List subjects
- `GET /api/concepts/` - List concepts (filter by subject, grade)
- `GET /api/lessons/` - List lessons (filter by concept, difficulty)
- `GET /api/lessons/{id}/` - Get lesson with questions
- `POST /api/lessons/{id}/start/` - Start lesson attempt
- `POST /api/lessons/{id}/submit/` - Submit lesson answers
- `GET /api/attempts/` - List student's attempts
- `GET /api/mastery/` - Get concept mastery levels

## Running Tests

```bash
python manage.py test
```

## Running Celery

In development, start Celery worker:

```bash
celery -A somoai_backend worker -l info
```

Start Celery beat (for scheduled tasks):

```bash
celery -A somoai_backend beat -l info
```

## Deployment

For production deployment with Gunicorn:

```bash
gunicorn somoai_backend.wsgi:application --bind 0.0.0.0:8000
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Proprietary - SomoAI Education Platform

## Contact

For questions or support, contact: [vince@somoai.co.ke]
