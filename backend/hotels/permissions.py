from rest_framework import permissions


class IsStaffOrReadOnly(permissions.BasePermission):
    """
    Staff users can perform any action.
    Non-staff users can only read (GET, HEAD, OPTIONS).
    """

    def has_permission(self, request, view):
        # Allow read-only access for any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions only for staff
        return request.user and request.user.is_staff


class IsHotelManager(permissions.BasePermission):
    """
    Only hotel managers (staff users with 'manager' role) can access.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Check if user has manager role
        return (
            request.user.is_staff or
            getattr(request.user, 'role', None) == 'manager' or
            getattr(request.user, 'role', None) == 'admin'
        )


class IsAssignedManager(permissions.BasePermission):
    """
    Only managers assigned to a specific hotel can access its data.
    """

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # Admins can access all
        if request.user.is_superuser or getattr(request.user, 'role', None) == 'admin':
            return True

        # Get the hotel from the object
        hotel = getattr(obj, 'hotel', obj)

        # Check if user is the assigned manager
        return hotel.manager == request.user


class CanManageBooking(permissions.BasePermission):
    """
    Booking owner or staff can manage a booking.
    """

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # Staff can manage all bookings
        if request.user.is_staff:
            return True

        # Owners can view/manage their own bookings
        return obj.user == request.user


class IsAdminUser(permissions.BasePermission):
    """
    Only admin users can access.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        return (
            request.user.is_superuser or
            getattr(request.user, 'role', None) == 'admin'
        )


class IsOwnerOrStaff(permissions.BasePermission):
    """
    Object owner or staff can access.
    """

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # Staff can access all
        if request.user.is_staff:
            return True

        # Check if user owns the object
        return getattr(obj, 'user', None) == request.user


class HotelObjectPermission(permissions.BasePermission):
    """
    Permission for hotel-related objects.
    Ensures users can only access objects from hotels they manage.
    """

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # Read permissions for any authenticated request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Admins can access all
        if request.user.is_superuser or getattr(request.user, 'role', None) == 'admin':
            return True

        # Get the hotel from the object
        hotel = getattr(obj, 'hotel', None)
        if hotel is None:
            return False

        # Check if user is the assigned manager
        return hotel.manager == request.user
