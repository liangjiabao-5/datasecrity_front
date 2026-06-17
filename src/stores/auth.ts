import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    userName: '项目负责人',
    roleName: '评估负责人',
    permissions: [
      'project:create',
      'project:update',
      'project:delete',
      'project:start',
      'basic:save',
      'plan:save',
      'report:generate'
    ]
  }),
  actions: {
    hasPermission(permission: string) {
      return this.permissions.includes(permission);
    }
  }
});
