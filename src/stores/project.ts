import { defineStore } from 'pinia';
import { projectApi } from '@/api/projectApi';
import type { ProjectDetail } from '@/types/project';

export const useProjectStore = defineStore('project', {
  state: () => ({
    currentProject: null as ProjectDetail | null,
    requestVersion: 0,
    loading: false
  }),
  actions: {
    async loadProject(projectId: string, force = false) {
      if (!force && this.currentProject?.id === projectId) {
        return this.currentProject;
      }
      this.loading = true;
      const requestVersion = ++this.requestVersion;
      try {
        const project = await projectApi.detail(projectId);
        if (requestVersion !== this.requestVersion) return null;
        this.currentProject = project;
        return this.currentProject;
      } finally {
        if (requestVersion === this.requestVersion) this.loading = false;
      }
    },
    clearProject() {
      this.requestVersion += 1;
      this.currentProject = null;
      this.loading = false;
    }
  }
});
