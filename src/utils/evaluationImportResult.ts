import type { EvaluationImportError, EvaluationImportResult } from '@/types/evaluation';

export interface NormalizedEvaluationImportResult {
  importedCount: number;
  failedCount: number;
  errors: EvaluationImportError[];
  hasErrors: boolean;
}

const normalizeCount = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

export const normalizeEvaluationImportResult = (
  result?: EvaluationImportResult | null
): NormalizedEvaluationImportResult => {
  const source = result || {};
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
