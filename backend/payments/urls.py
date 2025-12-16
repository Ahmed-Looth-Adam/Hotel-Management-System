# Edited By
# -> Ismail Wasiu Abdul Samad, UWE ID: 24050765

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, InvoiceViewSet, BookingServiceChargeViewSet

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'service-charges', BookingServiceChargeViewSet, basename='service-charge')

urlpatterns = [
    path('', include(router.urls)),
]
