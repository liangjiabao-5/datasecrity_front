import type { ProjectListItem, ProjectStatus } from '@/types/project';

export const projectAccessLabel = (accessType?: ProjectListItem['accessType']) =>
  accessType ? ({ ADMIN: '管理员', OWNER: '所有者', COLLABORATOR: '协作人' }[accessType] || '—') : '—';

export const normalizeProjectStatus = (value: unknown): '' | ProjectStatus =>
  typeof value === 'string' && ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'].includes(value)
    ? value as ProjectStatus
    : '';

export const formatProjectCreatedAt = (value?: string) => {
  if (!value) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  // 后端使用 UTC，但历史接口的 ISO 时间没有时区后缀。
  const date = new Date(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(date).replace(/\//g, '-');
};
