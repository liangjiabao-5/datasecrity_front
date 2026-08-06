<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <img src="/logo.png" alt="ENST" />
        <div>
          <div class="brand-title">ENST</div>
          <div class="brand-subtitle">数据安全风险评估</div>
        </div>
      </div>

      <nav class="side-menu">
        <el-menu :default-active="activeMenu" router>
          <el-menu-item index="/projects">
            <el-icon><FolderOpened /></el-icon>
            <span>项目管理</span>
          </el-menu-item>
          <el-menu-item v-if="auth.hasPermission('knowledge:manage')" index="/knowledge">
            <el-icon><Collection /></el-icon>
            <span>知识库管理</span>
          </el-menu-item>
          <el-menu-item v-if="canOpenSettings" index="/settings">
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>
      </nav>
      <div class="sidebar-user">
        <el-dropdown trigger="click" @command="handleUserCommand">
          <button class="sidebar-user-button" type="button">
            <span class="user-avatar">{{ auth.userName.slice(0, 1) }}</span>
            <span class="sidebar-user-info">
              <strong>{{ auth.userName }}</strong>
              <small>{{ auth.roleName }}</small>
            </span>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="password"><el-icon><Lock /></el-icon>修改密码</el-dropdown-item>
              <el-dropdown-item divided command="logout"><el-icon><SwitchButton /></el-icon>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </aside>

    <main class="main-panel">
      <header class="topbar">
        <div class="topbar-title">
          <strong>{{ pageTitle }}</strong>
          <span>{{ projectSubtitle }}</span>
        </div>
      </header>

      <section class="content-body">
        <RouterView />
      </section>
    </main>

    <el-dialog v-model="passwordVisible" title="修改密码" width="440px" destroy-on-close>
      <el-alert title="新密码须为 8-64 位，且同时包含字母和数字，不能包含空格。" type="info" :closable="false" style="margin-bottom: 16px" />
      <el-form label-width="100px" @submit.prevent="changePassword">
        <el-form-item label="当前密码" required><el-input v-model="passwordForm.oldPassword" type="password" show-password autocomplete="current-password" /></el-form-item>
        <el-form-item label="新密码" required><el-input v-model="passwordForm.newPassword" type="password" show-password autocomplete="new-password" /></el-form-item>
        <el-form-item label="确认新密码" required><el-input v-model="passwordForm.confirmPassword" type="password" show-password autocomplete="new-password" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordVisible = false">取消</el-button>
        <el-button type="primary" :loading="passwordSaving" @click="changePassword">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { authApi } from '@/api/authApi';
import {
  Collection,
  FolderOpened,
  Lock,
  Setting,
  SwitchButton
} from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { useProjectStore } from '@/stores/project';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const projectStore = useProjectStore();
const canOpenSettings = computed(() => auth.hasAnyPermission(['system:user:manage', 'system:role:manage', 'system:permission:read']));
const passwordVisible = ref(false);
const passwordSaving = ref(false);
const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' });

const pageTitle = computed(() => String(route.meta.title || '数据安全风险评估'));
const projectSubtitle = computed(() => {
  const projectName = projectStore.currentProject?.projectName;
  return projectName ? `当前项目：${projectName}` : '按项目流程完成调研、测评、汇总和报告生成';
});

const activeMenu = computed(() => {
  if (route.path.startsWith('/knowledge')) return '/knowledge';
  if (route.path.startsWith('/settings')) return '/settings';
  return '/projects';
});

const handleUserCommand = async (command: string) => {
  if (command === 'password') {
    passwordForm.oldPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
    passwordVisible.value = true;
    return;
  }
  if (command === 'logout') {
    await auth.logout();
    ElMessage.success('已退出登录');
    await router.replace('/login');
  }
};

const changePassword = async () => {
  const validPassword = /^(?=.*[A-Za-z])(?=.*\d)\S{8,64}$/;
  if (!validPassword.test(passwordForm.newPassword)) {
    ElMessage.warning('新密码须为 8-64 位，且同时包含字母和数字，不能包含空格');
    return;
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning('两次输入的新密码不一致');
    return;
  }

  passwordSaving.value = true;
  try {
    const result = await authApi.changePassword({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword });
    if (result?.accessToken) {
      if (result.user) auth.applySession(result as import('@/types/auth').AuthSession);
      else auth.updateAccessToken(result.accessToken);
    }
    passwordVisible.value = false;
    ElMessage.success('密码修改成功');
  } finally {
    passwordSaving.value = false;
  }
};
</script>
