import { defineStore } from 'pinia';
import { authApi } from '@/api/authApi';
import { notifyApiError } from '@/utils/apiFeedback';
import type { AxiosRequestConfig } from 'axios';
import { authSession } from '@/utils/authSession';
import { useMock } from '@/utils/env';
import { useProjectStore } from '@/stores/project';
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
    sessionVersion: 0,
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
      if (this.principal?.id !== session.user.id) {
        this.clearSession();
      }
      authSession.setAccessToken(session.accessToken);
      this.principal = session.user;
      this.initialized = true;
    },
    updateAccessToken(token: string) {
      authSession.setAccessToken(token);
      this.initialized = true;
    },
    async login(payload: LoginPayload) {
      this.clearSession();
      if (useMock) {
        this.applySession({ accessToken: 'mock-access-token', tokenType: 'Bearer', expiresIn: 1800, user: { ...mockPrincipal, username: payload.username || 'admin' } });
        return;
      }
      const response = await authApi.login(payload);
      this.applySession(response.data);
      return response;
    },
    async initialize() {
      if (this.initialized) return this.isAuthenticated;
      if (this.initializing) return this.initializing;

      const version = this.sessionVersion;
      this.initializing = (async () => {
        if (useMock) {
          this.applySession({ accessToken: 'mock-access-token', tokenType: 'Bearer', expiresIn: 1800, user: mockPrincipal });
          return true;
        }
        try {
          const session = await authApi.refresh();
          if (version !== this.sessionVersion) return this.isAuthenticated;
          this.applySession(session);
          return true;
        } catch (error) {
          if (!['401', 'UNAUTHORIZED', 'TOKEN_EXPIRED'].includes(String((error as { code?: string })?.code))) {
            notifyApiError(error, '无法恢复登录状态，请检查网络后重试');
          }
          if (version === this.sessionVersion) this.clearSession();
          return false;
        } finally {
          this.initializing = null;
        }
      })();
      return this.initializing;
    },
    async syncPrincipal(config?: AxiosRequestConfig) {
      if (!this.isAuthenticated) return false;
      if (useMock) return true;
      const version = this.sessionVersion;
      const userId = this.principal?.id;
      const principal = await authApi.me(config);
      if (version !== this.sessionVersion || !this.isAuthenticated) return false;
      if (principal.id !== userId) {
        this.clearSession();
        return false;
      }
      this.principal = principal;
      return true;
    },
    async logout() {
      const wasAuthenticated = this.isAuthenticated;
      this.clearSession();
      if (!useMock && wasAuthenticated) return authApi.logout();
    },
    clearSession() {
      authSession.clear();
      this.principal = null;
      this.sessionVersion += 1;
      useProjectStore().clearProject();
      this.initialized = true;
    }
  }
});
