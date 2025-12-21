# Edited By
# -> Ismail Wasiu Abdul Samad, UWE ID: 24050765

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
import uuid

from .models import Payment, Invoice, InvoiceItem, BookingServiceCharge, CancellationFee, SavedCard
from .serializers import (
    PaymentSerializer, InvoiceSerializer, InvoiceItemSerializer,
    BookingServiceChargeSerializer, CancellationFeeSerializer,
    CreateInvoiceSerializer, SavedCardSerializer, SavedCardCreateSerializer,
    SavedCardUpdateSerializer
)
from bookings.models import Booking
from hotels.models import AncillaryService


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing payments"""
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Payment.objects.all().select_related('booking', 'processed_by')

        # Filter by booking
        booking_id = self.request.query_params.get('booking')
        if booking_id:
            queryset = queryset.filter(booking_id=booking_id)

        # Filter by status
        payment_status = self.request.query_params.get('status')
        if payment_status:
            queryset = queryset.filter(status=payment_status)

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(processed_by=self.request.user)

    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Process a pending payment"""
        payment = self.get_object()

        if payment.status != 'pending':
            return Response(
                {'error': 'Only pending payments can be processed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        payment.status = 'completed'
        payment.processed_at = timezone.now()
        payment.processed_by = request.user
        payment.transaction_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"
        payment.save()

        # Update invoice if exists
        try:
            invoice = Invoice.objects.get(booking=payment.booking)
            invoice.amount_paid += payment.amount
            if invoice.amount_paid >= invoice.total_amount:
                invoice.status = 'paid'
            else:
                invoice.status = 'partially_paid'
            invoice.save()
        except Invoice.DoesNotExist:
            pass

        return Response(PaymentSerializer(payment).data)

    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        """Refund a completed payment"""
        payment = self.get_object()

        if payment.status != 'completed':
            return Response(
                {'error': 'Only completed payments can be refunded'},
                status=status.HTTP_400_BAD_REQUEST
            )

        refund_amount = Decimal(request.data.get('amount', payment.amount))
        refund_reason = request.data.get('reason', '')

        if refund_amount > payment.amount:
            return Response(
                {'error': 'Refund amount cannot exceed payment amount'},
                status=status.HTTP_400_BAD_REQUEST
            )

        payment.status = 'refunded'
        payment.refund_amount = refund_amount
        payment.refund_reason = refund_reason
        payment.refunded_at = timezone.now()
        payment.save()

        return Response(PaymentSerializer(payment).data)


class InvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing invoices"""
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Invoice.objects.all().select_related('booking').prefetch_related('items')

        # Filter by booking
        booking_id = self.request.query_params.get('booking')
        if booking_id:
            queryset = queryset.filter(booking_id=booking_id)

        # Filter by status
        invoice_status = self.request.query_params.get('status')
        if invoice_status:
            queryset = queryset.filter(status=invoice_status)

        return queryset.order_by('-created_at')

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate an invoice for a booking"""
        serializer = CreateInvoiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        booking_id = serializer.validated_data['booking_id']
        include_service_charges = serializer.validated_data.get('include_service_charges', True)
        notes = serializer.validated_data.get('notes', '')

        try:
            booking = Booking.objects.select_related('room', 'room__hotel', 'guest').get(id=booking_id)
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if invoice already exists
        if Invoice.objects.filter(booking=booking).exists():
            return Response(
                {'error': 'Invoice already exists for this booking'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # Calculate room charges
            nights = (booking.check_out_date - booking.check_in_date).days
            room_rate = booking.room.price_per_night
            room_total = room_rate * nights

            # Create invoice
            invoice = Invoice.objects.create(
                booking=booking,
                subtotal=room_total,
                tax_amount=Decimal('0.00'),
                discount_amount=Decimal('0.00'),
                total_amount=room_total,
                guest_name=f"{booking.guest.first_name} {booking.guest.last_name}",
                guest_email=booking.guest.email,
                hotel_name=booking.room.hotel.name,
                notes=notes
            )

            # Add room charge item
            InvoiceItem.objects.create(
                invoice=invoice,
                item_type='room',
                description=f"{booking.room.room_type} Room - {nights} night(s)",
                quantity=nights,
                unit_price=room_rate,
                total_price=room_total,
                date=booking.check_in_date
            )

            # Add service charges if requested
            if include_service_charges:
                service_charges = BookingServiceCharge.objects.filter(booking=booking)
                for charge in service_charges:
                    InvoiceItem.objects.create(
                        invoice=invoice,
                        item_type='service',
                        description=charge.service_name,
                        quantity=charge.quantity,
                        unit_price=charge.unit_price,
                        total_price=charge.total_price,
                        date=charge.date_added,
                        service=charge.service
                    )
                    invoice.subtotal += charge.total_price
                    invoice.total_amount += charge.total_price

                invoice.save()

            # Add cancellation fee if applicable
            try:
                cancellation_fee = CancellationFee.objects.get(booking=booking, waived=False)
                InvoiceItem.objects.create(
                    invoice=invoice,
                    item_type='fee',
                    description=f"Cancellation Fee ({cancellation_fee.get_fee_type_display()})",
                    quantity=1,
                    unit_price=cancellation_fee.fee_amount,
                    total_price=cancellation_fee.fee_amount,
                    date=cancellation_fee.cancellation_date
                )
                invoice.subtotal += cancellation_fee.fee_amount
                invoice.total_amount += cancellation_fee.fee_amount
                invoice.save()
            except CancellationFee.DoesNotExist:
                pass

        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def send_email(self, request, pk=None):
        """Send invoice via email"""
        invoice = self.get_object()
        return Response({'message': f'Invoice {invoice.invoice_number} sent to {invoice.guest_email}'})


class BookingServiceChargeViewSet(viewsets.ModelViewSet):
    """ViewSet for managing booking service charges"""
    serializer_class = BookingServiceChargeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = BookingServiceCharge.objects.all().select_related('booking', 'service', 'added_by')

        # Filter by booking
        booking_id = self.request.query_params.get('booking')
        if booking_id:
            queryset = queryset.filter(booking_id=booking_id)

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        service = serializer.validated_data.get('service')
        quantity = serializer.validated_data.get('quantity', 1)
        persons = serializer.validated_data.get('persons', 1)
        days = serializer.validated_data.get('days', 1)

        # Calculate total price based on pricing type
        unit_price = service.price
        if service.pricing_type == 'per_booking':
            total_price = unit_price * quantity
        elif service.pricing_type == 'per_person':
            total_price = unit_price * persons * quantity
        elif service.pricing_type == 'per_person_per_day':
            total_price = unit_price * persons * days * quantity
        elif service.pricing_type == 'per_day':
            total_price = unit_price * days * quantity
        else:
            total_price = unit_price * quantity

        serializer.save(
            added_by=self.request.user,
            service_name=service.name,
            unit_price=unit_price,
            total_price=total_price
        )

    @action(detail=False, methods=['get'])
    def available_services(self, request):
        """Get available ancillary services"""
        hotel_id = request.query_params.get('hotel')

        queryset = AncillaryService.objects.filter(is_active=True)
        if hotel_id:
            queryset = queryset.filter(hotel_id=hotel_id)

        services = queryset.values(
            'id', 'name', 'service_type', 'description',
            'price', 'pricing_type', 'hotel__name'
        )

        return Response(list(services))


class SavedCardViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing saved payment cards.

    Users can:
    - List their saved cards
    - Add a new card
    - Update card preferences (nickname, default)
    - Delete a saved card
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return only cards belonging to the current user"""
        return SavedCard.objects.filter(
            user=self.request.user,
            is_active=True
        ).order_by('-is_default', '-created_at')

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return SavedCardCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return SavedCardUpdateSerializer
        return SavedCardSerializer

    def perform_destroy(self, instance):
        """Soft delete by marking as inactive"""
        instance.is_active = False
        instance.save()

    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set a card as the default payment method"""
        card = self.get_object()
        card.is_default = True
        card.save()
        return Response(SavedCardSerializer(card).data)

    @action(detail=False, methods=['get'])
    def default(self, request):
        """Get the user's default card"""
        try:
            card = SavedCard.objects.get(
                user=request.user,
                is_default=True,
                is_active=True
            )
            return Response(SavedCardSerializer(card).data)
        except SavedCard.DoesNotExist:
            return Response(
                {'error': 'No default card set'},
                status=status.HTTP_404_NOT_FOUND
            )
