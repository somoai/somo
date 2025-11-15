from rest_framework import serializers
from .models import School, Student, Parent, StudentSession


class SchoolSerializer(serializers.ModelSerializer):
    """Serializer for School model"""

    class Meta:
        model = School
        fields = [
            'id', 'name', 'county', 'type', 'total_students',
            'contact_phone', 'is_partner', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudentSerializer(serializers.ModelSerializer):
    """Basic serializer for Student model"""
    school_name = serializers.CharField(source='school.name', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'phone_number', 'name', 'grade_level', 'school', 'school_name',
            'date_joined', 'is_active', 'preferred_channel', 'language', 'settings'
        ]
        read_only_fields = ['id', 'date_joined']


class StudentDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for Student with nested school info"""
    school = SchoolSerializer(read_only=True)
    school_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Student
        fields = [
            'id', 'phone_number', 'name', 'grade_level', 'school', 'school_id',
            'date_joined', 'is_active', 'preferred_channel', 'language', 'settings'
        ]
        read_only_fields = ['id', 'date_joined']

    def create(self, validated_data):
        school_id = validated_data.pop('school_id', None)
        if school_id:
            validated_data['school_id'] = school_id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        school_id = validated_data.pop('school_id', None)
        if school_id is not None:
            validated_data['school_id'] = school_id
        return super().update(instance, validated_data)


class StudentCreateSerializer(serializers.ModelSerializer):
    """Serializer for student registration"""

    class Meta:
        model = Student
        fields = [
            'phone_number', 'name', 'grade_level', 'school',
            'preferred_channel', 'language'
        ]

    def validate_phone_number(self, value):
        """Validate phone number format (basic validation)"""
        # Remove spaces and common separators
        cleaned = value.replace(' ', '').replace('-', '').replace('+', '')

        # Check if it's all digits after cleaning
        if not cleaned.isdigit():
            raise serializers.ValidationError("Phone number must contain only digits")

        # Kenya phone numbers are typically 10 digits (without country code)
        # or 12 digits with country code (254...)
        if len(cleaned) not in [9, 10, 12]:
            raise serializers.ValidationError(
                "Phone number must be 9-12 digits long"
            )

        return value


class ParentSerializer(serializers.ModelSerializer):
    """Serializer for Parent model"""
    students = StudentSerializer(many=True, read_only=True)
    student_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        queryset=Student.objects.all(),
        source='students',
        required=False
    )

    class Meta:
        model = Parent
        fields = [
            'id', 'phone_number', 'name', 'students', 'student_ids',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudentSessionSerializer(serializers.ModelSerializer):
    """Serializer for StudentSession model"""
    student_name = serializers.CharField(source='student.name', read_only=True)
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = StudentSession
        fields = [
            'id', 'student', 'student_name', 'channel', 'started_at',
            'ended_at', 'events', 'state', 'is_active'
        ]
        read_only_fields = ['id', 'started_at', 'is_active']
