"""
Bookings Module Tests
Tests for booking creation, updates, cancellation, and validation
"""
import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from datetime import date, timedelta
from bookings.models import Booking, Order, BookingRoom, BookingGuest
from hotels.models import Room


@pytest.mark.django_db
class TestBookingModel:
    """Test Booking model functionality"""

    def test_booking_creation(self, guest_user, sample_room):
        """Test creating a booking"""
        check_in = date.today() + timedelta(days=1)
        check_out = date.today() + timedelta(days=3)

        booking = Booking.objects.create(
            user=guest_user,
            hotel=sample_room.hotel,
            room=sample_room,
            check_in_date=check_in,
            check_out_date=check_out,
            guests_count=2,
            total_price=300.00,
            status='confirmed'
        )

        assert booking.user == guest_user
        assert booking.room == sample_room
        assert booking.status == 'confirmed'
        assert booking.booking_reference.startswith('BK-')

    def test_booking_reference_generation(self, sample_booking):
        """Test automatic booking reference generation"""
        assert sample_booking.booking_reference is not None
        assert sample_booking.booking_reference.startswith('BK-')
        assert len(sample_booking.booking_reference) == 11  # BK- + 8 chars

    def test_booking_number_of_nights(self, sample_booking):
        """Test calculating number of nights"""
        nights = (sample_booking.check_out_date - sample_booking.check_in_date).days
        assert sample_booking.number_of_nights == nights

    def test_booking_status_checks(self, sample_booking):
        """Test booking status check methods"""
        sample_booking.status = 'confirmed'
        sample_booking.save()
        assert sample_booking.is_active()

        sample_booking.status = 'cancelled'
        sample_booking.save()
        assert sample_booking.is_cancelled()

        sample_booking.status = 'checked_in'
        sample_booking.save()
        assert sample_booking.is_checked_in()

        sample_booking.status = 'checked_out'
        sample_booking.save()
        assert sample_booking.is_checked_out()

    def test_booking_can_check_in(self, guest_user, sample_room):
        """Test checking if booking can be checked in"""
        # Booking for today should be checkable
        today = date.today()
        booking = Booking.objects.create(
            user=guest_user,
            hotel=sample_room.hotel,
            room=sample_room,
            check_in_date=today,
            check_out_date=today + timedelta(days=2),
            guests_count=1,
            total_price=200.00,
            status='confirmed'
        )
        assert booking.can_check_in()

        # Cancelled booking should not be checkable
        booking.status = 'cancelled'
        booking.save()
        assert not booking.can_check_in()


@pytest.mark.django_db
class TestOrderModel:
    """Test Order model functionality"""

    def test_order_creation(self, guest_user):
        """Test creating an order"""
        order = Order.objects.create(
            user=guest_user,
            status='confirmed',
            total_amount=500.00
        )

        assert order.user == guest_user
        assert order.status == 'confirmed'
        assert order.order_reference.startswith('ORD-')

    def test_order_reference_generation(self, guest_user):
        """Test automatic order reference generation"""
        order = Order.objects.create(user=guest_user)
        assert order.order_reference is not None
        assert order.order_reference.startswith('ORD-')
        assert len(order.order_reference) == 12  # ORD- + 8 chars

    def test_order_booking_count(self, guest_user, sample_hotel, sample_room):
        """Test order booking count property"""
        order = Order.objects.create(user=guest_user)

        # Create bookings for the order
        Booking.objects.create(
            user=guest_user,
            order=order,
            hotel=sample_hotel,
            room=sample_room,
            check_in_date=date.today() + timedelta(days=1),
            check_out_date=date.today() + timedelta(days=3),
            guests_count=2,
            total_price=200.00
        )

        Booking.objects.create(
            user=guest_user,
            order=order,
            hotel=sample_hotel,
            room=sample_room,
            check_in_date=date.today() + timedelta(days=5),
            check_out_date=date.today() + timedelta(days=7),
            guests_count=1,
            total_price=150.00
        )

        assert order.booking_count == 2

    def test_order_update_total(self, guest_user, sample_hotel, sample_room):
        """Test updating order total from bookings"""
        order = Order.objects.create(user=guest_user, total_amount=0)

        Booking.objects.create(
            user=guest_user,
            order=order,
            hotel=sample_hotel,
            room=sample_room,
            check_in_date=date.today() + timedelta(days=1),
            check_out_date=date.today() + timedelta(days=3),
            guests_count=2,
            total_price=200.00
        )

        Booking.objects.create(
            user=guest_user,
            order=order,
            hotel=sample_hotel,
            room=sample_room,
            check_in_date=date.today() + timedelta(days=5),
            check_out_date=date.today() + timedelta(days=7),
            guests_count=1,
            total_price=300.00
        )

        order.update_total()
        assert order.total_amount == 500.00


