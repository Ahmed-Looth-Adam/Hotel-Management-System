"""
Password Expiration Middleware

Checks if staff/manager/admin users have expired passwords (older than 6 months)
and returns a 403 response requiring password change.

Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
"""

from django.utils import timezone
from django.http import JsonResponse
from datetime import timedelta


class PasswordExpirationMiddleware:
    """
    Middleware to enforce password expiration policy for staff users.

    Staff, managers, and admins must change their password every 6 months.
    If the password is expired, all API requests (except password change
    and authentication endpoints) will return a 403 response.
    """

    # Endpoints that are allowed even with expired password
    EXEMPT_PATHS = [
        '/auth/login/',
        '/auth/logout/',
        '/auth/change-password/',
        '/auth/token/refresh/',
        '/auth/password-reset/',
        '/auth/password-reset-confirm/',
        '/auth/password-status/',
        '/auth/2fa/',  # All 2FA endpoints are exempt
        '/api/schema/',
        '/admin/',
    ]

    # Roles that require password expiration check
    ENFORCED_ROLES = ['staff', 'manager', 'admin']

    # Password expiration period (6 months = 180 days)
    EXPIRATION_DAYS = 180

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check password expiration for authenticated users
        if hasattr(request, 'user') and request.user.is_authenticated:
            user = request.user

            # Only enforce for staff roles
            if hasattr(user, 'role') and user.role in self.ENFORCED_ROLES:
                # Check if path is exempt
                if not self._is_exempt_path(request.path):
                    # Check if password is expired
                    if self._is_password_expired(user):
                        return JsonResponse({
                            'error': 'Password expired',
                            'code': 'PASSWORD_EXPIRED',
                            'message': 'Your password has expired. Please change your password to continue.',
                            'password_expired': True,
                            'last_password_change': user.last_password_change.isoformat() if user.last_password_change else None,
                        }, status=403)

        response = self.get_response(request)
        return response

    def _is_exempt_path(self, path):
        """Check if the request path is exempt from password expiration check"""
        for exempt_path in self.EXEMPT_PATHS:
            if path.startswith(exempt_path):
                return True
        return False

    def _is_password_expired(self, user):
        """Check if user's password has expired (older than 6 months)"""
        if not user.last_password_change:
            # If no password change recorded, consider it expired
            return True

        expiration_date = user.last_password_change + timedelta(days=self.EXPIRATION_DAYS)
        return timezone.now() > expiration_date
