# Edited By
# -> Ahmed Looth Adam, UWE ID: 24050761

from rest_framework import serializers
from .models import Booking, BookingGuest, RoomReassignment


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


class BookingListSerializer(serializers.ModelSerializer):
    """Serializer for booking list view"""
    user_name = serializers.SerializerMethodField()
    hotel_name = serializers.CharField(source='hotel.name', read_only=True, allow_null=True)
    room_type = serializers.CharField(source='room.room_type_category', read_only=True, allow_null=True)
    number_of_nights = serializers.ReadOnlyField()

    class Meta:
        model = Booking
        fields = [
            'id', 'booking_reference', 'user', 'user_name',
            'hotel', 'hotel_name', 'room', 'room_number', 'room_type',
            'check_in_date', 'check_out_date', 'number_of_nights',
            'guests_count', 'status', 'payment_status',
            'total_price', 'created_at'
        ]

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class BookingDetailSerializer(serializers.ModelSerializer):
    """Serializer for booking detail view"""
    user_name = serializers.SerializerMethodField()
    user_email = serializers.CharField(source='user.email', read_only=True)
    hotel_name = serializers.CharField(source='hotel.name', read_only=True, allow_null=True)
    room_type = serializers.CharField(source='room.room_type_category', read_only=True, allow_null=True)
    room_view = serializers.CharField(source='room.view.name', read_only=True, allow_null=True)
    number_of_nights = serializers.ReadOnlyField()
    booking_guests = BookingGuestSerializer(many=True, read_only=True)
    room_reassignments = RoomReassignmentSerializer(many=True, read_only=True)
    checked_in_by_name = serializers.SerializerMethodField()
    checked_out_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'booking_reference', 'user', 'user_name', 'user_email',
            'hotel', 'hotel_name', 'room', 'room_number', 'room_type', 'room_view',
            'check_in_date', 'check_out_date', 'number_of_nights',
            'guests_count', 'actual_guests_checked_in', 'number_of_rooms',
            'status', 'payment_status', 'payment_method',
            'total_price', 'additional_charges', 'promo_code',
            'special_requests',
            'cancelled_at', 'cancellation_reason',
            'checked_in_at', 'checked_in_by', 'checked_in_by_name', 'check_in_notes',
            'checked_out_at', 'checked_out_by', 'checked_out_by_name', 'check_out_notes', 'room_condition',
            'booking_guests', 'room_reassignments',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'booking_reference']

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_checked_in_by_name(self, obj):
        if obj.checked_in_by:
            return obj.checked_in_by.get_full_name() or obj.checked_in_by.username
        return None

    def get_checked_out_by_name(self, obj):
        if obj.checked_out_by:
            return obj.checked_out_by.get_full_name() or obj.checked_out_by.username
        return None


class BookingSerializer(serializers.ModelSerializer):
    """Default booking serializer for create/update"""
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ['booking_reference', 'created_at', 'updated_at']


class BookingCreateSerializer(serializers.Serializer):
    """Serializer for creating bookings"""
    hotel_id = serializers.IntegerField()
    room_id = serializers.IntegerField()
    check_in_date = serializers.DateField()
    check_out_date = serializers.DateField()
    guests_count = serializers.IntegerField(min_value=1, default=1)
    special_requests = serializers.CharField(required=False, allow_blank=True, default='')
    promo_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    payment_method = serializers.CharField(required=False, allow_blank=True, default='')
    guests_info = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list
    )

    def validate(self, data):
        if data['check_out_date'] <= data['check_in_date']:
            raise serializers.ValidationError("Check-out date must be after check-in date")
        return data


class CheckInSerializer(serializers.Serializer):
    """Serializer for check-in operations"""
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    actual_guests = serializers.IntegerField(required=False, allow_null=True)


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
