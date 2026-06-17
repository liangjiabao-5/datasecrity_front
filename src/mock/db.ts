import type { PageQuery, PageResult, PlaceholderResult } from '@/types/api';
import type {
  ProjectConfigOptions,
  ProjectCreatePayload,
  ProjectDetail,
  ProjectListItem,
  ProjectStatistics,
  ProjectUpdatePayload,
  SaveProjectTemplatePayload
} from '@/types/project';
import type { BasicInfoPayload, CustomReferencePayload, ReferenceItem } from '@/types/basicInfo';
import type {
  AssessmentTeamMember,
  ClientTeamMember,
  FocusPoint,
  GapItem
} from '@/types/plan';
import { projectStatusLabels } from '@/utils/labels';

const delay = <T>(data: T, ms = 220): Promise<T> =>
  new Promise((resolve) => window.setTimeout(() => resolve(data), ms));

const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data)) as T;

const projectOptions: ProjectConfigOptions = {
  assessmentTemplates: [
    { id: 'tpl-gb', name: '国标数据安全风险评估模板', version: 'v2026.1', status: 'ENABLED' },
    { id: 'tpl-power', name: '电力行业评估模板', version: 'v1.2', status: 'ENABLED' },
    { id: 'tpl-custom', name: '自定义评估模板', version: 'v0.9', status: 'DRAFT' }
  ],
  riskMatrices: [
    { id: 'matrix-v1', name: '默认五级风险评价矩阵', version: 'v1' },
    { id: 'matrix-power', name: '电力行业风险评价矩阵', version: 'v2' }
  ],
  harmModels: [
    { id: 'harm-default', name: '默认风险危害程度分析模型', version: 'v1' },
    { id: 'harm-industry', name: '行业风险危害程度分析模型', version: 'v1' }
  ],
  scoreModels: [
    { id: 'score-v1', name: 'V1 评分模型', version: 'v3' },
    { id: 'score-balanced', name: '均衡型评分模型', version: 'v1' }
  ],
  systemTypes: [
    { id: 'MANAGEMENT_SYSTEM', name: '管理信息系统' },
    { id: 'POWER_CONTROL', name: '电力监控系统' },
    { id: 'NETWORK_FACILITY', name: '通信网络设施' },
    { id: 'DATA_RESOURCE', name: '数据资源' },
    { id: 'OTHER_SYSTEM_PLATFORM', name: '其他系统平台' }
  ]
};

