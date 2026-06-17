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
        traceId: apiPayload.traceId
      } satisfies ApiError;
    }
    return apiPayload.data;
  }
  return payload as T;
};

export const http = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.get<ApiResponse<T> | T>(url, config).then(unwrap<T>);
  },
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return service.post<ApiResponse<T> | T>(url, data, config).then(unwrap<T>);
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
  }
};
