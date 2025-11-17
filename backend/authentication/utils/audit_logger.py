"""
Audit Logger for Login Events
Provides centralized logging for authentication events

Edited By:
-> Ismail Wasiu Abdul Samad, UWE ID: 24050765
"""

from django.contrib.auth import get_user_model
from authentication.models import LoginAuditLog


User = get_user_model()


class AuditLogger:
    """Centralized audit logging for authentication events"""

    @staticmethod
    def _get_client_ip(request):
        """Extract client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    @staticmethod
    def _get_user_agent(request):
        """Extract user agent from request"""
        return request.META.get('HTTP_USER_AGENT', '')[:500]  # Limit to 500 chars

    @classmethod
    def log_login_success(cls, request, user):
        """
        Log successful login attempt

        Args:
            request: Django request object
            user: User instance
        """
        LoginAuditLog.objects.create(
            event_type='login_success',
            username=user.username,
            user=user,
            ip_address=cls._get_client_ip(request),
            user_agent=cls._get_user_agent(request),
            success=True
        )

    @classmethod
    def log_login_failed(cls, request, username, reason='Invalid credentials', failed_attempts=None):
        """
        Log failed login attempt

        Args:
            request: Django request object
            username: Attempted username
            reason: Reason for failure
            failed_attempts: Number of failed attempts
        """
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            user = None

        LoginAuditLog.objects.create(
            event_type='login_failed',
            username=username,
            user=user,
            ip_address=cls._get_client_ip(request),
            user_agent=cls._get_user_agent(request),
            success=False,
            failure_reason=reason,
            failed_attempts_count=failed_attempts
        )

    @classmethod
    def log_account_locked(cls, request, username, failed_attempts=None):
        """
        Log account lockout event

        Args:
            request: Django request object
            username: Username that was locked
            failed_attempts: Number of failed attempts that triggered lockout
        """
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            user = None

        LoginAuditLog.objects.create(
            event_type='account_locked',
            username=username,
            user=user,
            ip_address=cls._get_client_ip(request),
            user_agent=cls._get_user_agent(request),
            success=False,
            failure_reason='Account locked due to multiple failed attempts',
            failed_attempts_count=failed_attempts
        )

    @classmethod
    def log_logout(cls, request, user):
        """
        Log logout event

        Args:
            request: Django request object
            user: User instance
        """
        LoginAuditLog.objects.create(
            event_type='logout',
            username=user.username if hasattr(user, 'username') else 'unknown',
            user=user if hasattr(user, 'id') else None,
            ip_address=cls._get_client_ip(request),
            user_agent=cls._get_user_agent(request),
            success=True
        )

    @classmethod
    def log_token_refresh(cls, request, user):
        """
        Log token refresh event

        Args:
            request: Django request object
            user: User instance
        """
        LoginAuditLog.objects.create(
            event_type='token_refresh',
            username=user.username,
            user=user,
            ip_address=cls._get_client_ip(request),
            user_agent=cls._get_user_agent(request),
            success=True
        )

    @classmethod
    def get_recent_logs(cls, username=None, limit=50):
        """
        Get recent audit logs

        Args:
            username: Filter by username (optional)
            limit: Maximum number of logs to return

        Returns:
            QuerySet of LoginAuditLog objects
        """
        logs = LoginAuditLog.objects.all()

        if username:
            logs = logs.filter(username=username)

        return logs[:limit]

    @classmethod
    def get_failed_attempts(cls, username, hours=24):
        """
        Get failed login attempts for a username in the last N hours

        Args:
            username: Username to check
            hours: Number of hours to look back

        Returns:
            QuerySet of failed login attempts
        """
        from django.utils import timezone
        from datetime import timedelta

        since = timezone.now() - timedelta(hours=hours)

        return LoginAuditLog.objects.filter(
            username=username,
            event_type='login_failed',
            timestamp__gte=since
        )

    @classmethod
    def get_suspicious_activity(cls, threshold=5, hours=1):
        """
        Get usernames with suspicious activity (many failed attempts)

        Args:
            threshold: Minimum failed attempts to be considered suspicious
            hours: Time window in hours

        Returns:
            List of dictionaries with username and attempt count
        """
        from django.utils import timezone
        from datetime import timedelta
        from django.db.models import Count

        since = timezone.now() - timedelta(hours=hours)

        suspicious = LoginAuditLog.objects.filter(
            event_type='login_failed',
            timestamp__gte=since
        ).values('username').annotate(
            attempt_count=Count('id')
        ).filter(
            attempt_count__gte=threshold
        ).order_by('-attempt_count')

        return list(suspicious)
