from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SubjectViewSet,
    ConceptViewSet,
    LessonViewSet,
    LessonAttemptViewSet,
    ConceptMasteryViewSet
)

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'concepts', ConceptViewSet, basename='concept')
router.register(r'lessons', LessonViewSet, basename='lesson')
router.register(r'attempts', LessonAttemptViewSet, basename='attempt')
router.register(r'mastery', ConceptMasteryViewSet, basename='mastery')

# The API URLs are determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
]
