import { mockDb } from '@/mock/db';
import type { PageResult } from '@/types/api';
import type { AssessmentTeamMember, ClientTeamMember, FocusPoint, GapItem } from '@/types/plan';
import { useMock } from '@/utils/env';
import type { PlanTeamExcelImportResult } from '@/utils/planTeamExcelImportResult';
import { http } from '@/utils/request';

type PlanListPayload<T> = Partial<PageResult<T>> & {
  data?: T[];
  records?: T[];
  rows?: T[];
};
type PlanListResponse<T> = PlanListPayload<T> | T[] | null | undefined;

const normalizeList = <T>(payload: PlanListResponse<T>): T[] => {
  if (Array.isArray(payload)) return payload;
  const list = payload?.list || payload?.records || payload?.rows || payload?.data || [];
  return Array.isArray(list) ? list : [];
};

const excelBlob = (payload: unknown) =>
  new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

export const planApi = {
  listAssessmentTeam(projectId: string): Promise<AssessmentTeamMember[]> {
    if (useMock) return mockDb.listAssessmentTeam(projectId);
    return http
      .get<PlanListResponse<AssessmentTeamMember>>(`/projects/${projectId}/plan/assessment-team`)
      .then(normalizeList);
  },

  saveAssessmentTeam(projectId: string, payload: Omit<AssessmentTeamMember, 'id'>, id?: string): Promise<AssessmentTeamMember> {
    if (useMock) return mockDb.saveAssessmentTeam(projectId, payload, id);
    return id
      ? http.put(`/projects/${projectId}/plan/assessment-team/${id}`, payload)
      : http.post(`/projects/${projectId}/plan/assessment-team`, payload);
  },

  deleteAssessmentTeam(projectId: string, id: string): Promise<void> {
    if (useMock) return mockDb.deleteAssessmentTeam(projectId, id);
    return http.delete(`/projects/${projectId}/plan/assessment-team/${id}`);
  },

  listClientTeam(projectId: string): Promise<ClientTeamMember[]> {
    if (useMock) return mockDb.listClientTeam(projectId);
    return http.get<PlanListResponse<ClientTeamMember>>(`/projects/${projectId}/plan/client-team`).then(normalizeList);
  },

  saveClientTeam(projectId: string, payload: Omit<ClientTeamMember, 'id'>, id?: string): Promise<ClientTeamMember> {
    if (useMock) return mockDb.saveClientTeam(projectId, payload, id);
    return id
      ? http.put(`/projects/${projectId}/plan/client-team/${id}`, payload)
      : http.post(`/projects/${projectId}/plan/client-team`, payload);
  },

  deleteClientTeam(projectId: string, id: string): Promise<void> {
    if (useMock) return mockDb.deleteClientTeam(projectId, id);
    return http.delete(`/projects/${projectId}/plan/client-team/${id}`);
  },

  listFocusPoints(projectId: string): Promise<FocusPoint[]> {
    if (useMock) return mockDb.listFocusPoints(projectId);
    return http.get<PlanListResponse<FocusPoint>>(`/projects/${projectId}/plan/focus-points`).then(normalizeList);
  },

  saveFocusPoint(projectId: string, payload: Omit<FocusPoint, 'id'>, id?: string): Promise<FocusPoint> {
    if (useMock) return mockDb.saveFocusPoint(projectId, payload, id);
    return id
      ? http.put(`/projects/${projectId}/plan/focus-points/${id}`, payload)
      : http.post(`/projects/${projectId}/plan/focus-points`, payload);
  },

  deleteFocusPoint(projectId: string, id: string): Promise<void> {
    if (useMock) return mockDb.deleteFocusPoint(projectId, id);
    return http.delete(`/projects/${projectId}/plan/focus-points/${id}`);
  },

  listGapItems(projectId: string): Promise<GapItem[]> {
    if (useMock) return mockDb.listGapItems(projectId);
    return http.get<PlanListResponse<GapItem>>(`/projects/${projectId}/plan/gap-items`).then(normalizeList);
  },

  saveGapItem(projectId: string, payload: Omit<GapItem, 'id'>, id?: string): Promise<GapItem> {
    if (useMock) return mockDb.saveGapItem(projectId, payload, id);
    return id
      ? http.put(`/projects/${projectId}/plan/gap-items/${id}`, payload)
      : http.post(`/projects/${projectId}/plan/gap-items`, payload);
  },

  deleteGapItem(projectId: string, id: string): Promise<void> {
    if (useMock) return mockDb.deleteGapItem(projectId, id);
    return http.delete(`/projects/${projectId}/plan/gap-items/${id}`);
  },

  async exportTeamTemplate(projectId: string): Promise<Blob> {
    if (useMock) {
      return excelBlob({
        projectId,
        sheets: ['评估团队', '被评估方团队']
      });
    }
    return http.blob(`/projects/${projectId}/plan/team-export-template`);
  },

  async exportTeamFile(projectId: string): Promise<Blob> {
    if (useMock) {
      const [assessmentTeam, clientTeam] = await Promise.all([
        mockDb.listAssessmentTeam(projectId),
        mockDb.listClientTeam(projectId)
      ]);
      return excelBlob({ assessmentTeam, clientTeam });
    }
    return http.blob(`/projects/${projectId}/plan/team-export`);
  },

  async importTeams(projectId: string, file: File): Promise<PlanTeamExcelImportResult> {
    if (useMock) {
      const [assessmentTeam, clientTeam] = await Promise.all([
        mockDb.listAssessmentTeam(projectId),
        mockDb.listClientTeam(projectId)
      ]);
      return { assessmentTeam, clientTeam };
    }

    const formData = new FormData();
    formData.append('file', file);
    return http.post<PlanTeamExcelImportResult>(`/projects/${projectId}/plan/team-import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000
    });
  }
};
