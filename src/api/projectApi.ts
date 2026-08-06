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

export const projectApi = {
  list(params: PageQuery): Promise<PageResult<ProjectListItem>> {
    if (useMock) return mockDb.listProjects(params);
    return http.get('/projects', { params });
  },

  statistics(): Promise<ProjectStatistics> {
    if (useMock) return mockDb.getProjectStatistics();
    return http.get('/projects/statistics');
  },

  configOptions(): Promise<ProjectConfigOptions> {
    if (useMock) return mockDb.getProjectConfigOptions();
    return http.get('/projects/config-options');
  },

  create(payload: ProjectCreatePayload): Promise<{ projectId: string }> {
    if (useMock) return mockDb.createProject(payload);
    return http.post('/projects', payload);
  },

  update(projectId: string, payload: ProjectUpdatePayload): Promise<void> {
    if (useMock) return mockDb.updateProject(projectId, payload);
    return http.put(`/projects/${projectId}`, payload);
  },

  detail(projectId: string): Promise<ProjectDetail> {
    if (useMock) return mockDb.getProject(projectId);
    return http.get(`/projects/${projectId}`);
  },

  riskMatrix(projectId: string): Promise<RiskMatrix | null> {
    if (useMock) return mockDb.getProjectRiskMatrix(projectId);
    return http.get(`/projects/${projectId}/risk-matrix`);
  },

  start(projectId: string): Promise<void> {
    if (useMock) return mockDb.startProject(projectId);
    return http.post(`/projects/${projectId}/start`);
  },

  delete(projectId: string): Promise<void> {
    if (useMock) return mockDb.deleteProject(projectId);
    return http.delete(`/projects/${projectId}`);
  }
};
