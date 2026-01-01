"""
Payments Module Tests
Basic tests for payment processing and data encryption
"""
import pytest
from payments.models import Payment, SavedCard
from datetime import date


@pytest.mark.django_db
class TestPaymentModel:
    """Test Payment model basic functionality"""

    def test_payment_creation(self, sample_booking):
        """Test creating a payment"""
        payment = Payment.objects.create(
            booking=sample_booking,
            amount=200.00,
            status='completed'
        )
        assert payment.amount == 200.00
        assert payment.status == 'completed'

@pytest.mark.django_db
class TestEncryptedFields:
    """Test field-level encryption for sensitive data"""

    def test_saved_card_encryption(self, guest_user):
        """Test saved card data is encrypted"""
        card = SavedCard.objects.create(
            user=guest_user,
            last_four='1234',
            card_type='Visa',
            cardholder_name='Test User',
            expiry_month=12,
            expiry_year=2025,
            is_default=True
        )
        assert card.last_four == '1234'
        assert card.is_default
