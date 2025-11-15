from rest_framework import serializers
from .models import Subject, Concept, Lesson, Question, LessonAttempt, ConceptMastery


class SubjectSerializer(serializers.ModelSerializer):
    """Serializer for Subject model"""

    class Meta:
        model = Subject
        fields = [
            'id', 'name', 'code', 'description', 'grade_levels',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ConceptListSerializer(serializers.ModelSerializer):
    """Simple serializer for listing concepts"""
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)

    class Meta:
        model = Concept
        fields = [
            'id', 'name', 'code', 'subject', 'subject_name', 'subject_code',
            'grade_level', 'description'
        ]
        read_only_fields = ['id']


class ConceptSerializer(serializers.ModelSerializer):
    """Detailed serializer for Concept with prerequisites"""
    subject = SubjectSerializer(read_only=True)
    prerequisites = ConceptListSerializer(many=True, read_only=True)
    lessons_count = serializers.SerializerMethodField()

    class Meta:
        model = Concept
        fields = [
            'id', 'name', 'code', 'subject', 'grade_level', 'description',
            'prerequisites', 'learning_objectives', 'lessons_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_lessons_count(self, obj):
        return obj.lessons.filter(is_published=True).count()


class QuestionSerializer(serializers.ModelSerializer):
    """Serializer for Question model"""

    class Meta:
        model = Question
        fields = [
            'id', 'question_text', 'question_type', 'options',
            'correct_answer', 'explanation', 'difficulty_level',
            'order', 'media_url'
        ]
        read_only_fields = ['id']

    def to_representation(self, instance):
        """Hide correct_answer and explanation when listing questions for students"""
        representation = super().to_representation(instance)

        # Check if this is being accessed for taking a lesson (not reviewing)
        request = self.context.get('request')
        if request and request.query_params.get('hide_answers', 'false').lower() == 'true':
            representation.pop('correct_answer', None)
            representation.pop('explanation', None)

        return representation


class LessonListSerializer(serializers.ModelSerializer):
    """Simple serializer for listing lessons"""
    concept_name = serializers.CharField(source='concept.name', read_only=True)
    concept_code = serializers.CharField(source='concept.code', read_only=True)
    questions_count = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'concept', 'concept_name', 'concept_code',
            'difficulty_level', 'content_type', 'estimated_duration',
            'questions_count', 'order'
        ]
        read_only_fields = ['id']

    def get_questions_count(self, obj):
        return obj.questions.count()


class LessonSerializer(serializers.ModelSerializer):
    """Detailed serializer for Lesson with questions"""
    concept = ConceptListSerializer(read_only=True)
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'concept', 'difficulty_level', 'content_type',
            'content', 'estimated_duration', 'order', 'questions',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LessonAttemptSerializer(serializers.ModelSerializer):
    """Serializer for viewing lesson attempts"""
    student_name = serializers.CharField(source='student.name', read_only=True)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    is_completed = serializers.BooleanField(read_only=True)

    class Meta:
        model = LessonAttempt
        fields = [
            'id', 'student', 'student_name', 'lesson', 'lesson_title',
            'channel', 'started_at', 'completed_at', 'answers', 'score',
            'time_spent', 'difficulty_level', 'is_completed'
        ]
        read_only_fields = ['id', 'started_at', 'is_completed']


class LessonAttemptCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a lesson attempt"""

    class Meta:
        model = LessonAttempt
        fields = ['student', 'lesson', 'channel', 'difficulty_level']

    def create(self, validated_data):
        # Set the difficulty_level from the lesson if not provided
        if 'difficulty_level' not in validated_data:
            validated_data['difficulty_level'] = validated_data['lesson'].difficulty_level
        return super().create(validated_data)


class LessonSubmitSerializer(serializers.Serializer):
    """Serializer for submitting lesson answers"""
    answers = serializers.ListField(
        child=serializers.DictField(),
        help_text='List of answers: [{"question_id": "...", "answer": "A"}, ...]'
    )
    time_spent = serializers.IntegerField(required=False, help_text='Time spent in seconds')

    def validate_answers(self, value):
        """Validate answers format"""
        for answer in value:
            if 'question_id' not in answer or 'answer' not in answer:
                raise serializers.ValidationError(
                    'Each answer must contain "question_id" and "answer"'
                )
        return value


class ConceptMasterySerializer(serializers.ModelSerializer):
    """Serializer for ConceptMastery model"""
    student_name = serializers.CharField(source='student.name', read_only=True)
    concept_name = serializers.CharField(source='concept.name', read_only=True)
    concept_code = serializers.CharField(source='concept.code', read_only=True)

    class Meta:
        model = ConceptMastery
        fields = [
            'id', 'student', 'student_name', 'concept', 'concept_name',
            'concept_code', 'mastery_level', 'attempts_count',
            'last_practiced', 'next_review_date', 'spaced_repetition_box',
            'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']
