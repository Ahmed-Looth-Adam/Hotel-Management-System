"""
Two-Factor Authentication Utility Service

Provides TOTP (Time-based One-Time Password) generation and verification,
QR code generation for authenticator apps, backup codes, and email OTP.
"""

import pyotp
import qrcode
import io
import base64
import secrets
import hashlib
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password


# Constants
TOTP_ISSUER = "Hotel Management System"
BACKUP_CODE_COUNT = 10
BACKUP_CODE_LENGTH = 8
EMAIL_OTP_LENGTH = 6
EMAIL_OTP_EXPIRY = 300  # 5 minutes in seconds
TEMP_TOKEN_EXPIRY = 300  # 5 minutes in seconds
MAX_OTP_ATTEMPTS = 5


def generate_totp_secret():
    """
    Generate a random 32-character base32 secret for TOTP.

    Returns:
        str: Base32 encoded secret key
    """
    return pyotp.random_base32()


def get_totp_uri(user, secret):
    """
    Generate an otpauth:// URI for authenticator apps.

    Args:
        user: User model instance
        secret: Base32 encoded TOTP secret

    Returns:
        str: otpauth:// URI for QR code generation
    """
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(
        name=user.email or user.username,
        issuer_name=TOTP_ISSUER
    )


def generate_qr_code(uri):
    """
    Generate a QR code image as base64 string.

    Args:
        uri: otpauth:// URI to encode

    Returns:
        str: Base64 encoded PNG image
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(uri)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)

    return base64.b64encode(buffer.getvalue()).decode('utf-8')


def verify_totp(secret, code):
    """
    Verify a TOTP code against the secret.

    Args:
        secret: Base32 encoded TOTP secret
        code: 6-digit OTP code to verify

    Returns:
        bool: True if code is valid
    """
    if not secret or not code:
        return False

    totp = pyotp.TOTP(secret)
    # valid_window=1 allows codes from 30 seconds before/after current time
    return totp.verify(code, valid_window=1)


def generate_backup_codes():
    """
    Generate a set of single-use backup codes.

    Returns:
        tuple: (list of plaintext codes for user, list of hashed codes to store)
    """
    plaintext_codes = []
    hashed_codes = []

    for _ in range(BACKUP_CODE_COUNT):
        # Generate random alphanumeric code
        code = secrets.token_hex(BACKUP_CODE_LENGTH // 2).upper()
        # Format as XXXX-XXXX
        formatted_code = f"{code[:4]}-{code[4:]}"
        plaintext_codes.append(formatted_code)
        # Hash the code for storage
        hashed_codes.append(make_password(formatted_code))

    return plaintext_codes, hashed_codes


def verify_backup_code(user, code):
    """
    Verify and consume a backup code.

    Args:
        user: User model instance
        code: Backup code to verify (format: XXXX-XXXX)

    Returns:
        bool: True if code is valid and consumed
    """
    if not user.two_factor_backup_codes:
        return False

    # Normalize the code (uppercase, with hyphen)
    code = code.strip().upper()
    if len(code) == 8:
        code = f"{code[:4]}-{code[4:]}"

    # Check against each stored hashed code
    for i, hashed_code in enumerate(user.two_factor_backup_codes):
        if check_password(code, hashed_code):
            # Remove the used code
            user.two_factor_backup_codes.pop(i)
            user.save(update_fields=['two_factor_backup_codes'])
            return True

    return False


def generate_email_otp():
    """
    Generate a 6-digit numeric OTP code.

    Returns:
        str: 6-digit OTP code
    """
    return ''.join([str(secrets.randbelow(10)) for _ in range(EMAIL_OTP_LENGTH)])


def send_email_otp(user, temp_token):
    """
    Send an OTP code to the user's email address.

    Args:
        user: User model instance
        temp_token: Temporary authentication token

    Returns:
        bool: True if email was sent successfully
    """
    if not user.email:
        return False

    otp_code = generate_email_otp()

    # Store OTP in cache with expiry
    cache_key = f"email_otp_{temp_token}"
    cache.set(cache_key, {
        'code': otp_code,
        'user_id': user.id,
        'attempts': 0
    }, timeout=EMAIL_OTP_EXPIRY)

    # Send email
    try:
        send_mail(
            subject='Your Login Verification Code',
            message=f"""
Hello {user.first_name or user.username},

Your verification code is: {otp_code}

This code will expire in 5 minutes.

If you did not request this code, please ignore this email and ensure your account is secure.