let projects: ProjectDetail[] = [
  {
    id: 'p001',
    projectName: 'XX银行数据安全评估项目',
    projectCode: 'ENST-2024-001',
    assessmentOrg: 'XX银行股份有限公司',
    status: 'IN_PROGRESS',
    statusName: '进行中',
    ownerName: '田海瑞',
    contacts: '010-88888888',
    assessmentPeriod: '2026-06-01 至 2026-06-30',
    createdAt: '2026-05-20',
    systemType: 'MANAGEMENT_SYSTEM',
    systemTypeName: '管理信息系统',
    riskMatrixId: 'matrix-v1',
    riskMatrixName: '默认五级风险评价矩阵',
    riskMatrixVersion: 'v1',
    assessmentTemplateId: 'tpl-gb',
    assessmentTemplateName: '国标数据安全风险评估模板',
    assessmentTemplateVersion: 'v2026.1',
    harmModelId: 'harm-default',
    harmModelName: '默认风险危害程度分析模型',
    harmModelVersion: 'v1',
    scoreModelId: 'score-v1',
    scoreModelName: 'V1 评分模型',
    scoreModelVersion: 'v3',
    description: '围绕核心业务系统开展数据安全风险评估，形成风险清单和报告。',
    teamMembers: [
      { id: 'tm-001', name: '田海瑞', organization: '北京卓识网安技术股份有限公司', role: '项目负责人' },
      { id: 'tm-002', name: '李明', organization: '北京卓识网安技术股份有限公司', role: '组员' }
    ]
  },
  {
    id: 'p002',
    projectName: '某电力公司数据安全风险评估',
    projectCode: 'ENST-2024-002',
    assessmentOrg: '某省电力有限公司',
    status: 'NOT_STARTED',
    statusName: '待开始',
    ownerName: '王敏',
    contacts: '13800000000',
    assessmentPeriod: '2026-07-01 至 2026-07-20',
    createdAt: '2026-05-22',
    systemType: 'POWER_CONTROL',
    systemTypeName: '电力监控系统',
    riskMatrixId: 'matrix-power',
    riskMatrixName: '电力行业风险评价矩阵',
    riskMatrixVersion: 'v2',
    assessmentTemplateId: 'tpl-power',
    assessmentTemplateName: '电力行业评估模板',
    assessmentTemplateVersion: 'v1.2',
    harmModelId: 'harm-industry',
    harmModelName: '行业风险危害程度分析模型',
    harmModelVersion: 'v1',
    scoreModelId: 'score-v1',
    scoreModelName: 'V1 评分模型',
    scoreModelVersion: 'v3',
    description: '电力生产和管理系统数据安全评估。',
    teamMembers: []
  },
  {
    id: 'p003',
    projectName: '政务云平台数据安全复核',
    projectCode: 'ENST-2024-003',
    assessmentOrg: '某市大数据中心',
    status: 'COMPLETED',
    statusName: '已完成',
    ownerName: '赵杰',
    contacts: 'zhaojie@example.com',
    assessmentPeriod: '2026-04-10 至 2026-04-30',
    createdAt: '2026-04-01',
    systemType: 'OTHER_SYSTEM_PLATFORM',
    systemTypeName: '其他系统平台',
    riskMatrixId: 'matrix-v1',
    riskMatrixName: '默认五级风险评价矩阵',
    riskMatrixVersion: 'v1',
    assessmentTemplateId: 'tpl-gb',
    assessmentTemplateName: '国标数据安全风险评估模板',
    assessmentTemplateVersion: 'v2026.1',
    harmModelId: 'harm-default',
    harmModelName: '默认风险危害程度分析模型',
    harmModelVersion: 'v1',
    scoreModelId: 'score-balanced',
    scoreModelName: '均衡型评分模型',
    scoreModelVersion: 'v1',
    description: '对已交付报告进行复核和留档。',
    teamMembers: [{ id: 'tm-003', name: '赵杰', organization: '项目组', role: '查看员' }]
  }
];

let laws: ReferenceItem[] = [
  { id: 'law-001', name: '《中华人民共和国数据安全法》' },
  { id: 'law-002', name: '《中华人民共和国网络安全法》' },
  { id: 'law-003', name: '《中华人民共和国个人信息保护法》' }
];

let standards: ReferenceItem[] = [
  { id: 'std-001', name: 'GB/T 45577-2025《数据安全技术 数据安全风险评估方法》' },
  { id: 'std-002', name: 'GB/T 35273《信息安全技术 个人信息安全规范》' }
];

const defaultBasicInfo = (projectId: string): BasicInfoPayload => {
  const project = projects.find((item) => item.id === projectId);
  return {
    projectNumber: project?.projectCode || '',
    projectName: project?.projectName || '',
    laws: [laws[0]],
    standards: [standards[0]],
    assessmentPlan: { startDate: '2026-06-01', endDate: '2026-06-30' },
    organization: {
      name: project?.assessmentOrg || '',
      postalCode: ''
    },
    contacts: [
      {
        id: 'contact-001',
        name: '张三',
        department: '技术部',
        mobile: '13800000000',
        title: '技术负责人',
        phone: '010-88888888',
        email: 'zhangsan@example.com'
      }
    ]
  };
};

