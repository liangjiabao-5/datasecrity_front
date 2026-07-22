import assert from 'assert';
import { readFileSync } from 'fs';

const summaryView = readFileSync('src/views/workflow/SummaryView.vue', 'utf8');
const riskApi = readFileSync('src/api/riskApi.ts', 'utf8');
const workflowDb = readFileSync('src/mock/workflowDb.ts', 'utf8');
const riskTypes = readFileSync('src/types/risk.ts', 'utf8');
const request = readFileSync('src/utils/request.ts', 'utf8');

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

runTest('risk API exposes the risk summary merge switch endpoint', () => {
  assert.match(riskTypes, /export interface RiskSummaryMergeState/);
  assert.match(riskTypes, /mergeEnabled: boolean/);
  assert.match(riskTypes, /export interface RiskSummaryMergeUpdateResult/);
  assert.match(riskTypes, /updatedMergedCount: number/);
  assert.match(riskTypes, /hasMergeConflict: boolean/);
  assert.match(riskTypes, /mergeConflictTabs: RiskSummaryMergeConflictTab\[\]/);
  assert.match(riskTypes, /message: string/);
  assert.match(riskTypes, /merged\?: boolean/);
  assert.match(riskTypes, /mergedRiskRecordIds\?: string\[\]/);
  assert.match(riskTypes, /hasMergeConflict\?: boolean/);
  assert.match(riskTypes, /mergeConflictFields\?: string\[\]/);
  assert.match(riskTypes, /mergeConflictMessage\?: string/);
  assert.match(riskApi, /getMergeStatus\(projectId: string\): Promise<RiskSummaryMergeState>/);
  assert.match(riskApi, /setMergeStatus\(projectId: string, mergeEnabled: boolean\): Promise<RiskSummaryMergeState>/);
  assert.match(riskApi, /updateMergeData\(projectId: string\): Promise<RiskSummaryMergeUpdateResult>/);
  assert.match(riskApi, /risk-summary\/merge/);
  assert.match(riskApi, /risk-summary\/merge\/update/);
  assert.match(request, /postEnvelope<T>/);
  assert.match(riskApi, /response\.message/);
});

runTest('summary source tab renders and persists the merge switch and update button', () => {
  const sourceTab = summaryView.match(/<el-tab-pane label="数据安全风险源清单" name="sources">[\s\S]*?<\/el-tab-pane>/)?.[0] || '';
  assert.match(sourceTab, /v-model="mergeEnabled"/);
  assert.match(sourceTab, /@change="handleMergeChange"/);
  assert.match(sourceTab, /:loading="mergeLoading"/);
  assert.match(sourceTab, /更新合并/);
  assert.match(sourceTab, /:loading="mergeUpdating"/);
  assert.match(sourceTab, /@click="updateMergeData"/);
  assert.match(summaryView, /const mergeEnabled = ref\(false\)/);
  assert.match(summaryView, /const mergeLoading = ref\(false\)/);
  assert.match(summaryView, /const mergeUpdating = ref\(false\)/);
  assert.match(summaryView, /fetchMergeStatus/);
  assert.match(summaryView, /riskApi\.getMergeStatus\(projectId\)/);
  assert.match(summaryView, /riskApi\.setMergeStatus\(projectId, enabled\)/);
  assert.match(summaryView, /riskApi\.updateMergeData\(projectId\)/);
  assert.match(summaryView, /reloadMergedResultTabs/);
});

runTest('merge required field errors use the backend message directly', () => {
  assert.match(summaryView, /RISK_MERGE_REQUIRED_FIELDS_MISSING/);
  assert.match(summaryView, /ElMessage\.warning\(getErrorMessage\(error/);
  assert.match(summaryView, /mergeEnabled\.value = false/);
});

runTest('merged rows keep manual edit and harm analysis actions available', () => {
  assert.doesNotMatch(summaryView, /:disabled="row\.merged"/);
  assert.doesNotMatch(summaryView, /row\.merged \|\| !hasHarmAnalysis\(row\)/);
  assert.match(summaryView, /const targetRows = riskItems\.value\.filter\(\(row\) => row\.harmAnalysisStatus !== 'CONFIRMED'\)/);
});

runTest('merged row edits and applied harm analysis carry source record ids', () => {
  assert.match(riskTypes, /export interface RiskItemSavePayload/);
  assert.match(riskTypes, /export interface RiskSuggestionSavePayload/);
  assert.match(riskTypes, /mergedRiskRecordIds\?: string\[\]/);
  assert.match(summaryView, /editMergedRiskRecordIds/);
  assert.match(summaryView, /harmAnalysisMergedRiskRecordIds/);
  assert.match(summaryView, /mergedRiskRecordIds: editMergedRiskRecordIds\.value/);
  assert.match(summaryView, /mergedRiskRecordIds: harmAnalysisMergedRiskRecordIds\.value/);
  assert.match(workflowDb, /resolveRiskRecordTargets/);
  assert.match(workflowDb, /payload\.mergedRiskRecordIds/);
  assert.match(workflowDb, /targets\.forEach/);
});

runTest('mock database can return merged risk items and suggestions with conflict metadata', () => {
  assert.match(workflowDb, /riskSummaryMergeStates/);
  assert.match(workflowDb, /getRiskSummaryMerge/);
  assert.match(workflowDb, /setRiskSummaryMerge/);
  assert.match(workflowDb, /updateRiskSummaryMerge/);
  assert.match(workflowDb, /mergeRiskRecords/);
  assert.match(workflowDb, /assessmentCategory/);
  assert.match(workflowDb, /assessmentSubcategory/);
  assert.match(workflowDb, /riskSourceType/);
  assert.match(workflowDb, /relatedActivities/);
  assert.match(workflowDb, /relatedData/);
  assert.match(workflowDb, /assessmentItemId: joinUnique/);
  assert.match(workflowDb, /riskDescription: joinUniqueLines/);
  assert.match(workflowDb, /evaluationRecord: joinUniqueLines/);
  assert.match(workflowDb, /evaluationResult: 'NON_COMPLIANT'/);
  assert.match(workflowDb, /rowNos: errors\.map/);
  assert.match(workflowDb, /hasMergeConflict/);
  assert.match(workflowDb, /mergeConflictFields/);
  assert.match(workflowDb, /mergeConflictMessage/);
  assert.match(workflowDb, /updatedMergedCount/);
  assert.match(workflowDb, /buildMergeUpdateMessage/);
});
