# Edited By
# -> Ahmed Looth Adam, UWE ID: 24050761
# -> Ismail Wasiu Abdul Samad, UWE ID: 24050765 (Added notification signals)

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from datetime import datetime
from decimal import Decimal
from .models import Booking, CheckInRecord, Order
from .serializers import (
    BookingSerializer, BookingListSerializer, BookingDetailSerializer,
    CheckInSerializer, CheckInRecordSerializer, OrderSerializer, OrderCreateSerializer
)
from .permissions import IsOwnerOrStaff
from core.signals import booking_created, booking_cancelled, booking_checked_in, booking_checked_out


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaff]

    def get_serializer_class(self):
        if self.action == 'list':
            return BookingListSerializer
        if self.action == 'retrieve':
            return BookingDetailSerializer
        return BookingSerializer

    def perform_create(self, serializer):
        booking = serializer.save(user=self.request.user)
        # Send notification signal for new booking
        booking_created.send(sender=self.__class__, booking=booking)

    def get_queryset(self):
        user = self.request.user

        if user.is_staff:
            queryset = Booking.objects.all()
            # Staff/managers with assigned hotel can only see their hotel's bookings
            if user.role in ['staff', 'manager'] and user.assigned_hotel:
                queryset = queryset.filter(hotel=user.assigned_hotel)
        else:
            queryset = Booking.objects.filter(user=user)

        # Apply filters from query parameters
        hotel = self.request.query_params.get('hotel')
        status_filter = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if hotel:
            queryset = queryset.filter(hotel_id=hotel)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if search:
            queryset = queryset.filter(
                Q(booking_reference__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__username__icontains=search)
            )
        if date_from:
            queryset = queryset.filter(check_in_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(check_in_date__lte=date_to)

        # Checkout date filters
        checkout_from = self.request.query_params.get('checkout_from')
        checkout_to = self.request.query_params.get('checkout_to')

        if checkout_from:
            queryset = queryset.filter(check_out_date__gte=checkout_from)
        if checkout_to:
            queryset = queryset.filter(check_out_date__lte=checkout_to)

        return queryset

    def calculate_cancellation_fee(self, booking):
        """
        Calculate cancellation fee based on policy:
        - More than 14 days: Free
        - 3-14 days: 50% of first night
        - Less than 72 hours: 100% of first night
        - No-show: 100% of entire booking
        """
        now = timezone.now().date()
        check_in = booking.check_in_date
        days_until_checkin = (check_in - now).days

        total_price = booking.total_price or Decimal('0')

        # Calculate nights for first night price estimation
        nights = (booking.check_out_date - booking.check_in_date).days
        first_night_price = total_price / max(nights, 1)

        if days_until_checkin > 14:
            return Decimal('0'), 'free', 'Free cancellation (more than 14 days notice)'
        elif days_until_checkin >= 3:
            fee = first_night_price * Decimal('0.5')
            return fee, 'partial', '50% of first night (3-14 days notice)'
        else:
            fee = first_night_price
            return fee, 'full', '100% of first night (less than 72 hours notice)'

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel a booking with fee calculation based on cancellation policy.
        """
        booking = self.get_object()

        # Check if booking can be cancelled
        if booking.status in ['cancelled', 'checked_out', 'completed', 'no_show']:
            return Response(
                {'detail': f'Cannot cancel a booking with status: {booking.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if booking.status == 'checked_in':
            return Response(
                {'detail': 'Cannot cancel a booking that has already checked in'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate cancellation fee
        cancellation_fee, fee_type, fee_description = self.calculate_cancellation_fee(booking)

        # Get cancellation reason from request
        cancellation_reason = request.data.get('reason', '')

        # Update booking
        booking.status = 'cancelled'
        booking.cancelled_at = timezone.now()
        booking.cancellation_reason = cancellation_reason
        booking.save()

        # Update room status back to available if room was assigned
        if booking.room:
            booking.room.status = 'available'
            booking.room.save()

        # Send notification signal for cancelled booking
        booking_cancelled.send(sender=self.__class__, booking=booking)

        return Response({
            'success': True,
            'message': 'Booking cancelled successfully',
            'booking_reference': booking.booking_reference,
            'cancellation_fee': float(cancellation_fee),
            'fee_type': fee_type,
            'fee_description': fee_description,
            'cancelled_at': booking.cancelled_at,
        })

    @action(detail=True, methods=['get'])
    def available_rooms(self, request, pk=None):
        """
        Get available rooms for check-in for this booking.
        Returns rooms of the same type that are available for the booking dates.
        """
        from hotels.models import Room

        booking = self.get_object()

        # Check if booking can be checked in
        if booking.status != 'confirmed':
            return Response(
                {'detail': f'Cannot check in a booking with status: {booking.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get available rooms for this hotel and room type
        rooms = Room.objects.filter(
            hotel=booking.hotel,
            is_active=True,
            status='available'
        )

        # Filter by room type if requested
        if booking.room_type_requested:
            rooms = rooms.filter(room_type_category=booking.room_type_requested)

        # Check availability for the booking dates
        available_rooms = []
        for room in rooms:
            if room.is_available_for_dates(booking.check_in_date, booking.check_out_date, exclude_booking_id=booking.id):
                available_rooms.append({
                    'id': room.id,
                    'room_number': room.room_number,
                    'floor': room.floor,
                    'room_type': room.room_type_category,
                    'room_type_display': room.get_room_type_category_display(),
                    'bed_size': room.bed_size,
                    'bed_count': room.bed_count,
                    'max_occupancy': room.max_occupancy,
                    'view': room.view.name if room.view else None,
                    'status': room.status,
                })

        return Response({
            'booking_id': booking.id,
            'booking_reference': booking.booking_reference,
            'hotel_name': booking.hotel.name if booking.hotel else None,
            'check_in_date': booking.check_in_date,
            'check_out_date': booking.check_out_date,
            'room_type_requested': booking.room_type_requested,
            'guests_count': booking.guests_count,
            'available_rooms': available_rooms,
        })

    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        """
        Process check-in for a booking.
        Requires guest details (passport/ID info) and room assignment.
        """
        from hotels.models import Room

        booking = self.get_object()

        # Check if booking can be checked in
        if booking.status != 'confirmed':
            return Response(
                {'detail': f'Cannot check in a booking with status: {booking.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate request data
        serializer = CheckInSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        room_id = data['room_id']
        guests = data['guests']
        notes = data.get('notes', '')

        # Validate room
        try:
            room = Room.objects.get(id=room_id, hotel=booking.hotel)
        except Room.DoesNotExist:
            return Response(
                {'detail': 'Room not found or does not belong to this hotel'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check room availability
        if not room.is_available_for_dates(booking.check_in_date, booking.check_out_date, exclude_booking_id=booking.id):
            return Response(
                {'detail': 'Room is not available for the booking dates'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if room.status != 'available':
            return Response(
                {'detail': f'Room is currently {room.status} and cannot be assigned'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create check-in records for all guests
        check_in_records = []
        for guest_data in guests:
            record = CheckInRecord.objects.create(
                booking=booking,
                guest_type=guest_data['guest_type'],
                full_name=guest_data['full_name'],
                date_of_birth=guest_data['date_of_birth'],
                nationality=guest_data['nationality'],
                id_type=guest_data['id_type'],
                id_number=guest_data['id_number'],
                id_expiry_date=guest_data.get('id_expiry_date'),
                address=guest_data['address'],
                phone=guest_data.get('phone', ''),
                email=guest_data.get('email', ''),
                verified_by=request.user,
                notes=notes if guest_data['guest_type'] == 'primary' else '',
            )
            check_in_records.append(record)

        # Update booking
        booking.status = 'checked_in'
        booking.checked_in_at = timezone.now()
        booking.checked_in_by = request.user
        booking.check_in_notes = notes
        booking.room = room
        booking.room_number = room.room_number
        booking.actual_guests_checked_in = len(guests)
        booking.save()

        # Update room status to occupied
        room.status = 'occupied'
        room.save()

        # Send notification signal for check-in
        booking_checked_in.send(sender=self.__class__, booking=booking)

        return Response({
            'success': True,
            'message': 'Guest checked in successfully',
            'booking_reference': booking.booking_reference,
            'room_number': room.room_number,
            'checked_in_at': booking.checked_in_at,
            'checked_in_by': request.user.get_full_name() or request.user.username,
            'guests_checked_in': len(guests),
            'check_in_records': CheckInRecordSerializer(check_in_records, many=True).data,
        })

    @action(detail=True, methods=['post'])
    def check_out(self, request, pk=None):
        """
        Process check-out for a booking.
        """
        booking = self.get_object()

        # Check if booking can be checked out
        if booking.status != 'checked_in':
            return Response(
                {'detail': f'Cannot check out a booking with status: {booking.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        notes = request.data.get('notes', '')
        room_condition = request.data.get('room_condition', '')
        additional_charges = Decimal(str(request.data.get('additional_charges', 0)))

        # Update booking
        booking.status = 'checked_out'
        booking.checked_out_at = timezone.now()
        booking.checked_out_by = request.user
        booking.check_out_notes = notes
        booking.room_condition = room_condition
        booking.additional_charges = additional_charges
        booking.save()

        # Update room status to cleaning
        if booking.room:
            booking.room.status = 'cleaning'
            booking.room.save()

        # Send notification signal for check-out
        booking_checked_out.send(sender=self.__class__, booking=booking)

        return Response({
            'success': True,
            'message': 'Guest checked out successfully',
            'booking_reference': booking.booking_reference,
            'checked_out_at': booking.checked_out_at,
            'checked_out_by': request.user.get_full_name() or request.user.username,
            'additional_charges': float(additional_charges),
        })

    @action(detail=True, methods=['post'])
    def no_show(self, request, pk=None):
        """
        Mark a booking as no-show.
        Staff can mark a booking as no-show if:
        - The current date is on or after the check-in date
        - The booking status is 'confirmed'
        """
        booking = self.get_object()

        # Check if booking can be marked as no-show
        if booking.status != 'confirmed':
            return Response(
                {'detail': f'Cannot mark as no-show a booking with status: {booking.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if current date is on or after check-in date
        today = timezone.now().date()
        if today < booking.check_in_date:
            return Response(
                {'detail': 'Cannot mark as no-show before the check-in date'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get notes from request
        notes = request.data.get('notes', '')

        # Update booking status to no_show
        booking.status = 'no_show'
        booking.no_show_at = timezone.now()
        booking.no_show_by = request.user
        booking.no_show_notes = notes
        booking.save()

        # Release the room if one was pre-assigned
        if booking.room:
            booking.room.status = 'available'
            booking.room.save()

        return Response({
            'success': True,
            'message': 'Booking marked as no-show',
            'booking_reference': booking.booking_reference,
            'no_show_at': booking.no_show_at,
            'marked_by': request.user.get_full_name() or request.user.username,
        })


class OrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing orders (grouped bookings from cart checkout).
    """
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.is_staff and user.role == 'admin':
            return Order.objects.all()

        # Regular users and staff see only their own orders
        return Order.objects.filter(user=user)

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    def create(self, request, *args, **kwargs):
        """Create an order with multiple rooms from cart"""
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()

        # Return the full order details
        return Response(
            OrderSerializer(order, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
