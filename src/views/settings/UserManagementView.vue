<template>
  <div>
    <div class="page-heading">
      <div><h1>用户管理</h1><p>账号、角色和状态由超级管理员统一维护。</p></div>
      <el-button type="primary" :icon="Plus" @click="openCreate">新建用户</el-button>
    </div>

    <div class="filter-bar">
      <el-input v-model="query.keyword" clearable placeholder="搜索用户名、姓名、手机号或邮箱" style="max-width: 300px" @keyup.enter="reloadFirstPage" />
      <el-select v-model="query.status" clearable placeholder="账号状态" style="width: 140px"><el-option label="启用" value="ACTIVE" /><el-option label="停用" value="DISABLED" /></el-select>
      <el-select v-model="query.roleCode" clearable placeholder="角色" style="width: 170px"><el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.code" /></el-select>
      <el-button type="primary" :icon="Search" @click="reloadFirstPage">查询</el-button>
      <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
    </div>

    <div class="panel table-panel">
      <el-table v-loading="loading" :data="users" row-key="id">
        <el-table-column prop="username" label="用户名" min-width="130" />
        <el-table-column prop="displayName" label="姓名" min-width="120" />
        <el-table-column prop="mobile" label="手机号" min-width="140" />
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column label="角色" min-width="180"><template #default="{ row }"><el-tag v-for="role in row.roles" :key="role.id" size="small" style="margin-right: 4px">{{ role.name }}</el-tag></template></el-table-column>
        <el-table-column label="状态" width="90"><template #default="{ row }"><el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">{{ row.status === 'ACTIVE' ? '启用' : '停用' }}</el-tag></template></el-table-column>
        <el-table-column label="最近登录" min-width="165"><template #default="{ row }">{{ formatDate(row.lastLoginAt) }}</template></el-table-column>
        <el-table-column label="操作" width="180" fixed="right"><template #default="{ row }"><div class="table-actions"><el-button link type="primary" @click="openEdit(row.id)">编辑</el-button><el-button link type="warning" @click="openResetPassword(row)">重置密码</el-button></div></template></el-table-column>
      </el-table>
      <div class="panel-pad"><el-pagination v-model:current-page="query.pageNo" v-model:page-size="query.pageSize" background layout="total, sizes, prev, pager, next, jumper" :page-sizes="[10, 20, 50]" :total="total" @current-change="loadUsers" @size-change="reloadFirstPage" /></div>
    </div>

    <el-dialog v-model="formVisible" :title="editingId ? '编辑用户' : '新建用户'" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="用户名" prop="username"><el-input v-model.trim="form.username" :disabled="Boolean(editingId)" autocomplete="off" /></el-form-item>
        <el-form-item label="姓名" prop="displayName"><el-input v-model.trim="form.displayName" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model.trim="form.mobile" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model.trim="form.email" /></el-form-item>
        <el-form-item v-if="!editingId" label="初始密码" prop="initialPassword"><el-input v-model="form.initialPassword" type="password" show-password autocomplete="new-password" /></el-form-item>
        <el-form-item v-if="editingId" label="账号状态"><el-radio-group v-model="form.status"><el-radio label="ACTIVE">启用</el-radio><el-radio label="DISABLED">停用</el-radio></el-radio-group></el-form-item>
        <el-form-item label="角色" prop="roleIds"><el-select v-model="form.roleIds" multiple placeholder="请选择角色" style="width: 100%"><el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id" :disabled="role.status !== 'ACTIVE'" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="formVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="submitForm">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="resetVisible" title="重置密码" width="440px" destroy-on-close>
      <p class="muted">将为“{{ resetTarget?.displayName || resetTarget?.username }}”设置新的临时密码。</p>
      <el-form label-width="92px"><el-form-item label="新密码" required><el-input v-model="resetPassword" type="password" show-password autocomplete="new-password" /></el-form-item></el-form>
      <template #footer><el-button @click="resetVisible = false">取消</el-button><el-button type="primary" :loading="resetting" @click="confirmResetPassword">确认重置</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Plus, Refresh, Search } from '@element-plus/icons-vue';
