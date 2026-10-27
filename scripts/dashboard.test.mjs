import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function loadTs(path, imports = {}, globals = {}) {
  const source = readFileSync(new URL(`../src/${path}.ts`, import.meta.url), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const exports = {};
  vm.runInNewContext(output.outputText, {
    exports, require: (id) => imports[id] ?? (id === '@/utils/apiFeedback' ? feedback : require(id)),
    Intl, Date, Promise, Blob, ...globals
  }, { filename: `${path}.ts` });
  return exports;
}
const feedback = loadTs('utils/apiFeedback', { 'element-plus': { ElMessage: {} } });
const { createDashboardLoader } = loadTs('utils/dashboardLoader', { '@/utils/apiFeedback': feedback });
const { normalizeProjectStatus, formatProjectCreatedAt } = loadTs('utils/projectPresentation');
const statistics = { all: 8, notStarted: 2, inProgress: 3, completed: 2 };
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const tick = () => new Promise(setImmediate);
function harness(overrides = {}) {
  const session = { key: 'session-a', canRead: true };
  let state;
  let listCalls = 0;
  let statisticsCalls = 0;
  const loader = createDashboardLoader({
    sessionKey: () => session.key,
    syncPermissions: async () => true,
    canRead: () => session.canRead,
    list: async () => { listCalls++; return { list: [{ id: 'allowed' }] }; },
    statistics: async () => { statisticsCalls++; return statistics; },
    ...overrides,
    publish: (next) => { state = structuredClone(next); }
  });
  return { loader, session, state: () => state, calls: () => [listCalls, statisticsCalls] };
}

test('waits for current permissions and coalesces concurrent focus refreshes', async () => {
  const permission = deferred();
  const h = harness({ syncPermissions: () => permission.promise });
  const first = h.loader.refresh();
  assert.equal(h.loader.refresh(), first);
  assert.deepEqual(h.calls(), [0, 0]);
  assert.equal(h.state().loading, true);
  permission.resolve(true);
  await first;
  assert.deepEqual(h.calls(), [1, 1]);
  assert.equal(h.state().projects[0].id, 'allowed');
  assert.equal(h.state().statistics.all, 8);
});

test('no project read permission prevents list and statistics requests', async () => {
  const h = harness();
  h.session.canRead = false;
  await h.loader.refresh();
  assert.deepEqual(h.calls(), [0, 0]);
  assert.equal(h.state().forbidden, true);
  assert.equal(h.state().statistics, null);
});

test('permission refresh failures fail closed without retaining previous data', async () => {
  let failed = false;
  const h = harness({ syncPermissions: async () => { if (failed) throw Error('offline'); return true; } });
  await h.loader.refresh();
  failed = true;
  const pending = h.loader.refresh();
  assert.equal(h.state().projects.length, 0);
  assert.equal(h.state().statistics, null);
  await pending;
  assert.ok(h.state().error);
  assert.equal(h.state().loading, false);
});

test('independent statistics failure displays no fabricated zero and can recover', async () => {
  let failed = true;
  const h = harness({ statistics: async () => { if (failed) throw Error('offline'); return statistics; } });
  await h.loader.refresh();
  assert.equal(h.state().projects.length, 1);
  assert.equal(h.state().statistics, null);
  assert.ok(h.state().statisticsError);
  failed = false;
  await h.loader.refresh();
  assert.equal(h.state().statistics.all, 8);
  assert.equal(h.state().statisticsError, '');
});

test('list failure does not masquerade as empty success or hide successful statistics', async () => {
  const h = harness({ list: async () => { throw Error('offline'); } });
  await h.loader.refresh();
  assert.ok(h.state().projectsError);
  assert.equal(h.state().statistics.all, 8);
});

test('a permission denial from either endpoint discards both results', async () => {
  for (const endpoint of ['list', 'statistics']) {
    const h = harness({ [endpoint]: async () => { throw { code: 'FORBIDDEN' }; } });
    await h.loader.refresh();
    assert.equal(h.state().forbidden, true);
    assert.equal(h.state().projects.length, 0);
    assert.equal(h.state().statistics, null);
  }
});

test('old account responses cannot overwrite a newer account snapshot', async () => {
  const oldList = deferred();
  let calls = 0;
  const h = harness({ list: () => ++calls === 1 ? oldList.promise : Promise.resolve({ list: [{ id: 'account-b' }] }) });
  const oldRequest = h.loader.refresh();
  await tick();
  h.session.key = 'session-b';
  h.loader.invalidate();
  await h.loader.refresh();
  oldList.resolve({ list: [{ id: 'account-a-private' }] });
  await oldRequest;
  assert.equal(h.state().projects[0].id, 'account-b');
});

test('logout and disposal prevent in-flight data from reappearing', async () => {
  for (const dispose of [false, true]) {
    const pendingList = deferred();
    const h = harness({ list: () => pendingList.promise });
    const pending = h.loader.refresh();
    await tick();
    if (dispose) h.loader.dispose();
    else { h.session.key = null; h.loader.invalidate(); }
    pendingList.resolve({ list: [{ id: 'private' }] });
    await pending;
    assert.equal(h.state().projects.length, 0);
    assert.equal(h.state().statistics, null);
  }
});

test('lost session during permission synchronization does not fetch projects', async () => {
  const h = harness({ syncPermissions: async () => false });
  await h.loader.refresh();
  assert.deepEqual(h.calls(), [0, 0]);
  assert.equal(h.state().loading, false);
});

test('status route values accept only a single supported state', () => {
  assert.equal(normalizeProjectStatus('IN_PROGRESS'), 'IN_PROGRESS');
  assert.equal(normalizeProjectStatus('ARCHIVED'), 'ARCHIVED');
  for (const value of [undefined, null, ['COMPLETED'], 'FAILED', '__proto__', '']) assert.equal(normalizeProjectStatus(value), '');
});

test('creation timestamps display UTC and offset values in Shanghai consistently', () => {
  assert.equal(formatProjectCreatedAt('2026-10-22T01:15:00'), '2026-10-22 09:15');
  assert.equal(formatProjectCreatedAt('2026-10-22T01:15:00Z'), '2026-10-22 09:15');
  assert.equal(formatProjectCreatedAt('2026-10-22T09:15:00+08:00'), '2026-10-22 09:15');
  assert.equal(formatProjectCreatedAt('2026-10-22'), '2026-10-22');
  assert.equal(formatProjectCreatedAt('invalid'), '—');
  assert.equal(formatProjectCreatedAt(), '—');
});

test('project cache ignores an in-flight response after session clearing', async () => {
  const { createPinia, setActivePinia } = require('pinia');
  setActivePinia(createPinia());
  const response = deferred();
  const { useProjectStore } = loadTs('stores/project', { '@/api/projectApi': { projectApi: { detail: () => response.promise } } });
  const store = useProjectStore();
  const pending = store.loadProject('private-project', true);
  store.clearProject();
  response.resolve({ id: 'private-project', projectName: 'Previous account' });
  assert.equal(await pending, null);
  assert.equal(store.currentProject, null);
  assert.equal(store.loading, false);
});

test('late token refresh cannot restore an old account or redirect a newer account', async () => {
  const axios = require('axios');
  const refresh = deferred();
  let version = 1;
  let token = 'account-a-token';
  let refreshCalls = 0;
  const events = [];
  const redirects = [];
  const authSession = {
    getAccessToken: () => token, getVersion: () => version,
    setAccessToken: (value) => { token = value; },
    clear: () => { version++; token = ''; }
  };
  const service = axios.create({ adapter: async (config) => {
    if (config.url === '/auth/refresh') { refreshCalls++; return refresh.promise; }
    throw { config, response: { status: 401, data: { code: 'UNAUTHORIZED' } } };
  } });
  const { http } = loadTs('utils/request', {
    axios: { default: { create: () => service } },
    'element-plus': { ElMessage: { error: () => {} } },
    './env': { apiBaseUrl: '/api/v1' }, '@/utils/authSession': { authSession }
  }, {
    window: { dispatchEvent: (event) => events.push(event), location: { pathname: '/dashboard', replace: (url) => redirects.push(url) } },
    CustomEvent: class { constructor(type, details) { this.type = type; this.detail = details?.detail; } }
  });
  const pending = http.get('/projects').catch((error) => error);
  await tick();
  assert.equal(refreshCalls, 1);
  authSession.clear();
  authSession.setAccessToken('account-b-token');
  refresh.resolve({ config: { _sessionVersion: 1, url: '/auth/refresh' }, data: { code: 'SUCCESS', data: { accessToken: 'late-account-a', user: { id: 'a' } } } });
  assert.equal((await pending).code, 'SESSION_CHANGED');
  assert.equal(token, 'account-b-token');
  assert.deepEqual(events, []);
  assert.deepEqual(redirects, []);
});

test('ordinary token refresh retries the request and retains authentication behavior', async () => {
  const axios = require('axios');
  let token = 'expired';
  let events = 0;
  const authSession = { getAccessToken: () => token, getVersion: () => 1, setAccessToken: (value) => { token = value; }, clear: () => {} };
  const service = axios.create({ adapter: async (config) => {
    if (config.url === '/auth/refresh') return { config, data: { code: 'SUCCESS', data: { accessToken: 'fresh', user: { id: 'a' } } } };
    if (token === 'expired') throw { config, response: { status: 401, data: { code: 'UNAUTHORIZED' } } };
    return { config, data: { code: 'SUCCESS', data: { list: [{ id: 'allowed' }] } } };
  } });
  const { http } = loadTs('utils/request', {
    axios: { default: { create: () => service } }, 'element-plus': { ElMessage: { error: () => {} } },
    './env': { apiBaseUrl: '/api/v1' }, '@/utils/authSession': { authSession }
  }, {
    window: { dispatchEvent: () => { events++; }, location: { pathname: '/dashboard', replace: () => assert.fail('must not redirect') } },
    CustomEvent: class {}
  });
  assert.equal((await http.get('/projects')).list[0].id, 'allowed');
  assert.equal(token, 'fresh');
  assert.equal(events, 1);
});

test('old successful HTTP responses are rejected after account switching', async () => {
  const axios = require('axios');
  const response = deferred();
  let version = 1;
  let config;
  const service = axios.create({ adapter: (next) => { config = next; return response.promise; } });
  const { http } = loadTs('utils/request', {
    axios: { default: { create: () => service } }, 'element-plus': { ElMessage: { error: () => {} } },
    './env': { apiBaseUrl: '/api/v1' }, '@/utils/authSession': { authSession: { getVersion: () => version, getAccessToken: () => 'token' } }
  });
  const pending = http.get('/projects').catch((error) => error);
  await tick();
  version++;
  response.resolve({ config, data: { code: 'SUCCESS', data: { list: [{ id: 'private' }] } } });
  assert.equal((await pending).code, 'SESSION_CHANGED');
});

function authHarness(api = {}) {
  const { createPinia, setActivePinia } = require('pinia');
  setActivePinia(createPinia());
  const { authSession } = loadTs('utils/authSession');
  const { useAuthStore } = loadTs('stores/auth', {
    '@/api/authApi': { authApi: api }, '@/utils/authSession': { authSession },
    '@/utils/env': { useMock: false }, '@/stores/project': { useProjectStore: () => ({ clearProject: () => {} }) }
  });
  return { auth: useAuthStore(), authSession };
}
const principal = (id) => ({ id, username: id, displayName: id, roles: [], permissions: ['project:read'], status: 'ACTIVE' });
const session = (id) => ({ accessToken: `token-${id}`, user: principal(id) });

test('late permission synchronization cannot replace the next account principal', async () => {
  const response = deferred();
  const { auth } = authHarness({ me: () => response.promise });
  auth.applySession(session('a'));
  const pending = auth.syncPrincipal();
  auth.applySession(session('b'));
  response.resolve(principal('a'));
  assert.equal(await pending, false);
  assert.equal(auth.principal.id, 'b');
});

test('initial authentication refresh cannot restore a cleared session', async () => {
  const response = deferred();
  const { auth, authSession } = authHarness({ refresh: () => response.promise });
  const pending = auth.initialize();
  auth.clearSession();
  response.resolve(session('a'));
  assert.equal(await pending, false);
  assert.equal(auth.principal, null);
  assert.equal(authSession.getAccessToken(), '');
});
