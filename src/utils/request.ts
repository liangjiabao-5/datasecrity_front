import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';
import { apiBaseUrl } from './env';
import type { ApiError, ApiResponse } from '@/types/api';
import type { AuthSession } from '@/types/auth';
import { authSession } from '@/utils/authSession';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuthRefresh?: boolean;
    _retry?: boolean;
  }
}

const service = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  withCredentials: true
});

service.interceptors.request.use((config) => {
  const token = authSession.getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshRequest: Promise<AuthSession> | null = null;
let isRedirectingToLogin = false;

const parseApiPayload = <T>(response: AxiosResponse<ApiResponse<T> | T>): T => {
  const payload = response.data;
  if (payload && typeof payload === 'object' && 'code' in payload) {
    const apiPayload = payload as ApiResponse<T>;
    if (apiPayload.code !== 'SUCCESS') {
      throw {
        code: apiPayload.code,
        message: apiPayload.message || '请求失败',
        data: apiPayload.data,
        traceId: apiPayload.traceId
      } satisfies ApiError;
    }
    return apiPayload.data;
  }
  return payload as T;
};

const resetSessionAndRedirect = (message = '登录状态已失效，请重新登录') => {
  authSession.clear();
  window.dispatchEvent(new CustomEvent('auth:expired'));
  if (isRedirectingToLogin || window.location.pathname === '/login') return;

  isRedirectingToLogin = true;
  ElMessage.error(message);
  const redirect = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
};

service.interceptors.response.use(
  (response) => {
    if (response.config.url === '/auth/login' || response.config.url === '/auth/refresh') isRedirectingToLogin = false;
    return response;
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const status = error.response?.status;
    const payload = error.response?.data;
    const message = payload?.message || error.message || '网络请求失败';
    const originalRequest = error.config as InternalAxiosRequestConfig;

    if (status === 401 && originalRequest && !originalRequest.skipAuthRefresh) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        try {
          if (!refreshRequest) {
            refreshRequest = service
              .post<ApiResponse<AuthSession> | AuthSession>('/auth/refresh', undefined, { skipAuthRefresh: true })
              .then(parseApiPayload<AuthSession>)
              .then((session) => {
                authSession.setAccessToken(session.accessToken);
                window.dispatchEvent(new CustomEvent<AuthSession>('auth:refreshed', { detail: session }));
                return session;
              })
              .finally(() => {
                refreshRequest = null;
              });
          }
          await refreshRequest;
          return service(originalRequest);
        } catch {
          resetSessionAndRedirect();
        }
      } else {
        resetSessionAndRedirect();
      }
    } else if (status === 403) {
      ElMessage.error('无权限执行当前操作');
      if (payload?.code === 'PROJECT_ACCESS_DENIED' && /^\/projects\/[^/]+/.test(originalRequest?.url || '') && window.location.pathname !== '/projects') {
        window.location.replace('/projects');
      }
    } else if (status && status >= 500) {
      ElMessage.error(`服务异常：${message}`);
    }

    return Promise.reject({
      code: payload?.code || String(status || 'NETWORK_ERROR'),
      message,
      data: payload?.data,
      traceId: payload?.traceId
    } satisfies ApiError);
  }
);

const unwrap = <T>(response: AxiosResponse<ApiResponse<T> | T>): T => {
  return parseApiPayload<T>(response);
};

const unwrapEnvelope = <T>(response: AxiosResponse<ApiResponse<T> | T>): ApiResponse<T> => {
  const payload = response.data;
  if (payload && typeof payload === 'object' && 'code' in payload) {
    const apiPayload = payload as ApiResponse<T>;
    if (apiPayload.code !== 'SUCCESS') {
      throw {
        code: apiPayload.code,
        message: apiPayload.message || '请求失败',
        data: apiPayload.data,
        traceId: apiPayload.traceId
      } satisfies ApiError;
    }
    return apiPayload;
  }
  return {
    code: 'SUCCESS',
    message: '',
    data: payload as T
  };
};

const parseContentDispositionFileName = (header?: string): string | undefined => {
  if (!header) return undefined;
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return utf8Match[1].trim();
    }
  }

  const asciiMatch = header.match(/filename="?([^";]+)"?/i);
  return asciiMatch?.[1]?.trim();
};

export const http = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.get<ApiResponse<T> | T>(url, config).then(unwrap<T>);
  },
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return service.post<ApiResponse<T> | T>(url, data, config).then(unwrap<T>);
  },
  postEnvelope<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.post<ApiResponse<T> | T>(url, data, config).then(unwrapEnvelope<T>);
  },
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return service.put<ApiResponse<T> | T>(url, data, config).then(unwrap<T>);
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.delete<ApiResponse<T> | T>(url, config).then(unwrap<T>);
  },
  blob(url: string, config?: AxiosRequestConfig): Promise<Blob> {
    return service
      .get<Blob>(url, {
        ...config,
        responseType: 'blob'
      })
      .then((response) => response.data);
  },
  blobFile(url: string, config?: AxiosRequestConfig): Promise<{ blob: Blob; fileName?: string }> {
    return service
      .get<Blob>(url, {
        ...config,
        responseType: 'blob'
      })
      .then((response) => ({
        blob: response.data,
        fileName: parseContentDispositionFileName(response.headers['content-disposition'])
      }));
  }
};