let basicInfoByProject: Record<string, BasicInfoPayload> = {
  p001: defaultBasicInfo('p001'),
  p002: defaultBasicInfo('p002'),
  p003: defaultBasicInfo('p003')
};

const assessmentTeams: Record<string, AssessmentTeamMember[]> = {
  p001: [
    { id: 'a-001', name: '田海瑞', organization: '北京卓识网安技术股份有限公司', role: '组长' },
    { id: 'a-002', name: '李明', organization: '北京卓识网安技术股份有限公司', role: '组员' }
  ]
};

const clientTeams: Record<string, ClientTeamMember[]> = {
  p001: [
    { id: 'c-001', department: '信息科技部', name: '张三', position: '技术负责人', contact: '13800000000' }
  ]
};

const focusPoints: Record<string, FocusPoint[]> = {
  p001: [
    {
      id: 'f-001',
      name: '访问控制',
      domain: '安全防护',
      riskLevel: 'HIGH',
      description: '关键系统访问权限管理存在漏洞，部分账号权限过大。',
      source: 'MANUAL'
    }
  ]
};

const gapItems: Record<string, GapItem[]> = {
  p001: [
    {
      id: 'g-001',
      gapItem: '数据分类分级工作不完整',
      dimension: '管理制度',
      lastYearScore: 70,
      currentYearScore: 85,
      improvementSuggestion: '补充分类分级制度并完成全量数据标识。'
    }
  ]
};

const toListItem = (project: ProjectDetail): ProjectListItem => ({
  id: project.id,
  projectName: project.projectName,
  projectCode: project.projectCode,
  assessmentOrg: project.assessmentOrg,
  status: project.status,
  statusName: project.statusName,
  ownerName: project.ownerName,
  assessmentPeriod: project.assessmentPeriod,
  createdAt: project.createdAt
});

const fillNames = (payload: ProjectCreatePayload, id: string): ProjectDetail => {
  const assessmentTemplate = projectOptions.assessmentTemplates.find((item) => item.id === payload.assessmentTemplateId);
  const riskMatrix = projectOptions.riskMatrices.find((item) => item.id === payload.riskMatrixId);
  const harmModel = projectOptions.harmModels.find((item) => item.id === payload.harmModelId);
  const scoreModel = projectOptions.scoreModels.find((item) => item.id === payload.scoreModelId);
  const systemType = projectOptions.systemTypes.find((item) => item.id === payload.systemType);

  return {
    id,
    projectName: payload.projectName,
    projectCode: payload.projectCode,
    assessmentOrg: payload.assessmentOrg,
    status: 'NOT_STARTED',
    statusName: projectStatusLabels.NOT_STARTED,
    createdAt: new Date().toISOString().slice(0, 10),
    ownerName: '当前用户',
    assessmentPeriod: '-',
    contacts: '',
    systemType: payload.systemType,
    systemTypeName: systemType?.name || payload.systemType,
    riskMatrixId: payload.riskMatrixId,
    riskMatrixName: riskMatrix?.name || payload.riskMatrixId,
    riskMatrixVersion: riskMatrix?.version,
    assessmentTemplateId: payload.assessmentTemplateId,
    assessmentTemplateName: assessmentTemplate?.name || payload.assessmentTemplateId,
    assessmentTemplateVersion: assessmentTemplate?.version,
    harmModelId: payload.harmModelId,
    harmModelName: harmModel?.name || payload.harmModelId,
    harmModelVersion: harmModel?.version,
    scoreModelId: payload.scoreModelId,
    scoreModelName: scoreModel?.name || payload.scoreModelId,
    scoreModelVersion: scoreModel?.version,
    description: payload.description,
    teamMembers: []
  };
};

const ensureProjectRecords = (projectId: string) => {
  if (!assessmentTeams[projectId]) assessmentTeams[projectId] = [];
  if (!clientTeams[projectId]) clientTeams[projectId] = [];
  if (!focusPoints[projectId]) focusPoints[projectId] = [];
  if (!gapItems[projectId]) gapItems[projectId] = [];
  if (!basicInfoByProject[projectId]) basicInfoByProject[projectId] = defaultBasicInfo(projectId);
};

