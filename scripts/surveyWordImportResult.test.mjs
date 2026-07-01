import assert from 'assert';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { transform } from 'esbuild';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

async function loadHelper() {
  const sourcePath = path.join(rootDir, 'src', 'utils', 'surveyWordImportResult.ts');
  const source = await readFile(sourcePath, 'utf8');
  const result = await transform(source, {
    loader: 'ts',
    format: 'esm',
    target: 'es2020'
  });

  return import(`data:text/javascript;base64,${Buffer.from(result.code).toString('base64')}`);
}

const { normalizeSurveyWordImportError } = await loadHelper();

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

runTest('extracts backend validation errors from ApiError data', () => {
  const feedback = normalizeSurveyWordImportError({
    code: 'IMPORT_VALIDATION_FAILED',
    message: '导入文件存在格式错误',
    data: {
      errors: [
        { tableName: '表A.3', rowNo: 4, field: '数据名称', reason: '不能为空' },
        { tableName: null, rowNo: 0, field: 'file', reason: '导入文件必须是 .docx 格式。' }
      ]
    }
  });

  assert.strictEqual(feedback.message, '导入文件存在格式错误');
  assert.strictEqual(feedback.hasErrors, true);
  assert.deepStrictEqual(feedback.errors, [
    { tableName: '表A.3', rowNo: 4, field: '数据名称', reason: '不能为空' },
    { tableName: '', rowNo: 0, field: 'file', reason: '导入文件必须是 .docx 格式。' }
  ]);
});

runTest('uses message fallback when backend does not return error rows', () => {
  const feedback = normalizeSurveyWordImportError({
    code: 'NETWORK_ERROR',
    message: '请求失败'
  });

  assert.strictEqual(feedback.message, '请求失败');
  assert.strictEqual(feedback.hasErrors, false);
  assert.deepStrictEqual(feedback.errors, []);
});
