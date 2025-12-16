from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    HotelViewSet, RoomViewSet, RoomViewViewSet, RoomTypeViewSet,
    AmenityCategoryViewSet, AmenityViewSet, RoomAmenityViewSet,
    RoomTypePricingViewSet, ViewPricingViewSet, SeasonalPricingViewSet,
    DayTypePricingViewSet, PromotionalDiscountViewSet, RoomRateViewSet,
    HotelPolicyViewSet, GalleryViewSet, GalleryImageViewSet,
    LateCheckoutRequestViewSet, AncillaryServiceViewSet,
    PricingCalculationView, RoomAvailabilityView, OperationsDashboardView
)

router = DefaultRouter()

# Hotel management
router.register(r'hotels', HotelViewSet, basename='hotel')
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'room-types', RoomTypeViewSet, basename='room-type')
router.register(r'room-views', RoomViewViewSet, basename='room-view')
router.register(r'room-rates', RoomRateViewSet, basename='room-rate')

# Amenities
router.register(r'amenity-categories', AmenityCategoryViewSet, basename='amenity-category')
router.register(r'amenities', AmenityViewSet, basename='amenity')
router.register(r'room-amenities', RoomAmenityViewSet, basename='room-amenity')

# Pricing
router.register(r'room-type-pricing', RoomTypePricingViewSet, basename='room-type-pricing')
router.register(r'view-pricing', ViewPricingViewSet, basename='view-pricing')
router.register(r'seasonal-pricing', SeasonalPricingViewSet, basename='seasonal-pricing')
router.register(r'day-type-pricing', DayTypePricingViewSet, basename='day-type-pricing')
router.register(r'promotional-discounts', PromotionalDiscountViewSet, basename='promotional-discount')

# Policies
router.register(r'policies', HotelPolicyViewSet, basename='hotel-policy')

# Galleries
router.register(r'galleries', GalleryViewSet, basename='gallery')
router.register(r'gallery-images', GalleryImageViewSet, basename='gallery-image')

# Late checkout
router.register(r'late-checkout-requests', LateCheckoutRequestViewSet, basename='late-checkout-request')

# Ancillary Services
router.register(r'ancillary-services', AncillaryServiceViewSet, basename='ancillary-service')

urlpatterns = [
    # Router URLs
    path('', include(router.urls)),

    # Custom API endpoints
    path('pricing/calculate/', PricingCalculationView.as_view(), name='pricing-calculate'),
    path('rooms/availability/', RoomAvailabilityView.as_view(), name='room-availability'),
    path('operations/dashboard/', OperationsDashboardView.as_view(), name='operations-dashboard'),
]
