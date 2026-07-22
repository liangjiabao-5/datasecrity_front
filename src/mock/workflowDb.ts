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
  SpecialDataType
} from '@/types/survey';
import type {
  BatchEvaluationResultPayload,
  EvaluationCatalogNode,
  EvaluationItem,
  EvaluationItemQuery,
  EvaluationRecordPayload,
  ScoreResult
} from '@/types/evaluation';
import type { RiskMatrix, RiskMatrixJson, ScoreModel } from '@/types/knowledge';
import type {
  HarmAnalysisApplyPayload,
  HarmAnalysisBatchPayload,
  HarmAnalysisSuggestion,
  HarmAnalysisTrace,
  RiskItem,
  RiskItemSavePayload,
  RiskSummaryMergeState,
  RiskSummaryMergeUpdateResult,
  RiskSource,
  RiskSourceSavePayload,
  RiskSuggestion,
  RiskSuggestionSavePayload
} from '@/types/risk';
import { processingActivityLabels } from '@/utils/labels';
import { calculateRiskLevelByMatrix } from '@/utils/riskMatrix';
import { mockDb } from './db';
import { knowledgeDb } from './knowledgeDb';

const delay = <T>(data: T, ms = 180): Promise<T> =>
  new Promise((resolve) =>
    window.setTimeout(() => {
      if (data === undefined) {
        resolve(data);
        return;
      }
      resolve(JSON.parse(JSON.stringify(data)) as T);
    }, ms)
  );

const nextId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const ensure = <T>(store: Record<string, T[]>, projectId: string, seed: T[]) => {
  if (!store[projectId]) store[projectId] = seed;
  return store[projectId];
};

const upsert = <T extends { id: string }>(list: T[], payload: Omit<T, 'id'>, id?: string): T => {
  const saved = { id: id || nextId('row'), ...payload } as T;
  const index = list.findIndex((item) => item.id === saved.id);
  if (index >= 0) list[index] = saved;
  else list.push(saved);
  return saved;
};

const remove = <T extends { id: string }>(list: T[], id: string) => {
  const index = list.findIndex((item) => item.id === id);
  if (index >= 0) list.splice(index, 1);
};

const defaultResultScores: ScoreModel['resultScores'] = {
  COMPLIANT: 1,
  PARTIAL: 0.5,
  NON_COMPLIANT: 0,
  NOT_APPLICABLE: null
};

const defaultPossibilityRanges: ScoreModel['possibilityRanges'] = [
  { level: 'HIGH', min: 0, max: 30, includeMin: true, includeMax: false },
  { level: 'MEDIUM', min: 30, max: 75, includeMin: true, includeMax: false },
  { level: 'LOW', min: 75, max: 100, includeMin: true, includeMax: false }
];

const possibilityLevelLabels: Record<string, string> = {
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低'
};

type RiskSummaryQuery = Pick<PageQuery, 'pageNo' | 'pageSize'>;

const resolveRiskSummaryQuery = (query?: Partial<RiskSummaryQuery>): RiskSummaryQuery => ({
  pageNo: query?.pageNo || 1,
  pageSize: query?.pageSize || 10
});

const pageRiskSummary = <T>(list: T[], query?: Partial<RiskSummaryQuery>): PageResult<T> => {
  const pageQuery = resolveRiskSummaryQuery(query);
  const start = (pageQuery.pageNo - 1) * pageQuery.pageSize;
  return {
    list: list.slice(start, start + pageQuery.pageSize),
    pageNo: pageQuery.pageNo,
    pageSize: pageQuery.pageSize,
    total: list.length
  };
};

const getPossibilityLevelByScore = (score: number, ranges: ScoreModel['possibilityRanges']) => {
  const sortedRanges = [...ranges].sort((left, right) => left.min - right.min);
  const matched = sortedRanges.find((range) => score >= range.min && score < range.max);
  return matched?.level || '-';
};

const getPossibilityLevelName = (level: string) => (level === '-' ? '待评估' : possibilityLevelLabels[level] || level);

const parseScoreModelVersion = (version?: string) => {
  const matched = version?.match(/\d+/);
  return matched ? Number(matched[0]) : 1;
};

const getProjectScoreModel = async (projectId: string): Promise<ScoreModel | undefined> => {
  const project = await mockDb.getProject(projectId);
  const page = await knowledgeDb.list('score', { pageNo: 1, pageSize: 999 });
  return (page.list as ScoreModel[]).find((item) => item.id === project.scoreModelId || item.modelId === project.scoreModelId);
};

const getRiskMatrixById = async (matrixId?: string): Promise<RiskMatrixJson> => {
  if (!matrixId) return {};
  const page = await knowledgeDb.list('matrix', { pageNo: 1, pageSize: 999 });
  const matrix = (page.list as RiskMatrix[]).find((item) => item.id === matrixId || item.matrixId === matrixId);
  return matrix?.matrixJson || {};
};

const getProjectRiskMatrix = async (projectId: string): Promise<RiskMatrixJson> => {
  const project = await mockDb.getProject(projectId);
  return getRiskMatrixById(project.riskMatrixId);
};

const businessSystems: Record<string, BusinessSystem[]> = {
  p001: [
    {
      id: 'sys-001',
      systemName: 'OA办公系统',
      businessFunction: '办公流程管理',
      serviceObject: '内部员工',
      userScale: '500人',
      coverageArea: '全国',
      classifiedProtectionLevel: 'LEVEL_3',
      relatedDepartments: '办公室、信息中心',
      dataScopes: ['一般数据', '个人信息'],
      topologyFileId: 'file-topology-001',
      businessFlowFileId: 'file-flow-001'
    }
  ]
};

const dataProcessorBasics: Record<string, DataProcessorBasicSurvey> = {
  p001: {
    unitName: 'XX银行股份有限公司',
    unifiedSocialCreditCode: '91110000100000000X',
    officeAddress: '北京市海淀区示例路 1 号',
    legalRepresentative: '李四，董事长',
    staffSize: '约 3000 人',
    businessScope: '金融服务、客户管理、数据分析',
    dataSecurityOfficer: '张三，数据安全负责人',
    contactInfo: '010-88888888',
    unitNature: '企业',
    specificProcessorType: '大型网络平台运营者',
    powerIndustryCategory: '',
    businessOperationArea: '全国',
    dataProcessingLocation: '中国境内',
    mainBusinessScope: '面向客户提供线上金融服务，处理客户身份、交易、账户等数据。',
    businessScale: '服务客户约 500 万人',
    administrativeLicense: '已取得金融业务相关行政许可'
  }
};

