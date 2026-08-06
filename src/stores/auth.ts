import { defineStore } from 'pinia';
import { authApi } from '@/api/authApi';
import { authSession } from '@/utils/authSession';
import { useMock } from '@/utils/env';
import type { AuthSession, LoginPayload, Principal } from '@/types/auth';

const mockPrincipal: Principal = {
  id: 'mock-admin',
  username: 'admin',
  displayName: '系统管理员',
  status: 'ACTIVE',
  roles: [{ id: 'role-super-admin', code: 'SUPER_ADMIN', name: '超级管理员' }],
  permissions: [
    'project:create',
    'project:read',
    'project:edit',
    'project:delete',
    'project:member:manage',
    'project:owner:transfer',
    'knowledge:manage',
    'system:user:manage',
    'system:role:manage',
    'system:permission:read'
  ]
};

export const useAuthStore = defineStore('auth', {
  state: () => ({
    principal: null as Principal | null,
    initialized: false,
    initializing: null as Promise<boolean> | null
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.principal && authSession.getAccessToken()),
    userName: (state) => state.principal?.displayName || '',
    roleName: (state) => state.principal?.roles.map((role) => role.name).join('、') || '',
    permissions: (state) => state.principal?.permissions || [],
    isSuperAdmin: (state) => state.principal?.roles.some((role) => role.code === 'SUPER_ADMIN') || false
  },
  actions: {
    hasPermission(permission: string) {
      return this.isSuperAdmin || this.permissions.includes(permission);
    },
    hasAnyPermission(permissions: string[]) {
      return this.isSuperAdmin || permissions.some((permission) => this.permissions.includes(permission));
    },
    applySession(session: AuthSession) {
      authSession.setAccessToken(session.accessToken);
      this.principal = session.user;
      this.initialized = true;
    },
    updateAccessToken(token: string) {
      authSession.setAccessToken(token);
      this.initialized = true;
    },
    async login(payload: LoginPayload) {
      if (useMock) {
        this.applySession({ accessToken: 'mock-access-token', tokenType: 'Bearer', expiresIn: 1800, user: { ...mockPrincipal, username: payload.username || 'admin' } });
        return;
      }
      this.applySession(await authApi.login(payload));
    },
    async initialize() {
      if (this.initialized) return this.isAuthenticated;
      if (this.initializing) return this.initializing;

      this.initializing = (async () => {
        if (useMock) {
          this.applySession({ accessToken: 'mock-access-token', tokenType: 'Bearer', expiresIn: 1800, user: mockPrincipal });
          return true;
        }
        try {
          this.applySession(await authApi.refresh());
          return true;
        } catch {
          this.clearSession();
          return false;
        } finally {
          this.initializing = null;
        }
      })();
      return this.initializing;
    },
    async logout() {
      try {
        if (!useMock && this.isAuthenticated) await authApi.logout();
      } finally {
        this.clearSession();
      }
    },
    clearSession() {
      authSession.clear();
      this.principal = null;
      this.initialized = true;
    }
  }
});
