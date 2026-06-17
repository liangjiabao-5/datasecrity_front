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
import PlaceholderWorkflowView from '@/views/workflow/PlaceholderWorkflowView.vue';
import KnowledgeView from '@/views/knowledge/KnowledgeView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AppLayout,
    redirect: '/projects',
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
      { path: 'knowledge', name: 'knowledge', component: KnowledgeView, meta: { title: '知识库管理' } },
      {
        path: 'settings',
        name: 'settings',
        component: PlaceholderWorkflowView,
        props: { pageKey: 'settings' },
        meta: { title: '系统设置' }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.afterEach((to) => {
  document.title = `${String(to.meta.title || '首页')} - 数据安全报告编制工具`;
});

export default router;