const dataAssets: Record<string, DataAsset[]> = {
  p001: [
    {
      id: 'asset-001',
      businessSystemId: 'sys-001',
      dataName: '用户敏感数据',
      dataForm: '结构化数据',
      dataScope: '生产数据',
      dataScale: '100万条',
      dataSource: '业务采集',
      storageLocation: '本地服务器',
      flowDescription: '从 OA 系统流转至档案系统',
      classified: true,
      dataCategory: '个人信息-身份信息',
      dataLevel: '重要数据',
      personalInfo: true
    }
  ]
};

const specialData: Record<SpecialDataType, Record<string, SpecialDataRecord[]>> = {
  'personal-info': {
    p001: [
      {
        id: 'pi-001',
        dataName: '用户身份数据',
        dataCategory: '个人身份信息',
        scale: '约 50 万人',
        sensitivity: '敏感个人信息',
        dataSource: '业务采集',
        businessFlow: '账号注册、身份核验、流程审批',
        description: '包含姓名、手机号、证件号码等字段'
      }
    ]
  },
  'important-data': {
    p001: [
      {
        id: 'imp-001',
        dataName: '核心业务运行数据',
        dataCategory: '业务运行数据',
        scale: '约 20TB',
        dataSource: '业务系统生成',
        businessFlow: '生产系统至数据仓库',
        processingActivities: ['STORE', 'TRANSFER'],
        description: '支撑核心业务连续性的运行数据'
      }
    ]
  },
  'core-data': {
    p001: []
  }
};

const processingActivities: Record<string, ProcessingActivity[]> = {
  p001: [
    {
      id: 'act-001',
      activityType: 'COLLECT',
      scenario: '线上采集',
      method: '接口采集',
      scale: '100GB',
      involvesPersonalInfo: true,
      protectionMeasures: ['传输通道加密', '身份验证与授权'],
      description: '收集业务办理所需数据'
    }
  ]
};

const processingActivitySurveys: Record<string, ProcessingActivitySurvey> = {
  p001: {
    involvedActivities: ['COLLECT', 'TRANSFER', 'STORE'],
    collectionChannels: '线上业务系统、柜面渠道',
    collectionMethod: 'API 接口调用、用户提交',
    collectionDataScope: '个人信息、交易数据、运营数据',
    collectionPurpose: '完成客户身份核验和业务办理',
    collectionFrequency: '实时收集',
    collectionExternalSources: '合作方身份核验平台',
    collectionContracts: '已签署数据合作协议和保密协议',
    collectionRelatedSystems: 'OA 办公系统、客户管理系统',
    collectionPublicDeviceUsage: '不涉及公共场所图像采集设备',
    storageMethod: '集中式数据库存储',
    dataCenter: '北京主数据中心',
    storageSystem: 'MySQL、对象存储',
    externalStorageProvider: '',
    storageLocation: '本地服务器',
    storageDuration: '按业务和监管要求保存',
    backupRedundancyStrategy: '全量备份、增量备份、异地冗余',
    onlineChannel: 'HTTPS、VPN 专线',
    offlineTransfer: '不涉及',
    transferProtocol: 'HTTPS、SFTP、TLS',
    dataInterface: 'RESTful API，OAuth 认证和访问控制',
    usePurpose: '支撑内部办公和流程流转',
    useMethod: '查询、统计分析、批量导出',
    useScope: '办公室、信息中心授权人员',
    useScenario: '办公流程审批',
    algorithmRules: '不涉及算法推荐',
    processingDetails: '统计分析、数据清洗和报表生成',
    algorithmRecommendationService: '不涉及',
    entrustedOrJointProcessing: '不涉及核心数据、重要数据或个人信息委托处理',
    providePurpose: '',
    provideMethod: '',
    provideScope: '',
    dataRecipients: '',
    provideContracts: '',
    providedPersonalInfoAndImportantData: '',
    publicPurpose: '',
    publicMethod: '',
    publicScope: '',
    publicAudienceSize: '',
    publicDataTypes: '',
    publicDataScale: '',
    deletionScenarios: '达到保存期限或用户请求删除',
    deletionMethod: '逻辑删除、物理删除和安全擦除',
    dataArchive: '按档案要求归档审计材料',
    mediaDestruction: '磁盘消磁或物理粉碎',
    crossBorderPresence: '不涉及个人信息或重要数据出境',
    crossBorderDescription: ''
  }
};

const securityProtections: Record<string, SecurityProtection> = {
  p001: {
    complianceAssessmentStatus: '已完成三级等保备案和商用密码应用安全性评估，历史问题已纳入整改台账。',
    dataSecurityManagement: '设立数据安全工作小组，制定数据分类分级、权限管理和应急响应制度。',
    networkSecurityDevicesAndPolicies: '部署防火墙、WAF、入侵检测和数据库审计，策略每季度复核。',
    identityAuthenticationAndAccessControl: '统一身份认证、MFA、按角色授权并定期复核权限。',
    vulnerabilityManagement: '每月漏洞扫描，高危漏洞 7 日内修复。',
    remoteManagementSoftware: '远程管理通过 VPN 和堡垒机审批。',
    accountPasswordManagement: '账号实名制管理，口令长度和复杂度满足制度要求。',
    securityTechnologyApplication: '传输加密、存储加密、脱敏和去标识化按场景应用。',
    isPowerMonitoringSystem: 'NO',
    securityIncidentsAndThreats: '近 3 年未发生重大网络和数据安全事件。',
    detectedThreats: '日志审计发现少量弱口令尝试，已处置。',
    publicThreatAlerts: '关注金融行业公开威胁预警并纳入日常监测。',
    otherSecurityThreats: '需持续关注供应链导致的数据泄露风险。'
  }
};

const catalog: EvaluationCatalogNode[] = [
  {
    id: 'mgmt',
    label: '数据安全管理',
    children: [
      { id: 'mgmt-policy', label: '制度与策略' },
      { id: 'mgmt-org', label: '组织与人员' }
    ]
  },
  {
    id: 'activity',
    label: '数据处理活动',
    children: [
      { id: 'activity-collect', label: '数据收集' },
      { id: 'activity-store', label: '数据存储' },
      { id: 'activity-transfer', label: '数据传输' }
    ]
  }
];

