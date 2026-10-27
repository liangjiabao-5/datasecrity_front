<template>
  <div>
    <ProjectHeader current-step="evaluation" />

    <div class="workflow-panel-actions">
      <el-button :icon="Download" :loading="exportingTemplate" @click="exportTemplate">导出模板</el-button>
      <el-upload :auto-upload="false" :show-file-list="false" accept=".xlsx,.xls,.json" :on-change="importRecords">
        <el-button :icon="Upload">导入</el-button>
      </el-upload>
      <el-button :icon="Download" :loading="exportingRecords" @click="exportRecords">导出</el-button>
      <el-button type="primary" :icon="DataAnalysis" @click="calculateScore">分数计算</el-button>
      <el-button type="success" @click="router.push(`/projects/${projectId}/summary`)">下一步</el-button>
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :lg="6">
        <div class="panel panel-pad">
          <strong>检查项目录</strong>
          <el-tree
            ref="catalogTreeRef"
            style="margin-top: 12px"
            node-key="id"
            :data="directoryTree"
            :props="{ label: 'label', children: 'children' }"
            empty-text="暂无检查项目"
            default-expand-all
            highlight-current
            @node-click="selectDirectory"
          />
        </div>
      </el-col>

      <el-col :xs="24" :lg="18">
        <div class="filter-bar">
          <el-input v-model="query.keyword" clearable placeholder="检查编号、评估项ID、要点、内容关键词" style="max-width: 280px" @keyup.enter="reloadFirstPage" />
          <el-select v-model="query.results" multiple collapse-tags clearable placeholder="符合情况" style="width: 240px">
            <el-option v-for="item in resultOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="reloadFirstPage">查询</el-button>
          <el-button :icon="Refresh" @click="reset">重置</el-button>
        </div>

        <div class="toolbar">
          <div class="table-actions">
            <span class="muted">批量修改符合情况-已选 {{ selectedRows.length }} 条</span>
            <el-select v-model="batchResultValue" placeholder="批量符合情况" style="width: 160px">
              <el-option v-for="item in resultOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-button type="primary" @click="applyBatchResult">确定</el-button>
          </div>
        </div>

        <div class="panel table-panel">
          <el-table v-loading="loading" :data="items" border row-key="id" @selection-change="selectedRows = $event">
            <el-table-column type="selection" width="48" />
            <el-table-column label="检查项编号" width="110">
              <template #default="{ row }">{{ getItemCode(row) }}</template>
            </el-table-column>
            <el-table-column label="评估项ID" width="120">
              <template #default="{ row }">{{ formatAssessmentItemId(row.assessmentItemId) }}</template>
            </el-table-column>
            <el-table-column label="分类" width="150">
              <template #default="{ row }">{{ getSubcategoryLabel(row) }}</template>
            </el-table-column>
            <el-table-column prop="checkPoint" label="检查要点" min-width="180" show-overflow-tooltip />
            <el-table-column prop="evaluationRecord" label="评估结果" min-width="220" show-overflow-tooltip />
            <el-table-column prop="evaluationResult" label="符合情况" width="150">
              <template #default="{ row }">
                <el-select
                  v-model="row.evaluationResult"
                  size="small"
                  style="width: 100%"
                  :disabled="inlineSavingId === row.id"
                  @change="updateInlineResult(row)"
                >
                  <el-option v-for="item in resultOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="panel-pad">
            <el-pagination
              v-model:current-page="query.pageNo"
              v-model:page-size="query.pageSize"
              background
              layout="total, sizes, prev, pager, next, jumper"
              :total="total"
              :page-sizes="[10, 20, 50]"
              @current-change="loadItems"
              @size-change="reloadFirstPage"
            />
          </div>
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="editVisible" title="编辑现场测评记录" width="760px">
      <el-form :model="editForm" label-width="120px">
        <el-form-item label="检查内容">
          <el-input v-model="editForm.checkContent" type="textarea" :rows="3" readonly />
        </el-form-item>
        <el-form-item label="评估结果">
          <el-input v-model="editForm.evaluationRecord" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="符合情况">
          <el-select v-model="editForm.evaluationResult" style="width: 100%">
            <el-option v-for="item in resultOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRecord">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="scoreVisible" title="分数计算结果" width="520px">
      <el-descriptions v-if="scoreResult" :column="1" border>
        <el-descriptions-item label="当前系统得分">{{ scoreResult.score }}</el-descriptions-item>
        <el-descriptions-item label="风险发生可能性">{{ scoreResult.possibilityLevelName }}</el-descriptions-item>
        <el-descriptions-item label="评分模型版本">v{{ scoreResult.scoreModelVersion }}</el-descriptions-item>
        <el-descriptions-item label="符合/基本符合/不符合/不适用">
          {{ scoreResult.detail.compliantCount }} /
          {{ scoreResult.detail.partialCount }} /
          {{ scoreResult.detail.nonCompliantCount }} /
          {{ scoreResult.detail.notApplicableCount }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="scoreVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="importErrorVisible" title="现场测评导入异常明细" width="860px">
      <el-alert type="warning" show-icon :closable="false">
        <template #title>
          已导入 {{ importImportedCount }} 条，发现 {{ importFailedCount }} 条异常明细。请下载最新模板或检查提示行后重新导入。
        </template>
      </el-alert>
      <el-table
        :data="importErrorRows"
        border
        empty-text="接口未返回异常明细"
        max-height="420"
        style="margin-top: 16px"
      >
        <el-table-column prop="rowNo" label="行号" width="90" />
        <el-table-column prop="field" label="字段" width="160" show-overflow-tooltip />
        <el-table-column prop="reason" label="原因" min-width="420" show-overflow-tooltip />
      </el-table>
      <template #footer>
        <el-button type="primary" @click="importErrorVisible = false">知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { notifyApiError } from '@/utils/apiFeedback';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { UploadFile } from 'element-plus';
import { DataAnalysis, Download, Refresh, Search, Upload } from '@element-plus/icons-vue';
import ProjectHeader from '@/components/ProjectHeader.vue';
import { evaluationApi } from '@/api/evaluationApi';
import { notifyApiSuccess } from '@/utils/apiFeedback';
import type { EvaluationImportError, EvaluationItem, EvaluationItemQuery, EvaluationRecordPayload, ScoreResult } from '@/types/evaluation';
import type { EvaluationResult } from '@/types/workflow';
import { downloadBlobFile } from '@/utils/fileActions';
import { normalizeEvaluationImportResult } from '@/utils/evaluationImportResult';

const route = useRoute();
const router = useRouter();
const projectId = String(route.params.projectId || '');
const loading = ref(false);
const allItems = ref<EvaluationItem[]>([]);
const items = ref<EvaluationItem[]>([]);
const savedInlineResults = new Map<string, EvaluationItem['evaluationResult']>();
const selectedRows = ref<EvaluationItem[]>([]);
const total = ref(0);
const editVisible = ref(false);
const scoreVisible = ref(false);
const importErrorVisible = ref(false);
const exportingTemplate = ref(false);
const exportingRecords = ref(false);
const editingItemId = ref('');
const inlineSavingId = ref('');
const batchResultValue = ref<EvaluationResult>('COMPLIANT');
const scoreResult = ref<ScoreResult | null>(null);
const importErrorRows = ref<EvaluationImportError[]>([]);
const importImportedCount = ref(0);
const importFailedCount = ref(0);
const selectedSheetName = ref('');
const selectedCategory = ref('');
const catalogTreeRef = ref<{ setCurrentKey: (key?: string) => void } | null>(null);

type DirectoryNode = {
  id: string;
  label: string;
  level: 'sheet' | 'category';
  sheetName: string;
  category?: string;
  children?: DirectoryNode[];
};

const query = reactive<{
  pageNo: number;
  pageSize: number;
  results: EvaluationResult[];
  keyword?: string;
}>({
  pageNo: 1,
  pageSize: 10,
  results: [],
  keyword: ''
});

const editForm = reactive<EvaluationRecordPayload & { checkContent: string }>({
  checkContent: '',
  evaluationResult: 'COMPLIANT',
  evaluationRecord: ''
});

const resultOptions: Array<{ label: string; value: EvaluationResult }> = [
  { label: '符合', value: 'COMPLIANT' },
  { label: '基本符合', value: 'PARTIAL' },
  { label: '不符合', value: 'NON_COMPLIANT' },
  { label: '不适用', value: 'NOT_APPLICABLE' }
];

const directoryPageSize = 200;

const formatAssessmentItemId = (value?: string | null) => (value?.trim() ? value.trim() : '-');

const getItemCode = (row: EvaluationItem) => row.itemCode || row.code || '-';

const directoryKey = (level: DirectoryNode['level'], sheetName: string, category?: string) =>
  [level, sheetName, category || ''].map((value) => encodeURIComponent(value)).join(':');

const getSheetName = (row: EvaluationItem) => row.sheet_name || row.sheetName || '未分组';

const getCategoryLabel = (row: EvaluationItem) => row.category || row.categoryName || '未分类';

const getSubcategoryLabel = (row: EvaluationItem) => row.subcategory || row.subcategoryName || row.categoryName || row.category || '-';

const directoryTree = computed<DirectoryNode[]>(() => {
  const sheetMap = new Map<string, Map<string, number>>();

  allItems.value.forEach((row) => {
    const sheetName = getSheetName(row);
    const category = getCategoryLabel(row);
    const categoryMap = sheetMap.get(sheetName) || new Map<string, number>();
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    sheetMap.set(sheetName, categoryMap);
  });

  return Array.from(sheetMap.entries()).map(([sheetName, categoryMap]) => ({
    id: directoryKey('sheet', sheetName),
    label: sheetName,
    level: 'sheet',
    sheetName,
    children: Array.from(categoryMap.keys()).map((category) => ({
      id: directoryKey('category', sheetName, category),
      label: category,
      level: 'category',
      sheetName,
      category
    }))
  }));
});

const matchesSelectedDirectory = (row: EvaluationItem) =>
  (!selectedSheetName.value || getSheetName(row) === selectedSheetName.value) &&
  (!selectedCategory.value || getCategoryLabel(row) === selectedCategory.value);

const buildItemQuery = (pageNo = query.pageNo, pageSize = query.pageSize): EvaluationItemQuery => ({
  pageNo,
  pageSize,
  results: query.results.length ? query.results : undefined,
  keyword: query.keyword || undefined,
  sheet_name: selectedSheetName.value || undefined,
  sheetName: selectedSheetName.value || undefined,
  category: selectedCategory.value || undefined
});

const fetchAllEvaluationItems = async (params: Omit<EvaluationItemQuery, 'pageNo' | 'pageSize'> = {}) => {
  const collected: EvaluationItem[] = [];
  let pageNo = 1;
  let total: number | undefined;

  while (pageNo <= 100) {
    const page = await evaluationApi.items(projectId, { ...params, pageNo, pageSize: directoryPageSize });
    const list = Array.isArray(page.list) ? page.list : [];
    collected.push(...list);
    total = typeof page.total === 'number' ? page.total : total;

    if (!list.length || list.length < directoryPageSize || (total !== undefined && collected.length >= total)) break;
    pageNo += 1;
  }

  return collected;
};

const loadDirectoryItems = async () => {
  allItems.value = await fetchAllEvaluationItems();
};

const loadItems = async () => {
  loading.value = true;
  try {
    const hasDirectoryFilter = Boolean(selectedSheetName.value || selectedCategory.value);

    if (hasDirectoryFilter) {
      const allMatchedItems = await fetchAllEvaluationItems(buildItemQuery(1, directoryPageSize));
      const filtered = allMatchedItems.filter(matchesSelectedDirectory);
      const start = (query.pageNo - 1) * query.pageSize;
      items.value = filtered.slice(start, start + query.pageSize);
      total.value = filtered.length;
    } else {
      const page = await evaluationApi.items(projectId, buildItemQuery());
      items.value = page.list;
      total.value = page.total;
    }
    items.value.forEach((row) => savedInlineResults.set(row.id, row.evaluationResult));
  } finally {
    loading.value = false;
  }
};

const reloadFirstPage = () => {
  query.pageNo = 1;
  selectedRows.value = [];
  loadItems();
};

const reset = () => {
  query.keyword = '';
  query.results = [];
  selectedSheetName.value = '';
  selectedCategory.value = '';
  catalogTreeRef.value?.setCurrentKey();
  reloadFirstPage();
};

const selectDirectory = (node: DirectoryNode) => {
  selectedSheetName.value = node.sheetName;
  selectedCategory.value = node.level === 'category' ? node.category || '' : '';
  reloadFirstPage();
};

const openEdit = (row: EvaluationItem) => {
  editingItemId.value = row.id;
  editForm.checkContent = row.checkContent;
  editForm.evaluationResult = row.evaluationResult;
  editForm.evaluationRecord = row.evaluationRecord;
  editVisible.value = true;
};

const saveRecord = async () => {
  const response = await evaluationApi.saveRecord(projectId, editingItemId.value, {
    evaluationResult: editForm.evaluationResult,
    evaluationRecord: editForm.evaluationRecord
  });
  editVisible.value = false;
  notifyApiSuccess(response, '现场测评记录已保存');
  await loadItems();
};

const updateInlineResult = async (row: EvaluationItem) => {
  inlineSavingId.value = row.id;
  try {
    const response = await evaluationApi.saveRecord(projectId, row.id, {
      evaluationResult: row.evaluationResult,
      evaluationRecord: row.evaluationRecord
    });
    savedInlineResults.set(row.id, row.evaluationResult);
    notifyApiSuccess(response, '符合情况已保存');
  } catch (error) {
    const previous = savedInlineResults.get(row.id);
    if (previous !== undefined) row.evaluationResult = previous;
    notifyApiError(error, '符合情况保存失败，请重试');
  } finally {
    inlineSavingId.value = '';
  }
};

const applyBatchResult = async () => {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先选择检查项');
    return;
  }
  await ElMessageBox.confirm(`将对 ${selectedRows.value.length} 条检查项应用符合情况，是否继续？`, '批量修改确认', {
    type: 'warning'
  });
  const response = await evaluationApi.batchResult(projectId, {
    itemIds: selectedRows.value.map((row) => row.id),
    evaluationResult: batchResultValue.value
  });
  notifyApiSuccess(response, '批量修改已完成');
  await loadItems();
};

