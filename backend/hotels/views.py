from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from datetime import date

from .models import (
    Hotel, Room, RoomType, RoomView, RoomRate,
    AmenityCategory, Amenity, RoomAmenity,
    RoomTypePricing, ViewPricing, SeasonalPricing, DayTypePricing,
    PromotionalDiscount, HotelPolicy, Gallery, GalleryImage,
    LateCheckoutRequest, AncillaryService
)
from .serializers import (
    HotelSerializer, HotelListSerializer, HotelDetailSerializer,
    RoomSerializer, RoomListSerializer, RoomDetailSerializer,
    RoomTypeSerializer, RoomViewSerializer, RoomRateSerializer,
    AmenityCategorySerializer, AmenitySerializer, RoomAmenitySerializer,
    RoomTypePricingSerializer, ViewPricingSerializer,
    SeasonalPricingSerializer, DayTypePricingSerializer,
    PromotionalDiscountSerializer, HotelPolicySerializer,
    GallerySerializer, GalleryImageSerializer,
    LateCheckoutRequestSerializer, LateCheckoutRequestCreateSerializer,
    PricingCalculationRequestSerializer, RoomAvailabilityRequestSerializer,
    AncillaryServiceSerializer
)
from .permissions import (
    IsStaffOrReadOnly, IsHotelManager, HotelObjectPermission
)
from .services import PricingCalculator, BookingService, LateCheckoutService
from .pagination import FlexiblePageNumberPagination


# ============== Hotel ViewSets ==============

class HotelViewSet(viewsets.ModelViewSet):
    """ViewSet for Hotel CRUD operations"""
    queryset = Hotel.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsStaffOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'list':
            return HotelListSerializer
        if self.action == 'retrieve':
            return HotelDetailSerializer
        return HotelSerializer

    def get_queryset(self):
        queryset = Hotel.objects.all()

        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        # Filter by city
        city = self.request.query_params.get('city')
        if city:
            queryset = queryset.filter(city__icontains=city)

        return queryset


# ============== Room ViewSets ==============

class RoomViewSet(viewsets.ModelViewSet):
    """ViewSet for Room CRUD operations"""
    queryset = Room.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsStaffOrReadOnly]
    pagination_class = FlexiblePageNumberPagination

    def get_serializer_class(self):
        if self.action == 'list':
            return RoomListSerializer
        if self.action == 'retrieve':
            return RoomDetailSerializer
        return RoomSerializer

    def get_queryset(self):
        queryset = Room.objects.select_related('hotel', 'room_type', 'view', 'gallery')

        # Filter by hotel
        hotel_id = self.request.query_params.get('hotel')
        if hotel_id:
            queryset = queryset.filter(hotel_id=hotel_id)

        # Filter by room type category
        room_type = self.request.query_params.get('room_type')
        if room_type:
            queryset = queryset.filter(room_type_category=room_type)

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by active
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        return queryset


class RoomViewViewSet(viewsets.ModelViewSet):
    """ViewSet for Room View types"""
    queryset = RoomView.objects.all()
    serializer_class = RoomViewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsStaffOrReadOnly]

    def get_queryset(self):
        queryset = RoomView.objects.all()
        hotel_id = self.request.query_params.get('hotel')
        if hotel_id:
            queryset = queryset.filter(hotel_id=hotel_id)
        return queryset


class RoomTypeViewSet(viewsets.ModelViewSet):
    """ViewSet for Room Types"""
    queryset = RoomType.objects.all()
    serializer_class = RoomTypeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsStaffOrReadOnly]


# ============== Amenity ViewSets ==============

class AmenityCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for Amenity Categories"""
    queryset = AmenityCategory.objects.all()
    serializer_class = AmenityCategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsStaffOrReadOnly]

    def get_queryset(self):
        queryset = AmenityCategory.objects.all()
        hotel_id = self.request.query_params.get('hotel')
        if hotel_id:
            queryset = queryset.filter(hotel_id=hotel_id)
        return queryset


class AmenityViewSet(viewsets.ModelViewSet):
    """ViewSet for Amenities"""
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsStaffOrReadOnly]

    def get_queryset(self):
        queryset = Amenity.objects.select_related('category')
        hotel_id = self.request.query_params.get('hotel')
        if hotel_id:
            queryset = queryset.filter(hotel_id=hotel_id)
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset


class RoomAmenityViewSet(viewsets.ModelViewSet):
    """ViewSet for Room-Amenity assignments"""
    queryset = RoomAmenity.objects.all()
    serializer_class = RoomAmenitySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsStaffOrReadOnly]

    def get_queryset(self):
        queryset = RoomAmenity.objects.select_related('room', 'amenity')
        room_id = self.request.query_params.get('room')
        if room_id:
            queryset = queryset.filter(room_id=room_id)
        return queryset


# ============== Pricing ViewSets ==============

class RoomTypePricingViewSet(viewsets.ModelViewSet):
    """ViewSet for Room Type Pricing"""
    queryset = RoomTypePricing.objects.all()
    serializer_class = RoomTypePricingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsStaffOrReadOnly]

    def get_queryset(self):
        queryset = RoomTypePricing.objects.all()
        hotel_id = self.request.query_params.get('hotel')
        if hotel_id:
            queryset = queryset.filter(hotel_id=hotel_id)
        return queryset


class ViewPricingViewSet(viewsets.ModelViewSet):
    """ViewSet for View Pricing"""
    queryset = ViewPricing.objects.all()
    serializer_class = ViewPricingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsStaffOrReadOnly]

    def get_queryset(self):
        queryset = ViewPricing.objects.select_related('view')
        hotel_id = self.request.query_params.get('hotel')
        if hotel_id:
            queryset = queryset.filter(hotel_id=hotel_id)
        return queryset


class SeasonalPricingViewSet(viewsets.ModelViewSet):
    """ViewSet for Seasonal Pricing"""
    queryset = SeasonalPricing.objects.all()
    serializer_class = SeasonalPricingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsStaffOrReadOnly]

    def get_queryset(self):
        queryset = SeasonalPricing.objects.all()
        hotel_id = self.request.query_params.get('hotel')
        if hotel_id:
            queryset = queryset.filter(hotel_id=hotel_id)
        return queryset


class DayTypePricingViewSet(viewsets.ModelViewSet):
    """ViewSet for Day Type Pricing"""
    queryset = DayTypePricing.objects.all()
    serializer_class = DayTypePricingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsStaffOrReadOnly]

    def get_queryset(self):
        queryset = DayTypePricing.objects.all()
        hotel_id = self.request.query_params.get('hotel')
        if hotel_id:
            queryset = queryset.filter(hotel_id=hotel_id)
        return queryset


class PromotionalDiscountViewSet(viewsets.ModelViewSet):
    """ViewSet for Promotional Discounts"""
    queryset = PromotionalDiscount.objects.all()
    serializer_class = PromotionalDiscountSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsStaffOrReadOnly]

    def get_queryset(self):
        queryset = PromotionalDiscount.objects.all()
        hotel_id = self.request.query_params.get('hotel')
        if hotel_id:
            queryset = queryset.filter(hotel_id=hotel_id)
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset


class RoomRateViewSet(viewsets.ModelViewSet):
    """ViewSet for Room Rates (legacy)"""
    queryset = RoomRate.objects.all()
    serializer_class = RoomRateSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsStaffOrReadOnly]


# ============== Policy ViewSets ==============

class HotelPolicyViewSet(viewsets.ModelViewSet):
    """ViewSet for Hotel Policies"""
    queryset = HotelPolicy.objects.all()
    serializer_class = HotelPolicySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsStaffOrReadOnly]

    def get_queryset(self):
        queryset = HotelPolicy.objects.all()
        hotel_id = self.request.query_params.get('hotel')
        if hotel_id:
            queryset = queryset.filter(hotel_id=hotel_id)
        policy_type = self.request.query_params.get('policy_type')
        if policy_type:
            queryset = queryset.filter(policy_type=policy_type)
        return queryset


# ============== Gallery ViewSets ==============

class GalleryViewSet(viewsets.ModelViewSet):
    """ViewSet for Galleries"""
    queryset = Gallery.objects.all()
    serializer_class = GallerySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsStaffOrReadOnly]

    def get_queryset(self):
        queryset = Gallery.objects.prefetch_related('images', 'rooms')
        hotel_id = self.request.query_params.get('hotel')
        if hotel_id:
            queryset = queryset.filter(hotel_id=hotel_id)
        gallery_type = self.request.query_params.get('gallery_type')
        if gallery_type:
            queryset = queryset.filter(gallery_type=gallery_type)
        return queryset

    def destroy(self, request, *args, **kwargs):
        """Prevent deletion of hotel galleries"""
        instance = self.get_object()
        if instance.gallery_type == 'hotel':
            return Response(
                {'error': 'Cannot delete hotel gallery'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def assign_rooms(self, request, pk=None):
        """Assign rooms to a gallery"""
        gallery = self.get_object()
        if gallery.gallery_type == 'hotel':
            return Response(
                {'error': 'Cannot assign rooms to hotel gallery'},
                status=status.HTTP_400_BAD_REQUEST
            )

        room_ids = request.data.get('room_ids', [])
        if not isinstance(room_ids, list):
            return Response(
                {'error': 'room_ids must be a list'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update rooms to point to this gallery
        rooms = Room.objects.filter(id__in=room_ids, hotel=gallery.hotel)
        rooms.update(gallery=gallery)

        return Response({
            'message': f'Assigned {rooms.count()} rooms to gallery',
            'gallery': GallerySerializer(gallery).data
        })

    @action(detail=True, methods=['post'])
    def unassign_rooms(self, request, pk=None):
        """Unassign rooms from a gallery"""
        gallery = self.get_object()

        room_ids = request.data.get('room_ids', [])
        if not isinstance(room_ids, list):
            return Response(
                {'error': 'room_ids must be a list'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Remove gallery reference from rooms
        rooms = Room.objects.filter(id__in=room_ids, gallery=gallery)
        count = rooms.count()
        rooms.update(gallery=None)

        return Response({
            'message': f'Unassigned {count} rooms from gallery',
            'gallery': GallerySerializer(gallery).data
        })


class GalleryImageViewSet(viewsets.ModelViewSet):
    """ViewSet for Gallery Images"""
    queryset = GalleryImage.objects.all()
    serializer_class = GalleryImageSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsStaffOrReadOnly]

    def get_queryset(self):
        queryset = GalleryImage.objects.select_related('gallery')
        gallery_id = self.request.query_params.get('gallery')
        if gallery_id:
            queryset = queryset.filter(gallery_id=gallery_id)
        return queryset


# ============== Late Checkout ViewSets ==============

class LateCheckoutRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for Late Checkout Requests"""
    queryset = LateCheckoutRequest.objects.all()
    serializer_class = LateCheckoutRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = LateCheckoutRequest.objects.select_related(
            'booking', 'booking__user', 'booking__room', 'reviewed_by'
        )

        # Filter by hotel
        hotel_id = self.request.query_params.get('hotel')
        if hotel_id:
            queryset = queryset.filter(booking__hotel_id=hotel_id)

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = LateCheckoutRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from bookings.models import Booking
        booking = get_object_or_404(Booking, id=serializer.validated_data['booking_id'])

        service = LateCheckoutService()
        try:
            result = service.create_request(
                booking=booking,
                requested_time=serializer.validated_data['requested_checkout_time'],
                guest_notes=serializer.validated_data.get('guest_notes', '')
            )
            return Response(
                LateCheckoutRequestSerializer(result['request']).data,
                status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a late checkout request"""
        late_checkout = self.get_object()
        service = LateCheckoutService()

        try:
            service.approve(
                request=late_checkout,
                staff_user=request.user,
                manager_notes=request.data.get('notes', '')
            )
            return Response({'message': 'Late checkout approved'})
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a late checkout request"""
        late_checkout = self.get_object()
        service = LateCheckoutService()

        try:
            service.reject(
                request=late_checkout,
                staff_user=request.user,
                reason=request.data.get('reason', '')
            )
            return Response({'message': 'Late checkout rejected'})
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ============== Custom API Views ==============

class PricingCalculationView(APIView):
    """API view for calculating room prices"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PricingCalculationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        room = get_object_or_404(Room, id=serializer.validated_data['room_id'])
        calculator = PricingCalculator()

        try:
            pricing = calculator.calculate_room_price(
                room=room,
                check_in=serializer.validated_data['check_in'],
                check_out=serializer.validated_data['check_out'],
                promo_code=serializer.validated_data.get('promo_code')
            )
            return Response(pricing)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class RoomAvailabilityView(APIView):
    """API view for checking room availability"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RoomAvailabilityRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        hotel = get_object_or_404(Hotel, id=serializer.validated_data['hotel_id'])
        service = BookingService()

        rooms = service.get_available_rooms(
            hotel=hotel,
            check_in=serializer.validated_data['check_in'],
            check_out=serializer.validated_data['check_out'],
            room_type=serializer.validated_data.get('room_type'),
            view_id=serializer.validated_data.get('view_id'),
            min_occupancy=serializer.validated_data.get('min_occupancy'),
            bed_size=serializer.validated_data.get('bed_size')
        )

        return Response({
            'available_rooms': RoomListSerializer(rooms, many=True).data,
            'count': len(rooms),
            'check_in': serializer.validated_data['check_in'].isoformat(),
            'check_out': serializer.validated_data['check_out'].isoformat(),
        })


class OperationsDashboardView(APIView):
    """API view for operations dashboard data"""
    permission_classes = [permissions.IsAuthenticated, IsHotelManager]

    def get(self, request):
        hotel_id = request.query_params.get('hotel')
        if not hotel_id:
            return Response({'error': 'Hotel ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        hotel = get_object_or_404(Hotel, id=hotel_id)
        service = BookingService()

        today = date.today()
        checkins = service.get_today_checkins(hotel)
        checkouts = service.get_today_checkouts(hotel)
        occupancy = service.get_current_occupancy(hotel)

        # Get pending late checkout requests
        late_checkout_service = LateCheckoutService()
        pending_late_checkouts = late_checkout_service.get_pending_requests(hotel)

        from bookings.serializers import BookingListSerializer

        return Response({
            'date': today.isoformat(),
            'hotel': HotelListSerializer(hotel).data,
            'occupancy': occupancy,
            'today_checkins': {
                'count': len(checkins),
                'bookings': BookingListSerializer(checkins, many=True).data
            },
            'today_checkouts': {
                'count': len(checkouts),
                'bookings': BookingListSerializer(checkouts, many=True).data
            },
            'pending_late_checkouts': {
                'count': pending_late_checkouts.count(),
                'requests': LateCheckoutRequestSerializer(pending_late_checkouts, many=True).data
            }
        })


# ============== Ancillary Service ViewSets ==============

class AncillaryServiceViewSet(viewsets.ModelViewSet):
    """ViewSet for Ancillary Services (Airport Transfer, Breakfast, Spa, Late Checkout, etc.)"""
    queryset = AncillaryService.objects.all()
    serializer_class = AncillaryServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsStaffOrReadOnly]

    def get_queryset(self):
        queryset = AncillaryService.objects.select_related('hotel')

        # Filter by hotel
        hotel_id = self.request.query_params.get('hotel')
        if hotel_id:
            queryset = queryset.filter(hotel_id=hotel_id)

        # Filter by service type
        service_type = self.request.query_params.get('service_type')
        if service_type:
            queryset = queryset.filter(service_type=service_type)

        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        return queryset.order_by('hotel', 'name')
