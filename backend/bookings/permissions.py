# Edited By
# -> Ahmed Looth Adam, UWE ID: 24050761

from rest_framework import permissions

class IsOwnerOrStaff(permissions.BasePermission):
    """
    Allow users to access only their own bookings unless they are staff/manager/admin.
    """
    def has_object_permission(self, request, view, obj):
        user_role = getattr(request.user, 'role', None)

        # Admin and staff have full access
        if request.user.is_staff or user_role == 'admin':
            return True

        # Managers can access bookings for hotels they manage
        if user_role == 'manager':
            from hotels.models import Hotel
            managed_hotels = Hotel.objects.filter(manager=request.user)
            return obj.hotel in managed_hotels

        # Guests can only access their own bookings
        return obj.user == request.user
