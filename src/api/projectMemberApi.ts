import type { PageResult } from '@/types/api';
import type { ProjectMemberCandidate, ProjectMemberList } from '@/types/projectMember';
import { http } from '@/utils/request';

export const projectMemberApi = {
  list(projectId: string): Promise<ProjectMemberList> {
    return http.get(`/projects/${projectId}/members`);
  },
  candidates(projectId: string, params: { pageNo: number; pageSize: number; keyword?: string }): Promise<PageResult<ProjectMemberCandidate>> {
    return http.get(`/projects/${projectId}/member-candidates`, { params });
  },
  add(projectId: string, userId: string): Promise<void> {
    return http.post(`/projects/${projectId}/members`, { userId });
  },
  remove(projectId: string, userId: string): Promise<void> {
    return http.delete(`/projects/${projectId}/members/${userId}`);
  },
  transferOwner(projectId: string, newOwnerId: string): Promise<void> {
    return http.put(`/projects/${projectId}/owner`, { newOwnerId });
  }
};
