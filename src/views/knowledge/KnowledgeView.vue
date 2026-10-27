<template>
  <div>
    <div class="page-heading">
      <div>
        <h1>知识库管理</h1>
        <p>管理评估知识库，包括模板、规则、评分模型、风险矩阵等基础数据。</p>
      </div>
    </div>

    <div class="panel panel-pad">
      <el-tabs v-model="activeResource" @tab-change="onTabChange">
        <el-tab-pane v-for="resource in resourceConfigs" :key="resource.key" :label="resource.label" :name="resource.key">
          <template v-if="resource.key === 'harm'">
            <div class="model-tabs-bar">
              <el-tabs v-model="activeHarmModelId" type="card" class="model-tabs" @tab-change="loadHarmRules">
                <el-tab-pane v-for="model in harmModels" :key="getId(model)" :label="model.modelName" :name="getId(model)" />
              </el-tabs>
              <el-button type="primary" :icon="Plus" @click="openCreate('harm')">添加模型</el-button>
            </div>

            <el-empty v-if="!harmModels.length" description="暂无风险危害程度分析模型" />
            <template v-else>
              <div class="toolbar">
                <el-input v-model="harmRuleQuery.keyword" clearable placeholder="搜索风险等级规则" style="max-width: 280px" @keyup.enter="loadHarmRules" />
                <el-button type="primary" :icon="Search" @click="loadHarmRules">查询</el-button>
                <el-button type="primary" :icon="Plus" @click="openHarmRule()">添加规则</el-button>
                <el-button @click="handleImportRules">导入模板</el-button>
              </div>
              <el-table v-loading="nestedLoading" :data="harmRules" border>
                <el-table-column prop="level" label="等级" width="100">
                  <template #default="{ row }">
                    <el-tag :type="riskTagType(row.level)">{{ riskLevelName(row.level) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="description" label="风险危害程度描述" min-width="260" show-overflow-tooltip />
                <el-table-column prop="impactObject" label="影响对象" width="140" />
                <el-table-column prop="example" label="风险危害程度示例" min-width="300" show-overflow-tooltip />
                <el-table-column label="操作" width="150" fixed="right">
                  <template #default="{ row }">
                    <el-button link type="primary" @click="openHarmRule(row)">编辑</el-button>
                    <el-button link type="danger" @click="deleteHarmRule(row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </template>
          </template>

          <template v-else>
            <div class="toolbar">
              <el-input
                v-model="query.keyword"
                clearable
                :placeholder="searchPlaceholder(resource.key)"
                style="max-width: 320px"
                @keyup.enter="reloadFirstPage"
                @clear="reloadFirstPage"
              />
              <el-button type="primary" :icon="Search" @click="reloadFirstPage">查询</el-button>
              <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
              <div class="toolbar-spacer"></div>
              <el-button type="primary" :icon="Plus" @click="openCreate(resource.key)">{{ resource.addText }}</el-button>
            </div>

            <el-table v-loading="loading" :data="rowsByResource[resource.key]" border>
              <el-table-column type="index" label="序号" width="70" />
              <el-table-column
                v-for="column in resource.columns"
                :key="column.key"
                :label="column.label"
                :min-width="column.minWidth"
                :width="column.width"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  <el-tag v-if="column.key === 'status'" :type="statusTag(rowValue(row, column.key))">
                    {{ statusLabel(rowValue(row, column.key)) }}
                  </el-tag>
                  <span v-else>{{ formatColumnValue(row, column.key) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" :width="resource.key === 'matrix' ? 100 : 180" fixed="right">
                <template #default="{ row }">
                  <div class="table-actions">
                    <template v-if="resource.key === 'assessment'">
                      <el-button link type="primary" @click="openEdit(resource.key, row)">编辑</el-button>
                      <el-button link type="danger" @click="deleteRow(resource.key, row)">删除</el-button>
                      <el-button link @click="exportTemplate(row)">导出</el-button>
                    </template>
                    <template v-else-if="resource.key === 'suggestion'">
                      <el-button link type="primary" @click="openEdit(resource.key, row)">编辑</el-button>
                      <el-button link type="danger" @click="deleteRow(resource.key, row)">删除</el-button>
                    </template>
                    <template v-else-if="resource.key === 'score'">
                      <el-button link type="primary" @click="openScoreDetail(row)">查看</el-button>
                    </template>
                    <template v-else-if="resource.key === 'matrix'">
                      <el-button link type="primary" @click="openMatrixDetail(row)">查看</el-button>
                    </template>
                  </div>
                </template>
              </el-table-column>
              <el-table-column v-if="resource.key === 'matrix'" label="备注" width="260" fixed="right">
                <template #default="{ row }">
                  <div class="remark-editor">
                    <el-input v-model="matrixRemarkDrafts[getId(row)]" placeholder="请输入备注" size="small" />
                    <el-button link type="primary" @click="saveMatrixRemark(row)">保存</el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </template>

          <div v-if="resource.key !== 'harm'" class="panel-pad">
            <el-pagination
              v-model:current-page="query.pageNo"
              v-model:page-size="query.pageSize"
              background
              layout="total, sizes, prev, pager, next, jumper"
              :page-sizes="[10, 20, 50]"
              :total="totalByResource[resource.key]"
              @current-change="loadActive"
              @size-change="reloadFirstPage"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="editVisible" :title="dialogTitle" width="920px">
      <el-form :model="currentForm" label-width="140px">
        <el-row :gutter="16">
          <el-col v-for="field in activeConfig.fields" :key="field.key" :xs="24" :md="field.type === 'textarea' ? 24 : 12">
            <el-form-item :label="field.label">
              <el-input
                v-if="field.type === 'text'"
                v-model="currentForm[field.key]"
                :placeholder="`请输入${field.label}`"
              />
              <el-input
                v-else-if="field.type === 'textarea'"
                v-model="currentForm[field.key]"
                type="textarea"
                :rows="3"
                :placeholder="`请输入${field.label}`"
              />
              <el-select v-else v-model="currentForm[field.key]" filterable style="width: 100%">
                <el-option v-for="option in field.options || []" :key="option.value" :label="option.label" :value="option.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <template v-if="activeResource === 'score'">
          <div class="config-section">
            <h3>一、评分项分值定义</h3>
            <p>请配置各评估结果对应的基础分值，“不适用”项不计入总分计算。</p>
            <el-row :gutter="16">
              <el-col :xs="24" :md="6">
                <el-form-item label="符合" label-width="72px" class="score-value-form-item">
                  <el-input-number v-model="scoreResultScores.COMPLIANT" class="score-value-input" :min="0" :step="0.1" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="6">
                <el-form-item label="部分符合" label-width="72px" class="score-value-form-item">
                  <el-input-number v-model="scoreResultScores.PARTIAL" class="score-value-input" :min="0" :step="0.1" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="6">
                <el-form-item label="不符合" label-width="72px" class="score-value-form-item">
                  <el-input-number v-model="scoreResultScores.NON_COMPLIANT" class="score-value-input" :min="0" :step="0.1" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="6">
                <el-form-item label="不适用" label-width="72px" class="score-value-form-item">
                  <el-input class="score-value-input" value="不计分" disabled />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <div class="config-section">
            <h3>二、评分计算公式</h3>
            <div class="formula-box">
              可能性计算分值 = （符合项数量 + {{ scorePartialCoefficient }} x 部分符合项数量） /
              （符合项数量 + 部分符合项数量 + 不符合项数量） x 100
              <br />
              注：不适用项不计入分子与分母的计算。
            </div>
          </div>

          <div class="config-section">
            <h3>三、风险发生可能性等级映射</h3>
            <p>区间需覆盖 0-100，无重叠、无间隙。</p>
            <div class="range-grid">
              <div v-for="range in scoreRanges" :key="range.level" class="range-row">
                <span>{{ scoreRangeLabel(range.level) }}</span>
                <el-input-number v-model="range.min" :min="0" :max="100" :step="0.01" />
                <span>~</span>
                <el-input-number v-model="range.max" :min="0" :max="100" :step="0.01" />
              </div>
            </div>
          </div>
        </template>

        <template v-if="activeResource === 'matrix'">
          <div class="config-section">
            <h3>风险评价矩阵</h3>
            <div class="matrix-wrap">
              <table class="risk-matrix">
                <thead>
                  <tr>
                    <th colspan="2" rowspan="2">数据安全风险等级</th>
                    <th :colspan="matrixHarmAxes.length">风险危害程度</th>
                  </tr>
                  <tr>
                    <th v-for="harm in matrixHarmAxes" :key="harm.key">{{ harm.label }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in matrixPossibilityRows" :key="row.key">
                    <th v-if="row.key === 'HIGH'" :rowspan="matrixPossibilityRows.length">风险发生可能性</th>
                    <td class="axis-cell">{{ row.label }}</td>
                    <td v-for="harm in matrixHarmAxes" :key="harm.key">
                      <el-select v-model="matrixJson[row.key][harm.key]" style="width: 100%">
                        <el-option v-for="level in allRiskLevels" :key="level" :label="riskLevelName(level)" :value="level" />
                      </el-select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </el-form>

      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveCurrent">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="scoreDetailVisible" title="查看评分模型规则" width="900px">
      <template v-if="currentScoreModel">
        <div class="config-section">
          <h3>一、评分项分值定义</h3>
          <div class="readonly-grid">
            <span>符合：{{ currentScoreModel.resultScores.COMPLIANT }}</span>
            <span>部分符合：{{ currentScoreModel.resultScores.PARTIAL }}</span>
            <span>不符合：{{ currentScoreModel.resultScores.NON_COMPLIANT }}</span>
            <span>不适用：不计分</span>
          </div>
        </div>
        <div class="config-section">
          <h3>二、评分计算公式</h3>
          <div class="formula-box">
            可能性计算分值 = （符合项数量 + {{ formatScoreCoefficient(currentScoreModel.resultScores.PARTIAL) }} x 部分符合项数量） /
            （符合项数量 + 部分符合项数量 + 不符合项数量） x 100
          </div>
        </div>
        <div class="config-section">
          <h3>三、风险发生可能性等级映射</h3>
          <div class="readonly-grid">
            <span v-for="range in currentScoreModel.possibilityRanges" :key="range.level">
              {{ scoreRangeLabel(range.level) }}：{{ range.min }} ~ {{ range.max }}
            </span>
          </div>
        </div>
      </template>
      <template #footer>
        <el-button type="primary" @click="scoreDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="matrixDetailVisible" :title="currentMatrix?.matrixName || '风险评价矩阵'" width="1180px">
      <div class="matrix-wrap">
        <table class="risk-matrix">
          <thead>
            <tr>
              <th colspan="2" rowspan="2">数据安全风险等级</th>
              <th :colspan="matrixHarmAxes.length">风险危害程度</th>
            </tr>
            <tr>
              <th v-for="harm in matrixHarmAxes" :key="harm.key">{{ harm.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in matrixPossibilityRows" :key="row.key">
              <th v-if="row.key === 'HIGH'" :rowspan="matrixPossibilityRows.length">风险发生可能性</th>
              <td class="axis-cell">{{ row.label }}</td>
              <td
                v-for="harm in matrixHarmAxes"
                :key="harm.key"
                :class="riskCellClass(currentMatrixJson[row.key]?.[harm.key])"
              >
                {{ riskLevelName(currentMatrixJson[row.key]?.[harm.key]) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <template #footer>
        <el-button type="primary" @click="matrixDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="harmRuleVisible" :title="harmRuleEditingId ? '编辑风险等级规则' : '添加风险等级规则'" width="760px">
      <el-form :model="harmRuleForm" label-width="150px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="风险等级">
              <el-select v-model="harmRuleForm.level" style="width: 100%">
                <el-option v-for="level in allRiskLevels" :key="level" :label="riskLevelName(level)" :value="level" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="排序"><el-input-number v-model="harmRuleForm.sortOrder" :min="0" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="风险危害程度描述"><el-input v-model="harmRuleForm.description" type="textarea" :rows="3" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="影响对象"><el-input v-model="harmRuleForm.impactObject" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="判定步骤">
              <el-select v-model="harmRuleForm.judgementSteps" multiple filterable allow-create default-first-option style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24"><el-form-item label="风险危害程度示例"><el-input v-model="harmRuleForm.example" type="textarea" :rows="4" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="harmRuleVisible = false">取消</el-button>
        <el-button type="primary" @click="saveHarmRule">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh, Search } from '@element-plus/icons-vue';
import { knowledgeApi } from '@/api/knowledgeApi';
import { notifyApiError, notifyApiSuccess, successMessage } from '@/utils/apiFeedback';
import { exportJsonFile } from '@/utils/fileActions';
import { useMock } from '@/utils/env';
import type {
  AssessmentTemplate,
  HarmModel,
  HarmRule,
  KnowledgeEntity,
  KnowledgeQuery,
  KnowledgeResource,
  RemediationSuggestionKnowledge,
  RiskMatrix,
  RiskMatrixJson,
  ScoreModel,
  ScoreRange
} from '@/types/knowledge';
import { validateScoreRanges } from '@/utils/validation';

type FieldType = 'text' | 'textarea' | 'select';
type FormValue = string | number | boolean | null | ScoreRange[] | RiskMatrixJson | Record<string, number | null> | undefined;
type FormState = Record<string, FormValue>;

interface FieldOption {
  label: string;
  value: string;
}

interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  options?: FieldOption[];
}

interface ColumnConfig {
  key: string;
  label: string;
  width?: number;
  minWidth?: number;
}

interface ResourceConfig {
  key: KnowledgeResource;
  label: string;
  addText: string;
  columns: ColumnConfig[];
  fields: FieldConfig[];
}

const statusOptions: FieldOption[] = [
  { label: '启用', value: 'ENABLED' },
  { label: '停用', value: 'DISABLED' },
  { label: '草稿', value: 'DRAFT' }
];

const riskLevelOptions: FieldOption[] = [
  { label: '重大', value: 'MAJOR' },
  { label: '高', value: 'HIGH' },
  { label: '中', value: 'MEDIUM' },
  { label: '低', value: 'LOW' },
  { label: '轻微', value: 'SLIGHT' }
];

const templateTypeOptions: FieldOption[] = [
  { label: '国标模板', value: 'NATIONAL' },
  { label: '行标模板', value: 'INDUSTRY_STANDARD' },
  { label: '行业模板', value: 'INDUSTRY' },
  { label: '自定义', value: 'CUSTOM' }
];

const modelTypeOptions: FieldOption[] = [
  { label: '预置模型', value: 'PRESET' },
  { label: '自定义模型', value: 'CUSTOM' }
];

const riskTypeOptions: FieldOption[] = [
  { label: '访问控制', value: 'ACCESS_CONTROL' },
  { label: '数据安全', value: 'DATA_SECURITY' },
  { label: '数据泄露', value: 'DATA_LEAKAGE' },
  { label: '权限滥用', value: 'PRIVILEGE_ABUSE' }
];

const resourceConfigs: ResourceConfig[] = [
  {
    key: 'assessment',
    label: '评估项模板设置',
    addText: '添加模板',
    columns: [
      { key: 'templateName', label: '模板名称', minWidth: 220 },
      { key: 'templateType', label: '模板类型', width: 150 },
      { key: 'itemCount', label: '评估项数量', width: 120 },
      { key: 'createdAt', label: '创建时间', width: 150 },
      { key: 'status', label: '状态', width: 110 }
    ],
    fields: [
      { key: 'templateName', label: '模板名称', type: 'text' },
      { key: 'templateType', label: '模板类型', type: 'select', options: templateTypeOptions },
      { key: 'status', label: '状态', type: 'select', options: statusOptions }
    ]
  },
  {
    key: 'suggestion',
    label: '风险处置建议管理',
    addText: '添加建议',
    columns: [
      { key: 'suggestionTitle', label: '建议标题', minWidth: 200 },
      { key: 'riskLevel', label: '风险等级', width: 120 },
      { key: 'riskType', label: '风险类型', width: 150 },
      { key: 'suggestionContent', label: '建议内容', minWidth: 320 }
    ],
    fields: [
      { key: 'suggestionTitle', label: '建议标题', type: 'text' },
      { key: 'riskLevel', label: '风险等级', type: 'select', options: riskLevelOptions },
      { key: 'riskType', label: '风险类型', type: 'select', options: riskTypeOptions },
      { key: 'suggestionContent', label: '建议内容', type: 'textarea' },
      { key: 'status', label: '状态', type: 'select', options: statusOptions }
    ]
  },
  {
    key: 'score',
    label: '评分模型管理',
    addText: '添加模型',
    columns: [
      { key: 'modelName', label: '模型名称', minWidth: 220 },
      { key: 'modelType', label: '模型类型', width: 150 },
      { key: 'createdAt', label: '创建时间', width: 160 },
      { key: 'status', label: '状态', width: 110 }
    ],
    fields: [
      { key: 'modelName', label: '模型名称', type: 'text' },
      { key: 'modelType', label: '模型类型', type: 'select', options: modelTypeOptions },
      { key: 'status', label: '状态', type: 'select', options: statusOptions }
    ]
  },
  {
    key: 'harm',
    label: '风险危害程度分析模型管理',
    addText: '添加模型',
    columns: [],
    fields: [
      { key: 'modelName', label: '模型名称', type: 'text' },
      { key: 'description', label: '模型描述', type: 'textarea' },
      { key: 'status', label: '状态', type: 'select', options: statusOptions }
    ]
  },
  {
    key: 'matrix',
    label: '风险评价矩阵管理',
    addText: '新增矩阵',
    columns: [
      { key: 'matrixName', label: '矩阵名称', minWidth: 220 },
      { key: 'createdAt', label: '创建时间', width: 180 },
      { key: 'status', label: '状态', width: 110 }
    ],
    fields: [
      { key: 'matrixName', label: '矩阵名称', type: 'text' },
      { key: 'status', label: '状态', type: 'select', options: statusOptions },
      { key: 'remark', label: '备注', type: 'textarea' }
    ]
  }
];

const matrixHarmAxes = [
  { key: 'VERY_HIGH', label: '很高' },
  { key: 'HIGH', label: '高' },
  { key: 'RELATIVELY_HIGH', label: '较高' },
  { key: 'MEDIUM', label: '中' },
  { key: 'LOW', label: '低' }
];

const matrixPossibilityRows = [
  { key: 'HIGH', label: '高' },
  { key: 'MEDIUM', label: '中' },
  { key: 'LOW', label: '低' }
];

const allRiskLevels = ['MAJOR', 'HIGH', 'MEDIUM', 'LOW', 'SLIGHT'];

const prototypeHarmModels: HarmModel[] = [
  {
    id: 'harm-default',
    modelId: 'harm-default',
    modelName: '默认分析模型',
    description: '通用风险危害程度分析模型',
    status: 'ENABLED',
    version: 'v1',
    rules: []
  },
  {
    id: 'harm-power',
    modelId: 'harm-power',
    modelName: '电力行业分析模型',
    description: '适用于电力行业的风险危害程度分析模型',
    status: 'ENABLED',
    version: 'v1',
    rules: []
  }
];

const activeResource = ref<KnowledgeResource>('assessment');
const loading = ref(false);
const saving = ref(false);
const nestedLoading = ref(false);
const editVisible = ref(false);
const scoreDetailVisible = ref(false);
const matrixDetailVisible = ref(false);
const harmRuleVisible = ref(false);
const editingId = ref('');
const harmRuleEditingId = ref('');
const activeHarmModelId = ref('');
const currentScoreModel = ref<ScoreModel | null>(null);
const currentMatrix = ref<RiskMatrix | null>(null);
const currentForm = ref<FormState>({});
const harmModels = ref<HarmModel[]>([]);
const harmRules = ref<HarmRule[]>([]);

const query = reactive<KnowledgeQuery>({
  pageNo: 1,
  pageSize: 10,
  keyword: '',
  status: undefined
});

const harmRuleQuery = reactive<KnowledgeQuery>({
  pageNo: 1,
  pageSize: 200,
  keyword: ''
});

const rowsByResource = reactive<Record<KnowledgeResource, KnowledgeEntity[]>>({
  assessment: [],
  suggestion: [],
  score: [],
  harm: [],
  matrix: []
});

const totalByResource = reactive<Record<KnowledgeResource, number>>({
  assessment: 0,
  suggestion: 0,
  score: 0,
  harm: 0,
  matrix: 0
});

const matrixRemarkDrafts = reactive<Record<string, string>>({});

const harmRuleForm = reactive<Omit<HarmRule, 'id'>>({
  level: 'HIGH',
  description: '',
  impactObject: '',
  example: '',
  judgementSteps: [],
  sortOrder: 1
});

const activeConfig = computed(() => resourceConfigs.find((item) => item.key === activeResource.value) || resourceConfigs[0]);
const dialogTitle = computed(() => `${editingId.value ? '编辑' : '新增'}${activeConfig.value.label}`);

const rowValue = (row: KnowledgeEntity, key: string): FormValue => (row as unknown as FormState)[key];
const optionLabel = (options: FieldOption[], value: FormValue) => options.find((item) => item.value === value)?.label || String(value || '-');

const getId = (row: KnowledgeEntity | HarmRule): string => {
  const record = row as unknown as Record<string, string | undefined>;
  return record.id || record.templateId || record.suggestionId || record.modelId || record.matrixId || record.ruleId || '';
};

const formatColumnValue = (row: KnowledgeEntity, key: string) => {
  const value = rowValue(row, key);
  if (key === 'templateType') return optionLabel(templateTypeOptions, value);
  if (key === 'modelType') return optionLabel(modelTypeOptions, value);
  if (key === 'riskLevel') return riskLevelName(String(value));
  if (key === 'riskType') return optionLabel(riskTypeOptions, value);
  return value === undefined || value === null || value === '' ? '-' : String(value);
};

const statusLabel = (value: FormValue) => optionLabel(statusOptions, value);
const statusTag = (value: FormValue): 'success' | 'info' | 'warning' => {
  if (value === 'ENABLED') return 'success';
  if (value === 'DRAFT') return 'warning';
  return 'info';
};

const riskLevelName = (value?: string) =>
  ({ MAJOR: '重大', HIGH: '高', MEDIUM: '中', LOW: '低', SLIGHT: '轻微' }[String(value)] || String(value || '-'));

const searchPlaceholder = (resource: KnowledgeResource) =>
  ({
    assessment: '按模板名称模糊查询',
    suggestion: '按建议标题模糊查询',
    score: '按模型名称模糊查询',
    matrix: '按矩阵名称模糊查询',
    harm: '按模型名称模糊查询'
  }[resource]);

const isSamePrototypeModel = (model: HarmModel, expectedName: string, expectedId: string) =>
  getId(model) === expectedId || model.modelName === expectedName;

const ensurePrototypeHarmModels = (models: HarmModel[]) => {
  const next = [...models];
  prototypeHarmModels.forEach((model) => {
    if (!next.some((item) => isSamePrototypeModel(item, model.modelName, getId(model)))) {
      next.push(model);
    }
  });
  return next;
};

const riskTagType = (value: string): 'danger' | 'warning' | 'success' | 'info' => {
  if (value === 'MAJOR') return 'danger';
  if (value === 'HIGH') return 'warning';
  if (value === 'LOW' || value === 'SLIGHT') return 'success';
  return 'info';
};

const scoreRangeLabel = (value: string) => ({ HIGH: '高风险', MEDIUM: '中风险', LOW: '低风险' }[value] || value);

const defaultMatrix = (): RiskMatrixJson => ({
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
});

const normalizeMatrix = (matrix?: RiskMatrixJson): RiskMatrixJson => {
  const normalized = defaultMatrix();
  matrixPossibilityRows.forEach((row) => {
    matrixHarmAxes.forEach((harm) => {
      const value = matrix?.[row.key]?.[harm.key];
      if (value) normalized[row.key][harm.key] = value;
    });
  });
  return normalized;
};

const defaultPayload = (resource: KnowledgeResource): FormState => {
  const defaults: Record<KnowledgeResource, FormState> = {
    assessment: { templateName: '', templateType: 'NATIONAL', status: 'ENABLED', items: [] },
    suggestion: { suggestionTitle: '', riskLevel: 'HIGH', riskType: 'ACCESS_CONTROL', suggestionContent: '', status: 'ENABLED' },
    score: {
      modelName: '',
      modelType: 'CUSTOM',
      status: 'ENABLED',
      resultScores: { COMPLIANT: 1, PARTIAL: 0.5, NON_COMPLIANT: 0, NOT_APPLICABLE: null },
      possibilityRanges: [
        { level: 'HIGH', min: 0, max: 30, includeMin: true, includeMax: false },
        { level: 'MEDIUM', min: 30, max: 75, includeMin: true, includeMax: false },
        { level: 'LOW', min: 75, max: 100, includeMin: true, includeMax: true }
      ]
    },
    harm: { modelName: '', description: '', status: 'ENABLED', rules: [] },
    matrix: { matrixName: '', status: 'ENABLED', remark: '', matrixJson: defaultMatrix() }
  };
  return JSON.parse(JSON.stringify(defaults[resource])) as FormState;
};

const scoreResultScores = computed(() => {
  const value = currentForm.value.resultScores;
  return (value && typeof value === 'object' && !Array.isArray(value) ? value : defaultPayload('score').resultScores) as ScoreModel['resultScores'];
});

const formatScoreCoefficient = (value?: number | null) => String(value ?? 0);
const scorePartialCoefficient = computed(() => formatScoreCoefficient(scoreResultScores.value.PARTIAL));

const scoreRanges = computed(() => {
  const value = currentForm.value.possibilityRanges;
  return (Array.isArray(value) ? value : defaultPayload('score').possibilityRanges) as ScoreRange[];
});

const matrixJson = computed(() => {
  const value = currentForm.value.matrixJson;
  return (value && typeof value === 'object' && !Array.isArray(value) ? value : defaultMatrix()) as RiskMatrixJson;
});

const currentMatrixJson = computed(() => normalizeMatrix(currentMatrix.value?.matrixJson));

const syncMatrixRemarks = () => {
  (rowsByResource.matrix as RiskMatrix[]).forEach((row) => {
    matrixRemarkDrafts[getId(row)] = row.remark || '';
  });
};

const loadActive = async () => {
  loading.value = true;
  try {
    const page = await knowledgeApi.list(activeResource.value, query);
    rowsByResource[activeResource.value] = page.list;
    totalByResource[activeResource.value] = page.total;

    if (activeResource.value === 'matrix') syncMatrixRemarks();
    if (activeResource.value === 'harm') {
      harmModels.value = useMock ? ensurePrototypeHarmModels(page.list as HarmModel[]) : page.list as HarmModel[];
      if (!activeHarmModelId.value || !harmModels.value.some((item) => getId(item) === activeHarmModelId.value)) {
        activeHarmModelId.value = harmModels.value[0] ? getId(harmModels.value[0]) : '';
      }
      await loadHarmRules();
    }
  } finally {
    loading.value = false;
  }
};

const reloadFirstPage = () => {
  query.pageNo = 1;
  loadActive();
};

const resetQuery = () => {
  query.keyword = '';
  query.status = undefined;
  reloadFirstPage();
};

const onTabChange = () => {
  query.pageNo = 1;
  query.keyword = '';
  query.status = undefined;
  if (!editVisible.value) currentForm.value = defaultPayload(activeResource.value);
  loadActive();
};

const openCreate = (resource: KnowledgeResource) => {
  activeResource.value = resource;
  editingId.value = '';
  currentForm.value = defaultPayload(resource);
  editVisible.value = true;
};

const openEdit = (resource: KnowledgeResource, row: KnowledgeEntity) => {
  activeResource.value = resource;
  editingId.value = getId(row);
  const cloned = JSON.parse(JSON.stringify(row)) as FormState;
  if (resource === 'matrix') cloned.matrixJson = normalizeMatrix(cloned.matrixJson as RiskMatrixJson);
  currentForm.value = { ...defaultPayload(resource), ...cloned };
  editVisible.value = true;
};

const validateCurrent = async () => {
  if (activeResource.value === 'score') {
    const result = validateScoreRanges(scoreRanges.value);
    if (result !== true) {
      ElMessage.error(result);
      return false;
    }
    await knowledgeApi.validateScoreModel(currentForm.value, editingId.value || undefined);
  }

  if (activeResource.value === 'matrix') {
    matrixPossibilityRows.forEach((row) => {
      matrixHarmAxes.forEach((harm) => {
        if (!matrixJson.value[row.key]) matrixJson.value[row.key] = {};
        if (!allRiskLevels.includes(matrixJson.value[row.key][harm.key])) {
          matrixJson.value[row.key][harm.key] = 'LOW';
        }
      });
    });
    await knowledgeApi.validateRiskMatrix(currentForm.value, editingId.value || undefined);
  }
  return true;
};

const saveCurrent = async () => {
  if (!(await validateCurrent())) return;
  saving.value = true;
  try {
    if (editingId.value) {
      const response = await knowledgeApi.update(activeResource.value, editingId.value, currentForm.value as unknown as Omit<KnowledgeEntity, 'id'>);
      notifyApiSuccess(response, '知识库条目已更新');
    } else {
      const saved = await knowledgeApi.create(activeResource.value, currentForm.value as unknown as Omit<KnowledgeEntity, 'id'>);
      if (activeResource.value === 'harm') activeHarmModelId.value = getId(saved.data);
      notifyApiSuccess(saved, '知识库条目已新增');
    }
    editVisible.value = false;
    await loadActive();
  } finally {
    saving.value = false;
  }
};

const deleteRow = async (resource: KnowledgeResource, row: KnowledgeEntity) => {
  await ElMessageBox.confirm('被项目引用的知识库条目删除时，后端会自动改为停用。确认继续？', '删除确认', { type: 'warning' });
  const result = await knowledgeApi.delete(resource, getId(row));
  if (result.data?.disabledDueToReference) {
    ElMessage.warning(successMessage(result, '该条目已被项目引用，后端已改为停用状态'));
  } else {
    notifyApiSuccess(result, '知识库条目已删除');
  }
  await loadActive();
};

const exportTemplate = async (row: KnowledgeEntity) => {
  const data = await knowledgeApi.exportAssessmentTemplate(getId(row));
  exportJsonFile(`评估模板-${getId(row)}.json`, data);
  ElMessage.success('评估模板已导出');
};

const openScoreDetail = async (row: KnowledgeEntity) => {
  currentScoreModel.value = await knowledgeApi.detail<ScoreModel>('score', getId(row));
  scoreDetailVisible.value = true;
};

const openMatrixDetail = async (row: KnowledgeEntity) => {
  currentMatrix.value = await knowledgeApi.detail<RiskMatrix>('matrix', getId(row));
  matrixDetailVisible.value = true;
};

const saveMatrixRemark = async (row: KnowledgeEntity) => {
  const id = getId(row);
  const matrix = row as RiskMatrix;
  const response = await knowledgeApi.update('matrix', id, { ...matrix, remark: matrixRemarkDrafts[id] || '' } as Omit<RiskMatrix, 'id'>);
  notifyApiSuccess(response, '备注已保存');
  await loadActive();
};

const loadHarmRules = async () => {
  if (!activeHarmModelId.value) {
    harmRules.value = [];
    return;
  }
  nestedLoading.value = true;
  try {
    const page = await knowledgeApi.listHarmRules(activeHarmModelId.value, harmRuleQuery);
    harmRules.value = page.list;
  } catch (error) {
    harmRules.value = [];
    notifyApiError(error, '危害程度规则加载失败，请重试');
  } finally {
    nestedLoading.value = false;
  }
};

const openHarmRule = (row?: HarmRule) => {
  harmRuleEditingId.value = row ? getId(row) : '';
  Object.assign(
    harmRuleForm,
    {
      level: 'HIGH',
      description: '',
      impactObject: '',
      example: '',
      judgementSteps: [],
      sortOrder: harmRules.value.length + 1
    },
    row || {}
  );
  harmRuleVisible.value = true;
};

const saveHarmRule = async () => {
  if (!activeHarmModelId.value) return;
  let response;
  if (harmRuleEditingId.value) {
    response = await knowledgeApi.updateHarmRule(activeHarmModelId.value, harmRuleEditingId.value, harmRuleForm);
  } else {
    response = await knowledgeApi.createHarmRule(activeHarmModelId.value, harmRuleForm);
  }
  harmRuleVisible.value = false;
  notifyApiSuccess(response, '风险等级规则已保存');
  await loadHarmRules();
};

const deleteHarmRule = async (row: HarmRule) => {
  await ElMessageBox.confirm('确认删除该风险等级规则？', '删除确认', { type: 'warning' });
  const response = await knowledgeApi.deleteHarmRule(activeHarmModelId.value, getId(row));
  notifyApiSuccess(response, '规则已删除');
  await loadHarmRules();
};

const handleImportRules = () => {
  ElMessage.info('导入模板入口已按原型保留，后端导入接口待确认后接入');
};

const riskCellClass = (value?: string) =>
  ({
    MAJOR: 'risk-cell-major',
    HIGH: 'risk-cell-high',
    MEDIUM: 'risk-cell-medium',
    LOW: 'risk-cell-low',
    SLIGHT: 'risk-cell-slight'
  }[String(value)] || 'risk-cell-low');

onMounted(() => {
  currentForm.value = defaultPayload('assessment');
  loadActive();
});
</script>

<style scoped>
.model-tabs-bar {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.model-tabs {
  flex: 1;
  min-width: 0;
}

.toolbar-spacer {
  flex: 1 1 auto;
}

.config-section {
  padding: 16px 0;
  border-top: 1px solid var(--el-border-color-lighter);
}

.config-section:first-of-type {
  border-top: 0;
}

.config-section h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
}

.config-section p {
  margin: 0 0 14px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.score-value-form-item :deep(.el-form-item__content) {
  min-width: 0;
}

.score-value-input {
  width: 128px;
  max-width: 100%;
}

.score-value-input :deep(.el-input__inner) {
  text-align: center;
}

.formula-box {
  padding: 14px 16px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  line-height: 1.8;
}

.range-grid {
  display: grid;
  gap: 12px;
}

.range-row {
  display: grid;
  grid-template-columns: 86px 1fr auto 1fr;
  align-items: center;
  gap: 10px;
  max-width: 620px;
}

.matrix-wrap {
  overflow-x: auto;
}

.risk-matrix {
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;
  table-layout: fixed;
  text-align: center;
}

.risk-matrix th {
  padding: 12px 8px;
  border: 1px solid var(--el-border-color);
  background: var(--el-color-primary);
  color: #fff;
  font-weight: 600;
}

.risk-matrix td {
  padding: 8px;
  border: 1px solid var(--el-border-color);
  font-weight: 500;
}

.axis-cell {
  background: var(--el-fill-color-light);
}

.remark-editor {
  display: flex;
  align-items: center;
  gap: 8px;
}

.readonly-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.readonly-grid span {
  padding: 12px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
}

.risk-cell-major {
  background: #f8d7da;
  color: #721c24;
}

.risk-cell-high {
  background: #fff3cd;
  color: #856404;
}

.risk-cell-medium {
  background: #d1ecf1;
  color: #0c5460;
}

.risk-cell-low {
  background: #d4edda;
  color: #155724;
}

.risk-cell-slight {
  background: #c3e6cb;
  color: #155724;
}

@media (max-width: 768px) {
  .model-tabs-bar {
    flex-direction: column;
  }

  .range-row {
    grid-template-columns: 1fr;
  }
}
</style>
