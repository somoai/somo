from django.core.management.base import BaseCommand
from django.db import transaction
from content.models import Subject, Concept, Lesson, Question
from students.models import School, Student


class Command(BaseCommand):
    help = 'Populate the database with sample curriculum data for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            Question.objects.all().delete()
            Lesson.objects.all().delete()
            Concept.objects.all().delete()
            Subject.objects.all().delete()
            Student.objects.all().delete()
            School.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('✓ Data cleared'))

        self.stdout.write(self.style.SUCCESS('Starting to seed data...'))

        with transaction.atomic():
            # Create subjects
            self.stdout.write('Creating subjects...')
            subjects = self.create_subjects()
            self.stdout.write(self.style.SUCCESS(f'✓ Created {len(subjects)} subjects'))

            # Create concepts for Math Grade 4
            self.stdout.write('Creating concepts...')
            concepts = self.create_math_concepts(subjects['math'])
            self.stdout.write(self.style.SUCCESS(f'✓ Created {len(concepts)} concepts'))

            # Create lessons and questions for each concept
            self.stdout.write('Creating lessons and questions...')
            total_lessons = 0
            total_questions = 0

            for concept_name, concept in concepts.items():
                lessons = self.create_lessons_for_concept(concept, concept_name)
                total_lessons += len(lessons)

                for lesson in lessons:
                    questions = self.create_questions_for_lesson(lesson, concept_name)
                    total_questions += len(questions)

            self.stdout.write(self.style.SUCCESS(
                f'✓ Created {total_lessons} lessons with {total_questions} questions'
            ))

            # Create test schools and students
            self.stdout.write('Creating schools and students...')
            schools = self.create_schools()
            students = self.create_students(schools)
            self.stdout.write(self.style.SUCCESS(
                f'✓ Created {len(schools)} schools and {len(students)} students'
            ))

        self.stdout.write(self.style.SUCCESS('\n=== Seeding completed successfully! ==='))

    def create_subjects(self):
        """Create core subjects"""
        math = Subject.objects.create(
            name='Mathematics',
            code='MATH',
            description='Core mathematics curriculum covering arithmetic, geometry, and problem-solving',
            grade_levels=[1, 2, 3, 4, 5, 6, 7, 8]
        )

        english = Subject.objects.create(
            name='English',
            code='ENG',
            description='English language skills including reading, writing, and comprehension',
            grade_levels=[1, 2, 3, 4, 5, 6, 7, 8]
        )

        science = Subject.objects.create(
            name='Science',
            code='SCI',
            description='Science curriculum covering biology, chemistry, and physics concepts',
            grade_levels=[4, 5, 6, 7, 8]
        )

        return {'math': math, 'english': english, 'science': science}

    def create_math_concepts(self, subject):
        """Create Grade 4 Math concepts with prerequisites"""
        addition = Concept.objects.create(
            subject=subject,
            name='Addition',
            code='MATH_ADD_G4',
            description='Understanding addition with multi-digit numbers',
            grade_level=4,
            learning_objectives=[
                'Add multi-digit whole numbers',
                'Solve word problems involving addition',
                'Understand the commutative property of addition'
            ]
        )

        subtraction = Concept.objects.create(
            subject=subject,
            name='Subtraction',
            code='MATH_SUB_G4',
            description='Mastering subtraction with borrowing',
            grade_level=4,
            learning_objectives=[
                'Subtract multi-digit whole numbers',
                'Understand borrowing/regrouping',
                'Solve word problems involving subtraction'
            ]
        )

        multiplication = Concept.objects.create(
            subject=subject,
            name='Multiplication',
            code='MATH_MULT_G4',
            description='Multiplication tables and multi-digit multiplication',
            grade_level=4,
            learning_objectives=[
                'Master multiplication tables up to 12',
                'Multiply multi-digit numbers',
                'Apply multiplication in real-world problems'
            ]
        )
        multiplication.prerequisites.add(addition)

        division = Concept.objects.create(
            subject=subject,
            name='Division',
            code='MATH_DIV_G4',
            description='Understanding division and remainders',
            grade_level=4,
            learning_objectives=[
                'Divide numbers with and without remainders',
                'Understand the relationship between multiplication and division',
                'Solve division word problems'
            ]
        )
        division.prerequisites.add(multiplication)

        fractions = Concept.objects.create(
            subject=subject,
            name='Fractions',
            code='MATH_FRAC_G4',
            description='Introduction to fractions and basic operations',
            grade_level=4,
            learning_objectives=[
                'Understand what fractions represent',
                'Compare and order fractions',
                'Add and subtract simple fractions'
            ]
        )
        fractions.prerequisites.add(division)

        return {
            'addition': addition,
            'subtraction': subtraction,
            'multiplication': multiplication,
            'division': division,
            'fractions': fractions
        }

    def create_lessons_for_concept(self, concept, concept_name):
        """Create lessons for a concept"""
        lessons_data = {
            'addition': [
                {
                    'title': 'Adding Two-Digit Numbers',
                    'difficulty': 1,
                    'content': {
                        'introduction': 'Today we will learn how to add two-digit numbers together.',
                        'explanation': 'When adding two-digit numbers, we start from the ones place and move to the tens place. If the ones place adds up to 10 or more, we carry over to the tens place.',
                        'examples': [
                            '23 + 45 = 68',
                            '17 + 38 = 55 (7+8=15, carry 1)',
                            'A farmer has 24 mangoes and picks 31 more. How many mangoes does he have? 24 + 31 = 55 mangoes'
                        ]
                    },
                    'duration': 600
                },
                {
                    'title': 'Adding Three-Digit Numbers',
                    'difficulty': 2,
                    'content': {
                        'introduction': 'Let\'s learn to add larger numbers with three digits.',
                        'explanation': 'Adding three-digit numbers follows the same process: add from right to left, carrying when needed.',
                        'examples': [
                            '123 + 456 = 579',
                            '287 + 345 = 632',
                            'A school has 234 students in lower primary and 328 in upper primary. Total: 234 + 328 = 562 students'
                        ]
                    },
                    'duration': 720
                }
            ],
            'fractions': [
                {
                    'title': 'Understanding Fractions',
                    'difficulty': 2,
                    'content': {
                        'introduction': 'A fraction represents a part of a whole.',
                        'explanation': 'A fraction has two parts: the numerator (top number) shows how many parts we have, and the denominator (bottom number) shows how many equal parts make up the whole.',
                        'examples': [
                            'If you cut 1 chapati into 2 equal pieces, each piece is 1/2',
                            'If you have 3 out of 4 oranges, that\'s 3/4',
                            'In a class of 8 students, if 5 are girls, then 5/8 are girls'
                        ]
                    },
                    'duration': 900
                },
                {
                    'title': 'Comparing Fractions',
                    'difficulty': 3,
                    'content': {
                        'introduction': 'Learn to compare which fraction is larger or smaller.',
                        'explanation': 'When fractions have the same denominator, compare the numerators. The larger numerator means a larger fraction.',
                        'examples': [
                            '3/4 is greater than 1/4',
                            '2/5 is less than 4/5',
                            'If one student ate 1/2 of a pizza and another ate 1/4, who ate more? 1/2 is more'
                        ]
                    },
                    'duration': 900
                },
                {
                    'title': 'Adding Simple Fractions',
                    'difficulty': 3,
                    'content': {
                        'introduction': 'Let\'s add fractions with the same denominator.',
                        'explanation': 'When adding fractions with the same denominator, add the numerators and keep the denominator the same.',
                        'examples': [
                            '1/4 + 2/4 = 3/4',
                            '2/8 + 3/8 = 5/8',
                            'You have 1/5 of a cake and get 2/5 more. Total: 1/5 + 2/5 = 3/5'
                        ]
                    },
                    'duration': 960
                }
            ],
            'multiplication': [
                {
                    'title': 'Multiplication Tables',
                    'difficulty': 2,
                    'content': {
                        'introduction': 'Learn your multiplication tables.',
                        'explanation': 'Multiplication is repeated addition. 3 × 4 means adding 3 four times: 3 + 3 + 3 + 3 = 12',
                        'examples': [
                            '2 × 5 = 10',
                            '4 × 6 = 24',
                            'If each bag has 5 oranges and you have 3 bags, total oranges: 5 × 3 = 15'
                        ]
                    },
                    'duration': 840
                }
            ],
            'division': [
                {
                    'title': 'Basic Division',
                    'difficulty': 2,
                    'content': {
                        'introduction': 'Division is sharing equally.',
                        'explanation': 'Division splits a number into equal groups. 12 ÷ 3 means sharing 12 items into 3 equal groups, giving 4 in each group.',
                        'examples': [
                            '20 ÷ 4 = 5',
                            '15 ÷ 3 = 5',
                            '12 mangoes shared among 4 students: 12 ÷ 4 = 3 mangoes each'
                        ]
                    },
                    'duration': 780
                }
            ],
            'subtraction': [
                {
                    'title': 'Subtracting with Borrowing',
                    'difficulty': 2,
                    'content': {
                        'introduction': 'Learn subtraction with borrowing.',
                        'explanation': 'When the top digit is smaller than the bottom digit, we borrow from the next column.',
                        'examples': [
                            '52 - 27 = 25 (borrow from 5)',
                            '41 - 18 = 23',
                            'You have 45 shillings and spend 28. Remaining: 45 - 28 = 17 shillings'
                        ]
                    },
                    'duration': 720
                }
            ]
        }

        lessons = []
        if concept_name in lessons_data:
            for idx, lesson_data in enumerate(lessons_data[concept_name]):
                lesson = Lesson.objects.create(
                    concept=concept,
                    title=lesson_data['title'],
                    difficulty_level=lesson_data['difficulty'],
                    content_type='text',
                    content=lesson_data['content'],
                    estimated_duration=lesson_data['duration'],
                    order=idx,
                    is_published=True
                )
                lessons.append(lesson)

        return lessons

    def create_questions_for_lesson(self, lesson, concept_name):
        """Create questions for a lesson"""
        questions_data = {
            'addition': [
                {
                    'text': 'What is 23 + 45?',
                    'options': {'A': '68', 'B': '58', 'C': '78', 'D': '48'},
                    'correct': 'A',
                    'explanation': '23 + 45 = 68. Add the ones: 3+5=8, then the tens: 2+4=6'
                },
                {
                    'text': 'Solve: 17 + 38',
                    'options': {'A': '45', 'B': '55', 'C': '65', 'D': '54'},
                    'correct': 'B',
                    'explanation': '17 + 38 = 55. Ones: 7+8=15 (write 5, carry 1). Tens: 1+3+1=5'
                },
                {
                    'text': 'A basket has 34 apples. You add 42 more. How many apples in total?',
                    'options': {'A': '66', 'B': '76', 'C': '86', 'D': '74'},
                    'correct': 'B',
                    'explanation': '34 + 42 = 76 apples'
                },
                {
                    'text': 'What is 56 + 29?',
                    'options': {'A': '85', 'B': '75', 'C': '84', 'D': '95'},
                    'correct': 'A',
                    'explanation': '56 + 29 = 85. Ones: 6+9=15 (write 5, carry 1). Tens: 5+2+1=8'
                },
                {
                    'text': 'If you have 28 pencils and your friend gives you 15 more, how many do you have?',
                    'options': {'A': '33', 'B': '43', 'C': '53', 'D': '42'},
                    'correct': 'B',
                    'explanation': '28 + 15 = 43 pencils'
                }
            ],
            'fractions': [
                {
                    'text': 'What is 1/2 + 1/4?',
                    'options': {'A': '1/6', 'B': '3/4', 'C': '2/6', 'D': '1/2'},
                    'correct': 'B',
                    'explanation': 'Convert 1/2 to 2/4, then 2/4 + 1/4 = 3/4'
                },
                {
                    'text': 'If you eat 2 slices of a pizza cut into 8 slices, what fraction did you eat?',
                    'options': {'A': '2/8 or 1/4', 'B': '2/6', 'C': '1/8', 'D': '2/4'},
                    'correct': 'A',
                    'explanation': 'You ate 2 out of 8 slices, which is 2/8 = 1/4'
                },
                {
                    'text': 'Which is larger: 3/4 or 1/4?',
                    'options': {'A': '1/4', 'B': '3/4', 'C': 'They are equal', 'D': 'Cannot compare'},
                    'correct': 'B',
                    'explanation': '3/4 is larger because 3 is greater than 1 when denominators are the same'
                },
                {
                    'text': 'What fraction of this group is shaded if 4 out of 6 circles are shaded?',
                    'options': {'A': '4/6', 'B': '2/6', 'C': '4/4', 'D': '6/4'},
                    'correct': 'A',
                    'explanation': '4 shaded out of 6 total = 4/6'
                },
                {
                    'text': 'Simplify: 2/8',
                    'options': {'A': '1/4', 'B': '1/2', 'C': '2/4', 'D': '4/8'},
                    'correct': 'A',
                    'explanation': '2/8 = 1/4 (divide both numerator and denominator by 2)'
                }
            ],
            'multiplication': [
                {
                    'text': 'What is 6 × 7?',
                    'options': {'A': '42', 'B': '36', 'C': '48', 'D': '54'},
                    'correct': 'A',
                    'explanation': '6 × 7 = 42'
                },
                {
                    'text': 'If each box contains 8 pencils and you have 5 boxes, how many pencils in total?',
                    'options': {'A': '35', 'B': '40', 'C': '45', 'D': '48'},
                    'correct': 'B',
                    'explanation': '8 × 5 = 40 pencils'
                },
                {
                    'text': 'What is 9 × 4?',
                    'options': {'A': '32', 'B': '36', 'C': '40', 'D': '45'},
                    'correct': 'B',
                    'explanation': '9 × 4 = 36'
                },
                {
                    'text': 'A farmer plants 7 rows of maize with 8 plants in each row. How many plants?',
                    'options': {'A': '54', 'B': '56', 'C': '64', 'D': '49'},
                    'correct': 'B',
                    'explanation': '7 × 8 = 56 plants'
                },
                {
                    'text': 'What is 12 × 3?',
                    'options': {'A': '36', 'B': '24', 'C': '30', 'D': '42'},
                    'correct': 'A',
                    'explanation': '12 × 3 = 36'
                }
            ],
            'division': [
                {
                    'text': 'What is 20 ÷ 4?',
                    'options': {'A': '4', 'B': '5', 'C': '6', 'D': '8'},
                    'correct': 'B',
                    'explanation': '20 ÷ 4 = 5'
                },
                {
                    'text': 'If 24 oranges are shared equally among 6 students, how many does each get?',
                    'options': {'A': '3', 'B': '4', 'C': '5', 'D': '6'},
                    'correct': 'B',
                    'explanation': '24 ÷ 6 = 4 oranges each'
                },
                {
                    'text': 'What is 35 ÷ 7?',
                    'options': {'A': '4', 'B': '5', 'C': '6', 'D': '7'},
                    'correct': 'B',
                    'explanation': '35 ÷ 7 = 5'
                },
                {
                    'text': 'If 18 books are placed equally on 3 shelves, how many books per shelf?',
                    'options': {'A': '5', 'B': '6', 'C': '7', 'D': '9'},
                    'correct': 'B',
                    'explanation': '18 ÷ 3 = 6 books per shelf'
                },
                {
                    'text': 'What is 27 ÷ 9?',
                    'options': {'A': '2', 'B': '3', 'C': '4', 'D': '9'},
                    'correct': 'B',
                    'explanation': '27 ÷ 9 = 3'
                }
            ],
            'subtraction': [
                {
                    'text': 'What is 52 - 27?',
                    'options': {'A': '25', 'B': '35', 'C': '15', 'D': '24'},
                    'correct': 'A',
                    'explanation': '52 - 27 = 25'
                },
                {
                    'text': 'You have 45 shillings and spend 28. How much is left?',
                    'options': {'A': '17', 'B': '27', 'C': '18', 'D': '16'},
                    'correct': 'A',
                    'explanation': '45 - 28 = 17 shillings'
                },
                {
                    'text': 'What is 81 - 36?',
                    'options': {'A': '44', 'B': '45', 'C': '55', 'D': '46'},
                    'correct': 'B',
                    'explanation': '81 - 36 = 45'
                },
                {
                    'text': 'A shop had 63 books and sold 29. How many books remain?',
                    'options': {'A': '33', 'B': '34', 'C': '35', 'D': '44'},
                    'correct': 'B',
                    'explanation': '63 - 29 = 34 books'
                },
                {
                    'text': 'What is 70 - 48?',
                    'options': {'A': '22', 'B': '23', 'C': '32', 'D': '28'},
                    'correct': 'A',
                    'explanation': '70 - 48 = 22'
                }
            ]
        }

        questions = []
        if concept_name in questions_data:
            for idx, q_data in enumerate(questions_data[concept_name]):
                question = Question.objects.create(
                    lesson=lesson,
                    question_text=q_data['text'],
                    question_type='mcq',
                    options=q_data['options'],
                    correct_answer=q_data['correct'],
                    explanation=q_data['explanation'],
                    difficulty_level=lesson.difficulty_level,
                    order=idx
                )
                questions.append(question)

        return questions

    def create_schools(self):
        """Create test schools"""
        school1 = School.objects.create(
            name='Nairobi Primary School',
            county='Nairobi',
            type='public',
            total_students=450,
            contact_phone='+254712345678',
            is_partner=True
        )

        school2 = School.objects.create(
            name='Mombasa Academy',
            county='Mombasa',
            type='private',
            total_students=320,
            contact_phone='+254723456789',
            is_partner=False
        )

        return [school1, school2]

    def create_students(self, schools):
        """Create test students"""
        students_data = [
            {'name': 'Amina Hassan', 'phone': '+254701234567', 'grade': 4, 'school': schools[0]},
            {'name': 'John Kamau', 'phone': '+254702234567', 'grade': 4, 'school': schools[0]},
            {'name': 'Grace Wanjiru', 'phone': '+254703234567', 'grade': 5, 'school': schools[1]},
            {'name': 'David Omondi', 'phone': '+254704234567', 'grade': 3, 'school': schools[1]},
            {'name': 'Faith Nyambura', 'phone': '+254705234567', 'grade': 4, 'school': schools[0]},
        ]

        students = []
        for data in students_data:
            student = Student.objects.create(
                name=data['name'],
                phone_number=data['phone'],
                grade_level=data['grade'],
                school=data['school'],
                preferred_channel='sms',
                language='en'
            )
            students.append(student)

        return students
