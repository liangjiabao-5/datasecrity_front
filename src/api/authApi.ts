import type { ApiResponse } from '@/types/api';
import { http } from '@/utils/request';
import type { AuthSession, ChangePasswordPayload, LoginPayload, Principal } from '@/types/auth';
import type { AxiosRequestConfig } from 'axios';

const publicRequestConfig: AxiosRequestConfig = { skipAuthRefresh: true, errorMode: 'manual' };

export const authApi = {
  login(payload: LoginPayload): Promise<ApiResponse<AuthSession>> {
    return http.postEnvelope('/auth/login', payload, publicRequestConfig);
  },

  refresh(): Promise<AuthSession> {
    return http.post('/auth/refresh', undefined, publicRequestConfig);
  },

  logout(): Promise<ApiResponse<void>> {
    return http.postEnvelope('/auth/logout', undefined, publicRequestConfig);
  },

  me(config?: AxiosRequestConfig): Promise<Principal> {
    return http.get('/auth/me', config);
  },

  changePassword(payload: ChangePasswordPayload): Promise<ApiResponse<Partial<AuthSession> | void>> {
    return http.putEnvelope('/auth/me/password', payload);
  }
};
