# Generated migration to update pending payment status to paid
# Since payment is processed at booking time, pending payment status is no longer used

from django.db import migrations


def update_pending_payment_to_paid(apps, schema_editor):
    """Update all bookings with 'pending' payment_status to 'paid'"""
    Booking = apps.get_model('bookings', 'Booking')
    updated_count = Booking.objects.filter(payment_status='pending').update(payment_status='paid')
    if updated_count > 0:
        print(f"\n  Updated {updated_count} booking(s) payment status from 'pending' to 'paid'")


def reverse_update(apps, schema_editor):
    """Reverse migration - no action needed"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0004_update_pending_to_confirmed'),
    ]

    operations = [
        migrations.RunPython(update_pending_payment_to_paid, reverse_update),
    ]
