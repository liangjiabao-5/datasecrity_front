<template>
  <div>
    <ProjectHeader current-step="basic" />

    <div class="panel panel-pad">
      <div class="workflow-panel-actions">
        <el-button :icon="Download" @click="exportBasicInfoTemplate">导出模板</el-button>
        <el-upload :auto-upload="false" :show-file-list="false" accept=".xlsx,.xls" :on-change="importBasicInfo">
          <el-button :icon="Upload">导入</el-button>
        </el-upload>
        <el-button :icon="Download" @click="exportBasicInfo">导出</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
        <el-button type="success" :loading="saving" @click="saveAndNext">下一步</el-button>
      </div>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="项目基本情况" name="project">
          <el-form ref="formRef" :model="form" label-width="170px">
            <el-row :gutter="20">
              <el-col :xs="24" :md="12">
                <el-form-item label="项目编号">
                  <el-input v-model="form.projectNumber" readonly />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="项目名称">
                  <el-input v-model="form.projectName" placeholder="请输入项目名称" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="评估所依据的法律法规">
                  <div style="width: 100%">
                    <el-select
                      v-model="form.laws"
                      value-key="id"
                      multiple
                      filterable
                      placeholder="请选择评估所依据的法律法规"
                      style="width: 100%"
                    >
                      <el-option v-for="item in lawOptions" :key="item.id" :label="item.name" :value="item" />
                    </el-select>
                    <el-button link type="primary" :icon="Plus" @click="openReferenceDialog('LAW')">添加自定义法规</el-button>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="评估所参考的标准规范">
                  <div style="width: 100%">
                    <el-select
                      v-model="form.standards"
                      value-key="id"
                      multiple
                      filterable
                      placeholder="请选择评估所参考的标准规范"
                      style="width: 100%"
                    >
                      <el-option v-for="item in standardOptions" :key="item.id" :label="item.name" :value="item" />
                    </el-select>
                    <el-button link type="primary" :icon="Plus" @click="openReferenceDialog('STANDARD')">添加自定义标准</el-button>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="评估时间计划">
                  <div class="date-range-row">
                    <el-date-picker
                      v-model="form.assessmentPlan.startDate"
                      value-format="YYYY-MM-DD"
                      type="date"
                      placeholder="开始日期"
                    />
                    <span>至</span>
                    <el-date-picker
                      v-model="form.assessmentPlan.endDate"
                      value-format="YYYY-MM-DD"
                      type="date"
                      placeholder="结束日期"
                    />
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="被评估单位基本信息" name="organization">
          <el-form :model="form" label-width="150px">
            <el-row :gutter="20">
              <el-col :xs="24" :md="12">
                <el-form-item label="单位名称">
                  <el-input v-model="form.organization.name" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="邮政编码">
                  <el-input v-model="form.organization.postalCode" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>

          <div class="toolbar">
            <strong>联系人信息</strong>
            <el-button :icon="Plus" @click="addContact">新增联系人</el-button>
          </div>
          <el-table :data="form.contacts" border>
            <el-table-column label="姓名" min-width="130">
              <template #default="{ row }"><el-input v-model="row.name" /></template>
            </el-table-column>
            <el-table-column label="所属部门" min-width="150">
              <template #default="{ row }"><el-input v-model="row.department" /></template>
            </el-table-column>
            <el-table-column label="移动电话" min-width="150">
              <template #default="{ row }"><el-input v-model="row.mobile" /></template>
            </el-table-column>
            <el-table-column label="职务/职称" min-width="140">
              <template #default="{ row }"><el-input v-model="row.title" /></template>
            </el-table-column>
            <el-table-column label="办公电话" min-width="150">
              <template #default="{ row }"><el-input v-model="row.phone" /></template>
            </el-table-column>
            <el-table-column label="电子邮件" min-width="180">
              <template #default="{ row }"><el-input v-model="row.email" /></template>
            </el-table-column>
            <el-table-column label="操作" width="90" fixed="right">
              <template #default="{ $index }">
                <el-button link type="danger" @click="form.contacts.splice($index, 1)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="referenceVisible" :title="referenceType === 'LAW' ? '添加自定义法规' : '添加自定义标准'" width="520px">
      <el-form label-width="120px">
        <el-form-item label="名称">
          <el-input v-model="referenceName" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="进入知识库">
          <el-switch v-model="saveToKnowledge" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="referenceVisible = false">取消</el-button>
        <el-button type="primary" @click="createReference">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { UploadFile } from 'element-plus';
import { Download, Plus, Upload } from '@element-plus/icons-vue';
import ProjectHeader from '@/components/ProjectHeader.vue';
import { basicInfoApi } from '@/api/basicInfoApi';
import type { BasicInfoPayload, ContactInfo, CustomReferenceType, ReferenceItem } from '@/types/basicInfo';
import { downloadBlobFile } from '@/utils/fileActions';
import { normalizeBasicInfoExcelImportResult } from '@/utils/basicInfoExcelImportResult';
import { validateDateRange, validateLooseEmail, validatePhoneLike } from '@/utils/validation';

const route = useRoute();
const router = useRouter();
const projectId = String(route.params.projectId || '');
const saving = ref(false);
const activeTab = ref('project');
const referenceVisible = ref(false);
const referenceType = ref<CustomReferenceType>('LAW');
const referenceName = ref('');
const saveToKnowledge = ref(false);
const lawOptions = ref<ReferenceItem[]>([]);
const standardOptions = ref<ReferenceItem[]>([]);

