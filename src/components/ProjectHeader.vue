<template>
  <div class="project-steps">
    <button
      v-for="step in projectSteps"
      :key="step.key"
      class="step-link"
      :class="{ active: step.key === currentStep }"
      type="button"
      @click="goStep(step.path)"
    >
      <el-icon><ArrowRight /></el-icon>
      {{ step.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowRight } from '@element-plus/icons-vue';
import { useProjectStore } from '@/stores/project';
import { projectSteps } from '@/utils/labels';

const props = defineProps<{
  currentStep: string;
}>();

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();

onMounted(() => {
  const projectId = String(route.params.projectId || '');
  if (projectId) {
    projectStore.loadProject(projectId);
  }
});

const goStep = (path: string) => {
  const projectId = String(route.params.projectId || projectStore.currentProject?.id || '');
  if (projectId && path !== props.currentStep) {
    router.push(`/projects/${projectId}/${path}`);
  }
};
</script>
