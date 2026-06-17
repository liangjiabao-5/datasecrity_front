export interface ScoreRange {
  min: number;
  max: number;
  includeMin: boolean;
  includeMax: boolean;
}

export function validateDateRange(startDate?: string, endDate?: string): true | string {
  if (!startDate || !endDate) {
    return true;
  }
  return new Date(startDate).getTime() <= new Date(endDate).getTime()
    ? true
    : '开始时间不能晚于结束时间';
}

export function validateLooseEmail(value?: string): true | string {
  if (!value) {
    return true;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? true : '请输入合法的电子邮件';
}

export function validatePhoneLike(value?: string): true | string {
  if (!value) {
    return true;
  }
  return /^[0-9+\-\s()]{5,30}$/.test(value) ? true : '请输入合法的联系方式';
}

export function validateScoreRanges(ranges: ScoreRange[]): true | string {
  if (!ranges.length) {
    return '至少配置一个区间';
  }

  const sorted = [...ranges].sort((a, b) => a.min - b.min || a.max - b.max);
  if (sorted[0].min !== 0 || !sorted[0].includeMin) {
    return '评分区间必须从 0 开始且包含 0';
  }

  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index];
    if (current.min >= current.max) {
      return '区间下限必须小于上限';
    }

    const next = sorted[index + 1];
    if (!next) {
      if (current.max !== 100 || !current.includeMax) {
        return '评分区间必须覆盖到 100 且包含 100';
      }
      return true;
    }

    if (current.max !== next.min) {
      return '评分区间存在空档或重叠';
    }
    if (current.includeMax && next.includeMin) {
      return '相邻评分区间边界重复包含';
    }
    if (!current.includeMax && !next.includeMin) {
      return '相邻评分区间边界未被覆盖';
    }
  }

  return true;
}
