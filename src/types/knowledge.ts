import type { PageQuery } from './api';

export type KnowledgeStatus = 'ENABLED' | 'DISABLED' | 'DRAFT';
export type KnowledgeResource = 'assessment' | 'suggestion' | 'score' | 'harm' | 'matrix';

export interface KnowledgeQuery extends PageQuery {
  enabledOnly?: boolean;
}

export interface KnowledgeDeleteResult {
  disabledDueToReference?: boolean;
}

export interface AssessmentTemplateItem {
  id: string;
  itemId?: string;
  sheetName: string;
  category: string;
  subcategory: string;
  itemCode: string;
  checkPoint: string;
  standardItemId: string;
  sortOrder: number;
}

export interface AssessmentTemplate {
  id: string;
  templateId?: string;
  templateName: string;
  templateType: string;
  status: KnowledgeStatus;
  itemCount?: number;
  createdAt?: string;
  version?: string;
  items?: AssessmentTemplateItem[];
}

export interface RemediationSuggestionKnowledge {
  id: string;
  suggestionId?: string;
  suggestionTitle: string;
  riskLevel: string;
  riskType: string;
  suggestionContent: string;
  status: KnowledgeStatus;
  createdAt?: string;
}

export interface ScoreRange {
  level: string;
  min: number;
  max: number;
  includeMin: boolean;
  includeMax: boolean;
}

export interface ScoreModel {
  id: string;
  modelId?: string;
  modelName: string;
  modelType: string;
  status: KnowledgeStatus;
  createdAt?: string;
  version?: string;
  resultScores: {
    COMPLIANT: number;
    PARTIAL: number;
    NON_COMPLIANT: number;
    NOT_APPLICABLE: null;
  };
  possibilityRanges: ScoreRange[];
}

export interface HarmRule {
  id: string;
  ruleId?: string;
  level: string;
  description: string;
  impactObject: string;
  example: string;
  judgementSteps: string[];
  sortOrder: number;
}

export interface HarmModel {
  id: string;
  modelId?: string;
  modelName: string;
  description: string;
  status: KnowledgeStatus;
  createdAt?: string;
  version?: string;
  rules: HarmRule[];
}

export type RiskMatrixJson = Record<string, Record<string, string>>;

export interface RiskMatrix {
  id: string;
  matrixId?: string;
  matrixName: string;
  status: KnowledgeStatus;
  createdAt?: string;
  version?: string;
  remark?: string;
  matrixJson: RiskMatrixJson;
}

export type KnowledgeEntity =
  | AssessmentTemplate
  | RemediationSuggestionKnowledge
  | ScoreModel
  | HarmModel
  | RiskMatrix;
