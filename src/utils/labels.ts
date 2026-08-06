import type { ProjectStatus } from '@/types/project';

export const projectStatusLabels: Record<ProjectStatus, string> = {
  NOT_STARTED: '待开始',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  ARCHIVED: '已归档'
};

export const projectStatusTagType: Record<ProjectStatus, 'info' | 'warning' | 'success'> = {
  NOT_STARTED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  ARCHIVED: 'info'
};

export const projectSystemTypeLabels: Record<string, string> = {
  POWER_MONITORING_SYSTEM: '电力监控系统',
  MANAGEMENT_INFO_SYSTEM: '管理信息系统',
  COMMUNICATION_NETWORK_FACILITY: '通信网络设施',
  DATA_RESOURCE: '数据资源',
  OTHER_SYSTEM_PLATFORM: '其他系统平台'
};

export const formatProjectSystemType = (value?: string | null, fallback?: string | null) => {
  if (!value) return fallback || '-';
  return projectSystemTypeLabels[value] || fallback || value;
};

export const riskLevelLabels: Record<string, string> = {
  MAJOR: '重大',
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
  SLIGHT: '轻微'
};

export const processingActivityLabels: Record<string, string> = {
  COLLECT: '收集',
  TRANSFER: '传输',
  STORE: '存储',
  USE_PROCESS: '使用和加工',
  PROVIDE: '提供',
  PUBLIC: '公开',
  DELETE: '删除'
};

export const formatProcessingActivityList = (value?: string[]) =>
  value?.length ? value.map((item) => processingActivityLabels[item] || item).join('、') : '-';

export const projectSteps = [
  { key: 'basic', label: '项目基本信息', path: 'basic' },
  { key: 'plan', label: '评估方案', path: 'plan' },
  { key: 'survey', label: '信息调研', path: 'survey' },
  { key: 'evaluation', label: '现场测评', path: 'evaluation' },
  { key: 'summary', label: '汇总分析', path: 'summary' },
  { key: 'reports', label: '报告管理', path: 'reports' }
] as const;
