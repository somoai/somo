"""
SomoAI Content Tests

Tests for content models and endpoints (subjects, concepts, lessons).
"""

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from content.models import Subject, Concept, Lesson, Question
from students.models import Student
from authentication.models import OTPVerification


class SubjectEndpointTestCase(TestCase):
    """Test Subject API endpoints"""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/subjects/'

        # Create test subjects
        self.math = Subject.objects.create(
            name='Mathematics',
            code='MATH',
            description='Learn numbers, algebra, and geometry',
            grade_levels=[1, 2, 3, 4, 5, 6, 7, 8]
        )
        self.english = Subject.objects.create(
            name='English',
            code='ENG',
            description='Learn reading, writing, and grammar',
            grade_levels=[1, 2, 3, 4, 5, 6, 7, 8]
        )

    def test_list_subjects(self):
        """Test listing all subjects"""
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_get_subject_detail(self):
        """Test getting a single subject"""
        url = f'{self.url}{self.math.id}/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Mathematics')
        self.assertEqual(response.data['code'], 'MATH')

    def test_search_subjects(self):
        """Test searching subjects by name"""
        url = f'{self.url}?search=Math'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['code'], 'MATH')


class ConceptTestCase(TestCase):
    """Test Concept model and endpoints"""

    def setUp(self):
        self.client = APIClient()

        # Create test student and authenticate
        self.student = Student.objects.create(
            phone_number='+254712345678',
            name='Test Student',
            grade_level=4
        )

        # Create subject
        self.math = Subject.objects.create(
            name='Mathematics',
            code='MATH',
            description='Learn mathematics',
            grade_levels=[1, 2, 3, 4, 5, 6, 7, 8]
        )

        # Create concepts
        self.fractions = Concept.objects.create(
            subject=self.math,
            name='Fractions',
            code='MATH_FRAC_G4',
            description='Understanding fractions',
            grade_level=4,
            learning_objectives=['Identify fractions', 'Add fractions']
        )

        # Authenticate (simplified for testing)
        # In production, would use JWT tokens
        # For now, marking user as authenticated in test
        self.client.force_authenticate(user=None)  # Use token auth later

    def test_concept_str_representation(self):
        """Test string representation of concept"""
        self.assertEqual(str(self.fractions), 'Fractions (Grade 4)')

    def test_concept_has_learning_objectives(self):
        """Test that concept has learning objectives"""
        self.assertEqual(len(self.fractions.learning_objectives), 2)
        self.assertIn('Identify fractions', self.fractions.learning_objectives)


class LessonTestCase(TestCase):
    """Test Lesson model and endpoints"""

    def setUp(self):
        # Create subject and concept
        self.math = Subject.objects.create(
            name='Mathematics',
            code='MATH',
            description='Learn mathematics',
            grade_levels=[1, 2, 3, 4]
        )

        self.fractions = Concept.objects.create(
            subject=self.math,
            name='Fractions',
            code='MATH_FRAC_G4',
            description='Understanding fractions',
            grade_level=4
        )

        # Create lesson
        self.lesson = Lesson.objects.create(
            concept=self.fractions,
            title='Introduction to Fractions',
            difficulty_level=2,
            content_type='text',
            content={
                'introduction': 'Fractions represent parts of a whole',
                'explanation': 'A fraction has two parts: numerator and denominator',
                'examples': ['1/2', '3/4', '2/3']
            },
            estimated_duration=600,  # 10 minutes
            order=1,
            is_published=True
        )

        # Create questions
        self.question1 = Question.objects.create(
            lesson=self.lesson,
            question_text='What is 1/2 + 1/2?',
            question_type='mcq',
            options={'A': '1', 'B': '2', 'C': '1/4', 'D': '3/2'},
            correct_answer='A',
            explanation='1/2 + 1/2 = 2/2 = 1',
            difficulty_level=2,
            order=1
        )

    def test_lesson_str_representation(self):
        """Test string representation of lesson"""
        expected = 'Introduction to Fractions (Fractions)'
        self.assertEqual(str(self.lesson), expected)

    def test_lesson_has_questions(self):
        """Test that lesson has questions"""
        questions = self.lesson.questions.all()
        self.assertEqual(questions.count(), 1)
        self.assertEqual(questions.first().question_text, 'What is 1/2 + 1/2?')

    def test_question_has_correct_answer(self):
        """Test that question has correct answer"""
        self.assertEqual(self.question1.correct_answer, 'A')
        self.assertEqual(self.question1.options['A'], '1')


