"""
Redis-based login attempt tracker for security
Tracks failed login attempts and implements account lockout
"""

from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta


class LoginAttemptTracker:
    """
    Tracks login attempts using Redis cache for performance and scalability.

    Features:
    - Tracks failed login attempts per username
    - Implements account lockout after max attempts
    - Automatic expiration of tracking data
    - IP-based tracking (optional)
    """

    # Configuration
    MAX_ATTEMPTS = 5  # Maximum failed attempts before lockout
    LOCKOUT_DURATION = 15  # Lockout duration in minutes
    ATTEMPT_WINDOW = 15  # Time window to track attempts (in minutes)

    @staticmethod
    def _get_attempt_key(username):
        """Generate Redis key for tracking attempts"""
        return f'login_attempts:{username}'

    @staticmethod
    def _get_lockout_key(username):
        """Generate Redis key for lockout status"""
        return f'login_lockout:{username}'

    @classmethod
    def record_failed_attempt(cls, username):
        """
        Record a failed login attempt for a username

        Args:
            username (str): Username that failed to login

        Returns:
            dict: {
                'attempts': int,
                'locked': bool,
                'locked_until': datetime or None,
                'remaining_attempts': int
            }
        """
        attempt_key = cls._get_attempt_key(username)
        lockout_key = cls._get_lockout_key(username)

        # Increment attempt counter
        attempts = cache.get(attempt_key, 0) + 1
        cache.set(attempt_key, attempts, timeout=cls.ATTEMPT_WINDOW * 60)

        # Check if should be locked
        if attempts >= cls.MAX_ATTEMPTS:
            locked_until = timezone.now() + timedelta(minutes=cls.LOCKOUT_DURATION)
            cache.set(lockout_key, locked_until.isoformat(), timeout=cls.LOCKOUT_DURATION * 60)

            return {
                'attempts': attempts,
                'locked': True,
                'locked_until': locked_until,
                'remaining_attempts': 0
            }

        return {
            'attempts': attempts,
            'locked': False,
            'locked_until': None,
            'remaining_attempts': cls.MAX_ATTEMPTS - attempts
        }

    @classmethod
    def is_locked(cls, username):
        """
        Check if a username is currently locked

        Args:
            username (str): Username to check

        Returns:
            dict: {
                'locked': bool,
                'locked_until': datetime or None
            }
        """
        lockout_key = cls._get_lockout_key(username)
        locked_until_str = cache.get(lockout_key)

        if locked_until_str:
            from django.utils.dateparse import parse_datetime
            locked_until = parse_datetime(locked_until_str)

            # Check if lockout has expired
            if locked_until and timezone.now() < locked_until:
                return {
                    'locked': True,
                    'locked_until': locked_until
                }
            else:
                # Lockout expired, clean up
                cache.delete(lockout_key)

        return {
            'locked': False,
            'locked_until': None
        }

    @classmethod
    def reset_attempts(cls, username):
        """
        Reset all attempts and lockout for a username (on successful login)

        Args:
            username (str): Username to reset
        """
        attempt_key = cls._get_attempt_key(username)
        lockout_key = cls._get_lockout_key(username)

        cache.delete(attempt_key)
        cache.delete(lockout_key)

    @classmethod
    def get_attempt_count(cls, username):
        """
        Get current attempt count for a username

        Args:
            username (str): Username to check

        Returns:
            int: Number of failed attempts
        """
        attempt_key = cls._get_attempt_key(username)
        return cache.get(attempt_key, 0)

    @classmethod
    def get_status(cls, username):
        """
        Get complete status for a username

        Args:
            username (str): Username to check

        Returns:
            dict: Complete status including attempts, lockout, etc.
        """
        lockout_status = cls.is_locked(username)
        attempts = cls.get_attempt_count(username)

        return {
            'attempts': attempts,
            'locked': lockout_status['locked'],
            'locked_until': lockout_status['locked_until'],
            'remaining_attempts': max(0, cls.MAX_ATTEMPTS - attempts) if not lockout_status['locked'] else 0,
            'max_attempts': cls.MAX_ATTEMPTS,
            'lockout_duration_minutes': cls.LOCKOUT_DURATION
        }


class IPLoginAttemptTracker(LoginAttemptTracker):
    """
    Extended tracker that also tracks by IP address
    Useful for preventing distributed attacks
    """

    @staticmethod
    def _get_ip_attempt_key(ip_address):
        """Generate Redis key for IP-based tracking"""
        return f'login_attempts_ip:{ip_address}'

    @staticmethod
    def _get_ip_lockout_key(ip_address):
        """Generate Redis key for IP lockout status"""
        return f'login_lockout_ip:{ip_address}'

    @classmethod
    def record_failed_attempt_by_ip(cls, ip_address):
        """Record failed attempt by IP address"""
        attempt_key = cls._get_ip_attempt_key(ip_address)
        lockout_key = cls._get_ip_lockout_key(ip_address)

        attempts = cache.get(attempt_key, 0) + 1
        cache.set(attempt_key, attempts, timeout=cls.ATTEMPT_WINDOW * 60)

        if attempts >= cls.MAX_ATTEMPTS * 2:  # More lenient for IPs (10 attempts)
            locked_until = timezone.now() + timedelta(minutes=cls.LOCKOUT_DURATION)
            cache.set(lockout_key, locked_until.isoformat(), timeout=cls.LOCKOUT_DURATION * 60)

            return {
                'attempts': attempts,
                'locked': True,
                'locked_until': locked_until
            }

        return {
            'attempts': attempts,
            'locked': False,
            'locked_until': None
        }

    @classmethod
    def is_ip_locked(cls, ip_address):
        """Check if an IP address is locked"""
        lockout_key = cls._get_ip_lockout_key(ip_address)
        locked_until_str = cache.get(lockout_key)

        if locked_until_str:
            from django.utils.dateparse import parse_datetime
            locked_until = parse_datetime(locked_until_str)

            if locked_until and timezone.now() < locked_until:
                return {
                    'locked': True,
                    'locked_until': locked_until
                }
            else:
                cache.delete(lockout_key)

        return {
            'locked': False,
            'locked_until': None
        }

    @classmethod
    def reset_ip_attempts(cls, ip_address):
        """Reset IP-based attempts"""
        attempt_key = cls._get_ip_attempt_key(ip_address)
        lockout_key = cls._get_ip_lockout_key(ip_address)

        cache.delete(attempt_key)
        cache.delete(lockout_key)