const emptyBasicInfo = (): BasicInfoPayload => ({
  projectNumber: '',
  projectName: '',
  laws: [],
  standards: [],
  assessmentPlan: { startDate: '', endDate: '' },
  organization: {
    name: '',
    postalCode: ''
  },
  contacts: []
});

const form = reactive<BasicInfoPayload>(emptyBasicInfo());

const normalizeBasicInfo = (payload?: Partial<BasicInfoPayload> | null): BasicInfoPayload => {
  const defaults = emptyBasicInfo();
  const source = payload as (Partial<BasicInfoPayload> & { projectCode?: string }) | null | undefined;
  const organization = payload?.organization || {};
  const assessmentPlan = payload?.assessmentPlan || {};

  return {
    ...defaults,
    projectNumber: source?.projectNumber || source?.projectCode || '',
    projectName: source?.projectName || '',
    laws: Array.isArray(payload?.laws) ? payload.laws : [],
    standards: Array.isArray(payload?.standards) ? payload.standards : [],
    assessmentPlan: {
      ...defaults.assessmentPlan,
      ...assessmentPlan,
      startDate: assessmentPlan.startDate || '',
      endDate: assessmentPlan.endDate || ''
    },
    organization: {
      name: organization.name || '',
      postalCode: organization.postalCode || ''
    },
    contacts: Array.isArray(payload?.contacts) ? payload.contacts : []
  };
};

const load = async () => {
  const [detail, refs] = await Promise.all([basicInfoApi.detail(projectId), basicInfoApi.referenceOptions()]);
  Object.assign(form, normalizeBasicInfo(detail));
  lawOptions.value = refs.laws;
  standardOptions.value = refs.standards;
};

const assertValid = () => {
  const dateResult = validateDateRange(form.assessmentPlan.startDate, form.assessmentPlan.endDate);
  if (dateResult !== true) {
    ElMessage.error(dateResult);
    return false;
  }
  for (const contact of form.contacts) {
    const mobile = validatePhoneLike(contact.mobile);
    const phone = validatePhoneLike(contact.phone);
    const email = validateLooseEmail(contact.email);
    const result = [mobile, phone, email].find((item) => item !== true);
    if (result && result !== true) {
      ElMessage.error(`${contact.name || '联系人'}：${result}`);
      return false;
    }
  }
  return true;
};

const save = async () => {
  if (!assertValid()) return false;
  saving.value = true;
  try {
    await basicInfoApi.save(projectId, form);
    ElMessage.success('项目基本信息已保存');
    return true;
  } finally {
    saving.value = false;
  }
};

const saveAndNext = async () => {
  const saved = await save();
  if (saved) {
    await router.push(`/projects/${projectId}/plan`);
  }
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
};

const exportBasicInfoTemplate = async () => {
  try {
    const blob = await basicInfoApi.exportTemplate(projectId);
    downloadBlobFile(`项目基本信息模板-${projectId}.xlsx`, blob);
    ElMessage.success('项目基本信息模板已导出');
  } catch (error) {
    ElMessage.error(`项目基本信息模板导出失败：${getErrorMessage(error, '请稍后重试')}`);
  }
};

const exportBasicInfo = async () => {
  try {
    const blob = await basicInfoApi.exportFile(projectId);
    downloadBlobFile(`项目基本信息-${projectId}.xlsx`, blob);
    ElMessage.success('项目基本信息已导出');
  } catch (error) {
    ElMessage.error(`项目基本信息导出失败：${getErrorMessage(error, '请稍后重试')}`);
  }
};

const importBasicInfo = async (file: UploadFile) => {
  if (!file.raw) return;
  try {
    const payload = await basicInfoApi.importExcel(projectId, file.raw);
    Object.assign(form, normalizeBasicInfoExcelImportResult(payload));
    ElMessage.success('项目基本信息已导入，请保存后生效');
  } catch (error) {
    ElMessage.error(`项目基本信息导入失败：${getErrorMessage(error, '请检查导入文件或接口服务')}`);
  }
};

const addContact = () => {
  const contact: ContactInfo = {
    id: `contact-${Date.now()}`,
    name: '',
    department: '',
    mobile: '',
    title: '',
    phone: '',
    email: ''
  };
  form.contacts.push(contact);
};

const openReferenceDialog = (type: CustomReferenceType) => {
  referenceType.value = type;
  referenceName.value = '';
  saveToKnowledge.value = false;
  referenceVisible.value = true;
};

const createReference = async () => {
  if (!referenceName.value.trim()) {
    ElMessage.warning('请输入名称');
    return;
  }
  const item = await basicInfoApi.createCustomReference(projectId, {
    type: referenceType.value,
    name: referenceName.value.trim(),
    saveToKnowledge: saveToKnowledge.value
  });
  if (referenceType.value === 'LAW') {
    lawOptions.value.push(item);
    form.laws.push(item);
  } else {
    standardOptions.value.push(item);
    form.standards.push(item);
  }
  referenceVisible.value = false;
  ElMessage.success('自定义条目已添加');
};

onMounted(load);
</script>

<style scoped>
.date-range-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.date-range-row :deep(.el-date-editor) {
  flex: 1;
}

@media (max-width: 768px) {
  .date-range-row {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
