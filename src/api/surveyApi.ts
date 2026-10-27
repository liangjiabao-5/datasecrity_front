import type { ApiResponse } from '@/types/api';
import { mockEnvelope } from '@/utils/apiFeedback';
import { workflowDb } from '@/mock/workflowDb';
import type { PageQuery, PageResult } from '@/types/api';
import type {
  BusinessSystemDiagramUploadResult,
  BusinessSystem,
  DataAsset,
  DataProcessorBasicSurvey,
  ProcessingActivity,
  ProcessingActivitySurvey,
  SecurityProtection,
  SpecialDataRecord,
  SpecialDataType,
  SurveyWordImportResult
} from '@/types/survey';
import { useMock } from '@/utils/env';
import { http } from '@/utils/request';

type SurveyPageQuery = Pick<PageQuery, 'pageNo' | 'pageSize'>;
type SurveyListPayload<T> = Partial<PageResult<T>> & {
  content?: T[];
  data?: SurveyListResponse<T>;
  records?: T[];
  rows?: T[];
};
type SurveyListResponse<T> = SurveyListPayload<T> | T[] | null | undefined;

const normalizeList = <T>(payload: SurveyListResponse<T>): T[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  const list = payload.list || payload.records || payload.rows || payload.content;
  return Array.isArray(list) ? list : normalizeList(payload.data);
};

const resolveSurveyPageQuery = (query?: Partial<SurveyPageQuery>): SurveyPageQuery => ({
  pageNo: query?.pageNo || 1,
  pageSize: query?.pageSize || 10
});

const pageFromList = <T>(list: T[], query: SurveyPageQuery): PageResult<T> => {
  const start = (query.pageNo - 1) * query.pageSize;
  return {
    list: list.slice(start, start + query.pageSize),
    pageNo: query.pageNo,
    pageSize: query.pageSize,
    total: list.length
  };
};

const normalizePage = <T>(payload: SurveyListResponse<T>, query?: Partial<SurveyPageQuery>): PageResult<T> => {
  const resolvedQuery = resolveSurveyPageQuery(query);
  if (Array.isArray(payload)) return pageFromList(payload, resolvedQuery);
  if (!payload || typeof payload !== 'object') {
    return { list: [], pageNo: resolvedQuery.pageNo, pageSize: resolvedQuery.pageSize, total: 0 };
  }

  const list = payload.list || payload.records || payload.rows || payload.content;
  if (Array.isArray(list)) {
    const pageNo = payload.pageNo || resolvedQuery.pageNo;
    const pageSize = payload.pageSize || resolvedQuery.pageSize;
    const total = typeof payload.total === 'number' ? payload.total : list.length;
    return {
      list: typeof payload.total === 'number' ? list : pageFromList(list, { pageNo, pageSize }).list,
      pageNo,
      pageSize,
      total
    };
  }

  return normalizePage(payload.data, resolvedQuery);
};

const emptyProcessingSurvey = (): ProcessingActivitySurvey => ({
  involvedActivities: [],
  collectionChannels: '',
  collectionMethod: '',
  collectionDataScope: '',
  collectionPurpose: '',
  collectionFrequency: '',
  collectionExternalSources: '',
  collectionContracts: '',
  collectionRelatedSystems: '',
  collectionPublicDeviceUsage: '',
  storageDataScope: '',
  storageMethod: '',
  dataCenter: '',
  storageSystem: '',
  externalStorageProvider: '',
  storageLocation: '',
  storageDuration: '',
  backupRedundancyStrategy: '',
  transferDataScope: '',
  transferDataLinkInventory: '',
  onlineChannel: '',
  offlineTransfer: '',
  transferProtocol: '',
  dataInterface: '',
  useDataScope: '',
  usePurpose: '',
  useMethod: '',
  useScope: '',
  useScenario: '',
  algorithmRules: '',
  processingDetails: '',
  algorithmRecommendationService: '',
  entrustedOrJointProcessing: '',
  provideDataScope: '',
  providePurpose: '',
  provideMethod: '',
  provideScope: '',
  dataRecipients: '',
  provideContracts: '',
  providedPersonalInfoAndImportantData: '',
  publicDataScope: '',
  publicPurpose: '',
  publicMethod: '',
  publicScope: '',
  publicAudienceSize: '',
  publicDataTypes: '',
  publicDataScale: '',
  deletionDataScope: '',
  deletionScenarios: '',
  deletionMethod: '',
  dataArchive: '',
  mediaDestruction: '',
  crossBorderDataScope: '',
  crossBorderPresence: '',
  crossBorderDescription: ''
});

