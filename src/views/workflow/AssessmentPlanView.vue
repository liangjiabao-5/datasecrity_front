<template>
  <div>
    <ProjectHeader current-step="plan" />

    <div class="panel panel-pad">
      <div class="workflow-panel-actions">
        <el-button :icon="Download" @click="exportTeamTemplate">导出模板</el-button>
        <el-upload :auto-upload="false" :show-file-list="false" accept=".xlsx,.xls" :on-change="importPlan">
          <el-button :icon="Upload">导入</el-button>
        </el-upload>
        <el-button :icon="Download" @click="exportPlan">导出</el-button>
        <el-button type="primary" @click="savePlan">保存</el-button>
        <el-button type="success" @click="router.push(`/projects/${projectId}/survey`)">下一步</el-button>
      </div>

      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <el-tab-pane label="评估团队" name="assessment-team">
          <div class="toolbar">
            <div class="table-actions">
              <el-input v-model="keyword" clearable placeholder="查询姓名、单位、角色" style="width: 260px" />
              <el-button type="primary" :icon="Search">查询</el-button>
              <el-button :icon="Refresh" @click="keyword = ''">重置</el-button>
            </div>
            <el-button type="primary" :icon="Plus" @click="openDialog()">增加</el-button>
          </div>
          <el-table v-loading="loading" :data="filteredAssessmentTeam" border>
            <el-table-column prop="name" label="姓名" width="140" />
            <el-table-column prop="organization" label="单位" min-width="240" />
            <el-table-column prop="role" label="角色" width="150" />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openDialog(row)">修改</el-button>
                <el-button link type="danger" @click="remove(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="被评估方团队" name="client-team">
          <div class="toolbar">
            <div class="table-actions">
              <el-input v-model="keyword" clearable placeholder="查询部门、姓名、职位" style="width: 260px" />
              <el-button type="primary" :icon="Search">查询</el-button>
              <el-button :icon="Refresh" @click="keyword = ''">重置</el-button>
            </div>
            <el-button type="primary" :icon="Plus" @click="openDialog()">增加</el-button>
          </div>
          <el-table v-loading="loading" :data="filteredClientTeam" border>
            <el-table-column prop="department" label="公司/部门" min-width="180" />
            <el-table-column prop="name" label="姓名" width="140" />
            <el-table-column prop="position" label="职位" width="160" />
            <el-table-column prop="contact" label="联系方式" width="160" />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openDialog(row)">修改</el-button>
                <el-button link type="danger" @click="remove(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="关注点" name="focus-points">
          <div class="toolbar">
            <div class="table-actions">
              <el-input v-model="keyword" clearable placeholder="查询关注点、领域、描述" style="width: 260px" />
              <el-button type="primary" :icon="Search">查询</el-button>
              <el-button :icon="Refresh" @click="keyword = ''">重置</el-button>
            </div>
            <div class="table-actions">
              <el-button :icon="Collection" @click="chooseCase">选择已有案例</el-button>
              <el-button type="primary" :icon="Plus" @click="openDialog()">增加</el-button>
            </div>
          </div>
          <el-table v-loading="loading" :data="filteredFocusPoints" border>
            <el-table-column prop="name" label="关注点名称" min-width="170" />
            <el-table-column prop="domain" label="所属领域" width="150" />
            <el-table-column prop="riskLevel" label="风险等级" width="130">
              <template #default="{ row }">{{ riskLevelLabels[row.riskLevel] || row.riskLevel }}</template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="260" show-overflow-tooltip />
            <el-table-column prop="source" label="来源" width="110" />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openDialog(row)">修改</el-button>
                <el-button link type="danger" @click="remove(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="差距项" name="gap-items">
          <div class="toolbar">
            <div class="table-actions">
              <el-input v-model="keyword" clearable placeholder="查询差距项、维度、建议" style="width: 260px" />
              <el-button type="primary" :icon="Search">查询</el-button>
              <el-button :icon="Refresh" @click="keyword = ''">重置</el-button>
            </div>
            <el-button type="primary" :icon="Plus" @click="openDialog()">增加</el-button>
          </div>
          <el-table v-loading="loading" :data="filteredGapItems" border>
            <el-table-column prop="gapItem" label="差距项" min-width="220" />
            <el-table-column prop="dimension" label="评估维度" width="150" />
            <el-table-column prop="lastYearScore" label="去年得分" width="110" />
            <el-table-column prop="currentYearScore" label="今年得分" width="110" />
            <el-table-column prop="improvementSuggestion" label="改进建议" min-width="260" show-overflow-tooltip />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openDialog(row)">修改</el-button>
                <el-button link type="danger" @click="remove(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="620px">
      <el-form v-if="activeTab === 'assessment-team'" :model="assessmentForm" label-width="110px">
        <el-form-item label="姓名"><el-input v-model="assessmentForm.name" /></el-form-item>
        <el-form-item label="单位"><el-input v-model="assessmentForm.organization" /></el-form-item>
        <el-form-item label="角色"><el-input v-model="assessmentForm.role" /></el-form-item>
      </el-form>

      <el-form v-if="activeTab === 'client-team'" :model="clientForm" label-width="110px">
        <el-form-item label="公司/部门"><el-input v-model="clientForm.department" /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="clientForm.name" /></el-form-item>
        <el-form-item label="职位"><el-input v-model="clientForm.position" /></el-form-item>
        <el-form-item label="联系方式"><el-input v-model="clientForm.contact" /></el-form-item>
      </el-form>

      <el-form v-if="activeTab === 'focus-points'" :model="focusForm" label-width="110px">
        <el-form-item label="关注点名称"><el-input v-model="focusForm.name" /></el-form-item>
        <el-form-item label="所属领域"><el-input v-model="focusForm.domain" /></el-form-item>
        <el-form-item label="风险等级">
          <el-select v-model="focusForm.riskLevel" style="width: 100%">
            <el-option label="高" value="HIGH" />
            <el-option label="中" value="MEDIUM" />
            <el-option label="低" value="LOW" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述"><el-input v-model="focusForm.description" type="textarea" :rows="4" /></el-form-item>
      </el-form>

      <el-form v-if="activeTab === 'gap-items'" :model="gapForm" label-width="110px">
        <el-form-item label="差距项"><el-input v-model="gapForm.gapItem" /></el-form-item>
        <el-form-item label="评估维度"><el-input v-model="gapForm.dimension" /></el-form-item>
        <el-form-item label="去年得分"><el-input-number v-model="gapForm.lastYearScore" :min="0" :max="100" /></el-form-item>
        <el-form-item label="今年得分"><el-input-number v-model="gapForm.currentYearScore" :min="0" :max="100" /></el-form-item>
        <el-form-item label="改进建议"><el-input v-model="gapForm.improvementSuggestion" type="textarea" :rows="4" /></el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveDialog">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { notifyApiError } from '@/utils/apiFeedback';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { UploadFile } from 'element-plus';
