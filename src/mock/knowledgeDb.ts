import type { PageResult } from '@/types/api';
import type {
  AssessmentTemplate,
  AssessmentTemplateItem,
  HarmModel,
  HarmRule,
  KnowledgeDeleteResult,
  KnowledgeEntity,
  KnowledgeQuery,
  KnowledgeResource,
  RemediationSuggestionKnowledge,
  RiskMatrix,
  ScoreModel
} from '@/types/knowledge';

const delay = <T>(data: T, ms = 180): Promise<T> =>
  new Promise((resolve) => window.setTimeout(() => resolve(JSON.parse(JSON.stringify(data)) as T), ms));

const today = () => new Date().toISOString().slice(0, 10);
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const page = <T extends KnowledgeEntity | AssessmentTemplateItem | HarmRule>(list: T[], query: KnowledgeQuery): PageResult<T> => {
  const keyword = query.keyword?.trim().toLowerCase();
  const filtered = list
    .filter((item) => !query.status || ('status' in item && item.status === query.status))
    .filter((item) => !query.enabledOnly || !('status' in item) || item.status === 'ENABLED')
    .filter((item) => !keyword || JSON.stringify(item).toLowerCase().includes(keyword));
  const pageNo = query.pageNo || 1;
  const pageSize = query.pageSize || 10;
  const start = (pageNo - 1) * pageSize;
  return {
    list: filtered.slice(start, start + pageSize),
    pageNo,
    pageSize,
    total: filtered.length
  };
};

const remove = <T extends { id: string }>(list: T[], rowId: string): KnowledgeDeleteResult => {
  const index = list.findIndex((item) => item.id === rowId);
  if (index >= 0) list.splice(index, 1);
  return { disabledDueToReference: false };
};

const upsert = <T extends KnowledgeEntity>(list: T[], payload: Omit<T, 'id'>, rowId?: string): T => {
  const next = { id: rowId || id('kb'), createdAt: today(), ...payload } as T;
  const index = list.findIndex((item) => item.id === next.id);
  if (index >= 0) list[index] = { ...list[index], ...next };
  else list.unshift(next);
  return next;
};

let assessmentTemplates: AssessmentTemplate[] = [
  {
    id: 'tpl-gb',
    templateId: 'tpl-gb',
    templateName: '国标GB/T 37973模板',
    templateType: 'NATIONAL',
    status: 'ENABLED',
    itemCount: 128,
    createdAt: '2024-01-01',
    version: 'v2026.1',
    items: [
      {
        id: 'item-001',
        itemId: 'item-001',
        sheetName: '数据安全管理',
        category: '安全管理制度',
        subcategory: '数据安全制度体系',
        itemCode: '1',
        checkPoint: '针对数据安全制度体系建设情况进行评估',
        standardItemId: '10375',
        sortOrder: 1
      }
    ]
  }
];

let suggestions: RemediationSuggestionKnowledge[] = [
  {
    id: 'sug-001',
    suggestionId: 'sug-001',
    suggestionTitle: '加强访问控制',
    riskLevel: 'HIGH',
    riskType: 'ACCESS_CONTROL',
    suggestionContent: '实施最小权限原则，定期审计权限',
    status: 'ENABLED',
    createdAt: '2024-01-01'
  },
  {
    id: 'sug-002',
    suggestionId: 'sug-002',
    suggestionTitle: '数据加密传输',
    riskLevel: 'HIGH',
    riskType: 'DATA_SECURITY',
    suggestionContent: '采用 TLS 加密传输敏感数据',
    status: 'ENABLED',
    createdAt: '2024-01-10'
  }
];

let scoreModels: ScoreModel[] = [
  {
    id: 'score-v1',
    modelId: 'score-v1',
    modelName: 'V1评分模型',
    modelType: 'PRESET',
    status: 'ENABLED',
    version: 'v1',
    createdAt: '2024-01-01',
    resultScores: { COMPLIANT: 1, PARTIAL: 0.5, NON_COMPLIANT: 0, NOT_APPLICABLE: null },
    possibilityRanges: [
      { level: 'HIGH', min: 0, max: 30, includeMin: true, includeMax: false },
      { level: 'MEDIUM', min: 30, max: 75, includeMin: true, includeMax: false },
      { level: 'LOW', min: 75, max: 100, includeMin: true, includeMax: true }
    ]
  }
];

let harmModels: HarmModel[] = [
  {
    id: 'harm-default',
    modelId: 'harm-default',
    modelName: '默认分析模型',
    description: '通用风险危害程度分析模型',
    status: 'ENABLED',
    version: 'v1',
    createdAt: '2024-01-01',
    rules: [
      {
        id: 'rule-001',
        ruleId: 'rule-001',
        level: 'MAJOR',
        description: '一旦发生数据安全风险，对国家安全造成特别严重危害。',
        impactObject: '国家安全',
        example: '直接导致特别重大突发事件，严重威胁国家安全，造成大范围社会动荡。',
        judgementSteps: ['识别影响对象', '判断影响范围'],
        sortOrder: 1
      },
      {
        id: 'rule-002',
        ruleId: 'rule-002',
        level: 'HIGH',
        description: '一旦发生数据安全风险，会对社会秩序和公共利益造成特别严重危害。',
        impactObject: '公共利益',
        example: '导致重大人员伤亡、财产损失，引起大范围社会恐慌。',
        judgementSteps: ['识别影响对象', '判断危害程度'],
        sortOrder: 2
      }
    ]
  },
  {
    id: 'harm-power',
    modelId: 'harm-power',
    modelName: '电力行业分析模型',
    description: '适用于电力行业的风险危害程度分析模型',
    status: 'ENABLED',
    version: 'v1',
    createdAt: '2024-01-15',
    rules: []
  }
];

