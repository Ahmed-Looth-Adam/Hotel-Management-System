# Edited By
# -> Ahmed Looth Adam, UWE ID: 24050761

from rest_framework import serializers
from .models import Booking, BookingGuest, RoomReassignment, CheckInRecord


class BookingGuestSerializer(serializers.ModelSerializer):
    """Serializer for booking guests"""
    class Meta:
        model = BookingGuest
        fields = [
            'id', 'booking', 'guest_type', 'full_name', 'email', 'phone',
            'date_of_birth', 'nationality', 'id_type', 'id_number',
            'relationship_to_primary', 'special_requirements',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class RoomReassignmentSerializer(serializers.ModelSerializer):
    """Serializer for room reassignments"""
    old_room_number = serializers.CharField(source='old_room.room_number', read_only=True, allow_null=True)
    new_room_number = serializers.CharField(source='new_room.room_number', read_only=True, allow_null=True)
    reassigned_by_name = serializers.SerializerMethodField()

    class Meta:
        model = RoomReassignment
        fields = [
            'id', 'booking', 'old_room', 'old_room_number',
            'new_room', 'new_room_number', 'reassigned_by',
            'reassigned_by_name', 'reason', 'reassigned_at'
        ]
        read_only_fields = ['reassigned_at']

    def get_reassigned_by_name(self, obj):
        if obj.reassigned_by:
            return obj.reassigned_by.get_full_name() or obj.reassigned_by.username
        return None


class CheckInRecordSerializer(serializers.ModelSerializer):
    """Serializer for check-in records"""
    verified_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CheckInRecord
        fields = [
            'id', 'booking', 'guest_type', 'full_name', 'date_of_birth',
            'nationality', 'id_type', 'id_number', 'id_expiry_date',
            'address', 'phone', 'email', 'verified_by', 'verified_by_name',
            'verified_at', 'notes'
        ]
        read_only_fields = ['verified_at', 'verified_by']

    def get_verified_by_name(self, obj):
        if obj.verified_by:
            return obj.verified_by.get_full_name() or obj.verified_by.username
        return None


class BookingListSerializer(serializers.ModelSerializer):
    """Serializer for booking list view"""
    user_name = serializers.SerializerMethodField()
    hotel_name = serializers.CharField(source='hotel.name', read_only=True, allow_null=True)
    hotel_city = serializers.CharField(source='hotel.city', read_only=True, allow_null=True)
    hotel_country = serializers.CharField(source='hotel.country', read_only=True, allow_null=True)
    room_type = serializers.SerializerMethodField()
    room_type_label = serializers.SerializerMethodField()
    room_image = serializers.SerializerMethodField()
    number_of_nights = serializers.ReadOnlyField()

    class Meta:
        model = Booking
        fields = [
            'id', 'booking_reference', 'user', 'user_name',
            'hotel', 'hotel_name', 'hotel_city', 'hotel_country',
            'room', 'room_number', 'room_type', 'room_type_label', 'room_image',
            'room_type_requested', 'check_in_date', 'check_out_date', 'number_of_nights',
            'guests_count', 'status', 'payment_status',
            'total_price', 'created_at'
        ]

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_room_type(self, obj):
        # Return room's type if assigned, otherwise return requested type
        if obj.room and hasattr(obj.room, 'room_type_category'):
            return obj.room.room_type_category
        return obj.room_type_requested

    def get_room_type_label(self, obj):
        # Return human-readable room type label
        room_type_labels = {
            'standard': 'Standard Double',
            'deluxe': 'Deluxe King',
            'suite': 'Family Suite',
            'penthouse': 'Penthouse',
        }
        room_type = self.get_room_type(obj)
        return room_type_labels.get(room_type, room_type or 'Room')

    def get_room_image(self, obj):
        # Try to get image from room's gallery first
        if obj.room and obj.room.gallery:
            images = obj.room.gallery.images.all()
            if images.exists():
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(images.first().image.url)
                return images.first().image.url
        # Fall back to hotel's gallery
        if obj.hotel:
            from hotels.models import Gallery
            hotel_gallery = Gallery.objects.filter(hotel=obj.hotel, gallery_type='hotel').first()
            if hotel_gallery:
                images = hotel_gallery.images.all()
                if images.exists():
                    request = self.context.get('request')
                    if request:
                        return request.build_absolute_uri(images.first().image.url)
                    return images.first().image.url
        return None


class ServiceChargeSerializer(serializers.Serializer):
    """Serializer for booking service charges"""
    id = serializers.IntegerField()
    service_name = serializers.CharField()
    quantity = serializers.IntegerField()
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2)


