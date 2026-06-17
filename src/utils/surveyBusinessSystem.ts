import type { BusinessSystem } from '@/types/survey';

export type BusinessSystemForm = Omit<BusinessSystem, 'id'>;
export type BusinessSystemFormSource = Partial<Record<keyof BusinessSystemForm, unknown>>;

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function normalizeDataScopes(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[,\uFF0C\u3001;\uFF1B]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function emptyBusinessSystemForm(): BusinessSystemForm {
  return {
    systemName: '',
    businessFunction: '',
    serviceObject: '',
    userScale: '',
    coverageArea: '',
    classifiedProtectionLevel: '',
    relatedDepartments: '',
    dataScopes: [],
    topologyFileId: '',
    businessFlowFileId: ''
  };
}

export function normalizeBusinessSystemForForm(source?: BusinessSystemFormSource | null): BusinessSystemForm {
  const payload = source || {};

  return {
    systemName: normalizeText(payload.systemName),
    businessFunction: normalizeText(payload.businessFunction),
    serviceObject: normalizeText(payload.serviceObject),
    userScale: normalizeText(payload.userScale),
    coverageArea: normalizeText(payload.coverageArea),
    classifiedProtectionLevel: normalizeText(payload.classifiedProtectionLevel),
    relatedDepartments: normalizeText(payload.relatedDepartments),
    dataScopes: normalizeDataScopes(payload.dataScopes),
    topologyFileId: normalizeText(payload.topologyFileId),
    businessFlowFileId: normalizeText(payload.businessFlowFileId)
  };
}
