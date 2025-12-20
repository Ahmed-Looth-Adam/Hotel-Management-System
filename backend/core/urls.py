"""
Core URLs - Notification endpoints

Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]
