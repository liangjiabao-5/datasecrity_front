import type { ApiResponse } from '@/types/api';
import { mockEnvelope } from '@/utils/apiFeedback';
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
  create(payload: UserCreatePayload): Promise<ApiResponse<SystemUser>> {
    return http.postEnvelope('/users', payload);
  },
  update(userId: string, payload: UserUpdatePayload): Promise<ApiResponse<SystemUser>> {
    return http.putEnvelope(`/users/${userId}`, payload);
  },
  resetPassword(userId: string, newPassword: string): Promise<ApiResponse<void>> {
    return http.postEnvelope(`/users/${userId}/reset-password`, { newPassword });
  }
};

export const roleApi = {
  list(): Promise<SystemRole[]> {
    return http.get('/roles');
  },
  detail(roleId: string): Promise<SystemRole> {
    return http.get(`/roles/${roleId}`);
  },
  create(payload: RolePayload): Promise<ApiResponse<SystemRole>> {
    return http.postEnvelope('/roles', payload);
  },
  update(roleId: string, payload: RolePayload): Promise<ApiResponse<SystemRole>> {
    return http.putEnvelope(`/roles/${roleId}`, payload);
  },
  updatePermissions(roleId: string, permissionIds: string[]): Promise<ApiResponse<SystemRole>> {
    return http.putEnvelope(`/roles/${roleId}/permissions`, { permissionIds });
  },
  delete(roleId: string): Promise<ApiResponse<void>> {
    return http.deleteEnvelope(`/roles/${roleId}`);
  },
  permissions(): Promise<Permission[]> {
    return http.get('/permissions');
  }
};
