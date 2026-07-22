import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ElMessage } from 'element-plus';
import { apiBaseUrl } from './env';
import type { ApiError, ApiResponse } from '@/types/api';

const service = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000
});

service.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('accessToken');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

service.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    const status = error.response?.status;
    const payload = error.response?.data;
    const message = payload?.message || error.message || '网络请求失败';

    if (status === 401) {
      ElMessage.error('登录状态已失效，请重新登录');
    } else if (status === 403) {
      ElMessage.error('无权限执行当前操作');
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
