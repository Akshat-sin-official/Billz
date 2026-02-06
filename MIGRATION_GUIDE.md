# Migration Guide: Multi-Tenant SaaS Upgrade

## Overview

This guide outlines the step-by-step process to migrate the existing POS system to a multi-tenant SaaS architecture without data loss.

## Migration Phases

### Phase 1: Schema Migration (Database Structure)

#### Step 1: Create New Tables
Run the initial migration to create core multi-tenant tables:

```bash
cd backend
python manage.py makemigrations core
python manage.py migrate core
```

This creates:
- `core_distributor`
- `core_branch`
- `core_permission`
- `core_role`
- `core_role_permission`
- `core_user_role`

#### Step 2: Seed System Permissions
Populate the permissions table with system-defined permissions:

```bash
python manage.py seed_permissions
```

#### Step 3: Add Multi-Tenant Fields to User Model
Create migration for User model changes:

```bash
python manage.py makemigrations users
python manage.py migrate users
```

This adds:
- `distributor_id` (FK to Distributor)
- `current_branch_id` (FK to Branch)
- Keeps `organization_id` and old `branch_id` for backward compatibility

### Phase 2: Data Migration (Backfill)

Create a custom migration script to backfill existing data:

```python
# backend/core/migrations/0002_backfill_tenants.py

from django.db import migrations
from django.utils.text import slugify


def create_distributors_and_branches(apps, schema_editor):
    """
    Convert existing organizations to Distributors + Branches
    """
    User = apps.get_model('users', 'User')
    Distributor = apps.get_model('core', 'Distributor')
    Branch = apps.get_model('core', 'Branch')
    
    # Get unique organization IDs
    organizations = User.objects.exclude(organization_id='').values('organization_id', 'business_name').distinct()
    
    for org_data in organizations:
        org_id = org_data['organization_id']
        business_name = org_data['business_name'] or f"Organization {org_id}"
        
        # Create Distributor
        distributor = Distributor.objects.create(
            name=business_name,
            slug=slugify(business_name)[:100],
            contact_email=f"admin@{slugify(business_name)}.com",
            subscription_tier='professional',  # Default tier
            is_active=True
        )
        
        # Create default Branch
        branch = Branch.objects.create(
            distributor=distributor,
            name=f"{business_name} - Main Branch",
            code=f"{org_id[:10].upper()}-MAIN",
            is_active=True
        )
        
        # Update all users with this organization_id
        users = User.objects.filter(organization_id=org_id)
        for user in users:
            user.distributor = distributor
            user.current_branch = branch
            user.save()
        
        print(f"✓ Migrated: {business_name} → Distributor + Branch")


def create_default_roles(apps, schema_editor):
    """
    Create default roles for each distributor based on existing user roles
    """
    User = apps.get_model('users', 'User')
    Distributor = apps.get_model('core', 'Distributor')
    Permission = apps.get_model('core', 'Permission')
    Role = apps.get_model('core', 'Role')
    UserRole = apps.get_model('core', 'UserRole')
    
    # Permission mappings for legacy roles
    ROLE_PERMISSIONS = {
        'owner': [
            'invoice.*', 'product.*', 'customer.*',
            'report.*', 'user.*', 'role.*',
            'branch.*', 'distributor.*', 'settings.*', 'pos.*'
        ],
        'manager': [
            'invoice.*', 'product.*', 'customer.*',
            'report.view', 'report.export', 'user.view',
            'settings.view', 'pos.*'
        ],
        'cashier': [
            'invoice.view', 'invoice.create', 'product.view',
            'customer.view', 'customer.create', 'pos.access'
        ],
        'auditor': [
            'invoice.view', 'product.view', 'customer.view',
            'report.view', 'report.export', 'report.advanced'
        ],
    }
    
    for distributor in Distributor.objects.all():
        # Create roles for this distributor
        for role_name, perm_patterns in ROLE_PERMISSIONS.items():
            role = Role.objects.create(
                distributor=distributor,
                name=role_name.capitalize(),
                description=f"Migrated from legacy {role_name} role",
                is_system=True,
                is_active=True
            )
            
            # Assign permissions matching patterns
            for pattern in perm_patterns:
                if pattern.endswith('.*'):
                    # Wildcard - get all permissions for module
                    module = pattern[:-2]
                    perms = Permission.objects.filter(module=module)
                else:
                    perms = Permission.objects.filter(code=pattern)
                
                role.permissions.add(*perms)
            
            # Assign this role to users who had the legacy role
            users_with_role = User.objects.filter(
                distributor=distributor,
                role=role_name
            )
            
            for user in users_with_role:
                if user.current_branch:
                    UserRole.objects.create(
                        user=user,
                        role=role,
                        branch=user.current_branch,
                        is_primary=True
                    )


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0001_initial'),
        ('users', '0002_add_multi_tenant_fields'),
    ]

    operations = [
        migrations.RunPython(create_distributors_and_branches),
        migrations.RunPython(create_default_roles),
    ]
```

