# authentication/permissions.py
from rest_framework.permissions import BasePermission

class IsAdminUserCustom(BasePermission):
    """
    Allows access only to users with the 'admin' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')


class IsAdminOrManager(BasePermission):
    """
    Allows access to users with 'admin' or 'manager' role.
    Managers can only manage staff assigned to their hotels.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['admin', 'manager']


class IsManager(BasePermission):
    """
    Allows access only to users with the 'manager' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'manager')