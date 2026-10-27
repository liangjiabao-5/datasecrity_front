<template>
  <div
    v-loading="refreshing"
    element-loading-text="正在逐条生成风险描述、风险源描述和整改建议，请勿重复操作"
    element-loading-background="rgba(255, 255, 255, 0.82)"
  >
    <ProjectHeader current-step="summary" />

    <div class="panel panel-pad">
      <div class="workflow-panel-actions">
        <el-button type="primary" :icon="Refresh" :loading="refreshing" :disabled="refreshing" @click="openRefreshDialog">
          刷新汇总分析
        </el-button>
        <el-button type="success" @click="router.push(`/projects/${projectId}/reports`)">下一步</el-button>
      </div>

      <el-alert
        title="风险清单会基于现场测评中符合情况为基本符合或不符合的记录生成，并与风险源、风险清单、处置建议保持一对一。"
        type="warning"
        show-icon
        :closable="false"
        style="margin-bottom: 16px"
      />

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="数据安全风险源清单" name="sources">
          <div class="summary-tab-actions">
            <div class="summary-merge-switch">
              <span>是否合并</span>
              <el-switch v-model="mergeEnabled" :loading="mergeLoading" @change="handleMergeChange" />
              <el-button
                type="primary"
                :icon="Refresh"
                :loading="mergeUpdating"
                :disabled="!mergeEnabled || mergeLoading"
                @click="updateMergeData"
              >
                更新合并
              </el-button>
            </div>
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept=".xlsx,.xls"
              :disabled="importingTab === 'sources'"
              :on-change="(file: UploadFile) => importRiskSummary('sources', file)"
            >
              <el-button :icon="Upload" :loading="importingTab === 'sources'">导入</el-button>
            </el-upload>
            <el-button :icon="Download" :loading="exportingTab === 'sources'" @click="exportRiskSummary('sources')">
              导出
            </el-button>
          </div>
          <el-table v-loading="loading" :data="riskSources" border>
            <el-table-column type="index" label="序号" width="70" :index="sourceIndex" />
            <el-table-column label="评估项ID" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">{{ formatAssessmentItemId(row.assessmentItemId) }}</template>
            </el-table-column>
            <el-table-column label="评估子类" min-width="220" show-overflow-tooltip>
              <template #default="{ row }">{{ formatNullableText(row.assessmentSubcategory) }}</template>
            </el-table-column>
            <el-table-column prop="checkPoint" label="检查要点" min-width="180" show-overflow-tooltip />
            <el-table-column prop="evaluationRecord" label="评估结果" min-width="220" show-overflow-tooltip />
            <el-table-column label="风险描述" min-width="240" show-overflow-tooltip>
              <template #default="{ row }"><span class="analysis-text">{{ formatAiText(row, 'riskDescription') }}</span></template>
            </el-table-column>
            <el-table-column label="风险源描述" min-width="260" show-overflow-tooltip>
              <template #default="{ row }"><span class="analysis-text">{{ formatAiText(row, 'riskSourceDescription') }}</span></template>
            </el-table-column>
            <el-table-column label="风险源类型" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">{{ formatNullableText(row.riskSourceType) }}</template>
            </el-table-column>
            <el-table-column label="风险类型" min-width="160">
              <template #default="{ row }">{{ formatList(row.riskTypes) }}</template>
            </el-table-column>
            <el-table-column label="涉及的数据及类型、级别" min-width="220" show-overflow-tooltip>
              <template #default="{ row }">{{ formatNullableText(row.relatedData) }}</template>
            </el-table-column>
            <el-table-column label="涉及的数据处理活动" min-width="180">
              <template #default="{ row }">{{ formatProcessingActivityList(row.relatedActivities) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="170" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openEdit(row)">修改</el-button>
                <el-button link @click="openAnalysisBasis(row)">生成依据</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="summary-pagination">
            <el-pagination
              v-model:current-page="pagination.sources.pageNo"
              v-model:page-size="pagination.sources.pageSize"
              background
              layout="total, sizes, prev, pager, next, jumper"
              :total="pagination.sources.total"
              :page-sizes="[10, 20, 50]"
              @current-change="handlePageChange('sources')"
              @size-change="handlePageSizeChange('sources')"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="数据安全风险清单" name="items">
          <div class="summary-tab-actions">
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept=".xlsx,.xls"
              :disabled="importingTab === 'items'"
              :on-change="(file: UploadFile) => importRiskSummary('items', file)"
            >
              <el-button :icon="Upload" :loading="importingTab === 'items'">导入</el-button>
            </el-upload>
            <el-button :icon="Download" :loading="exportingTab === 'items'" @click="exportRiskSummary('items')">
              导出
            </el-button>
            <el-button type="primary" :icon="DataAnalysis" :loading="batchAnalyzing" @click="suggestCurrentPageHarm">
              批量辅助判定
            </el-button>
          </div>
          <el-table v-loading="loading" :data="riskItems" border>
            <el-table-column type="index" label="序号" width="70" :index="itemIndex" />
            <el-table-column label="评估项ID" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">{{ formatAssessmentItemId(row.assessmentItemId) }}</template>
            </el-table-column>
            <el-table-column label="风险描述" min-width="220" show-overflow-tooltip>
              <template #default="{ row }"><span class="analysis-text">{{ formatAiText(row, 'riskDescription') }}</span></template>
            </el-table-column>
            <el-table-column prop="harmLevel" label="危害程度" width="120">
              <template #default="{ row }">
                <el-tag :type="levelTagType(row.harmLevel)" effect="plain">{{ formatAssessmentLevel(row.harmLevel) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="harmAnalysisStatus" label="判定状态" width="130">
              <template #default="{ row }">
                <el-tag :type="harmAnalysisStatusTagType(row)" effect="plain">
                  {{ formatHarmAnalysisStatus(row) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="harmDescription" label="危害程度分析" min-width="240" show-overflow-tooltip />
            <el-table-column prop="harmImpactObject" label="影响对象" min-width="160" show-overflow-tooltip />
            <el-table-column prop="possibilityLevel" label="发生可能性" width="120">
              <template #default="{ row }">
                <el-tag :type="levelTagType(row.possibilityLevel)" effect="plain">{{ formatPossibilityLevel(row.possibilityLevel) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="风险源描述" min-width="240" show-overflow-tooltip>
              <template #default="{ row }"><span class="analysis-text">{{ formatAiText(row, 'riskSourceDescription') }}</span></template>
            </el-table-column>
            <el-table-column label="风险类型" min-width="150">
              <template #default="{ row }">{{ formatList(row.riskTypes) }}</template>
            </el-table-column>
            <el-table-column prop="riskLevel" label="风险等级" width="120">
              <template #default="{ row }">
                <el-tag :type="levelTagType(linkedRiskItemLevel(row))" effect="plain">
                  {{ formatRiskLevel(linkedRiskItemLevel(row)) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="relatedData" label="涉及的数据及类型、级别" min-width="220" show-overflow-tooltip />
            <el-table-column label="涉及的数据处理活动" min-width="180">
              <template #default="{ row }">{{ formatProcessingActivityList(row.relatedActivities) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="310" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openEdit(row)">修改</el-button>
                <el-button link @click="openAnalysisBasis(row)">生成依据</el-button>
                <el-button
                  link
                  type="primary"
                  :loading="harmAnalyzingId === row.id"
                  @click="suggestRowHarm(row)"
                >
                  {{ getHarmAnalysisDisplayStatus(row) === 'PENDING' ? '辅助判定' : '重新判定' }}
                </el-button>
                <el-button link :disabled="!hasHarmAnalysis(row)" @click="openHarmAnalysisDetail(row)">
                  {{ hasHarmSuggestionDraft(row) ? '查看建议' : '查看判定' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="summary-pagination">
            <el-pagination
              v-model:current-page="pagination.items.pageNo"
              v-model:page-size="pagination.items.pageSize"
              background
              layout="total, sizes, prev, pager, next, jumper"
              :total="pagination.items.total"
              :page-sizes="[10, 20, 50]"
              @current-change="handlePageChange('items')"
              @size-change="handlePageSizeChange('items')"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="数据安全风险处置建议" name="suggestions">
          <el-table v-loading="loading" :data="riskSuggestions" border>
            <el-table-column type="index" label="序号" width="70" :index="suggestionIndex" />
            <el-table-column label="评估项ID" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">{{ formatAssessmentItemId(row.assessmentItemId) }}</template>
            </el-table-column>
            <el-table-column label="风险描述" min-width="240" show-overflow-tooltip>
              <template #default="{ row }"><span class="analysis-text">{{ formatAiText(row, 'riskDescription') }}</span></template>
            </el-table-column>
            <el-table-column label="风险源描述" min-width="260" show-overflow-tooltip>
              <template #default="{ row }"><span class="analysis-text">{{ formatAiText(row, 'riskSourceDescription') }}</span></template>
            </el-table-column>
            <el-table-column prop="riskLevel" label="风险等级" width="120">
              <template #default="{ row }">
                <el-tag :type="levelTagType(row.riskLevel)" effect="plain">{{ formatRiskLevel(row.riskLevel) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="整改建议" min-width="280" show-overflow-tooltip>
              <template #default="{ row }"><span class="analysis-text">{{ formatAiText(row, 'remediationSuggestion') }}</span></template>
            </el-table-column>
            <el-table-column label="操作" width="170" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openEdit(row)">修改</el-button>
                <el-button link @click="openAnalysisBasis(row)">生成依据</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="summary-pagination">
            <el-pagination
              v-model:current-page="pagination.suggestions.pageNo"
              v-model:page-size="pagination.suggestions.pageSize"
              background
              layout="total, sizes, prev, pager, next, jumper"
              :total="pagination.suggestions.total"
              :page-sizes="[10, 20, 50]"
              @current-change="handlePageChange('suggestions')"
              @size-change="handlePageSizeChange('suggestions')"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="importErrorVisible" title="汇总分析导入异常明细" width="860px">
      <el-alert
        :title="`已导入 ${importImportedCount} 条，发现 ${importFailedCount} 条异常明细。请检查提示行后重新导入。`"
        type="warning"
        show-icon
        :closable="false"
        style="margin-bottom: 16px"
      />
      <el-table :data="importErrorRows" border max-height="360" empty-text="接口未返回异常明细">
        <el-table-column prop="rowNo" label="行号" width="100" />
        <el-table-column prop="field" label="字段" width="180" />
        <el-table-column prop="reason" label="原因" min-width="360" show-overflow-tooltip />
      </el-table>
      <template #footer>
        <el-button type="primary" @click="importErrorVisible = false">知道了</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="refreshDialogVisible"
      title="刷新汇总分析"
      width="620px"
      :close-on-click-modal="!refreshing"
      :close-on-press-escape="!refreshing"
      :show-close="!refreshing"
    >
      <el-alert
        title="将根据最新现场测评结果刷新风险汇总，并重新加载三个列表。请选择本次对人工修改内容的处理方式。"
        type="info"
        show-icon
        :closable="false"
        style="margin-bottom: 16px"
      />
      <el-radio-group v-model="refreshMode" class="refresh-mode-options">
        <el-radio label="normal" border>
          <span class="refresh-mode-title">保留人工内容（推荐）</span>
          <span class="refresh-mode-description">仅更新未人工锁定的记录；已人工修改的内容与评审结果保持不变。</span>
        </el-radio>
        <el-radio label="overwrite" border>
          <span class="refresh-mode-title">覆盖人工内容并重新生成</span>
          <span class="refresh-mode-description">以最新现场测评重新生成全部记录；AI 成功时解除人工锁定，失败或未配置时由服务端保留人工内容。</span>
        </el-radio>
      </el-radio-group>
      <el-alert
        v-if="refreshMode === 'overwrite'"
        title="该操作会覆盖已人工确认的风险内容和后续评审结果，请确认已不再需要保留这些修改。"
        type="warning"
        show-icon
        :closable="false"
        style="margin-top: 16px"
      />

      <template #footer>
        <el-button :disabled="refreshing" @click="refreshDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="refreshing" @click="confirmRefresh">
          {{ refreshMode === 'overwrite' ? '确认覆盖并刷新' : '开始刷新' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editVisible" title="修改风险记录" width="760px">
      <el-form :model="editForm" label-width="130px">
        <template v-if="activeTab === 'sources'">
          <el-form-item label="风险类型">
            <el-select v-model="editForm.riskTypes" multiple filterable allow-create default-first-option style="width: 100%">
              <el-option label="数据泄露" value="DATA_LEAKAGE" />
              <el-option label="数据篡改" value="DATA_TAMPERING" />
              <el-option label="权限滥用" value="PRIVILEGE_ABUSE" />
            </el-select>
          </el-form-item>
          <el-form-item label="风险描述">
            <el-input v-model="editForm.riskDescription" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="风险源描述">
            <el-input v-model="editForm.riskSourceDescription" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="涉及的数据处理活动">
            <el-select
              v-model="sourceRelatedActivityValues"
              multiple
              filterable
              collapse-tags
              placeholder="请选择涉及的数据处理活动"
              style="width: 100%"
              @change="handleSourceRelatedActivitiesChange"
            >
              <el-option v-for="item in relatedActivitySelectOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="涉及的数据及类型、级别">
            <el-select
              v-model="sourceRelatedDataValues"
              multiple
              filterable
              collapse-tags
              :disabled="!sourceRelatedActivityValues.length"
              placeholder="请先选择涉及的数据处理活动"
              style="width: 100%"
            >
              <el-option v-for="item in relatedDataSelectOptions" :key="item" :label="item" :value="item" />
            </el-select>
            <el-alert
              v-if="!sourceRelatedActivityValues.length"
              title="请先选择涉及的数据处理活动，再选择对应的数据及类型、级别。"
              type="info"
              show-icon
              :closable="false"
              style="margin-top: 8px"
            />
            <el-alert
              v-else-if="!relatedDataOptions.length"
              title="所选处理活动未匹配到数据资产，请到信息调研维护数据处理活动、数据类别和数据级别。"
              type="info"
              show-icon
              :closable="false"
              style="margin-top: 8px"
            />
          </el-form-item>
        </template>
        <template v-if="activeTab === 'items'">
          <el-form-item label="危害程度">
            <el-select v-model="editForm.harmLevel" placeholder="请选择危害程度" style="width: 100%">
              <el-option label="待评估" value="-" />
              <el-option label="很高" value="VERY_HIGH" />
              <el-option label="高" value="HIGH" />
              <el-option label="较高" value="RELATIVELY_HIGH" />
              <el-option label="中" value="MEDIUM" />
              <el-option label="低" value="LOW" />
            </el-select>
          </el-form-item>
          <el-form-item label="发生可能性">
            <el-select v-model="editForm.possibilityLevel" placeholder="请选择发生可能性" style="width: 100%">
              <el-option label="待评估" value="-" />
              <el-option label="高" value="HIGH" />
              <el-option label="中" value="MEDIUM" />
              <el-option label="低" value="LOW" />
            </el-select>
          </el-form-item>
          <el-form-item label="风险等级">
            <el-tag :type="levelTagType(linkedEditRiskLevel)" effect="plain">
              {{ formatRiskLevel(linkedEditRiskLevel) }}
            </el-tag>
          </el-form-item>
        </template>
        <el-form-item v-if="activeTab === 'suggestions'" label="整改建议">
          <el-input v-model="editForm.remediationSuggestion" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">确定</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="analysisBasisVisible" title="AI 生成依据" size="620px">
      <template v-if="analysisBasisRow">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="AI 状态">
            <el-tag :type="analysisStatusTagType(analysisBasisRow.analysisStatus)" effect="plain">
              {{ formatAnalysisStatus(analysisBasisRow.analysisStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="analysisBasisRow.manualAdjusted" label="人工修改">
            <el-tag type="warning" effect="plain">已人工修改，本行已锁定</el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="analysisBasisRow.analysisProvider" label="模型提供方">
            {{ analysisBasisRow.analysisProvider }}
          </el-descriptions-item>
          <el-descriptions-item v-if="analysisBasisRow.analysisModel" label="模型名称">
            {{ analysisBasisRow.analysisModel }}
          </el-descriptions-item>
        </el-descriptions>

        <el-alert
          v-if="analysisBasisRow.analysisStatus !== 'SUCCESS' && analysisBasisRow.analysisErrorMessage"
          :title="analysisBasisRow.analysisErrorMessage"
          type="warning"
          show-icon
          :closable="false"
          style="margin-top: 16px"
        />

        <el-collapse style="margin-top: 16px">
          <el-collapse-item title="实施要求" name="implementation-points">
            <div class="analysis-basis-text">{{ formatNullableText(analysisBasisRow.implementationPoints) }}</div>
          </el-collapse-item>
          <el-collapse-item title="现场测评结果" name="evaluation-record">
            <div class="analysis-basis-text">{{ formatNullableText(analysisBasisRow.evaluationRecord) }}</div>
          </el-collapse-item>
        </el-collapse>
      </template>
      <el-empty v-else description="暂无生成依据" />
    </el-drawer>

    <el-dialog v-model="harmAnalysisVisible" :title="harmAnalysisDialogTitle" width="860px">
      <template v-if="harmAnalysisSuggestion">
        <el-alert
          v-if="isHarmSuggestionDraftVisible"
          title="当前为尚未写入风险清单的辅助判定建议，确认应用后判定状态将变为“已确认”。"
          type="info"
          show-icon
          :closable="false"
          style="margin-bottom: 16px"
        />
        <el-alert
          v-if="harmAnalysisSuggestion.needsManualReview"
          title="当前建议需要人工复核后再应用。"
          type="warning"
          show-icon
          :closable="false"
          style="margin-bottom: 16px"
        />
        <div class="harm-section-title">判定结果摘要</div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="风险危害程度">
            <el-tag :type="levelTagType(harmAnalysisSuggestion.harmLevel)" effect="plain">
              {{ formatSuggestedHarmLevel(harmAnalysisSuggestion) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="模型状态">
            {{ formatLlmStatus(harmAnalysisSuggestion.llmStatus) }}
          </el-descriptions-item>
          <el-descriptions-item label="模型名称" :span="2">
            {{ harmAnalysisSuggestion.llmModel || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="影响对象" :span="2">
            {{ harmAnalysisSuggestion.harmImpactObject || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="危害程度分析" :span="2">
            {{ harmAnalysisSuggestion.harmDescription || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="危害程度示例" :span="2">
            {{ harmAnalysisSuggestion.harmExample || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="harm-trace">
          <strong>四步判定过程</strong>
          <ol>
            <li v-for="item in formatHarmTraceSteps(harmAnalysisSuggestion.harmAnalysisTrace)" :key="item.key">
              <span class="harm-step-title">{{ item.title }}</span>
              <span>{{ item.content }}</span>
              <div v-if="item.reason || item.basis.length || item.evidence.length" class="harm-step-extra">
                <div v-if="item.reason" class="harm-step-extra-item">
                  <span class="harm-step-extra-title">模型判断原因</span>
                  <p>{{ item.reason }}</p>
                </div>
                <div v-if="item.basis.length" class="harm-step-extra-item">
                  <span class="harm-step-extra-title">判定使用的信息</span>
                  <ul class="harm-step-list">
                    <li v-for="basis in item.basis" :key="basis">{{ basis }}</li>
                  </ul>
                </div>
                <details v-if="item.evidence.length" class="harm-evidence">
                  <summary>模型引用证据</summary>
                  <ul class="harm-step-list">
                    <li v-for="evidence in item.evidence" :key="evidence">{{ evidence }}</li>
                  </ul>
                </details>
              </div>
            </li>
          </ol>
        </div>
      </template>
      <el-empty v-else description="暂无辅助判定结果" />

      <template #footer>
        <el-button @click="harmAnalysisVisible = false">关闭</el-button>
        <el-button
          v-if="isHarmSuggestionDraftVisible"
          type="primary"
          :disabled="!harmAnalysisSuggestion || isEmptyLevel(harmAnalysisSuggestion.harmLevel)"
          :loading="harmApplying"
          @click="applyHarmAnalysis"
        >
          确认应用
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { notifyApiError } from '@/utils/apiFeedback';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { UploadFile } from 'element-plus';
import { DataAnalysis, Download, Refresh, Upload } from '@element-plus/icons-vue';
import ProjectHeader from '@/components/ProjectHeader.vue';
import { projectApi } from '@/api/projectApi';
import { riskApi } from '@/api/riskApi';
import { notifyApiSuccess } from '@/utils/apiFeedback';
import type { RiskMatrixJson } from '@/types/knowledge';
import type {
  HarmAnalysisStatus,
  HarmAnalysisSuggestion,
  HarmAnalysisTrace,
  RiskItem,
  RiskAnalysisStatus,
  RiskSource,
  RiskSuggestion,
  RiskSummaryRefreshResult
} from '@/types/risk';
import { downloadBlobFile } from '@/utils/fileActions';
import { formatProcessingActivityList, processingActivityLabels, riskLevelLabels } from '@/utils/labels';
import { normalizeRiskSummaryExcelImportResult, type RiskSummaryImportError } from '@/utils/riskSummaryExcelImportResult';
import { calculateRiskLevelByMatrix } from '@/utils/riskMatrix';

type SummaryTab = 'sources' | 'items' | 'suggestions';
type ImportableSummaryTab = Extract<SummaryTab, 'sources' | 'items'>;
type RefreshMode = 'normal' | 'overwrite';
type EditForm = Partial<RiskSource & RiskItem & RiskSuggestion>;
type HarmAnalysisDisplayStatus = HarmAnalysisStatus | 'SUGGESTION_PENDING';
type SummaryPagination = {
  pageNo: number;
  pageSize: number;
  total: number;
};
type RiskMergeErrorResponse = {
  code?: string;
  message?: string;
  data?: unknown;
};
type RiskAnalysisRow = RiskSource | RiskItem | RiskSuggestion;
type AiTextField = 'riskDescription' | 'riskSourceDescription' | 'remediationSuggestion';

const route = useRoute();
const router = useRouter();
const projectId = String(route.params.projectId || '');
const loading = ref(false);
const refreshing = ref(false);
const refreshDialogVisible = ref(false);
const refreshMode = ref<RefreshMode>('normal');
const activeTab = ref<SummaryTab>('sources');
const riskSources = ref<RiskSource[]>([]);
const riskItems = ref<RiskItem[]>([]);
const riskSuggestions = ref<RiskSuggestion[]>([]);
const mergeEnabled = ref(false);
const confirmedMergeEnabled = ref(false);
const mergeLoading = ref(false);
const mergeUpdating = ref(false);
const importingTab = ref<ImportableSummaryTab | ''>('');
const exportingTab = ref<ImportableSummaryTab | ''>('');
const importErrorVisible = ref(false);
const importErrorRows = ref<RiskSummaryImportError[]>([]);
const importImportedCount = ref(0);
const importFailedCount = ref(0);
const relatedDataOptions = ref<string[]>([]);
const relatedActivityOptions = ref<string[]>([]);
const sourceRelatedDataValues = ref<string[]>([]);
const sourceRelatedActivityValues = ref<string[]>([]);
const editVisible = ref(false);
const editingId = ref('');
const editMergedRiskRecordIds = ref<string[]>([]);
const editForm = reactive<EditForm>({});
const analysisBasisVisible = ref(false);
const analysisBasisRow = ref<RiskAnalysisRow | null>(null);
const harmAnalysisVisible = ref(false);
const harmAnalyzingId = ref('');
const batchAnalyzing = ref(false);
const harmApplying = ref(false);
const harmAnalysisSuggestion = ref<HarmAnalysisSuggestion | null>(null);
const harmAnalysisRiskItemId = ref('');
const harmAnalysisMergedRiskRecordIds = ref<string[]>([]);
const harmAnalysisSuggestions = ref<Record<string, HarmAnalysisSuggestion>>({});
const projectRiskMatrix = ref<RiskMatrixJson>({});
const matrixLoaded = ref(false);
const pagination = reactive<Record<SummaryTab, SummaryPagination>>({
  sources: { pageNo: 1, pageSize: 10, total: 0 },
  items: { pageNo: 1, pageSize: 10, total: 0 },
  suggestions: { pageNo: 1, pageSize: 10, total: 0 }
});

const riskSummaryTabNames: Record<ImportableSummaryTab, string> = {
  sources: '数据安全风险源清单',
  items: '数据安全风险清单'
};

const defaultRelatedActivityOptions = [
  '收集',
  '传输',
  '存储',
  '使用和加工',
  '提供',
  '公开',
  '删除'
];
const harmAnalysisBatchLimit = 20;

const harmLevelLabels: Record<string, string> = {
  VERY_HIGH: '很高',
  HIGH: '高',
  RELATIVELY_HIGH: '较高',
  MEDIUM: '中',
  LOW: '低'
};

const possibilityLabels: Record<string, string> = {
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低'
};

const harmAnalysisStatusLabels: Record<HarmAnalysisDisplayStatus, string> = {
  PENDING: '待判定',
  CONFIRMED: '已确认',
  MANUAL: '人工填写',
  SUGGESTION_PENDING: '建议待确认'
};

const llmStatusLabels: Record<string, string> = {
  SUCCESS: '大模型判定',
  FALLBACK: '规则兜底',
  DISABLED: '未启用大模型',
  PROVIDED: '联调回放'
};

const formatAssessmentItemId = (value?: string | null) => (value?.trim() ? value.trim() : '-');
const formatNullableText = (value?: string | null) => (value?.trim() ? value.trim() : '-');
const formatList = (value?: string[]) => (value?.length ? value.join('、') : '-');
const analysisStatusLabels: Record<RiskAnalysisStatus, string> = {
  SUCCESS: '已生成',
  PENDING: '待生成',
  DISABLED: '未配置模型',
  FAILED: '生成失败'
};
const formatAnalysisStatus = (value?: RiskAnalysisStatus) => analysisStatusLabels[value || 'PENDING'];
const analysisStatusTagType = (value?: RiskAnalysisStatus) => {
  if (value === 'SUCCESS') return 'success';
  if (value === 'FAILED') return 'danger';
  if (value === 'DISABLED') return 'warning';
  return 'info';
};
const formatAiText = (row: RiskAnalysisRow, field: AiTextField) => {
  if (row.analysisStatus === 'PENDING') return '待生成';
  if (row.analysisStatus === 'FAILED') return '生成失败';
  if (row.analysisStatus === 'DISABLED') return '未生成';
  const value = field === 'remediationSuggestion'
    ? ('remediationSuggestion' in row ? row.remediationSuggestion : undefined)
    : row[field];
  if (typeof value === 'string' && value.trim()) return value.trim();
  return '-';
};
const isEmptyLevel = (value?: string) => !value || value === '-';
const formatAssessmentLevel = (value?: string) => (isEmptyLevel(value) ? '待评估' : harmLevelLabels[value || ''] || value || '');
const formatSuggestedHarmLevel = (suggestion: HarmAnalysisSuggestion) =>
  suggestion.harmLevelName?.trim() || formatAssessmentLevel(suggestion.harmLevel);
const formatPossibilityLevel = (value?: string) => (isEmptyLevel(value) ? '待评估' : possibilityLabels[value || ''] || value || '');
const formatRiskLevel = (value?: string) => (isEmptyLevel(value) ? '待评定' : riskLevelLabels[value || ''] || value || '');
const calculateRiskLevel = (possibilityLevel?: string, harmLevel?: string) =>
  calculateRiskLevelByMatrix(projectRiskMatrix.value, possibilityLevel, harmLevel);
const linkedRiskItemLevel = (row: RiskItem) => row.riskLevel || '';
const linkedEditRiskLevel = computed(() => calculateRiskLevel(editForm.possibilityLevel, editForm.harmLevel) || editForm.riskLevel || '');
const uniqueValues = (values: Array<string | undefined | null>) =>
  Array.from(new Set(values.map((item) => String(item || '').trim()).filter(Boolean)));
const relatedDataSelectOptions = computed(() => uniqueValues(relatedDataOptions.value));
const relatedActivitySelectOptions = computed(() =>
  uniqueValues([...relatedActivityOptions.value, ...defaultRelatedActivityOptions, ...sourceRelatedActivityValues.value])
);
const levelTagType = (value?: string) => {
  if (isEmptyLevel(value)) return 'info';
  if (value === 'VERY_HIGH' || value === 'HIGH' || value === 'MAJOR') return 'danger';
  if (value === 'RELATIVELY_HIGH' || value === 'MEDIUM') return 'warning';
  return 'success';
};

const hasHarmSuggestionDraft = (row: RiskItem) => Boolean(harmAnalysisSuggestions.value[row.id]);
const getHarmAnalysisDisplayStatus = (row: RiskItem): HarmAnalysisDisplayStatus =>
  hasHarmSuggestionDraft(row) ? 'SUGGESTION_PENDING' : row.harmAnalysisStatus || 'PENDING';
const formatHarmAnalysisStatus = (row: RiskItem) => harmAnalysisStatusLabels[getHarmAnalysisDisplayStatus(row)];
const harmAnalysisStatusTagType = (row: RiskItem) => {
  const value = getHarmAnalysisDisplayStatus(row);
  if (value === 'CONFIRMED') return 'success';
  if (value === 'SUGGESTION_PENDING') return 'warning';
  if (value === 'MANUAL') return 'info';
  return 'info';
};
const formatLlmStatus = (value?: string) => (value ? llmStatusLabels[value] || value : '-');
const getTraceText = (trace: HarmAnalysisTrace | undefined, key: string) => {
  const value = trace?.[key];
  return typeof value === 'string' ? value.trim() : '';
};
const getTraceStringList = (trace: HarmAnalysisTrace | undefined, key: string) => {
  const value = trace?.[key];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (typeof item === 'number' || typeof item === 'boolean') return String(item);
        return '';
      })
      .filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
};
const formatHarmTraceSteps = (trace?: HarmAnalysisTrace) =>
  [
    {
      key: 'step1',
      title: '第一步：明确被评估对象类别',
      content: getTraceText(trace, 'step1'),
      reason: '',
      basis: [],
      evidence: []
    },
    {
      key: 'step2',
      title: '第二步：确定受侵害客体及侵害程度',
      content: getTraceText(trace, 'step2'),
      reason: getTraceText(trace, 'step2Reason'),
      basis: getTraceStringList(trace, 'step2Basis'),
      evidence: getTraceStringList(trace, 'step2Evidence')
    },
    {
      key: 'step3',
      title: '第三步：匹配数据安全保护等级',
      content: getTraceText(trace, 'step3'),
      reason: '',
      basis: [],
      evidence: []
    },
    {
      key: 'step4',
      title: '第四步：匹配风险危害程度等级',
      content: getTraceText(trace, 'step4'),
      reason: '',
      basis: [],
      evidence: []
    }
  ].filter((item) => item.content);
const hasConfirmedHarmAnalysis = (row: RiskItem) => Object.keys(row.harmAnalysisTrace || {}).length > 0;
const hasHarmAnalysis = (row: RiskItem) => hasHarmSuggestionDraft(row) || hasConfirmedHarmAnalysis(row);
const isHarmSuggestionDraftVisible = computed(() =>
  Boolean(harmAnalysisRiskItemId.value && harmAnalysisSuggestions.value[harmAnalysisRiskItemId.value])
);
const harmAnalysisDialogTitle = computed(() =>
  isHarmSuggestionDraftVisible.value ? '风险危害程度辅助判定建议' : '已确认的风险危害程度判定'
);

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
};

const getRiskMergeError = (error: unknown) => (error && typeof error === 'object' ? (error as RiskMergeErrorResponse) : {});

const splitRelatedData = (value?: string) =>
  String(value || '')
    .split(/[、,，;；\r\n]+/)
    .map((item) => item.trim())
    .filter((item) => item && item !== '-');

const normalizeRelatedActivityValues = (value?: string[]) =>
  (value || []).map((item) => processingActivityLabels[item] || item).filter(Boolean);

const fetchRiskFormOptions = async (relatedActivities: string[] = []) => {
  const activityValues = uniqueValues(relatedActivities);
  if (!activityValues.length) {
    relatedDataOptions.value = [];
    relatedActivityOptions.value = defaultRelatedActivityOptions;
    return;
  }

  try {
    const options = await riskApi.formOptions(projectId, activityValues);
    relatedDataOptions.value = uniqueValues(options.relatedDataOptions || []);
    relatedActivityOptions.value = uniqueValues(options.relatedActivityOptions || defaultRelatedActivityOptions);
  } catch (error) {
    relatedDataOptions.value = [];
    relatedActivityOptions.value = defaultRelatedActivityOptions;
    notifyApiError(error, '风险源下拉选项加载失败，请稍后重试', 'warning');
  }
};

const handleSourceRelatedActivitiesChange = async () => {
  sourceRelatedDataValues.value = [];
  await fetchRiskFormOptions(sourceRelatedActivityValues.value);
};

const fetchMergeStatus = async () => {
  try {
    const status = await riskApi.getMergeStatus(projectId);
    mergeEnabled.value = status.mergeEnabled;
    confirmedMergeEnabled.value = status.mergeEnabled;
  } catch (error) {
    notifyApiError(error, '合并开关状态加载失败，请稍后重试', 'warning');
  }
};

const reloadMergedResultTabs = async () => {
  pagination.items.pageNo = 1;
  pagination.suggestions.pageNo = 1;
  await Promise.all([loadTab('items'), loadTab('suggestions')]);
};

const handleMergeChange = async (value: string | number | boolean) => {
  const enabled = Boolean(value);
  mergeLoading.value = true;
  try {
    const response = await riskApi.setMergeStatus(projectId, enabled);
    const status = response.data;
    mergeEnabled.value = status.mergeEnabled;
    confirmedMergeEnabled.value = status.mergeEnabled;
    notifyApiSuccess(response, status.mergeEnabled ? '已开启风险清单合并' : '已关闭风险清单合并');
    try { await reloadMergedResultTabs(); }
    catch (error) { notifyApiError(error, '合并设置已保存，但风险列表刷新失败，请手动刷新'); }
  } catch (error) {
    const mergeError = getRiskMergeError(error);
    if (mergeError.code === 'RISK_MERGE_REQUIRED_FIELDS_MISSING') {
      mergeEnabled.value = false;
      confirmedMergeEnabled.value = false;
      notifyApiError(error, '风险源清单存在未填写完整的行，请补充后再进行合并。', 'warning');
    } else {
      mergeEnabled.value = confirmedMergeEnabled.value;
      notifyApiError(error, `合并开关设置失败：${getErrorMessage(error, '请稍后重试')}`);
    }
  } finally {
    mergeLoading.value = false;
  }
};

const updateMergeData = async () => {
  mergeUpdating.value = true;
  try {
    const result = await riskApi.updateMergeData(projectId);
    mergeEnabled.value = result.mergeEnabled;
    confirmedMergeEnabled.value = result.mergeEnabled;
    if (result.hasMergeConflict) ElMessage.warning(result.message);
    else ElMessage.success(result.message);
    try { await reloadMergedResultTabs(); }
    catch (error) { notifyApiError(error, '合并数据已更新，但风险列表刷新失败，请手动刷新'); }
  } catch (error) {
    const mergeError = getRiskMergeError(error);
    if (mergeError.code === 'RISK_MERGE_REQUIRED_FIELDS_MISSING') {
      mergeEnabled.value = false;
      confirmedMergeEnabled.value = false;
      notifyApiError(error, '风险源清单存在未填写完整的行，请补充后再进行合并。', 'warning');
    } else {
      notifyApiError(error, `更新合并失败：${getErrorMessage(error, '请稍后重试')}`);
    }
  } finally {
    mergeUpdating.value = false;
  }
};

const exportRiskSummary = async (tab: ImportableSummaryTab) => {
  exportingTab.value = tab;
  try {
    const blob = tab === 'sources' ? await riskApi.exportRiskSources(projectId) : await riskApi.exportRiskItems(projectId);
    downloadBlobFile(`${riskSummaryTabNames[tab]}-${projectId}.xlsx`, blob);
    ElMessage.success(`${riskSummaryTabNames[tab]}已导出`);
  } catch (error) {
    notifyApiError(error, `${riskSummaryTabNames[tab]}导出失败：${getErrorMessage(error, '请稍后重试')}`);
  } finally {
    exportingTab.value = '';
  }
};

const importRiskSummary = async (tab: ImportableSummaryTab, file: UploadFile) => {
  if (!file.raw) return;

  importingTab.value = tab;
  try {
    const result =
      tab === 'sources'
        ? await riskApi.importRiskSources(projectId, file.raw)
        : await riskApi.importRiskItems(projectId, file.raw);
    const feedback = normalizeRiskSummaryExcelImportResult(result.data);

    pagination[tab].pageNo = 1;
    if (activeTab.value !== tab) activeTab.value = tab;

    if (feedback.hasErrors) {
      importErrorRows.value = feedback.errors;
      importImportedCount.value = feedback.importedCount;
      importFailedCount.value = feedback.failedCount;
      importErrorVisible.value = true;
      ElMessage.warning(`${riskSummaryTabNames[tab]}导入完成：成功 ${feedback.importedCount} 条，异常 ${feedback.failedCount} 条`);
    } else {
      notifyApiSuccess(result,
        `${riskSummaryTabNames[tab]}已导入${feedback.importedCount ? `，共 ${feedback.importedCount} 条` : ''}`
      );
    }
    try { await load(); }
    catch (error) { notifyApiError(error, '风险清单已导入，但列表刷新失败，请手动刷新'); }
  } catch (error) {
    notifyApiError(error, `${riskSummaryTabNames[tab]}导入失败：${getErrorMessage(error, '请检查导入文件或接口服务')}`);
  } finally {
    importingTab.value = '';
  }
};

const loadProjectRiskMatrix = async () => {
  try {
    const matrix = await projectApi.riskMatrix(projectId);
    projectRiskMatrix.value = matrix?.matrixJson || {};
    matrixLoaded.value = Object.keys(projectRiskMatrix.value).length > 0;
    if (!matrixLoaded.value) ElMessage.warning('项目风险评价矩阵未配置，请先检查项目配置');
  } catch (error) {
    projectRiskMatrix.value = {};
    matrixLoaded.value = false;
    notifyApiError(error, '项目风险评价矩阵加载失败，请刷新后重试');
  }
};

const buildHarmSuggestionFromRow = (row: RiskItem): HarmAnalysisSuggestion | null => {
  const cached = harmAnalysisSuggestions.value[row.id];
  if (cached) return cached;
  if (!hasConfirmedHarmAnalysis(row)) return null;

  return {
    riskRecordId: row.id,
    harmLevel: row.harmLevel || '-',
    harmDescription: row.harmDescription || '',
    harmImpactObject: row.harmImpactObject || '',
    harmExample: row.harmExample || '',
    harmAnalysisTrace: row.harmAnalysisTrace || {},
    harmAnalysisConfidence: row.harmAnalysisConfidence,
    harmAnalysisInputHash: row.harmAnalysisInputHash,
    needsManualReview: false
  };
};

const openHarmAnalysisDetail = (row: RiskItem) => {
  harmAnalysisRiskItemId.value = row.id;
  harmAnalysisMergedRiskRecordIds.value = row.mergedRiskRecordIds || [];
  harmAnalysisSuggestion.value = buildHarmSuggestionFromRow(row);
  harmAnalysisVisible.value = true;
};

const suggestRowHarm = async (row: RiskItem) => {
  harmAnalyzingId.value = row.id;
  try {
    const suggestion = await riskApi.suggestRiskItemHarm(projectId, row.id);
    harmAnalysisSuggestions.value = { ...harmAnalysisSuggestions.value, [row.id]: suggestion };
    harmAnalysisRiskItemId.value = row.id;
    harmAnalysisMergedRiskRecordIds.value = row.mergedRiskRecordIds || [];
    harmAnalysisSuggestion.value = suggestion;
    harmAnalysisVisible.value = true;
    ElMessage.success('已生成风险危害程度辅助判定建议');
    await load();
  } catch (error) {
    notifyApiError(error, `辅助判定失败：${getErrorMessage(error, '请稍后重试')}`);
  } finally {
    harmAnalyzingId.value = '';
  }
};

const suggestCurrentPageHarm = async () => {
  const pendingRows = riskItems.value.filter((row) => getHarmAnalysisDisplayStatus(row) === 'PENDING');
  const targetRows = pendingRows.slice(0, harmAnalysisBatchLimit);
  if (!targetRows.length) {
    const draftCount = riskItems.value.filter(hasHarmSuggestionDraft).length;
    ElMessage.warning(
      draftCount ? '当前页待判定风险均已生成建议，请逐条查看并确认' : '当前页暂无待辅助判定的风险记录'
    );
    return;
  }

  batchAnalyzing.value = true;
  try {
    const suggestions = await riskApi.suggestRiskItemsHarm(projectId, {
      riskItemIds: targetRows.map((row) => row.id),
      limit: harmAnalysisBatchLimit
    });
    harmAnalysisSuggestions.value = suggestions.reduce(
      (result, suggestion) => ({ ...result, [suggestion.riskRecordId]: suggestion }),
      { ...harmAnalysisSuggestions.value }
    );
    const remainingCount = Math.max(pendingRows.length - targetRows.length, 0);
    ElMessage.success(
      `已生成 ${suggestions.length} 条风险危害程度辅助判定建议${remainingCount ? `，当前页另有 ${remainingCount} 条可继续判定` : ''}`
    );
    await load();
  } catch (error) {
    notifyApiError(error, `批量辅助判定失败：${getErrorMessage(error, '请稍后重试')}`);
  } finally {
    batchAnalyzing.value = false;
  }
};

const applyHarmAnalysis = async () => {
  if (!harmAnalysisRiskItemId.value || !harmAnalysisSuggestion.value || isEmptyLevel(harmAnalysisSuggestion.value.harmLevel)) return;

  harmApplying.value = true;
  try {
    const response = await riskApi.applyRiskItemHarm(projectId, harmAnalysisRiskItemId.value, {
      suggestion: harmAnalysisSuggestion.value,
      mergedRiskRecordIds: harmAnalysisMergedRiskRecordIds.value
    });
    const nextSuggestions = { ...harmAnalysisSuggestions.value };
    delete nextSuggestions[harmAnalysisRiskItemId.value];
    harmAnalysisSuggestions.value = nextSuggestions;
    harmAnalysisVisible.value = false;
    notifyApiSuccess(response, '已应用风险危害程度辅助判定结果');
    await load();
  } catch (error) {
    notifyApiError(error, `应用辅助判定失败：${getErrorMessage(error, '请重新生成建议后再试')}`);
  } finally {
    harmApplying.value = false;
  }
};

const rowIndex = (tab: SummaryTab, index: number) => {
  const page = pagination[tab];
  return (page.pageNo - 1) * page.pageSize + index + 1;
};

const sourceIndex = (index: number) => rowIndex('sources', index);
const itemIndex = (index: number) => rowIndex('items', index);
const suggestionIndex = (index: number) => rowIndex('suggestions', index);

const handlePageChange = (tab: SummaryTab) => {
  if (activeTab.value === tab) load();
};

const handlePageSizeChange = (tab: SummaryTab) => {
  pagination[tab].pageNo = 1;
  if (activeTab.value === tab) load();
};

const handleTabChange = async () => {
  if (activeTab.value === 'sources') {
    await fetchMergeStatus();
    await fetchRiskFormOptions([]);
  }
  await load();
};

const loadTab = async (tab: SummaryTab) => {
  const page = pagination[tab];
  const query = { pageNo: page.pageNo, pageSize: page.pageSize };

  if (tab === 'sources') {
    const result = await riskApi.listRiskSources(projectId, query);
    riskSources.value = result.list;
    Object.assign(page, { pageNo: result.pageNo, pageSize: result.pageSize, total: result.total });
  }
  if (tab === 'items') {
    const result = await riskApi.listRiskItems(projectId, query);
    riskItems.value = result.list;
    Object.assign(page, { pageNo: result.pageNo, pageSize: result.pageSize, total: result.total });
  }
  if (tab === 'suggestions') {
    const result = await riskApi.listRiskSuggestions(projectId, query);
    riskSuggestions.value = result.list;
    Object.assign(page, { pageNo: result.pageNo, pageSize: result.pageSize, total: result.total });
  }
};

const load = async () => {
  loading.value = true;
  try {
    await loadTab(activeTab.value);
  } finally {
    loading.value = false;
  }
};

const reloadAllRiskSummaryTabs = async () => {
  await Promise.all((['sources', 'items', 'suggestions'] as SummaryTab[]).map((tab) => loadTab(tab)));
};

const refreshSuccessMessage = (result: RiskSummaryRefreshResult) => {
  const success = result.analysisSuccessRecords ?? 0;
  const disabled = result.analysisDisabledRecords ?? 0;
  const failed = result.analysisFailedRecords ?? 0;
  const retained = result.retainedManualRecords ?? 0;
  return `汇总分析已刷新：AI生成成功 ${success} 条，未配置 ${disabled} 条，生成失败 ${failed} 条；保留人工修改 ${retained} 条。`;
};

const retainedManualRecordsNotice = '存在已人工调整的风险源未重新计算，已保留人工修改内容；如需放弃人工内容，请再次刷新并选择“覆盖人工内容并重新生成”。';

const openRefreshDialog = () => {
  if (refreshing.value) return;
  refreshMode.value = 'normal';
  refreshDialogVisible.value = true;
};

const confirmRefresh = async () => {
  const overwriteManualChanges = refreshMode.value === 'overwrite';
  refreshDialogVisible.value = false;
  await refreshRisks(overwriteManualChanges);
};

const refreshRisks = async (overwriteManualChanges = false) => {
  if (refreshing.value) return;
  refreshing.value = true;
  try {
    const response = await riskApi.refresh(projectId, overwriteManualChanges);
    const result = response.data;
    (Object.keys(pagination) as SummaryTab[]).forEach((tab) => {
      pagination[tab].pageNo = 1;
    });
    notifyApiSuccess(response, refreshSuccessMessage(result));
    if (!overwriteManualChanges && (result.retainedManualRecords || 0) > 0) ElMessage.warning(retainedManualRecordsNotice);
    try { await Promise.all([reloadAllRiskSummaryTabs(), fetchMergeStatus(), loadProjectRiskMatrix()]); }
    catch (error) { notifyApiError(error, '汇总分析已生成，但页面刷新失败，请手动刷新'); }
  } catch (error) {
    notifyApiError(error, `刷新汇总分析失败：${getErrorMessage(error, '请稍后重试')}`);
  } finally {
    refreshing.value = false;
  }
};

const openAnalysisBasis = (row: RiskAnalysisRow) => {
  analysisBasisRow.value = row;
  analysisBasisVisible.value = true;
};

const openEdit = (row: RiskSource | RiskItem | RiskSuggestion) => {
  editingId.value = row.id;
  editMergedRiskRecordIds.value = row.mergedRiskRecordIds || [];
  Object.keys(editForm).forEach((key) => delete editForm[key as keyof EditForm]);
  Object.assign(editForm, JSON.parse(JSON.stringify(row)) as EditForm);
  if (activeTab.value === 'sources') {
    const sourceRow = row as RiskSource;
    sourceRelatedDataValues.value = splitRelatedData(sourceRow.relatedData);
    sourceRelatedActivityValues.value = normalizeRelatedActivityValues(sourceRow.relatedActivities);
    if (!relatedActivityOptions.value.length) {
      relatedActivityOptions.value = defaultRelatedActivityOptions;
    }
    void fetchRiskFormOptions(sourceRelatedActivityValues.value);
  }
  if (activeTab.value === 'items') {
    editForm.riskLevel = calculateRiskLevel(editForm.possibilityLevel, editForm.harmLevel);
  }
  editVisible.value = true;
};

const saveEdit = async () => {
  if (activeTab.value === 'items' && !matrixLoaded.value) {
    ElMessage.warning('风险评价矩阵尚未加载，无法保存风险等级，请刷新后重试');
    return;
  }
  let response;
  if (activeTab.value === 'sources') {
    response = await riskApi.saveRiskSource(projectId, editingId.value, {
      riskTypes: editForm.riskTypes || [],
      riskDescription: editForm.riskDescription || '',
      riskSourceDescription: editForm.riskSourceDescription || '',
      relatedData: sourceRelatedDataValues.value,
      relatedActivities: sourceRelatedActivityValues.value,
      sourceItem: editForm.sourceItem
    });
  }
  if (activeTab.value === 'items') {
    response = await riskApi.saveRiskItem(projectId, editingId.value, {
      harmLevel: editForm.harmLevel || '-',
      possibilityLevel: editForm.possibilityLevel || '-',
      riskLevel: linkedEditRiskLevel.value,
      mergedRiskRecordIds: editMergedRiskRecordIds.value
    });
  }
  if (activeTab.value === 'suggestions') {
    response = await riskApi.saveRiskSuggestion(projectId, editingId.value, {
      remediationSuggestion: editForm.remediationSuggestion || '',
      mergedRiskRecordIds: editMergedRiskRecordIds.value
    });
  }
  editVisible.value = false;
  notifyApiSuccess(response, '风险记录已保存');
  await load();
};

onMounted(async () => {
  await loadProjectRiskMatrix();
  await fetchMergeStatus();
  await fetchRiskFormOptions([]);
  await load();
});
</script>

<style scoped>
.summary-tab-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 12px;
}

.summary-merge-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: auto;
  white-space: nowrap;
}

.summary-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  overflow-x: auto;
}

.analysis-text,
.analysis-basis-text {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
}

.refresh-mode-options {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  width: 100%;
}

.refresh-mode-options :deep(.el-radio) {
  display: flex;
  align-items: flex-start;
  width: 100%;
  height: auto;
  min-height: 76px;
  margin-right: 0;
  padding: 14px 16px;
  white-space: normal;
}

.refresh-mode-options :deep(.el-radio__label) {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  padding-left: 10px;
}

.refresh-mode-title {
  color: #303133;
  font-weight: 600;
}

.refresh-mode-description {
  color: #606266;
  line-height: 1.6;
}

.harm-section-title {
  margin-bottom: 10px;
  font-weight: 600;
}

.harm-trace {
  margin-top: 16px;
}

.harm-trace ol {
  padding-left: 20px;
  margin: 8px 0 0;
}

.harm-trace li + li {
  margin-top: 6px;
}

.harm-step-title {
  display: block;
  font-weight: 600;
}

.harm-step-extra {
  margin-top: 8px;
  padding: 10px 12px;
  background: #f7f9fc;
  border: 1px solid #e5eaf3;
  border-radius: 6px;
}

.harm-step-extra-item + .harm-step-extra-item,
.harm-step-extra-item + .harm-evidence {
  margin-top: 8px;
}

.harm-step-extra-title {
  display: block;
  margin-bottom: 4px;
  color: #303133;
  font-weight: 600;
}

.harm-step-extra p {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}

.harm-step-list {
  padding-left: 18px;
  margin: 4px 0 0;
  color: #606266;
  line-height: 1.6;
}

.harm-step-list li + li {
  margin-top: 4px;
}

.harm-evidence summary {
  color: #303133;
  cursor: pointer;
  font-weight: 600;
}
</style>
