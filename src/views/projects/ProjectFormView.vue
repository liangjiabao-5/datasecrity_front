<template>
  <div>
    <div class="page-heading">
      <div>
        <h1>{{ isEdit ? '编辑项目' : '创建项目' }}</h1>
        <p>一次性确定项目身份、评估模板、系统类型、风险模型和评分模型。</p>
      </div>
    </div>

    <div class="panel panel-pad">
      <el-alert
        v-if="isEdit"
        title="修改评估模板、评分模型、风险危害程度模型或风险评价矩阵时，保存前会提示可能影响测评记录和风险计算。"
        type="warning"
        show-icon
        :closable="false"
        style="margin-bottom: 18px"
      />

      <el-form ref="formRef" :model="form" :rules="rules" :disabled="isEdit && !canEdit" label-width="160px" status-icon>
        <el-row :gutter="20">
          <el-col :xs="24" :md="12">
            <el-form-item label="项目名称" prop="projectName">
              <el-input v-model="form.projectName" placeholder="请输入项目名称" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="项目编号" prop="projectCode">
              <el-input v-model="form.projectCode" placeholder="如 ENST-2026-001" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="评估单位" prop="assessmentOrg">
              <el-input v-model="form.assessmentOrg" placeholder="请输入评估单位" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="系统类型" prop="systemType">
              <el-select v-model="form.systemType" placeholder="请选择系统类型" filterable style="width: 100%">
                <el-option v-for="item in options.systemTypes" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="评估模板" prop="assessmentTemplateId">
              <el-select v-model="form.assessmentTemplateId" placeholder="请选择评估模板" filterable style="width: 100%">
                <el-option
                  v-for="item in options.assessmentTemplates"
                  :key="item.id"
                  :label="withVersion(item.name, item.version)"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="风险评价矩阵" prop="riskMatrixId">
              <el-select v-model="form.riskMatrixId" placeholder="请选择风险评价矩阵" filterable style="width: 100%">
                <el-option
                  v-for="item in options.riskMatrices"
                  :key="item.id"
                  :label="withVersion(item.name, item.version)"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="风险危害程度模型" prop="harmModelId">
              <el-select v-model="form.harmModelId" placeholder="请选择模型" filterable style="width: 100%">
                <el-option
                  v-for="item in options.harmModels"
                  :key="item.id"
                  :label="withVersion(item.name, item.version)"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="评分模型" prop="scoreModelId">
              <el-select v-model="form.scoreModelId" placeholder="请选择评分模型" filterable style="width: 100%">
                <el-option
                  v-for="item in options.scoreModels"
                  :key="item.id"
                  :label="withVersion(item.name, item.version)"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="项目描述">
              <el-input v-model="form.description" type="textarea" :rows="5" placeholder="项目背景、目标和范围" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="form-footer">
          <el-button @click="router.push('/projects')">取消</el-button>
          <el-button v-if="!isEdit || canEdit" type="primary" :loading="saving" @click="submit">{{ isEdit ? '保存修改' : '创建项目' }}</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessageBox, FormInstance, FormRules } from 'element-plus';
import { projectApi } from '@/api/projectApi';
import { notifyApiSuccess } from '@/utils/apiFeedback';
import type { ProjectConfigOptions, ProjectCreatePayload, ProjectDetail } from '@/types/project';

const props = defineProps<{
  mode: 'create' | 'edit';
}>();

const router = useRouter();
const route = useRoute();
const formRef = ref<FormInstance>();
const saving = ref(false);
const original = ref<ProjectDetail | null>(null);
const canEdit = ref(true);

const isEdit = computed(() => props.mode === 'edit');
const projectId = computed(() => String(route.params.projectId || ''));

const form = reactive<ProjectCreatePayload>({
  projectName: '',
  projectCode: '',
  assessmentOrg: '',
  riskMatrixId: '',
  assessmentTemplateId: '',
  systemType: '',
  harmModelId: '',
  scoreModelId: '',
  description: ''
});

const options = reactive<ProjectConfigOptions>({
  assessmentTemplates: [],
  riskMatrices: [],
  harmModels: [],
  scoreModels: [],
  systemTypes: []
});

const rules: FormRules = {
  projectName: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  projectCode: [{ required: true, message: '请输入项目编号', trigger: 'blur' }],
  assessmentOrg: [{ required: true, message: '请输入评估单位', trigger: 'blur' }],
  riskMatrixId: [{ required: true, message: '请选择风险评价矩阵', trigger: 'change' }],
  assessmentTemplateId: [{ required: true, message: '请选择评估模板', trigger: 'change' }],
  systemType: [{ required: true, message: '请选择系统类型', trigger: 'change' }],
  harmModelId: [{ required: true, message: '请选择风险危害程度分析模型', trigger: 'change' }],
  scoreModelId: [{ required: true, message: '请选择评分模型', trigger: 'change' }]
};

const withVersion = (name: string, version?: string) => (version ? `${name}（${version}）` : name);

const assignFromDetail = (detail: ProjectDetail) => {
  form.projectName = detail.projectName;
  form.projectCode = detail.projectCode;
  form.assessmentOrg = detail.assessmentOrg;
  form.riskMatrixId = detail.riskMatrixId;
  form.assessmentTemplateId = detail.assessmentTemplateId;
  form.systemType = detail.systemType;
  form.harmModelId = detail.harmModelId;
  form.scoreModelId = detail.scoreModelId;
  form.description = detail.description || '';
};

const hasModelChange = () => {
  if (!original.value) return false;
  return (
    original.value.assessmentTemplateId !== form.assessmentTemplateId ||
    original.value.scoreModelId !== form.scoreModelId ||
    original.value.harmModelId !== form.harmModelId ||
    original.value.riskMatrixId !== form.riskMatrixId
  );
};

const submit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (isEdit.value && hasModelChange()) {
    await ElMessageBox.confirm(
      '当前修改会影响检查项、分数计算或风险等级判定。已生成的风险清单和报告不会被静默覆盖，请保存后按需重新计算或生成。',
      '确认模型/模板变更',
      { type: 'warning' }
    );
  }

  saving.value = true;
  try {
    if (isEdit.value) {
      const response = await projectApi.update(projectId.value, form);
      notifyApiSuccess(response, '项目修改已保存');
      await router.push('/projects');
    } else {
      const response = await projectApi.create(form);
      notifyApiSuccess(response, '项目创建成功');
      await router.push('/projects');
    }
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  Object.assign(options, await projectApi.configOptions());
  if (isEdit.value) {
    const detail = await projectApi.detail(projectId.value);
    canEdit.value = Boolean(detail.canEdit);
    original.value = detail;
    assignFromDetail(detail);
  }
});
</script>