### Phase 3: Update Other Models

Add `branch` FK to Product, Order, Category models:

```python
# In products/models.py
class Product(models.Model):
    # ... existing fields ...
    branch = models.ForeignKey(
        'core.Branch',
        on_delete=models.CASCADE,
        null=True,  # Nullable during migration
        related_name='products'
    )

# Similarly for Order and Category models
```

Create migration to backfill branch relationships:

```python
# products/migrations/000X_backfill_branches.py
def backfill_product_branches(apps, schema_editor):
    Product = apps.get_model('products', 'Product')
    User = apps.get_model('users', 'User')
    
    for product in Product.objects.all():
        # Find a user with matching organization_id
        user = User.objects.filter(organization_id=product.organization_id).first()
        if user and user.current_branch:
            product.branch = user.current_branch
            product.save()
```

### Phase 4: Frontend Updates

#### Step 1: Update Auth Context
Add branch and permission support to `AuthContext.tsx`:

```typescript
interface AuthState {
  user: User | null;
  distributor: Distributor | null;
  currentBranch: Branch | null;
  availableBranches: Branch[];
  permissions: Set<string>;
  roles: Role[];
}
```

#### Step 2: Create Permission Hook
```typescript
// hooks/usePermission.ts
export function usePermission(permission: string): boolean {
  const { permissions } = useAuth();
  return permissions?.has(permission) ?? false;
}

export function useHasAnyPermission(perms: string[]): boolean {
  const { permissions } = useAuth();
  return perms.some(p => permissions?.has(p));
}
```

#### Step 3: Create Protected Components
```typescript
// components/PermissionGate.tsx
export function PermissionGate({ 
  permission, 
  children 
}: { 
  permission: string; 
  children: React.ReactNode;
}) {
  const hasPermission = usePermission(permission);
  return hasPermission ? <>{children}</> : null;
}
```

### Phase 5: Deployment

1. **Backup Database**
   ```bash
   pg_dump -h localhost -U postgres commerce_db_v2 > backup_$(date +%Y%m%d).sql
   ```

2. **Run Migrations**
   ```bash
   python manage.py migrate
   python manage.py seed_permissions
   ```

3. **Verify Data Integrity**
   ```python
   # Check all users have distributor and branch
   assert User.objects.filter(distributor__isnull=True).count() == 0
   assert User.objects.filter(current_branch__isnull=True).count() == 0
   
   # Check all products have branch
   assert Product.objects.filter(branch__isnull=True).count() == 0
   ```

4. **Deploy Frontend**
   ```bash
   cd frontend
   npm run build
   # Deploy to hosting
   ```

5. **Update Environment Variables**
   Ensure all production environment variables are configured.

## Rollback Plan

If issues occur:

1. **Database Rollback**
   ```bash
   psql -h localhost -U postgres commerce_db_v2 < backup_YYYYMMDD.sql
   ```

2. **Code Rollback**
   ```bash
   git revert <commit-hash>
   ```

3. **Frontend Rollback**
   Deploy previous build

## Post-Migration Tasks

1. **Create SuperAdmin** user
   ```python
   python manage.py createsuperuser --email=super@admin.com
   ```

2. **Test All Features**
   - Login as different roles
   - Create invoices
   - Manage products
   - Switch branches
   - View reports

3. **Monitor Performance**
   - Check query performance
   - Monitor API response times
   - Watch for permission check overhead

## Estimated Timeline

- Phase 1 (Schema): 1 day
- Phase 2 (Data Migration): 2 days
- Phase 3 (Model Updates): 2 days
- Phase 4 (Frontend): 3 days
- Phase 5 (Deployment & Testing): 2 days

**Total: ~10 working days**
