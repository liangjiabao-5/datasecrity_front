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

export const reportApi = {
  list(projectId: string, params = { pageNo: 1, pageSize: 10 }): Promise<ReportListResult> {
    if (useMock) return reportDb.list(projectId, params.pageNo, params.pageSize);
    return http.get(`/projects/${projectId}/reports`, { params });
  },
  readiness(projectId: string): Promise<ReportReadinessResult> {
    if (useMock) return reportDb.readiness(projectId);
    return http.get(`/projects/${projectId}/reports/readiness`);
  },
  generate(projectId: string, payload: ReportGeneratePayload): Promise<ReportTaskStartResult> {
    if (useMock) return reportDb.generate(projectId, payload);
    return http.post(`/projects/${projectId}/reports/generate`, payload);
  },
  task(projectId: string, taskId: string): Promise<ReportTaskResult> {
    if (useMock) return reportDb.task(projectId, taskId);
    return http.get(`/projects/${projectId}/reports/tasks/${taskId}`);
  },
  retry(projectId: string, reportId: string): Promise<ReportTaskStartResult> {
    if (useMock) return reportDb.retry(projectId, reportId);
    return http.post(`/projects/${projectId}/reports/${reportId}/retry`);
  },
  download(projectId: string, reportId: string): Promise<Blob> {
    if (useMock) return reportDb.download(projectId, reportId);
    return http.blob(`/projects/${projectId}/reports/${reportId}/download`, { timeout: 60000 });
  },
  delete(projectId: string, reportId: string): Promise<void> {
    if (useMock) return reportDb.delete(projectId, reportId);
    return http.delete(`/projects/${projectId}/reports/${reportId}`);
  }
};
