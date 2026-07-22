export type HarmAnalysisStatus = 'PENDING' | 'CONFIRMED' | 'MANUAL';
export type HarmAnalysisLlmStatus = 'SUCCESS' | 'FALLBACK' | 'DISABLED' | 'PROVIDED';

export interface HarmAnalysisTrace {
  step1?: string;
  step2?: string;
  step2Reason?: string;
  step2Basis?: string[];
  step2Evidence?: string[];
  step3?: string;
  step4?: string;
  [key: string]: unknown;
}

export interface RiskSummaryMergeState {
  mergeEnabled: boolean;
}

export interface RiskSummaryMergeConflictTab {
  tab: string;
  fields: string[];
  fieldCodes: string[];
}

export interface RiskSummaryMergeUpdateResult extends RiskSummaryMergeState {
  updatedMergedCount: number;
  hasMergeConflict: boolean;
  mergeConflictTabs: RiskSummaryMergeConflictTab[];
  message: string;
}

export interface RiskSource {
  id: string;
  evaluationItemId?: string;
  assessmentItemId?: string | null;
  assessmentSubcategory?: string | null;
  checkPoint?: string;
  evaluationRecord?: string;
  evaluationResult?: string;
  riskSourceType?: string | null;
  riskTypes: string[];
  riskDescription: string;
  riskSourceDescription: string;
  relatedData: string;
  relatedActivities: string[];
  sourceItem?: string;
  manualAdjusted?: boolean;
  merged?: boolean;
  mergedRiskRecordIds?: string[];
  hasMergeConflict?: boolean;
  mergeConflictFields?: string[];
  mergeConflictMessage?: string;
}

export interface RiskFormOptions {
  relatedDataOptions: string[];
  relatedActivityOptions: string[];
}

export interface RiskSourceSavePayload extends Partial<Omit<RiskSource, 'id' | 'relatedData' | 'relatedActivities'>> {
  relatedData?: string | string[];
  relatedActivities?: string[];
}

export interface RiskItem {
  id: string;
  evaluationItemId?: string;
  assessmentItemId?: string | null;
  assessmentCategory?: string;
  assessmentSubcategory?: string;
  checkPoint?: string;
  evaluationRecord?: string;
  evaluationResult?: string;
  riskTypes: string[];
  riskDescription: string;
  harmLevel: string;
  harmDescription?: string;
  harmImpactObject?: string;
  harmExample?: string;
  harmAnalysisTrace?: HarmAnalysisTrace;
  harmAnalysisConfidence?: number;
  harmAnalysisInputHash?: string;
  harmAnalysisStatus?: HarmAnalysisStatus;
  possibilityLevel: string;
  riskLevel: string;
  riskSourceDescription: string;
  relatedData: string;
  relatedActivities: string[];
  manualAdjusted: boolean;
  merged?: boolean;
  mergedRiskRecordIds?: string[];
  hasMergeConflict?: boolean;
  mergeConflictFields?: string[];
  mergeConflictMessage?: string;
}

export interface RiskItemSavePayload extends Partial<Omit<RiskItem, 'id'>> {
  mergedRiskRecordIds?: string[];
}

export interface RiskSuggestion {
  id: string;
  evaluationItemId?: string;
  assessmentItemId?: string | null;
  checkPoint?: string;
  evaluationRecord?: string;
  evaluationResult?: string;
  riskLevel: string;
  riskDescription: string;
  riskSourceDescription: string;
  remediationSuggestion: string;
  manualAdjusted?: boolean;
  merged?: boolean;
  mergedRiskRecordIds?: string[];
  hasMergeConflict?: boolean;
  mergeConflictFields?: string[];
  mergeConflictMessage?: string;
}

export interface RiskSuggestionSavePayload extends Partial<Omit<RiskSuggestion, 'id'>> {
  mergedRiskRecordIds?: string[];
}

export interface HarmAnalysisSuggestion {
  riskRecordId: string;
  harmLevel: string;
  harmLevelName?: string;
  harmDescription: string;
  harmImpactObject: string;
  harmExample: string;
  harmAnalysisTrace: HarmAnalysisTrace;
  harmAnalysisConfidence?: number;
  harmAnalysisInputHash?: string;
  llmStatus?: HarmAnalysisLlmStatus;
  llmProvider?: string;
  llmModel?: string;
  needsManualReview?: boolean;
}

export interface HarmAnalysisBatchPayload {
  riskItemIds?: string[];
  limit?: number;
}

export interface HarmAnalysisApplyPayload {
  suggestion: HarmAnalysisSuggestion;
  mergedRiskRecordIds?: string[];
}