import { Collection, Download, Plus, Refresh, Search, Upload } from '@element-plus/icons-vue';
import ProjectHeader from '@/components/ProjectHeader.vue';
import { planApi } from '@/api/planApi';
import { notifyApiSuccess } from '@/utils/apiFeedback';
import type {
  AssessmentTeamMember,
  ClientTeamMember,
  FocusPoint,
  GapItem,
  PlanEntity,
  PlanTabKey
} from '@/types/plan';
import { downloadBlobFile } from '@/utils/fileActions';
import { riskLevelLabels } from '@/utils/labels';
import { normalizePlanTeamExcelImportResult } from '@/utils/planTeamExcelImportResult';

const route = useRoute();
const router = useRouter();
const projectId = String(route.params.projectId || '');
const activeTab = ref<PlanTabKey>('assessment-team');
const keyword = ref('');
const loading = ref(false);
const dialogVisible = ref(false);
const editingId = ref('');

const assessmentTeam = ref<AssessmentTeamMember[]>([]);
const clientTeam = ref<ClientTeamMember[]>([]);
const focusPoints = ref<FocusPoint[]>([]);
const gapItems = ref<GapItem[]>([]);

const assessmentForm = reactive<Omit<AssessmentTeamMember, 'id'>>({ name: '', organization: '', role: '' });
const clientForm = reactive<Omit<ClientTeamMember, 'id'>>({ department: '', name: '', position: '', contact: '' });
const focusForm = reactive<Omit<FocusPoint, 'id'>>({
  name: '',
  domain: '',
  riskLevel: 'HIGH',
  description: '',
  source: 'MANUAL'
});
const gapForm = reactive<Omit<GapItem, 'id'>>({
  gapItem: '',
  dimension: '',
  lastYearScore: 0,
  currentYearScore: 0,
  improvementSuggestion: ''
});

const dialogTitle = computed(() => (editingId.value ? '修改记录' : '新增记录'));
const containsKeyword = (values: Array<string | number>) => {
  const word = keyword.value.trim().toLowerCase();
  if (!word) return true;
  return values.some((value) => String(value).toLowerCase().includes(word));
};

const filteredAssessmentTeam = computed(() =>
  assessmentTeam.value.filter((item) => containsKeyword([item.name, item.organization, item.role]))
);
const filteredClientTeam = computed(() =>
  clientTeam.value.filter((item) => containsKeyword([item.department, item.name, item.position, item.contact]))
);
const filteredFocusPoints = computed(() =>
  focusPoints.value.filter((item) => containsKeyword([item.name, item.domain, item.riskLevel, item.description]))
);
const filteredGapItems = computed(() =>
  gapItems.value.filter((item) =>
    containsKeyword([item.gapItem, item.dimension, item.lastYearScore, item.currentYearScore, item.improvementSuggestion])
  )
);

