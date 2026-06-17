export type ProjectStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';

export interface ProjectListItem {
  id: string;
  projectName: string;
  projectCode: string;
  assessmentOrg: string;
  status: ProjectStatus;
  statusName: string;
  ownerName?: string;
  assessmentPeriod?: string;
  createdAt?: string;
}

export interface ProjectDetail extends ProjectListItem {
  systemType: string;
  systemTypeName: string;
  riskMatrixId: string;
  riskMatrixName: string;
  riskMatrixVersion?: string;
  assessmentTemplateId: string;
  assessmentTemplateName: string;
  assessmentTemplateVersion?: string;
  harmModelId: string;
  harmModelName: string;
  harmModelVersion?: string;
  scoreModelId: string;
  scoreModelName: string;
  scoreModelVersion?: string;
  description?: string;
  contacts?: string;
  teamMembers?: ProjectTeamMember[];
}

export interface ProjectTeamMember {
  id: string;
  name: string;
  organization: string;
  role: string;
}

export interface ProjectCreatePayload {
  projectName: string;
  projectCode: string;
  assessmentOrg: string;
  riskMatrixId: string;
  assessmentTemplateId: string;
  systemType: string;
  harmModelId: string;
  scoreModelId: string;
  description?: string;
}

export type ProjectUpdatePayload = ProjectCreatePayload;

export interface ProjectStatistics {
  all: number;
  notStarted: number;
  inProgress: number;
  completed: number;
}

export interface SelectOption {
  id: string;
  name: string;
  version?: string;
  status?: string;
}

export interface ProjectConfigOptions {
  assessmentTemplates: SelectOption[];
  riskMatrices: SelectOption[];
  harmModels: SelectOption[];
  scoreModels: SelectOption[];
  systemTypes: SelectOption[];
}

export interface SaveProjectTemplatePayload {
  templateName: string;
  templateDescription?: string;
  includeAssessmentTemplate: boolean;
  includeScoreModel: boolean;
  includeTeamMembers: boolean;
}
