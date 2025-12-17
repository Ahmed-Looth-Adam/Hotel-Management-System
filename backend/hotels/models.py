from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Hotel(models.Model):
    """Hotel location/property"""
    name = models.CharField(max_length=200)
    location = models.CharField(max_length=100)
    address = models.TextField()
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    star_rating = models.IntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)])
    room_capacity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    # Manager assignment
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_hotels'
    )

    # Check-in/Check-out times
    default_checkin_time = models.TimeField(default='14:00:00')
    default_checkout_time = models.TimeField(default='12:00:00')
    max_late_checkout_time = models.TimeField(default='18:00:00')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - {self.city}"


class RoomView(models.Model):
    """Room view types (Ocean, Garden, Beach, City, Mountain)"""
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='room_views')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        unique_together = ['hotel', 'name']

    def __str__(self):
        return f"{self.name} - {self.hotel.name}"


class Gallery(models.Model):
    """Image galleries for hotels and rooms"""
    TYPE_CHOICES = [
        ('hotel', 'Hotel'),
        ('room', 'Room'),
    ]

    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='galleries')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    gallery_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'galleries'

    def __str__(self):
        return f"{self.name} ({self.gallery_type})"


class GalleryImage(models.Model):
    """Individual images in galleries"""
    gallery = models.ForeignKey(Gallery, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='galleries/')
    alt_text = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['sort_order', 'created_at']

    def __str__(self):
        return f"Image {self.id} - {self.gallery.name}"


class RoomType(models.Model):
    """Room type/category"""
    name = models.CharField(max_length=100)
    capacity = models.IntegerField()
    description = models.TextField(blank=True)
    amenities = models.JSONField(default=list)  # List of amenities

    def __str__(self):
        return f"{self.name} (Capacity: {self.capacity})"


class Room(models.Model):
    """Individual room"""
    ROOM_TYPE_CHOICES = [
        ('standard', 'Standard'),
        ('superior', 'Superior'),
        ('deluxe', 'Deluxe'),
        ('suite', 'Suite'),
        ('family', 'Family'),
    ]

    BED_SIZE_CHOICES = [
        ('king', 'King'),
        ('queen', 'Queen'),
        ('twin', 'Twin'),
    ]

    STATUS_CHOICES = [
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('cleaning', 'Cleaning'),
        ('out_of_service', 'Out of Service'),
    ]

    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='rooms')
    room_type = models.ForeignKey(RoomType, on_delete=models.PROTECT, related_name='rooms')
    room_number = models.CharField(max_length=10)
    floor = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')

    # Room configuration
    room_type_category = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES, default='standard')
    bed_size = models.CharField(max_length=20, choices=BED_SIZE_CHOICES, default='queen')
    bed_count = models.PositiveIntegerField(default=1)
    max_occupancy = models.PositiveIntegerField(default=2)

    # View and gallery
    view = models.ForeignKey(RoomView, on_delete=models.SET_NULL, null=True, blank=True, related_name='rooms')
    gallery = models.ForeignKey(Gallery, on_delete=models.SET_NULL, null=True, blank=True, related_name='rooms')

    # Availability flags
    is_available = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['hotel', 'floor', 'room_number']
        unique_together = ['hotel', 'room_number']

    def __str__(self):
        return f"{self.hotel.name} - Room {self.room_number}"

    def is_available_for_dates(self, check_in, check_out, exclude_booking_id=None):
        """Check if room is available for the given date range"""
        if not self.is_active or not self.is_available:
            return False

        from bookings.models import Booking

        query = Booking.objects.filter(
            room=self,
            status='confirmed'
        ).filter(
            check_in_date__lt=check_out,
            check_out_date__gt=check_in
        )

        if exclude_booking_id:
            query = query.exclude(id=exclude_booking_id)

        return not query.exists()


class AmenityCategory(models.Model):
    """Amenity groups (Bathroom, Electronics, Comfort, etc.)"""
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='amenity_categories')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['sort_order', 'name']
        unique_together = ['hotel', 'name']
        verbose_name_plural = 'amenity categories'

    def __str__(self):
        return f"{self.name} - {self.hotel.name}"