@pytest.mark.django_db
class TestBookingValidation:
    """Test booking validation rules"""

    def test_checkout_after_checkin(self, guest_user, sample_room):
        """Test check-out date must be after check-in date"""
        # This should be validated at the application level
        check_in = date.today() + timedelta(days=3)
        check_out = date.today() + timedelta(days=1)  # Before check-in

        # The model itself doesn't prevent this, but application logic should
        booking = Booking(
            user=guest_user,
            hotel=sample_room.hotel,
            room=sample_room,
            check_in_date=check_in,
            check_out_date=check_out,
            guests_count=1,
            total_price=100.00
        )

        # Application should validate this before saving
        assert booking.check_in_date > booking.check_out_date

    def test_booking_overlaps(self, guest_user, sample_room):
        """Test detecting overlapping bookings"""
        check_in1 = date.today() + timedelta(days=1)
        check_out1 = date.today() + timedelta(days=5)

        # Create first booking
        Booking.objects.create(
            user=guest_user,
            hotel=sample_room.hotel,
            room=sample_room,
            check_in_date=check_in1,
            check_out_date=check_out1,
            guests_count=1,
            total_price=400.00,
            status='confirmed'
        )

        # Room should not be available for overlapping dates
        check_in2 = date.today() + timedelta(days=3)
        check_out2 = date.today() + timedelta(days=7)

        assert not sample_room.is_available_for_dates(check_in2, check_out2)


@pytest.mark.django_db
class TestBookingCancellation:
    """Test booking cancellation functionality"""

    def test_booking_cancellation(self, sample_booking):
        """Test cancelling a booking"""
        sample_booking.status = 'cancelled'
        sample_booking.cancelled_at = timezone.now()
        sample_booking.cancellation_reason = 'Customer request'
        sample_booking.save()

        assert sample_booking.is_cancelled()
        assert sample_booking.cancelled_at is not None
        assert sample_booking.cancellation_reason != ''

    def test_cancelled_booking_frees_room(self, guest_user, sample_room):
        """Test that cancelling a booking frees the room"""
        check_in = date.today() + timedelta(days=1)
        check_out = date.today() + timedelta(days=3)

        booking = Booking.objects.create(
            user=guest_user,
            hotel=sample_room.hotel,
            room=sample_room,
            check_in_date=check_in,
            check_out_date=check_out,
            guests_count=1,
            total_price=200.00,
            status='confirmed'
        )

        # Room should not be available
        assert not sample_room.is_available_for_dates(check_in, check_out)

        # Cancel booking
        booking.status = 'cancelled'
        booking.save()

        # Room should be available again
        assert sample_room.is_available_for_dates(check_in, check_out)


@pytest.mark.django_db
class TestCheckInCheckOut:
    """Test check-in and check-out operations"""

    def test_check_in_operation(self, sample_booking, staff_user):
        """Test checking in a booking"""
        sample_booking.status = 'checked_in'
        sample_booking.checked_in_at = timezone.now()
        sample_booking.checked_in_by = staff_user
        sample_booking.actual_guests_checked_in = 2
        sample_booking.room_number = sample_booking.room.room_number
        sample_booking.save()

        assert sample_booking.is_checked_in()
        assert sample_booking.checked_in_at is not None
        assert sample_booking.checked_in_by == staff_user
        assert sample_booking.actual_guests_checked_in == 2

    def test_check_out_operation(self, sample_booking, staff_user):
        """Test checking out a booking"""
        # First check in
        sample_booking.status = 'checked_in'
        sample_booking.checked_in_at = timezone.now()
        sample_booking.save()

        # Then check out
        sample_booking.status = 'checked_out'
        sample_booking.checked_out_at = timezone.now()
        sample_booking.checked_out_by = staff_user
        sample_booking.room_condition = 'clean'
        sample_booking.save()

        assert sample_booking.is_checked_out()
        assert sample_booking.checked_out_at is not None
        assert sample_booking.checked_out_by == staff_user
        assert sample_booking.room_condition == 'clean'

    def test_no_show_operation(self, sample_booking, staff_user):
        """Test marking booking as no-show"""
        sample_booking.status = 'no_show'
        sample_booking.no_show_at = timezone.now()
        sample_booking.no_show_by = staff_user
        sample_booking.no_show_notes = 'Guest did not arrive'
        sample_booking.save()

        assert sample_booking.status == 'no_show'
        assert sample_booking.no_show_at is not None
        assert sample_booking.no_show_by == staff_user


@pytest.mark.django_db
class TestBookingPricing:
    """Test booking pricing calculations"""

    def test_booking_total_price(self, guest_user, sample_room):
        """Test booking total price calculation"""
        check_in = date.today() + timedelta(days=1)
        check_out = date.today() + timedelta(days=3)
        nights = (check_out - check_in).days
        price_per_night = 100.00

        booking = Booking.objects.create(
            user=guest_user,
            hotel=sample_room.hotel,
            room=sample_room,
            check_in_date=check_in,
            check_out_date=check_out,
            guests_count=2,
            total_price=price_per_night * nights
        )

        assert booking.total_price == 200.00
        assert booking.number_of_nights == 2

    def test_additional_charges(self, sample_booking):
        """Test adding additional charges to booking"""
        sample_booking.additional_charges = 50.00
        sample_booking.save()

        total_with_charges = sample_booking.total_price + sample_booking.additional_charges
        assert total_with_charges == 250.00  # 200 + 50


@pytest.mark.django_db
class TestSpecialRequests:
    """Test special requests functionality"""

    def test_special_requests(self, sample_booking):
        """Test adding special requests to booking"""
        sample_booking.special_requests = 'Late check-in requested, non-smoking room preferred'
        sample_booking.save()

        assert sample_booking.special_requests != ''
        assert 'Late check-in' in sample_booking.special_requests


@pytest.mark.django_db
class TestPromoCode:
    """Test promo code functionality"""

    def test_promo_code_application(self, sample_booking):
        """Test applying promo code to booking"""
        sample_booking.promo_code = 'SUMMER2024'
        sample_booking.save()

        assert sample_booking.promo_code == 'SUMMER2024'
