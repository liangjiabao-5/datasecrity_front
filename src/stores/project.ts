import { defineStore } from 'pinia';
import { projectApi } from '@/api/projectApi';
import type { ProjectDetail } from '@/types/project';

export const useProjectStore = defineStore('project', {
  state: () => ({
    currentProject: null as ProjectDetail | null,
    loading: false
  }),
  actions: {
    async loadProject(projectId: string, force = false) {
      if (!force && this.currentProject?.id === projectId) {
        return this.currentProject;
      }
      this.loading = true;
      try {
        this.currentProject = await projectApi.detail(projectId);
        return this.currentProject;
      } finally {
        this.loading = false;
      }
    },
    clearProject() {
      this.currentProject = null;
    }
  }
});
