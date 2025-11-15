"""
SMS Formatter - Format content for SMS delivery (160 char limit).
"""


class SMSFormatter:
    """
    Format content for SMS delivery.

    SMS has a 160 character limit, so all messages must be compressed.
    """

    MAX_LENGTH = 160

    @staticmethod
    def format_lesson(lesson) -> str:
        """
        Format lesson introduction for SMS.

        Args:
            lesson: Lesson object

        Returns:
            Formatted SMS string
        """
        title = lesson.title
        concept = lesson.concept.name

        intro = lesson.content.get('introduction', '')[:100]

        message = f"📚 {concept}: {title}\n{intro}"

        return SMSFormatter.compress_text(message, SMSFormatter.MAX_LENGTH)

    @staticmethod
    def format_question(question, question_num: int, total: int) -> str:
        """
        Format question for SMS.

        Format: 'Q1/5: What is 2+2? A)3 B)4 C)5 D)6'

        Args:
            question: Question object
            question_num: Current question number (1-indexed)
            total: Total number of questions

        Returns:
            Formatted SMS string
        """
        q_text = question.question_text[:80]

        # Format options if MCQ
        if question.question_type == 'mcq' and question.options:
            options_text = ' '.join([
                f"{k}){v[:15]}"
                for k, v in sorted(question.options.items())
            ])
            message = f"Q{question_num}/{total}: {q_text}\n{options_text}\nReply A/B/C/D"
        else:
            message = f"Q{question_num}/{total}: {q_text}\nReply your answer"

        return SMSFormatter.compress_text(message, SMSFormatter.MAX_LENGTH)

    @staticmethod
    def format_feedback(is_correct: bool, explanation: str) -> str:
        """
        Format answer feedback.

        Args:
            is_correct: Whether the answer was correct
            explanation: Explanation text

        Returns:
            Formatted SMS string
        """
        if is_correct:
            emoji = "✅"
            prefix = "Correct!"
        else:
            emoji = "❌"
            prefix = "Incorrect."

        exp = explanation[:120]
        message = f"{emoji} {prefix} {exp}"

        return SMSFormatter.compress_text(message, SMSFormatter.MAX_LENGTH)

    @staticmethod
    def format_progress_report(progress: dict) -> str:
        """
        Format progress summary for SMS.

        Args:
            progress: Progress dictionary

        Returns:
            Formatted SMS string
        """
        lessons = progress.get('lessons_completed', 0)
        score = progress.get('average_score', 0)
        streak = progress.get('current_streak_days', 0)

        message = f"📊 Progress:\n✓ {lessons} lessons\n⭐ {score:.0f}% avg\n🔥 {streak} day streak"

        return SMSFormatter.compress_text(message, SMSFormatter.MAX_LENGTH)

    @staticmethod
    def compress_text(text: str, max_length: int = 160) -> str:
        """
        Intelligently compress text to fit SMS limit.

        Args:
            text: Original text
            max_length: Maximum length (default 160)

        Returns:
            Compressed text
        """
        if len(text) <= max_length:
            return text

        # Simple truncation with ellipsis
        return text[:max_length-3] + "..."

    @staticmethod
    def format_help_text() -> str:
        """
        Format help text.

        Returns:
            Help message
        """
        return (
            "SOMO AI Commands:\n"
            "JOIN Grade# Name - Register\n"
            "MATH/ENG/SCI - Get lesson\n"
            "A/B/C/D - Answer\n"
            "PROGRESS - View stats\n"
            "HELP - This message"
        )

    @staticmethod
    def format_welcome(name: str) -> str:
        """
        Format welcome message for new users.

        Args:
            name: Student name

        Returns:
            Welcome message
        """
        return f"Welcome {name} to SOMO AI! 📚 Reply MATH, ENG, or SCI to start learning. Reply HELP for commands."

    @staticmethod
    def format_lesson_complete(score: float, total_questions: int) -> str:
        """
        Format lesson completion message.

        Args:
            score: Score percentage
            total_questions: Number of questions

        Returns:
            Completion message
        """
        if score >= 80:
            emoji = "🌟"
            feedback = "Excellent!"
        elif score >= 60:
            emoji = "👍"
            feedback = "Good job!"
        else:
            emoji = "💪"
            feedback = "Keep practicing!"

        return f"{emoji} Lesson complete! Score: {score:.0f}% ({int(score/100 * total_questions)}/{total_questions}) {feedback}"
