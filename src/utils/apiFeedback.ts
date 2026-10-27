import { ElMessage } from 'element-plus';
import type { ApiError, ApiResponse } from '@/types/api';

export const isIgnoredError = (error: unknown) =>
  error === 'cancel' || error === 'close' ||
  ['SESSION_CHANGED', 'ERR_CANCELED'].includes(String((error as Partial<ApiError>)?.code));

export const getApiErrorMessage = (error: unknown, fallback = '操作失败，请稍后重试'): string => {
  const message = (error as Partial<ApiError>)?.message;
  return typeof message === 'string' && message.trim() ? message : fallback;
};

/** 请求层和页面共用同一个错误对象，保证一次失败只通知一次。 */
export const notifyApiError = (error: unknown, fallback?: string, type: 'error' | 'warning' = 'error') => {
  if (isIgnoredError(error) || (error as Partial<ApiError>)?.notified) return;
  if (error && typeof error === 'object') (error as ApiError).notified = true;
  ElMessage[type]({ message: getApiErrorMessage(error, fallback), grouping: true });
};

export const successMessage = (response: Pick<ApiResponse<unknown>, 'message'> | void, fallback: string): string => {
  const message = response?.message?.trim();
  return message && !['操作成功', '操作成功。', 'Operation succeeded.'].includes(message) ? message : fallback;
};

export const notifyApiSuccess = (response: Pick<ApiResponse<unknown>, 'message'> | void, fallback: string) =>
  ElMessage.success(successMessage(response, fallback));

export const mockEnvelope = async <T>(request: Promise<T>): Promise<ApiResponse<T>> => ({
  code: 'SUCCESS', message: '', data: await request
});
