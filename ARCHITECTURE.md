# Enterprise Multi-Tenant SaaS Architecture

## System Hierarchy

```
SuperAdmin (Platform Owner)
 └── Distributor (Tenant / Enterprise)
      ├── Branches (Business Units / Stores)
      │    ├── Products (Branch-scoped inventory)
      │    ├── Orders/Invoices (Branch-scoped transactions)
      │    ├── Customers (Branch-scoped)
      │    └── Users (Staff with dynamic roles)
      └── Roles (Distributor-defined, permission-mapped)
```

## Core Entities

### 1. Distributor (Tenant)
- Root entity for multi-tenancy
- Owns branches, roles, and configurations
- Complete data isolation between distributors

### 2. Branch
- Business unit within a distributor
- Replaces the old `organization_id` concept
- All transactional data is branch-scoped

### 3. Dynamic RBAC System
- **Permission**: System-defined actions (e.g., `invoice.create`, `product.delete`)
- **Role**: Distributor-defined role templates
- **RolePermission**: Maps permissions to roles
- **UserRole**: Assigns roles to users per branch

### 4. SuperAdmin
- Platform-level control
- Can create/disable distributors
- View system-wide metrics
- Fully isolated from business data

## Data Isolation Strategy

```python
# All queries must include branch context
queryset.filter(branch_id=request.user.branch_id)

# JWT contains:
{
  "user_id": "uuid",
  "distributor_id": "uuid",
  "branch_id": "uuid",  # Current active branch
  "roles": ["role-uuid-1", "role-uuid-2"],
  "permissions": ["invoice.create", "product.view", "product.edit"]
}
```

## Security Model

1. **Row-Level Security**: Every model with business data has `branch_id`
2. **Permission Enforcement**: DRF views check permission codes from JWT
3. **API Authorization**: Custom permission classes validate against JWT claims
4. **No Lateral Movement**: Users cannot access data outside their branch

## Migration Strategy

### Phase 1: Schema Migration
1. Create new tables (Distributor, Branch, Permission, Role, etc.)
2. Add `branch_id` to existing models (nullable initially)
3. Backfill: Convert `organization_id` → create Distributor + Branch
4. Make `branch_id` non-nullable
5. Drop `organization_id`

### Phase 2: Data Migration
- Auto-create default Distributor for each unique `organization_id`
- Create one Branch per organization
- Assign existing users to the new branch
- Migrate role strings to dynamic Role entities

### Phase 3: Feature Rollout
- Deploy backend with backward compatibility
- Release SuperAdmin dashboard
- Enable permission management UI
- Gradual rollout to existing users

## API Structure

```
/api/v1/
  ├── superadmin/
  │    ├── distributors/
  │    ├── metrics/
  │    └── system-health/
  ├── distributors/
  │    ├── branches/
  │    ├── roles/
  │    └── permissions/
  ├── branches/
  │    └── switch/
  ├── products/
  ├── invoices/
  ├── customers/
  └── auth/
       ├── login/
       ├── refresh/
       └── me/
```

## Frontend Architecture

### State Management
```typescript
// Global Context
{
  user: User,
  distributor: Distributor,
  currentBranch: Branch,
  availableBranches: Branch[],
  permissions: Set<string>,
  roles: Role[]
}
```

### Route Protection
```typescript
<ProtectedRoute permission="invoice.create">
  <BillingPage />
</ProtectedRoute>
```

### Component Patterns
- Permission-wrapped buttons
- Branch-aware data fetching
- Role-based navigation
- Modular admin panels

## Scalability Considerations

- **Sharding**: Distributed by `distributor_id`
- **Caching**: Redis for permission lookups
- **Read Replicas**: Per-distributor if needed
- **CDN**: Static assets and reports
- **Job Queue**: Async operations (reports, exports)
