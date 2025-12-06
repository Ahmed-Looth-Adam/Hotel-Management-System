from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    """Extended User model with additional fields"""
    
    ROLE_CHOICES = [
        ('guest', 'Guest'),
        ('staff', 'Front Desk Staff'),
        ('manager', 'Hotel Manager'),
        ('admin', 'Administrator'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='guest')
    phone_number = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    
    # Security fields
    failed_login_attempts = models.IntegerField(default=0)
    account_locked_until = models.DateTimeField(null=True, blank=True)
    last_password_change = models.DateTimeField(default=timezone.now)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    def is_account_locked(self):
        """Check if account is currently locked"""
        if self.account_locked_until:
            return timezone.now() < self.account_locked_until
        return False


class LoginAuditLog(models.Model):
    """
    Audit log for login events
    Tracks all authentication attempts for security monitoring and compliance

    Edited By:
    -> Ismail Wasiu Abdul Samad, UWE ID: 24050765
    """

    EVENT_TYPES = [
        ('login_success', 'Login Success'),
        ('login_failed', 'Login Failed'),
        ('account_locked', 'Account Locked'),
        ('logout', 'Logout'),
        ('token_refresh', 'Token Refresh')
    ]

    # Event details
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES, db_index=True)
    username = models.CharField(max_length=150, db_index=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')

    # Request information
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    # Additional context
    success = models.BooleanField(default=False)
    failure_reason = models.CharField(max_length=255, blank=True)
    failed_attempts_count = models.IntegerField(null=True, blank=True)

    # Timestamp
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp', 'event_type']),
            models.Index(fields=['username', '-timestamp']),
        ]
        verbose_name = 'Login Audit Log'
        verbose_name_plural = 'Login Audit Logs'

    def __str__(self):
        return f"{self.event_type} - {self.username} at {self.timestamp}"