import type { AssessmentTeamMember, ClientTeamMember } from '@/types/plan';

export type ImportedAssessmentTeamMember = Omit<AssessmentTeamMember, 'id'> & {
  id?: string;
};

export type ImportedClientTeamMember = Omit<ClientTeamMember, 'id'> & {
  id?: string;
};

export interface PlanTeamExcelImportResult {
  assessmentTeam: ImportedAssessmentTeamMember[];
  clientTeam: ImportedClientTeamMember[];
}

type PlanTeamImportContainer = {
  data?: Partial<PlanTeamExcelImportResult> | null;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const asText = (value: unknown): string => (typeof value === 'string' ? value : '');

const unwrapPayload = (
  payload?: Partial<PlanTeamExcelImportResult> | PlanTeamImportContainer | null
): Partial<PlanTeamExcelImportResult> => {
  const record = asRecord(payload);
  if ('data' in record) {
    return asRecord(record.data) as Partial<PlanTeamExcelImportResult>;
  }
  return record as Partial<PlanTeamExcelImportResult>;
};

const normalizeAssessmentTeam = (value: unknown): ImportedAssessmentTeamMember[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const record = asRecord(item);
    return {
      id: typeof record.id === 'string' ? record.id : undefined,
      name: asText(record.name),
      organization: asText(record.organization),
      role: asText(record.role)
    };
  });
};

const normalizeClientTeam = (value: unknown): ImportedClientTeamMember[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const record = asRecord(item);
    return {
      id: typeof record.id === 'string' ? record.id : undefined,
      department: asText(record.department),
      name: asText(record.name),
      position: asText(record.position),
      contact: asText(record.contact)
    };
  });
};

export const normalizePlanTeamExcelImportResult = (
  payload?: Partial<PlanTeamExcelImportResult> | PlanTeamImportContainer | null
): PlanTeamExcelImportResult => {
  const data = unwrapPayload(payload);
  return {
    assessmentTeam: normalizeAssessmentTeam(data.assessmentTeam),
    clientTeam: normalizeClientTeam(data.clientTeam)
  };
};
