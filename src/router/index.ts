import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import AppLayout from '@/components/layout/AppLayout.vue';
import ProjectListView from '@/views/projects/ProjectListView.vue';
import ProjectFormView from '@/views/projects/ProjectFormView.vue';
import BasicInfoView from '@/views/workflow/BasicInfoView.vue';
import AssessmentPlanView from '@/views/workflow/AssessmentPlanView.vue';
import SurveyView from '@/views/workflow/SurveyView.vue';
import EvaluationView from '@/views/workflow/EvaluationView.vue';
import SummaryView from '@/views/workflow/SummaryView.vue';
import ReportManagementView from '@/views/workflow/ReportManagementView.vue';
import KnowledgeView from '@/views/knowledge/KnowledgeView.vue';
import LoginView from '@/views/LoginView.vue';
import SettingsHomeView from '@/views/settings/SettingsHomeView.vue';
import UserManagementView from '@/views/settings/UserManagementView.vue';
import RoleManagementView from '@/views/settings/RoleManagementView.vue';
import PermissionDictionaryView from '@/views/settings/PermissionDictionaryView.vue';
import { useAuthStore } from '@/stores/auth';
import { useProjectStore } from '@/stores/project';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    requiresPermission?: string;
    requiresAnyPermissions?: string[];
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: LoginView, meta: { title: '登录' } },
  {
    path: '/',
    component: AppLayout,
    redirect: '/projects',
    meta: { requiresAuth: true },
    children: [
      { path: 'projects', name: 'projects', component: ProjectListView, meta: { title: '项目管理' } },
      {
        path: 'projects/create',
        name: 'project-create',
        component: ProjectFormView,
        props: { mode: 'create' },
        meta: { title: '创建项目' }
      },
      {
        path: 'projects/:projectId/edit',
        name: 'project-edit',
        component: ProjectFormView,
        props: { mode: 'edit' },
        meta: { title: '编辑项目' }
      },
      {
        path: 'projects/:projectId/basic',
        name: 'project-basic',
        component: BasicInfoView,
        meta: { title: '项目基本信息', step: 'basic' }
      },
      {
        path: 'projects/:projectId/plan',
        name: 'project-plan',
        component: AssessmentPlanView,
        meta: { title: '评估方案', step: 'plan' }
      },
      {
        path: 'projects/:projectId/survey',
        name: 'project-survey',
        component: SurveyView,
        meta: { title: '信息调研', step: 'survey' }
      },
      {
        path: 'projects/:projectId/evaluation',
        name: 'project-evaluation',
        component: EvaluationView,
        meta: { title: '现场测评', step: 'evaluation' }
      },
      {
        path: 'projects/:projectId/summary',
        name: 'project-summary',
        component: SummaryView,
        meta: { title: '汇总分析', step: 'summary' }
      },
      {
        path: 'projects/:projectId/reports',
        name: 'project-reports',
        component: ReportManagementView,
        meta: { title: '报告管理', step: 'reports' }
      },
      { path: 'knowledge', name: 'knowledge', component: KnowledgeView, meta: { title: '知识库管理', requiresPermission: 'knowledge:manage' } },
      {
        path: 'settings',
        name: 'settings',
        component: SettingsHomeView,
        meta: { title: '系统设置', requiresAnyPermissions: ['system:user:manage', 'system:role:manage', 'system:permission:read'] }
      },
      { path: 'settings/users', name: 'settings-users', component: UserManagementView, meta: { title: '用户管理', requiresPermission: 'system:user:manage' } },
      { path: 'settings/roles', name: 'settings-roles', component: RoleManagementView, meta: { title: '角色管理', requiresPermission: 'system:role:manage' } },
      {
        path: 'settings/permissions',
        name: 'settings-permissions',
        component: PermissionDictionaryView,
        meta: { title: '权限字典', requiresPermission: 'system:permission:read' }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  if (!requiresAuth) {
    if (to.name === 'login' && auth.isAuthenticated) return '/projects';
    return true;
  }

  if (!(await auth.initialize())) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  const requiredPermissions = to.matched
    .map((record) => record.meta.requiresPermission)
    .filter((permission): permission is string => Boolean(permission));
  if (requiredPermissions.some((permission) => !auth.hasPermission(permission))) {
    return '/projects';
  }
  const anyPermissions = to.matched.flatMap((record) => record.meta.requiresAnyPermissions || []);
  if (anyPermissions.length && !auth.hasAnyPermission(anyPermissions)) {
    return '/projects';
  }

  const projectId = typeof to.params.projectId === 'string' ? to.params.projectId : '';
  if (projectId) {
    try {
      const project = await useProjectStore().loadProject(projectId, true);
      if (project?.canView === false) return '/projects';
      if (to.name === 'project-edit' && project?.canEdit === false) return `/projects/${projectId}/basic`;
    } catch {
      return '/projects';
    }
  }
  return true;
});

router.afterEach((to) => {
  document.title = `${String(to.meta.title || '首页')} - 数据安全报告编制工具`;
});

export default router;
