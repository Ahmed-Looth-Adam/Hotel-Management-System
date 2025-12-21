# Edited By
# -> Ismail Wasiu Abdul Samad, UWE ID: 24050765

import uuid
from decimal import Decimal
from datetime import date, timedelta
from django.db import models
from django.conf import settings
from django.utils import timezone
from core.fields import EncryptedCharField


class Payment(models.Model):
    """Payment transactions for bookings"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('partially_refunded', 'Partially Refunded'),
    ]

    booking = models.ForeignKey('bookings.Booking', on_delete=models.CASCADE, related_name='payments')
    payment_reference = models.CharField(max_length=50, unique=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='GBP')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')

    # Transaction details
    transaction_id = models.CharField(max_length=100, blank=True)
    gateway_response = models.JSONField(null=True, blank=True)

    # Metadata
    description = models.TextField(blank=True)
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_payments'
    )
    processed_at = models.DateTimeField(null=True, blank=True)

    # Refund tracking
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    refund_reason = models.TextField(blank=True)
    refunded_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment {self.payment_reference} - {self.currency} {self.amount} ({self.status})"

    def save(self, *args, **kwargs):
        if not self.payment_reference:
            self.payment_reference = self.generate_payment_reference()
        super().save(*args, **kwargs)

    @staticmethod
    def generate_payment_reference():
        """Generate a unique payment reference"""
        while True:
            reference = f"PAY-{uuid.uuid4().hex[:10].upper()}"
            if not Payment.objects.filter(payment_reference=reference).exists():
                return reference

    def process_payment(self, staff_user=None):
        """Mark payment as completed"""
        self.status = 'completed'
        self.processed_at = timezone.now()
        if staff_user:
            self.processed_by = staff_user
        self.save()

        # Update booking payment status
        self._update_booking_payment_status()
        return True

    def process_refund(self, amount, reason, staff_user=None):
        """Process a refund"""
        if amount > (self.amount - self.refund_amount):
            raise ValueError("Refund amount exceeds available amount")

        self.refund_amount += Decimal(str(amount))
        self.refund_reason = reason
        self.refunded_at = timezone.now()

        if self.refund_amount >= self.amount:
            self.status = 'refunded'
        else:
            self.status = 'partially_refunded'

        self.save()
        return True

    def _update_booking_payment_status(self):
        """Update the associated booking's payment status"""
        booking = self.booking
        total_paid = sum(
            p.amount - p.refund_amount
            for p in booking.payments.filter(status__in=['completed', 'partially_refunded'])
        )

        if total_paid >= booking.total_price:
            booking.payment_status = 'paid'
        elif total_paid > 0:
            booking.payment_status = 'partial'
        else:
            booking.payment_status = 'pending'
        booking.save()


