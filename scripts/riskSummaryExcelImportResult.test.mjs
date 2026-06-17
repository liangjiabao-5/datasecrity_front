import assert from 'assert';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { transform } from 'esbuild';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

async function loadHelper() {
  const sourcePath = path.join(rootDir, 'src', 'utils', 'riskSummaryExcelImportResult.ts');
  const source = await readFile(sourcePath, 'utf8');
  const result = await transform(source, {
    loader: 'ts',
    format: 'esm',
    target: 'es2020'
  });

  return import(`data:text/javascript;base64,${Buffer.from(result.code).toString('base64')}`);
}

const { normalizeRiskSummaryExcelImportResult } = await loadHelper();

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

runTest('keeps row-level import errors visible for partial failures', () => {
  const feedback = normalizeRiskSummaryExcelImportResult({
    importedCount: 3,
    failedCount: 1,
    errors: [
      {
        rowNo: 5,
        field: 'riskDescription',
        reason: 'required'
      }
    ]
  });

  assert.strictEqual(feedback.hasErrors, true);
  assert.strictEqual(feedback.importedCount, 3);
  assert.strictEqual(feedback.failedCount, 1);
  assert.deepStrictEqual(feedback.errors, [
    {
      rowNo: 5,
      field: 'riskDescription',
      reason: 'required'
    }
  ]);
});

runTest('uses errors length as failedCount fallback', () => {
  const feedback = normalizeRiskSummaryExcelImportResult({
    importedCount: 0,
    errors: [
      { rowNo: 2, field: 'riskTypes', reason: 'unknown option' },
      { rowNo: 3, field: 'relatedActivities', reason: 'unknown option' }
    ]
  });

  assert.strictEqual(feedback.hasErrors, true);
  assert.strictEqual(feedback.failedCount, 2);
});

runTest('unwraps nested data responses before normalization', () => {
  const feedback = normalizeRiskSummaryExcelImportResult({
    data: {
      importedCount: 4,
      failedCount: 0,
      errors: []
    }
  });

  assert.strictEqual(feedback.hasErrors, false);
  assert.strictEqual(feedback.importedCount, 4);
  assert.strictEqual(feedback.failedCount, 0);
  assert.deepStrictEqual(feedback.errors, []);
});
