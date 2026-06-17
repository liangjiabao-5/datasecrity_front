import assert from 'assert';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { transform } from 'esbuild';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

async function loadHelper() {
  const sourcePath = path.join(rootDir, 'src', 'utils', 'reportName.ts');
  const source = await readFile(sourcePath, 'utf8');
  const result = await transform(source, {
    loader: 'ts',
    format: 'esm',
    target: 'es2020'
  });

  return import(`data:text/javascript;base64,${Buffer.from(result.code).toString('base64')}`);
}

const { buildDefaultReportName } = await loadHelper();
const reportViewSource = await readFile(
  path.join(rootDir, 'src', 'views', 'workflow', 'ReportManagementView.vue'),
  'utf8'
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

runTest('builds risk assessment report name from company and project name', () => {
  assert.strictEqual(
    buildDefaultReportName({
      companyName: '\u0058\u0058\u94f6\u884c\u80a1\u4efd\u6709\u9650\u516c\u53f8',
      projectName: '\u004f\u0041\u529e\u516c\u7cfb\u7edf'
    }),
    '\u0058\u0058\u94f6\u884c\u80a1\u4efd\u6709\u9650\u516c\u53f8-\u004f\u0041\u529e\u516c\u7cfb\u7edf-\u6570\u636e\u5b89\u5168\u98ce\u9669\u8bc4\u4f30\u62a5\u544a'
  );
});

runTest('trims blank name parts and keeps a stable fallback', () => {
  assert.strictEqual(
    buildDefaultReportName({
      companyName: '  \u67d0\u7701\u7535\u529b\u6709\u9650\u516c\u53f8  ',
      projectName: '  '
    }),
    '\u67d0\u7701\u7535\u529b\u6709\u9650\u516c\u53f8-\u6570\u636e\u5b89\u5168\u98ce\u9669\u8bc4\u4f30\u62a5\u544a'
  );

  assert.strictEqual(
    buildDefaultReportName({ companyName: '', projectName: '' }),
    '\u9879\u76ee-\u6570\u636e\u5b89\u5168\u98ce\u9669\u8bc4\u4f30\u62a5\u544a'
  );
});

runTest('report generator dialog builds default name from project company and project name', () => {
  assert.match(reportViewSource, /import\s+\{\s*basicInfoApi\s*\}\s+from\s+['"]@\/api\/basicInfoApi['"]/);
  assert.match(reportViewSource, /basicInfoApi\.detail\(projectId\)/);
  assert.doesNotMatch(reportViewSource, /surveyApi\.listBusinessSystems\(projectId\)/);
  assert.match(reportViewSource, /buildDefaultReportName\(\{\s*companyName:/s);
  assert.match(reportViewSource, /companyName:\s*companyName\.value/s);
  assert.match(reportViewSource, /projectName:\s*reportProjectName\.value/s);
});
