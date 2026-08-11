import { workflowDb } from '@/mock/workflowDb';
import type { PageResult } from '@/types/api';
import type {
  BatchEvaluationResultPayload,
  EvaluationCatalogNode,
  EvaluationImportResult,
  EvaluationItem,
  EvaluationItemQuery,
  EvaluationRecordPayload,
  ScoreResult
} from '@/types/evaluation';
import { useMock } from '@/utils/env';
import { http } from '@/utils/request';

const excelBlob = (payload: unknown) =>
  new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

export const evaluationApi = {
  catalog(projectId: string): Promise<EvaluationCatalogNode[]> {
    if (useMock) return workflowDb.getEvaluationCatalog();
    return http.get(`/projects/${projectId}/evaluation/catalog`);
  },
  items(projectId: string, params: EvaluationItemQuery): Promise<PageResult<EvaluationItem>> {
    if (useMock) return workflowDb.listEvaluationItems(projectId, params);
    return http.get(`/projects/${projectId}/evaluation/items`, { params });
  },
  saveRecord(projectId: string, itemId: string, payload: EvaluationRecordPayload): Promise<void> {
    if (useMock) return workflowDb.saveEvaluationRecord(projectId, itemId, payload);
    return http.put(`/projects/${projectId}/evaluation/items/${itemId}/record`, payload);
  },
  batchResult(projectId: string, payload: BatchEvaluationResultPayload): Promise<void> {
    if (useMock) return workflowDb.batchEvaluationResult(projectId, payload);
    return http.post(`/projects/${projectId}/evaluation/items/batch-result`, payload);
  },
  calculateScore(projectId: string): Promise<ScoreResult> {
    if (useMock) return workflowDb.calculateScore(projectId);
    return http.post(`/projects/${projectId}/evaluation/calculate-score`);
  },
  exportTemplate(projectId: string): Promise<{ blob: Blob; fileName?: string }> {
    if (useMock) {
      return Promise.resolve({
        blob: excelBlob({ projectId, template: '现场测评导入模板' }),
        fileName: `现场测评导入模板-${projectId}.xlsx`
      });
    }
    return http.blobFile(`/projects/${projectId}/evaluation/export-template`, { timeout: 60000 });
  },
  exportRecords(projectId: string): Promise<{ blob: Blob; fileName?: string }> {
    if (useMock) {
      return Promise.resolve({
        blob: excelBlob({ projectId, export: '现场测评记录' }),
        fileName: `现场测评记录-${projectId}.xlsx`
      });
    }
    return http.blobFile(`/projects/${projectId}/evaluation/export`, { timeout: 60000 });
  },
  importRecords(projectId: string, file: File): Promise<EvaluationImportResult> {
    if (useMock) {
      return Promise.resolve({
        projectId,
        importedCount: 0,
        failedCount: 0,
        errors: []
      });
    }

    const formData = new FormData();
    formData.append('file', file);
    return http.post<EvaluationImportResult>(`/projects/${projectId}/evaluation/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000
    });
  }
};
