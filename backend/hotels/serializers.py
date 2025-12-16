from rest_framework import serializers
from .models import (
    Hotel, Room, RoomType, RoomView, RoomRate,
    AmenityCategory, Amenity, RoomAmenity,
    RoomTypePricing, ViewPricing, SeasonalPricing, DayTypePricing,
    PromotionalDiscount, HotelPolicy, Gallery, GalleryImage,
    LateCheckoutRequest
)


# ============== Hotel Serializers ==============

class HotelListSerializer(serializers.ModelSerializer):
    """Serializer for hotel list view"""
    room_count = serializers.SerializerMethodField()

    class Meta:
        model = Hotel
        fields = [
            'id', 'name', 'location', 'city', 'country',
            'star_rating', 'is_active', 'room_count'
        ]

    def get_room_count(self, obj):
        return obj.rooms.filter(is_active=True).count()


class HotelDetailSerializer(serializers.ModelSerializer):
    """Serializer for hotel detail view"""
    manager_name = serializers.SerializerMethodField()

    class Meta:
        model = Hotel
        fields = [
            'id', 'name', 'location', 'address', 'city', 'country',
            'description', 'star_rating', 'room_capacity', 'is_active',
            'manager', 'manager_name',
            'default_checkin_time', 'default_checkout_time', 'max_late_checkout_time',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_manager_name(self, obj):
        if obj.manager:
            return obj.manager.get_full_name() or obj.manager.username
        return None


class HotelSerializer(serializers.ModelSerializer):
    """Default hotel serializer"""
    class Meta:
        model = Hotel
        fields = '__all__'


# ============== Room View Serializers ==============

class RoomViewSerializer(serializers.ModelSerializer):
    """Serializer for room views"""
    class Meta:
        model = RoomView
        fields = ['id', 'hotel', 'name', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


# ============== Gallery Serializers ==============

class GalleryImageSerializer(serializers.ModelSerializer):
    """Serializer for gallery images"""
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = GalleryImage
        fields = ['id', 'gallery', 'image', 'image_url', 'alt_text', 'is_primary', 'sort_order', 'created_at']
        read_only_fields = ['created_at']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class GallerySerializer(serializers.ModelSerializer):
    """Serializer for galleries"""
    images = GalleryImageSerializer(many=True, read_only=True)
    image_count = serializers.SerializerMethodField()

    class Meta:
        model = Gallery
        fields = ['id', 'hotel', 'name', 'description', 'gallery_type', 'images', 'image_count', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_image_count(self, obj):
        return obj.images.count()


# ============== Room Type Serializers ==============

class RoomTypeSerializer(serializers.ModelSerializer):
    """Serializer for room types"""
    class Meta:
        model = RoomType
        fields = ['id', 'name', 'capacity', 'description', 'amenities']


# ============== Room Serializers ==============

class RoomListSerializer(serializers.ModelSerializer):
    """Serializer for room list view"""
    hotel_name = serializers.CharField(source='hotel.name', read_only=True)
    room_type_name = serializers.CharField(source='room_type.name', read_only=True)
    view_name = serializers.CharField(source='view.name', read_only=True, allow_null=True)
    amenities_count = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = [
            'id', 'hotel', 'hotel_name', 'room_number', 'floor',
            'room_type', 'room_type_name', 'room_type_category',
            'bed_size', 'bed_count', 'max_occupancy',
            'view', 'view_name', 'status', 'is_available', 'is_active',
            'amenities_count'
        ]

    def get_amenities_count(self, obj):
        return obj.room_amenities.count()


class RoomDetailSerializer(serializers.ModelSerializer):
    """Serializer for room detail view"""
    hotel = HotelListSerializer(read_only=True)
    room_type = RoomTypeSerializer(read_only=True)
    view = RoomViewSerializer(read_only=True)
    gallery = GallerySerializer(read_only=True)
    amenities = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = [
            'id', 'hotel', 'room_number', 'floor',
            'room_type', 'room_type_category',
            'bed_size', 'bed_count', 'max_occupancy',
            'view', 'gallery', 'status', 'is_available', 'is_active',
            'amenities', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_amenities(self, obj):
        room_amenities = obj.room_amenities.select_related('amenity', 'amenity__category')
        return [
            {
                'id': ra.amenity.id,
                'name': ra.amenity.name,
                'category': ra.amenity.category.name,
                'icon': ra.amenity.icon
            }
            for ra in room_amenities
        ]


class RoomSerializer(serializers.ModelSerializer):
    """Default room serializer for create/update"""
    class Meta:
        model = Room
        fields = '__all__'


# ============== Amenity Serializers ==============

class AmenityCategorySerializer(serializers.ModelSerializer):
    """Serializer for amenity categories"""
    amenities_count = serializers.SerializerMethodField()

    class Meta:
        model = AmenityCategory
        fields = ['id', 'hotel', 'name', 'description', 'sort_order', 'is_active', 'amenities_count', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_amenities_count(self, obj):
        return obj.amenities.filter(is_active=True).count()


class AmenitySerializer(serializers.ModelSerializer):
    """Serializer for amenities"""
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Amenity
        fields = ['id', 'hotel', 'category', 'category_name', 'name', 'description', 'icon', 'sort_order', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class RoomAmenitySerializer(serializers.ModelSerializer):
    """Serializer for room-amenity assignments"""
    amenity_name = serializers.CharField(source='amenity.name', read_only=True)
    room_number = serializers.CharField(source='room.room_number', read_only=True)

    class Meta:
        model = RoomAmenity
        fields = ['id', 'room', 'room_number', 'amenity', 'amenity_name', 'created_at']
        read_only_fields = ['created_at']


# ============== Pricing Serializers ==============

class RoomTypePricingSerializer(serializers.ModelSerializer):
    """Serializer for room type pricing"""
    room_type_display = serializers.CharField(source='get_room_type_display', read_only=True)

    class Meta:
        model = RoomTypePricing
        fields = ['id', 'hotel', 'room_type', 'room_type_display', 'base_price', 'currency', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ViewPricingSerializer(serializers.ModelSerializer):
    """Serializer for view pricing"""
    view_name = serializers.CharField(source='view.name', read_only=True)
    modifier_type_display = serializers.CharField(source='get_modifier_type_display', read_only=True)

    class Meta:
        model = ViewPricing
        fields = ['id', 'hotel', 'view', 'view_name', 'modifier_type', 'modifier_type_display', 'modifier_value', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class SeasonalPricingSerializer(serializers.ModelSerializer):
    """Serializer for seasonal pricing"""
    modifier_type_display = serializers.CharField(source='get_modifier_type_display', read_only=True)

    class Meta:
        model = SeasonalPricing
        fields = ['id', 'hotel', 'season_name', 'start_date', 'end_date', 'modifier_type', 'modifier_type_display', 'modifier_value', 'priority', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class DayTypePricingSerializer(serializers.ModelSerializer):
    """Serializer for day type pricing"""
    modifier_type_display = serializers.CharField(source='get_modifier_type_display', read_only=True)

    class Meta:
        model = DayTypePricing
        fields = ['id', 'hotel', 'day_type_name', 'applicable_days', 'modifier_type', 'modifier_type_display', 'modifier_value', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PromotionalDiscountSerializer(serializers.ModelSerializer):
    """Serializer for promotional discounts"""
    discount_type_display = serializers.CharField(source='get_discount_type_display', read_only=True)

    class Meta:
        model = PromotionalDiscount
        fields = [
            'id', 'hotel', 'promotion_name', 'promotion_description',
            'discount_type', 'discount_type_display', 'discount_value',
            'start_date', 'end_date',
            'minimum_rooms', 'maximum_rooms', 'minimum_nights', 'maximum_nights',
            'booking_advance_days', 'applicable_room_types', 'promo_code',
            'priority', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


# ============== Room Rate Serializers ==============

class RoomRateSerializer(serializers.ModelSerializer):
    """Serializer for room rates (legacy)"""
    class Meta:
        model = RoomRate
        fields = '__all__'


# ============== Policy Serializers ==============

class HotelPolicySerializer(serializers.ModelSerializer):
    """Serializer for hotel policies"""
    policy_type_display = serializers.CharField(source='get_policy_type_display', read_only=True)

    class Meta:
        model = HotelPolicy
        fields = ['id', 'hotel', 'policy_type', 'policy_type_display', 'title', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


# ============== Late Checkout Serializers ==============

class LateCheckoutRequestSerializer(serializers.ModelSerializer):
    """Serializer for late checkout requests"""
    booking_reference = serializers.CharField(source='booking.booking_reference', read_only=True)
    guest_name = serializers.SerializerMethodField()
    room_number = serializers.CharField(source='booking.room.room_number', read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LateCheckoutRequest
        fields = [
            'id', 'booking', 'booking_reference', 'guest_name', 'room_number',
            'requested_checkout_time', 'status', 'guest_notes',
            'reviewed_by', 'reviewed_by_name', 'reviewed_at', 'manager_notes',
            'has_next_booking', 'next_booking_info',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'reviewed_by', 'reviewed_at']

    def get_guest_name(self, obj):
        user = obj.booking.user
        return user.get_full_name() or user.username

    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return obj.reviewed_by.get_full_name() or obj.reviewed_by.username
        return None


class LateCheckoutRequestCreateSerializer(serializers.Serializer):
    """Serializer for creating late checkout requests"""
    booking_id = serializers.IntegerField()
    requested_checkout_time = serializers.TimeField()
    guest_notes = serializers.CharField(required=False, allow_blank=True, default='')


# ============== Pricing Calculation Serializers ==============

class PricingCalculationRequestSerializer(serializers.Serializer):
    """Serializer for pricing calculation requests"""
    room_id = serializers.IntegerField()
    check_in = serializers.DateField()
    check_out = serializers.DateField()
    promo_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, data):
        if data['check_out'] <= data['check_in']:
            raise serializers.ValidationError("Check-out date must be after check-in date")
        return data


class RoomAvailabilityRequestSerializer(serializers.Serializer):
    """Serializer for room availability requests"""
    hotel_id = serializers.IntegerField()
    check_in = serializers.DateField()
    check_out = serializers.DateField()
    room_type = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    view_id = serializers.IntegerField(required=False, allow_null=True)
    min_occupancy = serializers.IntegerField(required=False, allow_null=True)
    bed_size = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, data):
        if data['check_out'] <= data['check_in']:
            raise serializers.ValidationError("Check-out date must be after check-in date")
        return data