export const mockDb = {
  async getProjectConfigOptions(): Promise<ProjectConfigOptions> {
    return delay(clone(projectOptions));
  },

  async listProjects(query: PageQuery): Promise<PageResult<ProjectListItem>> {
    const keyword = query.keyword?.trim().toLowerCase();
    const filtered = projects
      .filter((project) => !query.status || project.status === query.status)
      .filter((project) => {
        if (!keyword) return true;
        return [project.projectName, project.projectCode, project.assessmentOrg].some((value) =>
          value.toLowerCase().includes(keyword)
        );
      });
    const start = (query.pageNo - 1) * query.pageSize;
    return delay({
      list: filtered.slice(start, start + query.pageSize).map(toListItem),
      pageNo: query.pageNo,
      pageSize: query.pageSize,
      total: filtered.length
    });
  },

  async getProjectStatistics(): Promise<ProjectStatistics> {
    return delay({
      all: projects.length,
      notStarted: projects.filter((project) => project.status === 'NOT_STARTED').length,
      inProgress: projects.filter((project) => project.status === 'IN_PROGRESS').length,
      completed: projects.filter((project) => project.status === 'COMPLETED').length
    });
  },

  async createProject(payload: ProjectCreatePayload): Promise<{ projectId: string }> {
    if (projects.some((project) => project.projectCode === payload.projectCode)) {
      throw { code: 'PROJECT_CODE_DUPLICATED', message: '项目编号已存在' };
    }
    const projectId = `p${String(projects.length + 1).padStart(3, '0')}`;
    const detail = fillNames(payload, projectId);
    projects = [detail, ...projects];
    ensureProjectRecords(projectId);
    return delay({ projectId });
  },

  async updateProject(projectId: string, payload: ProjectUpdatePayload): Promise<void> {
    const index = projects.findIndex((project) => project.id === projectId);
    if (index < 0) throw { code: 'PROJECT_NOT_FOUND', message: '项目不存在' };
    const next = fillNames(payload, projectId);
    projects[index] = {
      ...projects[index],
      ...next,
      status: projects[index].status,
      statusName: projectStatusLabels[projects[index].status],
      teamMembers: projects[index].teamMembers
    };
    return delay(undefined);
  },

  async getProject(projectId: string): Promise<ProjectDetail> {
    const project = projects.find((item) => item.id === projectId);
    if (!project) throw { code: 'PROJECT_NOT_FOUND', message: '项目不存在' };
    ensureProjectRecords(projectId);
    return delay(clone(project));
  },

  async startProject(projectId: string): Promise<void> {
    const project = projects.find((item) => item.id === projectId);
    if (!project) throw { code: 'PROJECT_NOT_FOUND', message: '项目不存在' };
    project.status = 'IN_PROGRESS';
    project.statusName = projectStatusLabels.IN_PROGRESS;
    return delay(undefined);
  },

  async deleteProject(projectId: string): Promise<void> {
    projects = projects.filter((project) => project.id !== projectId);
    return delay(undefined);
  },

  async saveProjectTemplate(_projectId: string, _payload: SaveProjectTemplatePayload): Promise<PlaceholderResult> {
    return delay({ status: 'PLACEHOLDER', message: '项目模板保存能力本批暂缓实现' });
  },

  async getReferenceOptions(): Promise<{ laws: ReferenceItem[]; standards: ReferenceItem[] }> {
    return delay({ laws: clone(laws), standards: clone(standards) });
  },

  async getBasicInfo(projectId: string): Promise<BasicInfoPayload> {
    ensureProjectRecords(projectId);
    return delay(clone(basicInfoByProject[projectId]));
  },

  async saveBasicInfo(projectId: string, payload: BasicInfoPayload): Promise<void> {
    basicInfoByProject[projectId] = clone(payload);
    return delay(undefined);
  },

  async createCustomReference(projectId: string, payload: CustomReferencePayload): Promise<ReferenceItem> {
    const item = {
      id: `${payload.type.toLowerCase()}-${projectId}-${Date.now()}`,
      name: payload.name
    };
    if (payload.type === 'LAW') {
      laws = [...laws, item];
    } else {
      standards = [...standards, item];
    }
    return delay(item);
  },

  async listAssessmentTeam(projectId: string): Promise<AssessmentTeamMember[]> {
    ensureProjectRecords(projectId);
    return delay(clone(assessmentTeams[projectId]));
  },

  async saveAssessmentTeam(projectId: string, item: Omit<AssessmentTeamMember, 'id'>, id?: string): Promise<AssessmentTeamMember> {
    ensureProjectRecords(projectId);
    const list = assessmentTeams[projectId];
    const saved = { id: id || `a-${Date.now()}`, ...item };
    const index = list.findIndex((row) => row.id === saved.id);
    if (index >= 0) list[index] = saved;
    else list.push(saved);
    return delay(clone(saved));
  },

  async deleteAssessmentTeam(projectId: string, id: string): Promise<void> {
    assessmentTeams[projectId] = (assessmentTeams[projectId] || []).filter((item) => item.id !== id);
    return delay(undefined);
  },

  async listClientTeam(projectId: string): Promise<ClientTeamMember[]> {
    ensureProjectRecords(projectId);
    return delay(clone(clientTeams[projectId]));
  },

  async saveClientTeam(projectId: string, item: Omit<ClientTeamMember, 'id'>, id?: string): Promise<ClientTeamMember> {
    ensureProjectRecords(projectId);
    const list = clientTeams[projectId];
    const saved = { id: id || `c-${Date.now()}`, ...item };
    const index = list.findIndex((row) => row.id === saved.id);
    if (index >= 0) list[index] = saved;
    else list.push(saved);
    return delay(clone(saved));
  },

  async deleteClientTeam(projectId: string, id: string): Promise<void> {
    clientTeams[projectId] = (clientTeams[projectId] || []).filter((item) => item.id !== id);
    return delay(undefined);
  },

  async listFocusPoints(projectId: string): Promise<FocusPoint[]> {
    ensureProjectRecords(projectId);
    return delay(clone(focusPoints[projectId]));
  },

  async saveFocusPoint(projectId: string, item: Omit<FocusPoint, 'id'>, id?: string): Promise<FocusPoint> {
    ensureProjectRecords(projectId);
    const list = focusPoints[projectId];
    const saved = { id: id || `f-${Date.now()}`, ...item };
    const index = list.findIndex((row) => row.id === saved.id);
    if (index >= 0) list[index] = saved;
    else list.push(saved);
    return delay(clone(saved));
  },

  async deleteFocusPoint(projectId: string, id: string): Promise<void> {
    focusPoints[projectId] = (focusPoints[projectId] || []).filter((item) => item.id !== id);
    return delay(undefined);
  },

  async listGapItems(projectId: string): Promise<GapItem[]> {
    ensureProjectRecords(projectId);
    return delay(clone(gapItems[projectId]));
  },

  async saveGapItem(projectId: string, item: Omit<GapItem, 'id'>, id?: string): Promise<GapItem> {
    ensureProjectRecords(projectId);
    const list = gapItems[projectId];
    const saved = { id: id || `g-${Date.now()}`, ...item };
    const index = list.findIndex((row) => row.id === saved.id);
    if (index >= 0) list[index] = saved;
    else list.push(saved);
    return delay(clone(saved));
  },

  async deleteGapItem(projectId: string, id: string): Promise<void> {
    gapItems[projectId] = (gapItems[projectId] || []).filter((item) => item.id !== id);
    return delay(undefined);
  }
};
