export interface AssessmentTeamMember {
  id: string;
  name: string;
  organization: string;
  role: string;
}

export interface ClientTeamMember {
  id: string;
  department: string;
  name: string;
  position: string;
  contact: string;
}

export interface FocusPoint {
  id: string;
  name: string;
  domain: string;
  riskLevel: string;
  description: string;
  source: 'MANUAL' | 'CASE' | 'IMPORT';
}

export interface GapItem {
  id: string;
  gapItem: string;
  dimension: string;
  lastYearScore: number;
  currentYearScore: number;
  improvementSuggestion: string;
}

export type PlanTabKey = 'assessment-team' | 'client-team' | 'focus-points' | 'gap-items';

export type PlanEntity = AssessmentTeamMember | ClientTeamMember | FocusPoint | GapItem;
