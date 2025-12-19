from rest_framework import serializers
from .models import (
    Hotel, Room, RoomType, RoomView,
    AmenityCategory, Amenity, RoomAmenity,
    RoomTypePricing, SeasonalPricing, HotelPolicy, Gallery, GalleryImage,
    AncillaryService
)


# ============== Hotel Serializers ==============

class HotelListSerializer(serializers.ModelSerializer):
    """Serializer for hotel list view"""
    room_count = serializers.SerializerMethodField()
    manager = serializers.SerializerMethodField()
    galleries = serializers.SerializerMethodField()
    total_rooms = serializers.SerializerMethodField()

    class Meta:
        model = Hotel
        fields = [
            'id', 'name', 'location', 'address', 'city', 'country',
            'description', 'star_rating', 'room_capacity', 'is_active', 'room_count', 'manager',
            'galleries', 'total_rooms'
        ]

    def get_room_count(self, obj):
        return obj.rooms.filter(is_active=True).count()

    def get_total_rooms(self, obj):
        return obj.rooms.count()

    def get_manager(self, obj):
        if obj.manager:
            return {
                'id': obj.manager.id,
                'username': obj.manager.username,
                'email': obj.manager.email
            }
        return None

    def get_galleries(self, obj):
        """Get galleries with images for the hotel"""
        galleries = obj.galleries.filter(gallery_type='hotel').prefetch_related('images')[:1]
        result = []
        for gallery in galleries:
            images = [{'id': img.id, 'image': img.image.url if img.image else None}
                      for img in gallery.images.all()[:5]]
            result.append({
                'id': gallery.id,
                'name': gallery.name,
                'images': images
            })
        return result


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
    """Default hotel serializer for create/update"""
    manager_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Hotel
        fields = '__all__'

    def validate_manager_id(self, value):
        if value is None:
            return None
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            manager = User.objects.get(id=value, role='manager', is_active=True)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid manager ID or manager is not active.")

    def create(self, validated_data):
        manager_id = validated_data.pop('manager_id', None)
        if manager_id:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            validated_data['manager'] = User.objects.get(id=manager_id)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        manager_id = validated_data.pop('manager_id', None)
        if manager_id is not None:
            if manager_id:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                validated_data['manager'] = User.objects.get(id=manager_id)
            else:
                validated_data['manager'] = None
        return super().update(instance, validated_data)


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
    assigned_rooms = serializers.SerializerMethodField()
    assigned_rooms_count = serializers.SerializerMethodField()

    class Meta:
        model = Gallery
        fields = ['id', 'hotel', 'name', 'description', 'gallery_type', 'images', 'image_count',
                  'assigned_rooms', 'assigned_rooms_count', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_image_count(self, obj):
        return obj.images.count()

    def get_assigned_rooms(self, obj):
        """Get list of rooms assigned to this gallery"""
        return [{'id': room.id, 'room_number': room.room_number} for room in obj.rooms.all()]

    def get_assigned_rooms_count(self, obj):
        """Get count of rooms assigned to this gallery"""
        return obj.rooms.count()


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
    gallery = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = [
            'id', 'hotel', 'hotel_name', 'room_number', 'floor',
            'room_type', 'room_type_name', 'room_type_category',
            'bed_size', 'bed_count', 'max_occupancy',
            'view', 'view_name', 'gallery', 'status', 'is_available', 'is_active',
            'amenities_count'
        ]

    def get_amenities_count(self, obj):
        return obj.room_amenities.count()

    def get_gallery(self, obj):
        """Get room's gallery with images (lightweight version for list view)"""
        if not obj.gallery:
            return None
        gallery = obj.gallery
        images = [{'id': img.id, 'image': img.image.url if img.image else None}
                  for img in gallery.images.all()[:5]]
        return {
            'id': gallery.id,
            'name': gallery.name,
            'images': images
        }


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

    # Room type configuration based on documentation
    ROOM_TYPE_CONFIG = {
        'standard': {'bed_size': 'queen', 'bed_count': 1, 'max_occupancy': 2},
        'deluxe': {'bed_size': 'king', 'bed_count': 1, 'max_occupancy': 2},
        'suite': {'bed_size': 'queen', 'bed_count': 2, 'max_occupancy': 4},
        'penthouse': {'bed_size': 'king', 'bed_count': 2, 'max_occupancy': 4},
    }

    class Meta:
        model = Room
        fields = '__all__'

    def create(self, validated_data):
        # Auto-set bed config, occupancy, and status based on room type
        room_type_category = validated_data.get('room_type_category', 'standard')
        config = self.ROOM_TYPE_CONFIG.get(room_type_category, self.ROOM_TYPE_CONFIG['standard'])

        validated_data.setdefault('bed_size', config['bed_size'])
        validated_data.setdefault('bed_count', config['bed_count'])
        validated_data.setdefault('max_occupancy', config['max_occupancy'])
        validated_data.setdefault('status', 'available')
        validated_data.setdefault('is_available', True)

        return super().create(validated_data)

    def update(self, instance, validated_data):
        # If room type category changes, update the config
        room_type_category = validated_data.get('room_type_category', instance.room_type_category)
        if room_type_category != instance.room_type_category:
            config = self.ROOM_TYPE_CONFIG.get(room_type_category, self.ROOM_TYPE_CONFIG['standard'])
            validated_data.setdefault('bed_size', config['bed_size'])
            validated_data.setdefault('bed_count', config['bed_count'])
            validated_data.setdefault('max_occupancy', config['max_occupancy'])

        return super().update(instance, validated_data)


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
        fields = ['id', 'hotel', 'room_type', 'room_type_display', 'off_peak_price', 'peak_price', 'currency', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class SeasonalPricingSerializer(serializers.ModelSerializer):
    """Serializer for seasonal pricing (peak/off-peak date ranges)"""

    class Meta:
        model = SeasonalPricing
        fields = ['id', 'hotel', 'season_name', 'start_date', 'end_date', 'is_peak_season', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


# ============== Policy Serializers ==============

class HotelPolicySerializer(serializers.ModelSerializer):
    """Serializer for hotel policies"""
    policy_type_display = serializers.CharField(source='get_policy_type_display', read_only=True)

    class Meta:
        model = HotelPolicy
        fields = ['id', 'hotel', 'policy_type', 'policy_type_display', 'title', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


# ============== Pricing Calculation Serializers ==============

class PricingCalculationRequestSerializer(serializers.Serializer):
    """Serializer for pricing calculation requests"""
    room_id = serializers.IntegerField()
    check_in = serializers.DateField()
    check_out = serializers.DateField()

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


# ============== Ancillary Service Serializers ==============

class AncillaryServiceSerializer(serializers.ModelSerializer):
    """Serializer for ancillary services"""
    service_type_display = serializers.CharField(source='get_service_type_display', read_only=True)
    pricing_type_display = serializers.CharField(source='get_pricing_type_display', read_only=True)
    hotel_name = serializers.CharField(source='hotel.name', read_only=True)

    class Meta:
        model = AncillaryService
        fields = [
            'id', 'hotel', 'hotel_name', 'name', 'service_type', 'service_type_display',
            'description', 'price', 'currency', 'pricing_type', 'pricing_type_display',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
