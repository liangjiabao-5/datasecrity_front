import assert from 'assert';
import { readFileSync } from 'fs';

const summaryView = readFileSync('src/views/workflow/SummaryView.vue', 'utf8');
const riskApi = readFileSync('src/api/riskApi.ts', 'utf8');
const workflowDb = readFileSync('src/mock/workflowDb.ts', 'utf8');
const riskTypes = readFileSync('src/types/risk.ts', 'utf8');

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

runTest('risk API exposes risk source form options from the backend endpoint', () => {
  assert.match(riskTypes, /export interface RiskFormOptions/);
  assert.match(riskTypes, /relatedDataOptions: string\[\]/);
  assert.match(riskTypes, /relatedActivityOptions: string\[\]/);
  assert.match(riskApi, /formOptions\(projectId: string\): Promise<RiskFormOptions>/);
  assert.match(riskApi, /risk-form-options/);
  assert.match(workflowDb, /getRiskFormOptions/);
});

runTest('risk source edit dialog uses multi-select options for related data and activities', () => {
  assert.match(summaryView, /const relatedDataOptions = ref<string\[\]>\(\[\]\)/);
  assert.match(summaryView, /const relatedActivityOptions = ref<string\[\]>\(\[\]\)/);
  assert.match(summaryView, /const sourceRelatedDataValues = ref<string\[\]>\(\[\]\)/);
  assert.match(summaryView, /const sourceRelatedActivityValues = ref<string\[\]>\(\[\]\)/);
  assert.match(summaryView, /fetchRiskFormOptions/);
  assert.match(summaryView, /riskApi\.formOptions\(projectId\)/);
  assert.match(summaryView, /splitRelatedData\(sourceRow\.relatedData\)/);
  assert.match(summaryView, /relatedData: sourceRelatedDataValues\.value/);
  assert.match(summaryView, /relatedActivities: sourceRelatedActivityValues\.value/);
});

runTest('related activity defaults keep the required display order', () => {
  assert.match(
    summaryView,
    /const defaultRelatedActivityOptions = \[\s*'收集',\s*'传输',\s*'存储',\s*'使用和加工',\s*'提供',\s*'公开',\s*'删除'\s*\]/
  );
});
