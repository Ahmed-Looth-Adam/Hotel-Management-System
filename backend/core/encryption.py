"""
Encryption utilities for sensitive data at rest.

Uses Fernet symmetric encryption (AES-128-CBC with HMAC).
The encryption key must be configured in settings.FIELD_ENCRYPTION_KEY.

Usage:
    from core.encryption import encrypt_value, decrypt_value

    encrypted = encrypt_value("sensitive data")
    decrypted = decrypt_value(encrypted)
"""

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def get_encryption_key():
    """
    Get the encryption key from Django settings.

    Returns:
        bytes: The Fernet encryption key

    Raises:
        ValueError: If FIELD_ENCRYPTION_KEY is not configured
    """
    key = getattr(settings, 'FIELD_ENCRYPTION_KEY', None)
    if not key:
        raise ValueError(
            "FIELD_ENCRYPTION_KEY not configured in settings. "
            "Generate a key with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
        )
    # Handle both string and bytes
    if isinstance(key, str):
        return key.encode()
    return key


def encrypt_value(value):
    """
    Encrypt a string value using Fernet.

    Args:
        value: The plaintext string to encrypt

    Returns:
        str: The encrypted value as a base64-encoded string, or None/empty if input is empty
    """
    if not value:
        return value

    try:
        f = Fernet(get_encryption_key())
        # Ensure value is string
        if not isinstance(value, str):
            value = str(value)
        encrypted = f.encrypt(value.encode('utf-8'))
        return encrypted.decode('utf-8')
    except Exception as e:
        logger.error(f"Encryption failed: {e}")
        raise


def decrypt_value(value):
    """
    Decrypt a Fernet-encrypted value.

    Args:
        value: The encrypted base64-encoded string

    Returns:
        str: The decrypted plaintext, or None/empty if input is empty
    """
    if not value:
        return value

    try:
        f = Fernet(get_encryption_key())
        decrypted = f.decrypt(value.encode('utf-8'))
        return decrypted.decode('utf-8')
    except InvalidToken:
        logger.warning("Failed to decrypt value - invalid token or key mismatch")
        # Return the value as-is if it's not encrypted (for migration compatibility)
        # Fernet-encrypted values always start with 'gAAAAA'
        if not value.startswith('gAAAAA'):
            return value
        raise
    except Exception as e:
        logger.error(f"Decryption failed: {e}")
        raise


def is_encrypted(value):
    """
    Check if a value appears to be Fernet-encrypted.

    Fernet tokens always start with 'gAAAAA' (base64 encoding of version byte).

    Args:
        value: The value to check

    Returns:
        bool: True if the value appears to be encrypted
    """
    if not value or not isinstance(value, str):
        return False
    return value.startswith('gAAAAA')


def generate_key():
    """
    Generate a new Fernet encryption key.

    Returns:
        str: A new base64-encoded Fernet key

    Usage:
        Store this key securely in your .env file as FIELD_ENCRYPTION_KEY
    """
    return Fernet.generate_key().decode('utf-8')
