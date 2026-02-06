from django.contrib import admin
from .models import Distributor, Branch, Permission, Role, RolePermission, UserRole


@admin.register(Distributor)
class DistributorAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'subscription_tier', 'is_active', '

_at']
    list_filter = ['subscription_tier', 'is_active']
    search_fields = ['name', 'slug', 'contact_email']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'distributor', 'city', 'is_active', 'created_at']
    list_filter = ['distributor', 'is_active', 'country']
    search_fields = ['name', 'code', 'city']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'module', 'action', 'is_system']
    list_filter = ['module', 'action', 'is_system']
    search_fields = ['code', 'name']
    readonly_fields = ['id', 'created_at']


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'distributor', 'is_system', 'is_active', 'created_at']
    list_filter = ['distributor', 'is_system', 'is_active']
    search_fields = ['name', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']
    filter_horizontal = ['permissions']


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ['role', 'permission', 'created_at']
    list_filter = ['role__distributor']
    search_fields = ['role__name', 'permission__code']
    readonly_fields = ['id', 'created_at']


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'branch', 'is_primary', 'assigned_at']
    list_filter = ['branch__distributor', 'is_primary']
    search_fields = ['user__email', 'role__name', 'branch__name']
    readonly_fields = ['id', 'assigned_at']
