from django.dispatch import Signal
from .models import AuditLog, Notification


admin_action_performed = Signal(
    ['actor', 'target_user', 'description']
)

profile_updated = Signal(
    ['user', 'description']
)

# Booking-related signals
booking_created = Signal(['booking'])
booking_cancelled = Signal(['booking'])
booking_checked_in = Signal(['booking'])
booking_checked_out = Signal(['booking'])

def log_admin_action(sender, actor, target_user, description, **kwargs):
    """Saves an audit log entry when the admin_action_performed signal is received."""
    AuditLog.objects.create(
        actor=actor,
        target_user=target_user,
        description=description
    )

def log_user_action(sender, user, description, **kwargs):
    """Saves an AuditLog entry when profile_updated is triggered."""
    # Note: For self-updates, actor and target_user are the same.
    AuditLog.objects.create(
        actor=user,
        target_user=user,
        description=f'[USER ACTION] {description}'
    )

admin_action_performed.connect(log_admin_action)
profile_updated.connect(log_user_action)


# ============ Notification Signal Handlers ============

def create_booking_notification(sender, booking, **kwargs):
    """Create notification when a new booking is made."""
    guest_name = f"{booking.user.first_name} {booking.user.last_name}".strip() or booking.user.username
    hotel_name = booking.hotel.name if booking.hotel else "Unknown Hotel"

    Notification.objects.create(
        notification_type='new_booking',
        title='New Booking',
        message=f'{guest_name} booked {booking.room.room_number} at {hotel_name} ({booking.check_in_date} - {booking.check_out_date})',
        link=f'/bookings/{booking.id}',
        target_role='all',
        target_hotel=booking.hotel,
        related_booking=booking,
    )


def create_cancellation_notification(sender, booking, **kwargs):
    """Create notification when a booking is cancelled."""
    guest_name = f"{booking.user.first_name} {booking.user.last_name}".strip() or booking.user.username
    hotel_name = booking.hotel.name if booking.hotel else "Unknown Hotel"

    Notification.objects.create(
        notification_type='booking_cancelled',
        title='Booking Cancelled',
        message=f'{guest_name} cancelled booking for {booking.room.room_number} at {hotel_name} ({booking.check_in_date})',
        link=f'/bookings/{booking.id}',
        target_role='all',
        target_hotel=booking.hotel,
        related_booking=booking,
    )


def create_checkin_notification(sender, booking, **kwargs):
    """Create notification when a guest checks in."""
    guest_name = f"{booking.user.first_name} {booking.user.last_name}".strip() or booking.user.username

    Notification.objects.create(
        notification_type='check_in_today',
        title='Guest Checked In',
        message=f'{guest_name} has checked in to room {booking.room.room_number}',
        link=f'/bookings/{booking.id}',
        target_role='all',
        target_hotel=booking.hotel,
        related_booking=booking,
    )


def create_checkout_notification(sender, booking, **kwargs):
    """Create notification when a guest checks out."""
    guest_name = f"{booking.user.first_name} {booking.user.last_name}".strip() or booking.user.username

    Notification.objects.create(
        notification_type='check_out_today',
        title='Guest Checked Out',
        message=f'{guest_name} has checked out from room {booking.room.room_number}',
        link=f'/bookings/{booking.id}',
        target_role='all',
        target_hotel=booking.hotel,
        related_booking=booking,
    )


# Connect booking signals
booking_created.connect(create_booking_notification)
booking_cancelled.connect(create_cancellation_notification)
booking_checked_in.connect(create_checkin_notification)
booking_checked_out.connect(create_checkout_notification)