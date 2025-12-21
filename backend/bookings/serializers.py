# Edited By
# -> Ahmed Looth Adam, UWE ID: 24050761

from rest_framework import serializers
from .models import Booking, BookingGuest, RoomReassignment, CheckInRecord, BookingRoom, Order


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


class BookingRoomSerializer(serializers.ModelSerializer):
    """Serializer for rooms in a booking"""
    room_number = serializers.SerializerMethodField()
    room_type_label = serializers.SerializerMethodField()
    room_image = serializers.SerializerMethodField()
    hotel_id = serializers.SerializerMethodField()
    hotel_name = serializers.SerializerMethodField()
    hotel_city = serializers.SerializerMethodField()
    hotel_country = serializers.SerializerMethodField()
    number_of_nights = serializers.ReadOnlyField()
    ancillary_services_display = serializers.SerializerMethodField()

    class Meta:
        model = BookingRoom
        fields = [
            'id', 'room', 'room_number', 'room_type_category', 'room_type_label',
            'room_image', 'hotel_id', 'hotel_name', 'hotel_city', 'hotel_country',
            'guests_count', 'check_in_date', 'check_out_date', 'number_of_nights',
            'price_per_night', 'total_price', 'services_total', 'ancillary_services',
            'ancillary_services_display', 'special_requests', 'is_checked_in',
            'checked_in_at', 'is_checked_out', 'checked_out_at', 'created_at'
        ]
        read_only_fields = ['created_at']

    def get_room_number(self, obj):
        if obj.room:
            return obj.room.room_number
        return None

    def get_hotel_id(self, obj):
        if obj.room and obj.room.hotel:
            return obj.room.hotel.id
        # Fallback to booking's hotel
        if obj.booking and obj.booking.hotel:
            return obj.booking.hotel.id
        return None

    def get_hotel_name(self, obj):
        if obj.room and obj.room.hotel:
            return obj.room.hotel.name
        if obj.booking and obj.booking.hotel:
            return obj.booking.hotel.name
        return None

    def get_hotel_city(self, obj):
        if obj.room and obj.room.hotel:
            return obj.room.hotel.city
        if obj.booking and obj.booking.hotel:
            return obj.booking.hotel.city
        return None

    def get_hotel_country(self, obj):
        if obj.room and obj.room.hotel:
            return obj.room.hotel.country
        if obj.booking and obj.booking.hotel:
            return obj.booking.hotel.country
        return None

    def get_room_type_label(self, obj):
        room_type_labels = {
            'standard': 'Standard Double',
            'deluxe': 'Deluxe King',
            'suite': 'Family Suite',
            'penthouse': 'Penthouse',
        }
        return room_type_labels.get(obj.room_type_category, obj.room_type_category or 'Room')

    def get_room_image(self, obj):
        if obj.room and obj.room.gallery:
            images = obj.room.gallery.images.all()
            if images.exists():
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(images.first().image.url)
                return images.first().image.url
        return None

    def get_ancillary_services_display(self, obj):
        """Return human-readable service names"""
        service_labels = {
            'airport_transfer': 'Airport Transfer',
            'breakfast': 'Full English Breakfast',
            'spa': 'Spa Access',
            'late_checkout': 'Late Check-out',
        }
        if not obj.ancillary_services:
            return []
        return [service_labels.get(s, s) for s in obj.ancillary_services]


class BookingRoomCreateSerializer(serializers.Serializer):
    """Serializer for creating a room entry in a multi-room booking"""
    room_id = serializers.IntegerField()
    guests_count = serializers.IntegerField(min_value=1, default=2)
    check_in_date = serializers.DateField(required=False, allow_null=True)
    check_out_date = serializers.DateField(required=False, allow_null=True)
    price_per_night = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    ancillary_services = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )
    special_requests = serializers.CharField(required=False, allow_blank=True, default='')


