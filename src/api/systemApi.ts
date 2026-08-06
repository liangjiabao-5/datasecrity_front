import type { PageQuery, PageResult } from '@/types/api';
import type { Permission, RolePayload, SystemRole, SystemUser, UserCreatePayload, UserUpdatePayload } from '@/types/auth';
import { http } from '@/utils/request';

export const userApi = {
  list(params: PageQuery & { roleCode?: string }): Promise<PageResult<SystemUser>> {
    return http.get('/users', { params });
  },
  detail(userId: string): Promise<SystemUser> {
    return http.get(`/users/${userId}`);
  },
  create(payload: UserCreatePayload): Promise<SystemUser> {
    return http.post('/users', payload);
  },
  update(userId: string, payload: UserUpdatePayload): Promise<SystemUser> {
    return http.put(`/users/${userId}`, payload);
  },
  resetPassword(userId: string, newPassword: string): Promise<void> {
    return http.post(`/users/${userId}/reset-password`, { newPassword });
  }
};

export const roleApi = {
  list(): Promise<SystemRole[]> {
    return http.get('/roles');
  },
  detail(roleId: string): Promise<SystemRole> {
    return http.get(`/roles/${roleId}`);
  },
  create(payload: RolePayload): Promise<SystemRole> {
    return http.post('/roles', payload);
  },
  update(roleId: string, payload: RolePayload): Promise<SystemRole> {
    return http.put(`/roles/${roleId}`, payload);
  },
  updatePermissions(roleId: string, permissionIds: string[]): Promise<SystemRole> {
    return http.put(`/roles/${roleId}/permissions`, { permissionIds });
  },
  delete(roleId: string): Promise<void> {
    return http.delete(`/roles/${roleId}`);
  },
  permissions(): Promise<Permission[]> {
    return http.get('/permissions');
  }
};
