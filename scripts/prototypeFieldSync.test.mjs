import assert from 'assert';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

const files = Object.fromEntries(
  await Promise.all(
    [
      'src/views/workflow/BasicInfoView.vue',
      'src/views/workflow/SurveyView.vue',
      'src/types/basicInfo.ts',
      'src/types/survey.ts',
      'src/api/surveyApi.ts',
      'src/mock/db.ts',
      'src/mock/workflowDb.ts'
    ].map(async (relativePath) => [
      relativePath,
      await readFile(path.join(rootDir, relativePath), 'utf8')
    ])
  )
);

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

const basicView = files['src/views/workflow/BasicInfoView.vue'];
const basicTypes = files['src/types/basicInfo.ts'];
const surveyView = files['src/views/workflow/SurveyView.vue'];
const surveyTypes = files['src/types/survey.ts'];
const surveyApi = files['src/api/surveyApi.ts'];
const workflowDb = files['src/mock/workflowDb.ts'];

runTest('basic info page follows the new prototype fields', () => {
  for (const label of ['项目编号', '项目名称', '评估所依据的法律法规', '评估所参考的标准规范', '评估时间计划', '单位名称', '邮政编码', '联系人信息']) {
    assert.match(basicView, new RegExp(label));
  }

  for (const removedLabel of ['项目描述', '系统描述', '评估对象', '统一社会信用代码', '单位地址', '数据安全负责人', '公司简介']) {
    assert.doesNotMatch(basicView, new RegExp(removedLabel));
  }

  assert.match(basicTypes, /projectNumber\?: string/);
  assert.match(basicTypes, /projectName\?: string/);
  assert.doesNotMatch(basicTypes, /projectDescription/);
  assert.doesNotMatch(basicTypes, /systemDescription/);
  assert.doesNotMatch(basicTypes, /assessmentTarget/);
});

runTest('survey page adds data processor basic survey and business data scope', () => {
  assert.match(surveyView, /label="数据处理者基本情况调研" name="processor"/);
  for (const label of ['单位基本信息', '单位性质', '是否属于特定类型数据处理者', '所属电力行业类别', '运营地区', '业务情况', '行政许可']) {
    assert.match(surveyView, new RegExp(label));
  }
  assert.match(surveyView, /businessForm\.dataScopes/);
  assert.match(surveyTypes, /export interface DataProcessorBasicSurvey/);
  assert.match(surveyTypes, /dataScopes: string\[\]/);
});

runTest('survey processing and security fields match the changed prototype', () => {
  for (const key of ['collectionChannels', 'collectionPurpose', 'dataCenter', 'onlineChannel', 'algorithmRules', 'providePurpose', 'deletionScenarios', 'crossBorderDescription']) {
    assert.match(surveyTypes, new RegExp(`${key}: string`));
    assert.match(surveyView, new RegExp(key));
  }

  for (const label of ['数据收集渠道', '数据中心', '在线通道', '算法规则', '对外提供的个人信息和重要数据', '是否存在个人信息或重要数据出境', '电力监控系统防护措施要点']) {
    assert.match(surveyView, new RegExp(label));
  }

  for (const obsoleteLabel of ['数据收集的场景', '收集的数据规模', '数据提供审核机制', '效果验证机制数据销毁技术']) {
    assert.doesNotMatch(surveyView, new RegExp(obsoleteLabel));
  }
});

runTest('survey API and mock DB expose the new data processor basic endpoint', () => {
  assert.match(surveyApi, /getDataProcessorBasic/);
  assert.match(surveyApi, /saveDataProcessorBasic/);
  assert.match(surveyApi, /survey\/data-processor-basic/);
  assert.match(workflowDb, /getDataProcessorBasic/);
  assert.match(workflowDb, /saveDataProcessorBasic/);
});
