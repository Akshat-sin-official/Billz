> You are a **Principal Software Architect & Senior Full-Stack Engineer**.
>
> You are working on an existing **production-ready POS / Billing & Invoice Management System**.
>
> **Current Stack**
>
> * Frontend: React + Vite (SPA, JWT auth, role-protected routes)
> * Backend: Django + Django REST Framework
> * Auth: JWT (SimpleJWT)
> * Existing domain apps: `users`, `products`, `orders`
> * Current system already supports:
>
>   * POS billing, invoices, inventory, customers, reports
>   * Organization-level data isolation via `organization_id`
>   * Basic roles (Owner, Manager, Cashier, Auditor)
>
> ---
>
> ## OBJECTIVE
>
> Upgrade the system into a **true enterprise-grade multi-tenant SaaS platform** with:
>
> ```
> SuperAdmin (Platform Owner)
>  └── Distributor (Tenant / Enterprise)
>       └── Branch (Store / Business Unit)
>            └── Users (Staff with Roles)
> ```
>
> This must be done **without breaking existing features**.
>
> ---
>
> ## REQUIRED DELIVERABLES
>
> ### 1️⃣ Backend Architecture Changes
>
> * Introduce new core entities:
>
>   * `Distributor` (Tenant)
>   * `Branch` (Business Unit)
> * Replace `organization_id` with `branch_id`
> * Ensure **strict tenant isolation**:
>
>   * All Products, Orders, Customers, Invoices must be branch-scoped
>   * No cross-branch or cross-distributor data leaks
>
> ---
>
> ### 2️⃣ Enterprise-Level RBAC (MANDATORY)
>
> Replace hardcoded roles with **dynamic RBAC**:
>
> * `Permission` (system-defined, global)
>
>   * e.g. `invoice.create`, `product.delete`, `report.view`
> * `Role` (distributor-scoped)
>
>   * Created & managed by Distributor Admin
> * `RolePermission` mapping
> * `UserRole` mapping (user + role + branch)
>
> Constraints:
>
> * Same user may have different roles in different branches
> * Permissions must be **enforced at API level**
>
> ---
>
> ### 3️⃣ Authentication & Authorization
>
> * Extend JWT payload to include:
>
>   * `distributor_id`
>   * `branch_id`
>   * role IDs
>   * flattened permission codes
> * Authorization checks must:
>
>   * Avoid DB queries per request
>   * Use permission codes for DRF view protection
>
> ---
>
> ### 4️⃣ SuperAdmin Layer (Platform Control)
>
> Design APIs & structure for:
>
> * SuperAdmin dashboard
> * Create / disable Distributors
> * Assign Distributor Admins
> * View system-wide metrics (optional)
>
> SuperAdmin must be **fully isolated** from branch data.
>
> ---
>
> ### 5️⃣ Frontend Updates (React)
>
> * Add permission-based rendering:
>
>   * Buttons, routes, and actions must respect permissions
> * Introduce branch context:
>
>   * Branch selector (only if user has access to multiple branches)
> * Maintain existing UX patterns (POS keyboard shortcuts, speed)
>
> ---
>
> ### 6️⃣ Migration Strategy (IMPORTANT)
>
> * No data loss
> * Existing organizations must be auto-migrated into:
>
>   * One Distributor
>   * One default Branch
> * Include:
>
>   * Model migrations
>   * Backfill logic
>   * Rollout steps
>
> ---
>
> ## OUTPUT FORMAT (STRICT)
>
> Respond with:
>
> 1. **High-level architecture overview**
> 2. **Django model definitions**
> 3. **JWT payload structure**
> 4. **DRF permission enforcement examples**
> 5. **Frontend state & routing changes**
> 6. **Migration plan (step-by-step)**
>
> Use:
>
> * Concise technical language
> * No fluff
> * Production-ready reasoning
>
> Assume this system must scale to **thousands of distributors and branches**.