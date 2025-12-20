"""
Custom Django model fields with encryption support.

These fields transparently encrypt data before saving to the database
and decrypt when reading, providing encryption at rest for sensitive data.
"""

from django.db import models
from .encryption import encrypt_value, decrypt_value, is_encrypted


class EncryptedCharField(models.CharField):
    """
    A CharField that encrypts its value at rest in the database.

    Data is encrypted using Fernet (AES-128-CBC with HMAC) before being
    stored and automatically decrypted when retrieved.

    Note:
        - Encrypted values are longer than plaintext (~1.5x)
        - Set max_length to accommodate encrypted data (recommend 255+ for short strings)
        - Encrypted fields cannot be searched with LIKE queries
        - Exact lookups work but require the exact encrypted value

    Example:
        class MyModel(models.Model):
            sensitive_id = EncryptedCharField(max_length=255)
    """

    description = "An encrypted CharField"

    def get_prep_value(self, value):
        """
        Prepare value for database storage by encrypting it.

        Called when saving to the database.
        """
        value = super().get_prep_value(value)
        if value is None or value == '':
            return value
        # Don't re-encrypt if already encrypted
        if is_encrypted(value):
            return value
        return encrypt_value(value)

    def from_db_value(self, value, expression, connection):
        """
        Convert value from database to Python by decrypting it.

        Called when reading from the database.
        """
        if value is None or value == '':
            return value
        # Only decrypt if the value appears to be encrypted
        if is_encrypted(value):
            return decrypt_value(value)
        # Return as-is if not encrypted (for backward compatibility during migration)
        return value

    def to_python(self, value):
        """
        Convert value to Python object.

        Called during deserialization and form cleaning.
        Handles both encrypted and plaintext values for flexibility.
        """
        if value is None:
            return value
        if isinstance(value, str) and is_encrypted(value):
            return decrypt_value(value)
        return value

    def deconstruct(self):
        """
        Return enough information to recreate the field for migrations.
        """
        name, path, args, kwargs = super().deconstruct()
        return name, path, args, kwargs


class EncryptedTextField(models.TextField):
    """
    A TextField that encrypts its value at rest in the database.

    Similar to EncryptedCharField but for longer text content.

    Example:
        class MyModel(models.Model):
            sensitive_notes = EncryptedTextField()
    """

    description = "An encrypted TextField"

    def get_prep_value(self, value):
        """Encrypt before saving to database."""
        value = super().get_prep_value(value)
        if value is None or value == '':
            return value
        if is_encrypted(value):
            return value
        return encrypt_value(value)

    def from_db_value(self, value, expression, connection):
        """Decrypt when reading from database."""
        if value is None or value == '':
            return value
        if is_encrypted(value):
            return decrypt_value(value)
        return value

    def to_python(self, value):
        """Convert to Python, handling encrypted values."""
        if value is None:
            return value
        if isinstance(value, str) and is_encrypted(value):
            return decrypt_value(value)
        return value

    def deconstruct(self):
        """Return field info for migrations."""
        name, path, args, kwargs = super().deconstruct()
        return name, path, args, kwargs