class Invoice(models.Model):
    """Invoice for bookings with itemized charges"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('issued', 'Issued'),
        ('paid', 'Paid'),
        ('partially_paid', 'Partially Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]

    booking = models.ForeignKey('bookings.Booking', on_delete=models.CASCADE, related_name='invoices')
    invoice_number = models.CharField(max_length=50, unique=True, blank=True)

    # Amounts
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='GBP')

    # Status and dates
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    issued_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)

    # Guest information (snapshot at invoice creation)
    guest_name = models.CharField(max_length=200)
    guest_email = models.EmailField()
    guest_address = models.TextField(blank=True)

    # Hotel information
    hotel_name = models.CharField(max_length=200)
    hotel_address = models.TextField()

    # Notes
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.currency} {self.total_amount}"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = self.generate_invoice_number()
        super().save(*args, **kwargs)

    @staticmethod
    def generate_invoice_number():
        """Generate a unique invoice number"""
        today = date.today()
        prefix = f"INV-{today.strftime('%Y%m')}"

        # Find the last invoice number for this month
        last_invoice = Invoice.objects.filter(
            invoice_number__startswith=prefix
        ).order_by('-invoice_number').first()

        if last_invoice:
            try:
                last_num = int(last_invoice.invoice_number.split('-')[-1])
                new_num = last_num + 1
            except ValueError:
                new_num = 1
        else:
            new_num = 1

        return f"{prefix}-{new_num:04d}"

    def calculate_totals(self):
        """Recalculate invoice totals from line items"""
        items = self.items.all()
        self.subtotal = sum(item.total_price for item in items)
        self.total_amount = self.subtotal + self.tax_amount - self.discount_amount
        self.save()

    def issue(self):
        """Issue the invoice"""
        self.status = 'issued'
        self.issued_date = date.today()
        if not self.due_date:
            self.due_date = date.today() + timedelta(days=14)
        self.save()

    def mark_paid(self, amount=None):
        """Mark invoice as paid"""
        if amount:
            self.amount_paid += Decimal(str(amount))
        else:
            self.amount_paid = self.total_amount

        if self.amount_paid >= self.total_amount:
            self.status = 'paid'
        else:
            self.status = 'partially_paid'
        self.save()

    @property
    def balance_due(self):
        """Calculate remaining balance"""
        return self.total_amount - self.amount_paid


class InvoiceItem(models.Model):
    """Individual line items on an invoice"""
    ITEM_TYPE_CHOICES = [
        ('room_charge', 'Room Charge'),
        ('ancillary_service', 'Ancillary Service'),
        ('cancellation_fee', 'Cancellation Fee'),
        ('late_checkout', 'Late Checkout'),
        ('damage_charge', 'Damage Charge'),
        ('minibar', 'Minibar'),
        ('other', 'Other'),
    ]

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    item_type = models.CharField(max_length=50, choices=ITEM_TYPE_CHOICES)
    description = models.CharField(max_length=500)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField(null=True, blank=True)

    # Reference to related objects
    service = models.ForeignKey(
        'hotels.AncillaryService',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoice_items'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['item_type', 'created_at']

    def __str__(self):
        return f"{self.description} - {self.total_price}"

    def save(self, *args, **kwargs):
        if not self.total_price:
            self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)


class BookingServiceCharge(models.Model):
    """Track ancillary services added to a booking"""
    booking = models.ForeignKey('bookings.Booking', on_delete=models.CASCADE, related_name='service_charges')
    service = models.ForeignKey('hotels.AncillaryService', on_delete=models.SET_NULL, null=True, related_name='booking_charges')
    service_name = models.CharField(max_length=200)  # Snapshot of service name
    quantity = models.PositiveIntegerField(default=1)
    persons = models.PositiveIntegerField(default=1)
    days = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    date_added = models.DateField(auto_now_add=True)
    notes = models.TextField(blank=True)
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='added_service_charges'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.service_name} x{self.quantity} - {self.booking.booking_reference}"

    def save(self, *args, **kwargs):
        if self.service and not self.service_name:
            self.service_name = self.service.name
        if self.service and not self.unit_price:
            self.unit_price = self.service.price
        if not self.total_price:
            self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)


class CancellationFee(models.Model):
    """Track cancellation fees for cancelled bookings"""
    FEE_TYPE_CHOICES = [
        ('free', 'Free Cancellation'),
        ('partial', 'Partial Fee'),
        ('full_first_night', 'Full First Night'),
        ('full_booking', 'Full Booking Value'),
    ]

    booking = models.OneToOneField('bookings.Booking', on_delete=models.CASCADE, related_name='cancellation_fee')
    fee_type = models.CharField(max_length=30, choices=FEE_TYPE_CHOICES)
    fee_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2)
    first_night_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    days_before_checkin = models.IntegerField()
    cancellation_date = models.DateTimeField()
    waived = models.BooleanField(default=False)
    waived_reason = models.TextField(blank=True)
    waived_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='waived_cancellations'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Cancellation Fee - {self.booking.booking_reference} - {self.fee_amount}"

    @classmethod
    def calculate_fee(cls, booking):
        """
        Calculate cancellation fee based on the specification:
        - More than 14 days before check-in: Free
        - 3-14 days before check-in: 50% of first night
        - Less than 72 hours (3 days) before check-in: 100% of first night
        - No-show: 100% of entire booking value
        """
        from hotels.services.pricing_calculator import PricingCalculator

        check_in_date = booking.check_in_date
        cancellation_date = timezone.now()
        days_before = (check_in_date - cancellation_date.date()).days

        # Get first night rate
        calculator = PricingCalculator()
        try:
            pricing = calculator.calculate_price(
                room_id=booking.room.id,
                check_in=booking.check_in_date,
                check_out=booking.check_in_date + timedelta(days=1)
            )
            first_night_rate = Decimal(str(pricing.get('total_price', 0)))
        except Exception:
            first_night_rate = booking.total_price / booking.number_of_nights if booking.number_of_nights > 0 else booking.total_price

        total_booking_value = booking.total_price

        # Determine fee based on days before check-in
        if days_before > 14:
            fee_type = 'free'
            fee_percentage = Decimal('0')
            fee_amount = Decimal('0')
        elif 3 <= days_before <= 14:
            fee_type = 'partial'
            fee_percentage = Decimal('50')
            fee_amount = first_night_rate * Decimal('0.5')
        elif 0 < days_before < 3:
            fee_type = 'full_first_night'
            fee_percentage = Decimal('100')
            fee_amount = first_night_rate
        else:  # No-show or past check-in date
            fee_type = 'full_booking'
            fee_percentage = Decimal('100')
            fee_amount = total_booking_value

        return {
            'fee_type': fee_type,
            'fee_percentage': fee_percentage,
            'fee_amount': fee_amount,
            'first_night_rate': first_night_rate,
            'days_before_checkin': days_before,
            'cancellation_date': cancellation_date,
        }

    @classmethod
    def create_for_booking(cls, booking, is_no_show=False):
        """Create a cancellation fee record for a booking"""
        if is_no_show:
            fee_data = {
                'fee_type': 'full_booking',
                'fee_percentage': Decimal('100'),
                'fee_amount': booking.total_price,
                'first_night_rate': booking.total_price / booking.number_of_nights if booking.number_of_nights > 0 else booking.total_price,
                'days_before_checkin': 0,
                'cancellation_date': timezone.now(),
            }
        else:
            fee_data = cls.calculate_fee(booking)

        return cls.objects.create(
            booking=booking,
            **fee_data
        )


class SavedCard(models.Model):
    """
    Saved payment cards for guests.

    For security (PCI compliance), we store:
    - Last 4 digits only (for display purposes)
    - Card type (for icon display)
    - Encrypted cardholder name
    - Encrypted expiry date
    - A unique token identifier (encrypted)

    We NEVER store:
    - Full card number
    - CVV/CVC
    """
    CARD_TYPE_CHOICES = [
        ('visa', 'Visa'),
        ('mastercard', 'Mastercard'),
        ('amex', 'American Express'),
        ('discover', 'Discover'),
        ('unknown', 'Unknown'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='saved_cards'
    )

    # Card display info (not sensitive)
    card_type = models.CharField(max_length=20, choices=CARD_TYPE_CHOICES, default='unknown')
    last_four = models.CharField(max_length=4)
    card_nickname = models.CharField(max_length=50, blank=True)

    # Encrypted sensitive data (max_length must accommodate encrypted values ~150+ chars)
    cardholder_name = EncryptedCharField(max_length=255)
    expiry_month = EncryptedCharField(max_length=255)  # Stored as "01"-"12"
    expiry_year = EncryptedCharField(max_length=255)   # Stored as "25", "26", etc.
    card_token = EncryptedCharField(max_length=500)    # Unique token for this card

    # Status
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_default', '-created_at']

    def __str__(self):
        return f"{self.get_card_type_display()} ending in {self.last_four}"

    def save(self, *args, **kwargs):
        # If this card is set as default, unset any other default cards for this user
        if self.is_default:
            SavedCard.objects.filter(
                user=self.user,
                is_default=True
            ).exclude(pk=self.pk).update(is_default=False)

        # Generate card token if not provided
        if not self.card_token:
            self.card_token = str(uuid.uuid4())

        super().save(*args, **kwargs)

    @property
    def display_name(self):
        """Return a display-friendly name for the card"""
        if self.card_nickname:
            return self.card_nickname
        return f"{self.get_card_type_display()} ****{self.last_four}"

    @property
    def expiry_display(self):
        """Return formatted expiry date for display"""
        return f"{self.expiry_month}/{self.expiry_year}"

    @property
    def is_expired(self):
        """Check if the card has expired"""
        from datetime import datetime
        try:
            exp_month = int(self.expiry_month)
            exp_year = int('20' + self.expiry_year)
            now = datetime.now()
            # Card expires at the end of the expiry month
            return (exp_year < now.year) or (exp_year == now.year and exp_month < now.month)
        except (ValueError, TypeError):
            return True

    @classmethod
    def detect_card_type(cls, card_number):
        """Detect card type from card number prefix"""
        num = card_number.replace(' ', '').replace('-', '')
        if num.startswith('4'):
            return 'visa'
        elif num.startswith(('51', '52', '53', '54', '55')) or (
            len(num) >= 4 and 2221 <= int(num[:4]) <= 2720
        ):
            return 'mastercard'
        elif num.startswith(('34', '37')):
            return 'amex'
        elif num.startswith(('6011', '65')) or (
            len(num) >= 6 and 622126 <= int(num[:6]) <= 622925
        ):
            return 'discover'
        return 'unknown'