let riskMatrices: RiskMatrix[] = [
  {
    id: 'matrix-v1',
    matrixId: 'matrix-v1',
    matrixName: 'V1评价矩阵',
    status: 'ENABLED',
    version: 'v1',
    createdAt: '2024-01-15 10:30:00',
    remark: '',
    matrixJson: {
      HIGH: {
        VERY_HIGH: 'MAJOR',
        HIGH: 'MAJOR',
        RELATIVELY_HIGH: 'MEDIUM',
        MEDIUM: 'LOW',
        LOW: 'SLIGHT'
      },
      MEDIUM: {
        VERY_HIGH: 'MAJOR',
        HIGH: 'HIGH',
        RELATIVELY_HIGH: 'MEDIUM',
        MEDIUM: 'LOW',
        LOW: 'SLIGHT'
      },
      LOW: {
        VERY_HIGH: 'MEDIUM',
        HIGH: 'MEDIUM',
        RELATIVELY_HIGH: 'LOW',
        MEDIUM: 'SLIGHT',
        LOW: 'SLIGHT'
      }
    }
  },
  {
    id: 'matrix-power',
    matrixId: 'matrix-power',
    matrixName: '电力行业风险评价矩阵',
    status: 'ENABLED',
    version: 'v2',
    createdAt: '2024-02-01 10:30:00',
    remark: '电力行业业务连续性权重更高',
    matrixJson: {
      HIGH: {
        VERY_HIGH: 'MAJOR',
        HIGH: 'MAJOR',
        RELATIVELY_HIGH: 'HIGH',
        MEDIUM: 'MEDIUM',
        LOW: 'LOW'
      },
      MEDIUM: {
        VERY_HIGH: 'MAJOR',
        HIGH: 'HIGH',
        RELATIVELY_HIGH: 'HIGH',
        MEDIUM: 'MEDIUM',
        LOW: 'LOW'
      },
      LOW: {
        VERY_HIGH: 'HIGH',
        HIGH: 'MEDIUM',
        RELATIVELY_HIGH: 'MEDIUM',
        MEDIUM: 'LOW',
        LOW: 'SLIGHT'
      }
    }
  }
];

const stores: Record<KnowledgeResource, KnowledgeEntity[]> = {
  assessment: assessmentTemplates,
  suggestion: suggestions,
  score: scoreModels,
  harm: harmModels,
  matrix: riskMatrices
};

export const knowledgeDb = {
  list(resource: KnowledgeResource, query: KnowledgeQuery): Promise<PageResult<KnowledgeEntity>> {
    return delay(page(stores[resource], query) as PageResult<KnowledgeEntity>);
  },
  save(resource: KnowledgeResource, payload: Omit<KnowledgeEntity, 'id'>, rowId?: string): Promise<KnowledgeEntity> {
    const saved = upsert(stores[resource], payload, rowId);
    return delay(saved);
  },
  delete(resource: KnowledgeResource, rowId: string): Promise<KnowledgeDeleteResult> {
    return delay(remove(stores[resource], rowId));
  },
  templateItems(templateId: string, query: KnowledgeQuery): Promise<PageResult<AssessmentTemplateItem>> {
    const template = assessmentTemplates.find((item) => item.id === templateId || item.templateId === templateId);
    return delay(page(template?.items || [], query));
  },
  saveTemplateItem(templateId: string, payload: Omit<AssessmentTemplateItem, 'id'>, rowId?: string): Promise<AssessmentTemplateItem> {
    const template = assessmentTemplates.find((item) => item.id === templateId || item.templateId === templateId);
    if (!template) throw new Error('模板不存在');
    const next = { id: rowId || id('item'), ...payload };
    const index = (template.items || []).findIndex((item) => item.id === next.id);
    template.items = template.items || [];
    if (index >= 0) template.items[index] = next;
    else template.items.push(next);
    template.itemCount = template.items.length;
    return delay(next);
  },
  deleteTemplateItem(templateId: string, rowId: string): Promise<void> {
    const template = assessmentTemplates.find((item) => item.id === templateId || item.templateId === templateId);
    if (template?.items) {
      template.items = template.items.filter((item) => item.id !== rowId);
      template.itemCount = template.items.length;
    }
    return delay(undefined);
  },
  harmRules(modelId: string, query: KnowledgeQuery): Promise<PageResult<HarmRule>> {
    const model = harmModels.find((item) => item.id === modelId || item.modelId === modelId);
    return delay(page(model?.rules || [], query));
  },
  saveHarmRule(modelId: string, payload: Omit<HarmRule, 'id'>, rowId?: string): Promise<HarmRule> {
    const model = harmModels.find((item) => item.id === modelId || item.modelId === modelId);
    if (!model) throw new Error('模型不存在');
    const next = { id: rowId || id('rule'), ...payload };
    const index = model.rules.findIndex((item) => item.id === next.id);
    if (index >= 0) model.rules[index] = next;
    else model.rules.push(next);
    return delay(next);
  },
  deleteHarmRule(modelId: string, rowId: string): Promise<void> {
    const model = harmModels.find((item) => item.id === modelId || item.modelId === modelId);
    if (model) model.rules = model.rules.filter((item) => item.id !== rowId);
    return delay(undefined);
  }
};
