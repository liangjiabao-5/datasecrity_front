import assert from 'assert';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { transform } from 'esbuild';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

async function loadHelper() {
  const sourcePath = path.join(rootDir, 'src', 'utils', 'basicInfoExcelImportResult.ts');
  const source = await readFile(sourcePath, 'utf8');
  const result = await transform(source, {
    loader: 'ts',
    format: 'esm',
    target: 'es2020'
  });

  return import(`data:text/javascript;base64,${Buffer.from(result.code).toString('base64')}`);
}

const { normalizeBasicInfoExcelImportResult } = await loadHelper();

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

runTest('normalizes partial basic info import payloads with stable defaults', () => {
  const payload = normalizeBasicInfoExcelImportResult({
    projectNumber: 'P-001',
    projectName: '电力评估',
    laws: [{ id: 'law-1', name: '网络安全法' }],
    organization: { name: '被评估单位' },
    contacts: [{ name: '张三', mobile: '13800000000' }]
  });

  assert.strictEqual(payload.projectNumber, 'P-001');
  assert.strictEqual(payload.projectName, '电力评估');
  assert.deepStrictEqual(payload.laws, [{ id: 'law-1', name: '网络安全法' }]);
  assert.deepStrictEqual(payload.standards, []);
  assert.deepStrictEqual(payload.assessmentPlan, { startDate: '', endDate: '' });
  assert.deepStrictEqual(payload.organization, {
    name: '被评估单位',
    postalCode: ''
  });
  assert.deepStrictEqual(payload.contacts, [
    { id: undefined, name: '张三', department: '', mobile: '13800000000', title: '', phone: '', email: '' }
  ]);
});

runTest('unwraps data containers returned by API responses', () => {
  const payload = normalizeBasicInfoExcelImportResult({
    data: {
      projectCode: 'LEGACY-001',
      assessmentPlan: { startDate: '2026-06-01', endDate: '2026-06-10' },
      standards: [{ id: 'std-1', name: 'GB/T 35273' }]
    }
  });

  assert.strictEqual(payload.projectNumber, 'LEGACY-001');
  assert.deepStrictEqual(payload.assessmentPlan, { startDate: '2026-06-01', endDate: '2026-06-10' });
  assert.deepStrictEqual(payload.standards, [{ id: 'std-1', name: 'GB/T 35273' }]);
});
