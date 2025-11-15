from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SchoolViewSet, StudentViewSet, ParentViewSet, StudentSessionViewSet

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'schools', SchoolViewSet, basename='school')
router.register(r'students', StudentViewSet, basename='student')
router.register(r'parents', ParentViewSet, basename='parent')
router.register(r'sessions', StudentSessionViewSet, basename='session')

# The API URLs are determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
]
