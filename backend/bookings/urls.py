# Edited By
# -> Ahmed Looth Adam, UWE ID: 24050761

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookingViewSet, OrderViewSet

router = DefaultRouter()
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
]