const evaluationItems: Record<string, EvaluationItem[]> = {
  p001: [
    {
      id: 'item-001',
      code: 'DS-01',
      itemCode: 'DS-01',
      assessmentItemId: 'AQGL001',
      categoryId: 'mgmt-policy',
      sheet_name: '数据安全管理',
      sheetName: '数据安全管理',
      category: '数据安全制度体系建设情况',
      subcategory: '制度与策略',
      categoryName: '制度与策略',
      checkPoint: '数据安全总体策略',
      checkContent: '是否制定并发布数据安全总体策略、方针、目标和原则。',
      evaluationResult: 'NON_COMPLIANT',
      evaluationRecord: '未见正式发布的数据安全总体策略。'
    },
    {
      id: 'item-002',
      code: 'DS-02',
      itemCode: 'DS-02',
      assessmentItemId: 'SJCL001',
      categoryId: 'activity-collect',
      sheet_name: '数据处理活动',
      sheetName: '数据处理活动',
      category: '数据收集',
      subcategory: '收集规则',
      categoryName: '数据收集',
      checkPoint: '收集最小必要',
      checkContent: '是否按照业务目的收集最小必要数据。',
      evaluationResult: 'PARTIAL',
      evaluationRecord: '部分表单字段未说明收集目的。'
    },
    {
      id: 'item-003',
      code: 'DS-03',
      itemCode: 'DS-03',
      assessmentItemId: 'AQJS077',
      categoryId: 'activity-store',
      sheet_name: '数据处理活动',
      sheetName: '数据处理活动',
      category: '数据存储',
      subcategory: '存储安全',
      categoryName: '数据存储',
      checkPoint: '存储访问控制',
      checkContent: '是否对重要数据存储实施访问控制和审计。',
      evaluationResult: 'COMPLIANT',
      evaluationRecord: '已部署数据库审计并按角色授权。'
    }
  ]
};

type RiskRecord = RiskSource & RiskItem & RiskSuggestion;
type RiskSourceTemplate = {
  sheetName: string;
  category: string;
  subcategory: string;
  checkPoint: string;
  assessmentSubcategory: string;
  riskDescription: string;
  remediationSuggestion: string;
  riskSourceDescription: string;
  riskSourceType: string;
  riskTypes: string[];
};

let riskRecords: Record<string, RiskRecord[]> = {};
let riskSummaryMergeStates: Record<string, boolean> = {};

const riskSourceTemplates: RiskSourceTemplate[] = [
  {
    sheetName: '数据安全管理',
    category: '数据安全制度体系建设情况',
    subcategory: '制度与策略',
    checkPoint: '数据安全总体策略',
    assessmentSubcategory: '数据安全制度体系',
    riskDescription: '数据安全总体策略缺失或发布不充分，可能导致数据安全管理目标、职责和控制要求不清晰。',
    remediationSuggestion: '制定并发布数据安全总体策略，明确方针、目标、原则和管理责任，并定期评审更新。',
    riskSourceDescription: '未形成正式发布的数据安全总体策略或配套管理要求。',
    riskSourceType: '数据安全制度流程存在缺陷',
    riskTypes: ['DATA_LEAKAGE', 'DATA_ABUSE']
  },
  {
    sheetName: '数据处理活动',
    category: '数据收集',
    subcategory: '收集规则',
    checkPoint: '收集最小必要',
    assessmentSubcategory: '数据收集规则',
    riskDescription: '数据收集未完全满足最小必要原则，可能造成超范围收集和合规风险。',
    remediationSuggestion: '梳理各业务场景的数据收集目的和字段必要性，清理非必要字段并补充告知说明。',
    riskSourceDescription: '部分收集场景未说明字段必要性或收集目的。',
    riskSourceType: '数据处理活动规则存在缺陷',
    riskTypes: ['OVER_SCOPE_PROCESSING']
  }
];

const matchRiskSourceTemplate = (item: EvaluationItem) =>
  riskSourceTemplates.find(
    (template) =>
      template.sheetName === (item.sheetName || item.sheet_name || '') &&
      template.category === (item.category || item.categoryName || '') &&
      template.subcategory === (item.subcategory || item.subcategoryName || '') &&
      template.checkPoint === item.checkPoint
  );

const inferRelatedActivities = (item: EvaluationItem): string[] => {
  const text = [item.sheetName, item.sheet_name, item.category, item.subcategory, item.checkPoint].join(' ');
  const activities: string[] = [];
  if (text.includes('收集')) activities.push('COLLECT');
  if (text.includes('传输')) activities.push('TRANSFER');
  if (text.includes('存储')) activities.push('STORE');
  if (text.includes('使用') || text.includes('加工')) activities.push('USE_PROCESS');
  if (text.includes('提供')) activities.push('PROVIDE');
  if (text.includes('公开')) activities.push('PUBLIC');
  if (text.includes('删除') || text.includes('销毁')) activities.push('DELETE');
  return activities.length ? activities : ['STORE'];
};

const defaultRelatedActivityOptions = ['收集', '传输', '存储', '使用和加工', '提供', '公开', '删除'];

const relatedDataOptionSeeds = ['个人信息-联系方式/L2', '交易数据/L3'];

const normalizeRelatedDataPayload = (value: unknown) => {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean).join('、');
  return value;
};

const normalizeRiskSourcePayload = (payload: RiskSourceSavePayload): Partial<Omit<RiskSource, 'id'>> => {
  const { relatedData, ...restPayload } = payload;
  const nextPayload: Partial<Omit<RiskSource, 'id'>> = { ...restPayload };
  if ('relatedData' in payload) {
    nextPayload.relatedData = normalizeRelatedDataPayload(relatedData) as string;
  }
  return nextPayload;
};

const normalizeMergeText = (value?: string | null) => String(value || '').trim();
const normalizeMergeArray = (value?: string[]) => (value || []).map(normalizeMergeText).filter(Boolean).sort();
const joinUnique = (values: Array<string | null | undefined>, separator = '、') =>
  Array.from(new Set(values.map(normalizeMergeText).filter(Boolean))).join(separator);
const joinUniqueLines = (values: Array<string | null | undefined>) => joinUnique(values, '\n');

const buildRiskMergeKey = (record: RiskRecord) =>
  JSON.stringify({
    assessmentCategory: normalizeMergeText(record.assessmentCategory),
    assessmentSubcategory: normalizeMergeText(record.assessmentSubcategory),
    riskTypes: normalizeMergeArray(record.riskTypes),
    riskSourceType: normalizeMergeText(record.riskSourceType),
    relatedActivities: normalizeMergeArray(record.relatedActivities),
    relatedData: normalizeMergeText(record.relatedData)
  });

type MergeConflictFieldCode = 'harmLevel' | 'possibilityLevel' | 'riskLevel' | 'remediationSuggestion';

const mergeConflictFieldLabels: Record<MergeConflictFieldCode, { tab: string; field: string }> = {
  harmLevel: { tab: '数据安全风险清单', field: '危害程度' },
  possibilityLevel: { tab: '数据安全风险清单', field: '发生可能性' },
  riskLevel: { tab: '数据安全风险清单', field: '风险等级' },
  remediationSuggestion: { tab: '数据安全风险处置建议', field: '整改建议' }
};

