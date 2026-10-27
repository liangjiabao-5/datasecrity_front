<template>
  <div class="dashboard" :aria-busy="data.loading">
    <section class="dashboard-hero" aria-labelledby="dashboard-title">
      <div>
        <span class="hero-eyebrow">数据安全风险评估</span>
        <h1 id="dashboard-title">项目工作台</h1>
        <p>{{ auth.userName || '您好' }}，欢迎回来。{{ auth.isSuperAdmin ? '在这里掌握全部项目的评估进展。' : '在这里继续您拥有或参与的评估项目。' }}</p>
      </div>
      <el-button v-if="auth.hasPermission('project:create')" class="hero-create" :icon="Plus" @click="router.push('/projects/create')">创建新项目</el-button>
    </section>

    <el-result v-if="data.forbidden" icon="info" title="暂无项目查看权限" sub-title="如需查看评估项目，请联系管理员分配项目读取权限。">
      <template #extra><el-button :loading="data.loading" @click="loader.refresh">重新检查权限</el-button></template>
    </el-result>
    <el-result v-else-if="data.error" icon="warning" title="首页加载失败" :sub-title="data.error">
      <template #extra><el-button type="primary" @click="loader.refresh">重试</el-button></template>
    </el-result>
    <template v-else>
      <section class="dashboard-statistics" aria-label="项目统计">
        <button v-for="card in statisticCards" :key="card.key" class="dashboard-stat" :class="card.key" type="button" :disabled="!data.statistics || data.loading" :title="card.key === 'all' ? '全部项目包含已归档项目，点击查看全部' : `查看${card.label}项目`" @click="openProjects(card.status)">
          <span class="stat-icon"><el-icon><component :is="card.icon" /></el-icon></span>
          <span class="stat-text"><strong>{{ data.statistics ? data.statistics[card.key] : '—' }}</strong><span>{{ card.label }}</span></span>
          <el-icon class="stat-arrow"><ArrowRight /></el-icon>
        </button>
      </section>
      <p class="statistics-note">{{ auth.isSuperAdmin ? '统计全部可见项目' : '仅统计您有权限的项目' }} · 全部项目包含已归档项目</p>
      <el-alert v-if="data.statisticsError" :title="data.statisticsError" type="warning" :closable="false" show-icon>
        <el-button link type="primary" @click="loader.refresh">重新加载统计</el-button>
      </el-alert>

      <section class="dashboard-recent" aria-labelledby="recent-projects-title">
        <div class="recent-heading">
          <div><h2 id="recent-projects-title">最近项目</h2><p>按创建时间倒序 · 最多展示 6 个项目</p></div>
          <div class="recent-actions">
            <el-button :icon="Refresh" :loading="data.loading" @click="loader.refresh">刷新</el-button>
            <el-button type="primary" plain :disabled="data.loading" @click="openProjects('')">查看全部<el-icon class="button-arrow"><ArrowRight /></el-icon></el-button>
          </div>
        </div>
        <div v-if="data.loading" class="dashboard-projects" aria-label="正在加载项目">
          <div v-for="index in 6" :key="index" class="dashboard-project skeleton-card"><el-skeleton :rows="5" animated /></div>
        </div>
        <el-result v-else-if="data.projectsError" icon="warning" title="最近项目加载失败" :sub-title="data.projectsError">
          <template #extra><el-button @click="loader.refresh">重试</el-button></template>
        </el-result>
        <el-empty v-else-if="!data.projects.length" description="暂无可查看的项目">
          <p class="empty-description">创建您的第一个评估项目，或联系项目所有者添加协作授权。</p>
          <el-button v-if="auth.hasPermission('project:create')" type="primary" :icon="Plus" @click="router.push('/projects/create')">创建新项目</el-button>
        </el-empty>
        <div v-else class="dashboard-projects">
          <article v-for="project in data.projects" :key="project.id" class="dashboard-project">
            <div class="project-card-heading">
              <span class="project-card-icon"><el-icon><FolderOpened /></el-icon></span>
              <h3 :title="project.projectName || '—'">{{ project.projectName || '—' }}</h3>
              <el-tag :type="projectStatusTagType[project.status]" size="small" effect="light">{{ project.statusName || projectStatusLabels[project.status] || '—' }}</el-tag>
            </div>
            <dl class="project-card-fields">
              <div><dt>项目编号</dt><dd :title="project.projectCode || '—'">{{ project.projectCode || '—' }}</dd></div>
              <div><dt>评估单位</dt><dd :title="project.assessmentOrg || '—'">{{ project.assessmentOrg || '—' }}</dd></div>
              <div><dt>项目所有者</dt><dd :title="project.ownerName || '—'">{{ project.ownerName || '—' }}</dd></div>
              <div><dt>当前身份</dt><dd>{{ projectAccessLabel(project.accessType) }}</dd></div>
              <div><dt>创建时间</dt><dd :title="formatProjectCreatedAt(project.createdAt)">{{ formatProjectCreatedAt(project.createdAt) }}</dd></div>
            </dl>
            <div class="project-card-actions">
              <el-button :disabled="project.canView !== true" @click="viewProject(project)">查看项目</el-button>
              <el-button type="primary" plain :disabled="project.canView !== true" @click="router.push(`/projects/${project.id}/reports`)">报告管理<el-icon class="button-arrow"><ArrowRight /></el-icon></el-button>
            </div>
          </article>
        </div>
      </section>
    </template>
    <ProjectDetailDialog v-model="detailVisible" :project-id="detailProjectId" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowRight, CircleCheck, Clock, DataAnalysis, FolderOpened, Plus, Refresh, VideoPlay } from '@element-plus/icons-vue';
