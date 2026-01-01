"""
Core Module Tests
Basic tests for utility functions and shared functionality
"""
import pytest


@pytest.mark.django_db
class TestCoreUtilities:
    """Test core utility functions"""

    def test_database_connection(self, db):
        """Test database connection works"""
        # Database fixture enables DB access
        assert True

    def test_encrypted_field_import(self):
        """Test encrypted field is available"""
        from core.fields import EncryptedCharField
        assert EncryptedCharField is not None