const validateRiskMergeRequiredFields = (records: RiskRecord[]): number[] =>
  records
    .map((record, index) => {
      const missingRelatedData = !normalizeMergeText(record.relatedData) || normalizeMergeText(record.relatedData) === '-';
      const missingRelatedActivities = !record.relatedActivities?.length;
      return missingRelatedData || missingRelatedActivities ? index + 1 : 0;
    })
    .filter(Boolean);

const buildRiskMergeRequiredFieldsError = (errors: number[]) => ({
  code: 'RISK_MERGE_REQUIRED_FIELDS_MISSING',
  message: `第${errors.join('、')}行需填写完整后再进行合并`,
  data: {
    rowNos: errors.map((rowNo) => String(rowNo)).join('、')
  }
});

const hasDifferentMergeFieldValue = (group: RiskRecord[], field: MergeConflictFieldCode) =>
  new Set(group.map((record) => normalizeMergeText(String(record[field] || '')))).size > 1;

const getMergeConflictFields = (group: RiskRecord[]): MergeConflictFieldCode[] =>
  (['harmLevel', 'possibilityLevel', 'riskLevel', 'remediationSuggestion'] as MergeConflictFieldCode[]).filter((field) =>
    hasDifferentMergeFieldValue(group, field)
  );

const buildMergeConflictTabs = (records: RiskRecord[]) => {
  const fieldCodes = Array.from(new Set(records.flatMap((record) => record.mergeConflictFields || []))) as MergeConflictFieldCode[];
  return ['数据安全风险清单', '数据安全风险处置建议']
    .map((tab) => {
      const tabFieldCodes = fieldCodes.filter((fieldCode) => mergeConflictFieldLabels[fieldCode]?.tab === tab);
      return {
        tab,
        fields: tabFieldCodes.map((fieldCode) => mergeConflictFieldLabels[fieldCode].field),
        fieldCodes: tabFieldCodes
      };
    })
    .filter((item) => item.fieldCodes.length);
};

const buildMergeUpdateMessage = (hasMergeConflict: boolean, mergeConflictTabs: ReturnType<typeof buildMergeConflictTabs>) => {
  if (!hasMergeConflict) return '更新合并数据成功';
  const tabMessages = mergeConflictTabs.map((item) => `${item.tab}标签页下的${item.fields.join('、')}字段`);
  return `更新合并数据成功，存在合并冲突，${tabMessages.join('，')}存在冲突，请重新填写`;
};

const mergeRiskRecords = (records: RiskRecord[]): RiskRecord[] => {
  const groups = records.reduce((result, record) => {
    const key = buildRiskMergeKey(record);
    const group = result.get(key) || [];
    group.push(record);
    result.set(key, group);
    return result;
  }, new Map<string, RiskRecord[]>());

  return Array.from(groups.values()).map((group) => {
    if (group.length === 1) return { ...group[0] };
    const mergeConflictFields = getMergeConflictFields(group);
    const hasMergeConflict = mergeConflictFields.length > 0;
    return {
      ...group[0],
      id: `merged-${group.map((record) => record.id).join('-')}`,
      assessmentItemId: joinUnique(group.map((record) => record.assessmentItemId)),
      riskDescription: joinUniqueLines(group.map((record) => record.riskDescription)),
      evaluationRecord: joinUniqueLines(group.map((record) => record.evaluationRecord)),
      evaluationResult: 'NON_COMPLIANT',
      merged: true,
      mergedRiskRecordIds: group.map((record) => record.id),
      hasMergeConflict,
      mergeConflictFields,
      mergeConflictMessage: hasMergeConflict ? '合并行中存在不一致的评审结果，请评估人重新确认。' : ''
    };
  });
};

const buildRiskSummaryMergeUpdateResult = (records: RiskRecord[]): RiskSummaryMergeUpdateResult => {
  const mergedRecords = mergeRiskRecords(records);
  const mergeConflictTabs = buildMergeConflictTabs(mergedRecords);
  const hasMergeConflict = mergeConflictTabs.length > 0;
  return {
    mergeEnabled: true,
    updatedMergedCount: mergedRecords.filter((record) => record.merged).length,
    hasMergeConflict,
    mergeConflictTabs,
    message: buildMergeUpdateMessage(hasMergeConflict, mergeConflictTabs)
  };
};

const resolveRiskRecordTargets = (records: RiskRecord[], id: string, mergedRiskRecordIds?: string[]) => {
  const targetIds = mergedRiskRecordIds?.length ? new Set(mergedRiskRecordIds) : new Set([id]);
  return records.filter((record) => targetIds.has(record.id));
};

const stripMergeTargetPayload = <T extends { mergedRiskRecordIds?: string[] }>(payload: T) => {
  const { mergedRiskRecordIds, ...restPayload } = payload;
  return restPayload;
};

const calculateProjectScore = async (projectId: string): Promise<ScoreResult> => {
  const all = ensure(evaluationItems, projectId, []);
  const compliantCount = all.filter((item) => item.evaluationResult === 'COMPLIANT').length;
  const partialCount = all.filter((item) => item.evaluationResult === 'PARTIAL').length;
  const nonCompliantCount = all.filter((item) => item.evaluationResult === 'NON_COMPLIANT').length;
  const notApplicableCount = all.filter((item) => item.evaluationResult === 'NOT_APPLICABLE').length;
  const denominator = compliantCount + partialCount + nonCompliantCount;
  const scoreModel = await getProjectScoreModel(projectId);
  const resultScores = scoreModel?.resultScores || defaultResultScores;
  const possibilityRanges = scoreModel?.possibilityRanges?.length ? scoreModel.possibilityRanges : defaultPossibilityRanges;
  const numerator =
    compliantCount * resultScores.COMPLIANT +
    partialCount * resultScores.PARTIAL +
    nonCompliantCount * resultScores.NON_COMPLIANT;
  const score = denominator ? Math.round((numerator / denominator) * 100) : 0;
  const possibilityLevel = getPossibilityLevelByScore(score, possibilityRanges);

  return {
    score,
    possibilityLevel,
    possibilityLevelName: getPossibilityLevelName(possibilityLevel),
    scoreModelVersion: parseScoreModelVersion(scoreModel?.version),
    detail: { compliantCount, partialCount, nonCompliantCount, notApplicableCount }
  };
};

const harmAnalysisInput = (record: RiskRecord, systemType: string) =>
  [
    record.riskTypes.join(','),
    record.riskDescription,
    record.riskSourceDescription,
    systemType,
    record.assessmentCategory || '',
    record.assessmentSubcategory || '',
    record.checkPoint || '',
    record.evaluationResult || '',
    record.evaluationRecord || '',
    record.relatedData || '',
    record.relatedActivities.join(',')
  ].join('|');