import ProjectDetailDialog from '@/components/project/ProjectDetailDialog.vue';
import { projectApi } from '@/api/projectApi';
import { useAuthStore } from '@/stores/auth';
import type { ProjectListItem, ProjectStatus } from '@/types/project';
import { createDashboardLoader, emptyDashboardData } from '@/utils/dashboardLoader';
import { projectStatusLabels, projectStatusTagType } from '@/utils/labels';
import { formatProjectCreatedAt, projectAccessLabel } from '@/utils/projectPresentation';

const auth = useAuthStore();
const router = useRouter();
const data = shallowRef(emptyDashboardData());
const detailVisible = ref(false);
const detailProjectId = ref('');
const loader = createDashboardLoader({
  sessionKey: () => auth.isAuthenticated ? `${auth.sessionVersion}:${auth.principal?.id}` : null,
  syncPermissions: () => auth.syncPrincipal({ errorMode: 'manual' }),
  canRead: () => auth.hasPermission('project:read'),
  list: () => projectApi.list({ pageNo: 1, pageSize: 6 }, { errorMode: 'manual' }),
  statistics: () => projectApi.statistics({ errorMode: 'manual' }),
  publish: (next) => { data.value = next; }
});
const statisticCards = [
  { key: 'all', label: '全部项目', status: '', icon: DataAnalysis },
  { key: 'notStarted', label: '待开始', status: 'NOT_STARTED', icon: Clock },
  { key: 'inProgress', label: '进行中', status: 'IN_PROGRESS', icon: VideoPlay },
  { key: 'completed', label: '已完成', status: 'COMPLETED', icon: CircleCheck }
] as const;
const sessionKey = computed(() => auth.isAuthenticated ? `${auth.sessionVersion}:${auth.principal?.id}` : null);

const openProjects = (status: '' | ProjectStatus) => router.push({ path: '/projects', query: status ? { status } : {} });
const viewProject = (project: ProjectListItem) => {
  if (project.canView !== true) return;
  if (project.status === 'NOT_STARTED') {
    detailProjectId.value = project.id;
    detailVisible.value = true;
  } else {
    router.push(`/projects/${project.id}/basic`);
  }
};
const refreshWhenVisible = () => {
  if (document.visibilityState === 'visible') {
    detailVisible.value = false;
    void loader.refresh();
  }
};
watch(sessionKey, () => {
  detailVisible.value = false;
  loader.invalidate();
  if (auth.isAuthenticated) void loader.refresh();
}, { flush: 'sync' });

onMounted(() => {
  void loader.refresh();
  window.addEventListener('focus', refreshWhenVisible);
  document.addEventListener('visibilitychange', refreshWhenVisible);
});
onBeforeUnmount(() => {
  window.removeEventListener('focus', refreshWhenVisible);
  document.removeEventListener('visibilitychange', refreshWhenVisible);
  loader.dispose();
});
</script>

