from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils.translation import gettext_lazy as _
import uuid

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'super_admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('manager', 'Manager'),
        ('cashier', 'Cashier'),
        ('auditor', 'Auditor'),
        ('super_admin', 'Super Admin'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    
    # Multi-Tenant Fields
    distributor = models.ForeignKey(
        'core.Distributor',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='users'
    )
    current_branch = models.ForeignKey(
        'core.Branch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='current_users',
        help_text='The branch the user is currently viewing/working in'
    )
    
    # Legacy fields (for migration compatibility)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='owner', help_text='Legacy role field - use UserRole instead')
    organization_id = models.CharField(max_length=100, blank=True, help_text='Legacy field - will be migrated to branch_id')
    branch_id = models.CharField(max_length=100, blank=True, help_text='Legacy field - will be migrated to current_branch FK')
    business_name = models.CharField(max_length=255, blank=True)
    
    # Core fields
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    class Meta:
        db_table = 'users_user'

    def __str__(self):
        return self.email
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.email
    
    def get_permissions_for_branch(self, branch=None):
        """
        Get all permission codes for the user in a specific branch.
        Returns a set of permission codes like {'invoice.create', 'product.view'}
        """
        from core.models import UserRole
        
        target_branch = branch or self.current_branch
        if not target_branch:
            return set()
        
        user_roles = UserRole.objects.filter(
            user=self,
            branch=target_branch
        ).select_related('role').prefetch_related('role__permissions')
        
        permissions = set()
        for user_role in user_roles:
            for permission in user_role.role.permissions.all():
                permissions.add(permission.code)
        
        return permissions
    
    def has_permission(self, permission_code, branch=None):
        """
        Check if user has a specific permission in a branch.
        """
        if self.is_superuser:
            return True
        
        permissions = self.get_permissions_for_branch(branch)
        return permission_code in permissions