class Amenity(models.Model):
    """Individual amenities (Shower, Minibar, Safe, etc.)"""
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='amenities')
    category = models.ForeignKey(AmenityCategory, on_delete=models.CASCADE, related_name='amenities')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)  # Icon name or class
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['sort_order', 'name']
        unique_together = ['hotel', 'name']
        verbose_name_plural = 'amenities'

    def __str__(self):
        return f"{self.name} ({self.category.name})"


class RoomAmenity(models.Model):
    """Pivot table for Room-Amenity relationship"""
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='room_amenities')
    amenity = models.ForeignKey(Amenity, on_delete=models.CASCADE, related_name='room_assignments')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['room', 'amenity']
        verbose_name_plural = 'room amenities'

    def __str__(self):
        return f"{self.room} - {self.amenity.name}"


class RoomRate(models.Model):
    """Pricing for room types (legacy - keeping for compatibility)"""
    SEASON_CHOICES = [
        ('off_peak', 'Off-Peak'),
        ('peak', 'Peak Season'),
    ]

    room_type = models.ForeignKey(RoomType, on_delete=models.CASCADE, related_name='rates')
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='rates')
    season_type = models.CharField(max_length=20, choices=SEASON_CHOICES)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    valid_from = models.DateField()
    valid_to = models.DateField()

    class Meta:
        ordering = ['hotel', 'room_type', 'valid_from']

    def __str__(self):
        return f"{self.room_type.name} - {self.hotel.name} - £{self.price_per_night} ({self.season_type})"


class RoomTypePricing(models.Model):
    """Base pricing per room type category with off-peak and peak prices"""
    ROOM_TYPE_CHOICES = [
        ('standard', 'Standard Double'),
        ('deluxe', 'Deluxe King'),
        ('suite', 'Family Suite'),
        ('family', 'Penthouse'),
    ]

    # Default prices from coursework specification (GBP)
    DEFAULT_PRICES = {
        'standard': {'off_peak': 120, 'peak': 180},
        'deluxe': {'off_peak': 180, 'peak': 250},
        'suite': {'off_peak': 240, 'peak': 320},
        'family': {'off_peak': 500, 'peak': 750},
    }

    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='room_type_pricing')
    room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES)
    off_peak_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Price per night during off-peak season")
    peak_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Price per night during peak season")
    currency = models.CharField(max_length=3, default='GBP')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['hotel', 'room_type']
        verbose_name_plural = 'room type pricing'

    def __str__(self):
        return f"{self.get_room_type_display()} - {self.hotel.name} - {self.currency} {self.off_peak_price}/{self.peak_price}"

    def get_price_for_date(self, date, hotel_seasonal_pricing=None):
        """Get the appropriate price based on whether the date falls in peak season"""
        if hotel_seasonal_pricing:
            for season in hotel_seasonal_pricing:
                if season.is_active and season.is_peak_season and season.is_date_in_range(date):
                    return self.peak_price
        return self.off_peak_price

    @classmethod
    def create_default_pricing(cls, hotel):
        """Create default pricing entries for a hotel"""
        for room_type, prices in cls.DEFAULT_PRICES.items():
            cls.objects.get_or_create(
                hotel=hotel,
                room_type=room_type,
                defaults={
                    'off_peak_price': prices['off_peak'],
                    'peak_price': prices['peak'],
                    'currency': 'GBP',
                    'is_active': True,
                }
            )


class ViewPricing(models.Model):
    """Price modifiers based on room view"""
    MODIFIER_TYPE_CHOICES = [
        ('fixed', 'Fixed Amount'),
        ('percentage', 'Percentage'),
    ]

    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='view_pricing')
    view = models.ForeignKey(RoomView, on_delete=models.CASCADE, related_name='pricing')
    modifier_type = models.CharField(max_length=20, choices=MODIFIER_TYPE_CHOICES)
    modifier_value = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['hotel', 'view']
        verbose_name_plural = 'view pricing'

    def __str__(self):
        modifier = f"+{self.modifier_value}%" if self.modifier_type == 'percentage' else f"+{self.modifier_value}"
        return f"{self.view.name} ({modifier})"

    def apply_modifier(self, base_price):
        """Apply the modifier to a base price"""
        if self.modifier_type == 'fixed':
            return base_price + float(self.modifier_value)
        # Percentage
        return base_price * (1 + float(self.modifier_value) / 100)