const hashHarmAnalysisInput = (record: RiskRecord, systemType: string) => {
  const text = harmAnalysisInput(record, systemType);
  const hash = Array.from(text).reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 0);
  return hash.toString(16).padStart(8, '0');
};

const inferHarmLevel = (record: RiskRecord) => {
  const text = [record.riskTypes.join(' '), record.riskDescription, record.riskSourceDescription].join(' ');
  if (text.includes('DATA_LEAKAGE') || text.includes('泄露') || text.includes('脱库')) return 'RELATIVELY_HIGH';
  if (text.includes('OVER_SCOPE') || text.includes('超范围') || text.includes('最小必要')) return 'MEDIUM';
  if (text.includes('权限') || text.includes('滥用')) return 'HIGH';
  return 'MEDIUM';
};

const harmDescriptionByLevel: Record<string, string> = {
  VERY_HIGH: '一旦发生数据安全风险，可能对国家安全、经济运行或公共利益造成特别严重危害。',
  HIGH: '一旦发生数据安全风险，可能对社会秩序、公共利益或组织核心业务造成严重危害。',
  RELATIVELY_HIGH: '一旦发生数据安全风险，可能对社会秩序和公共利益产生危害，并对业务连续性造成较大影响。',
  MEDIUM: '一旦发生数据安全风险，可能对组织业务、个人权益或内部管理秩序造成一般危害。',
  LOW: '一旦发生数据安全风险，影响范围相对有限，可能造成轻微业务或管理影响。'
};

const harmLevelNameByLevel: Record<string, string> = {
  VERY_HIGH: '很高',
  HIGH: '高',
  RELATIVELY_HIGH: '较高',
  MEDIUM: '中',
  LOW: '低'
};

const evaluationResultNameByCode: Record<string, string> = {
  COMPLIANT: '符合',
  PARTIAL: '基本符合',
  NON_COMPLIANT: '不符合',
  NOT_APPLICABLE: '不适用'
};

const harmImpactObjectByLevel: Record<string, string> = {
  VERY_HIGH: '国家安全、经济运行、社会公共利益',
  HIGH: '社会秩序和公共利益',
  RELATIVELY_HIGH: '社会秩序和公共利益',
  MEDIUM: '组织业务、个人权益',
  LOW: '组织内部管理'
};

const buildHarmAnalysisSuggestion = async (projectId: string, record: RiskRecord): Promise<HarmAnalysisSuggestion> => {
  const project = await mockDb.getProject(projectId);
  const harmLevel = inferHarmLevel(record);
  const assessmentContext = [record.assessmentCategory, record.assessmentSubcategory, record.checkPoint].filter(Boolean).join(' / ');
  const systemTypeName = project.systemTypeName || project.systemType;
  const evaluationResultName = evaluationResultNameByCode[record.evaluationResult || ''] || record.evaluationResult || '-';
  const relatedActivityNames = record.relatedActivities.map((item) => processingActivityLabels[item] || item);
  const step2Basis = [
    `项目系统类别：${systemTypeName || '-'}`,
    record.riskTypes.length ? `风险类型：${record.riskTypes.join('、')}` : '',
    record.riskDescription ? `风险描述：${record.riskDescription}` : '',
    record.riskSourceDescription ? `风险源描述：${record.riskSourceDescription}` : '',
    assessmentContext ? `现场测评分类：${assessmentContext}` : '',
    record.checkPoint ? `检查要点：${record.checkPoint}` : '',
    record.evaluationResult ? `符合情况：${evaluationResultName}` : '',
    record.evaluationRecord ? `评估结果：${record.evaluationRecord}` : '',
    record.relatedData && record.relatedData !== '-' ? `涉及的数据及类型、级别：${record.relatedData}` : '',
    relatedActivityNames.length ? `涉及的数据处理活动：${relatedActivityNames.join('、')}` : '',
    '判定规则：先判断是否侵害国家安全，再判断是否侵害社会秩序或公共利益，最后判断是否合法权益。'
  ].filter(Boolean);
  const step2Evidence = [
    record.riskSourceDescription ? `风险源描述：${record.riskSourceDescription}` : '',
    record.evaluationRecord ? `现场记录：${record.evaluationRecord}` : '',
    record.checkPoint ? `检查要点：${record.checkPoint}` : ''
  ]
    .filter(Boolean)
    .slice(0, 3);
  const trace: HarmAnalysisTrace = {
    step1: `被评估对象系统类别为${systemTypeName}，现场测评上下文为${assessmentContext || '未提供分类上下文'}。`,
    step2: `结合风险类型、风险源描述、符合情况${evaluationResultName}和现场记录，判定优先受侵害客体为${harmImpactObjectByLevel[harmLevel]}。`,
    step2Reason: `基于现场测评分类、检查要点、风险描述和风险源描述，判断该风险可能影响${harmImpactObjectByLevel[harmLevel]}，因此按该受侵害客体继续匹配侵害程度。`,
    step2Basis,
    step2Evidence,
    step3: `按侵害客体、影响范围和现场评估结果“${record.evaluationRecord || '-'}”匹配数据安全保护等级。`,
    step4: `按保护等级匹配风险危害程度等级：${harmLevelNameByLevel[harmLevel]}。`,
    systemCategory: project.systemType,
    impactedObject: harmImpactObjectByLevel[harmLevel],
    damageDegree: harmLevel === 'RELATIVELY_HIGH' ? 'SERIOUS' : 'GENERAL',
    dataSecurityProtectionLevel: harmLevel === 'RELATIVELY_HIGH' ? 3 : 2,
    reason: 'mock 规则根据风险类型、风险描述和风险源描述生成辅助判定。',
    evidence: step2Evidence,
    conflicts: [],
    ruleId: `mock-${harmLevel.toLowerCase()}`
  };

  return {
    riskRecordId: record.id,
    harmLevel,
    harmLevelName: harmLevelNameByLevel[harmLevel],
    harmDescription: `${record.riskSourceDescription || record.riskDescription || '现场发现数据安全管理要求落实不到位'}。该问题涉及${record.relatedData && record.relatedData !== '-' ? record.relatedData : '相关数据'}${relatedActivityNames.length ? `在${relatedActivityNames.join('、')}环节的处理` : ''}，${harmDescriptionByLevel[harmLevel]}结合现场测评结果和业务影响，本条风险危害程度判定为${harmLevelNameByLevel[harmLevel]}。`,
    harmImpactObject: harmImpactObjectByLevel[harmLevel],
    harmExample: record.riskDescription || '该风险可能造成数据安全管理要求执行不到位，影响业务连续性或合规性。',
    harmAnalysisTrace: trace,
    harmAnalysisConfidence: harmLevel === 'RELATIVELY_HIGH' ? 0.86 : 0.78,
    harmAnalysisInputHash: hashHarmAnalysisInput(record, project.systemType),
    llmStatus: 'FALLBACK',
    llmProvider: 'mock-rule',
    llmModel: 'local-rule',
    needsManualReview: harmLevel === 'MEDIUM'
  };
};

