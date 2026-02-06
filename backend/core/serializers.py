"""
Serializers for Multi-Tenant Core Models
"""

from rest_framework import serializers
from .models import Distributor, Branch, Permission, Role, RolePermission, UserRole
from django.contrib.auth import get_user_model

User = get_user_model()


class DistributorSerializer(serializers.ModelSerializer):
    branches_count = serializers.SerializerMethodField()
    users_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Distributor
        fields = [
            'id', 'name', 'slug', 'contact_email', 'contact_phone',
            'billing_address', 'subscription_tier', 'max_branches',
            'max_users', 'is_active', 'created_at', 'updated_at',
            'branches_count', 'users_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_branches_count(self, obj):
        return obj.branches.count()
    
    def get_users_count(self, obj):
        return obj.users.count()


class BranchSerializer(serializers.ModelSerializer):
    distributor_name = serializers.CharField(source='distributor.name', read_only=True)
    users_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Branch
        fields = [
            'id', 'distributor', 'distributor_name', 'name', 'code',
            'address', 'city', 'state', 'country', 'postal_code',
            'phone', 'email', 'tax_id', 'currency', 'is_active',
            'created_at', 'updated_at', 'users_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_users_count(self, obj):
        return obj.current_users.count()


class BranchListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing branches"""
    class Meta:
        model = Branch
        fields = ['id', 'name', 'code', 'city', 'is_active']


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = [
            'id', 'code', 'name', 'description', 'module',
            'action', 'is_system', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class RolePermissionSerializer(serializers.ModelSerializer):
    permission_name = serializers.CharField(source='permission.name', read_only=True)
    permission_code = serializers.CharField(source='permission.code', read_only=True)
    
    class Meta:
        model = RolePermission
        fields = ['id', 'permission', 'permission_name', 'permission_code', 'created_at']


class RoleSerializer(serializers.ModelSerializer):
    distributor_name = serializers.CharField(source='distributor.name', read_only=True)
    permissions_list = PermissionSerializer(source='permissions', many=True, read_only=True)
    permissions_count = serializers.SerializerMethodField()
    users_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Role
        fields = [
            'id', 'distributor', 'distributor_name', 'name', 'description',
            'permissions_list', 'permissions_count', 'is_system', 'is_active',
            'created_at', 'updated_at', 'users_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_permissions_count(self, obj):
        return obj.permissions.count()
    
    def get_users_count(self, obj):
        return UserRole.objects.filter(role=obj).count()


class CreateRoleSerializer(serializers.ModelSerializer):
    """Serializer for creating roles with permissions"""
    permission_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Role
        fields = ['name', 'description', 'distributor', 'permission_ids']
    
    def create(self, validated_data):
        permission_ids = validated_data.pop('permission_ids', [])
        role = Role.objects.create(**validated_data)
        
        if permission_ids:
            permissions = Permission.objects.filter(id__in=permission_ids)
            role.permissions.set(permissions)
        
        return role


class UserRoleSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    role_name = serializers.CharField(source='role.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    
    class Meta:
        model = UserRole
        fields = [
            'id', 'user', 'user_email', 'user_name', 'role', 'role_name',
            'branch', 'branch_name', 'is_primary', 'assigned_at'
        ]
        read_only_fields = ['id', 'assigned_at']


class AssignUserRoleSerializer(serializers.Serializer):
    """Serializer for assigning roles to users"""
    user_id = serializers.UUIDField()
    role_id = serializers.UUIDField()
    branch_id = serializers.UUIDField()
    is_primary = serializers.BooleanField(default=False)
    
    def validate(self, data):
        # Validate user exists
        try:
            user = User.objects.get(id=data['user_id'])
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")
        
        # Validate role exists
        try:
            role = Role.objects.get(id=data['role_id'])
        except Role.DoesNotExist:
            raise serializers.ValidationError("Role not found")
        
        # Validate branch exists
        try:
            branch = Branch.objects.get(id=data['branch_id'])
        except Branch.DoesNotExist:
            raise serializers.ValidationError("Branch not found")
        
        # Validate role belongs to same distributor as branch
        if role.distributor_id != branch.distributor_id:
            raise serializers.ValidationError("Role must belong to the same distributor as the branch")
        
        data['user'] = user
        data['role'] = role
        data['branch'] = branch
        
        return data
    
    def create(self, validated_data):
        user_role, created = UserRole.objects.get_or_create(
            user=validated_data['user'],
            role=validated_data['role'],
            branch=validated_data['branch'],
            defaults={
                'is_primary': validated_data.get('is_primary', False),
                'assigned_by': self.context['request'].user
            }
        )
        return user_role
