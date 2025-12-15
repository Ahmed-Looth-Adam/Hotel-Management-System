"""
Django Admin Configuration for Authentication App

Edited By:
-> Ismail Wasiu Abdul Samad, UWE ID: 24050765
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, LoginAuditLog


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User admin"""
    list_display = ('username', 'email', 'role', 'is_active', 'failed_login_attempts', 'last_login')
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'first_name', 'last_name')

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('role', 'phone_number', 'date_of_birth', 'address', 'city', 'country', 'postal_code')
        }),
        ('Security', {
            'fields': ('failed_login_attempts', 'account_locked_until', 'last_password_change')
        }),
    )


@admin.register(LoginAuditLog)
class LoginAuditLogAdmin(admin.ModelAdmin):
    """Admin interface for Login Audit Logs"""

    list_display = (
        'timestamp',
        'event_type_badge',
        'username',
        'ip_address',
        'success_badge',
        'failed_attempts_count',
        'failure_reason'
    )

    list_filter = (
        'event_type',
        'success',
        'timestamp',
    )

    search_fields = (
        'username',
        'ip_address',
        'user_agent',
        'failure_reason',
    )

    readonly_fields = (
        'event_type',
        'username',
        'user',
        'ip_address',
        'user_agent',
        'success',
        'failure_reason',
        'failed_attempts_count',
        'timestamp',
    )

    date_hierarchy = 'timestamp'

    def has_add_permission(self, request):
        """Disable manual creation of audit logs"""
        return False

    def has_delete_permission(self, request, obj=None):
        """Disable deletion of audit logs"""
        return False

    def event_type_badge(self, obj):
        """Display event type with color coding"""
        colors = {
            'login_success': '#28a745',
            'login_failed': '#dc3545',
            'account_locked': '#fd7e14',
            'logout': '#6c757d',
            'token_refresh': '#17a2b8',
        }
        color = colors.get(obj.event_type, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_event_type_display()
        )
    event_type_badge.short_description = 'Event Type'

    def success_badge(self, obj):
        """Display success status with color coding"""
        if obj.success:
            return format_html('<span style="color: green;">✓ Success</span>')
        return format_html('<span style="color: red;">✗ Failed</span>')
    success_badge.short_description = 'Status'

    class Meta:
        ordering = ['-timestamp']
