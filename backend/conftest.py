"""
Pytest configuration and fixtures for Hotel Management System tests
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


@pytest.fixture
def api_client():
    """Return an API client instance"""
    return APIClient()


@pytest.fixture
def create_user(db):
    """Factory fixture for creating users"""
    def make_user(**kwargs):
        if 'password' not in kwargs:
            kwargs['password'] = 'TestPass123!'
        if 'email' not in kwargs:
            kwargs['email'] = f"test_{kwargs.get('username', 'user')}@example.com"

        password = kwargs.pop('password')
        user = User.objects.create_user(**kwargs)
        user.set_password(password)
        user.save()
        return user
    return make_user


@pytest.fixture
def guest_user(create_user):
    """Create a guest user"""
    return create_user(
        username='guest_user',
        email='guest@example.com',
        role='guest',
        email_verified=True
    )


@pytest.fixture
def staff_user(create_user):
    """Create a staff user"""
    return create_user(
        username='staff_user',
        email='staff@example.com',
        role='staff',
        email_verified=True,
        is_staff=True
    )


@pytest.fixture
def admin_user(create_user):
    """Create an admin user"""
    return create_user(
        username='admin_user',
        email='admin@example.com',
        role='admin',
        email_verified=True,
        is_staff=True,
        is_superuser=True
    )


@pytest.fixture
def authenticated_client(api_client, guest_user):
    """Return an authenticated API client with guest user"""
    refresh = RefreshToken.for_user(guest_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def staff_client(api_client, staff_user):
    """Return an authenticated API client with staff user"""
    refresh = RefreshToken.for_user(staff_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    """Return an authenticated API client with admin user"""
    refresh = RefreshToken.for_user(admin_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def sample_hotel(db):
    """Create a sample hotel"""
    from hotels.models import Hotel
    return Hotel.objects.create(
        name='Test Hotel',
        location='Test Location',
        address='123 Test Street',
        city='Test City',
        country='Test Country',
        description='A test hotel',
        star_rating=4
    )


@pytest.fixture
def sample_room(db, sample_hotel):
    """Create a sample room"""
    from hotels.models import Room
    return Room.objects.create(
        hotel=sample_hotel,
        room_number='101',
        floor=1,
        room_type_category='standard',
        bed_size='queen',
        max_occupancy=2,
        status='available'
    )


@pytest.fixture
def sample_booking(db, guest_user, sample_room):
    """Create a sample booking"""
    from bookings.models import Booking
    from datetime import date, timedelta

    check_in = date.today() + timedelta(days=1)
    check_out = date.today() + timedelta(days=3)

    return Booking.objects.create(
        user=guest_user,
        hotel=sample_room.hotel,
        room=sample_room,
        check_in_date=check_in,
        check_out_date=check_out,
        guests_count=2,
        total_price=200.00,
        status='confirmed'
    )


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    """Enable database access for all tests"""
    pass