class SubjectModelTestCase(TestCase):
    """Test Subject model"""

    def test_create_subject(self):
        """Test creating a subject"""
        subject = Subject.objects.create(
            name='Science',
            code='SCI',
            description='Learn about the natural world',
            grade_levels=[1, 2, 3, 4, 5]
        )

        self.assertEqual(subject.name, 'Science')
        self.assertEqual(subject.code, 'SCI')
        self.assertEqual(len(subject.grade_levels), 5)

    def test_subject_str_representation(self):
        """Test string representation"""
        subject = Subject.objects.create(
            name='Science',
            code='SCI',
            description='Science subject'
        )

        self.assertEqual(str(subject), 'Science')

    def test_subject_ordering(self):
        """Test that subjects are ordered by name"""
        Subject.objects.create(name='Zebra', code='Z', description='Z')
        Subject.objects.create(name='Algebra', code='A', description='A')

        subjects = Subject.objects.all()
        self.assertEqual(subjects[0].name, 'Algebra')
        self.assertEqual(subjects[1].name, 'Zebra')


class ConceptModelTestCase(TestCase):
    """Test Concept model"""

    def setUp(self):
        self.math = Subject.objects.create(
            name='Mathematics',
            code='MATH',
            description='Math subject'
        )

    def test_create_concept(self):
        """Test creating a concept"""
        concept = Concept.objects.create(
            subject=self.math,
            name='Addition',
            code='MATH_ADD_G1',
            description='Learning addition',
            grade_level=1
        )

        self.assertEqual(concept.name, 'Addition')
        self.assertEqual(concept.subject, self.math)
        self.assertEqual(concept.grade_level, 1)

    def test_concept_prerequisites(self):
        """Test concept prerequisites relationship"""
        basic_numbers = Concept.objects.create(
            subject=self.math,
            name='Basic Numbers',
            code='MATH_NUM_G1',
            description='Understanding numbers 1-10',
            grade_level=1
        )

        addition = Concept.objects.create(
            subject=self.math,
            name='Addition',
            code='MATH_ADD_G1',
            description='Learning addition',
            grade_level=1
        )

        # Add prerequisite
        addition.prerequisites.add(basic_numbers)

        self.assertEqual(addition.prerequisites.count(), 1)
        self.assertEqual(addition.prerequisites.first(), basic_numbers)


class LessonModelTestCase(TestCase):
    """Test Lesson model"""

    def setUp(self):
        math = Subject.objects.create(
            name='Mathematics',
            code='MATH',
            description='Math'
        )

        self.concept = Concept.objects.create(
            subject=math,
            name='Test Concept',
            code='TEST',
            description='Test',
            grade_level=1
        )

    def test_create_lesson(self):
        """Test creating a lesson"""
        lesson = Lesson.objects.create(
            concept=self.concept,
            title='Test Lesson',
            difficulty_level=1,
            content_type='text',
            content={'introduction': 'Test intro'},
            estimated_duration=300,
            order=1,
            is_published=True
        )

        self.assertEqual(lesson.title, 'Test Lesson')
        self.assertEqual(lesson.concept, self.concept)
        self.assertTrue(lesson.is_published)

    def test_lesson_ordering(self):
        """Test that lessons are ordered by concept and order"""
        lesson1 = Lesson.objects.create(
            concept=self.concept,
            title='Lesson 1',
            difficulty_level=1,
            content={},
            estimated_duration=300,
            order=2
        )

        lesson2 = Lesson.objects.create(
            concept=self.concept,
            title='Lesson 2',
            difficulty_level=1,
            content={},
            estimated_duration=300,
            order=1
        )

        lessons = Lesson.objects.all()
        self.assertEqual(lessons[0], lesson2)
        self.assertEqual(lessons[1], lesson1)
