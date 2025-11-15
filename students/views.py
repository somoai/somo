from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import School, Student, Parent, StudentSession
from .serializers import (
    SchoolSerializer,
    StudentSerializer,
    StudentDetailSerializer,
    StudentCreateSerializer,
    ParentSerializer,
    StudentSessionSerializer
)


class SchoolViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing schools.
    Read-only for now.
    """
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['county', 'type', 'is_partner']
    search_fields = ['name', 'county']
    ordering_fields = ['name', 'total_students', 'created_at']
    ordering = ['name']


class StudentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing students.
    Provides CRUD operations plus custom actions.
    """
    queryset = Student.objects.all().select_related('school')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['grade_level', 'school', 'preferred_channel', 'language', 'is_active']
    search_fields = ['name', 'phone_number']
    ordering_fields = ['name', 'date_joined', 'grade_level']
    ordering = ['-date_joined']

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return StudentCreateSerializer
        elif self.action == 'retrieve':
            return StudentDetailSerializer
        return StudentSerializer

    def get_permissions(self):
        """
        Allow registration without authentication.
        All other actions require authentication.
        """
        if self.action == 'create':
            return [AllowAny()]
        return super().get_permissions()

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Get current authenticated student.
        This would require proper authentication implementation.
        For now, returns 404.
        """
        # TODO: Implement after adding proper authentication
        # For now, just return an example response
        return Response(
            {
                'detail': 'Authentication not fully implemented yet. '
                          'Use /api/students/{id}/ to get student details.'
            },
            status=status.HTTP_501_NOT_IMPLEMENTED
        )

    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        """
        Get student progress summary.
        Placeholder for now - will be implemented with content app.
        """
        student = self.get_object()

        # TODO: Calculate actual progress from LessonAttempt and ConceptMastery
        progress_data = {
            'student_id': str(student.id),
            'student_name': student.name,
            'grade_level': student.grade_level,
            'lessons_completed': 0,  # Placeholder
            'concepts_mastered': 0,  # Placeholder
            'average_score': 0.0,  # Placeholder
            'total_time_spent': 0,  # Placeholder
            'last_activity': None,  # Placeholder
        }

        return Response(progress_data)


class ParentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing parents/guardians.
    """
    queryset = Parent.objects.all().prefetch_related('students')
    serializer_class = ParentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'phone_number']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class StudentSessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing student sessions.
    Read-only for most users.
    """
    queryset = StudentSession.objects.all().select_related('student')
    serializer_class = StudentSessionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['student', 'channel']
    ordering_fields = ['started_at']
    ordering = ['-started_at']

    def get_queryset(self):
        """
        Optionally filter sessions by student.
        """
        queryset = super().get_queryset()
        student_id = self.request.query_params.get('student_id', None)
        if student_id:
            queryset = queryset.filter(student__id=student_id)
        return queryset
