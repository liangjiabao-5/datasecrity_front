export type HarmAnalysisStatus = 'PENDING' | 'CONFIRMED' | 'MANUAL';
export type HarmAnalysisLlmStatus = 'SUCCESS' | 'FALLBACK' | 'DISABLED' | 'PROVIDED';

export type HarmAnalysisTrace = Record<string, unknown>;

export interface RiskSource {
  id: string;
  evaluationItemId?: string;
  checkPoint?: string;
  evaluationRecord?: string;
  evaluationResult?: string;
  riskTypes: string[];
  riskDescription: string;
  riskSourceDescription: string;
  relatedData: string;
  relatedActivities: string[];
  sourceItem?: string;
  manualAdjusted?: boolean;
}

export interface RiskItem {
  id: string;
  evaluationItemId?: string;
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
}

export interface RiskSuggestion {
  id: string;
  evaluationItemId?: string;
  checkPoint?: string;
  evaluationRecord?: string;
  evaluationResult?: string;
  riskLevel: string;
  riskDescription: string;
  riskSourceDescription: string;
  remediationSuggestion: string;
  manualAdjusted?: boolean;
}

export interface HarmAnalysisSuggestion {
  riskRecordId: string;
  harmLevel: string;
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
}
