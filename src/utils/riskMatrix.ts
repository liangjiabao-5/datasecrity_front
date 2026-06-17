import type { RiskMatrixJson } from '@/types/knowledge';

const isEmptyLevel = (value?: string) => !value || value === '-';

export const calculateRiskLevelByMatrix = (
  matrix: RiskMatrixJson | undefined,
  possibilityLevel?: string,
  harmLevel?: string
) => {
  if (isEmptyLevel(possibilityLevel) || isEmptyLevel(harmLevel)) return '';
  return matrix?.[possibilityLevel || '']?.[harmLevel || ''] || '';
};
