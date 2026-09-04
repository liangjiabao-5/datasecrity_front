export type HarmAnalysisStatus = 'PENDING' | 'CONFIRMED' | 'MANUAL';
export type HarmAnalysisLlmStatus = 'SUCCESS' | 'FALLBACK' | 'DISABLED' | 'PROVIDED';
export type RiskAnalysisStatus = 'SUCCESS' | 'PENDING' | 'DISABLED' | 'FAILED';

export interface RiskAiAnalysisFields {
  /** AI 生成状态；历史记录可能尚未包含这些字段。 */
  analysisStatus?: RiskAnalysisStatus;
  analysisErrorMessage?: string | null;
  implementationPoints?: string | null;
  analysisProvider?: string | null;
  analysisModel?: string | null;
}

export interface RiskSummaryRefreshResult {
  createdRecords?: number;
  updatedRecords?: number;
  inactiveRecords?: number;
  retainedManualRecords?: number;
  score?: number;
  possibilityLevel?: string;
  scoreModelVersion?: string;
  analysisSuccessRecords?: number;
  analysisDisabledRecords?: number;
  analysisFailedRecords?: number;
}

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

export interface RiskSource extends RiskAiAnalysisFields {
  id: string;
  evaluationItemId?: string;
  assessmentItemId?: string | null;
  assessmentSubcategory?: string | null;
  checkPoint?: string;
  evaluationRecord?: string;
  evaluationResult?: string;
  riskSourceType?: string | null;
  riskTypes: string[];
  riskDescription?: string | null;
  riskSourceDescription?: string | null;
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

export interface RiskSourceSavePayload extends Partial<Omit<RiskSource, 'id' | 'manualAdjusted' | 'relatedData' | 'relatedActivities'>> {
  relatedData?: string | string[];
  relatedActivities?: string[];
}

export interface RiskItem extends RiskAiAnalysisFields {
  id: string;
  evaluationItemId?: string;
  assessmentItemId?: string | null;
  assessmentCategory?: string;
  assessmentSubcategory?: string;
  checkPoint?: string;
  evaluationRecord?: string;
  evaluationResult?: string;
  riskTypes: string[];
  riskDescription?: string | null;
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
  riskSourceDescription?: string | null;
  relatedData: string;
  relatedActivities: string[];
  manualAdjusted: boolean;
  merged?: boolean;
  mergedRiskRecordIds?: string[];
  hasMergeConflict?: boolean;
  mergeConflictFields?: string[];
  mergeConflictMessage?: string;
}

export interface RiskItemSavePayload extends Partial<Omit<RiskItem, 'id' | 'manualAdjusted'>> {
  mergedRiskRecordIds?: string[];
}

export interface RiskSuggestion extends RiskAiAnalysisFields {
  id: string;
  evaluationItemId?: string;
  assessmentItemId?: string | null;
  checkPoint?: string;
  evaluationRecord?: string;
  evaluationResult?: string;
  riskLevel: string;
  riskDescription?: string | null;
  riskSourceDescription?: string | null;
  remediationSuggestion?: string | null;
  manualAdjusted?: boolean;
  merged?: boolean;
  mergedRiskRecordIds?: string[];
  hasMergeConflict?: boolean;
  mergeConflictFields?: string[];
  mergeConflictMessage?: string;
}

export interface RiskSuggestionSavePayload extends Partial<Omit<RiskSuggestion, 'id' | 'manualAdjusted'>> {
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
