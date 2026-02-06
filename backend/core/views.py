"""
ViewSets for Multi-Tenant Core Models
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count

from .models import Distributor, Branch, Permission, Role, RolePermission, UserRole
from .serializers import (
    DistributorSerializer, BranchSerializer, BranchListSerializer,
    PermissionSerializer, RoleSerializer, CreateRoleSerializer,
    UserRoleSerializer, AssignUserRoleSerializer
)
from .permissions import IsSuperAdmin, IsDistributorAdmin, HasPermission, BelongsToSameDistributor


class DistributorViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing distributors (tenants).
    Only accessible by SuperAdmin.
    """
    queryset = Distributor.objects.all()
    serializer_class = DistributorSerializer
    permission_classes = [IsSuperAdmin]
    
    def get_queryset(self):
        return Distributor.objects.annotate(
            branches_count=Count('branches'),
            users_count=Count('users')
        ).order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a distributor"""
        distributor = self.get_object()
        distributor.is_active = True
        distributor.save()
        return Response({'status': 'activated'})
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a distributor"""
        distributor = self.get_object()
        distributor.is_active = False
        distributor.save()
        return Response({'status': 'deactivated'})
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get statistics for a distributor"""
        distributor = self.get_object()
        return Response({
            'total_branches': distributor.branches.count(),
            'active_branches': distributor.branches.filter(is_active=True).count(),
            'total_users': distributor.users.count(),
            'active_users': distributor.users.filter(is_active=True).count(),
            'total_roles': distributor.roles.count(),
        })


class BranchViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing branches.
    SuperAdmin can see all, others see only their distributor's branches.
    """
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_superuser:
            return Branch.objects.all()
        
        if user.distributor:
            return Branch.objects.filter(distributor=user.distributor)
        
        return Branch.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return BranchListSerializer
        return BranchSerializer
    
    @action(detail=False, methods=['get'])
    def my_branches(self, request):
        """Get all branches the current user has access to"""
        user = request.user
        
        if user.is_superuser:
            branches = Branch.objects.all()
        elif user.distributor:
            branches = Branch.objects.filter(distributor=user.distributor)
        else:
            branches = Branch.objects.none()
        
        serializer = BranchListSerializer(branches, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def switch_to(self, request, pk=None):
        """Switch user's current branch"""
        branch = self.get_object()
        user = request.user
        
        # Verify user has access to this branch
        if not user.is_superuser and (not user.distributor or branch.distributor_id != user.distributor_id):
            return Response(
                {'error': 'You do not have access to this branch'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user.current_branch = branch
        user.save()
        
        return Response({
            'message': 'Branch switched successfully',
            'branch': BranchSerializer(branch).data
        })


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only ViewSet for permissions.
    Used to display available permissions when creating/editing roles.
    """
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def by_module(self, request):
        """Get permissions grouped by module"""
        modules = {}
        for permission in Permission.objects.all():
            if permission.module not in modules:
                modules[permission.module] = []
            modules[permission.module].append(PermissionSerializer(permission).data)
        
        return Response(modules)


class RoleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing roles.
    Users can only manage roles within their distributor.
    """
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_superuser:
            return Role.objects.all()
        
        if user.distributor:
            return Role.objects.filter(distributor=user.distributor)
        
        return Role.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateRoleSerializer
        return RoleSerializer
    
    def perform_create(self, serializer):
        # Automatically set distributor to current user's distributor
        serializer.save(
            distributor=self.request.user.distributor,
            created_by=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def add_permission(self, request, pk=None):
        """Add a permission to a role"""
        role = self.get_object()
        permission_id = request.data.get('permission_id')
        
        try:
            permission = Permission.objects.get(id=permission_id)
            role.permissions.add(permission)
            return Response({'status': 'permission added'})
        except Permission.DoesNotExist:
            return Response(
                {'error': 'Permission not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def remove_permission(self, request, pk=None):
        """Remove a permission from a role"""
        role = self.get_object()
        permission_id = request.data.get('permission_id')
        
        try:
            permission = Permission.objects.get(id=permission_id)
            role.permissions.remove(permission)
            return Response({'status': 'permission removed'})
        except Permission.DoesNotExist:
            return Response(
                {'error': 'Permission not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class UserRoleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user role assignments.
    """
    serializer_class = UserRoleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_superuser:
            return UserRole.objects.all()
        
        if user.distributor:
            return UserRole.objects.filter(
                branch__distributor=user.distributor
            )
        
        return UserRole.objects.none()
    
    @action(detail=False, methods=['post'])
    def assign(self, request):
        """Assign a role to a user for a specific branch"""
        serializer = AssignUserRoleSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        user_role = serializer.save()
        
        return Response(
            UserRoleSerializer(user_role).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def set_primary(self, request, pk=None):
        """Set a user role as primary"""
        user_role = self.get_object()
        
        # Remove primary flag from other roles of this user
        UserRole.objects.filter(user=user_role.user).update(is_primary=False)
        
        # Set this as primary
        user_role.is_primary = True
        user_role.save()
        
        # Update user's current branch
        user_role.user.current_branch = user_role.branch
        user_role.user.save()
        
        return Response({'status': 'set as primary'})
