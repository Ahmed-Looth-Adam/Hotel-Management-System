"""
Core Serializers - Notification serialization

Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
"""

from rest_framework import serializers
from .models import Notification, NotificationRead


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications with read status."""

    is_read = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id',
            'notification_type',
            'title',
            'message',
            'link',
            'created_at',
            'is_read',
            'time_ago',
            'target_hotel',
            'related_booking',
        ]
        read_only_fields = fields

    def get_is_read(self, obj):
        """Check if current user has read this notification."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return NotificationRead.objects.filter(
                notification=obj,
                user=request.user
            ).exists()
        return False

    def get_time_ago(self, obj):
        """Return human-readable time difference."""
        from django.utils import timezone
        from datetime import timedelta

        now = timezone.now()
        diff = now - obj.created_at

        if diff < timedelta(minutes=1):
            return 'Just now'
        elif diff < timedelta(hours=1):
            mins = int(diff.total_seconds() / 60)
            return f'{mins} min{"s" if mins > 1 else ""} ago'
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f'{hours} hour{"s" if hours > 1 else ""} ago'
        elif diff < timedelta(days=7):
            days = diff.days
            return f'{days} day{"s" if days > 1 else ""} ago'
        else:
            return obj.created_at.strftime('%d %b %Y')
