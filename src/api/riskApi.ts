import { workflowDb } from '@/mock/workflowDb';
import type { PageQuery, PageResult } from '@/types/api';
import type {
  HarmAnalysisApplyPayload,
  HarmAnalysisBatchPayload,
  HarmAnalysisSuggestion,
  RiskItem,
  RiskSource,
  RiskSuggestion
} from '@/types/risk';
import { useMock } from '@/utils/env';
import { http } from '@/utils/request';
import type { RiskSummaryExcelImportResult } from '@/utils/riskSummaryExcelImportResult';

type RiskPageQuery = Pick<PageQuery, 'pageNo' | 'pageSize'>;
type RiskListPayload<T> = Partial<PageResult<T>> & {
  content?: T[];
  data?: RiskListResponse<T>;
  records?: T[];
  rows?: T[];
};
type RiskListResponse<T> = RiskListPayload<T> | T[] | null | undefined;
type HarmAnalysisBatchResponse =
  | HarmAnalysisSuggestion[]
  | {
      list?: HarmAnalysisSuggestion[];
      suggestions?: HarmAnalysisSuggestion[];
      records?: HarmAnalysisSuggestion[];
      rows?: HarmAnalysisSuggestion[];
    };

const resolveQuery = (query?: Partial<RiskPageQuery>): RiskPageQuery => ({
  pageNo: query?.pageNo || 1,
  pageSize: query?.pageSize || 10
});

const pageFromList = <T>(list: T[], query: RiskPageQuery): PageResult<T> => {
  const start = (query.pageNo - 1) * query.pageSize;
  return {
    list: list.slice(start, start + query.pageSize),
    pageNo: query.pageNo,
    pageSize: query.pageSize,
    total: list.length
  };
};

