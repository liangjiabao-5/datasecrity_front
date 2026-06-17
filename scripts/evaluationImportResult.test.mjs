import assert from 'assert';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { transform } from 'esbuild';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

async function loadHelper() {
  const sourcePath = path.join(rootDir, 'src', 'utils', 'evaluationImportResult.ts');
  const source = await readFile(sourcePath, 'utf8');
  const result = await transform(source, {
    loader: 'ts',
    format: 'esm',
    target: 'es2020'
  });

  return import(`data:text/javascript;base64,${Buffer.from(result.code).toString('base64')}`);
}

const { normalizeEvaluationImportResult } = await loadHelper();

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

runTest('keeps row-level import errors visible when failedCount is positive', () => {
  const feedback = normalizeEvaluationImportResult({
    projectId: 'p-001',
    importedCount: 2,
    failedCount: 1,
    errors: [
      {
        rowNo: 2,
        field: '符合情况',
        reason: '符合情况列只能填写符合、基本符合、不符合、不适用或对应枚举值。'
      }
    ]
  });

  assert.strictEqual(feedback.hasErrors, true);
  assert.strictEqual(feedback.importedCount, 2);
  assert.strictEqual(feedback.failedCount, 1);
  assert.deepStrictEqual(feedback.errors, [
    {
      rowNo: 2,
      field: '符合情况',
      reason: '符合情况列只能填写符合、基本符合、不符合、不适用或对应枚举值。'
    }
  ]);
});

runTest('uses errors length as failedCount fallback for older partial responses', () => {
  const feedback = normalizeEvaluationImportResult({
    importedCount: 0,
    errors: [
      {
        rowNo: 3,
        field: '检查项编号',
        reason: '检查项编号与系统检查项不一致，请使用最新导出模板。'
      },
      {
        rowNo: 3,
        field: '检查要点',
        reason: '检查要点与系统检查项不一致，请使用最新导出模板。'
      }
    ]
  });

  assert.strictEqual(feedback.hasErrors, true);
  assert.strictEqual(feedback.failedCount, 2);
});

runTest('treats successful imports without failed rows as no-error feedback', () => {
  const feedback = normalizeEvaluationImportResult({
    importedCount: 5,
    failedCount: 0,
    errors: []
  });

  assert.strictEqual(feedback.hasErrors, false);
  assert.strictEqual(feedback.importedCount, 5);
  assert.strictEqual(feedback.failedCount, 0);
  assert.deepStrictEqual(feedback.errors, []);
});
