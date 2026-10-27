import type { ProjectListItem, ProjectStatistics } from '@/types/project';
import { getApiErrorMessage } from '@/utils/apiFeedback';

export interface DashboardData {
  loading: boolean;
  forbidden: boolean;
  error: string;
  projects: ProjectListItem[];
  statistics: ProjectStatistics | null;
  projectsError: string;
  statisticsError: string;
}

interface DashboardDependencies {
  sessionKey: () => string | null;
  syncPermissions: () => Promise<boolean>;
  canRead: () => boolean;
  list: () => Promise<{ list: ProjectListItem[] }>;
  statistics: () => Promise<ProjectStatistics>;
  publish: (data: DashboardData) => void;
}

export const emptyDashboardData = (): DashboardData => ({
  loading: false, forbidden: false, error: '', projects: [], statistics: null,
  projectsError: '', statisticsError: ''
});

/** 每次读取都绑定登录会话；取消或换号后的迟到响应不能恢复旧数据。 */
export const createDashboardLoader = (dependencies: DashboardDependencies) => {
  let revision = 0;
  let disposed = false;
  let pending: { key: string; promise: Promise<void> } | null = null;

  const invalidate = () => {
    revision += 1;
    pending = null;
    dependencies.publish(emptyDashboardData());
  };

  const refresh = (): Promise<void> => {
    const key = dependencies.sessionKey();
    if (disposed) return Promise.resolve();
    if (!key) {
      invalidate();
      return Promise.resolve();
    }
    if (pending?.key === key) return pending.promise;
    const requestRevision = ++revision;
    const current = () => !disposed && revision === requestRevision && dependencies.sessionKey() === key;
    const data = { ...emptyDashboardData(), loading: true };
    dependencies.publish({ ...data });

    const promise = (async () => {
      try {
        if (!(await dependencies.syncPermissions()) || !current()) return;
        if (!dependencies.canRead()) {
          data.forbidden = true;
          return;
        }
        const [projects, statistics] = await Promise.allSettled([dependencies.list(), dependencies.statistics()]);
        if (!current()) return;
        const denied = [projects, statistics].some((result) =>
          result.status === 'rejected' && ['FORBIDDEN', 'PROJECT_ACCESS_DENIED', '403'].includes(String(result.reason?.code))
        );
        if (denied) {
          data.forbidden = true;
          return;
        }
        if (projects.status === 'fulfilled') data.projects = projects.value.list;
        else data.projectsError = getApiErrorMessage(projects.reason, '最近项目加载失败，请重试');
        if (statistics.status === 'fulfilled') data.statistics = statistics.value;
        else data.statisticsError = getApiErrorMessage(statistics.reason, '项目统计加载失败，请重试');
      } catch (error) {
        if (current()) data.error = getApiErrorMessage(error, '暂时无法获取当前账号权限，请重试');
      } finally {
        if (current()) {
          data.loading = false;
          dependencies.publish({ ...data });
          pending = null;
        }
      }
    })();
    pending = { key, promise };
    return promise;
  };

  return {
    refresh,
    invalidate,
    dispose: () => { disposed = true; invalidate(); }
  };
};
