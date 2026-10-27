import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import axios from 'axios';

const source = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');
const compile = (text) => ts.transpileModule(text, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const feedbackHarness = () => {
  const notices = [];
  const exports = {};
  const ElMessage = Object.fromEntries(['error', 'success', 'warning'].map((type) => [type, (value) => notices.push({ type, message: typeof value === 'string' ? value : value.message })]));
  vm.runInNewContext(compile(source('utils/apiFeedback.ts')), { exports, require: () => ({ ElMessage }) });
  return { ...exports, notices };
};
const requestHarness = (adapter) => {
  const feedback = feedbackHarness();
  let token = 'old-token';
  let version = 1;
  const locations = [];
  const exports = {};
  const authSession = { getVersion: () => version, getAccessToken: () => token, setAccessToken: (next) => { token = next; }, clear: () => { version++; } };
  vm.runInNewContext(compile(source('utils/request.ts')), {
    exports, Blob, CustomEvent: class {},
    window: { dispatchEvent() {}, location: { pathname: '/projects', search: '', hash: '', replace: (url) => locations.push(url) } },
    require: (name) => ({
      axios: { default: { create: (config) => axios.create({ ...config, adapter }) } },
      'element-plus': { ElMessage: { error: (message) => feedback.notices.push({ type: 'error', message }) } },
      './env': { apiBaseUrl: '/api/v1' }, '@/utils/authSession': { authSession }, '@/utils/apiFeedback': feedback
    })[name]
  });
  return { http: exports.http, feedback, locations, switchSession: () => { version++; } };
};
const response = (config, data, status = 200, headers = {}) => ({ config, data, status, headers, statusText: '' });
const failure = (config, status, data) => new axios.AxiosError('transport detail', 'ERR_BAD_REQUEST', config, undefined, response(config, data, status));

test('success envelopes retain server messages for all mutation verbs', async () => {
  const h = requestHarness(async (config) => response(config, { code: 'SUCCESS', message: '服务器附加说明', data: { id: 1 } }));
  for (const method of ['postEnvelope', 'putEnvelope', 'deleteEnvelope']) {
    const result = await h.http[method]('/test');
    assert.equal(result.message, '服务器附加说明');
    h.feedback.notifyApiSuccess(result, '保存成功');
  }
  assert.equal(h.feedback.notices.length, 3);
  assert.ok(h.feedback.notices.every((item) => item.message === '服务器附加说明'));
});

for (const status of [400, 403, 404, 405, 409, 422, 429, 500]) {
  test(`HTTP ${status} displays the backend reason exactly once`, async () => {
    const h = requestHarness(async (config) => { throw failure(config, status, { code: 'TEST_ERROR', message: '具体业务原因', data: { field: 'name' }, traceId: 'trace' }); });
    await assert.rejects(h.http.post('/test'), (error) => {
      h.feedback.notifyApiError(error);
      assert.equal(error.message, '具体业务原因');
      assert.equal(error.traceId, 'trace');
      assert.equal(error.data.field, 'name');
      return true;
    });
    assert.deepEqual(h.feedback.notices, [{ type: 'error', message: '具体业务原因' }]);
  });
}

test('HTTP 200 business failure is rejected and displayed once', async () => {
  const h = requestHarness(async (config) => response(config, { code: 'INVALID_PARAM', message: '字段校验未通过' }));
  await assert.rejects(h.http.put('/test'));
  assert.equal(h.feedback.notices[0].message, '字段校验未通过');
});

test('network and timeout failures use Chinese messages', async () => {
  for (const [code, message] of [['ERR_NETWORK', '网络连接失败，请检查网络后重试'], ['ECONNABORTED', '请求超时，请稍后重试']]) {
    const h = requestHarness(async (config) => { throw new axios.AxiosError('raw English error', code, config); });
    await assert.rejects(h.http.get('/test'));
    assert.equal(h.feedback.notices[0].message, message);
  }
});

test('background/manual requests remain silent until the page chooses feedback', async () => {
  const h = requestHarness(async (config) => { throw failure(config, 500, { code: 'TEST_ERROR', message: '服务暂不可用' }); });
  let error;
  try { await h.http.get('/test', { errorMode: 'manual' }); } catch (failure) { error = failure; }
  assert.equal(h.feedback.notices.length, 0);
  h.feedback.notifyApiError(error, undefined, 'warning');
  assert.equal(h.feedback.notices[0].type, 'warning');
});

test('Blob HTTP errors preserve JSON message and data', async () => {
  const h = requestHarness(async (config) => { throw failure(config, 400, new Blob([JSON.stringify({ code: 'EXPORT_DENIED', message: '请先完成测评', data: { reason: 'missing' } })], { type: 'application/json' })); });
  await assert.rejects(h.http.blobFile('/export'), (error) => error.message === '请先完成测评' && error.data.reason === 'missing');
  assert.equal(h.feedback.notices.length, 1);
});

test('HTTP 200 JSON errors are never downloaded as successful files', async () => {
  const h = requestHarness(async (config) => response(config, new Blob([JSON.stringify({ code: 'EXPORT_FAILED', message: '导出校验失败' })], { type: 'application/json' })));
  await assert.rejects(h.http.blob('/export'), (error) => error.message === '导出校验失败');
  assert.equal(h.feedback.notices.length, 1);
});

test('valid binary download preserves the server filename', async () => {
  const blob = new Blob(['binary file'], { type: 'application/octet-stream' });
  const h = requestHarness(async (config) => response(config, blob, 200, { 'content-disposition': "attachment; filename*=UTF-8''%E6%8A%A5%E5%91%8A.docx" }));
  const result = await h.http.blobFile('/export');
  assert.equal(result.blob, blob);
  assert.equal(result.fileName, '报告.docx');
  assert.equal(h.feedback.notices.length, 0);
});

test('late responses from a switched session do not produce notifications', async () => {
  let release;
  const h = requestHarness((config) => new Promise((resolve) => { release = () => resolve(response(config, { code: 'SUCCESS', data: 1 })); }));
  const pending = h.http.get('/test');
  await new Promise(setImmediate);
  h.switchSession();
  release();
  await assert.rejects(pending, (error) => error.code === 'SESSION_CHANGED');
  assert.equal(h.feedback.notices.length, 0);
});

test('401 refresh retries once and preserves the original response', async () => {
  let calls = 0;
  const h = requestHarness(async (config) => {
    if (config.url === '/auth/refresh') return response(config, { code: 'SUCCESS', data: { accessToken: 'new-token' } });
    calls++;
    if (!config._retry) throw failure(config, 401, { code: 'TOKEN_EXPIRED' });
    assert.equal(config.headers.Authorization, 'Bearer new-token');
    return response(config, { code: 'SUCCESS', data: { saved: true } });
  });
  assert.equal((await h.http.post('/test')).saved, true);
  assert.equal(calls, 2);
  assert.equal(h.feedback.notices.length, 0);
});

test('failed session refresh redirects with only one expiration notification', async () => {
  const h = requestHarness(async (config) => { throw failure(config, 401, { code: 'UNAUTHORIZED', message: '登录已失效' }); });
  await assert.rejects(h.http.get('/test'));
  assert.equal(h.locations.length, 1);
  assert.equal(h.feedback.notices.length, 1);
  assert.match(h.feedback.notices[0].message, /重新登录/);
});

test('ordinary successful queries display data without success popups', async () => {
  const h = requestHarness(async (config) => response(config, { code: 'SUCCESS', message: '操作成功', data: { list: [] } }));
  assert.equal((await h.http.get('/test')).list.length, 0);
  assert.equal(h.feedback.notices.length, 0);
});

const selected = (file, names, context) => {
  const raw = source(file).split('<script setup lang="ts">')[1].split('</script>')[0];
  const parsed = ts.createSourceFile('page.ts', raw, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const statements = parsed.statements.filter((statement) => ts.isFunctionDeclaration(statement)
    ? names.includes(statement.name?.getText(parsed))
    : ts.isVariableStatement(statement) && statement.declarationList.declarations.some((decl) => names.includes(decl.name.getText(parsed))));
  vm.runInNewContext(compile(statements.map((statement) => statement.getText(parsed)).join('\n') + `\nglobalThis.selected = {${names.join(',')}};`), context);
  return context.selected;
};

test('failed report refresh has an error state and never announces success', async () => {
  const feedback = feedbackHarness();
  const context = { loading: { value: false }, listError: { value: '' }, disposed: false, projectId: 'p', query: {}, reportApi: { list: async () => { throw { message: '服务不可用' }; } }, getErrorMessage: (e) => e.message, schedulePolling() {}, ...feedback, ElMessage: { success: () => assert.fail('must not announce success') } };
  await selected('views/workflow/ReportManagementView.vue', ['loadReports', 'refreshReports'], context).refreshReports();
  assert.match(context.listError.value, /服务不可用/);
  assert.equal(feedback.notices.length, 1);
});

test('inline evaluation failure restores the last saved value', async () => {
  const feedback = feedbackHarness();
  const context = { inlineSavingId: { value: '' }, savedInlineResults: new Map([['1', 'COMPLIANT']]), evaluationApi: { saveRecord: async () => { throw { code: 'FAILED', message: '保存失败' }; } }, projectId: 'p', ...feedback };
  const row = { id: '1', evaluationResult: 'PARTIAL', evaluationRecord: '' };
  await selected('views/workflow/EvaluationView.vue', ['updateInlineResult'], context).updateInlineResult(row);
  assert.equal(row.evaluationResult, 'COMPLIANT');
  assert.equal(context.inlineSavingId.value, '');
});

test('generic success uses page context, while business success messages are retained', () => {
  const feedback = feedbackHarness();
  assert.equal(feedback.successMessage({ message: '操作成功' }, '项目已保存'), '项目已保存');
  assert.equal(feedback.successMessage({ message: '已转为停用' }, '删除成功'), '已转为停用');
  feedback.notifyApiError('cancel');
  feedback.notifyApiError({ code: 'SESSION_CHANGED', message: '旧请求' });
  assert.equal(feedback.notices.length, 0);
});

test('persisted survey deletion displays server success and temporary rows stay local', async () => {
  const feedback = feedbackHarness();
  let calls = 0;
  const rows = { value: [{ id: 'saved' }, { id: 'temp' }] };
  const context = {
    ...feedback, projectId: 'p', dataAssets: rows, isTemporary: (id) => id === 'temp',
    ElMessageBox: { confirm: async () => {} }, surveyApi: { deleteDataAsset: async () => { calls++; return { message: '后端确认已删除' }; } }
  };
  const { removeDataAsset } = selected('views/workflow/SurveyView.vue', ['removeDataAsset'], context);
  await removeDataAsset({ id: 'saved' });
  await removeDataAsset({ id: 'temp' });
  assert.equal(calls, 1);
  assert.equal(rows.value.length, 0);
  assert.deepEqual(feedback.notices, [{ type: 'success', message: '后端确认已删除' }]);
});

test('partial survey save stops and reports how many rows were saved', async () => {
  const feedback = feedbackHarness();
  let calls = 0;
  const context = {
    ...feedback, projectId: 'p', getApiErrorMessage: feedback.getApiErrorMessage,
    dataAssets: { value: [{ id: 'temp-1' }, { id: 'temp-2' }] }, isTemporary: () => true,
    surveyApi: { saveDataAsset: async () => { calls++; if (calls === 2) throw { code: 'CONFLICT', message: '数据冲突' }; return { code: 'SUCCESS', data: { id: 'persisted-1' } }; } }
  };
  await selected('views/workflow/SurveyView.vue', ['saveAssets'], context).saveAssets();
  assert.equal(context.dataAssets.value[0].id, 'persisted-1');
  assert.equal(calls, 2);
  assert.equal(feedback.notices.length, 1);
  assert.match(feedback.notices[0].message, /已保存 1 条.*数据冲突/);
  assert.equal(feedback.notices[0].type, 'error');
});

test('processing survey errors never fall back to writes using the old structure', async () => {
  const feedback = feedbackHarness();
  const calls = [];
  const exports = {};
  vm.runInNewContext(compile(source('api/surveyApi.ts')), {
    exports, require: (name) => ({
      '@/utils/apiFeedback': feedback, '@/mock/workflowDb': { workflowDb: {} }, '@/utils/env': { useMock: false },
      '@/utils/request': { http: {
        putEnvelope: async (url) => { calls.push(url); throw { code: 'INVALID_PARAM', message: '校验失败' }; },
        get: () => assert.fail('must not query the legacy endpoint'), post: () => assert.fail('must not write the legacy endpoint')
      } }
    })[name]
  });
  await assert.rejects(exports.surveyApi.saveProcessingActivitySurvey('p', { involvedActivities: [] }));
  assert.deepEqual(calls, ['/projects/p/survey/processing-activity-survey']);
});

test('report start warnings are visible, but previously acknowledged warnings are not repeated', () => {
  const feedback = feedbackHarness();
  const context = {
    ...feedback, taskWarnings: { value: [] }, activeTaskIds: new Set(), schedulePolling() {}, isActiveStatus: () => true,
    ElMessage: { warning: (message) => feedback.notices.push({ type: 'warning', message }) }
  };
  const { registerTask } = selected('views/workflow/ReportManagementView.vue', ['registerTask'], context);
  registerTask({ status: 'PENDING', reportTaskId: '1', warnings: [{ message: '已确认警告' }, { message: '新增警告' }] }, ['已确认警告']);
  assert.deepEqual(feedback.notices, [{ type: 'warning', message: '新增警告' }]);
  assert.equal(context.activeTaskIds.size, 1);
});

test('report polling shows failures as page state and clears that state after recovery', async () => {
  const feedback = feedbackHarness();
  let failing = true;
  const context = {
    ...feedback, disposed: false, pollTimer: undefined, projectId: 'p', activeTaskIds: new Set(['1']), pollingError: { value: '' },
    reportApi: { task: async () => { if (failing) throw { message: '网络中断' }; return { status: 'SUCCESS' }; } },
    getErrorMessage: (error) => error.message, loadReports: async () => true, schedulePolling() {},
    ElMessage: { success: (message) => feedback.notices.push({ type: 'success', message }) }
  };
  const { pollTasks } = selected('views/workflow/ReportManagementView.vue', ['pollTasks'], context);
  await pollTasks();
  assert.match(context.pollingError.value, /网络中断/);
  assert.equal(feedback.notices.length, 0);
  failing = false;
  await pollTasks();
  assert.equal(context.pollingError.value, '');
  assert.equal(context.activeTaskIds.size, 0);
  assert.deepEqual(feedback.notices, [{ type: 'success', message: '报告生成完毕' }]);
});

test('failed server logout clears local state but never announces server success', async () => {
  const feedback = feedbackHarness();
  let redirected = false;
  const context = { ...feedback, auth: { logout: async () => { throw { message: '网络中断' }; } },
    router: { replace: async () => { redirected = true; } } };
  await selected('components/layout/AppLayout.vue', ['handleUserCommand'], context).handleUserCommand('logout');
  assert.equal(redirected, true);
  assert.equal(feedback.notices[0].type, 'warning');
  assert.match(feedback.notices[0].message, /已退出本地登录.*网络中断/);
});
