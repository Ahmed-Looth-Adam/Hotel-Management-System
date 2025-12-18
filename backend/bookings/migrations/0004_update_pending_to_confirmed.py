# Generated migration to update pending bookings to confirmed
# Since payment is processed at booking time, pending status is no longer used

from django.db import migrations


def update_pending_to_confirmed(apps, schema_editor):
    """Update all bookings with 'pending' status to 'confirmed'"""
    Booking = apps.get_model('bookings', 'Booking')
    updated_count = Booking.objects.filter(status='pending').update(status='confirmed')
    if updated_count > 0:
        print(f"\n  Updated {updated_count} booking(s) from 'pending' to 'confirmed'")


def reverse_update(apps, schema_editor):
    """Reverse migration - no action needed as we can't determine original pending bookings"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0003_booking_room_type_requested_alter_booking_room_and_more'),
    ]

    operations = [
        migrations.RunPython(update_pending_to_confirmed, reverse_update),
    ]
