# Edited By
# -> Ahmed Looth Adam, UWE ID: 24050761

from rest_framework import permissions

class IsOwnerOrStaff(permissions.BasePermission):
    """
    Allow users to access only their own bookings unless they are staff.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        return obj.user == request.user