const applyRiskMatrix = (riskMatrix: RiskMatrixJson, possibilityLevel?: string, harmLevel?: string) =>
  calculateRiskLevelByMatrix(riskMatrix, possibilityLevel, harmLevel);

const buildRiskRecord = (
  item: EvaluationItem,
  existing: RiskRecord | undefined,
  possibilityLevel: string,
  riskMatrix: RiskMatrixJson,
  overwriteManualChanges = false
): RiskRecord => {
  const template = matchRiskSourceTemplate(item);
  const preserveManual = Boolean(existing?.manualAdjusted && !overwriteManualChanges);
  const canReuseExisting = Boolean(existing && (!existing.manualAdjusted || preserveManual));
  const nextHarmLevel = canReuseExisting ? existing?.harmLevel || '-' : '-';
  const nextPossibilityLevel = preserveManual ? existing?.possibilityLevel || '-' : possibilityLevel || '-';

  return {
    id: existing?.id || `risk-${item.id}`,
    evaluationItemId: item.id,
    assessmentItemId: item.assessmentItemId,
    assessmentSubcategory: template?.assessmentSubcategory || item.subcategory || item.subcategoryName || undefined,
    assessmentCategory: item.category || item.categoryName || '',
    sourceItem: item.code,
    checkPoint: item.checkPoint,
    evaluationRecord: item.evaluationRecord,
    evaluationResult: item.evaluationResult,
    riskTypes: canReuseExisting && existing?.riskTypes?.length ? existing.riskTypes : template?.riskTypes || [],
    riskDescription: canReuseExisting ? existing?.riskDescription ?? template?.riskDescription ?? '' : template?.riskDescription ?? '',
    riskSourceDescription: canReuseExisting
      ? existing?.riskSourceDescription ?? template?.riskSourceDescription ?? ''
      : template?.riskSourceDescription ?? '',
    riskSourceType: template?.riskSourceType || null,
    relatedData: canReuseExisting ? existing?.relatedData || '-' : '-',
    relatedActivities: canReuseExisting && existing?.relatedActivities?.length ? existing.relatedActivities : inferRelatedActivities(item),
    harmLevel: nextHarmLevel,
    harmDescription: canReuseExisting ? existing?.harmDescription : undefined,
    harmImpactObject: canReuseExisting ? existing?.harmImpactObject : undefined,
    harmExample: canReuseExisting ? existing?.harmExample : undefined,
    harmAnalysisTrace: canReuseExisting ? existing?.harmAnalysisTrace : undefined,
    harmAnalysisConfidence: canReuseExisting ? existing?.harmAnalysisConfidence : undefined,
    harmAnalysisInputHash: canReuseExisting ? existing?.harmAnalysisInputHash : undefined,
    harmAnalysisStatus: canReuseExisting ? existing?.harmAnalysisStatus : undefined,
    possibilityLevel: nextPossibilityLevel,
    riskLevel: applyRiskMatrix(riskMatrix, nextPossibilityLevel, nextHarmLevel),
    remediationSuggestion: canReuseExisting
      ? existing?.remediationSuggestion ?? template?.remediationSuggestion ?? ''
      : template?.remediationSuggestion ?? '',
    manualAdjusted: preserveManual
  };
};

const seedRisks = async (projectId: string, overwriteManualChanges = false) => {
  const existingByEvaluationItem = new Map(
    (riskRecords[projectId] || []).map((record) => [record.evaluationItemId || record.sourceItem || record.id, record])
  );
  const scoreResult = await calculateProjectScore(projectId);
  const riskMatrix = await getProjectRiskMatrix(projectId);

  riskRecords[projectId] = ensure(evaluationItems, projectId, [])
    .filter((item) => item.evaluationResult === 'NON_COMPLIANT' || item.evaluationResult === 'PARTIAL')
    .map((item) =>
      buildRiskRecord(
        item,
        existingByEvaluationItem.get(item.id) || existingByEvaluationItem.get(item.code),
        scoreResult.possibilityLevel,
        riskMatrix,
        overwriteManualChanges
      )
    );
};

