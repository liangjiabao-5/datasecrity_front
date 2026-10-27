<template>
  <el-dialog :model-value="modelValue" title="项目详情" width="min(760px, 94vw)" destroy-on-close @update:model-value="emit('update:modelValue', $event)">
    <div v-loading="loading" class="project-detail-content">
      <el-result v-if="error" icon="warning" title="项目详情加载失败" :sub-title="error">
        <template #extra><el-button @click="load">重试</el-button></template>
      </el-result>
      <template v-else-if="detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="项目名称">{{ detail.projectName || '—' }}</el-descriptions-item>
          <el-descriptions-item label="项目编号">{{ detail.projectCode || '—' }}</el-descriptions-item>
          <el-descriptions-item label="评估单位">{{ detail.assessmentOrg || '—' }}</el-descriptions-item>
          <el-descriptions-item label="项目状态">{{ detail.statusName || '—' }}</el-descriptions-item>
          <el-descriptions-item label="项目所有者">{{ detail.ownerName || '—' }}</el-descriptions-item>
          <el-descriptions-item label="当前身份">{{ projectAccessLabel(detail.accessType) }}</el-descriptions-item>
          <el-descriptions-item label="系统类别">{{ formatProjectSystemType(detail.systemType, detail.systemTypeName) }}</el-descriptions-item>
          <el-descriptions-item label="评估模板">{{ optionLabel(options?.assessmentTemplates, detail.assessmentTemplateId, detail.assessmentTemplateName, detail.assessmentTemplateVersion) }}</el-descriptions-item>
          <el-descriptions-item label="评分模型">{{ optionLabel(options?.scoreModels, detail.scoreModelId, detail.scoreModelName, detail.scoreModelVersion) }}</el-descriptions-item>
          <el-descriptions-item label="风险评价矩阵">{{ optionLabel(options?.riskMatrices, detail.riskMatrixId, detail.riskMatrixName, detail.riskMatrixVersion) }}</el-descriptions-item>
          <el-descriptions-item label="危害程度模型">{{ optionLabel(options?.harmModels, detail.harmModelId, detail.harmModelName, detail.harmModelVersion) }}</el-descriptions-item>
          <el-descriptions-item label="项目描述" :span="2">{{ detail.description || '—' }}</el-descriptions-item>
        </el-descriptions>
        <el-divider content-position="left">团队成员</el-divider>
        <el-table :data="detail.teamMembers || []" empty-text="暂无团队成员">
          <el-table-column prop="name" label="姓名" />
          <el-table-column prop="organization" label="单位" />
          <el-table-column prop="role" label="角色" />
        </el-table>
      </template>
    </div>
    <template #footer><el-button @click="emit('update:modelValue', false)">关闭</el-button></template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { projectApi } from '@/api/projectApi';
import { useAuthStore } from '@/stores/auth';
import type { ProjectConfigOptions, ProjectDetail, SelectOption } from '@/types/project';
import { formatProjectSystemType } from '@/utils/labels';
import { projectAccessLabel } from '@/utils/projectPresentation';
import { notifyApiError } from '@/utils/apiFeedback';

const props = defineProps<{ modelValue: boolean; projectId: string; reloadKey?: number }>();
const emit = defineEmits<{ (event: 'update:modelValue', value: boolean): void }>();
const auth = useAuthStore();
const detail = ref<ProjectDetail | null>(null);
const options = ref<ProjectConfigOptions | null>(null);
const loading = ref(false);
const error = ref('');
let revision = 0;

const optionLabel = (items: SelectOption[] | undefined, id: string, name?: string | null, version?: string | null) => {
  const option = items?.find((item) => item.id === id);
  const label = name || option?.name || id || '—';
  const currentVersion = version || option?.version;
  return currentVersion ? `${label}（${currentVersion}）` : label;
};

const load = async () => {
  const requestRevision = ++revision;
  const sessionVersion = auth.sessionVersion;
  detail.value = null;
  options.value = null;
  error.value = '';
  loading.value = false;
  if (!props.modelValue || !props.projectId || !auth.isAuthenticated) return;
  loading.value = true;
  try {
    const [project, config] = await Promise.all([
      projectApi.detail(props.projectId), projectApi.configOptions({ errorMode: 'manual' }).catch((failure) => {
        notifyApiError(failure, '项目配置加载失败，部分名称可能暂时无法显示', 'warning');
        return null;
      })
    ]);
    if (requestRevision !== revision || sessionVersion !== auth.sessionVersion) return;
    detail.value = project;
    options.value = config;
  } catch (failure) {
    if (requestRevision === revision && sessionVersion === auth.sessionVersion) {
      error.value = (failure as { message?: string })?.message || '请确认项目仍存在且当前账号有权访问';
    }
  } finally {
    if (requestRevision === revision) loading.value = false;
  }
};

watch(() => [props.modelValue, props.projectId, props.reloadKey, auth.sessionVersion], load, { immediate: true });
onBeforeUnmount(() => { revision += 1; });
</script>

<style scoped>
.project-detail-content { min-height: 120px; overflow-wrap: anywhere; }
</style>
