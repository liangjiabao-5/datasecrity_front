import type {
  ReportGeneratePayload,
  ReportListItem,
  ReportListResult,
  ReportReadinessResult,
  ReportTaskResult,
  ReportTaskStartResult
} from '@/types/report';

const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data)) as T;

const delay = <T>(data: T, ms = 180): Promise<T> =>
  new Promise((resolve) =>
    window.setTimeout(() => {
      if (data === undefined) {
        resolve(data);
        return;
      }
      resolve(clone(data));
    }, ms)
  );

const allSections: ReportGeneratePayload['selectedSections'] = [
  'BASIC_INFO',
  'PLAN',
  'SURVEY',
  'EVALUATION',
  'RISK_SUMMARY',
  'SUGGESTIONS'
];

const reportsByProject: Record<string, ReportListItem[]> = {
  p001: [
    {
      reportId: 'report-p001-001',
      reportName: 'XX银行数据安全风险评估报告',
      reportType: 'DATA_SECURITY_RISK_ASSESSMENT',
      reportTypeName: '数据安全风险评估报告',
      status: 'SUCCESS',
      fileId: 'file-report-p001-001',
      generatedAt: '2026-06-03T15:32:18',
      errorMessage: null,
      createdBy: '项目负责人',
      selectedSections: allSections,
      downloadUrl: '/api/v1/projects/p001/reports/report-p001-001/download'
    },
    {
      reportId: 'report-p001-002',
      reportName: 'XX银行数据安全风险评估报告-复核版',
      reportType: 'DATA_SECURITY_RISK_ASSESSMENT',
      reportTypeName: '数据安全风险评估报告',
      status: 'FAILED',
      generatedAt: null,
      errorMessage: '拓扑图文件读取失败，请检查文件后重试。',
      createdBy: '项目负责人',
      selectedSections: allSections,
      downloadUrl: null
    }
  ]
};

const tasks: Record<string, ReportTaskResult> = {};

const ensureReports = (projectId: string) => {
  if (!reportsByProject[projectId]) reportsByProject[projectId] = [];
  return reportsByProject[projectId];
};

const nextId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const startTask = (projectId: string, report: ReportListItem): ReportTaskStartResult => {
  const taskId = nextId('report-task');
  report.status = 'PENDING';
  report.errorMessage = null;
  report.generatedAt = null;
  report.fileId = null;
  report.downloadUrl = null;

  tasks[taskId] = {
    id: taskId,
    projectId,
    reportId: report.reportId,
    taskType: 'REPORT_GENERATE',
    status: 'PENDING',
    errorMessage: null,
    result: null
  };

  window.setTimeout(() => {
    const task = tasks[taskId];
    if (!task) return;
    task.status = 'RUNNING';
    report.status = 'RUNNING';
  }, 550);

  window.setTimeout(() => {
    const task = tasks[taskId];
    if (!task) return;
    const fileId = nextId('file-report');
    const downloadUrl = `/api/v1/projects/${projectId}/reports/${report.reportId}/download`;
    task.status = 'SUCCESS';
    task.result = { reportId: report.reportId, fileId, downloadUrl };
    report.status = 'SUCCESS';
    report.fileId = fileId;
    report.downloadUrl = downloadUrl;
    report.generatedAt = new Date().toISOString();
  }, 1800);

  return {
    reportTaskId: taskId,
    reportId: report.reportId,
    status: 'PENDING',
    taskStatusUrl: `/api/v1/projects/${projectId}/reports/tasks/${taskId}`,
    warnings: []
  };
};

export const reportDb = {
  list(projectId: string, pageNo = 1, pageSize = 10): Promise<ReportListResult> {
    const all = ensureReports(projectId);
    const start = (pageNo - 1) * pageSize;
    return delay({
      list: all.slice(start, start + pageSize),
      pageNo,
      pageSize,
      total: all.length
    });
  },

  readiness(projectId: string): Promise<ReportReadinessResult> {
    const warnings =
      projectId === 'p002'
        ? [{ code: 'ASSESSMENT_TEAM_EMPTY', message: '评估团队为空，报告将使用缺省文本。' }]
        : [];
    return delay({ projectId, ready: true, blockers: [], warnings });
  },

  generate(projectId: string, payload: ReportGeneratePayload): Promise<ReportTaskStartResult> {
    if (!payload.selectedSections.length) {
      return Promise.reject({ code: 'REPORT_SECTION_REQUIRED', message: '至少选择一个报告章节' });
    }
    const report: ReportListItem = {
      reportId: nextId('report'),
      reportName: payload.reportName,
      reportType: payload.reportType,
      reportTypeName: '数据安全风险评估报告',
      status: 'PENDING',
      generatedAt: null,
      errorMessage: null,
      createdBy: '项目负责人',
      selectedSections: [...payload.selectedSections],
      downloadUrl: null
    };
    ensureReports(projectId).unshift(report);
    return delay(startTask(projectId, report));
  },

  task(projectId: string, taskId: string): Promise<ReportTaskResult> {
    const task = tasks[taskId];
    if (!task || task.projectId !== projectId) {
      return Promise.reject({ code: 'REPORT_TASK_NOT_FOUND', message: '报告任务不存在' });
    }
    return delay(task);
  },

  retry(projectId: string, reportId: string): Promise<ReportTaskStartResult> {
    const report = ensureReports(projectId).find((item) => item.reportId === reportId);
    if (!report) return Promise.reject({ code: 'REPORT_NOT_FOUND', message: '报告不存在' });
    if (report.status !== 'FAILED') {
      return Promise.reject({ code: 'REPORT_RETRY_NOT_ALLOWED', message: '仅生成失败的报告可重试' });
    }
    return delay(startTask(projectId, report));
  },

  delete(projectId: string, reportId: string): Promise<void> {
    const list = ensureReports(projectId);
    const index = list.findIndex((item) => item.reportId === reportId);
    if (index < 0) return Promise.reject({ code: 'REPORT_NOT_FOUND', message: '报告不存在' });
    if (list[index].status === 'PENDING' || list[index].status === 'RUNNING') {
      return Promise.reject({ code: 'REPORT_DELETE_NOT_ALLOWED', message: '生成中的报告不可删除' });
    }
    list.splice(index, 1);
    return delay(undefined);
  },

  download(projectId: string, reportId: string): Promise<Blob> {
    const report = ensureReports(projectId).find((item) => item.reportId === reportId);
    if (!report || report.status !== 'SUCCESS') {
      return Promise.reject({ code: 'REPORT_DOWNLOAD_NOT_ALLOWED', message: '仅生成完毕的报告可下载' });
    }
    return Promise.resolve(
      new Blob([`${report.reportName}\n\n当前为前端 mock 模式生成的报告下载占位文件。`], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
    );
  }
};
