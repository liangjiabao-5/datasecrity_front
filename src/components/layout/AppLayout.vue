<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <img src="/logo.png" alt="ENST" />
        <div>
          <div class="brand-title">ENST</div>
          <div class="brand-subtitle">数据安全风险评估</div>
        </div>
      </div>

      <nav class="side-menu">
        <el-menu :default-active="activeMenu" router>
          <el-menu-item index="/projects">
            <el-icon><FolderOpened /></el-icon>
            <span>项目管理</span>
          </el-menu-item>
          <el-menu-item :index="projectPath('plan')">
            <el-icon><Tickets /></el-icon>
            <span>评估方案</span>
          </el-menu-item>
          <el-menu-item :index="projectPath('survey')">
            <el-icon><Document /></el-icon>
            <span>信息调研</span>
          </el-menu-item>
          <el-menu-item :index="projectPath('evaluation')">
            <el-icon><EditPen /></el-icon>
            <span>现场测评</span>
          </el-menu-item>
          <el-menu-item :index="projectPath('summary')">
            <el-icon><TrendCharts /></el-icon>
            <span>汇总分析</span>
          </el-menu-item>
          <el-menu-item :index="projectPath('reports')">
            <el-icon><Files /></el-icon>
            <span>报告管理</span>
          </el-menu-item>
          <el-menu-item index="/knowledge">
            <el-icon><Collection /></el-icon>
            <span>知识库管理</span>
          </el-menu-item>
          <el-menu-item index="/settings">
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>
      </nav>
    </aside>

    <main class="main-panel">
      <header class="topbar">
        <div class="topbar-title">
          <strong>{{ pageTitle }}</strong>
          <span>{{ projectSubtitle }}</span>
        </div>
        <div class="user-chip">
          <span class="user-avatar">{{ auth.userName.slice(0, 1) }}</span>
          <span>{{ auth.userName }} / {{ auth.roleName }}</span>
        </div>
      </header>

      <section class="content-body">
        <RouterView />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  Collection,
  Document,
  EditPen,
  Files,
  FolderOpened,
  Setting,
  Tickets,
  TrendCharts
} from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { useProjectStore } from '@/stores/project';

const route = useRoute();
const auth = useAuthStore();
const projectStore = useProjectStore();

const pageTitle = computed(() => String(route.meta.title || '数据安全风险评估'));
const projectSubtitle = computed(() => {
  const projectName = projectStore.currentProject?.projectName;
  return projectName ? `当前项目：${projectName}` : '按项目流程完成调研、测评、汇总和报告生成';
});

const currentProjectId = computed(() => String(route.params.projectId || projectStore.currentProject?.id || 'p001'));

const activeMenu = computed(() => {
  if (route.path.startsWith('/knowledge')) return '/knowledge';
  if (route.path.startsWith('/settings')) return '/settings';
  if (route.path.includes('/plan')) return projectPath('plan');
  if (route.path.includes('/survey')) return projectPath('survey');
  if (route.path.includes('/evaluation')) return projectPath('evaluation');
  if (route.path.includes('/summary')) return projectPath('summary');
  if (route.path.includes('/reports')) return projectPath('reports');
  return '/projects';
});

const projectPath = (step: string) => `/projects/${currentProjectId.value}/${step}`;
</script>
