<template>
  <div>
    <div class="page-heading">
      <div>
        <h1>项目管理</h1>
        <p>管理数据安全风险评估项目的创建、状态流转、详情查看和配置入口。</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="router.push('/projects/create')">创建新项目</el-button>
    </div>

    <div class="status-grid">
      <button
        v-for="item in statusCards"
        :key="item.key"
        type="button"
        class="status-card"
        :class="{ active: query.status === item.status }"
        @click="switchStatus(item.status)"
      >
        <div class="status-value">{{ item.value }}</div>
        <div class="status-label">{{ item.label }}</div>
      </button>
    </div>

    <div class="filter-bar">
      <el-input
        v-model="query.keyword"
        clearable
        style="max-width: 360px"
        placeholder="搜索项目名称、编号、评估单位"
        @keyup.enter="reloadFirstPage"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" :icon="Search" @click="reloadFirstPage">查询</el-button>
      <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
    </div>

    <div class="panel table-panel">
      <el-table v-loading="loading" :data="rows" row-key="id">
        <el-table-column prop="projectName" label="项目名称" min-width="220" show-overflow-tooltip />
        <el-table-column prop="projectCode" label="项目编号" width="160" />
        <el-table-column prop="assessmentOrg" label="评估单位" min-width="190" show-overflow-tooltip />
        <el-table-column prop="assessmentPeriod" label="评估周期" width="210" />
        <el-table-column prop="statusName" label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="projectStatusTagType[row.status]" effect="light">{{ row.statusName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="330" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button size="small" :icon="View" @click="openDetail(row.id)">查看</el-button>
              <el-button
                size="small"
                type="success"
                :icon="VideoPlay"
                :disabled="row.status === 'COMPLETED'"
                @click="startProject(row.id)"
              >
                开始评估
              </el-button>
              <el-button size="small" :icon="Edit" @click="router.push(`/projects/${row.id}/edit`)">编辑</el-button>
              <el-button size="small" type="danger" :icon="Delete" @click="removeProject(row.id)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="panel-pad">
        <el-pagination
          v-model:current-page="query.pageNo"
          v-model:page-size="query.pageSize"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          @current-change="loadProjects"
          @size-change="reloadFirstPage"
        />
      </div>
    </div>

    <el-dialog v-model="detailVisible" title="项目详情" width="760px">
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="项目名称">{{ detail.projectName }}</el-descriptions-item>
        <el-descriptions-item label="项目编号">{{ detail.projectCode }}</el-descriptions-item>
        <el-descriptions-item label="评估单位">{{ detail.assessmentOrg }}</el-descriptions-item>
        <el-descriptions-item label="项目状态">{{ detail.statusName }}</el-descriptions-item>
        <el-descriptions-item label="系统类别">{{ projectOptionLabel(options.systemTypes, detail.systemType, detail.systemTypeName) }}</el-descriptions-item>
        <el-descriptions-item label="评估模板">{{ projectOptionLabel(options.assessmentTemplates, detail.assessmentTemplateId, detail.assessmentTemplateName, detail.assessmentTemplateVersion) }}</el-descriptions-item>
        <el-descriptions-item label="评分模型">{{ projectOptionLabel(options.scoreModels, detail.scoreModelId, detail.scoreModelName, detail.scoreModelVersion) }}</el-descriptions-item>
        <el-descriptions-item label="风险评价矩阵">{{ projectOptionLabel(options.riskMatrices, detail.riskMatrixId, detail.riskMatrixName, detail.riskMatrixVersion) }}</el-descriptions-item>
        <el-descriptions-item label="危害程度模型">{{ projectOptionLabel(options.harmModels, detail.harmModelId, detail.harmModelName, detail.harmModelVersion) }}</el-descriptions-item>
        <el-descriptions-item label="项目描述" :span="2">{{ detail.description || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">团队成员</el-divider>
      <el-table :data="detail?.teamMembers || []" empty-text="暂无团队成员">
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="organization" label="单位" />
        <el-table-column prop="role" label="角色" />
      </el-table>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button @click="templateVisible = true">存入模板</el-button>
        <el-button type="primary" @click="detail && router.push(`/projects/${detail.id}/edit`)">编辑项目</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="templateVisible" title="存入模板" width="520px">
      <el-alert
        title="后端接口文档标记该能力为后续批次，本页面保留入口并按占位状态处理。"
        type="warning"
        show-icon
        :closable="false"
        style="margin-bottom: 16px"
      />
      <el-form :model="templateForm" label-width="120px">
        <el-form-item label="模板名称">
          <el-input v-model="templateForm.templateName" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="模板描述">
          <el-input v-model="templateForm.templateDescription" type="textarea" />
        </el-form-item>
        <el-form-item label="保存内容">
          <el-checkbox v-model="templateForm.includeAssessmentTemplate">评估模板</el-checkbox>
          <el-checkbox v-model="templateForm.includeScoreModel">评分模型</el-checkbox>
          <el-checkbox v-model="templateForm.includeTeamMembers">团队成员</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="templateVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTemplate">保存模板</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Delete, Edit, Plus, Refresh, Search, VideoPlay, View } from '@element-plus/icons-vue';
import { knowledgeApi } from '@/api/knowledgeApi';
import { projectApi } from '@/api/projectApi';
import type { ProjectConfigOptions, ProjectDetail, ProjectListItem, ProjectStatus, SaveProjectTemplatePayload, SelectOption } from '@/types/project';
import { projectStatusTagType } from '@/utils/labels';

const router = useRouter();
const loading = ref(false);
const rows = ref<ProjectListItem[]>([]);
const total = ref(0);
const detailVisible = ref(false);
const templateVisible = ref(false);
const detail = ref<ProjectDetail | null>(null);
const optionsLoaded = ref(false);
let optionsLoadPromise: Promise<void> | null = null;

const query = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: '',
  status: '' as '' | ProjectStatus
});

const stats = reactive({
  all: 0,
  notStarted: 0,
  inProgress: 0,
  completed: 0
});

const options = reactive<ProjectConfigOptions>({
  assessmentTemplates: [],
  riskMatrices: [],
  harmModels: [],
  scoreModels: [],
  systemTypes: []
});

const templateForm = reactive<SaveProjectTemplatePayload>({
  templateName: '',
  templateDescription: '',
  includeAssessmentTemplate: true,
  includeScoreModel: true,
  includeTeamMembers: false
});

const statusCards = computed(() => [
  { key: 'all', label: '全部项目', value: stats.all, status: '' as '' | ProjectStatus },
  { key: 'notStarted', label: '待开始', value: stats.notStarted, status: 'NOT_STARTED' as const },
  { key: 'inProgress', label: '进行中', value: stats.inProgress, status: 'IN_PROGRESS' as const },
  { key: 'completed', label: '已完成', value: stats.completed, status: 'COMPLETED' as const }
]);

const loadStatistics = async () => {
  const next = await projectApi.statistics();
  Object.assign(stats, next);
};

const loadProjects = async () => {
  loading.value = true;
  try {
    const page = await projectApi.list({
      pageNo: query.pageNo,
      pageSize: query.pageSize,
      keyword: query.keyword,
      status: query.status || undefined
    });
    rows.value = page.list;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
};

const reloadFirstPage = () => {
  query.pageNo = 1;
  loadProjects();
  loadStatistics();
};

const resetQuery = () => {
  query.keyword = '';
  query.status = '';
  reloadFirstPage();
};

const switchStatus = (status: '' | ProjectStatus) => {
  query.status = status;
  reloadFirstPage();
};

const withVersion = (name: string, version?: string | null) => (version ? `${name}（${version}）` : name);

const projectOptionLabel = (items: SelectOption[], id: string, name?: string | null, version?: string | null) => {
  if (name) return withVersion(name, version);
  const option = items.find((item) => item.id === id);
  if (option) return withVersion(option.name, option.version);
  return id || '-';
};

const loadProjectOptions = async () => {
  if (optionsLoaded.value) return;
  if (!optionsLoadPromise) {
    optionsLoadPromise = knowledgeApi
      .getProjectConfigOptions()
      .then((next) => {
        Object.assign(options, next);
        optionsLoaded.value = true;
      })
      .finally(() => {
        optionsLoadPromise = null;
      });
  }
  await optionsLoadPromise;
};

const openDetail = async (projectId: string) => {
  const [nextDetail] = await Promise.all([projectApi.detail(projectId), loadProjectOptions().catch(() => undefined)]);
  detail.value = nextDetail;
  templateForm.templateName = `${detail.value.projectName}模板`;
  templateVisible.value = false;
  detailVisible.value = true;
};

const startProject = async (projectId: string) => {
  await ElMessageBox.confirm('开始评估后将进入项目基本信息页面，并由后端生成检查项快照。', '确认开始评估', {
    type: 'warning'
  });
  await projectApi.start(projectId);
  ElMessage.success('项目已进入评估流程');
  await loadStatistics();
  await router.push(`/projects/${projectId}/basic`);
};

const removeProject = async (projectId: string) => {
  await ElMessageBox.confirm('删除项目将执行逻辑删除，已生成报告的审计记录应由后端保留。', '确认删除项目', {
    type: 'warning'
  });
  await projectApi.delete(projectId);
  ElMessage.success('项目已删除');
  reloadFirstPage();
};

const saveTemplate = async () => {
  if (!detail.value) return;
  const result = await projectApi.saveTemplate(detail.value.id, templateForm);
  ElMessage.warning(result.message);
  templateVisible.value = false;
};

onMounted(() => {
  loadProjectOptions().catch(() => undefined);
  loadStatistics();
  loadProjects();
});
</script>
