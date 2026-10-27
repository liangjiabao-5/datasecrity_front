<template>
  <div>
    <ProjectHeader current-step="reports" />

    <div class="panel panel-pad">
      <div class="report-toolbar">
        <div>
          <h2>报告管理</h2>
          <p>按项目最终确认数据生成 Word 报告，并保留每次生成记录。</p>
        </div>
        <div class="report-actions">
          <el-button type="primary" :icon="DocumentAdd" :loading="readinessLoading" @click="openGenerateDialog">
            生成报告
          </el-button>
          <el-button :icon="Refresh" :loading="loading" @click="refreshReports">刷新</el-button>
        </div>
      </div>

      <el-alert
        title="报告生成采用异步任务。待生成和生成中的记录会自动刷新，失败后可查看原因并重试。"
        type="info"
        show-icon
        :closable="false"
        class="report-notice"
      />

      <el-alert v-if="listError || pollingError" :title="listError || pollingError" type="warning" :closable="false" show-icon class="report-notice" />
      <el-alert v-if="taskWarnings.length" :title="taskWarnings.join('；')" type="warning" :closable="false" show-icon class="report-notice" />
      <el-table v-loading="loading" :data="rows" row-key="reportId" border>
        <el-table-column type="index" label="序号" width="70" :index="rowIndex" />
        <el-table-column prop="reportName" label="报告名称" min-width="240" show-overflow-tooltip />
        <el-table-column prop="reportTypeName" label="类型" min-width="190" show-overflow-tooltip />
        <el-table-column label="生成状态" width="130">
          <template #default="{ row }">
            <el-tag :type="reportStatusConfig(row.status).type" effect="light">
              <el-icon v-if="isActiveStatus(row.status)" class="is-loading"><Loading /></el-icon>
              {{ reportStatusConfig(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="报告章节" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">{{ formatSections(row.selectedSections) }}</template>
        </el-table-column>
        <el-table-column label="生成时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.generatedAt) }}</template>
        </el-table-column>
        <el-table-column prop="createdBy" label="创建人" width="130" show-overflow-tooltip />
        <el-table-column label="失败原因" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <span :class="{ 'error-text': row.status === 'FAILED' }">{{ row.errorMessage || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button
                v-if="row.status === 'SUCCESS'"
                link
                type="primary"
                :loading="downloadingId === row.reportId"
                @click="downloadReport(row)"
              >
                下载
              </el-button>
              <el-button
                v-if="row.status === 'FAILED'"
                link
                type="primary"
                :loading="retryingId === row.reportId"
                @click="retryReport(row)"
              >
                重试
              </el-button>
              <el-button
                v-if="isActiveStatus(row.status)"
                link
                type="primary"
                @click="refreshReports"
              >
                刷新
              </el-button>
              <el-button
                link
                type="danger"
                :disabled="isActiveStatus(row.status)"
                :loading="deletingId === row.reportId"
                @click="deleteReport(row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="report-pagination">
        <el-pagination
          v-model:current-page="query.pageNo"
          v-model:page-size="query.pageSize"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          @current-change="loadReports"
          @size-change="reloadFirstPage"
        />
      </div>
    </div>

    <el-dialog v-model="generateVisible" title="生成数据安全风险评估报告" width="760px" destroy-on-close>
      <el-alert
        v-if="readiness && readiness.blockers.length"
        title="当前项目暂不能生成报告"
        type="error"
        show-icon
        :closable="false"
        class="readiness-alert"
      >
        <ul class="issue-list">
          <li v-for="item in readiness.blockers" :key="item.code">{{ item.message }}</li>
        </ul>
      </el-alert>
      <el-alert
        v-else-if="readiness && readiness.warnings.length"
        title="部分项目数据尚不完整，确认后仍可继续生成"
        type="warning"
        show-icon
        :closable="false"
        class="readiness-alert"
      >
        <ul class="issue-list">
          <li v-for="item in readiness.warnings" :key="item.code">{{ item.message }}</li>
        </ul>
      </el-alert>
      <el-alert
        v-else
        title="生成前检查已通过，报告将读取项目当前最终确认数据。"
        type="success"
        show-icon
        :closable="false"
        class="readiness-alert"
      />

      <el-form :model="generateForm" label-width="100px">
        <el-form-item label="报告名称" required>
          <el-input v-model="generateForm.reportName" maxlength="100" show-word-limit placeholder="请输入报告名称" />
        </el-form-item>
        <el-form-item label="报告类型" required>
          <el-select v-model="generateForm.reportType" disabled style="width: 100%">
            <el-option label="数据安全风险评估报告" value="DATA_SECURITY_RISK_ASSESSMENT" />
          </el-select>
        </el-form-item>
        <el-form-item label="报告章节" required>
          <div class="section-selector">
            <div class="section-selector-actions">
              <el-checkbox
                :model-value="checkAllSections"
                :indeterminate="isSectionSelectionIndeterminate"
                @change="toggleAllSections"
              >
                全选章节
              </el-checkbox>
              <span>已选 {{ generateForm.selectedSections.length }} / {{ sectionOptions.length }} 个章节</span>
            </div>
            <el-checkbox-group v-model="generateForm.selectedSections" class="section-grid">
              <el-checkbox v-for="item in sectionOptions" :key="item.value" :label="item.value" border>
                <strong>{{ item.label }}</strong>
                <span>{{ item.description }}</span>
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="generateVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!readiness?.ready || Boolean(readiness?.blockers.length)"
          @click="submitGenerate"
        >
          提交生成
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { isIgnoredError, notifyApiError, notifyApiSuccess } from '@/utils/apiFeedback';
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { DocumentAdd, Loading, Refresh } from '@element-plus/icons-vue';
import ProjectHeader from '@/components/ProjectHeader.vue';
import { basicInfoApi } from '@/api/basicInfoApi';
import { reportApi } from '@/api/reportApi';
import { useProjectStore } from '@/stores/project';
import { buildDefaultReportName } from '@/utils/reportName';
import type {
  ReportGeneratePayload,
  ReportListItem,
  ReportReadinessResult,
  ReportSection,
  ReportStatus,
  ReportTaskStartResult
} from '@/types/report';

const route = useRoute();
const projectStore = useProjectStore();
const projectId = String(route.params.projectId || '');
const loading = ref(false);
const readinessLoading = ref(false);
const submitting = ref(false);
const generateVisible = ref(false);
const retryingId = ref('');
const downloadingId = ref('');
const deletingId = ref('');
const rows = ref<ReportListItem[]>([]);
const total = ref(0);
const readiness = ref<ReportReadinessResult | null>(null);
const companyName = ref('');
const reportProjectName = ref('');
const activeTaskIds = new Set<string>();
const listError = ref('');
const pollingError = ref('');
const taskWarnings = ref<string[]>([]);
let disposed = false;
let pollTimer: number | undefined;

const query = reactive({
  pageNo: 1,
  pageSize: 10
});

const allSections: ReportSection[] = ['BASIC_INFO', 'PLAN', 'SURVEY', 'EVALUATION', 'RISK_SUMMARY', 'SUGGESTIONS'];

const generateForm = reactive<ReportGeneratePayload>({
  reportName: '',
  reportType: 'DATA_SECURITY_RISK_ASSESSMENT',
  selectedSections: [...allSections]
});

const sectionOptions: Array<{ value: ReportSection; label: string; description: string }> = [
  { value: 'BASIC_INFO', label: '项目基本信息', description: '评估背景、目的、依据、框架、对象和范围' },
  { value: 'PLAN', label: '评估方案', description: '评估人员、实施流程和评估方法' },
  { value: 'SURVEY', label: '信息调研', description: '系统情况、数据资产、处理活动和安全措施' },
  { value: 'EVALUATION', label: '现场测评', description: '风险识别和现场测评问题清单' },
  { value: 'RISK_SUMMARY', label: '汇总分析', description: '风险源、危害程度、评分、矩阵和风险清单' },
  { value: 'SUGGESTIONS', label: '处置建议', description: '综合分析、风险处理和整改建议' }
];

const statusConfig: Record<ReportStatus, { label: string; type: 'info' | 'warning' | 'success' | 'danger' }> = {
  PENDING: { label: '待生成', type: 'info' },
  RUNNING: { label: '生成中', type: 'warning' },
  SUCCESS: { label: '生成完毕', type: 'success' },
  FAILED: { label: '生成失败', type: 'danger' }
};
const reportStatusConfig = (status: ReportStatus) => statusConfig[status] || { label: '状态未知', type: 'info' as const };

const checkAllSections = computed(() => generateForm.selectedSections.length === allSections.length);

const isSectionSelectionIndeterminate = computed(
  () => generateForm.selectedSections.length > 0 && generateForm.selectedSections.length < allSections.length
);

const sectionLabelMap = Object.fromEntries(sectionOptions.map((item) => [item.value, item.label])) as Record<ReportSection, string>;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
};

const isActiveStatus = (status: ReportStatus) => status === 'PENDING' || status === 'RUNNING';

const rowIndex = (index: number) => (query.pageNo - 1) * query.pageSize + index + 1;

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  return value.replace('T', ' ').replace('Z', '').slice(0, 19);
};

const formatSections = (sections: ReportSection[]) =>
  sections?.length ? sections.map((section) => sectionLabelMap[section] || section).join('、') : '-';

const defaultReportName = () => {
  return buildDefaultReportName({
    companyName: companyName.value || projectStore.currentProject?.assessmentOrg || projectStore.currentProject?.projectName,
    projectName: reportProjectName.value
  });
};

const toggleAllSections = (checked: string | number | boolean) => {
  generateForm.selectedSections = checked ? [...allSections] : [];
};

const schedulePolling = () => {
  const hasActiveRows = rows.value.some((row) => isActiveStatus(row.status));
  if (disposed || pollTimer || (!activeTaskIds.size && !hasActiveRows)) return;
  pollTimer = window.setTimeout(pollTasks, 1800);
};

const loadReports = async (showLoading = true) => {
  if (showLoading) loading.value = true;
  try {
    const result = await reportApi.list(projectId, query, { errorMode: 'manual' });
    if (disposed) return false;
    rows.value = result.list;
    total.value = result.total;
    query.pageNo = result.pageNo;
    query.pageSize = result.pageSize;
    listError.value = '';
    return true;
  } catch (error) {
    if (disposed || isIgnoredError(error)) return false;
    listError.value = `报告列表加载失败：${getErrorMessage(error, '请稍后重试')}`;
    if (showLoading) {
      notifyApiError(error, `报告列表加载失败：${getErrorMessage(error, '请稍后重试')}`);
    }
    return false;
  } finally {
    if (showLoading) loading.value = false;
    schedulePolling();
  }
};

const pollTasks = async () => {
  pollTimer = undefined;
  if (disposed) return;
  const taskIds = [...activeTaskIds];
  if (taskIds.length) {
    const results = await Promise.allSettled(taskIds.map((taskId) => reportApi.task(projectId, taskId)));
    if (disposed) return;
    const failure = results.find((result) => result.status === 'rejected' && !isIgnoredError(result.reason));
    pollingError.value = failure?.status === 'rejected'
      ? `暂时无法获取报告任务状态：${getErrorMessage(failure.reason, '请检查网络后重试')}；正在尝试恢复`
      : '';
    results.forEach((result, index) => {
      const taskId = taskIds[index];
      if (result.status === 'rejected') return;
      const task = result.value;
      if (task.status === 'SUCCESS') {
        activeTaskIds.delete(taskId);
        ElMessage.success('报告生成完毕');
      }
      if (task.status === 'FAILED') {
        activeTaskIds.delete(taskId);
        ElMessage.error(`报告生成失败：${task.errorMessage || task.result?.errorMessage || '请重试'}`);
      }
    });
  }
  await loadReports(false);
  schedulePolling();
};

const registerTask = (task: ReportTaskStartResult, acknowledgedWarnings: string[] = []) => {
  taskWarnings.value = [...new Set((task.warnings || []).map((item) => item.message))]
    .filter((message) => !acknowledgedWarnings.includes(message));
  if (taskWarnings.value.length) ElMessage.warning(taskWarnings.value.join('；'));
  if (isActiveStatus(task.status)) {
    activeTaskIds.add(task.reportTaskId);
    schedulePolling();
  } else if (task.status === 'SUCCESS') {
    ElMessage.success('报告生成完毕');
  } else if (task.status === 'FAILED') {
    ElMessage.error(`报告生成失败：${task.errorMessage || '请重试'}`);
  }
};

const reloadFirstPage = () => {
  query.pageNo = 1;
  loadReports();
};

const refreshReports = async () => {
  if (await loadReports()) ElMessage.success('报告列表已刷新');
};

const openGenerateDialog = async () => {
  readinessLoading.value = true;
  try {
    const [project, reportReadiness, basicInfo] = await Promise.all([
      projectStore.loadProject(projectId),
      reportApi.readiness(projectId),
      basicInfoApi.detail(projectId)
    ]);
    companyName.value = basicInfo?.organization?.name || project?.assessmentOrg || project?.projectName || '';
    reportProjectName.value = basicInfo?.projectName || project?.projectName || '';
    readiness.value = reportReadiness;
    generateForm.reportName = defaultReportName();
    generateForm.reportType = 'DATA_SECURITY_RISK_ASSESSMENT';
    generateForm.selectedSections = [...allSections];
    generateVisible.value = true;
  } catch (error) {
    notifyApiError(error, `生成前检查失败：${getErrorMessage(error, '请稍后重试')}`);
  } finally {
    readinessLoading.value = false;
  }
};

const submitGenerate = async () => {
  generateForm.reportName = generateForm.reportName.trim();
  if (!generateForm.reportName) {
    ElMessage.warning('请输入报告名称');
    return;
  }
  if (!generateForm.selectedSections.length) {
    ElMessage.warning('至少选择一个报告章节');
    return;
  }
  if (!readiness.value?.ready || readiness.value.blockers.length) {
    ElMessage.error('当前项目未通过生成前检查');
    return;
  }

  if (readiness.value.warnings.length) {
    try {
      await ElMessageBox.confirm(
        `以下数据尚不完整，报告将使用缺省内容：\n${readiness.value.warnings.map((item) => item.message).join('\n')}`,
        '确认继续生成',
        {
          type: 'warning',
          confirmButtonText: '继续生成',
          cancelButtonText: '返回检查'
        }
      );
    } catch {
      return;
    }
  }

  submitting.value = true;
  try {
    const response = await reportApi.generate(projectId, {
      reportName: generateForm.reportName,
      reportType: generateForm.reportType,
      selectedSections: [...generateForm.selectedSections]
    });
    const task = response.data;
    generateVisible.value = false;
    registerTask(task, readiness.value?.warnings.map((item) => item.message));
    if (isActiveStatus(task.status)) notifyApiSuccess(response, '报告生成任务已提交');
    query.pageNo = 1;
    await loadReports();
  } catch (error) {
    notifyApiError(error, `提交生成失败：${getErrorMessage(error, '请稍后重试')}`);
  } finally {
    submitting.value = false;
  }
};

const retryReport = async (row: ReportListItem) => {
  retryingId.value = row.reportId;
  try {
    const response = await reportApi.retry(projectId, row.reportId);
    const task = response.data;
    registerTask(task);
    if (isActiveStatus(task.status)) notifyApiSuccess(response, '报告重试任务已提交');
    await loadReports();
  } catch (error) {
    notifyApiError(error, `报告重试失败：${getErrorMessage(error, '请稍后重试')}`);
  } finally {
    retryingId.value = '';
  }
};

const downloadReport = async (row: ReportListItem) => {
  downloadingId.value = row.reportId;
  try {
    const blob = await reportApi.download(projectId, row.reportId);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${row.reportName.replace(/[\\/:*?"<>|]/g, '_')}.docx`;
    link.click();
    URL.revokeObjectURL(url);
    ElMessage.success('报告下载已开始');
  } catch (error) {
    notifyApiError(error, `报告下载失败：${getErrorMessage(error, '请稍后重试')}`);
  } finally {
    downloadingId.value = '';
  }
};

const deleteReport = async (row: ReportListItem) => {
  try {
    await ElMessageBox.confirm(`确认删除报告“${row.reportName}”？删除后将无法下载，但后端仍会保留审计记录。`, '删除报告', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    });
  } catch {
    return;
  }

  deletingId.value = row.reportId;
  try {
    const response = await reportApi.delete(projectId, row.reportId);
    notifyApiSuccess(response, '报告已删除');
    if (rows.value.length === 1 && query.pageNo > 1) query.pageNo -= 1;
    await loadReports();
  } catch (error) {
    notifyApiError(error, `报告删除失败：${getErrorMessage(error, '请稍后重试')}`);
  } finally {
    deletingId.value = '';
  }
};

onMounted(() => {
  loadReports();
});

onBeforeUnmount(() => {
  disposed = true;
  if (pollTimer) window.clearTimeout(pollTimer);
});
</script>

<style scoped>
.report-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.report-toolbar h2 {
  margin: 0;
  font-size: 18px;
}

.report-toolbar p {
  margin: 5px 0 0;
  color: var(--text-muted);
  font-size: 13px;
}

.report-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.report-notice,
.readiness-alert {
  margin-bottom: 16px;
}

.report-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  overflow-x: auto;
}

.error-text {
  color: var(--danger-color);
}

.issue-list {
  padding-left: 18px;
  margin: 8px 0 0;
  line-height: 1.7;
}

.section-selector {
  width: 100%;
}

.section-selector-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  color: var(--text-muted);
  font-size: 12px;
}

.section-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.section-grid .el-checkbox {
  width: 100%;
  height: auto;
  min-height: 64px;
  padding: 10px 12px;
  margin: 0;
  align-items: flex-start;
}

.section-grid .el-checkbox strong,
.section-grid .el-checkbox span {
  display: block;
}

.section-grid .el-checkbox span {
  margin-top: 3px;
  color: var(--text-muted);
  font-size: 12px;
  white-space: normal;
  line-height: 1.45;
}

@media (max-width: 760px) {
  .report-toolbar {
    flex-direction: column;
  }

  .section-grid {
    grid-template-columns: 1fr;
  }
}
</style>
