<template>
  <div>
    <div class="page-heading"><div><h1>角色管理</h1><p>角色决定账号可访问的系统能力；项目访问仍需后端校验项目关系。</p></div><el-button type="primary" :icon="Plus" @click="openCreate">新建角色</el-button></div>
    <div class="panel table-panel">
      <el-table v-loading="loading" :data="roles" row-key="id">
        <el-table-column prop="code" label="角色代码" min-width="170" />
        <el-table-column prop="name" label="角色名称" min-width="140" />
        <el-table-column prop="description" label="说明" min-width="260" show-overflow-tooltip />
        <el-table-column label="状态" width="90"><template #default="{ row }"><el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">{{ row.status === 'ACTIVE' ? '启用' : '停用' }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="220" fixed="right"><template #default="{ row }"><div class="table-actions"><el-button link type="primary" @click="openEdit(row.id)">编辑</el-button><el-button v-if="!isBuiltin(row)" link type="primary" @click="openPermissions(row.id)">配置权限</el-button><span v-else class="muted">系统维护权限</span><el-button v-if="!isBuiltin(row)" link type="danger" @click="removeRole(row)">删除</el-button></div></template></el-table-column>
      </el-table>
    </div>
    <el-dialog v-model="formVisible" :title="editingId ? '编辑角色' : '新建角色'" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px"><el-form-item label="角色代码" prop="code"><el-input v-model.trim="form.code" :disabled="Boolean(editingId)" placeholder="如 PROJECT_MANAGER" /></el-form-item><el-form-item label="角色名称" prop="name"><el-input v-model.trim="form.name" /></el-form-item><el-form-item label="角色说明"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item><el-form-item label="状态"><el-radio-group v-model="form.status"><el-radio label="ACTIVE">启用</el-radio><el-radio label="DISABLED">停用</el-radio></el-radio-group></el-form-item></el-form>
      <template #footer><el-button @click="formVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="saveRole">保存</el-button></template>
    </el-dialog>
    <el-dialog v-model="permissionVisible" title="配置角色权限" width="760px" destroy-on-close>
      <el-alert title="权限代码由后端字典维护；保存后将立即影响使用该角色的账号。" type="info" :closable="false" style="margin-bottom: 16px" />
      <el-checkbox-group v-model="selectedPermissionIds" class="permission-checkboxes"><el-checkbox v-for="permission in configurablePermissions" :key="permission.id" :label="permission.id" border><strong>{{ permission.name }}</strong><span>{{ permission.code }}</span></el-checkbox></el-checkbox-group>
      <template #footer><el-button @click="permissionVisible = false">取消</el-button><el-button type="primary" :loading="permissionSaving" @click="savePermissions">保存权限</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { notifyApiError } from '@/utils/apiFeedback';
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { roleApi } from '@/api/systemApi';
import { notifyApiSuccess } from '@/utils/apiFeedback';
import type { Permission, RoleStatus, SystemRole } from '@/types/auth';

const defaultForm = () => ({ code: '', name: '', description: '', status: 'ACTIVE' as RoleStatus });
const roles = ref<SystemRole[]>([]);
const permissions = ref<Permission[]>([]);
const reservedSuperAdminPermissionCodes = new Set(['project:owner:transfer']);
const configurablePermissions = computed(() => permissions.value.filter((permission) => !reservedSuperAdminPermissionCodes.has(permission.code)));
const loading = ref(false);
const saving = ref(false);
const permissionSaving = ref(false);
const formVisible = ref(false);
const permissionVisible = ref(false);
const editingId = ref('');
const permissionRoleId = ref('');
const selectedPermissionIds = ref<string[]>([]);
const formRef = ref<FormInstance>();
const form = reactive(defaultForm());
const formRules: FormRules = { code: [{ required: true, message: '请输入角色代码', trigger: 'blur' }, { pattern: /^[A-Z][A-Z0-9_]{1,63}$/, message: '角色代码使用大写字母、数字和下划线', trigger: 'blur' }], name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }] };
const isBuiltin = (role: SystemRole) => role.code === 'SUPER_ADMIN' || role.code === 'USER';
const loadRoles = async () => { loading.value = true; try { roles.value = await roleApi.list(); } finally { loading.value = false; } };
const loadPermissions = async () => { permissions.value = await roleApi.permissions(); };
const openCreate = () => { editingId.value = ''; Object.assign(form, defaultForm()); formVisible.value = true; };
const openEdit = async (roleId: string) => { const role = await roleApi.detail(roleId); editingId.value = role.id; Object.assign(form, { code: role.code, name: role.name, description: role.description || '', status: role.status }); formVisible.value = true; };
const saveRole = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    const response = editingId.value ? await roleApi.update(editingId.value, form) : await roleApi.create(form);
    notifyApiSuccess(response, '角色信息已保存');
    formVisible.value = false;
    await loadRoles();
  } finally { saving.value = false; }
};
const openPermissions = async (roleId: string) => { const role = await roleApi.detail(roleId); if (isBuiltin(role)) { ElMessage.info('内置角色权限由系统维护，不能在页面修改。'); return; } permissionRoleId.value = role.id; selectedPermissionIds.value = role.permissions?.filter((permission) => !reservedSuperAdminPermissionCodes.has(permission.code)).map((permission) => permission.id) || []; permissionVisible.value = true; };
const savePermissions = async () => {
  permissionSaving.value = true;
  try {
    const response = await roleApi.updatePermissions(permissionRoleId.value, selectedPermissionIds.value);
    notifyApiSuccess(response, '角色权限已保存');
    permissionVisible.value = false;
    await loadRoles();
  } catch (error) { notifyApiError(error, '角色权限保存失败，请稍后重试。'); }
  finally { permissionSaving.value = false; }
};
const removeRole = async (role: SystemRole) => {
  await ElMessageBox.confirm(`确认删除角色“${role.name}”？`, '删除确认', { type: 'warning' });
  const response = await roleApi.delete(role.id);
  notifyApiSuccess(response, '角色已删除');
  await loadRoles();
};
onMounted(async () => { await Promise.all([loadRoles(), loadPermissions()]); });
</script>
