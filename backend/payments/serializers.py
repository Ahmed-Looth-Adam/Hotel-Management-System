# Edited By
# -> Ismail Wasiu Abdul Samad, UWE ID: 24050765

from rest_framework import serializers
from .models import Payment, Invoice, InvoiceItem, BookingServiceCharge, CancellationFee, SavedCard


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'booking', 'payment_reference', 'amount', 'currency',
            'status', 'transaction_id', 'description',
            'processed_by', 'processed_at', 'refund_amount', 'refund_reason',
            'refunded_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['payment_reference', 'processed_by', 'processed_at', 'created_at', 'updated_at']


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = [
            'id', 'item_type', 'description', 'quantity', 'unit_price',
            'total_price', 'date', 'service', 'created_at'
        ]
        read_only_fields = ['created_at']


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)
    balance_due = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'booking', 'invoice_number', 'subtotal', 'tax_amount',
            'discount_amount', 'total_amount', 'amount_paid', 'balance_due',
            'currency', 'status', 'issued_date', 'due_date', 'guest_name',
            'guest_email', 'guest_address', 'hotel_name', 'hotel_address',
            'notes', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['invoice_number', 'created_at', 'updated_at']


class BookingServiceChargeSerializer(serializers.ModelSerializer):
    service_name_display = serializers.CharField(source='service.name', read_only=True)

    class Meta:
        model = BookingServiceCharge
        fields = [
            'id', 'booking', 'service', 'service_name', 'service_name_display',
            'quantity', 'persons', 'days', 'unit_price', 'total_price',
            'date_added', 'notes', 'added_by', 'created_at'
        ]
        read_only_fields = ['service_name', 'added_by', 'created_at']


class CancellationFeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CancellationFee
        fields = [
            'id', 'booking', 'fee_type', 'fee_percentage', 'fee_amount',
            'first_night_rate', 'days_before_checkin', 'cancellation_date',
            'waived', 'waived_reason', 'waived_by', 'created_at'
        ]
        read_only_fields = ['created_at']


class CreateInvoiceSerializer(serializers.Serializer):
    """Serializer for creating an invoice from a booking"""
    booking_id = serializers.IntegerField()
    include_service_charges = serializers.BooleanField(default=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class SavedCardSerializer(serializers.ModelSerializer):
    """Serializer for displaying saved cards (read-only sensitive fields)"""
    display_name = serializers.CharField(read_only=True)
    expiry_display = serializers.CharField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = SavedCard
        fields = [
            'id', 'card_type', 'last_four', 'card_nickname',
            'cardholder_name', 'expiry_display', 'is_default',
            'is_active', 'is_expired', 'display_name', 'created_at'
        ]
        read_only_fields = ['id', 'card_type', 'last_four', 'created_at']


class SavedCardCreateSerializer(serializers.Serializer):
    """
    Serializer for saving a new card.

    Accepts full card details (for validation only), then stores only safe data.
    CVV is validated but NEVER stored.
    """
    card_number = serializers.CharField(max_length=19, write_only=True)
    expiry_date = serializers.CharField(max_length=5, write_only=True)  # MM/YY
    cvv = serializers.CharField(max_length=4, write_only=True)
    cardholder_name = serializers.CharField(max_length=100)
    card_nickname = serializers.CharField(max_length=50, required=False, allow_blank=True)
    is_default = serializers.BooleanField(default=False)

    def validate_card_number(self, value):
        """Validate card number format"""
        clean_number = value.replace(' ', '').replace('-', '')
        if not clean_number.isdigit():
            raise serializers.ValidationError("Card number must contain only digits")
        if len(clean_number) < 13 or len(clean_number) > 19:
            raise serializers.ValidationError("Card number must be 13-19 digits")
        return clean_number

    def validate_expiry_date(self, value):
        """Validate expiry date format and ensure card is not expired"""
        import re
        from datetime import datetime

        if not re.match(r'^\d{2}/\d{2}$', value):
            raise serializers.ValidationError("Expiry date must be in MM/YY format")

        month, year = value.split('/')
        month = int(month)
        year = int('20' + year)

        if month < 1 or month > 12:
            raise serializers.ValidationError("Invalid month")

        now = datetime.now()
        if year < now.year or (year == now.year and month < now.month):
            raise serializers.ValidationError("Card has expired")

        return value

    def validate_cvv(self, value):
        """Validate CVV format (we validate but never store)"""
        if not value.isdigit():
            raise serializers.ValidationError("CVV must contain only digits")
        if len(value) < 3 or len(value) > 4:
            raise serializers.ValidationError("CVV must be 3-4 digits")
        return value

    def create(self, validated_data):
        """Create a saved card from validated data"""
        user = self.context['request'].user
        card_number = validated_data['card_number']
        expiry_date = validated_data['expiry_date']
        month, year = expiry_date.split('/')

        saved_card = SavedCard.objects.create(
            user=user,
            card_type=SavedCard.detect_card_type(card_number),
            last_four=card_number[-4:],
            cardholder_name=validated_data['cardholder_name'],
            expiry_month=month,
            expiry_year=year,
            card_nickname=validated_data.get('card_nickname', ''),
            is_default=validated_data.get('is_default', False),
        )

        return saved_card


class SavedCardUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating saved card preferences"""
    class Meta:
        model = SavedCard
        fields = ['card_nickname', 'is_default', 'is_active']
