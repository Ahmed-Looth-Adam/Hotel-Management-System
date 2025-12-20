from django.db import models
from django.conf import settings

# Create your models here.


class Notification(models.Model):
    """
    Notification model for staff/manager/admin alerts.

    Types:
    - new_booking: New booking created
    - booking_cancelled: Booking was cancelled
    - check_in_today: Guest checking in today
    - check_out_today: Guest checking out today
    - payment_received: Payment was processed
    """

    NOTIFICATION_TYPES = [
        ('new_booking', 'New Booking'),
        ('booking_cancelled', 'Booking Cancelled'),
        ('check_in_today', 'Check-in Today'),
        ('check_out_today', 'Check-out Today'),
        ('payment_received', 'Payment Received'),
        ('user_created', 'User Created'),
        ('user_deleted', 'User Deleted'),
        ('hotel_created', 'Hotel Created'),
        ('hotel_deleted', 'Hotel Deleted'),
        ('system', 'System Notification'),
    ]

    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('staff', 'Staff'),
        ('all', 'All Staff'),
    ]

    # Target audience
    target_role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='all')
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
        help_text='Specific user target. If null, uses target_role.'
    )
    target_hotel = models.ForeignKey(
        'hotels.Hotel',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
        help_text='Filter notifications by hotel for managers/staff.'
    )

    # Notification content
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    link = models.CharField(max_length=255, null=True, blank=True)

    # Related objects
    related_booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications'
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        indexes = [
            models.Index(fields=['target_role', 'target_hotel', '-created_at']),
            models.Index(fields=['notification_type', '-created_at']),
        ]

    def __str__(self):
        return f'{self.notification_type}: {self.title}'


class NotificationRead(models.Model):
    """Tracks which users have read which notifications."""

    notification = models.ForeignKey(
        Notification,
        on_delete=models.CASCADE,
        related_name='read_by'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='read_notifications'
    )
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['notification', 'user']
        verbose_name = 'Notification Read Status'
        verbose_name_plural = 'Notification Read Statuses'

    def __str__(self):
        return f'{self.user.username} read {self.notification.title}'


class AuditLog(models.Model):
    """Stores administrative actions taken on user accounts."""

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='actions_performed', 
    )
    
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='profile_audits', 
    )
    
    action_time = models.DateTimeField(auto_now_add=True)
    description = models.TextField()
    
    class Meta:
        ordering = ['-action_time']
        verbose_name = "Audit Log Entry"
        verbose_name_plural = "Audit Log Entries"
    
    def __str__(self):
        return f'{self.actor.username} {self.description} on {self.target_user.username} at {self.action_time.strftime("%Y-%m-%d %H:%M")}'