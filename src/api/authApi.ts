import { http } from '@/utils/request';
import type { AuthSession, ChangePasswordPayload, LoginPayload, Principal } from '@/types/auth';

const publicRequestConfig = { skipAuthRefresh: true };

export const authApi = {
  login(payload: LoginPayload): Promise<AuthSession> {
    return http.post('/auth/login', payload, publicRequestConfig);
  },

  refresh(): Promise<AuthSession> {
    return http.post('/auth/refresh', undefined, publicRequestConfig);
  },

  logout(): Promise<void> {
    return http.post('/auth/logout', undefined, publicRequestConfig);
  },

  me(): Promise<Principal> {
    return http.get('/auth/me');
  },

  changePassword(payload: ChangePasswordPayload): Promise<Partial<AuthSession> | void> {
    return http.put('/auth/me/password', payload);
  }
};
