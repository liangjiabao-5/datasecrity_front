import type { PageResult } from './api';

export type ReportStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';

export type ReportSection =
  | 'BASIC_INFO'
  | 'PLAN'
  | 'SURVEY'
  | 'EVALUATION'
  | 'RISK_SUMMARY'
  | 'SUGGESTIONS';

export interface ReportListItem {
  reportId: string;
  reportName: string;
  reportType: string;
  reportTypeName: string;
  status: ReportStatus;
  fileId?: string | null;
  generatedAt?: string | null;
  errorMessage?: string | null;
  createdBy: string;
  selectedSections: ReportSection[];
  downloadUrl?: string | null;
}

export type ReportListResult = PageResult<ReportListItem>;

export interface ReportReadinessIssue {
  code: string;
  message: string;
}

export interface ReportReadinessResult {
  projectId: string;
  ready: boolean;
  blockers: ReportReadinessIssue[];
  warnings: ReportReadinessIssue[];
}

export interface ReportGeneratePayload {
  reportName: string;
  reportType: 'DATA_SECURITY_RISK_ASSESSMENT';
  selectedSections: ReportSection[];
}

export interface ReportTaskStartResult {
  reportTaskId: string;
  reportId: string;
  status: ReportStatus;
  taskStatusUrl?: string;
  warnings?: ReportReadinessIssue[];
  errorMessage?: string | null;
}

export interface ReportTaskResult {
  id: string;
  projectId: string;
  reportId: string;
  taskType: 'REPORT_GENERATE';
  status: ReportStatus;
  errorMessage?: string | null;
  result?: {
    reportId?: string;
    fileId?: string;
    downloadUrl?: string;
    errorMessage?: string;
  } | null;
}
