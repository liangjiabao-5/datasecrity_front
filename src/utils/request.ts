import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';
import { apiBaseUrl } from './env';
import type { ApiError, ApiResponse } from '@/types/api';
import type { AuthSession } from '@/types/auth';
import { authSession } from '@/utils/authSession';
import { notifyApiError } from '@/utils/apiFeedback';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuthRefresh?: boolean;
    _retry?: boolean;
    _sessionVersion?: number;
    errorMode?: 'message' | 'manual';
  }
}

const service = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  withCredentials: true
});

service.interceptors.request.use((config) => {
  if (config._sessionVersion !== undefined && config._sessionVersion !== authSession.getVersion()) {
    return Promise.reject(sessionChanged());
  }
  config._sessionVersion = authSession.getVersion();
  const token = authSession.getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshRequest: { version: number; promise: Promise<AuthSession> } | null = null;
let isRedirectingToLogin = false;
const sessionChanged = (): ApiError => ({ code: 'SESSION_CHANGED', message: '登录账号已切换，已忽略旧请求' });

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
    if (response.config._sessionVersion !== authSession.getVersion()) return Promise.reject(sessionChanged());
    if (response.config.url === '/auth/login' || response.config.url === '/auth/refresh') isRedirectingToLogin = false;
    return response;
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    if ((error as unknown as ApiError)?.code === 'SESSION_CHANGED') return Promise.reject(error);
    const status = error.response?.status;
    const payload = await readErrorPayload(error.response?.data);
    const message = payload?.message || (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
      ? '请求超时，请稍后重试'
      : !status ? '网络连接失败，请检查网络后重试' : httpStatusMessage(status));
    const apiError: ApiError = {
      code: payload?.code || String(status || 'NETWORK_ERROR'), message,
      data: payload?.data, traceId: payload?.traceId, status
    };
    const originalRequest = error.config as InternalAxiosRequestConfig;
    if (originalRequest?._sessionVersion !== undefined && originalRequest._sessionVersion !== authSession.getVersion()) {
      return Promise.reject(sessionChanged());
    }

    if (status === 401 && originalRequest && !originalRequest.skipAuthRefresh) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        const version = authSession.getVersion();
        try {
          if (!refreshRequest || refreshRequest.version !== version) {
            const promise = service
              .post<ApiResponse<AuthSession> | AuthSession>('/auth/refresh', undefined, { skipAuthRefresh: true })
              .then(parseApiPayload<AuthSession>)
              .then((session) => {
                if (version !== authSession.getVersion()) throw sessionChanged();
                authSession.setAccessToken(session.accessToken);
                window.dispatchEvent(new CustomEvent<AuthSession>('auth:refreshed', { detail: session }));
                return session;
              })
              .finally(() => {
                if (refreshRequest?.promise === promise) refreshRequest = null;
              });
            refreshRequest = { version, promise };
          }
          await refreshRequest.promise;
          return service(originalRequest);
        } catch (failure) {
          if (version !== authSession.getVersion() || (failure as ApiError)?.code === 'SESSION_CHANGED') {
            return Promise.reject(sessionChanged());
          }
          resetSessionAndRedirect();
        }
      } else {
        resetSessionAndRedirect();
      }
    } else if (status === 403) {
      if (payload?.code === 'PROJECT_ACCESS_DENIED' && /^\/projects\/[^/]+/.test(originalRequest?.url || '') && window.location.pathname !== '/projects') {
        notifyApiError(apiError);
        window.location.replace('/projects');
      }
    }

    if (status === 401 && isRedirectingToLogin) apiError.notified = true;
    return Promise.reject(apiError);
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

const httpStatusMessage = (status: number) => ({
  400: '请求参数不正确，请检查后重试', 401: '登录状态已失效，请重新登录',
  403: '无权限执行当前操作', 404: '请求的资源不存在', 405: '当前接口不支持该操作',
  409: '数据已发生变化或存在冲突，请刷新后重试', 422: '提交的数据不符合要求',
  429: '操作过于频繁，请稍后重试'
}[status] || (status >= 500 ? '服务暂时不可用，请稍后重试' : '请求失败，请稍后重试'));

const readErrorPayload = async (value: unknown): Promise<Partial<ApiResponse<unknown>> | undefined> => {
  if (value instanceof Blob) {
    try { return JSON.parse(await value.text()); } catch { return undefined; }
  }
  return value && typeof value === 'object' ? value as Partial<ApiResponse<unknown>> : undefined;
};

const handleFailure = <T>(request: Promise<T>, config?: AxiosRequestConfig): Promise<T> => request.catch((error) => {
  if (config?.errorMode !== 'manual') notifyApiError(error);
  throw error;
});

const unwrapBlob = async (response: AxiosResponse<Blob>): Promise<Blob> => {
  const blob = response.data;
  const contentType = String(response.headers['content-type'] || blob.type).toLowerCase();
  // 下载接口不能把网关/业务 JSON 错误当成一个成功导出的文件。
  const looksJson = contentType.includes('json') || (!contentType && /^\s*[\[{]/.test(await blob.slice(0, 64).text()));
  if (looksJson) {
    const payload = await readErrorPayload(blob);
    throw { code: payload?.code === 'SUCCESS' ? 'INVALID_DOWNLOAD_RESPONSE' : payload?.code || 'INVALID_DOWNLOAD_RESPONSE',
      message: payload?.code !== 'SUCCESS' && payload?.message ? payload.message : '下载失败，服务器未返回有效文件',
      data: payload?.data, traceId: payload?.traceId } satisfies ApiError;
  }
  return blob;
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
    return handleFailure(service.get<ApiResponse<T> | T>(url, config).then(unwrap<T>), config);
  },
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return handleFailure(service.post<ApiResponse<T> | T>(url, data, config).then(unwrap<T>), config);
  },
  postEnvelope<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return handleFailure(service.post<ApiResponse<T> | T>(url, data, config).then(unwrapEnvelope<T>), config);
  },
  putEnvelope<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return handleFailure(service.put<ApiResponse<T> | T>(url, data, config).then(unwrapEnvelope<T>), config);
  },
  deleteEnvelope<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return handleFailure(service.delete<ApiResponse<T> | T>(url, config).then(unwrapEnvelope<T>), config);
  },
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return handleFailure(service.put<ApiResponse<T> | T>(url, data, config).then(unwrap<T>), config);
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return handleFailure(service.delete<ApiResponse<T> | T>(url, config).then(unwrap<T>), config);
  },
  blob(url: string, config?: AxiosRequestConfig): Promise<Blob> {
    return handleFailure(service
      .get<Blob>(url, {
        ...config,
        responseType: 'blob'
      })
      .then(unwrapBlob), config);
  },
  blobFile(url: string, config?: AxiosRequestConfig): Promise<{ blob: Blob; fileName?: string }> {
    return handleFailure(service
      .get<Blob>(url, {
        ...config,
        responseType: 'blob'
      })
      .then(async (response) => ({
        blob: await unwrapBlob(response),
        fileName: parseContentDispositionFileName(response.headers['content-disposition'])
      })), config);
  }
};
