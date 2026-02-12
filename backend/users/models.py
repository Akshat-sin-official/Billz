
import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils.translation import gettext_lazy as _

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email field must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('owner', 'Owner'),
        ('manager', 'Manager'),
        ('cashier', 'Cashier'),
        ('auditor', 'Auditor'),
        ('super_admin', 'Super Admin'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='owner',
        help_text='Legacy role field - use UserRole instead'
    )
    
    # Legacy fields
    organization_id = models.CharField(
        max_length=100, 
        blank=True,
        help_text='Legacy field - will be migrated to branch_id'
    )
    branch_id = models.CharField(
        max_length=100, 
        blank=True,
        help_text='Legacy field - will be migrated to current_branch FK'
    )
    business_name = models.CharField(max_length=255, blank=True)

    # Status
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Relations
    current_branch = models.ForeignKey(
        'core.Branch', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='current_users',
        help_text='The branch the user is currently viewing/working in'
    )
    distributor = models.ForeignKey(
        'core.Distributor',
        on_delete=models.CASCADE,
        null=True, 
        blank=True,
        related_name='users'
    )

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'users_user'
        verbose_name = _('user')
        verbose_name_plural = _('users')

    def __str__(self):
        return self.email
