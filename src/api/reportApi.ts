import { reportDb } from '@/mock/reportDb';
import type {
  ReportGeneratePayload,
  ReportListResult,
  ReportReadinessResult,
  ReportTaskResult,
  ReportTaskStartResult
} from '@/types/report';
import { useMock } from '@/utils/env';
import { http } from '@/utils/request';
import type { AxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types/api';
import { mockEnvelope } from '@/utils/apiFeedback';

export const reportApi = {
  list(projectId: string, params = { pageNo: 1, pageSize: 10 }, config?: AxiosRequestConfig): Promise<ReportListResult> {
    if (useMock) return reportDb.list(projectId, params.pageNo, params.pageSize);
    return http.get(`/projects/${projectId}/reports`, { ...config, params });
  },
  readiness(projectId: string): Promise<ReportReadinessResult> {
    if (useMock) return reportDb.readiness(projectId);
    return http.get(`/projects/${projectId}/reports/readiness`);
  },
  generate(projectId: string, payload: ReportGeneratePayload): Promise<ApiResponse<ReportTaskStartResult>> {
    if (useMock) return mockEnvelope(reportDb.generate(projectId, payload));
    return http.postEnvelope(`/projects/${projectId}/reports/generate`, payload);
  },
  task(projectId: string, taskId: string): Promise<ReportTaskResult> {
    if (useMock) return reportDb.task(projectId, taskId);
    return http.get(`/projects/${projectId}/reports/tasks/${taskId}`, { errorMode: 'manual' });
  },
  retry(projectId: string, reportId: string): Promise<ApiResponse<ReportTaskStartResult>> {
    if (useMock) return mockEnvelope(reportDb.retry(projectId, reportId));
    return http.postEnvelope(`/projects/${projectId}/reports/${reportId}/retry`);
  },
  download(projectId: string, reportId: string): Promise<Blob> {
    if (useMock) return reportDb.download(projectId, reportId);
    return http.blob(`/projects/${projectId}/reports/${reportId}/download`, { timeout: 60000 });
  },
  delete(projectId: string, reportId: string): Promise<ApiResponse<void>> {
    if (useMock) return mockEnvelope(reportDb.delete(projectId, reportId));
    return http.deleteEnvelope(`/projects/${projectId}/reports/${reportId}`);
  }
};
