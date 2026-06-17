import type { BasicInfoPayload, ContactInfo, OrganizationInfo, ReferenceItem } from '@/types/basicInfo';

type BasicInfoImportContainer = {
  data?: Partial<BasicInfoPayload> | null;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const asText = (value: unknown): string => (typeof value === 'string' ? value : '');

const unwrapPayload = (payload?: Partial<BasicInfoPayload> | BasicInfoImportContainer | null): Partial<BasicInfoPayload> => {
  const record = asRecord(payload);
  if ('data' in record) {
    return asRecord(record.data) as Partial<BasicInfoPayload>;
  }
  return record as Partial<BasicInfoPayload>;
};

const normalizeReferences = (value: unknown): ReferenceItem[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const record = asRecord(item);
    return {
      id: asText(record.id),
      name: asText(record.name)
    };
  });
};

const normalizeOrganization = (value: unknown): OrganizationInfo => {
  const record = asRecord(value);
  return {
    name: asText(record.name),
    postalCode: asText(record.postalCode)
  };
};

const normalizeContacts = (value: unknown): ContactInfo[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const record = asRecord(item);
    return {
      id: typeof record.id === 'string' ? record.id : undefined,
      name: asText(record.name),
      department: asText(record.department),
      mobile: asText(record.mobile),
      title: asText(record.title),
      phone: asText(record.phone),
      email: asText(record.email)
    };
  });
};

export const normalizeBasicInfoExcelImportResult = (
  payload?: Partial<BasicInfoPayload> | BasicInfoImportContainer | null
): BasicInfoPayload => {
  const data = unwrapPayload(payload);
  const assessmentPlan = asRecord(data.assessmentPlan);
  const dataRecord = asRecord(data);

  return {
    projectNumber: asText(data.projectNumber) || asText(dataRecord.projectCode),
    projectName: asText(data.projectName),
    laws: normalizeReferences(data.laws),
    standards: normalizeReferences(data.standards),
    assessmentPlan: {
      startDate: asText(assessmentPlan.startDate),
      endDate: asText(assessmentPlan.endDate)
    },
    organization: normalizeOrganization(data.organization),
    contacts: normalizeContacts(data.contacts)
  };
};