const calculateScore = async () => {
  scoreResult.value = await evaluationApi.calculateScore(projectId);
  scoreVisible.value = true;
};

const exportTemplate = async () => {
  exportingTemplate.value = true;
  try {
    const { blob, fileName } = await evaluationApi.exportTemplate(projectId);
    downloadBlobFile(fileName || `现场测评导入模板-${projectId}.xlsx`, blob);
    ElMessage.success('现场测评导入模板已导出');
  } catch (error) {
    notifyApiError(error, `现场测评导入模板导出失败：${getErrorMessage(error, '请稍后重试')}`);
  } finally {
    exportingTemplate.value = false;
  }
};

const exportRecords = async () => {
  exportingRecords.value = true;
  try {
    const { blob, fileName } = await evaluationApi.exportRecords(projectId);
    downloadBlobFile(fileName || `现场测评记录-${projectId}.xlsx`, blob);
    ElMessage.success('现场测评记录已导出');
  } catch (error) {
    notifyApiError(error, `现场测评记录导出失败：${getErrorMessage(error, '请稍后重试')}`);
  } finally {
    exportingRecords.value = false;
  }
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
};

const importRecords = async (file: UploadFile) => {
  if (!file.raw) return;
  try {
    const result = await evaluationApi.importRecords(projectId, file.raw);
    const feedback = normalizeEvaluationImportResult(result.data);

    if (feedback.hasErrors) {
      importErrorRows.value = feedback.errors;
      importImportedCount.value = feedback.importedCount;
      importFailedCount.value = feedback.failedCount;
      importErrorVisible.value = true;
      ElMessage.warning(`现场测评导入完成：成功 ${feedback.importedCount} 条，异常 ${feedback.failedCount} 条`);
    } else {
      notifyApiSuccess(result, `现场测评数据已导入${feedback.importedCount ? `，共 ${feedback.importedCount} 条` : ''}`);
    }

    try {
      await loadDirectoryItems();
      await loadItems();
    } catch (error) { notifyApiError(error, '现场测评已导入，但页面刷新失败，请手动刷新'); }
  } catch (error) {
    notifyApiError(error, `现场测评导入失败：${getErrorMessage(error, '请检查导入接口服务或文件格式')}`);
  }
};

onMounted(async () => {
  await loadDirectoryItems();
  await loadItems();
});
</script>
