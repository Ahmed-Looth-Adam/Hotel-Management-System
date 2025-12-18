# Edited By
# -> Ismail Wasiu Abdul Samad, UWE ID: 24050765

from rest_framework import serializers
from .models import Payment, Invoice, InvoiceItem, BookingServiceCharge, CancellationFee


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
