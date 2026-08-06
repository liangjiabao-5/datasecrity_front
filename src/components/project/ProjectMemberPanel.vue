<template>
  <el-drawer :model-value="modelValue" title="项目协作人" size="620px" destroy-on-close @update:model-value="emit('update:modelValue', $event)">
    <div v-loading="loading">
      <el-alert title="协作人可查看和编辑此项目的流程资料，但不能删除项目或管理协作人。" type="info" :closable="false" style="margin-bottom: 16px" />
      <el-descriptions :column="1" border style="margin-bottom: 16px">
        <el-descriptions-item label="项目所有者"><strong>{{ members?.owner.displayName || project.ownerName || '-' }}</strong><span class="muted">（{{ members?.owner.username || '-' }}）</span></el-descriptions-item>
        <el-descriptions-item label="系统角色">{{ members?.owner.roleNames?.join('、') || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div class="member-toolbar"><strong>协作人列表</strong><el-button type="primary" :icon="Plus" @click="addVisible = true">添加协作人</el-button></div>
      <el-table :data="members?.members || []" empty-text="暂无协作人">
        <el-table-column prop="displayName" label="姓名" min-width="115"><template #default="{ row }"><strong>{{ row.displayName }}</strong><span class="member-username">{{ row.username }}</span></template></el-table-column>
        <el-table-column label="权限" width="110"><template #default><el-tag type="success">可编辑</el-tag></template></el-table-column>
        <el-table-column label="授权时间" min-width="145"><template #default="{ row }">{{ formatDate(row.grantedAt) }}</template></el-table-column>
        <el-table-column label="操作" width="80"><template #default="{ row }"><el-button link type="danger" @click="removeMember(row.userId, row.displayName)">移除</el-button></template></el-table-column>
      </el-table>

      <template v-if="canTransferOwner">
        <el-divider />
        <div class="member-transfer"><div><strong>转交项目所有者</strong><p>仅超级管理员可执行。原所有者不会自动保留协作权限。</p></div><el-button @click="transferVisible = true">转交所有者</el-button></div>
      </template>
    </div>

    <el-dialog v-model="addVisible" title="添加协作人" width="520px" append-to-body @opened="loadCandidates">
      <el-alert title="仅展示有效且尚未加入该项目的用户。新增后默认授予编辑权限。" type="info" :closable="false" style="margin-bottom: 16px" />
      <div class="filter-bar compact-filter"><el-input v-model="candidateKeyword" clearable placeholder="搜索姓名或用户名" @keyup.enter="loadCandidates" /><el-button type="primary" @click="loadCandidates">查询</el-button></div>
      <el-select v-model="selectedCandidateId" filterable placeholder="请选择用户" style="width: 100%" :loading="candidateLoading"><el-option v-for="candidate in candidates" :key="candidate.id" :label="`${candidate.displayName}（${candidate.username}）`" :value="candidate.id" /></el-select>
      <template #footer><el-button @click="addVisible = false">取消</el-button><el-button type="primary" :loading="adding" @click="addMember">确认添加</el-button></template>
    </el-dialog>

    <el-dialog v-model="transferVisible" title="转交项目所有者" width="520px" append-to-body @opened="loadCandidates">
      <el-alert title="转交后原所有者将不再自动拥有项目编辑权；如需保留，请再将其添加为协作人。" type="warning" :closable="false" style="margin-bottom: 16px" />
      <div class="filter-bar compact-filter"><el-input v-model="candidateKeyword" clearable placeholder="搜索姓名或用户名" @keyup.enter="loadCandidates" /><el-button type="primary" @click="loadCandidates">查询</el-button></div>
      <el-select v-model="selectedCandidateId" filterable placeholder="请选择新的所有者" style="width: 100%" :loading="candidateLoading"><el-option v-for="candidate in candidates" :key="candidate.id" :label="`${candidate.displayName}（${candidate.username}）`" :value="candidate.id" /></el-select>
      <template #footer><el-button @click="transferVisible = false">取消</el-button><el-button type="danger" :loading="transferring" @click="transferOwner">确认转交</el-button></template>
    </el-dialog>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { projectMemberApi } from '@/api/projectMemberApi';
import type { ProjectListItem } from '@/types/project';
import type { ProjectMemberList } from '@/types/projectMember';

const props = defineProps<{ modelValue: boolean; project: ProjectListItem; canTransferOwner: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; 'owner-transferred': [] }>();
const members = ref<ProjectMemberList | null>(null);
const loading = ref(false);
const addVisible = ref(false);
const transferVisible = ref(false);
const candidates = ref<Array<{ id: string; username: string; displayName: string }>>([]);
const candidateKeyword = ref('');
const selectedCandidateId = ref('');
const candidateLoading = ref(false);
const adding = ref(false);
const transferring = ref(false);
let memberLoadVersion = 0;
const formatDate = (value?: string) => value ? value.replace('T', ' ').slice(0, 16) : '-';

const loadMembers = async () => {
  const currentVersion = ++memberLoadVersion;
  const projectId = props.project.id;
  loading.value = true;
  try {
    const result = await projectMemberApi.list(projectId);
    if (currentVersion === memberLoadVersion && props.project.id === projectId) members.value = result;
  } catch (error) {
    if (currentVersion === memberLoadVersion) {
      members.value = null;
      const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : '请稍后重试';
      ElMessage.error(`协作人列表加载失败：${message}`);
    }
  } finally {
    if (currentVersion === memberLoadVersion) loading.value = false;
  }
};
const loadCandidates = async () => { candidateLoading.value = true; try { const result = await projectMemberApi.candidates(props.project.id, { pageNo: 1, pageSize: 100, keyword: candidateKeyword.value || undefined }); candidates.value = result.list; selectedCandidateId.value = ''; } finally { candidateLoading.value = false; } };
const addMember = async () => { if (!selectedCandidateId.value) { ElMessage.warning('请选择要添加的用户'); return; } adding.value = true; try { await projectMemberApi.add(props.project.id, selectedCandidateId.value); ElMessage.success('协作人已添加'); addVisible.value = false; await loadMembers(); } finally { adding.value = false; } };
const removeMember = async (userId: string, displayName: string) => { await ElMessageBox.confirm(`确认移除协作人“${displayName}”？该用户将立即失去项目访问权限。`, '移除确认', { type: 'warning' }); await projectMemberApi.remove(props.project.id, userId); ElMessage.success('协作人已移除'); await loadMembers(); };
const transferOwner = async () => { if (!selectedCandidateId.value) { ElMessage.warning('请选择新的项目所有者'); return; } await ElMessageBox.confirm('确认转交项目所有者？原所有者不会自动成为协作人。', '转交确认', { type: 'warning' }); transferring.value = true; try { await projectMemberApi.transferOwner(props.project.id, selectedCandidateId.value); ElMessage.success('项目所有者已转交'); transferVisible.value = false; await loadMembers(); emit('owner-transferred'); } finally { transferring.value = false; } };
watch(
  () => [props.modelValue, props.project.id] as const,
  ([visible]) => {
    if (!visible) {
      memberLoadVersion += 1;
      return;
    }
    members.value = null;
    void loadMembers();
  },
  { immediate: true }
);
</script>
