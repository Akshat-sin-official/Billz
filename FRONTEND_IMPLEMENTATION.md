# Frontend Implementation Guide - Multi-Tenant SaaS UI

## Tech Stack
- React + TypeScript + Vite
- TailwindCSS for styling
- shadcn/ui components
- React Query for data fetching
- Zustand for state management
- React Router v6

## Architecture Overview

```
src/
├── components/
│   ├── admin/           # SuperAdmin components
│   ├── distributor/     # Distributor management
│   ├── branch/          # Branch management
│   ├── roles/           # Role & Permission management
│   ├── common/          # Shared components
│   └── ui/              # shadcn/ui components
├── contexts/
│   └── AuthContext.tsx  # Extended with multi-tenant support
├── hooks/
│   ├── usePermission.ts
│   ├── useBranch.ts
│   └── useRoles.ts
├── pages/
│   ├── SuperAdmin/
│   ├── DistributorAdmin/
│   └── [existing pages]
├── services/
│   ├── coreApi.ts       # Multi-tenant API calls
│   └── [existing services]
└── types/
    └── core.ts          # Multi-tenant type definitions
```

## Key Components to Build

### 1. SuperAdmin Dashboard (`/superadmin`)

**Features:**
- List all distributors with stats
- Create/Edit/Disable distributors
- View system-wide metrics
- Manage subscription tiers

**Components:**
- `DistributorsList.tsx` - Data table with filters
- `DistributorForm.tsx` - Create/edit dialog
- `SystemMetrics.tsx` - KPI cards and charts
- `DistributorCard.tsx` - Individual distributor display

### 2. Distributor Admin Portal (`/distributor-admin`)

**Features:**
- Manage branches
- Create and configure roles
- Assign permissions to roles
- View distributor analytics

**Components:**
- `BranchManagement.tsx` - CRUD for branches
- `RoleManagement.tsx` - Role builder with drag-drop permissions
- `PermissionMatrix.tsx` - Visual permission assignment grid
- `UserRoleAssignment.tsx` - Assign roles to users per branch

### 3. Branch Selector Component

**Location:** Top navigation bar

**Features:**
- Dropdown showing available branches
- Switch branch context
- Show current branch indicator
- Persist selection in local storage

