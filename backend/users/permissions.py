from rest_framework import permissions

class IsOwner(permissions.BasePermission):
    """
    Custom permission to only allow Owners to perform the action.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'owner')
