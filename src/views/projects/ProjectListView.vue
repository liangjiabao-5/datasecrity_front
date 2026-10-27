<template>
  <div>
    <div class="page-heading">
      <div>
        <h1>项目管理</h1>
        <p>管理数据安全风险评估项目的创建、状态流转、详情查看和配置入口。</p>
      </div>
      <el-button v-if="auth.hasPermission('project:create')" type="primary" :icon="Plus" @click="router.push('/projects/create')">创建新项目</el-button>
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

    <el-alert v-if="listError || statisticsError" :title="listError || statisticsError" type="error" :closable="false" show-icon style="margin-bottom: 16px" />
    <div class="panel table-panel">
      <el-table v-loading="loading" :data="rows" row-key="id">
        <el-table-column prop="projectName" label="项目名称" min-width="220" show-overflow-tooltip />
        <el-table-column prop="projectCode" label="项目编号" width="160" />
        <el-table-column prop="assessmentOrg" label="评估单位" min-width="190" show-overflow-tooltip />
        <el-table-column prop="ownerName" label="项目所有者" min-width="130" />
        <el-table-column label="当前身份" width="110"><template #default="{ row }"><el-tag v-if="row.accessType" :type="accessTypeTagType(row.accessType)" effect="plain">{{ accessTypeName(row.accessType) }}</el-tag><span v-else class="muted">-</span></template></el-table-column>
        <el-table-column prop="assessmentPeriod" label="评估周期" width="210" />
        <el-table-column prop="statusName" label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="light">{{ row.statusName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="410" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button v-if="row.canView" size="small" :icon="View" @click="openDetail(row.id)">查看</el-button>
              <el-button
                v-if="row.canEdit"
                size="small"
                type="success"
                :icon="VideoPlay"
                :disabled="row.status === 'COMPLETED'"
                @click="startProject(row.id)"
              >
                开始评估
              </el-button>
              <el-button v-if="row.canEdit" size="small" :icon="Edit" @click="router.push(`/projects/${row.id}/edit`)">编辑</el-button>
              <el-button v-if="row.canManageMembers" size="small" :icon="UserFilled" @click="openMembers(row)">协作人</el-button>
              <el-button v-if="row.canDelete" size="small" type="danger" :icon="Delete" @click="removeProject(row.id)">删除</el-button>
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

    <ProjectDetailDialog v-model="detailVisible" :project-id="detailProjectId" :reload-key="detailRevision" />

    <ProjectMemberPanel
      v-if="memberProject"
      v-model="memberVisible"
      :project="memberProject"
      :can-transfer-owner="memberProject.canTransferOwner === true"
      @owner-transferred="reloadAfterOwnerTransfer"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import { Delete, Edit, Plus, Refresh, Search, UserFilled, VideoPlay, View } from '@element-plus/icons-vue';
import { projectApi } from '@/api/projectApi';
import { notifyApiError, notifyApiSuccess } from '@/utils/apiFeedback';
import type { ProjectListItem, ProjectStatus } from '@/types/project';
import { projectStatusTagType } from '@/utils/labels';
import { normalizeProjectStatus } from '@/utils/projectPresentation';
import { useAuthStore } from '@/stores/auth';
import ProjectMemberPanel from '@/components/project/ProjectMemberPanel.vue';
import ProjectDetailDialog from '@/components/project/ProjectDetailDialog.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const loading = ref(false);
const listError = ref('');
const statisticsError = ref('');
const rows = ref<ProjectListItem[]>([]);
const total = ref(0);
const detailVisible = ref(false);
const detailProjectId = ref('');
const detailRevision = ref(0);
const memberProject = ref<ProjectListItem | null>(null);
const memberVisible = ref(false);
let listRevision = 0;
let statisticsRevision = 0;

const query = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: '',
  status: normalizeProjectStatus(route.query.status)
});

const stats = reactive({
  all: 0,
  notStarted: 0,
  inProgress: 0,
  completed: 0
});

const statusCards = computed(() => [
  { key: 'all', label: '全部项目', value: statisticsError.value ? '—' : stats.all, status: '' as '' | ProjectStatus },
  { key: 'notStarted', label: '待开始', value: statisticsError.value ? '—' : stats.notStarted, status: 'NOT_STARTED' as const },
  { key: 'inProgress', label: '进行中', value: statisticsError.value ? '—' : stats.inProgress, status: 'IN_PROGRESS' as const },
  { key: 'completed', label: '已完成', value: statisticsError.value ? '—' : stats.completed, status: 'COMPLETED' as const }
]);