export const workflowDb = {
  getDataProcessorBasic(projectId: string) {
    if (!dataProcessorBasics[projectId]) {
      dataProcessorBasics[projectId] = {
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
      };
    }
    return delay(dataProcessorBasics[projectId]);
  },
  saveDataProcessorBasic(projectId: string, payload: DataProcessorBasicSurvey) {
    dataProcessorBasics[projectId] = payload;
    return delay(undefined);
  },
  listBusinessSystems(projectId: string) {
    return delay(ensure(businessSystems, projectId, []));
  },
  saveBusinessSystem(projectId: string, payload: Omit<BusinessSystem, 'id'>, id?: string) {
    return delay(upsert(ensure(businessSystems, projectId, []), payload, id));
  },
  uploadBusinessSystemDiagram(
    projectId: string,
    businessSystemId: string,
    diagramType: 'topology' | 'dataFlow',
    file: File
  ): Promise<BusinessSystemDiagramUploadResult> {
    const system = ensure(businessSystems, projectId, []).find((item) => item.id === businessSystemId);
    if (!system) {
      return Promise.reject({ code: 'NOT_FOUND', message: '业务系统记录不存在' });
    }

    const isTopology = diagramType === 'topology';
    const fileId = nextId(isTopology ? 'file-topology' : 'file-data-flow');
    const fileName = file.name || (isTopology ? 'topology.png' : 'data-flow.png');
    const field: 'topologyFileId' | 'businessFlowFileId' = isTopology ? 'topologyFileId' : 'businessFlowFileId';
    system[field] = fileId;

    return delay({
      file: {
        fileId,
        fileName,
        objectKey: `files/${fileId}_${fileName}`,
        storageProvider: 'MOCK',
        bucketName: 'datasecrity',
        contentType: file.type || 'image/*',
        fileSize: file.size,
        bizType: isTopology ? 'SURVEY_TOPOLOGY_DIAGRAM' : 'SURVEY_DATA_FLOW_DIAGRAM',
        downloadUrl: `/api/v1/files/${fileId}/download`
      },
      businessSystem: {
        id: system.id,
        topologyFileId: system.topologyFileId,
        businessFlowFileId: system.businessFlowFileId
      }
    });
  },
  deleteBusinessSystem(projectId: string, id: string) {
    remove(ensure(businessSystems, projectId, []), id);
    return delay(undefined);
  },
  listDataAssets(projectId: string) {
    return delay(ensure(dataAssets, projectId, []));
  },
  saveDataAsset(projectId: string, payload: Omit<DataAsset, 'id'>, id?: string) {
    return delay(upsert(ensure(dataAssets, projectId, []), payload, id));
  },
  deleteDataAsset(projectId: string, id: string) {
    remove(ensure(dataAssets, projectId, []), id);
    return delay(undefined);
  },
  listSpecialData(projectId: string, type: SpecialDataType) {
    return delay(ensure(specialData[type], projectId, []));
  },
  saveSpecialData(projectId: string, type: SpecialDataType, payload: Omit<SpecialDataRecord, 'id'>, id?: string) {
    return delay(upsert(ensure(specialData[type], projectId, []), payload, id));
  },
  deleteSpecialData(projectId: string, type: SpecialDataType, id: string) {
    remove(ensure(specialData[type], projectId, []), id);
    return delay(undefined);
  },
  listProcessingActivities(projectId: string) {
    return delay(ensure(processingActivities, projectId, []));
  },
  saveProcessingActivity(projectId: string, payload: Omit<ProcessingActivity, 'id'>, id?: string) {
    return delay(upsert(ensure(processingActivities, projectId, []), payload, id));
  },
  deleteProcessingActivity(projectId: string, id: string) {
    remove(ensure(processingActivities, projectId, []), id);
    return delay(undefined);
  },
  getProcessingActivitySurvey(projectId: string) {
    if (!processingActivitySurveys[projectId]) {
      processingActivitySurveys[projectId] = {
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
        storageMethod: '',
        dataCenter: '',
        storageSystem: '',
        externalStorageProvider: '',
        storageLocation: '',
        storageDuration: '',
        backupRedundancyStrategy: '',
        onlineChannel: '',
        offlineTransfer: '',
        transferProtocol: '',
        dataInterface: '',
        usePurpose: '',
        useMethod: '',
        useScope: '',
        useScenario: '',
        algorithmRules: '',
        processingDetails: '',
        algorithmRecommendationService: '',
        entrustedOrJointProcessing: '',
        providePurpose: '',
        provideMethod: '',
        provideScope: '',
        dataRecipients: '',
        provideContracts: '',
        providedPersonalInfoAndImportantData: '',
        publicPurpose: '',
        publicMethod: '',
        publicScope: '',
        publicAudienceSize: '',
        publicDataTypes: '',
        publicDataScale: '',
        deletionScenarios: '',
        deletionMethod: '',
        dataArchive: '',
        mediaDestruction: '',
        crossBorderPresence: '',
        crossBorderDescription: ''
      };
    }
    return delay(processingActivitySurveys[projectId]);
  },
  saveProcessingActivitySurvey(projectId: string, payload: ProcessingActivitySurvey) {
    processingActivitySurveys[projectId] = payload;
    return delay(undefined);
  },
  getSecurityProtection(projectId: string) {
    if (!securityProtections[projectId]) securityProtections[projectId] = {};
    return delay(securityProtections[projectId]);
  },
  saveSecurityProtection(projectId: string, payload: SecurityProtection) {
    securityProtections[projectId] = payload;
    return delay(undefined);
  },
  getEvaluationCatalog() {
    return delay(catalog);
  },
  listEvaluationItems(projectId: string, params: EvaluationItemQuery) {
    const all = ensure(evaluationItems, projectId, []);
    const keyword = params.keyword?.trim().toLowerCase();
    const sheetName = params.sheet_name || params.sheetName;
    const results = params.results?.length ? params.results : params.result ? [params.result] : [];
    const filtered = all
      .filter((item) => !params.categoryId || item.categoryId === params.categoryId)
      .filter((item) => !sheetName || (item.sheet_name || item.sheetName) === sheetName)
      .filter((item) => !params.category || (item.category || item.categoryName) === params.category)
      .filter((item) => !results.length || results.includes(item.evaluationResult))
      .filter(
        (item) =>
          !keyword ||
          [item.code, item.itemCode, item.assessmentItemId, item.checkPoint, item.checkContent, item.category, item.subcategory].some((value) =>
            (value || '').toLowerCase().includes(keyword)
          )
      );
    const start = (params.pageNo - 1) * params.pageSize;
    return delay<PageResult<EvaluationItem>>({
      list: filtered.slice(start, start + params.pageSize),
      pageNo: params.pageNo,
      pageSize: params.pageSize,
      total: filtered.length
    });
  },
  saveEvaluationRecord(projectId: string, itemId: string, payload: EvaluationRecordPayload) {
    const item = ensure(evaluationItems, projectId, []).find((row) => row.id === itemId);
    if (item) Object.assign(item, payload);
    return delay(undefined);
  },
  batchEvaluationResult(projectId: string, payload: BatchEvaluationResultPayload) {
    ensure(evaluationItems, projectId, []).forEach((item) => {
      if (payload.itemIds.includes(item.id)) item.evaluationResult = payload.evaluationResult;
    });
    return delay(undefined);
  },
  async calculateScore(projectId: string) {
    return delay(await calculateProjectScore(projectId));
  },
  async refreshRisks(projectId: string, overwriteManualChanges = false) {
    await seedRisks(projectId, overwriteManualChanges);
    return delay({ refreshed: true });
  },
  async listRiskSources(projectId: string, query?: Partial<RiskSummaryQuery>) {
    await seedRisks(projectId);
    return delay(pageRiskSummary(riskRecords[projectId] as RiskSource[], query));
  },
  async getRiskSummaryMerge(projectId: string): Promise<RiskSummaryMergeState> {
    return delay({ mergeEnabled: Boolean(riskSummaryMergeStates[projectId]) });
  },
  async setRiskSummaryMerge(projectId: string, mergeEnabled: boolean): Promise<RiskSummaryMergeState> {
    await seedRisks(projectId);
    if (mergeEnabled) {
      const errors = validateRiskMergeRequiredFields(riskRecords[projectId] || []);
      if (errors.length) {
        throw buildRiskMergeRequiredFieldsError(errors);
      }
    }
    riskSummaryMergeStates[projectId] = mergeEnabled;
    return delay({ mergeEnabled });
  },
  async updateRiskSummaryMerge(projectId: string): Promise<RiskSummaryMergeUpdateResult> {
    await seedRisks(projectId);
    const records = riskRecords[projectId] || [];
    const errors = validateRiskMergeRequiredFields(records);
    if (errors.length) {
      riskSummaryMergeStates[projectId] = false;
      throw buildRiskMergeRequiredFieldsError(errors);
    }
    riskSummaryMergeStates[projectId] = true;
    return delay(buildRiskSummaryMergeUpdateResult(records));
  },
  async getRiskFormOptions(projectId: string) {
    await seedRisks(projectId);
    const relatedDataOptions = Array.from(
      new Set(
        [...relatedDataOptionSeeds, ...(riskRecords[projectId] || []).map((row) => row.relatedData || '')]
          .flatMap((value) => String(value || '').split('、'))
          .map((value) => value.trim())
          .filter((value) => value && value !== '-')
      )
    );
    return delay({
      relatedDataOptions,
      relatedActivityOptions: defaultRelatedActivityOptions
    });
  },
  async saveRiskSource(projectId: string, id: string, payload: RiskSourceSavePayload) {
    await seedRisks(projectId);
    const item = riskRecords[projectId].find((row) => row.id === id);
    if (item) Object.assign(item, normalizeRiskSourcePayload(payload), { manualAdjusted: true });
    return delay(undefined);
  },
  async listRiskItems(projectId: string, query?: Partial<RiskSummaryQuery>) {
    await seedRisks(projectId);
    const records = riskSummaryMergeStates[projectId] ? mergeRiskRecords(riskRecords[projectId] || []) : riskRecords[projectId] || [];
    return delay(pageRiskSummary(records as RiskItem[], query));
  },
  async saveRiskItem(projectId: string, id: string, payload: RiskItemSavePayload) {
    await seedRisks(projectId);
    const targets = resolveRiskRecordTargets(riskRecords[projectId], id, payload.mergedRiskRecordIds);
    const nextPayload = stripMergeTargetPayload(payload);
    const riskMatrix = await getProjectRiskMatrix(projectId);
    targets.forEach((item) => {
      const nextHarmLevel = payload.harmLevel ?? item.harmLevel;
      const nextPossibilityLevel = payload.possibilityLevel ?? item.possibilityLevel;
      Object.assign(item, nextPayload, {
        riskLevel: applyRiskMatrix(riskMatrix, nextPossibilityLevel, nextHarmLevel),
        manualAdjusted: true,
        harmAnalysisStatus: payload.harmLevel ? 'MANUAL' : item.harmAnalysisStatus
      });
    });
    return delay(undefined);
  },
  async suggestRiskItemHarm(projectId: string, id: string) {
    await seedRisks(projectId);
    const item = riskRecords[projectId].find((row) => row.id === id);
    if (!item) throw { code: 'RISK_ITEM_NOT_FOUND', message: '风险记录不存在' };
    const suggestion = await buildHarmAnalysisSuggestion(projectId, item);
    Object.assign(item, {
      harmDescription: suggestion.harmDescription,
      harmImpactObject: suggestion.harmImpactObject,
      harmExample: suggestion.harmExample,
      harmAnalysisTrace: suggestion.harmAnalysisTrace,
      harmAnalysisConfidence: suggestion.harmAnalysisConfidence,
      harmAnalysisInputHash: suggestion.harmAnalysisInputHash,
      harmAnalysisStatus: 'PENDING'
    });
    return delay(suggestion);
  },
  async suggestRiskItemsHarm(projectId: string, payload: HarmAnalysisBatchPayload) {
    await seedRisks(projectId);
    const all = riskRecords[projectId] || [];
    const idSet = new Set(payload.riskItemIds || []);
    const targetRows = all
      .filter((row) => row.harmAnalysisStatus !== 'CONFIRMED')
      .filter((row) => !idSet.size || idSet.has(row.id))
      .slice(0, payload.limit || 20);
    const suggestions = await Promise.all(targetRows.map((row) => buildHarmAnalysisSuggestion(projectId, row)));
    targetRows.forEach((row, index) => {
      const suggestion = suggestions[index];
      Object.assign(row, {
        harmDescription: suggestion.harmDescription,
        harmImpactObject: suggestion.harmImpactObject,
        harmExample: suggestion.harmExample,
        harmAnalysisTrace: suggestion.harmAnalysisTrace,
        harmAnalysisConfidence: suggestion.harmAnalysisConfidence,
        harmAnalysisInputHash: suggestion.harmAnalysisInputHash,
        harmAnalysisStatus: 'PENDING'
      });
    });
    return delay(suggestions);
  },
  async applyRiskItemHarm(projectId: string, id: string, payload: HarmAnalysisApplyPayload) {
    await seedRisks(projectId);
    const targets = resolveRiskRecordTargets(riskRecords[projectId], id, payload.mergedRiskRecordIds);
    const item = targets[0];
    if (!item) throw { code: 'RISK_ITEM_NOT_FOUND', message: '风险记录不存在' };
    const project = await mockDb.getProject(projectId);
    const currentHash = hashHarmAnalysisInput(item, project.systemType);
    const riskMatrix = await getRiskMatrixById(project.riskMatrixId);
    const suggestion = payload.suggestion;
    if (suggestion.harmAnalysisInputHash && suggestion.harmAnalysisInputHash !== currentHash) {
      throw { code: 'HARM_ANALYSIS_STALE', message: '风险输入已变化，请重新生成危害程度建议' };
    }
    targets.forEach((target) => {
      Object.assign(target, {
        harmLevel: suggestion.harmLevel,
        harmDescription: suggestion.harmDescription,
        harmImpactObject: suggestion.harmImpactObject,
        harmExample: suggestion.harmExample,
        harmAnalysisTrace: suggestion.harmAnalysisTrace,
        harmAnalysisConfidence: suggestion.harmAnalysisConfidence,
        harmAnalysisInputHash: suggestion.harmAnalysisInputHash,
        harmAnalysisStatus: 'CONFIRMED',
        riskLevel: applyRiskMatrix(riskMatrix, target.possibilityLevel, suggestion.harmLevel),
        manualAdjusted: true
      });
    });
    return delay(undefined);
  },
  async listRiskSuggestions(projectId: string, query?: Partial<RiskSummaryQuery>) {
    await seedRisks(projectId);
    const records = riskSummaryMergeStates[projectId] ? mergeRiskRecords(riskRecords[projectId] || []) : riskRecords[projectId] || [];
    return delay(pageRiskSummary(records as RiskSuggestion[], query));
  },
  async saveRiskSuggestion(projectId: string, id: string, payload: RiskSuggestionSavePayload) {
    await seedRisks(projectId);
    const targets = resolveRiskRecordTargets(riskRecords[projectId], id, payload.mergedRiskRecordIds);
    const nextPayload = stripMergeTargetPayload(payload);
    targets.forEach((item) => {
      Object.assign(item, nextPayload, { manualAdjusted: true });
    });
    return delay(undefined);
  }
};
