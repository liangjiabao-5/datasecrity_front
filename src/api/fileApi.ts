import { http } from '@/utils/request';
import { apiBaseUrl } from '@/utils/env';

export const fileApi = {
  upload(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return http.post('/files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  downloadUrl(fileId: string) {
    return `${apiBaseUrl.replace(/\/$/, '')}/files/${encodeURIComponent(fileId)}/download`;
  },
  download(fileId: string) {
    return http.blobFile(`/files/${encodeURIComponent(fileId)}/download`, { timeout: 60000 });
  }
};
