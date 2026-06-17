<template>
  <div>
    <ProjectHeader v-if="config.projectStep" :current-step="config.projectStep" />

    <div v-else class="page-heading">
      <div>
        <h1>{{ config.title }}</h1>
        <p>{{ config.subtitle }}</p>
      </div>
    </div>

    <div class="panel panel-pad">
      <div v-if="config.actions.length" class="workflow-panel-actions">
        <el-button v-for="action in config.actions" :key="action" @click="handleAction(action)">{{ action }}</el-button>
      </div>

      <el-alert
        :title="config.notice"
        type="info"
        show-icon
        :closable="false"
        style="margin-bottom: 18px"
      />

      <div class="placeholder-grid">
        <div v-for="item in config.items" :key="item.title" class="placeholder-item">
          <strong>{{ item.title }}</strong>
          <span>{{ item.description }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElMessage } from 'element-plus';
import { useRoute } from 'vue-router';
import ProjectHeader from '@/components/ProjectHeader.vue';
import { reportApi } from '@/api/reportApi';

const props = defineProps<{
  pageKey: string;
}>();
const route = useRoute();

interface PlaceholderConfig {
  title: string;
  subtitle: string;
  notice: string;
  projectStep?: string;
  actions: string[];
  items: Array<{ title: string; description: string }>;
}

const configs: Record<string, PlaceholderConfig> = {
  survey: {
    title: '信息调研',
    subtitle: '结构化采集业务系统、数据资产、处理活动和安全防护措施。',
    notice: '此模块属于后续阶段，本工程已预留路由、页面框架和接口文件。',
    projectStep: 'survey',
    actions: ['导入', '导出', '保存', '下一步'],
    items: [
      { title: '业务和信息系统调研', description: '系统名称、业务功能、服务对象、用户规模、拓扑图和数据流转图。' },
      { title: '数据资产调研', description: '数据名称、形态、范围、规模、来源、存储和分类分级。' },
      { title: '数据处理活动调研', description: '收集、传输、存储、使用加工、提供、公开、删除七类活动。' },
      { title: '安全防护措施调研', description: '等保、密评、安全检测、组织负责人、安全设备和远程管理。' }
    ]
  },
  evaluation: {
    title: '现场测评',
    subtitle: '按项目检查项快照录入评估结果和符合情况。',
    notice: '现场测评接口已在 API 层预留，后续阶段接入检查项目录、符合情况筛选和分数计算。',
    projectStep: 'evaluation',
    actions: ['导出模板', '导入', '导出', '分数计算', '下一步'],
    items: [
      { title: '检查项目录', description: '左侧目录按数据安全管理和数据处理活动分类展示。' },
      { title: '现场测评记录', description: '维护评估结果和符合情况。' },
      { title: '批量修改', description: '对选中检查项批量应用符合情况，并显示影响条数。' }
    ]
  },
  summary: {
    title: '汇总分析',
    subtitle: '生成并确认风险源清单、风险清单和风险处置建议。',
    notice: '汇总分析路由已预留，后续接入刷新统计数据和人工修改弹窗。',
    projectStep: 'summary',
    actions: ['刷新统计数据', '下一步'],
    items: [
      { title: '数据安全风险源清单', description: '由现场测评问题和调研数据汇总生成，支持人工修改。' },
      { title: '数据安全风险清单', description: '结合危害程度、发生可能性和风险评价矩阵形成风险等级。' },
      { title: '数据安全风险处置建议', description: '从现场记录和知识库处置建议生成最终建议。' }
    ]
  },
  reports: {
    title: '报告管理',
    subtitle: '选择报告章节、生成任务、查看状态、下载或删除报告。',
    notice: '报告管理接口当前在后端文档中为占位实现，前端先保留生成和列表管理框架。',
    projectStep: 'reports',
    actions: ['生成', '刷新'],
    items: [
      { title: '报告生成配置', description: '默认全选章节，允许设置报告名称和类型。' },
      { title: '任务状态', description: '展示待生成、生成中、生成完毕、生成失败状态。' },
      { title: '下载与删除', description: '下载需后端校验项目权限，删除不影响原始评估数据。' }
    ]
  },
  settings: {
    title: '系统设置',
    subtitle: '当前需求说明未展开系统设置业务内容。',
    notice: '系统设置仅作为导航入口，本期不纳入详细开发范围。',
    actions: [],
    items: [{ title: '范围说明', description: '根据需求文档，本期不扩展原型未体现的系统设置功能。' }]
  }
};

const config = computed(() => configs[props.pageKey] || configs.settings);

const handleAction = async (name: string) => {
  if (props.pageKey === 'reports' && name === '刷新') {
    await reportApi.list(String(route.params.projectId || ''));
    ElMessage.success('报告列表已刷新');
    return;
  }
  if (props.pageKey === 'reports' && name === '生成') {
    await reportApi.generate(String(route.params.projectId || ''), {
      reportName: `数据安全风险评估报告-${new Date().toISOString().slice(0, 10)}`,
      reportType: 'DATA_SECURITY_RISK_ASSESSMENT',
      selectedSections: ['BASIC_INFO', 'SURVEY', 'EVALUATION', 'RISK_SUMMARY', 'SUGGESTIONS']
    });
    ElMessage.success('报告生成任务已提交');
    return;
  }
  ElMessage.warning(`${name}功能将在后续阶段按接口文档联调。`);
};
</script>