const loadStatistics = async () => {
  const revision = ++statisticsRevision;
  const version = auth.sessionVersion;
  try {
    const next = await projectApi.statistics();
    if (revision === statisticsRevision && version === auth.sessionVersion) {
      Object.assign(stats, next);
      statisticsError.value = '';
    }
  } catch (error) {
    if (revision !== statisticsRevision || version !== auth.sessionVersion) return;
    statisticsError.value = '项目统计加载失败，请重新查询';
    notifyApiError(error, '项目统计加载失败，请重试');
  }
};

const loadProjects = async () => {
  loading.value = true;
  const revision = ++listRevision;
  const version = auth.sessionVersion;
  try {
    const page = await projectApi.list({
      pageNo: query.pageNo,
      pageSize: query.pageSize,
      keyword: query.keyword,
      status: query.status || undefined
    });
    if (revision === listRevision && version === auth.sessionVersion) {
      rows.value = page.list;
      total.value = page.total;
      listError.value = '';
    }
  } catch (error) {
    if (revision === listRevision && version === auth.sessionVersion) {
      listError.value = '项目列表加载失败，请重新查询';
      notifyApiError(error, '项目列表加载失败，请重试');
      rows.value = [];
      total.value = 0;
    }
  } finally {
    if (revision === listRevision) loading.value = false;
  }
};

const reloadFirstPage = () => {
  query.pageNo = 1;
  loadProjects();
  loadStatistics();
};

const resetQuery = () => {
  query.keyword = '';
  switchStatus('');
};

const switchStatus = (status: '' | ProjectStatus) => {
  if (normalizeProjectStatus(route.query.status) === status) {
    reloadFirstPage();
  } else {
    router.push({ path: '/projects', query: { ...route.query, status: status || undefined } });
  }
};

const statusTagType = (status: ProjectStatus) => projectStatusTagType[status];

const accessTypeName = (accessType: NonNullable<ProjectListItem['accessType']>) => ({ ADMIN: '管理员', OWNER: '所有者', COLLABORATOR: '协作人' }[accessType]);
const accessTypeTagType = (accessType: NonNullable<ProjectListItem['accessType']>) => ({ ADMIN: 'danger', OWNER: 'success', COLLABORATOR: 'info' }[accessType]);

const openDetail = (projectId: string) => {
  detailProjectId.value = projectId;
  detailVisible.value = true;
};

const startProject = async (projectId: string) => {
  await ElMessageBox.confirm('开始评估后将进入项目基本信息页面，并由后端生成检查项快照。', '确认开始评估', {
    type: 'warning'
  });
  const response = await projectApi.start(projectId);
  notifyApiSuccess(response, '项目已进入评估流程');
  await loadStatistics();
  await router.push(`/projects/${projectId}/basic`);
};

const removeProject = async (projectId: string) => {
  await ElMessageBox.confirm('删除项目将执行逻辑删除，已生成报告的审计记录应由后端保留。', '确认删除项目', {
    type: 'warning'
  });
  const response = await projectApi.delete(projectId);
  notifyApiSuccess(response, '项目已删除');
  reloadFirstPage();
};

const openMembers = (project: ProjectListItem) => {
  memberProject.value = project;
  memberVisible.value = true;
};

const reloadAfterOwnerTransfer = async () => {
  await loadProjects();
  if (memberProject.value) {
    memberProject.value = rows.value.find((project) => project.id === memberProject.value?.id) || memberProject.value;
  }
  detailRevision.value += 1;
};

watch(() => route.query.status, (status) => {
  query.status = normalizeProjectStatus(status);
  reloadFirstPage();
});
watch(() => auth.sessionVersion, () => {
  listRevision += 1;
  statisticsRevision += 1;
  rows.value = [];
  listError.value = '';
  statisticsError.value = '';
  total.value = 0;
  Object.assign(stats, { all: 0, notStarted: 0, inProgress: 0, completed: 0 });
  detailVisible.value = false;
  memberVisible.value = false;
}, { flush: 'sync' });
onBeforeUnmount(() => { listRevision += 1; statisticsRevision += 1; });
onMounted(() => {
  loadStatistics();
  loadProjects();
});
</script>
