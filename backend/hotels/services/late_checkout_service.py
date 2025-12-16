from datetime import date, time, datetime, timedelta
from typing import Optional, Dict, Any

from django.utils import timezone

from hotels.models import Hotel, LateCheckoutRequest
from bookings.models import Booking


class LateCheckoutService:
    """
    Service for managing late checkout requests.

    Provides functionality for:
    - Creating late checkout requests
    - Checking for conflicts with next bookings
    - Approving/rejecting requests
    """

    def check_next_booking_conflict(
        self,
        booking: Booking,
        requested_time: time
    ) -> Dict[str, Any]:
        """
        Check if requested late checkout conflicts with next booking.

        Args:
            booking: Current booking
            requested_time: Requested checkout time

        Returns:
            Dictionary with conflict information
        """
        # Find next booking for this room
        next_booking = Booking.objects.filter(
            room=booking.room,
            check_in_date=booking.check_out_date,
            status__in=['confirmed', 'pending']
        ).first()

        if not next_booking:
            return {
                'has_conflict': False,
                'next_booking': None,
                'message': 'No upcoming booking for this room'
            }

        # Get hotel's default check-in time
        hotel = booking.hotel
        default_checkin = hotel.default_checkin_time

        # Check if requested checkout time conflicts with next check-in
        has_conflict = requested_time > default_checkin

        return {
            'has_conflict': has_conflict,
            'next_booking': {
                'booking_reference': next_booking.booking_reference,
                'check_in_date': next_booking.check_in_date.isoformat(),
                'guest_name': next_booking.user.get_full_name() or next_booking.user.username,
            },
            'default_checkin_time': default_checkin.strftime('%H:%M'),
            'message': 'Conflicts with next booking check-in time' if has_conflict else 'No conflict'
        }

    def can_request_late_checkout(self, booking: Booking) -> Dict[str, Any]:
        """Check if a late checkout can be requested for this booking."""
        if booking.status not in ['confirmed', 'checked_in']:
            return {
                'allowed': False,
                'reason': f'Cannot request late checkout for booking with status: {booking.status}'
            }

        # Check if already has pending or approved request
        existing_request = LateCheckoutRequest.objects.filter(
            booking=booking,
            status__in=['pending', 'approved']
        ).first()

        if existing_request:
            return {
                'allowed': False,
                'reason': f'A late checkout request already exists with status: {existing_request.status}',
                'existing_request_id': existing_request.id
            }

        # Check if checkout date has passed
        if booking.check_out_date < date.today():
            return {
                'allowed': False,
                'reason': 'Checkout date has already passed'
            }

        return {
            'allowed': True,
            'max_checkout_time': booking.hotel.max_late_checkout_time.strftime('%H:%M'),
            'default_checkout_time': booking.hotel.default_checkout_time.strftime('%H:%M')
        }

    def create_request(
        self,
        booking: Booking,
        requested_time: time,
        guest_notes: str = ''
    ) -> Dict[str, Any]:
        """
        Create a late checkout request.

        Args:
            booking: Booking for which to request late checkout
            requested_time: Requested checkout time
            guest_notes: Optional notes from guest

        Returns:
            Dictionary with request information
        """
        # Check if request is allowed
        can_request = self.can_request_late_checkout(booking)
        if not can_request['allowed']:
            raise ValueError(can_request['reason'])

        # Validate requested time
        hotel = booking.hotel
        if requested_time > hotel.max_late_checkout_time:
            raise ValueError(
                f'Requested time exceeds maximum allowed late checkout time of '
                f'{hotel.max_late_checkout_time.strftime("%H:%M")}'
            )

        if requested_time <= hotel.default_checkout_time:
            raise ValueError('Requested time must be later than default checkout time')

        # Check for conflicts
        conflict_info = self.check_next_booking_conflict(booking, requested_time)

        # Create the request
        request = LateCheckoutRequest.objects.create(
            booking=booking,
            requested_checkout_time=requested_time,
            guest_notes=guest_notes,
            has_next_booking=conflict_info['next_booking'] is not None,
            next_booking_info=conflict_info['next_booking']
        )

        return {
            'request': request,
            'conflict_info': conflict_info,
            'success': True,
            'message': 'Late checkout request submitted successfully'
        }

    def approve(
        self,
        request: LateCheckoutRequest,
        staff_user,
        manager_notes: str = ''
    ) -> bool:
        """
        Approve a late checkout request.

        Args:
            request: LateCheckoutRequest to approve
            staff_user: Staff user approving the request
            manager_notes: Optional notes from manager

        Returns:
            True if successful
        """
        if request.status != 'pending':
            raise ValueError(f'Cannot approve request with status: {request.status}')

        request.status = 'approved'
        request.reviewed_by = staff_user
        request.reviewed_at = timezone.now()
        request.manager_notes = manager_notes
        request.save()

        return True

    def reject(
        self,
        request: LateCheckoutRequest,
        staff_user,
        reason: str = ''
    ) -> bool:
        """
        Reject a late checkout request.

        Args:
            request: LateCheckoutRequest to reject
            staff_user: Staff user rejecting the request
            reason: Reason for rejection

        Returns:
            True if successful
        """
        if request.status != 'pending':
            raise ValueError(f'Cannot reject request with status: {request.status}')

        request.status = 'rejected'
        request.reviewed_by = staff_user
        request.reviewed_at = timezone.now()
        request.manager_notes = reason
        request.save()

        return True

    def cancel(self, request: LateCheckoutRequest) -> bool:
        """Cancel a late checkout request (by guest)."""
        if request.status != 'pending':
            raise ValueError(f'Cannot cancel request with status: {request.status}')

        request.status = 'cancelled'
        request.save()

        return True

    def get_pending_requests(self, hotel: Hotel):
        """Get all pending late checkout requests for a hotel."""
        return LateCheckoutRequest.objects.filter(
            booking__hotel=hotel,
            status='pending'
        ).select_related('booking', 'booking__user', 'booking__room')

    def get_effective_checkout_time(self, booking: Booking) -> time:
        """Get the effective checkout time for a booking (considering approved late checkout)."""
        approved_request = LateCheckoutRequest.objects.filter(
            booking=booking,
            status='approved'
        ).first()

        if approved_request:
            return approved_request.requested_checkout_time

        return booking.hotel.default_checkout_time
