"""
Core Admin - Notification management

Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
"""

from django.contrib import admin
from .models import Notification, NotificationRead, AuditLog


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'notification_type', 'target_role', 'target_hotel', 'created_at']
    list_filter = ['notification_type', 'target_role', 'target_hotel', 'created_at']
    search_fields = ['title', 'message']
    ordering = ['-created_at']
    readonly_fields = ['created_at']


@admin.register(NotificationRead)
class NotificationReadAdmin(admin.ModelAdmin):
    list_display = ['notification', 'user', 'read_at']
    list_filter = ['read_at']
    search_fields = ['notification__title', 'user__username']
    ordering = ['-read_at']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['actor', 'target_user', 'description', 'action_time']
    list_filter = ['action_time']
    search_fields = ['actor__username', 'target_user__username', 'description']
    ordering = ['-action_time']
    readonly_fields = ['actor', 'target_user', 'action_time', 'description']