<style scoped>
.dashboard { max-width: 1200px; margin: 12px auto 28px; }
.dashboard-hero { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 24px; overflow: hidden; padding: 36px 40px; border-radius: 18px; color: #fff; background: linear-gradient(115deg, #6679e9 0%, #7362cd 55%, #7950a5 100%); box-shadow: 0 12px 30px #6769bd26; }
.dashboard-hero::after { content: ''; position: absolute; width: 320px; height: 320px; right: 80px; top: -230px; border: 45px solid #ffffff08; border-radius: 50%; pointer-events: none; }
.hero-eyebrow { font-size: 16px; font-weight: 600; line-height: 1.5; letter-spacing: 2px; color: #e5e7ff; }
.dashboard-hero h1 { margin: 8px 0 10px; font-size: 30px; letter-spacing: 1px; }
.dashboard-hero p { margin: 0; font-size: 14px; color: #eeedff; line-height: 1.8; }
.hero-create { flex-shrink: 0; min-height: 40px; border: 1px solid #ffffff70; color: #fff; background: #ffffff20; }
.hero-create:hover, .hero-create:focus-visible { color: #fff; background: #ffffff35; border-color: #fff; }
.dashboard-statistics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-top: 26px; }
.dashboard-stat { display: flex; align-items: center; gap: 16px; padding: 25px 22px; border: 0; border-radius: 16px; text-align: left; font: inherit; color: #fff; box-shadow: 0 6px 18px #0f172a0d; cursor: pointer; transition: transform .15s, box-shadow .15s; }
.dashboard-stat:hover:enabled { transform: translateY(-3px); box-shadow: 0 10px 24px #0f172a20; }
.dashboard-stat:focus-visible { outline: 3px solid #3730a3; outline-offset: 3px; }
.dashboard-stat:disabled { cursor: default; }
.dashboard-stat.all { background: linear-gradient(120deg, #7078e6, #8555b5); }
.dashboard-stat.notStarted { background: linear-gradient(120deg, #f8b331, #f39a20); color: #422b08; }
.dashboard-stat.inProgress { background: linear-gradient(120deg, #4a9beb, #4876dc); }
.dashboard-stat.completed { background: linear-gradient(120deg, #62b86c, #3e9e54); }
.stat-icon { display: grid; place-items: center; width: 46px; height: 46px; flex-shrink: 0; border-radius: 12px; background: #ffffff24; font-size: 27px; }
.stat-text { display: flex; flex-direction: column; gap: 1px; }
.stat-text strong { font-size: 32px; line-height: 1.25; font-weight: 700; }
.stat-text > span { font-size: 13px; }
.stat-arrow { margin-left: auto; opacity: .7; }
.statistics-note { margin: 10px 2px 0; color: #64748b; font-size: 12px; }
.dashboard :deep(.el-alert) { margin-top: 12px; }
.dashboard-recent { margin-top: 30px; }
.recent-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.recent-heading h2 { margin: 0; color: #7160c5; font-size: 20px; }
.recent-heading p { margin: 5px 0 0; color: #64748b; font-size: 12px; }
.recent-actions { display: flex; flex-shrink: 0; }
.button-arrow { margin-left: 5px; }
.dashboard-projects { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.dashboard-project { min-width: 0; padding: 22px; border: 1px solid #eef0f6; border-radius: 16px; background: #fff; box-shadow: 0 5px 18px #0f172a08; }
.project-card-heading { display: flex; align-items: center; gap: 10px; }
.project-card-heading h3 { min-width: 0; flex: 1; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 16px; font-weight: 650; }
.project-card-heading :deep(.el-tag) { flex-shrink: 0; border-radius: 12px; }
.project-card-icon { display: grid; place-items: center; width: 32px; height: 32px; flex-shrink: 0; border-radius: 9px; color: #7b68cf; background: #f0edfc; font-size: 18px; }
.project-card-fields { margin: 21px 0; }
.project-card-fields > div { display: flex; align-items: baseline; gap: 12px; margin-top: 10px; font-size: 13px; }
.project-card-fields dt { width: 66px; flex-shrink: 0; color: #64748b; }
.project-card-fields dd { min-width: 0; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #334155; }
.project-card-actions { display: flex; justify-content: flex-end; padding-top: 16px; border-top: 1px solid #f1f5f9; }
.project-card-actions :deep(.el-button) { padding: 8px 12px; }
.skeleton-card { min-height: 296px; }
.empty-description { margin: 0 0 18px; color: #64748b; font-size: 13px; text-align: center; }
@media (max-width: 1199px) {
  .dashboard-projects { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .dashboard-stat { gap: 10px; padding: 22px 16px; }
  .stat-icon { width: 36px; height: 36px; font-size: 23px; }
  .stat-arrow { display: none; }
}
@media (max-width: 700px) {
  .dashboard { margin-top: 0; }
  .dashboard-hero { padding: 28px 24px; flex-direction: column; align-items: flex-start; }
  .dashboard-hero h1 { font-size: 26px; }
  .dashboard-statistics { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 20px; }
  .dashboard-projects { grid-template-columns: 1fr; gap: 16px; }
  .recent-heading { align-items: flex-start; flex-direction: column; }
  .recent-actions { width: 100%; justify-content: flex-end; }
}
@media (prefers-reduced-motion: reduce) { .dashboard-stat { transition: none; } }
</style>
