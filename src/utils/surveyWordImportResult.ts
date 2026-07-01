export interface SurveyWordImportError {
  tableName?: string;
  rowNo?: number;
  field?: string;
  reason: string;
}

export interface NormalizedSurveyWordImportError {
  message: string;
  errors: SurveyWordImportError[];
  hasErrors: boolean;
}

type ErrorContainer = {
  message?: unknown;
  data?: {
    errors?: unknown;
  };
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const normalizeErrorRow = (value: unknown): SurveyWordImportError => {
  const row = asRecord(value);
  return {
    tableName: typeof row.tableName === 'string' ? row.tableName : '',
    rowNo: typeof row.rowNo === 'number' && Number.isFinite(row.rowNo) ? row.rowNo : undefined,
    field: typeof row.field === 'string' ? row.field : '',
    reason: typeof row.reason === 'string' && row.reason.trim() ? row.reason : '导入文件存在格式错误'
  };
};

export const normalizeSurveyWordImportError = (error: unknown): NormalizedSurveyWordImportError => {
  const source = asRecord(error) as ErrorContainer;
  const message = typeof source.message === 'string' && source.message.trim() ? source.message : '导入失败';
  const data = source.data;
  const rows = data && Array.isArray(data.errors) ? data.errors.map(normalizeErrorRow) : [];

  return {
    message,
    errors: rows,
    hasErrors: rows.length > 0
  };
};