const load = async () => {
  loading.value = true;
  try {
    const [aTeam, cTeam, focuses, gaps] = await Promise.all([
      planApi.listAssessmentTeam(projectId),
      planApi.listClientTeam(projectId),
      planApi.listFocusPoints(projectId),
      planApi.listGapItems(projectId)
    ]);
    assessmentTeam.value = aTeam;
    clientTeam.value = cTeam;
    focusPoints.value = focuses;
    gapItems.value = gaps;
  } finally {
    loading.value = false;
  }
};

const onTabChange = () => {
  keyword.value = '';
};

const openDialog = (row?: PlanEntity) => {
  editingId.value = row?.id || '';
  if (activeTab.value === 'assessment-team') {
    Object.assign(assessmentForm, row || { name: '', organization: '', role: '' });
  } else if (activeTab.value === 'client-team') {
    Object.assign(clientForm, row || { department: '', name: '', position: '', contact: '' });
  } else if (activeTab.value === 'focus-points') {
    Object.assign(focusForm, row || { name: '', domain: '', riskLevel: 'HIGH', description: '', source: 'MANUAL' });
  } else {
    Object.assign(gapForm, row || { gapItem: '', dimension: '', lastYearScore: 0, currentYearScore: 0, improvementSuggestion: '' });
  }
  dialogVisible.value = true;
};

const saveDialog = async () => {
  let response;
  if (activeTab.value === 'assessment-team') {
    response = await planApi.saveAssessmentTeam(projectId, assessmentForm, editingId.value || undefined);
  } else if (activeTab.value === 'client-team') {
    response = await planApi.saveClientTeam(projectId, clientForm, editingId.value || undefined);
  } else if (activeTab.value === 'focus-points') {
    response = await planApi.saveFocusPoint(projectId, focusForm, editingId.value || undefined);
  } else {
    response = await planApi.saveGapItem(projectId, gapForm, editingId.value || undefined);
  }
  dialogVisible.value = false;
  notifyApiSuccess(response, '记录已保存');
  await load();
};

const remove = async (id: string) => {
  await ElMessageBox.confirm('删除后可能影响报告输出，请确认是否继续。', '确认删除', { type: 'warning' });
  let response;
  if (activeTab.value === 'assessment-team') {
    response = await planApi.deleteAssessmentTeam(projectId, id);
  } else if (activeTab.value === 'client-team') {
    response = await planApi.deleteClientTeam(projectId, id);
  } else if (activeTab.value === 'focus-points') {
    response = await planApi.deleteFocusPoint(projectId, id);
  } else {
    response = await planApi.deleteGapItem(projectId, id);
  }
  notifyApiSuccess(response, '记录已删除');
  await load();
};

const chooseCase = async () => {
  const response = await planApi.saveFocusPoint(projectId, {
    name: '权限最小化',
    domain: '访问控制',
    riskLevel: 'MEDIUM',
    description: '参考案例建议关注高权限账号授权、定期复核和离职人员权限回收。',
    source: 'CASE'
  });
  notifyApiSuccess(response, '已从案例库写入关注点');
  await load();
};

const savePlan = async () => {
  await load();
  ElMessage.success('评估方案已刷新，记录在新增或编辑时保存');
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
};

const exportTeamTemplate = async () => {
  try {
    const blob = await planApi.exportTeamTemplate(projectId);
    downloadBlobFile(`评估方案团队模板-${projectId}.xlsx`, blob);
    ElMessage.success('评估方案团队模板已导出');
  } catch (error) {
    notifyApiError(error, `评估方案团队模板导出失败：${getErrorMessage(error, '请稍后重试')}`);
  }
};

const exportPlan = async () => {
  try {
    const blob = await planApi.exportTeamFile(projectId);
    downloadBlobFile(`评估方案团队-${projectId}.xlsx`, blob);
    ElMessage.success('评估方案团队已导出');
  } catch (error) {
    notifyApiError(error, `评估方案团队导出失败：${getErrorMessage(error, '请稍后重试')}`);
  }
};

const importPlan = async (file: UploadFile) => {
  if (!file.raw) return;
  try {
    const payload = await planApi.importTeams(projectId, file.raw);
    normalizePlanTeamExcelImportResult(payload);
    notifyApiSuccess(payload, '评估方案团队已导入');
    try { await load(); }
    catch (error) { notifyApiError(error, '团队已导入，但列表刷新失败，请手动刷新'); }
  } catch (error) {
    notifyApiError(error, `评估方案团队导入失败：${getErrorMessage(error, '请检查导入文件或接口服务')}`);
  }
};

onMounted(load);
</script>