class SeasonalPricing(models.Model):
    """Date-range based season definitions (Peak/Off-Peak)"""
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='seasonal_pricing')
    season_name = models.CharField(max_length=100, help_text="e.g., 'Summer Peak', 'Christmas Peak', 'Winter Off-Peak'")
    start_date = models.DateField()
    end_date = models.DateField()
    is_peak_season = models.BooleanField(default=False, help_text="If true, peak prices apply during this period")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_date']
        verbose_name_plural = 'seasonal pricing'

    def __str__(self):
        season_type = "Peak" if self.is_peak_season else "Off-Peak"
        return f"{self.season_name} ({season_type}: {self.start_date} to {self.end_date})"

    def is_date_in_range(self, date):
        """Check if a date falls within this seasonal period"""
        return self.start_date <= date <= self.end_date


class DayTypePricing(models.Model):
    """Day-of-week pricing adjustments (weekday/weekend rates)"""
    MODIFIER_TYPE_CHOICES = [
        ('fixed', 'Fixed Amount'),
        ('percentage', 'Percentage'),
    ]

    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='day_type_pricing')
    day_type_name = models.CharField(max_length=100)  # Weekend, Weekday
    applicable_days = models.JSONField()  # List of day numbers: 0=Mon, 6=Sun
    modifier_type = models.CharField(max_length=20, choices=MODIFIER_TYPE_CHOICES)
    modifier_value = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['day_type_name']
        verbose_name_plural = 'day type pricing'

    def __str__(self):
        return f"{self.day_type_name} - {self.hotel.name}"

    def applies_to_date(self, date):
        """Check if this day type applies to the given date"""
        return date.weekday() in self.applicable_days

    def apply_modifier(self, base_price):
        """Apply the modifier to a base price"""
        if self.modifier_type == 'fixed':
            return base_price + float(self.modifier_value)
        # Percentage
        return base_price * (1 + float(self.modifier_value) / 100)


class PromotionalDiscount(models.Model):
    """Flexible promotional campaigns with multiple conditions"""
    DISCOUNT_TYPE_CHOICES = [
        ('fixed', 'Fixed Amount'),
        ('percentage', 'Percentage'),
    ]

    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='promotional_discounts')
    promotion_name = models.CharField(max_length=200)
    promotion_description = models.TextField(blank=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)

    # Validity period
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    # Conditions
    minimum_rooms = models.PositiveIntegerField(null=True, blank=True)
    maximum_rooms = models.PositiveIntegerField(null=True, blank=True)
    minimum_nights = models.PositiveIntegerField(null=True, blank=True)
    maximum_nights = models.PositiveIntegerField(null=True, blank=True)
    booking_advance_days = models.PositiveIntegerField(null=True, blank=True)  # Early bird
    applicable_room_types = models.JSONField(null=True, blank=True)  # List of room types
    promo_code = models.CharField(max_length=50, null=True, blank=True)

    priority = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-priority', 'promotion_name']

    def __str__(self):
        return f"{self.promotion_name} - {self.hotel.name}"

    def is_currently_valid(self):
        """Check if this promotion is currently valid (date-wise)"""
        from datetime import date
        today = date.today()

        if self.start_date and today < self.start_date:
            return False
        if self.end_date and today > self.end_date:
            return False
        return True

    def applies_to(self, number_of_rooms, number_of_nights, room_type, check_in_date, booking_advance_days=None):
        """Check if this promotion applies to a specific booking"""
        if not self.is_active or not self.is_currently_valid():
            return False

        # Check room conditions
        if self.minimum_rooms is not None and number_of_rooms < self.minimum_rooms:
            return False
        if self.maximum_rooms is not None and number_of_rooms > self.maximum_rooms:
            return False

        # Check night conditions
        if self.minimum_nights is not None and number_of_nights < self.minimum_nights:
            return False
        if self.maximum_nights is not None and number_of_nights > self.maximum_nights:
            return False

        # Check room type restrictions
        if self.applicable_room_types and room_type not in self.applicable_room_types:
            return False

        # Check booking advance days (early bird)
        if self.booking_advance_days is not None and booking_advance_days is not None:
            if booking_advance_days < self.booking_advance_days:
                return False

        return True

    def apply_discount(self, total_price):
        """Apply the discount to a total price"""
        if self.discount_type == 'fixed':
            return max(0, float(total_price) - float(self.discount_value))
        # Percentage
        return float(total_price) * (1 - float(self.discount_value) / 100)

    def calculate_discount_amount(self, total_price):
        """Calculate the discount amount"""
        if self.discount_type == 'fixed':
            return min(float(self.discount_value), float(total_price))
        # Percentage
        return float(total_price) * float(self.discount_value) / 100


