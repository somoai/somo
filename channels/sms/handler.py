"""
SMS Handler - Process incoming SMS commands.
"""
from typing import Dict
from django.utils import timezone
import logging
import re

from students.models import Student
from content.models import Lesson
from channels.models import SMSSession, SMSMessage
from learning_engine.lesson_selector import LessonSelector
from learning_engine.progress_tracker import ProgressTracker
from .formatter import SMSFormatter
from .cost_manager import SMSCostManager

logger = logging.getLogger('somoai.channels')


class SMSHandler:
    """
    Process incoming SMS commands.

    Commands:
    - "SOMO JOIN Grade4 John" → Register
    - "SOMO MATH" → Get math lesson
    - "A" or "B" → Submit answer
    - "SOMO PROGRESS" → Progress report
    - "SOMO HELP" → Help text
    """

    def __init__(self):
        """Initialize SMS Handler."""
        self.formatter = SMSFormatter()
        self.cost_manager = SMSCostManager()

    def handle_incoming_sms(self, phone_number: str, message: str) -> str:
        """
        Process incoming SMS and return response.

        Args:
            phone_number: Sender's phone number
            message: SMS message text

        Returns:
            Response message to send back
        """
        try:
            # Record incoming message
            SMSMessage.objects.create(
                phone_number=phone_number,
                direction='inbound',
                message=message,
                status='delivered'
            )

            # Parse command
            command_data = self.parse_command(message.strip().upper())

            command = command_data.get('command')
            args = command_data.get('args', [])

            # Try to find student
            try:
                student = Student.objects.get(phone_number=phone_number)
                command_data['student'] = student
            except Student.DoesNotExist:
                student = None

            # Route to appropriate handler
            if command == 'JOIN':
                return self.handle_registration(phone_number, args)

            elif not student:
                return "Not registered. Reply: SOMO JOIN Grade4 YourName"

            elif command in ['MATH', 'ENG', 'SCI']:
                return self.handle_lesson_request(student, command)

            elif command in ['A', 'B', 'C', 'D']:
                return self.handle_answer_submission(student, command)

            elif command == 'PROGRESS':
                return self.handle_progress_request(student)

            elif command == 'HELP':
                return self.formatter.format_help_text()

            else:
                return f"Unknown command. Reply HELP for commands."

        except Exception as e:
            logger.error(f"Error handling SMS from {phone_number}: {str(e)}")
            return "Error processing request. Please try again."

    def parse_command(self, message: str) -> Dict:
        """
        Parse SMS into command and arguments.

        Args:
            message: SMS message text (uppercase)

        Returns:
            Dictionary with command and args
        """
        # Remove SOMO prefix if present
        if message.startswith('SOMO '):
            message = message[5:]

        parts = message.split()

        if not parts:
            return {'command': 'UNKNOWN', 'args': []}

        command = parts[0]
        args = parts[1:] if len(parts) > 1 else []

        return {
            'command': command,
            'args': args
        }

    def handle_registration(self, phone_number: str, args: list) -> str:
        """
        Handle: SOMO JOIN Grade4 John

        Args:
            phone_number: Phone number to register
            args: [Grade#, Name]

        Returns:
            Response message
        """
        try:
            if len(args) < 2:
                return "Format: SOMO JOIN Grade4 YourName"

            # Parse grade
            grade_str = args[0].upper().replace('GRADE', '')
            try:
                grade_level = int(grade_str)
                if not (1 <= grade_level <= 8):
                    return "Grade must be 1-8. Example: SOMO JOIN Grade4 John"
            except ValueError:
                return "Invalid grade. Example: SOMO JOIN Grade4 John"

            # Get name (remaining args)
            name = ' '.join(args[1:]).title()

            # Check if already registered
            if Student.objects.filter(phone_number=phone_number).exists():
                return f"Already registered! Reply MATH, ENG, or SCI to start learning."

            # Create student
            student = Student.objects.create(
                phone_number=phone_number,
                name=name,
                grade_level=grade_level,
                preferred_channel='sms'
            )

            logger.info(f"Registered new student: {name} (Grade {grade_level}) - {phone_number}")

            return self.formatter.format_welcome(name)

        except Exception as e:
            logger.error(f"Error registering student: {str(e)}")
            return "Registration failed. Please try: SOMO JOIN Grade4 YourName"

    def handle_lesson_request(self, student: Student, subject_code: str) -> str:
        """
        Handle: SOMO MATH

        Args:
            student: Student object
            subject_code: Subject code (MATH, ENG, SCI)

        Returns:
            Response message
        """
        try:
            # Check SMS limit
            if not self.cost_manager.should_send_sms(str(student.id)):
                return self.cost_manager.get_upgrade_message(str(student.id))

            # Get next lesson
            selector = LessonSelector(str(student.id))
            recommendation = selector.select_next_lesson(subject_code)

            lesson_data = recommendation.get('lesson')

            if not lesson_data:
                return f"No {subject_code} lessons available right now. Try another subject!"

            # Get full lesson object
            lesson = Lesson.objects.get(id=lesson_data['id'])

            # Create or update SMS session
            session = self.get_or_create_session(student)
            session.state = {
                'current_lesson_id': str(lesson.id),
                'current_question_index': 0,
                'answers': [],
                'started_at': timezone.now().isoformat()
            }
            session.save()

            # Format lesson intro
            intro_msg = self.formatter.format_lesson(lesson)

            # Get first question
            questions = lesson.questions.all().order_by('order')

            if questions.exists():
                first_question = questions[0]
                question_msg = self.formatter.format_question(first_question, 1, questions.count())

                return f"{intro_msg}\n\n{question_msg}"
            else:
                return f"{intro_msg}\n\nNo questions available for this lesson."

        except Lesson.DoesNotExist:
            logger.error(f"Lesson not found: {lesson_data.get('id')}")
            return "Error loading lesson. Please try again."
        except Exception as e:
            logger.error(f"Error handling lesson request: {str(e)}")
            return "Error loading lesson. Please try again."

    def handle_answer_submission(self, student: Student, answer: str) -> str:
        """
        Handle: A, B, C, D

        Args:
            student: Student object
            answer: Answer choice (A, B, C, D)

        Returns:
            Response message
        """
        try:
            # Get active session
            session = SMSSession.objects.filter(
                student=student,
                is_active=True
            ).order_by('-last_activity').first()

            if not session or not session.state.get('current_lesson_id'):
                return "No active lesson. Reply MATH, ENG, or SCI to start."

            lesson_id = session.state['current_lesson_id']
            lesson = Lesson.objects.prefetch_related('questions').get(id=lesson_id)

            questions = list(lesson.questions.all().order_by('order'))
            current_index = session.state.get('current_question_index', 0)

            if current_index >= len(questions):
                return "Lesson complete! Reply MATH, ENG, or SCI for next lesson."

            current_question = questions[current_index]

            # Check answer
            is_correct = answer == current_question.correct_answer

            # Record answer
            answers = session.state.get('answers', [])
            answers.append({
                'question_id': str(current_question.id),
                'answer': answer,
                'correct': is_correct
            })

            # Format feedback
            feedback_msg = self.formatter.format_feedback(
                is_correct,
                current_question.explanation
            )

            # Move to next question
            next_index = current_index + 1

            if next_index < len(questions):
                # More questions
                session.state['current_question_index'] = next_index
                session.state['answers'] = answers
                session.save()

                next_question = questions[next_index]
                question_msg = self.formatter.format_question(
                    next_question,
                    next_index + 1,
                    len(questions)
                )

                return f"{feedback_msg}\n\n{question_msg}"
            else:
                # Lesson complete
                correct_count = sum(1 for a in answers if a['correct'])
                score = (correct_count / len(questions) * 100) if questions else 0

                # Close session
                session.state['answers'] = answers
                session.state['completed_at'] = timezone.now().isoformat()
                session.is_active = False
                session.save()

                complete_msg = self.formatter.format_lesson_complete(score, len(questions))

                return f"{feedback_msg}\n\n{complete_msg}"

        except Lesson.DoesNotExist:
            return "Error: Lesson not found. Reply MATH, ENG, or SCI to start new lesson."
        except Exception as e:
            logger.error(f"Error handling answer submission: {str(e)}")
            return "Error processing answer. Please try again."

    def handle_progress_request(self, student: Student) -> str:
        """
        Handle: SOMO PROGRESS

        Args:
            student: Student object

        Returns:
            Response message
        """
        try:
            tracker = ProgressTracker()
            progress = tracker.get_progress_summary(str(student.id))

            return self.formatter.format_progress_report(progress)

        except Exception as e:
            logger.error(f"Error getting progress: {str(e)}")
            return "Error loading progress. Please try again later."

    def get_or_create_session(self, student: Student) -> SMSSession:
        """
        Get active SMS session or create new one.

        Args:
            student: Student object

        Returns:
            SMSSession object
        """
        # Get or create active session
        session = SMSSession.objects.filter(
            student=student,
            is_active=True
        ).order_by('-last_activity').first()

        if not session:
            session = SMSSession.objects.create(
                student=student,
                is_active=True
            )

        session.message_count += 1
        session.save()

        return session
