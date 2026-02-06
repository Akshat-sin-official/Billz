"""
URL Configuration for Multi-Tenant Core API
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DistributorViewSet,
    BranchViewSet,
    PermissionViewSet,
    RoleViewSet,
    UserRoleViewSet
)

router = DefaultRouter()
router.register(r'distributors', DistributorViewSet, basename='distributor')
router.register(r'branches', BranchViewSet, basename='branch')
router.register(r'permissions', PermissionViewSet, basename='permission')
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'user-roles', UserRoleViewSet, basename='user-role')

urlpatterns = router.urls
