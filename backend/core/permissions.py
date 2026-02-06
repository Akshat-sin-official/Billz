"""
DRF Permission Classes for Multi-Tenant SaaS

Provides permission enforcement at the API level using JWT claims.
"""

from rest_framework import permissions


class HasPermission(permissions.BasePermission):
    """
    Custom permission class that checks if the user has a specific permission.
    
    Usage in views:
        class InvoiceViewSet(viewsets.ModelViewSet):
            permission_classes = [HasPermission]
            required_permission = 'invoice.view'  # or use get_required_permission()
    """
    
    def has_permission(self, request, view):
        # SuperAdmin bypasses all checks
        if request.user.is_superuser:
            return True
        
        # Get required permission from view
        required_perm = getattr(view, 'required_permission', None)
        
        # If view defines get_required_permission method, use it
        if hasattr(view, 'get_required_permission'):
            required_perm = view.get_required_permission(request)
        
        if not required_perm:
            # No permission specified - allow if authenticated
            return request.user and request.user.is_authenticated
        
        # Check if user has the permission (from JWT or DB)
        return request.user.has_permission(required_perm)


class HasAnyPermission(permissions.BasePermission):
    """
    Checks if user has at least one of the required permissions.
    
    Usage:
        class ProductViewSet(viewsets.ModelViewSet):
            permission_classes = [HasAnyPermission]
            required_permissions = ['product.view', 'product.edit']
    """
    
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        
        required_perms = getattr(view, 'required_permissions', [])
        
        if hasattr(view, 'get_required_permissions'):
            required_perms = view.get_required_permissions(request)
        
        if not required_perms:
            return request.user and request.user.is_authenticated
        
        # Check if user has any of the permissions
        for perm in required_perms:
            if request.user.has_permission(perm):
                return True
        
        return False


class HasAllPermissions(permissions.BasePermission):
    """
    Checks if user has all of the required permissions.
    
    Usage:
        class ReportViewSet(viewsets.ViewSet):
            permission_classes = [HasAllPermissions]
            required_permissions = ['report.view', 'report.export']
    """
    
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        
        required_perms = getattr(view, 'required_permissions', [])
        
        if hasattr(view, 'get_required_permissions'):
            required_perms = view.get_required_permissions(request)
        
        if not required_perms:
            return request.user and request.user.is_authenticated
        
        # Check if user has all permissions
        for perm in required_perms:
            if not request.user.has_permission(perm):
                return False
        
        return True


class IsSuperAdmin(permissions.BasePermission):
    """
    Only allows access to SuperAdmin users.
    Used for platform management endpoints.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_superuser


class IsDistributorAdmin(permissions.BasePermission):
    """
    Checks if user has admin-level access to their distributor.
    Typically granted to users with 'distributor.manage' permission.
    """
    
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        
        return request.user.has_permission('distributor.manage')


class BelongsToSameBranch(permissions.BasePermission):
    """
    Object-level permission to ensure users can only access data from their branch.
    
    Usage:
        class ProductViewSet(viewsets.ModelViewSet):
            permission_classes = [IsAuthenticated, BelongsToSameBranch]
    """
    
    def has_object_permission(self, request, view, obj):
        # SuperAdmin can access everything
        if request.user.is_superuser:
            return True
        
        # Check if object has branch_id attribute
        if not hasattr(obj, 'branch_id') and not hasattr(obj, 'branch'):
            # If no branch association, allow (e.g., user profile)
            return True
        
        # Get the object's branch
        obj_branch = getattr(obj, 'branch', None) or getattr(obj, 'branch_id', None)
        
        # Compare with user's current branch
        user_branch = request.user.current_branch
        
        if not user_branch:
            return False
        
        # Handle both FK object and ID
        if hasattr(obj_branch, 'id'):
            return obj_branch.id == user_branch.id
        else:
            return str(obj_branch) == str(user_branch.id)


class BelongsToSameDistributor(permissions.BasePermission):
    """
    Object-level permission for distributor-scoped data.
    """
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        
        if not hasattr(obj, 'distributor_id') and not hasattr(obj, 'distributor'):
            return True
        
        obj_distributor = getattr(obj, 'distributor', None) or getattr(obj, 'distributor_id', None)
        user_distributor = request.user.distributor
        
        if not user_distributor:
            return False
        
        if hasattr(obj_distributor, 'id'):
            return obj_distributor.id == user_distributor.id
        else:
            return str(obj_distributor) == str(user_distributor.id)