import { roleApi, userApi } from '@/api/systemApi';
import type { SystemRole, SystemUser, UserStatus } from '@/types/auth';

const defaultForm = () => ({ username: '', displayName: '', mobile: '', email: '', initialPassword: '', status: 'ACTIVE' as UserStatus, roleIds: [] as string[] });
const users = ref<SystemUser[]>([]);
const roles = ref<SystemRole[]>([]);
const loading = ref(false);
const saving = ref(false);
const resetting = ref(false);
const total = ref(0);
const editingId = ref('');
const formVisible = ref(false);
const resetVisible = ref(false);
const resetTarget = ref<SystemUser | null>(null);
const resetPassword = ref('');
const formRef = ref<FormInstance>();
const form = reactive(defaultForm());
const query = reactive({ pageNo: 1, pageSize: 10, keyword: '', status: '', roleCode: '' });
const passwordRule = (_rule: unknown, value: string, callback: (error?: Error) => void) => /^(?=.*[A-Za-z])(?=.*\d)\S{8,64}$/.test(value) ? callback() : callback(new Error('密码须为 8-64 位，且同时包含字母和数字'));
const formRules: FormRules = { username: [{ required: true, message: '请输入用户名', trigger: 'blur' }], displayName: [{ required: true, message: '请输入姓名', trigger: 'blur' }], initialPassword: [{ required: true, validator: passwordRule, trigger: 'blur' }], roleIds: [{ type: 'array', required: true, message: '请至少选择一个角色', trigger: 'change' }] };

const formatDate = (value?: string) => value ? value.replace('T', ' ').slice(0, 16) : '-';
const loadRoles = async () => { roles.value = await roleApi.list(); };
const loadUsers = async () => { loading.value = true; try { const result = await userApi.list({ ...query, keyword: query.keyword || undefined, status: query.status || undefined, roleCode: query.roleCode || undefined }); users.value = result.list; total.value = result.total; } finally { loading.value = false; } };
const reloadFirstPage = async () => { query.pageNo = 1; await loadUsers(); };
const resetQuery = async () => { query.keyword = ''; query.status = ''; query.roleCode = ''; await reloadFirstPage(); };
const assignForm = (user?: SystemUser) => { Object.assign(form, defaultForm(), user ? { username: user.username, displayName: user.displayName, mobile: user.mobile || '', email: user.email || '', status: user.status, roleIds: user.roles.map((role) => role.id) } : {}); };
const openCreate = () => { editingId.value = ''; assignForm(); formVisible.value = true; };
const openEdit = async (userId: string) => { const user = await userApi.detail(userId); editingId.value = user.id; assignForm(user); formVisible.value = true; };
const submitForm = async () => { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; saving.value = true; try { if (editingId.value) await userApi.update(editingId.value, { displayName: form.displayName, mobile: form.mobile, email: form.email, status: form.status, roleIds: form.roleIds }); else await userApi.create({ username: form.username, displayName: form.displayName, mobile: form.mobile, email: form.email, initialPassword: form.initialPassword, roleIds: form.roleIds }); ElMessage.success('用户信息已保存'); formVisible.value = false; await loadUsers(); } finally { saving.value = false; } };
const openResetPassword = (user: SystemUser) => { resetTarget.value = user; resetPassword.value = ''; resetVisible.value = true; };
const confirmResetPassword = async () => { if (!/^(?=.*[A-Za-z])(?=.*\d)\S{8,64}$/.test(resetPassword.value)) { ElMessage.warning('密码须为 8-64 位，且同时包含字母和数字'); return; } if (!resetTarget.value) return; resetting.value = true; try { await userApi.resetPassword(resetTarget.value.id, resetPassword.value); ElMessage.success('密码已重置'); resetVisible.value = false; } finally { resetting.value = false; } };
onMounted(async () => { await loadRoles(); await loadUsers(); });
</script>
