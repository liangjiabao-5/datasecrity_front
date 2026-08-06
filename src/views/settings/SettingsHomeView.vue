<template>
  <div>
    <div class="page-heading">
      <div>
        <h1>系统设置</h1>
        <p>维护系统账号、角色授权范围及权限字典；仅展示当前账号被授予的管理功能。</p>
      </div>
    </div>
    <div class="settings-card-grid">
      <button v-for="item in entries" :key="item.path" type="button" class="settings-entry" @click="router.push(item.path)">
        <el-icon><component :is="item.icon" /></el-icon>
        <div><strong>{{ item.title }}</strong><span>{{ item.description }}</span></div>
        <el-icon class="settings-entry-arrow"><ArrowRight /></el-icon>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ArrowRight, Key, User, UserFilled } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();
const entries = computed(() => [
  { path: '/settings/users', title: '用户管理', description: '新建、编辑、启停账号，分配角色和重置密码。', icon: User, permission: 'system:user:manage' },
  { path: '/settings/roles', title: '角色管理', description: '维护角色信息并配置可使用的系统权限。', icon: UserFilled, permission: 'system:role:manage' },
  { path: '/settings/permissions', title: '权限字典', description: '查看后端已定义的权限代码与业务说明。', icon: Key, permission: 'system:permission:read' }
].filter((item) => auth.hasPermission(item.permission)));
</script>
