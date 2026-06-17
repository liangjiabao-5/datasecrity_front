import type { EvaluationResult } from './workflow';

export interface EvaluationCatalogNode {
  id: string;
  label: string;
  children?: EvaluationCatalogNode[];
}

export interface EvaluationItem {
  id: string;
  code: string;
  categoryId: string;
  categoryName: string;
  sheet_name?: string;
  sheetName?: string;
  category?: string;
  subcategory?: string;
  subcategoryName?: string;
  checkPoint: string;
  checkContent: string;
  evaluationResult: EvaluationResult;
  evaluationRecord: string;
}

export interface EvaluationItemQuery {
  pageNo: number;
  pageSize: number;
  categoryId?: string;
  sheet_name?: string;
  sheetName?: string;
  category?: string;
  result?: EvaluationResult;
  keyword?: string;
}

export interface EvaluationRecordPayload {
  evaluationResult: EvaluationResult;
  evaluationRecord: string;
}

export interface BatchEvaluationResultPayload {
  itemIds: string[];
  evaluationResult: EvaluationResult;
}

export interface EvaluationImportError {
  rowNo: number;
  field: string;
  reason: string;
}

export interface EvaluationImportResult {
  projectId?: string;
  importedCount?: number;
  failedCount?: number;
  errors?: EvaluationImportError[];
}

export interface ScoreResult {
  score: number;
  possibilityLevel: string;
  possibilityLevelName: string;
  scoreModelVersion: number;
  detail: {
    compliantCount: number;
    partialCount: number;
    nonCompliantCount: number;
    notApplicableCount: number;
  };
}
