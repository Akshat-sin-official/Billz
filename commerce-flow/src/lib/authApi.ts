import { api, tokenStorage } from '@/lib/apiClient';
import type { User, UserRole } from '@/types';

type DjangoUser = {
  id: number | string;
  email: string;
  first_name: string;
  last_name: string;
  role?: string;
  organization_id?: string;
  branch_id?: string;
  avatar?: string;
  is_active?: boolean;
  created_at?: string;
};

type AuthResponse = {
  access: string;
  refresh: string;
  user?: DjangoUser;
};

function coerceRole(role?: string): UserRole {
  const allowed: UserRole[] = ['super_admin', 'owner', 'manager', 'cashier', 'auditor'];
  if (role && (allowed as string[]).includes(role)) return role as UserRole;
  return 'owner';
}

export function mapDjangoUserToUser(u: DjangoUser): User {
  return {
    id: String(u.id),
    email: u.email,
    firstName: u.first_name ?? '',
    lastName: u.last_name ?? '',
    role: coerceRole(u.role),
    organizationId: u.organization_id ?? '',
    branchId: u.branch_id,
    avatar: u.avatar,
    isActive: u.is_active ?? true,
    createdAt: u.created_at ?? new Date().toISOString(),
  };
}

export const authApi = {
  async login(email: string, password: string) {
    const data = await api.post<AuthResponse>('/auth/login/', { email, password }, { auth: false });
    tokenStorage.setTokens({ access: data.access, refresh: data.refresh });

    const user = data.user ? mapDjangoUserToUser(data.user) : await authApi.me();
    return { user, accessToken: data.access, refreshToken: data.refresh };
  },

  async register(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    businessName: string;
  }) {
    const payload = {
      email: input.email,
      password: input.password,
      first_name: input.firstName,
      last_name: input.lastName,
      business_name: input.businessName,
    };

    const data = await api.post<AuthResponse>('/auth/register/', payload, { auth: false });
    tokenStorage.setTokens({ access: data.access, refresh: data.refresh });

    const user = data.user ? mapDjangoUserToUser(data.user) : await authApi.me();
    return { user, accessToken: data.access, refreshToken: data.refresh };
  },

  async me() {
    const u = await api.get<DjangoUser>('/auth/me/');
    return mapDjangoUserToUser(u);
  },

  async logout() {
    try {
      await api.post('/auth/logout/', undefined);
    } finally {
      tokenStorage.clear();
    }
  },
};