const normalizePage = <T>(payload: RiskListResponse<T>, query?: Partial<RiskPageQuery>): PageResult<T> => {
  const resolvedQuery = resolveQuery(query);

  if (Array.isArray(payload)) return pageFromList(payload, resolvedQuery);
  if (!payload || typeof payload !== 'object') {
    return { list: [], pageNo: resolvedQuery.pageNo, pageSize: resolvedQuery.pageSize, total: 0 };
  }

  const list = payload.list || payload.records || payload.rows || payload.content;
  if (Array.isArray(list)) {
    const pageNo = payload.pageNo || resolvedQuery.pageNo;
    const pageSize = payload.pageSize || resolvedQuery.pageSize;
    const total = typeof payload.total === 'number' ? payload.total : list.length;

    return {
      list: typeof payload.total === 'number' ? list : pageFromList(list, { pageNo, pageSize }).list,
      pageNo,
      pageSize,
      total
    };
  }

  return normalizePage(payload.data, resolvedQuery);
};

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
  if (value === null || value === undefined || value === '') return [];
  return String(value)
    .split(/[、,，;；\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const riskId = (row: {
  id?: string;
  riskRecordId?: string;
  riskSourceId?: string;
  riskItemId?: string;
  suggestionId?: string;
}) => String(row.id || row.riskRecordId || row.riskSourceId || row.riskItemId || row.suggestionId || '');

const normalizeRiskSource = (row: RiskSource): RiskSource => ({
  ...row,
  id: riskId(row),
  riskTypes: normalizeStringArray(row.riskTypes),
  relatedActivities: normalizeStringArray(row.relatedActivities)
});

const normalizeRiskItem = (row: RiskItem): RiskItem => ({
  ...row,
  id: riskId(row),
  riskTypes: normalizeStringArray(row.riskTypes),
  relatedActivities: normalizeStringArray(row.relatedActivities)
});

const normalizeRiskSuggestion = (row: RiskSuggestion): RiskSuggestion => ({
  ...row,
  id: riskId(row)
});

const normalizeHarmAnalysisSuggestions = (payload: HarmAnalysisBatchResponse): HarmAnalysisSuggestion[] => {
  if (Array.isArray(payload)) return payload;
  return payload.list || payload.suggestions || payload.records || payload.rows || [];
};

const excelBlob = (payload: unknown) =>
  new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

export const riskApi = {
  refresh(projectId: string, overwriteManualChanges: boolean): Promise<unknown> {
    if (useMock) return workflowDb.refreshRisks(projectId, overwriteManualChanges);
    return http.post(`/projects/${projectId}/risk-summary/refresh`, { overwriteManualChanges });
  },
  listRiskSources(projectId: string, query?: Partial<RiskPageQuery>): Promise<PageResult<RiskSource>> {
    const pageQuery = resolveQuery(query);
    if (useMock) return workflowDb.listRiskSources(projectId, pageQuery);
    return http
      .get<RiskListResponse<RiskSource>>(`/projects/${projectId}/risk-sources`, { params: pageQuery })
      .then((payload) => {
        const page = normalizePage(payload, pageQuery);
        return { ...page, list: page.list.map(normalizeRiskSource) };
      });
  },
  saveRiskSource(projectId: string, id: string, payload: Partial<Omit<RiskSource, 'id'>>): Promise<void> {
    if (useMock) return workflowDb.saveRiskSource(projectId, id, payload);
    return http.put(`/projects/${projectId}/risk-sources/${id}`, payload);
  },
  async exportRiskSources(projectId: string): Promise<Blob> {
    if (useMock) {
      const page = await workflowDb.listRiskSources(projectId, { pageNo: 1, pageSize: 10000 });
      return excelBlob({ list: page.list });
    }
    return http.blob(`/projects/${projectId}/risk-sources/export`);
  },
  importRiskSources(projectId: string, file: File): Promise<RiskSummaryExcelImportResult> {
    if (useMock) return Promise.resolve({ importedCount: 0, failedCount: 0, errors: [] });
    const formData = new FormData();
    formData.append('file', file);
    return http.post<RiskSummaryExcelImportResult>(`/projects/${projectId}/risk-sources/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000
    });
  },
  listRiskItems(projectId: string, query?: Partial<RiskPageQuery>): Promise<PageResult<RiskItem>> {
    const pageQuery = resolveQuery(query);
    if (useMock) return workflowDb.listRiskItems(projectId, pageQuery);
    return http
      .get<RiskListResponse<RiskItem>>(`/projects/${projectId}/risk-items`, { params: pageQuery })
      .then((payload) => {
        const page = normalizePage(payload, pageQuery);
        return { ...page, list: page.list.map(normalizeRiskItem) };
      });
  },
  saveRiskItem(projectId: string, id: string, payload: Partial<Omit<RiskItem, 'id'>>): Promise<void> {
    if (useMock) return workflowDb.saveRiskItem(projectId, id, payload);
    return http.put(`/projects/${projectId}/risk-items/${id}`, payload);
  },
  async exportRiskItems(projectId: string): Promise<Blob> {
    if (useMock) {
      const page = await workflowDb.listRiskItems(projectId, { pageNo: 1, pageSize: 10000 });
      return excelBlob({ list: page.list });
    }
    return http.blob(`/projects/${projectId}/risk-items/export`);
  },
  importRiskItems(projectId: string, file: File): Promise<RiskSummaryExcelImportResult> {
    if (useMock) return Promise.resolve({ importedCount: 0, failedCount: 0, errors: [] });
    const formData = new FormData();
    formData.append('file', file);
    return http.post<RiskSummaryExcelImportResult>(`/projects/${projectId}/risk-items/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000
    });
  },
  suggestRiskItemHarm(projectId: string, id: string): Promise<HarmAnalysisSuggestion> {
    if (useMock) return workflowDb.suggestRiskItemHarm(projectId, id);
    return http.post<HarmAnalysisSuggestion>(`/projects/${projectId}/risk-items/${id}/harm-analysis/suggest`, {});
  },
  suggestRiskItemsHarm(projectId: string, payload: HarmAnalysisBatchPayload): Promise<HarmAnalysisSuggestion[]> {
    if (useMock) return workflowDb.suggestRiskItemsHarm(projectId, payload);
    return http
      .post<HarmAnalysisBatchResponse>(`/projects/${projectId}/risk-items/harm-analysis/suggest-batch`, payload, { timeout: 600000 })
      .then(normalizeHarmAnalysisSuggestions);
  },
  applyRiskItemHarm(projectId: string, id: string, payload: HarmAnalysisApplyPayload): Promise<void> {
    if (useMock) return workflowDb.applyRiskItemHarm(projectId, id, payload);
    return http.post(`/projects/${projectId}/risk-items/${id}/harm-analysis/apply`, payload);
  },
  listRiskSuggestions(projectId: string, query?: Partial<RiskPageQuery>): Promise<PageResult<RiskSuggestion>> {
    const pageQuery = resolveQuery(query);
    if (useMock) return workflowDb.listRiskSuggestions(projectId, pageQuery);
    return http
      .get<RiskListResponse<RiskSuggestion>>(`/projects/${projectId}/risk-suggestions`, { params: pageQuery })
      .then((payload) => {
        const page = normalizePage(payload, pageQuery);
        return { ...page, list: page.list.map(normalizeRiskSuggestion) };
      });
  },
  saveRiskSuggestion(projectId: string, id: string, payload: Partial<Omit<RiskSuggestion, 'id'>>): Promise<void> {
    if (useMock) return workflowDb.saveRiskSuggestion(projectId, id, payload);
    return http.put(`/projects/${projectId}/risk-suggestions/${id}`, payload);
  }
};
