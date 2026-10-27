import type { ApiResponse } from '@/types/api';
import { mockEnvelope } from '@/utils/apiFeedback';
import { mockDb } from '@/mock/db';
import type { PageQuery, PageResult } from '@/types/api';
import type {
  ProjectCreatePayload,
  ProjectDetail,
  ProjectConfigOptions,
  ProjectListItem,
  ProjectStatistics,
  ProjectUpdatePayload
} from '@/types/project';
import type { RiskMatrix } from '@/types/knowledge';
import { useMock } from '@/utils/env';
import { http } from '@/utils/request';
import type { AxiosRequestConfig } from 'axios';

export const projectApi = {
  list(params: PageQuery, config?: AxiosRequestConfig): Promise<PageResult<ProjectListItem>> {
    if (useMock) return mockDb.listProjects(params);
    return http.get('/projects', { ...config, params });
  },

  statistics(config?: AxiosRequestConfig): Promise<ProjectStatistics> {
    if (useMock) return mockDb.getProjectStatistics();
    return http.get('/projects/statistics', config);
  },

  configOptions(config?: AxiosRequestConfig): Promise<ProjectConfigOptions> {
    if (useMock) return mockDb.getProjectConfigOptions();
    return http.get('/projects/config-options', config);
  },

  create(payload: ProjectCreatePayload): Promise<ApiResponse<{ projectId: string }>> {
    if (useMock) return mockEnvelope(mockDb.createProject(payload));
    return http.postEnvelope('/projects', payload);
  },

  update(projectId: string, payload: ProjectUpdatePayload): Promise<ApiResponse<void>> {
    if (useMock) return mockEnvelope(mockDb.updateProject(projectId, payload));
    return http.putEnvelope(`/projects/${projectId}`, payload);
  },

  detail(projectId: string): Promise<ProjectDetail> {
    if (useMock) return mockDb.getProject(projectId);
    return http.get(`/projects/${projectId}`);
  },

  riskMatrix(projectId: string): Promise<RiskMatrix | null> {
    if (useMock) return mockDb.getProjectRiskMatrix(projectId);
    return http.get(`/projects/${projectId}/risk-matrix`);
  },

  start(projectId: string): Promise<ApiResponse<void>> {
    if (useMock) return mockEnvelope(mockDb.startProject(projectId));
    return http.postEnvelope(`/projects/${projectId}/start`);
  },

  delete(projectId: string): Promise<ApiResponse<void>> {
    if (useMock) return mockEnvelope(mockDb.deleteProject(projectId));
    return http.deleteEnvelope(`/projects/${projectId}`);
  }
};
