import type { ApiResponse } from '@/types/api';
import { mockEnvelope } from '@/utils/apiFeedback';
import { knowledgeDb } from '@/mock/knowledgeDb';
import type { PageResult } from '@/types/api';
import type {
  AssessmentTemplateItem,
  HarmRule,
  KnowledgeDeleteResult,
  KnowledgeEntity,
  KnowledgeQuery,
  KnowledgeResource
} from '@/types/knowledge';
import { useMock } from '@/utils/env';
import { http } from '@/utils/request';

type KnowledgePagePayload<T> = Partial<PageResult<T>> & {
  list?: T[];
  records?: T[];
  rows?: T[];
};
type KnowledgeListResponse<T> = KnowledgePagePayload<T> | T[];

const resourceUrls: Record<KnowledgeResource, string> = {
  assessment: '/knowledge/assessment-templates',
  suggestion: '/knowledge/remediation-suggestions',
  score: '/knowledge/score-models',
  harm: '/knowledge/harm-models',
  matrix: '/knowledge/risk-matrices'
};

const normalizePage = <T>(payload: KnowledgeListResponse<T>, query: KnowledgeQuery): PageResult<T> => {
  if (Array.isArray(payload)) {
    return { list: payload, total: payload.length, pageNo: query.pageNo, pageSize: query.pageSize };
  }
  const list = payload.list || payload.records || payload.rows || [];
  return {
    list,
    total: payload.total ?? list.length,
    pageNo: payload.pageNo ?? query.pageNo,
    pageSize: payload.pageSize ?? query.pageSize
  };
};

export const knowledgeApi = {
  list<T extends KnowledgeEntity>(resource: KnowledgeResource, query: KnowledgeQuery): Promise<PageResult<T>> {
    if (useMock) return knowledgeDb.list(resource, query) as Promise<PageResult<T>>;
    return http.get<KnowledgeListResponse<T>>(resourceUrls[resource], { params: query }).then((payload) => normalizePage(payload, query));
  },

  detail<T extends KnowledgeEntity>(resource: KnowledgeResource, id: string): Promise<T> {
    if (useMock) {
      return this.list<T>(resource, { pageNo: 1, pageSize: 999 }).then((page) => {
        const row = page.list.find((item) => item.id === id);
        if (!row) throw new Error('知识库条目不存在');
        return row;
      });
    }
    return http.get<T>(`${resourceUrls[resource]}/${id}`);
  },

  create<T extends KnowledgeEntity>(resource: KnowledgeResource, payload: Omit<T, 'id'>): Promise<ApiResponse<T>> {
    if (useMock) return mockEnvelope(knowledgeDb.save(resource, payload as Omit<KnowledgeEntity, 'id'>) as Promise<T>);
    return http.postEnvelope<T>(resourceUrls[resource], payload);
  },

  update<T extends KnowledgeEntity>(resource: KnowledgeResource, id: string, payload: Omit<T, 'id'>): Promise<ApiResponse<T>> {
    if (useMock) return mockEnvelope(knowledgeDb.save(resource, payload as Omit<KnowledgeEntity, 'id'>, id) as Promise<T>);
    return http.putEnvelope<T>(`${resourceUrls[resource]}/${id}`, payload);
  },

  delete(resource: KnowledgeResource, id: string): Promise<ApiResponse<KnowledgeDeleteResult>> {
    if (useMock) return mockEnvelope(knowledgeDb.delete(resource, id));
    return http.deleteEnvelope<KnowledgeDeleteResult>(`${resourceUrls[resource]}/${id}`);
  },

  listTemplateItems(templateId: string, query: KnowledgeQuery): Promise<PageResult<AssessmentTemplateItem>> {
    if (useMock) return knowledgeDb.templateItems(templateId, query);
    return http
      .get<KnowledgeListResponse<AssessmentTemplateItem>>(`/knowledge/assessment-templates/${templateId}/items`, { params: query })
      .then((payload) => normalizePage(payload, query));
  },

  createTemplateItem(templateId: string, payload: Omit<AssessmentTemplateItem, 'id'>): Promise<AssessmentTemplateItem> {
    if (useMock) return knowledgeDb.saveTemplateItem(templateId, payload);
    return http.post<AssessmentTemplateItem>(`/knowledge/assessment-templates/${templateId}/items`, payload);
  },

  updateTemplateItem(templateId: string, itemId: string, payload: Omit<AssessmentTemplateItem, 'id'>): Promise<AssessmentTemplateItem> {
    if (useMock) return knowledgeDb.saveTemplateItem(templateId, payload, itemId);
    return http.put<AssessmentTemplateItem>(`/knowledge/assessment-templates/${templateId}/items/${itemId}`, payload);
  },

  deleteTemplateItem(templateId: string, itemId: string): Promise<void> {
    if (useMock) return knowledgeDb.deleteTemplateItem(templateId, itemId);
    return http.delete<void>(`/knowledge/assessment-templates/${templateId}/items/${itemId}`);
  },

  listHarmRules(modelId: string, query: KnowledgeQuery): Promise<PageResult<HarmRule>> {
    if (useMock) return knowledgeDb.harmRules(modelId, query);
    return http
      .get<KnowledgeListResponse<HarmRule>>(`/knowledge/harm-models/${modelId}/rules`, { params: query })
      .then((payload) => normalizePage(payload, query));
  },

  createHarmRule(modelId: string, payload: Omit<HarmRule, 'id'>): Promise<ApiResponse<HarmRule>> {
    if (useMock) return mockEnvelope(knowledgeDb.saveHarmRule(modelId, payload));
    return http.postEnvelope<HarmRule>(`/knowledge/harm-models/${modelId}/rules`, payload);
  },

  updateHarmRule(modelId: string, ruleId: string, payload: Omit<HarmRule, 'id'>): Promise<ApiResponse<HarmRule>> {
    if (useMock) return mockEnvelope(knowledgeDb.saveHarmRule(modelId, payload, ruleId));
    return http.putEnvelope<HarmRule>(`/knowledge/harm-models/${modelId}/rules/${ruleId}`, payload);
  },

  deleteHarmRule(modelId: string, ruleId: string): Promise<ApiResponse<void>> {
    if (useMock) return mockEnvelope(knowledgeDb.deleteHarmRule(modelId, ruleId));
    return http.deleteEnvelope<void>(`/knowledge/harm-models/${modelId}/rules/${ruleId}`);
  },

  validateScoreModel(payload: unknown, modelId?: string): Promise<unknown> {
    if (useMock) return Promise.resolve({ valid: true });
    const url = modelId ? `/knowledge/score-models/${modelId}/validate` : '/knowledge/score-models/validate';
    return http.post(url, payload);
  },

  validateRiskMatrix(payload: unknown, matrixId?: string): Promise<unknown> {
    if (useMock) return Promise.resolve({ valid: true });
    const url = matrixId ? `/knowledge/risk-matrices/${matrixId}/validate` : '/knowledge/risk-matrices/validate';
    return http.post(url, payload);
  },

  exportAssessmentTemplateUrl(templateId: string): string {
    return `/api/v1/knowledge/assessment-templates/${templateId}/export`;
  },
  exportAssessmentTemplate(templateId: string): Promise<Record<string, unknown>> {
    if (useMock) return this.detail('assessment', templateId).then((data) => ({ ...data, exportFormat: 'JSON' }));
    return http.get(`/knowledge/assessment-templates/${templateId}/export`);
  }
};
