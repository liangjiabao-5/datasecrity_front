import { mockDb } from '@/mock/db';
import type { PageQuery, PageResult, PlaceholderResult } from '@/types/api';
import type {
  ProjectCreatePayload,
  ProjectDetail,
  ProjectListItem,
  ProjectStatistics,
  ProjectUpdatePayload,
  SaveProjectTemplatePayload
} from '@/types/project';
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

  start(projectId: string): Promise<void> {
    if (useMock) return mockDb.startProject(projectId);
    return http.post(`/projects/${projectId}/start`);
  },

  delete(projectId: string): Promise<void> {
    if (useMock) return mockDb.deleteProject(projectId);
    return http.delete(`/projects/${projectId}`);
  },

  saveTemplate(projectId: string, payload: SaveProjectTemplatePayload): Promise<PlaceholderResult> {
    if (useMock) return mockDb.saveProjectTemplate(projectId, payload);
    return http.post(`/projects/${projectId}/save-template`, payload);
  }
};