const emptyDataProcessorBasic = (): DataProcessorBasicSurvey => ({
  unitName: '',
  unifiedSocialCreditCode: '',
  officeAddress: '',
  legalRepresentative: '',
  staffSize: '',
  businessScope: '',
  dataSecurityOfficer: '',
  contactInfo: '',
  unitNature: '',
  specificProcessorType: '',
  powerIndustryCategory: '',
  businessOperationArea: '',
  dataProcessingLocation: '',
  mainBusinessScope: '',
  businessScale: '',
  administrativeLicense: ''
});

const wordBlob = (payload: unknown) =>
  new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });

export const surveyApi = {
  exportTemplate(projectId: string): Promise<{ blob: Blob; fileName?: string }> {
    if (useMock) {
      return Promise.resolve({
        blob: wordBlob({ projectId, template: '附录A（资料性）调研表格.docx' }),
        fileName: `信息调研导入模板-${projectId}.docx`
      });
    }
    return http.blobFile(`/projects/${projectId}/survey/export-template`, { timeout: 60000 });
  },
  exportWord(projectId: string): Promise<{ blob: Blob; fileName?: string }> {
    if (useMock) {
      return Promise.resolve({
        blob: wordBlob({ projectId, export: '信息调研Word导出' }),
        fileName: `信息调研-${projectId}.docx`
      });
    }
    return http.blobFile(`/projects/${projectId}/survey/export`, { timeout: 60000 });
  },
  importWord(projectId: string, file: File): Promise<ApiResponse<SurveyWordImportResult>> {
    if (useMock) {
      return mockEnvelope(Promise.resolve({
        counts: {
          dataAssets: 0,
          personalInfo: 0,
          importantData: 0,
          coreData: 0
        }
      }));
    }

    const formData = new FormData();
    formData.append('file', file);
    return http.postEnvelope<SurveyWordImportResult>(`/projects/${projectId}/survey/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000
    });
  },
  getDataProcessorBasic(projectId: string): Promise<DataProcessorBasicSurvey> {
    if (useMock) return workflowDb.getDataProcessorBasic(projectId);
    return http
      .get<Partial<DataProcessorBasicSurvey>>(`/projects/${projectId}/survey/data-processor-basic`)
      .then((payload) => ({ ...emptyDataProcessorBasic(), ...payload }));
  },
  saveDataProcessorBasic(projectId: string, payload: DataProcessorBasicSurvey): Promise<ApiResponse<void>> {
    if (useMock) return mockEnvelope(workflowDb.saveDataProcessorBasic(projectId, payload));
    return http.putEnvelope(`/projects/${projectId}/survey/data-processor-basic`, payload);
  },
  listBusinessSystems(projectId: string): Promise<BusinessSystem[]> {
    if (useMock) return workflowDb.listBusinessSystems(projectId);
    return http.get<SurveyListResponse<BusinessSystem>>(`/projects/${projectId}/survey/business-systems`).then(normalizeList);
  },
  saveBusinessSystem(projectId: string, payload: Omit<BusinessSystem, 'id'>, id?: string): Promise<ApiResponse<BusinessSystem>> {
    if (useMock) return mockEnvelope(workflowDb.saveBusinessSystem(projectId, payload, id));
    return id
      ? http.putEnvelope(`/projects/${projectId}/survey/business-systems/${id}`, payload)
      : http.postEnvelope(`/projects/${projectId}/survey/business-systems`, payload);
  },
  uploadTopologyDiagram(projectId: string, businessSystemId: string, file: File): Promise<ApiResponse<BusinessSystemDiagramUploadResult>> {
    if (useMock) return mockEnvelope(Promise.resolve(workflowDb.uploadBusinessSystemDiagram(projectId, businessSystemId, 'topology', file)));
    const formData = new FormData();
    formData.append('file', file);
    return http.postEnvelope(`/projects/${projectId}/survey/business-systems/${businessSystemId}/topology-diagram`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000
    });
  },
  uploadDataFlowDiagram(projectId: string, businessSystemId: string, file: File): Promise<ApiResponse<BusinessSystemDiagramUploadResult>> {
    if (useMock) return mockEnvelope(Promise.resolve(workflowDb.uploadBusinessSystemDiagram(projectId, businessSystemId, 'dataFlow', file)));
    const formData = new FormData();
    formData.append('file', file);
    return http.postEnvelope(`/projects/${projectId}/survey/business-systems/${businessSystemId}/data-flow-diagram`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000
    });
  },
  deleteBusinessSystem(projectId: string, id: string): Promise<void> {
    if (useMock) return workflowDb.deleteBusinessSystem(projectId, id);
    return http.delete(`/projects/${projectId}/survey/business-systems/${id}`);
  },
  listDataAssets(projectId: string, query?: Partial<SurveyPageQuery>): Promise<PageResult<DataAsset>> {
    const params = resolveSurveyPageQuery(query);
    if (useMock) return workflowDb.listDataAssets(projectId, params);
    return http
      .get<SurveyListResponse<DataAsset>>(`/projects/${projectId}/survey/data-assets`, { params })
      .then((payload) => normalizePage(payload, params));
  },
  saveDataAsset(projectId: string, payload: Omit<DataAsset, 'id'>, id?: string): Promise<ApiResponse<DataAsset>> {
    if (useMock) return mockEnvelope(workflowDb.saveDataAsset(projectId, payload, id));
    return id
      ? http.putEnvelope(`/projects/${projectId}/survey/data-assets/${id}`, payload, { errorMode: 'manual' })
      : http.postEnvelope(`/projects/${projectId}/survey/data-assets`, payload, { errorMode: 'manual' });
  },
  deleteDataAsset(projectId: string, id: string): Promise<ApiResponse<void>> {
    if (useMock) return mockEnvelope(workflowDb.deleteDataAsset(projectId, id));
    return http.deleteEnvelope(`/projects/${projectId}/survey/data-assets/${id}`);
  },
  listSpecialData(projectId: string, type: SpecialDataType, query?: Partial<SurveyPageQuery>): Promise<PageResult<SpecialDataRecord>> {
    const params = resolveSurveyPageQuery(query);
    if (useMock) return workflowDb.listSpecialData(projectId, type, params);
    return http
      .get<SurveyListResponse<SpecialDataRecord>>(`/projects/${projectId}/survey/${type}`, { params })
      .then((payload) => normalizePage(payload, params));
  },
  saveSpecialData(projectId: string, type: SpecialDataType, payload: Omit<SpecialDataRecord, 'id'>, id?: string): Promise<ApiResponse<SpecialDataRecord>> {
    if (useMock) return mockEnvelope(workflowDb.saveSpecialData(projectId, type, payload, id));
    return id
      ? http.putEnvelope(`/projects/${projectId}/survey/${type}/${id}`, payload, { errorMode: 'manual' })
      : http.postEnvelope(`/projects/${projectId}/survey/${type}`, payload, { errorMode: 'manual' });
  },
  deleteSpecialData(projectId: string, type: SpecialDataType, id: string): Promise<ApiResponse<void>> {
    if (useMock) return mockEnvelope(workflowDb.deleteSpecialData(projectId, type, id));
    return http.deleteEnvelope(`/projects/${projectId}/survey/${type}/${id}`);
  },
  listProcessingActivities(projectId: string): Promise<ProcessingActivity[]> {
    if (useMock) return workflowDb.listProcessingActivities(projectId);
    return http.get<SurveyListResponse<ProcessingActivity>>(`/projects/${projectId}/survey/processing-activities`).then(normalizeList);
  },
  saveProcessingActivity(projectId: string, payload: Omit<ProcessingActivity, 'id'>, id?: string): Promise<ProcessingActivity> {
    if (useMock) return workflowDb.saveProcessingActivity(projectId, payload, id);
    return id
      ? http.put(`/projects/${projectId}/survey/processing-activities/${id}`, payload)
      : http.post(`/projects/${projectId}/survey/processing-activities`, payload);
  },
  deleteProcessingActivity(projectId: string, id: string): Promise<void> {
    if (useMock) return workflowDb.deleteProcessingActivity(projectId, id);
    return http.delete(`/projects/${projectId}/survey/processing-activities/${id}`);
  },
  getProcessingActivitySurvey(projectId: string): Promise<ProcessingActivitySurvey> {
    if (useMock) return workflowDb.getProcessingActivitySurvey(projectId);
    return http.get<Partial<ProcessingActivitySurvey>>(`/projects/${projectId}/survey/processing-activity-survey`)
      .then((payload) => ({ ...emptyProcessingSurvey(), ...payload }));
  },
  saveProcessingActivitySurvey(projectId: string, payload: ProcessingActivitySurvey): Promise<ApiResponse<void>> {
    if (useMock) return mockEnvelope(workflowDb.saveProcessingActivitySurvey(projectId, payload));
    return http.putEnvelope(`/projects/${projectId}/survey/processing-activity-survey`, payload);
  },
  getSecurityProtection(projectId: string): Promise<SecurityProtection> {
    if (useMock) return workflowDb.getSecurityProtection(projectId);
    return http.get(`/projects/${projectId}/survey/security-protection`);
  },
  saveSecurityProtection(projectId: string, payload: SecurityProtection): Promise<ApiResponse<void>> {
    if (useMock) return mockEnvelope(workflowDb.saveSecurityProtection(projectId, payload));
    return http.putEnvelope(`/projects/${projectId}/survey/security-protection`, payload);
  }
};