class HotelPolicy(models.Model):
    """Hotel policies (cancellation, check-in/out, house rules, etc.)"""
    POLICY_TYPE_CHOICES = [
        ('cancellation', 'Cancellation Policy'),
        ('check_in_out', 'Check-in/Check-out Policy'),
        ('payment', 'Payment Policy'),
        ('house_rules', 'House Rules'),
        ('age_restriction', 'Age Restriction Policy'),
        ('damage_deposit', 'Damage & Deposit Policy'),
        ('special_requests', 'Special Requests Policy'),
    ]

    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='policies')
    policy_type = models.CharField(max_length=50, choices=POLICY_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['policy_type', 'title']
        verbose_name_plural = 'hotel policies'

    def __str__(self):
        return f"{self.title} - {self.hotel.name}"


class AncillaryService(models.Model):
    """Additional services available at the hotel (airport transfer, breakfast, spa, etc.)"""
    SERVICE_TYPE_CHOICES = [
        ('airport_transfer', 'Airport Transfer'),
        ('breakfast', 'Breakfast'),
        ('spa', 'Spa Access'),
        ('late_checkout', 'Late Checkout'),
        ('parking', 'Parking'),
        ('minibar', 'Minibar'),
        ('laundry', 'Laundry'),
        ('room_service', 'Room Service'),
        ('other', 'Other'),
    ]

    PRICING_TYPE_CHOICES = [
        ('per_booking', 'Per Booking'),
        ('per_person', 'Per Person'),
        ('per_person_per_day', 'Per Person Per Day'),
        ('per_day', 'Per Day'),
        ('one_time', 'One Time'),
    ]

    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='ancillary_services')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    service_type = models.CharField(max_length=50, choices=SERVICE_TYPE_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='GBP')
    pricing_type = models.CharField(max_length=30, choices=PRICING_TYPE_CHOICES, default='one_time')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['service_type', 'name']
        verbose_name_plural = 'ancillary services'

    def __str__(self):
        return f"{self.name} - {self.hotel.name} ({self.currency} {self.price})"

    def calculate_charge(self, quantity=1, days=1, persons=1):
        """Calculate the total charge based on pricing type"""
        base_price = float(self.price)
        if self.pricing_type == 'per_booking':
            return base_price
        elif self.pricing_type == 'per_person':
            return base_price * persons
        elif self.pricing_type == 'per_person_per_day':
            return base_price * persons * days
        elif self.pricing_type == 'per_day':
            return base_price * days
        else:  # one_time
            return base_price * quantity


class LateCheckoutRequest(models.Model):
    """Late checkout management"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]

    booking = models.ForeignKey('bookings.Booking', on_delete=models.CASCADE, related_name='late_checkout_requests')
    requested_checkout_time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    guest_notes = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_late_checkouts'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    manager_notes = models.TextField(blank=True)
    has_next_booking = models.BooleanField(default=False)
    next_booking_info = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Late checkout request - {self.booking} - {self.status}"
