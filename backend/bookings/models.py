# Edited By
# -> Ahmed Looth Adam, UWE ID: 24050761

import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from core.fields import EncryptedCharField


class Order(models.Model):
    """
    Groups multiple bookings from a single checkout session.
    Allows guests to book rooms from different hotels in one transaction.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Payment'),
        ('confirmed', 'Confirmed'),
        ('partially_cancelled', 'Partially Cancelled'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    order_reference = models.CharField(max_length=20, unique=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='confirmed')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order {self.order_reference or self.id} - {self.user}"

    def save(self, *args, **kwargs):
        if not self.order_reference:
            self.order_reference = self.generate_order_reference()
        super().save(*args, **kwargs)

    @staticmethod
    def generate_order_reference():
        """Generate a unique order reference"""
        while True:
            reference = f"ORD-{uuid.uuid4().hex[:8].upper()}"
            if not Order.objects.filter(order_reference=reference).exists():
                return reference

    @property
    def booking_count(self):
        return self.bookings.count()

    @property
    def room_count(self):
        return sum(b.booking_rooms.count() for b in self.bookings.all())

    def update_total(self):
        """Recalculate total from all bookings"""
        total = sum(b.total_price for b in self.bookings.all())
        self.total_amount = total
        self.save(update_fields=['total_amount'])


class Booking(models.Model):
    STATUS_CHOICES = [
        ('confirmed', 'Confirmed'),
        ('checked_in', 'Checked In'),
        ('checked_out', 'Checked Out'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('paid', 'Paid'),
        ('partial', 'Partial'),
        ('refunded', 'Refunded'),
    ]

    ROOM_TYPE_CHOICES = [
        ('standard', 'Standard Double'),
        ('deluxe', 'Deluxe King'),
        ('suite', 'Family Suite'),
        ('penthouse', 'Penthouse'),
    ]

    # Core booking information
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='bookings', null=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    hotel = models.ForeignKey('hotels.Hotel', on_delete=models.CASCADE, related_name='bookings', null=True)
    room = models.ForeignKey('hotels.Room', on_delete=models.CASCADE, related_name='bookings', null=True, blank=True)
    room_type_requested = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES, blank=True)
    booking_reference = models.CharField(max_length=20, unique=True, blank=True)
    room_number = models.CharField(max_length=10, blank=True)  # Assigned at check-in by front desk

    # Dates
    check_in_date = models.DateField()
    check_out_date = models.DateField()

    # Guest information
    guests_count = models.PositiveIntegerField(default=1)
    actual_guests_checked_in = models.PositiveIntegerField(null=True, blank=True)
    number_of_rooms = models.PositiveIntegerField(default=1)

    # Status and payment
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='confirmed')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='paid')

    # Pricing
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    additional_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    promo_code = models.CharField(max_length=50, blank=True)

    # Special requests
    special_requests = models.TextField(blank=True)

    # Cancellation
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True)

    # Check-in operations
    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_in_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='checked_in_bookings'
    )
    check_in_notes = models.TextField(blank=True)

    # Check-out operations
    checked_out_at = models.DateTimeField(null=True, blank=True)
    checked_out_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='checked_out_bookings'
    )
    check_out_notes = models.TextField(blank=True)
    room_condition = models.CharField(max_length=50, blank=True)

    # No-show operations
    no_show_at = models.DateTimeField(null=True, blank=True)
    no_show_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='no_show_bookings'
    )
    no_show_notes = models.TextField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Booking {self.booking_reference or self.id} - {self.user} ({self.status})"

    def save(self, *args, **kwargs):
        if not self.booking_reference:
            self.booking_reference = self.generate_booking_reference()
        super().save(*args, **kwargs)

    @staticmethod
    def generate_booking_reference():
        """Generate a unique booking reference"""
        while True:
            reference = f"BK-{uuid.uuid4().hex[:8].upper()}"
            if not Booking.objects.filter(booking_reference=reference).exists():
                return reference

    @property
    def number_of_nights(self):
        """Calculate the number of nights for this booking"""
        return (self.check_out_date - self.check_in_date).days

    def is_active(self):
        return self.status == 'confirmed'

    def is_cancelled(self):
        return self.status == 'cancelled'

    def is_checked_in(self):
        return self.status == 'checked_in'

    def is_checked_out(self):
        return self.status == 'checked_out'

    def can_check_in(self):
        """Check if booking can be checked in"""
        from datetime import date
        return (
            self.status == 'confirmed' and
            self.check_in_date == date.today()
        )

    def can_check_out(self):
        """Check if booking can be checked out"""
        return self.status == 'checked_in'

    def check_in(self, staff_user, notes=None, actual_guests=None):
        """Process check-in for this booking"""
        self.status = 'checked_in'
        self.checked_in_at = timezone.now()
        self.checked_in_by = staff_user
        if notes:
            self.check_in_notes = notes
        if actual_guests:
            self.actual_guests_checked_in = actual_guests
        self.save()
        return True

    def check_out(self, staff_user, notes=None, room_condition=None):
        """Process check-out for this booking"""
        self.status = 'checked_out'
        self.checked_out_at = timezone.now()
        self.checked_out_by = staff_user
        if notes:
            self.check_out_notes = notes
        if room_condition:
            self.room_condition = room_condition
        self.save()
        return True

    def cancel(self, reason=None):
        """Cancel this booking"""
        self.status = 'cancelled'
        self.cancelled_at = timezone.now()
        if reason:
            self.cancellation_reason = reason
        self.save()
        return True

    def can_reassign_room(self):
        """Check if room can be reassigned"""
        return self.status in ['confirmed', 'checked_in'] and not self.is_checked_out()

    def reassign_room(self, new_room, staff_user, reason):
        """Reassign booking to a new room"""
        if not self.can_reassign_room():
            return False

        # Create reassignment record
        RoomReassignment.objects.create(
            booking=self,
            old_room=self.room,
            new_room=new_room,
            reassigned_by=staff_user,
            reason=reason
        )

        # Update booking
        self.room = new_room
        self.room_number = new_room.room_number
        self.save()
        return True


class BookingGuest(models.Model):
    """Additional guests on a booking"""
    GUEST_TYPE_CHOICES = [
        ('primary', 'Primary'),
        ('additional', 'Additional'),
    ]

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='booking_guests')
    guest_type = models.CharField(max_length=20, choices=GUEST_TYPE_CHOICES, default='additional')
    full_name = models.CharField(max_length=200)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    nationality = models.CharField(max_length=100, blank=True)
    id_type = models.CharField(max_length=50, blank=True)  # Passport, ID Card, etc.
    id_number = EncryptedCharField(max_length=255, blank=True)  # Encrypted passport/ID number
    relationship_to_primary = models.CharField(max_length=100, blank=True)
    special_requirements = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['guest_type', 'full_name']

    def __str__(self):
        return f"{self.full_name} ({self.guest_type}) - Booking {self.booking.booking_reference}"


class CheckInRecord(models.Model):
    """Guest check-in records with passport/ID verification details"""
    GUEST_TYPE_CHOICES = [
        ('primary', 'Primary Guest'),
        ('additional', 'Additional Guest'),
    ]

    ID_TYPE_CHOICES = [
        ('passport', 'Passport'),
        ('national_id', 'National ID'),
        ('drivers_license', 'Driver\'s License'),
        ('other', 'Other'),
    ]

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='check_in_records')
    guest_type = models.CharField(max_length=20, choices=GUEST_TYPE_CHOICES, default='primary')

    # Personal details (as verified from passport/ID at front desk)
    full_name = models.CharField(max_length=200, help_text="Full name as on passport/ID")
    date_of_birth = models.DateField()
    nationality = models.CharField(max_length=100)

    # ID/Passport details
    id_type = models.CharField(max_length=20, choices=ID_TYPE_CHOICES, default='passport')
    id_number = EncryptedCharField(max_length=255)  # Encrypted passport/ID number
    id_expiry_date = models.DateField(null=True, blank=True)

    # Address as on ID document
    address = models.TextField(help_text="Address as shown on passport/ID")

    # Contact (optional, for during stay)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)

    # Verification details
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='verified_check_ins'
    )
    verified_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['guest_type', 'full_name']

    def __str__(self):
        return f"{self.full_name} ({self.guest_type}) - Booking {self.booking.booking_reference}"


class BookingRoom(models.Model):
    """
    Intermediate model to support multiple rooms per booking.
    Each BookingRoom represents one room in a multi-room booking.
    Now includes its own dates and ancillary services for flexibility.
    """
    ANCILLARY_SERVICE_CHOICES = [
        ('airport_transfer', 'Airport Transfer (One-way)'),
        ('breakfast', 'Full English Breakfast'),
        ('spa', 'Spa Access'),
        ('late_checkout', 'Late Check-out (until 2 PM)'),
    ]

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='booking_rooms')
    room = models.ForeignKey('hotels.Room', on_delete=models.CASCADE, related_name='booking_room_entries')
    room_type_category = models.CharField(max_length=20, blank=True)  # Snapshot of room type
    guests_count = models.PositiveIntegerField(default=2)  # Guests for this specific room

    # Room-specific dates (allows different check-in/out dates per room)
    check_in_date = models.DateField(null=True, blank=True)
    check_out_date = models.DateField(null=True, blank=True)

    # Pricing
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    services_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Ancillary services for this specific room (stored as JSON list)
    ancillary_services = models.JSONField(default=list, blank=True)

    special_requests = models.TextField(blank=True)  # Room-specific requests

    # Check-in/out status for this specific room
    is_checked_in = models.BooleanField(default=False)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    is_checked_out = models.BooleanField(default=False)
    checked_out_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        unique_together = ['booking', 'room']  # Prevent duplicate room in same booking

    def __str__(self):
        return f"Room {self.room.room_number} in Booking {self.booking.booking_reference}"

    @property
    def number_of_nights(self):
        """Calculate nights for this room"""
        if self.check_in_date and self.check_out_date:
            return (self.check_out_date - self.check_in_date).days
        # Fall back to booking dates
        if self.booking:
            return self.booking.number_of_nights
        return 0

    def save(self, *args, **kwargs):
        if not self.room_type_category and self.room:
            self.room_type_category = self.room.room_type.category if self.room.room_type else ''
        if not self.price_per_night and self.room:
            self.price_per_night = self.room.price_per_night
        # Use booking dates as defaults if room dates not set
        if self.booking and not self.check_in_date:
            self.check_in_date = self.booking.check_in_date
        if self.booking and not self.check_out_date:
            self.check_out_date = self.booking.check_out_date
        super().save(*args, **kwargs)


class RoomReassignment(models.Model):
    """Track room changes/reassignments"""
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='room_reassignments')
    old_room = models.ForeignKey('hotels.Room', on_delete=models.SET_NULL, null=True, related_name='old_reassignments')
    new_room = models.ForeignKey('hotels.Room', on_delete=models.SET_NULL, null=True, related_name='new_reassignments')
    reassigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='room_reassignments'
    )
    reason = models.TextField()
    reassigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-reassigned_at']

    def __str__(self):
        old_num = self.old_room.room_number if self.old_room else 'N/A'
        new_num = self.new_room.room_number if self.new_room else 'N/A'
        return f"Reassignment: {old_num} -> {new_num} for Booking {self.booking.booking_reference}"
