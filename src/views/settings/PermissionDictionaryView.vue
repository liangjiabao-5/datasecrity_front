<template>
  <div>
    <div class="page-heading"><div><h1>权限字典</h1><p>权限由后端预置并只读展示，角色配置时按此字典勾选。</p></div></div>
    <div class="filter-bar"><el-input v-model="keyword" clearable placeholder="搜索权限代码、名称或说明" style="max-width: 360px"><template #prefix><el-icon><Search /></el-icon></template></el-input></div>
    <div class="panel table-panel"><el-table v-loading="loading" :data="filteredPermissions" row-key="id"><el-table-column prop="code" label="权限代码" min-width="220" /><el-table-column prop="name" label="权限名称" min-width="180" /><el-table-column prop="module" label="模块" width="150" /><el-table-column prop="action" label="动作" width="150" /><el-table-column prop="description" label="说明" min-width="280" show-overflow-tooltip /></el-table></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { roleApi } from '@/api/systemApi';
import type { Permission } from '@/types/auth';

const permissions = ref<Permission[]>([]);
const loading = ref(false);
const keyword = ref('');
const filteredPermissions = computed(() => { const value = keyword.value.trim().toLowerCase(); if (!value) return permissions.value; return permissions.value.filter((item) => [item.code, item.name, item.module, item.action, item.description].some((field) => field?.toLowerCase().includes(value))); });
onMounted(async () => { loading.value = true; try { permissions.value = await roleApi.permissions(); } finally { loading.value = false; } });
</script>