```typescript
// components/common/BranchSelector.tsx
export function BranchSelector() {
  const { currentBranch, availableBranches, switchBranch } = useBranch();
  
  return (
    <Select value={currentBranch?.id} onValueChange={switchBranch}>
      <SelectTrigger className="w-[200px]">
        <Building2 className="mr-2 h-4 w-4" />
        <SelectValue>{currentBranch?.name}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {availableBranches.map(branch => (
          <SelectItem key={branch.id} value={branch.id}>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{branch.code}</Badge>
              {branch.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### 4. Permission-Based Rendering

**Utility Components:**
```typescript
// components/common/PermissionGate.tsx
export function PermissionGate({
  permission,
  fallback,
  children
}: {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const hasPermission = usePermission(permission);
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

// Usage in existing pages
<PermissionGate permission="invoice.create">
  <Button onClick={createInvoice}>New Invoice</Button>
</PermissionGate>
```

### 5. Role Management UI

**Visual Builder:**
- Drag-and-drop interface for assigning permissions
- Group permissions by module
- Preview role capabilities
- Clone existing roles

```typescript
// components/roles/RoleBuilder.tsx
export function RoleBuilder({ roleId }: { roleId?: string }) {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const { data: permissions } = usePermissions();
  
  // Group permissions by module
  const grouped = groupBy(permissions, 'module');
  
  return (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Available Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(grouped).map(([module, perms]) => (
            <PermissionModule 
              key={module}
              module={module}
              permissions={perms}
              onToggle={(perm) => togglePermission(perm)}
              selected={selectedPermissions}
            />
          ))}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Selected Permissions ({selectedPermissions.size})</CardTitle>
        </CardHeader>
        <CardContent>
          <PermissionSummary permissions={selectedPermissions} />
        </CardContent>
      </Card>
    </div>
  );
}
```

### 6. Enhanced Navigation

**Update AppSidebar:**
- Show/hide nav items based on permissions
- Branch indicator
- Role badge
- Quick branch switcher

```typescript
// components/layout/AppSidebar.tsx
const navItems = [
  {
    title: 'Dashboard',
    icon: Home,
    href: '/',
    permission: null // Always visible
  },
  {
    title: 'Billing',
    icon: Receipt,
    href: '/billing',
    permission: 'pos.access'
  },
  {
    title: 'Products',
    icon: Package,
    href: '/products',
    permission: 'product.view'
  },
  //... etc
  {
    title: 'Distributor Admin',
    icon: Building2,
    href: '/distributor-admin',
    permission: 'distributor.manage',
    badge: 'Admin'
  },
  {
    title: 'SuperAdmin',
    icon: Shield,
    href: '/superadmin',
    superAdminOnly: true
  }
];

// Render logic
{navItems.map(item => {
  if (item.superAdminOnly && !user?.is_superuser) return null;
  if (item.permission && !hasPermission(item.permission)) return null;
  
  return <NavItem key={item.href} {...item} />;
})}
```

## Modern UI Design Patterns

### Design System
- **Colors**: Professional gradient palette with brand consistency
- **Typography**: Inter + Poppins for headings
- **Spacing**: 8px grid system
- **Components**: All from shadcn/ui with custom theming

### Visual Hierarchy

**SuperAdmin Dashboard:**
- Dark theme with accent colors
- Large metric cards with animations
- Real-time charts (Recharts)
- Data tables with advanced filters

**Distributor Admin:**
- Light professional theme
- Card-based layouts
- Visual permission matrix
- Drag-and-drop role builder

**Branch Selector:**
- Instant switch with smooth transition
- Visual feedback (toast notification)
- Breadcrumb showing hierarchy

### Micro-interactions

1. **Permission Toggle**
   - Smooth checkbox animations
   - Group select with ripple effect
   - Undo/redo support

2. **Branch Switch**
   - Loading skeleton while switching
   - Confetti animation on first switch
   - Context-aware color theme per branch

3. **Role Cards**
   - Hover effects showing permission count
   - Color-coded by privilege level
   - Quick actions menu

## API Integration

### Extended Auth Context

```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  // User
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  
  // Multi-tenant
  distributor: Distributor | null;
  currentBranch: Branch | null;
  availableBranches: Branch[];
  switchBranch: (branchId: string) => Promise<void>;
  
  // Permissions
  permissions: Set<string>;
  roles: Role[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}
```

### Custom Hooks

```typescript
// hooks/usePermission.ts
export function usePermission(permission: string): boolean {
  const { permissions } = useAuth();
  return permissions.has(permission);
}

// hooks/useBranch.ts
export function useBranch() {
  const { currentBranch, availableBranches, switchBranch } = useAuth();
  
  const switchTo = async (branchId: string) => {
    await switchBranch(branchId);
    // Refresh data
    queryClient.invalidateQueries();
  };
  
  return { currentBranch, availableBranches, switchTo };
}

// hooks/useRoles.ts
export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => coreApi.getRoles()
  });
}
```

## Implementation Priority

### Phase 1 (Week 1)
1. ✅ Update AuthContext with multi-tenant support
2. ✅ Create permission hooks
3. ✅ Build BranchSelector component
4. ✅ Add permission gates to existing pages

### Phase 2 (Week 2)
1. ✅ SuperAdmin dashboard
2. ✅ Distributor list and CRUD
3. ✅ System metrics

### Phase 3 (Week 3)
1. ✅ Distributor Admin portal
2. ✅ Branch management
3. ✅ Role builder with permission matrix

### Phase 4 (Week 4)
1. ✅ User-role assignment UI
2. ✅ Permission testing tools
3. ✅ Polish and animations
4. ✅ End-to-end testing

## Testing Strategy

### Permission Testing
- Test each permission gate
- Verify API authorization
- Test branch switching

### Role Testing
- Create test roles with different permissions
- Verify UI shows/hides correctly
- Test cross-branch access

### Integration Tests
- Complete user flows
- Branch switching scenarios
- Permission inheritance

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation for all forms
- Screen reader support for permission states
- High contrast mode support

## Performance Optimization

1. **Lazy Loading**
   - Code split SuperAdmin and Distributor Admin routes
   - Lazy load permission matrix

2. **Caching**
   - Cache permission checks
   - Persist branch selection
   - Cache role data

3. **Optimistic Updates**
   - Immediate UI feedback on branch switch
   - Optimistic permission toggles

## Mobile Responsiveness

- Branch selector adapts to mobile
- Permission matrix becomes scrollable list
- Admin dashboards stack vertically
- Touch-friendly controls

This comprehensive frontend will provide an enterprise-grade, beautiful user experience for the multi-tenant SaaS platform!
