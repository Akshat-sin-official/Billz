"""
Multi-Tenant Core Models

Defines the foundational entities for the enterprise SaaS platform:
- Distributor: Top-level tenant
- Branch: Business unit within a distributor
- Permission: System-defined action
- Role: Distributor-defined role template
- RolePermission: Maps permissions to roles
- UserRole: Assigns roles to users per branch
"""

from django.db import models
from django.contrib.auth import get_user_model
import uuid


class Distributor(models.Model):
    """
    Top-level tenant entity.
    Represents an enterprise/organization using the platform.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=100, unique=True)
    
    # Contact & Billing
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20, blank=True)
    billing_address = models.TextField(blank=True)
    
    # Subscription & Limits
    subscription_tier = models.CharField(
        max_length=20,
        choices=[
            ('trial', 'Trial'),
            ('basic', 'Basic'),
            ('professional', 'Professional'),
            ('enterprise', 'Enterprise'),
        ],
        default='trial'
    )
    max_branches = models.IntegerField(default=1)
    max_users = models.IntegerField(default=5)
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # SuperAdmin assignment
    created_by = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_distributors'
    )

    class Meta:
        db_table = 'core_distributor'
        ordering = ['name']

    def __str__(self):
        return self.name


class Branch(models.Model):
    """
    Business unit within a distributor.
    Replaces the old organization_id concept.
    All transactional data is branch-scoped.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    distributor = models.ForeignKey(
        Distributor,
        on_delete=models.CASCADE,
        related_name='branches'
    )
    
    # Branch Details
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)  # e.g., "NYC-001", "LON-CENTRAL"
    
    # Location
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    
    # Contact
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    
    # Tax & Billing
    tax_id = models.CharField(max_length=50, blank=True)  # GST, VAT, etc.
    currency = models.CharField(max_length=3, default='INR')
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'core_branch'
        ordering = ['distributor', 'name']
        unique_together = [['distributor', 'code']]

    def __str__(self):
        return f"{self.distributor.name} - {self.name}"


class Permission(models.Model):
    """
    System-defined action that can be granted to roles.
    Examples: invoice.create, product.delete, report.view
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=100, unique=True)  # e.g., "invoice.create"
    name = models.CharField(max_length=255)  # Human-readable
    description = models.TextField(blank=True)
    
    # Categorization
    module = models.CharField(max_length=50)  # e.g., "invoice", "product", "user"
    action = models.CharField(max_length=50)  # e.g., "create", "view", "edit", "delete"
    
    # Metadata
    is_system = models.BooleanField(default=True)  # Cannot be deleted
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_permission'
        ordering = ['module', 'action']

    def __str__(self):
        return self.code


class Role(models.Model):
    """
    Distributor-defined role template.
    Can be assigned to users across branches within the distributor.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    distributor = models.ForeignKey(
        Distributor,
        on_delete=models.CASCADE,
        related_name='roles'
    )
    
    # Role Definition
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Permissions (Many-to-Many through RolePermission)
    permissions = models.ManyToManyField(
        Permission,
        through='RolePermission',
        related_name='roles'
    )
    
    # Metadata
    is_system = models.BooleanField(default=False)  # Pre-defined roles (Owner, Manager, etc.)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_roles'
    )

    class Meta:
        db_table = 'core_role'
        ordering = ['distributor', 'name']
        unique_together = [['distributor', 'name']]

    def __str__(self):
        return f"{self.distributor.name} - {self.name}"


class RolePermission(models.Model):
    """
    Maps permissions to roles.
    Allows granular control over what each role can do.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_role_permission'
        unique_together = [['role', 'permission']]

    def __str__(self):
        return f"{self.role.name} → {self.permission.code}"


class UserRole(models.Model):
    """
    Assigns roles to users per branch.
    Same user can have different roles in different branches.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name='user_roles'
    )
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    
    # Metadata
    is_primary = models.BooleanField(default=False)  # Default branch/role for user
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        null=True,
        related_name='assigned_user_roles'
    )

    class Meta:
        db_table = 'core_user_role'
        unique_together = [['user', 'role', 'branch']]
        ordering = ['-is_primary', 'branch']

    def __str__(self):
        return f"{self.user.email} → {self.role.name} @ {self.branch.name}"