class BookingDetailSerializer(serializers.ModelSerializer):
    """Serializer for booking detail view"""
    user_name = serializers.SerializerMethodField()
    user_email = serializers.CharField(source='user.email', read_only=True)
    hotel_name = serializers.CharField(source='hotel.name', read_only=True, allow_null=True)
    room_type = serializers.SerializerMethodField()
    room_view = serializers.CharField(source='room.view.name', read_only=True, allow_null=True)
    number_of_nights = serializers.ReadOnlyField()
    booking_guests = BookingGuestSerializer(many=True, read_only=True)
    room_reassignments = RoomReassignmentSerializer(many=True, read_only=True)
    check_in_records = serializers.SerializerMethodField()
    checked_in_by_name = serializers.SerializerMethodField()
    checked_out_by_name = serializers.SerializerMethodField()
    service_charges = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'booking_reference', 'user', 'user_name', 'user_email',
            'hotel', 'hotel_name', 'room', 'room_number', 'room_type', 'room_type_requested', 'room_view',
            'check_in_date', 'check_out_date', 'number_of_nights',
            'guests_count', 'actual_guests_checked_in', 'number_of_rooms',
            'status', 'payment_status',
            'total_price', 'additional_charges', 'promo_code',
            'special_requests',
            'cancelled_at', 'cancellation_reason',
            'checked_in_at', 'checked_in_by', 'checked_in_by_name', 'check_in_notes',
            'checked_out_at', 'checked_out_by', 'checked_out_by_name', 'check_out_notes', 'room_condition',
            'booking_guests', 'room_reassignments', 'check_in_records', 'service_charges',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'booking_reference']

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_room_type(self, obj):
        # Return room's type if assigned, otherwise return requested type
        if obj.room and hasattr(obj.room, 'room_type_category'):
            return obj.room.room_type_category
        return obj.room_type_requested

    def get_checked_in_by_name(self, obj):
        if obj.checked_in_by:
            return obj.checked_in_by.get_full_name() or obj.checked_in_by.username
        return None

    def get_checked_out_by_name(self, obj):
        if obj.checked_out_by:
            return obj.checked_out_by.get_full_name() or obj.checked_out_by.username
        return None

    def get_check_in_records(self, obj):
        """Get check-in records for this booking"""
        records = obj.check_in_records.all()
        return CheckInRecordSerializer(records, many=True).data

    def get_service_charges(self, obj):
        """Get service charges from the payments app"""
        try:
            from payments.models import BookingServiceCharge
            charges = BookingServiceCharge.objects.filter(booking=obj)
            return ServiceChargeSerializer(charges, many=True).data
        except Exception:
            return []


class BookingSerializer(serializers.ModelSerializer):
    """Default booking serializer for create/update"""
    user = serializers.ReadOnlyField(source='user.username')
    # Accept room_type from frontend and map to room_type_requested
    room_type = serializers.CharField(write_only=True, required=False, allow_blank=True)
    # Ancillary services (stored but not processed here - for future implementation)
    ancillary_services = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        default=list
    )

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ['booking_reference', 'created_at', 'updated_at']
        extra_kwargs = {
            'room': {'required': False, 'allow_null': True},
            'room_number': {'required': False, 'allow_blank': True},
        }

    def create(self, validated_data):
        # Map room_type to room_type_requested
        room_type = validated_data.pop('room_type', None)
        if room_type:
            validated_data['room_type_requested'] = room_type
        # Remove ancillary_services for now (can be handled separately)
        validated_data.pop('ancillary_services', None)
        return super().create(validated_data)


class BookingCreateSerializer(serializers.Serializer):
    """Serializer for creating bookings"""
    hotel_id = serializers.IntegerField()
    room_id = serializers.IntegerField()
    check_in_date = serializers.DateField()
    check_out_date = serializers.DateField()
    guests_count = serializers.IntegerField(min_value=1, default=1)
    special_requests = serializers.CharField(required=False, allow_blank=True, default='')
    promo_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    guests_info = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list
    )

    def validate(self, data):
        if data['check_out_date'] <= data['check_in_date']:
            raise serializers.ValidationError("Check-out date must be after check-in date")
        return data


class CheckInGuestSerializer(serializers.Serializer):
    """Serializer for guest data during check-in"""
    guest_type = serializers.ChoiceField(choices=['primary', 'additional'], default='primary')
    full_name = serializers.CharField(max_length=200)
    date_of_birth = serializers.DateField()
    nationality = serializers.CharField(max_length=100)
    id_type = serializers.ChoiceField(
        choices=['passport', 'national_id', 'drivers_license', 'other'],
        default='passport'
    )
    id_number = serializers.CharField(max_length=100)
    id_expiry_date = serializers.DateField(required=False, allow_null=True)
    address = serializers.CharField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    email = serializers.EmailField(required=False, allow_blank=True, default='')


class CheckInSerializer(serializers.Serializer):
    """Serializer for check-in operations"""
    room_id = serializers.IntegerField(required=True, help_text="ID of the room to assign")
    guests = CheckInGuestSerializer(many=True, required=True, help_text="List of guests checking in")
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_guests(self, value):
        if not value:
            raise serializers.ValidationError("At least one guest is required for check-in")

        # Ensure there's exactly one primary guest
        primary_guests = [g for g in value if g.get('guest_type') == 'primary']
        if len(primary_guests) != 1:
            raise serializers.ValidationError("Exactly one primary guest is required")

        return value


class CheckOutSerializer(serializers.Serializer):
    """Serializer for check-out operations"""
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    room_condition = serializers.CharField(required=False, allow_blank=True, default='')
    additional_charges = serializers.DecimalField(
        max_digits=10, decimal_places=2,
        required=False, default=0
    )


class RoomReassignmentCreateSerializer(serializers.Serializer):
    """Serializer for creating room reassignments"""
    new_room_id = serializers.IntegerField()
    reason = serializers.CharField()


class CancelBookingSerializer(serializers.Serializer):
    """Serializer for cancelling bookings"""
    reason = serializers.CharField(required=False, allow_blank=True, default='')
