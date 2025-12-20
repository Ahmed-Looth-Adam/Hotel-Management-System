"""
Core Views - Notification API endpoints

Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
"""

from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Notification, NotificationRead
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for managing notifications.

    Notifications are filtered based on:
    - User's role (admin sees all, manager/staff see their hotel's)
    - Target role of the notification
    - Target hotel (for managers/staff)
    """

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filter notifications based on user role and assigned hotel.
        """
        user = self.request.user
        user_role = user.role

        # Base queryset
        queryset = Notification.objects.all()

        # Admins see all notifications targeted to admin or all
        if user_role == 'admin':
            queryset = queryset.filter(
                Q(target_role='admin') | Q(target_role='all')
            )

        # Managers see notifications for their hotel + all manager notifications
        elif user_role == 'manager':
            hotel_filter = Q(target_hotel__isnull=True) | Q(target_hotel=user.assigned_hotel)
            role_filter = Q(target_role='manager') | Q(target_role='all')
            queryset = queryset.filter(hotel_filter & role_filter)

        # Staff see notifications for their hotel + all staff notifications
        elif user_role == 'staff':
            hotel_filter = Q(target_hotel__isnull=True) | Q(target_hotel=user.assigned_hotel)
            role_filter = Q(target_role='staff') | Q(target_role='all')
            queryset = queryset.filter(hotel_filter & role_filter)

        # Guests don't see staff notifications
        else:
            return Notification.objects.none()

        # Also include notifications specifically targeted to this user
        queryset = queryset | Notification.objects.filter(target_user=user)

        return queryset.distinct().order_by('-created_at')[:50]

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications for the current user."""
        queryset = self.get_queryset()
        read_ids = NotificationRead.objects.filter(
            user=request.user
        ).values_list('notification_id', flat=True)

        unread_count = queryset.exclude(id__in=read_ids).count()

        return Response({'unread_count': unread_count})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a specific notification as read."""
        notification = self.get_object()

        NotificationRead.objects.get_or_create(
            notification=notification,
            user=request.user
        )

        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read for the current user."""
        queryset = self.get_queryset()

        # Get notifications not yet read
        read_ids = NotificationRead.objects.filter(
            user=request.user
        ).values_list('notification_id', flat=True)

        unread = queryset.exclude(id__in=read_ids)

        # Create read records for all unread
        read_records = [
            NotificationRead(notification=n, user=request.user)
            for n in unread
        ]
        NotificationRead.objects.bulk_create(read_records, ignore_conflicts=True)

        return Response({'status': 'all marked as read'})

    @action(detail=False, methods=['post'])
    def clear_all(self, request):
        """
        Clear all notifications for the current user.
        This marks them as read (doesn't delete them).
        """
        return self.mark_all_read(request)
