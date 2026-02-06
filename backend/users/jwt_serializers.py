"""
Custom JWT Token Serializer for Multi-Tenant Architecture

Extends SimpleJWT to include:
- distributor_id
- branch_id  
- roles (list of role IDs)
- permissions (list of permission codes)
"""

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from core.models import UserRole


class MultiTenantTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['full_name'] = user.full_name
        token['is_superuser'] = user.is_superuser
        
        # Multi-tenant claims
        if user.distributor:
            token['distributor_id'] = str(user.distributor.id)
            token['distributor_name'] = user.distributor.name
        else:
            token['distributor_id'] = None
            token['distributor_name'] = None
        
        if user.current_branch:
            token['branch_id'] = str(user.current_branch.id)
            token['branch_name'] = user.current_branch.name
            token['branch_code'] = user.current_branch.code
        else:
            token['branch_id'] = None
            token['branch_name'] = None
            token['branch_code'] = None
        
        # Get user roles for current branch
        roles = []
        permissions = set()
        
        if user.current_branch:
            user_roles = UserRole.objects.filter(
                user=user,
                branch=user.current_branch
            ).select_related('role').prefetch_related('role__permissions')
            
            for user_role in user_roles:
                roles.append({
                    'id': str(user_role.role.id),
                    'name': user_role.role.name,
                    'is_primary': user_role.is_primary
                })
                
                # Collect all permissions
                for permission in user_role.role.permissions.all():
                    permissions.add(permission.code)
        
        token['roles'] = roles
        token['permissions'] = list(permissions)
        
        # Legacy fields for backward compatibility
        token['role'] = user.role
        token['organization_id'] = user.organization_id or (str(user.distributor.id) if user.distributor else None)
        
        return token


class MultiTenantTokenObtainPairView(TokenObtainPairView):
    serializer_class = MultiTenantTokenObtainPairSerializer
