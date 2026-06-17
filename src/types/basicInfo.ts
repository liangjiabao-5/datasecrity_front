export interface ReferenceItem {
  id: string;
  name: string;
}

export interface AssessmentPlan {
  startDate?: string;
  endDate?: string;
}

export interface OrganizationInfo {
  name?: string;
  postalCode?: string;
}

export interface ContactInfo {
  id?: string;
  name: string;
  department?: string;
  mobile?: string;
  title?: string;
  phone?: string;
  email?: string;
}

export interface BasicInfoPayload {
  projectNumber?: string;
  projectName?: string;
  laws: ReferenceItem[];
  standards: ReferenceItem[];
  assessmentPlan: AssessmentPlan;
  organization: OrganizationInfo;
  contacts: ContactInfo[];
}

export type CustomReferenceType = 'LAW' | 'STANDARD';

export interface CustomReferencePayload {
  type: CustomReferenceType;
  name: string;
  saveToKnowledge: boolean;
}