class BookingListSerializer(serializers.ModelSerializer):
    """Serializer for booking list view"""
    user_name = serializers.SerializerMethodField()
    user_profile_picture = serializers.SerializerMethodField()
    hotel_name = serializers.CharField(source='hotel.name', read_only=True, allow_null=True)
    hotel_city = serializers.CharField(source='hotel.city', read_only=True, allow_null=True)
    hotel_country = serializers.CharField(source='hotel.country', read_only=True, allow_null=True)
    room_type = serializers.SerializerMethodField()
    room_type_label = serializers.SerializerMethodField()
    room_image = serializers.SerializerMethodField()
    number_of_nights = serializers.ReadOnlyField()
    cancellation_fee_amount = serializers.SerializerMethodField()
    booking_rooms = BookingRoomSerializer(many=True, read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'booking_reference', 'user', 'user_name', 'user_profile_picture',
            'hotel', 'hotel_name', 'hotel_city', 'hotel_country',
            'room', 'room_number', 'room_type', 'room_type_label', 'room_image',
            'room_type_requested', 'check_in_date', 'check_out_date', 'number_of_nights',
            'guests_count', 'number_of_rooms', 'status', 'payment_status',
            'total_price', 'cancellation_fee_amount', 'booking_rooms', 'created_at'
        ]

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_user_profile_picture(self, obj):
        """Get user's profile picture URL"""
        if obj.user and obj.user.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.profile_picture.url)
            return obj.user.profile_picture.url
        return None

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

    def get_cancellation_fee_amount(self, obj):
        """Get cancellation fee amount if booking was cancelled"""
        if obj.status == 'cancelled':
            try:
                from payments.models import CancellationFee
                fee = CancellationFee.objects.filter(booking=obj, waived=False).first()
                if fee:
                    return float(fee.fee_amount)
            except Exception:
                pass
        return 0


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
    booking_rooms = BookingRoomSerializer(many=True, read_only=True)
    room_reassignments = RoomReassignmentSerializer(many=True, read_only=True)
    check_in_records = serializers.SerializerMethodField()
    checked_in_by_name = serializers.SerializerMethodField()
    checked_out_by_name = serializers.SerializerMethodField()
    no_show_by_name = serializers.SerializerMethodField()
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
            'no_show_at', 'no_show_by', 'no_show_by_name', 'no_show_notes',
            'booking_guests', 'booking_rooms', 'room_reassignments', 'check_in_records', 'service_charges',
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

    def get_no_show_by_name(self, obj):
        if obj.no_show_by:
            return obj.no_show_by.get_full_name() or obj.no_show_by.username
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
    # Ancillary services - list of service IDs from frontend
    ancillary_services = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        default=list
    )
    # Multiple rooms support
    rooms = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        default=list
    )
    # Include booking_rooms in response
    booking_rooms = BookingRoomSerializer(many=True, read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ['booking_reference', 'created_at', 'updated_at']
        extra_kwargs = {
            'room': {'required': False, 'allow_null': True},
            'room_number': {'required': False, 'allow_blank': True},
        }

    # Map frontend service IDs to database service_types
    # These match the service_type values in the AncillaryService seed data
    SERVICE_ID_MAP = {
        'airport_transfer': 'airport_transfer',
        'breakfast': 'breakfast',
        'spa': 'spa',
        'late_checkout': 'late_checkout',
    }

    def create(self, validated_data):
        from payments.models import BookingServiceCharge
        from hotels.models import AncillaryService, Room

        # Map room_type to room_type_requested
        room_type = validated_data.pop('room_type', None)
        if room_type:
            validated_data['room_type_requested'] = room_type

        # Extract ancillary_services before creating booking
        ancillary_services = validated_data.pop('ancillary_services', [])

        # Extract rooms list for multi-room booking
        rooms_data = validated_data.pop('rooms', [])

        # Calculate number of rooms
        if rooms_data:
            validated_data['number_of_rooms'] = len(rooms_data)

        # Create the booking
        booking = super().create(validated_data)

        # Create BookingRoom entries for multi-room bookings
        nights = (booking.check_out_date - booking.check_in_date).days
        if rooms_data:
            for room_info in rooms_data:
                room_id = room_info.get('room_id') or room_info.get('id')
                if not room_id:
                    continue

                try:
                    room = Room.objects.get(id=room_id)
                    guests_count = room_info.get('guests_count', 2)
                    price_per_night = room_info.get('price_per_night') or room.price_per_night
                    total_price = float(price_per_night) * nights

                    BookingRoom.objects.create(
                        booking=booking,
                        room=room,
                        room_type_category=room.room_type.category if room.room_type else '',
                        guests_count=guests_count,
                        price_per_night=price_per_night,
                        total_price=total_price,
                        special_requests=room_info.get('special_requests', '')
                    )
                except Room.DoesNotExist:
                    continue
        # For single room booking (backwards compatibility)
        elif booking.room:
            price_per_night = booking.room.price_per_night
            BookingRoom.objects.create(
                booking=booking,
                room=booking.room,
                room_type_category=booking.room.room_type.category if booking.room.room_type else '',
                guests_count=booking.guests_count,
                price_per_night=price_per_night,
                total_price=float(price_per_night) * nights
            )

        # Process ancillary services and create BookingServiceCharge records
        if ancillary_services and booking.hotel:
            # Calculate days for per-day services
            days = (booking.check_out_date - booking.check_in_date).days
            guests = booking.guests_count or 1

            for service_id in ancillary_services:
                service_type = self.SERVICE_ID_MAP.get(service_id)
                if not service_type:
                    continue

                # Find the matching AncillaryService for this hotel
                service = AncillaryService.objects.filter(
                    hotel=booking.hotel,
                    service_type=service_type,
                    is_active=True
                ).first()

                if service:
                    # Calculate charge based on service pricing type
                    total_price = service.calculate_charge(
                        quantity=1,
                        days=days,
                        persons=guests
                    )

                    # Create BookingServiceCharge record
                    BookingServiceCharge.objects.create(
                        booking=booking,
                        service=service,
                        service_name=service.name,
                        quantity=1,
                        persons=guests if service.pricing_type in ['per_person', 'per_person_per_day'] else 1,
                        days=days if service.pricing_type in ['per_day', 'per_person_per_day'] else 1,
                        unit_price=service.price,
                        total_price=total_price
                    )

        return booking


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


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for Order model"""
    user_name = serializers.SerializerMethodField()
    user_email = serializers.CharField(source='user.email', read_only=True)
    booking_count = serializers.ReadOnlyField()
    room_count = serializers.ReadOnlyField()
    bookings = BookingListSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_reference', 'user', 'user_name', 'user_email',
            'status', 'total_amount', 'booking_count', 'room_count',
            'bookings', 'created_at', 'updated_at'
        ]
        read_only_fields = ['order_reference', 'created_at', 'updated_at']

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class OrderCreateSerializer(serializers.Serializer):
    """
    Serializer for creating orders with multiple rooms from different hotels.
    Accepts room TYPE (not specific room ID) - backend assigns specific rooms at booking time.
    Each room entry can have its own dates and ancillary services.
    """
    rooms = serializers.ListField(
        child=serializers.DictField(),
        min_length=1,
        help_text="List of rooms to book: hotel_id, room_type_category, dates, services"
    )

    def validate_rooms(self, value):
        """Validate each room in the cart"""
        from hotels.models import Room, Hotel
        from datetime import datetime

        for i, room_data in enumerate(value):
            # Required fields
            if 'hotel_id' not in room_data:
                raise serializers.ValidationError(f"Room {i+1}: hotel_id is required")
            if 'room_type_category' not in room_data:
                raise serializers.ValidationError(f"Room {i+1}: room_type_category is required")
            if 'check_in_date' not in room_data:
                raise serializers.ValidationError(f"Room {i+1}: check_in_date is required")
            if 'check_out_date' not in room_data:
                raise serializers.ValidationError(f"Room {i+1}: check_out_date is required")

            # Verify hotel exists
            try:
                Hotel.objects.get(id=room_data['hotel_id'])
            except Hotel.DoesNotExist:
                raise serializers.ValidationError(f"Room {i+1}: hotel not found")

            # Parse dates
            check_in = room_data['check_in_date']
            check_out = room_data['check_out_date']
            if isinstance(check_in, str):
                check_in = datetime.strptime(check_in, '%Y-%m-%d').date()
            if isinstance(check_out, str):
                check_out = datetime.strptime(check_out, '%Y-%m-%d').date()

            # Check room availability
            room_type = room_data['room_type_category']
            hotel_id = room_data['hotel_id']

            # Get rooms of this type that are available for the dates
            available_rooms = Room.objects.filter(
                hotel_id=hotel_id,
                room_type_category=room_type,
                status='available'
            ).exclude(
                booking_room_entries__booking__status__in=['confirmed', 'checked_in'],
                booking_room_entries__check_in_date__lt=check_out,
                booking_room_entries__check_out_date__gt=check_in
            ).count()

            if available_rooms < 1:
                raise serializers.ValidationError(
                    f"Room {i+1}: No available {room_type} rooms at this hotel for the selected dates"
                )

        return value

    def create(self, validated_data):
        from hotels.models import Room, Hotel, AncillaryService
        from decimal import Decimal
        from datetime import datetime
        from django.db import transaction

        user = self.context['request'].user
        rooms_data = validated_data['rooms']

        # Service prices (fallback if not found in DB)
        SERVICE_PRICES = {
            'airport_transfer': Decimal('50'),
            'breakfast': Decimal('20'),  # per person per day
            'spa': Decimal('35'),  # per person per day
            'late_checkout': Decimal('40'),
        }

        # Group rooms by hotel
        hotel_rooms = {}
        for room_data in rooms_data:
            hotel_id = room_data['hotel_id']
            hotel = Hotel.objects.get(id=hotel_id)

            if hotel_id not in hotel_rooms:
                hotel_rooms[hotel_id] = {
                    'hotel': hotel,
                    'rooms': []
                }
            hotel_rooms[hotel_id]['rooms'].append(room_data)

        with transaction.atomic():
            # Create Order
            order = Order.objects.create(user=user, total_amount=Decimal('0'))
            total_order_amount = Decimal('0')

            # Create Booking for each hotel
            for hotel_id, hotel_data in hotel_rooms.items():
                hotel = hotel_data['hotel']
                rooms_list = hotel_data['rooms']

                # Parse all dates
                parsed_rooms = []
                for data in rooms_list:
                    check_in = data['check_in_date']
                    check_out = data['check_out_date']
                    if isinstance(check_in, str):
                        check_in = datetime.strptime(check_in, '%Y-%m-%d').date()
                    if isinstance(check_out, str):
                        check_out = datetime.strptime(check_out, '%Y-%m-%d').date()
                    parsed_rooms.append({
                        'data': data,
                        'check_in': check_in,
                        'check_out': check_out
                    })

                # Use earliest check-in and latest check-out for the booking
                booking_check_in = min(r['check_in'] for r in parsed_rooms)
                booking_check_out = max(r['check_out'] for r in parsed_rooms)

                # Calculate total for this booking
                booking_total = Decimal('0')
                total_guests = 0

                # Create Booking
                booking = Booking.objects.create(
                    order=order,
                    user=user,
                    hotel=hotel,
                    check_in_date=booking_check_in,
                    check_out_date=booking_check_out,
                    guests_count=1,  # Will update after calculating
                    number_of_rooms=len(parsed_rooms),
                    total_price=Decimal('0'),  # Will update after calculating
                    status='confirmed',
                    payment_status='paid'
                )

                # Track assigned rooms to avoid double-booking
                assigned_room_ids = set()

                # Create BookingRoom for each room request
                for room_info in parsed_rooms:
                    data = room_info['data']
                    check_in = room_info['check_in']
                    check_out = room_info['check_out']

                    room_type = data['room_type_category']
                    guests_count = data.get('guests_count', 2)
                    total_guests += guests_count

                    # Find an available room of this type
                    available_room = Room.objects.filter(
                        hotel_id=hotel_id,
                        room_type_category=room_type,
                        status='available'
                    ).exclude(
                        id__in=assigned_room_ids  # Exclude already assigned in this order
                    ).exclude(
                        booking_room_entries__booking__status__in=['confirmed', 'checked_in'],
                        booking_room_entries__check_in_date__lt=check_out,
                        booking_room_entries__check_out_date__gt=check_in
                    ).select_related('room_type').first()

                    if not available_room:
                        raise serializers.ValidationError(
                            f"No available {room_type} room found for dates {check_in} to {check_out}"
                        )

                    assigned_room_ids.add(available_room.id)

                    nights = (check_out - check_in).days
                    # Get price from frontend data, or look up from RoomTypePricing
                    if data.get('price_per_night'):
                        price_per_night = Decimal(str(data.get('price_per_night')))
                    else:
                        # Look up from RoomTypePricing
                        from hotels.models import RoomTypePricing
                        pricing = RoomTypePricing.objects.filter(
                            hotel=hotel,
                            room_type=room_type
                        ).first()
                        price_per_night = pricing.off_peak_price if pricing else Decimal('100')
                    room_total = price_per_night * nights

                    # Calculate services total
                    services = data.get('ancillary_services', [])
                    services_total = Decimal('0')

                    for service_id in services:
                        # Try to get actual price from DB
                        service = AncillaryService.objects.filter(
                            hotel=hotel,
                            service_type=service_id,
                            is_active=True
                        ).first()

                        if service:
                            services_total += Decimal(str(service.calculate_charge(
                                quantity=1,
                                days=nights,
                                persons=guests_count
                            )))
                        else:
                            # Fallback to hardcoded prices
                            price = SERVICE_PRICES.get(service_id, Decimal('0'))
                            if service_id in ['breakfast', 'spa']:
                                services_total += price * guests_count * nights
                            else:
                                services_total += price

                    room_total_with_services = room_total + services_total
                    booking_total += room_total_with_services

                    BookingRoom.objects.create(
                        booking=booking,
                        room=available_room,
                        room_type_category=room_type,
                        guests_count=guests_count,
                        check_in_date=check_in,
                        check_out_date=check_out,
                        price_per_night=price_per_night,
                        total_price=room_total,
                        services_total=services_total,
                        ancillary_services=services,
                        special_requests=data.get('special_requests', '')
                    )

                # Update booking totals
                booking.guests_count = total_guests
                booking.total_price = booking_total
                booking.save()

                total_order_amount += booking_total

            # Update order total
            order.total_amount = total_order_amount
            order.save()

        return order
