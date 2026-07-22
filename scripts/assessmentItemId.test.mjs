import assert from 'assert';
import { readFileSync } from 'fs';

const evaluationView = readFileSync('src/views/workflow/EvaluationView.vue', 'utf8');
const summaryView = readFileSync('src/views/workflow/SummaryView.vue', 'utf8');
const evaluationTypes = readFileSync('src/types/evaluation.ts', 'utf8');
const riskTypes = readFileSync('src/types/risk.ts', 'utf8');
const workflowDb = readFileSync('src/mock/workflowDb.ts', 'utf8');

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

runTest('evaluation items expose and render the assessment item id', () => {
  assert.match(evaluationTypes, /assessmentItemId\?: string \| null/);
  assert.match(evaluationTypes, /itemCode\?: string/);
  assert.match(evaluationView, /label="检查项编号"/);
  assert.match(evaluationView, /label="评估项ID"/);
  assert.match(evaluationView, /formatAssessmentItemId\(row\.assessmentItemId\)/);
});

runTest('risk records expose and render the assessment item id in all summary tables', () => {
  for (const interfaceName of ['RiskSource', 'RiskItem', 'RiskSuggestion']) {
    assert.match(
      riskTypes,
      new RegExp(`interface ${interfaceName}[\\s\\S]*assessmentItemId\\?: string \\| null`)
    );
  }

  assert.strictEqual((summaryView.match(/label="评估项ID"/g) || []).length, 3);
  assert.match(summaryView, /formatAssessmentItemId\(row\.assessmentItemId\)/);
});

runTest('risk source table renders assessment subcategory and risk source type in the requested order', () => {
  assert.match(riskTypes, /interface RiskSource[\s\S]*assessmentSubcategory\?: string \| null/);
  assert.match(riskTypes, /interface RiskSource[\s\S]*riskSourceType\?: string \| null/);

  const sourceTable = summaryView.match(/<el-tab-pane label="数据安全风险源清单" name="sources">[\s\S]*?<\/el-table>/)?.[0] || '';

  assert.match(
    sourceTable,
    /label="评估项ID"[\s\S]*label="评估子类"[\s\S]*label="风险源描述"[\s\S]*label="风险源类型"[\s\S]*label="风险类型"/
  );
  assert.match(sourceTable, /formatNullableText\(row\.assessmentSubcategory\)/);
  assert.match(sourceTable, /formatNullableText\(row\.riskSourceType\)/);
});

runTest('mock risk records inherit the assessment item id from evaluation items', () => {
  assert.match(workflowDb, /assessmentItemId: 'AQGL001'/);
  assert.match(workflowDb, /assessmentItemId: item\.assessmentItemId/);
  assert.match(workflowDb, /assessmentSubcategory: template\?\.assessmentSubcategory/);
  assert.match(workflowDb, /riskSourceType: template\?\.riskSourceType/);
});
