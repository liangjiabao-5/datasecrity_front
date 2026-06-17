import assert from 'assert';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { transform } from 'esbuild';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

async function loadHelper() {
  const sourcePath = path.join(rootDir, 'src', 'utils', 'planTeamExcelImportResult.ts');
  const source = await readFile(sourcePath, 'utf8');
  const result = await transform(source, {
    loader: 'ts',
    format: 'esm',
    target: 'es2020'
  });

  return import(`data:text/javascript;base64,${Buffer.from(result.code).toString('base64')}`);
}

const { normalizePlanTeamExcelImportResult } = await loadHelper();

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

runTest('normalizes only assessment and client team sheets', () => {
  const payload = normalizePlanTeamExcelImportResult({
    assessmentTeam: [{ id: 'a1', name: '李四', organization: '评估机构', role: '组长' }],
    clientTeam: [{ name: '王五', department: '信息部', position: '经理', contact: '13900000000' }],
    focusPoints: [{ name: '不应处理' }]
  });

  assert.deepStrictEqual(payload.assessmentTeam, [
    { id: 'a1', name: '李四', organization: '评估机构', role: '组长' }
  ]);
  assert.deepStrictEqual(payload.clientTeam, [
    { id: undefined, department: '信息部', name: '王五', position: '经理', contact: '13900000000' }
  ]);
  assert.strictEqual('focusPoints' in payload, false);
});

runTest('unwraps data containers and defaults missing text fields', () => {
  const payload = normalizePlanTeamExcelImportResult({
    data: {
      assessmentTeam: [{ name: '赵六' }],
      clientTeam: [{ department: '安全部' }]
    }
  });

  assert.deepStrictEqual(payload.assessmentTeam, [
    { id: undefined, name: '赵六', organization: '', role: '' }
  ]);
  assert.deepStrictEqual(payload.clientTeam, [
    { id: undefined, department: '安全部', name: '', position: '', contact: '' }
  ]);
});
