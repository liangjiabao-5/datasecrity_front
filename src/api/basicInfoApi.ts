import { mockDb } from '@/mock/db';
import type { BasicInfoPayload, CustomReferencePayload, ReferenceItem } from '@/types/basicInfo';
import { useMock } from '@/utils/env';
import { http } from '@/utils/request';

const excelBlob = (payload: unknown) =>
  new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

const basicInfoExcelSheets = [
  {
    name: '项目基本情况',
    columns: ['项目编号', '项目名称', '评估所依据的法律法规', '评估所参考的标准规范', '评估开始日期', '评估结束日期']
  },
  {
    name: '被评估单位基本信息',
    columns: ['单位名称', '邮政编码']
  },
  {
    name: '联系人信息',
    columns: ['姓名', '所属部门', '移动电话', '职务/职称', '办公电话', '电子邮件']
  }
];

export const basicInfoApi = {
  detail(projectId: string): Promise<BasicInfoPayload> {
    if (useMock) return mockDb.getBasicInfo(projectId);
    return http.get(`/projects/${projectId}/basic-info`);
  },

  save(projectId: string, payload: BasicInfoPayload): Promise<void> {
    if (useMock) return mockDb.saveBasicInfo(projectId, payload);
    return http.put(`/projects/${projectId}/basic-info`, payload);
  },

  createCustomReference(projectId: string, payload: CustomReferencePayload): Promise<ReferenceItem> {
    if (useMock) return mockDb.createCustomReference(projectId, payload);
    return http.post(`/projects/${projectId}/basic-info/custom-references`, payload);
  },

  referenceOptions(): Promise<{ laws: ReferenceItem[]; standards: ReferenceItem[] }> {
    return mockDb.getReferenceOptions();
  },

  exportTemplate(projectId: string): Promise<Blob> {
    if (useMock) {
      return Promise.resolve(
        excelBlob({
          projectId,
          sheets: basicInfoExcelSheets
        })
      );
    }
    return http.blob(`/projects/${projectId}/basic-info/export-template`);
  },

  exportFile(projectId: string): Promise<Blob> {
    if (useMock) return mockDb.getBasicInfo(projectId).then(excelBlob);
    return http.blob(`/projects/${projectId}/basic-info/export`);
  },

  importExcel(projectId: string, file: File): Promise<BasicInfoPayload> {
    if (useMock) return mockDb.getBasicInfo(projectId);

    const formData = new FormData();
    formData.append('file', file);
    return http.post<BasicInfoPayload>(`/projects/${projectId}/basic-info/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000
    });
  }
};
