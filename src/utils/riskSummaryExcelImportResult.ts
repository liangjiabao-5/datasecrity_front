export interface RiskSummaryImportError {
  rowNo?: number;
  field?: string;
  reason: string;
}

export interface RiskSummaryExcelImportResult {
  importedCount?: number;
  failedCount?: number;
  errors?: RiskSummaryImportError[];
}

type RiskSummaryImportContainer = {
  data?: RiskSummaryExcelImportResult | null;
};

export interface NormalizedRiskSummaryExcelImportResult {
  importedCount: number;
  failedCount: number;
  errors: RiskSummaryImportError[];
  hasErrors: boolean;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const normalizeCount = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

const unwrapPayload = (
  payload?: RiskSummaryExcelImportResult | RiskSummaryImportContainer | null
): RiskSummaryExcelImportResult => {
  const record = asRecord(payload);
  if ('data' in record) return asRecord(record.data) as RiskSummaryExcelImportResult;
  return record as RiskSummaryExcelImportResult;
};

export const normalizeRiskSummaryExcelImportResult = (
  payload?: RiskSummaryExcelImportResult | RiskSummaryImportContainer | null
): NormalizedRiskSummaryExcelImportResult => {
  const source = unwrapPayload(payload);
  const errors = Array.isArray(source.errors) ? source.errors : [];
  const importedCount = normalizeCount(source.importedCount);
  const failedCount = normalizeCount(source.failedCount) || errors.length;

  return {
    importedCount,
    failedCount,
    errors,
    hasErrors: failedCount > 0 || errors.length > 0
  };
};