Best regards,
Hotel Management System
            """.strip(),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        return True
    except Exception:
        # Clear the cached OTP if email fails
        cache.delete(cache_key)
        return False


def verify_email_otp(temp_token, code):
    """
    Verify an email OTP code.

    Args:
        temp_token: Temporary authentication token
        code: 6-digit OTP code to verify

    Returns:
        tuple: (success: bool, user_id: int or None, error: str or None)
    """
    cache_key = f"email_otp_{temp_token}"
    otp_data = cache.get(cache_key)

    if not otp_data:
        return False, None, "OTP expired or invalid"

    if otp_data['attempts'] >= MAX_OTP_ATTEMPTS:
        cache.delete(cache_key)
        return False, None, "Too many attempts. Please request a new code."

    if otp_data['code'] != code:
        otp_data['attempts'] += 1
        cache.set(cache_key, otp_data, timeout=EMAIL_OTP_EXPIRY)
        remaining = MAX_OTP_ATTEMPTS - otp_data['attempts']
        return False, None, f"Invalid code. {remaining} attempts remaining."

    # Code is valid - clear from cache
    cache.delete(cache_key)
    return True, otp_data['user_id'], None


def generate_temp_token(user):
    """
    Generate a temporary token for 2FA verification during login.

    Args:
        user: User model instance

    Returns:
        str: Temporary token
    """
    token = secrets.token_urlsafe(32)

    # Store in cache with user_id and attempt counter
    cache_key = f"2fa_temp_{token}"
    cache.set(cache_key, {
        'user_id': user.id,
        'attempts': 0
    }, timeout=TEMP_TOKEN_EXPIRY)

    return token


def verify_temp_token(temp_token):
    """
    Verify a temporary token and get associated user_id.

    Args:
        temp_token: Temporary authentication token

    Returns:
        tuple: (user_id: int or None, error: str or None)
    """
    cache_key = f"2fa_temp_{temp_token}"
    token_data = cache.get(cache_key)

    if not token_data:
        return None, "Session expired. Please login again."

    return token_data['user_id'], None


def increment_temp_token_attempts(temp_token):
    """
    Increment attempt counter for a temp token.

    Args:
        temp_token: Temporary authentication token

    Returns:
        tuple: (attempts_remaining: int, error: str or None)
    """
    cache_key = f"2fa_temp_{temp_token}"
    token_data = cache.get(cache_key)

    if not token_data:
        return 0, "Session expired. Please login again."

    token_data['attempts'] += 1

    if token_data['attempts'] >= MAX_OTP_ATTEMPTS:
        cache.delete(cache_key)
        return 0, "Too many attempts. Please login again."

    cache.set(cache_key, token_data, timeout=TEMP_TOKEN_EXPIRY)
    return MAX_OTP_ATTEMPTS - token_data['attempts'], None


def invalidate_temp_token(temp_token):
    """
    Invalidate a temporary token after successful 2FA verification.

    Args:
        temp_token: Temporary authentication token
    """
    cache_key = f"2fa_temp_{temp_token}"
    cache.delete(cache_key)

    # Also clear any associated email OTP
    email_otp_key = f"email_otp_{temp_token}"
    cache.delete(email_otp_key)


# ============================================
# Email Verification for Guest Registration
# ============================================

VERIFICATION_OTP_EXPIRY = 600  # 10 minutes for registration verification


def send_verification_email(user):
    """
    Send a verification OTP code to a newly registered user.

    Args:
        user: User model instance

    Returns:
        bool: True if email was sent successfully
    """
    if not user.email:
        return False

    otp_code = generate_email_otp()

    # Store OTP in cache with user email as key
    cache_key = f"email_verification_{user.email}"
    cache.set(cache_key, {
        'code': otp_code,
        'user_id': user.id,
        'attempts': 0
    }, timeout=VERIFICATION_OTP_EXPIRY)

    # Send email
    try:
        send_mail(
            subject='Verify Your Email - Hotel Management System',
            message=f"""
Hello {user.first_name or user.username},

Welcome to Hotel Management System!

Your email verification code is: {otp_code}

This code will expire in 10 minutes.

Please enter this code to verify your email and activate your account.

If you did not create an account, please ignore this email.

Best regards,
Hotel Management System
            """.strip(),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        return True
    except Exception:
        # Clear the cached OTP if email fails
        cache.delete(cache_key)
        return False


def verify_registration_otp(email, code):
    """
    Verify an email verification OTP code for registration.

    Args:
        email: User's email address
        code: 6-digit OTP code to verify

    Returns:
        tuple: (success: bool, user_id: int or None, error: str or None)
    """
    cache_key = f"email_verification_{email}"
    otp_data = cache.get(cache_key)

    if not otp_data:
        return False, None, "Verification code expired. Please request a new code."

    if otp_data['attempts'] >= MAX_OTP_ATTEMPTS:
        cache.delete(cache_key)
        return False, None, "Too many attempts. Please request a new code."

    if otp_data['code'] != code:
        otp_data['attempts'] += 1
        cache.set(cache_key, otp_data, timeout=VERIFICATION_OTP_EXPIRY)
        remaining = MAX_OTP_ATTEMPTS - otp_data['attempts']
        return False, None, f"Invalid code. {remaining} attempts remaining."

    # Code is valid - clear from cache
    cache.delete(cache_key)
    return True, otp_data['user_id'], None


def resend_verification_email(email):
    """
    Resend verification email to user.

    Args:
        email: User's email address

    Returns:
        tuple: (success: bool, error: str or None)
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()

    try:
        user = User.objects.get(email=email, email_verified=False)
    except User.DoesNotExist:
        return False, "User not found or already verified."

    success = send_verification_email(user)
    if success:
        return True, None
    return False, "Failed to send verification email. Please try again."
