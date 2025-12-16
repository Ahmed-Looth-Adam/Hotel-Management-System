from datetime import date, datetime
from typing import Optional, Dict, List, Any
from django.db import transaction
from django.db.models import Q

from hotels.models import Hotel, Room
from bookings.models import Booking, BookingGuest
from .pricing_calculator import PricingCalculator


class BookingService:
    """
    Service for managing hotel bookings.

    Provides functionality for:
    - Finding available rooms
    - Creating bookings with price calculation
    - Check-in/check-out operations
    - Booking management
    """

    def __init__(self):
        self.pricing_calculator = PricingCalculator()

    def get_available_rooms(
        self,
        hotel: Hotel,
        check_in: date,
        check_out: date,
        room_type: Optional[str] = None,
        view_id: Optional[int] = None,
        min_occupancy: Optional[int] = None,
        bed_size: Optional[str] = None,
    ) -> List[Room]:
        """
        Find available rooms for the given date range.

        Args:
            hotel: Hotel to search in
            check_in: Check-in date
            check_out: Check-out date
            room_type: Optional filter by room type category
            view_id: Optional filter by view
            min_occupancy: Optional minimum occupancy requirement
            bed_size: Optional filter by bed size

        Returns:
            List of available Room instances
        """
        # Start with active rooms for this hotel
        rooms = Room.objects.filter(
            hotel=hotel,
            is_active=True,
            is_available=True
        )

        # Apply filters
        if room_type:
            rooms = rooms.filter(room_type_category=room_type)
        if view_id:
            rooms = rooms.filter(view_id=view_id)
        if min_occupancy:
            rooms = rooms.filter(max_occupancy__gte=min_occupancy)
        if bed_size:
            rooms = rooms.filter(bed_size=bed_size)

        # Exclude rooms with conflicting bookings
        conflicting_bookings = Booking.objects.filter(
            hotel=hotel,
            status__in=['confirmed', 'checked_in'],
            check_in_date__lt=check_out,
            check_out_date__gt=check_in
        ).values_list('room_id', flat=True)

        available_rooms = rooms.exclude(id__in=conflicting_bookings)

        return list(available_rooms.select_related('view', 'gallery', 'room_type'))

    def check_room_availability(
        self,
        room: Room,
        check_in: date,
        check_out: date,
        exclude_booking_id: Optional[int] = None
    ) -> bool:
        """Check if a specific room is available for the date range."""
        return room.is_available_for_dates(check_in, check_out, exclude_booking_id)

    @transaction.atomic
    def create_booking(
        self,
        user,
        hotel: Hotel,
        room: Room,
        check_in: date,
        check_out: date,
        guests_count: int = 1,
        special_requests: str = '',
        promo_code: Optional[str] = None,
        payment_method: str = '',
        guests_info: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Create a new booking with price calculation.

        Args:
            user: User making the booking
            hotel: Hotel for the booking
            room: Room to book
            check_in: Check-in date
            check_out: Check-out date
            guests_count: Number of guests
            special_requests: Any special requests
            promo_code: Optional promotional code
            payment_method: Payment method
            guests_info: Optional list of guest information dicts

        Returns:
            Dictionary with booking and pricing information
        """
        # Check availability
        if not self.check_room_availability(room, check_in, check_out):
            raise ValueError('Room is not available for the selected dates')

        # Calculate booking advance days for early bird promotions
        booking_advance_days = (check_in - date.today()).days

        # Calculate price
        pricing = self.pricing_calculator.calculate_room_price(
            room=room,
            check_in=check_in,
            check_out=check_out,
            number_of_rooms=1,
            promo_code=promo_code,
            booking_advance_days=booking_advance_days
        )

        # Create booking
        booking = Booking.objects.create(
            user=user,
            hotel=hotel,
            room=room,
            room_number=room.room_number,
            check_in_date=check_in,
            check_out_date=check_out,
            guests_count=guests_count,
            total_price=pricing['total_price'],
            promo_code=promo_code or '',
            special_requests=special_requests,
            payment_method=payment_method,
            status='pending'
        )

        # Create guest records if provided
        if guests_info:
            for i, guest_data in enumerate(guests_info):
                BookingGuest.objects.create(
                    booking=booking,
                    guest_type='primary' if i == 0 else 'additional',
                    full_name=guest_data.get('full_name', ''),
                    email=guest_data.get('email', ''),
                    phone=guest_data.get('phone', ''),
                    date_of_birth=guest_data.get('date_of_birth'),
                    nationality=guest_data.get('nationality', ''),
                    id_type=guest_data.get('id_type', ''),
                    id_number=guest_data.get('id_number', ''),
                    relationship_to_primary=guest_data.get('relationship_to_primary', ''),
                    special_requirements=guest_data.get('special_requirements', '')
                )

        return {
            'booking': booking,
            'pricing': pricing,
            'success': True,
            'message': f'Booking created successfully with reference {booking.booking_reference}'
        }

    def confirm_booking(self, booking: Booking) -> bool:
        """Confirm a pending booking."""
        if booking.status != 'pending':
            raise ValueError(f'Cannot confirm booking with status: {booking.status}')

        booking.status = 'confirmed'
        booking.save()
        return True

    def check_in(
        self,
        booking: Booking,
        staff_user,
        notes: Optional[str] = None,
        actual_guests: Optional[int] = None
    ) -> bool:
        """
        Process check-in for a booking.

        Args:
            booking: Booking to check in
            staff_user: Staff user processing the check-in
            notes: Optional check-in notes
            actual_guests: Optional actual number of guests checking in

        Returns:
            True if successful
        """
        if not booking.can_check_in():
            raise ValueError('Booking cannot be checked in at this time')

        return booking.check_in(
            staff_user=staff_user,
            notes=notes,
            actual_guests=actual_guests
        )

    def check_out(
        self,
        booking: Booking,
        staff_user,
        notes: Optional[str] = None,
        room_condition: Optional[str] = None,
        additional_charges: float = 0
    ) -> bool:
        """
        Process check-out for a booking.

        Args:
            booking: Booking to check out
            staff_user: Staff user processing the check-out
            notes: Optional check-out notes
            room_condition: Room condition assessment
            additional_charges: Any additional charges

        Returns:
            True if successful
        """
        if not booking.can_check_out():
            raise ValueError('Booking cannot be checked out at this time')

        if additional_charges > 0:
            booking.additional_charges = additional_charges

        return booking.check_out(
            staff_user=staff_user,
            notes=notes,
            room_condition=room_condition
        )

    def cancel_booking(
        self,
        booking: Booking,
        reason: Optional[str] = None
    ) -> bool:
        """Cancel a booking."""
        if booking.status in ['checked_in', 'checked_out', 'completed', 'cancelled']:
            raise ValueError(f'Cannot cancel booking with status: {booking.status}')

        return booking.cancel(reason=reason)

    def get_today_checkins(self, hotel: Hotel) -> List[Booking]:
        """Get all bookings with check-in today."""
        today = date.today()
        return list(Booking.objects.filter(
            hotel=hotel,
            check_in_date=today,
            status='confirmed'
        ).select_related('user', 'room'))

    def get_today_checkouts(self, hotel: Hotel) -> List[Booking]:
        """Get all bookings with check-out today."""
        today = date.today()
        return list(Booking.objects.filter(
            hotel=hotel,
            check_out_date=today,
            status='checked_in'
        ).select_related('user', 'room'))

    def get_current_occupancy(self, hotel: Hotel) -> Dict[str, Any]:
        """Get current occupancy statistics for a hotel."""
        total_rooms = Room.objects.filter(hotel=hotel, is_active=True).count()
        occupied_rooms = Booking.objects.filter(
            hotel=hotel,
            status='checked_in'
        ).count()

        occupancy_rate = (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0

        return {
            'total_rooms': total_rooms,
            'occupied_rooms': occupied_rooms,
            'available_rooms': total_rooms - occupied_rooms,
            'occupancy_rate': round(occupancy_rate, 1),
        }

    def get_booking_summary(
        self,
        hotel: Hotel,
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """Get booking summary for a date range."""
        bookings = Booking.objects.filter(
            hotel=hotel,
            check_in_date__gte=start_date,
            check_in_date__lte=end_date
        )

        total_bookings = bookings.count()
        confirmed_bookings = bookings.filter(status='confirmed').count()
        cancelled_bookings = bookings.filter(status='cancelled').count()
        completed_bookings = bookings.filter(status='completed').count()

        total_revenue = sum(
            float(b.total_price)
            for b in bookings.filter(status__in=['confirmed', 'checked_in', 'checked_out', 'completed'])
        )

        return {
            'total_bookings': total_bookings,
            'confirmed': confirmed_bookings,
            'cancelled': cancelled_bookings,
            'completed': completed_bookings,
            'total_revenue': round(total_revenue, 2),
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
        }
