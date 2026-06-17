import assert from 'assert';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { transform } from 'esbuild';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

async function loadHelper() {
  const sourcePath = path.join(rootDir, 'src', 'utils', 'surveyBusinessSystem.ts');
  const source = await readFile(sourcePath, 'utf8');
  const result = await transform(source, {
    loader: 'ts',
    format: 'esm',
    target: 'es2020'
  });

  return import(`data:text/javascript;base64,${Buffer.from(result.code).toString('base64')}`);
}

const { emptyBusinessSystemForm, normalizeBusinessSystemForForm } = await loadHelper();

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

runTest('creates business form defaults with checkbox-friendly dataScopes', () => {
  const payload = emptyBusinessSystemForm();

  assert.deepStrictEqual(payload.dataScopes, []);
});

runTest('normalizes legacy dataScopes values before binding to checkbox group', () => {
  assert.deepStrictEqual(normalizeBusinessSystemForForm({ dataScopes: null }).dataScopes, []);
  assert.deepStrictEqual(normalizeBusinessSystemForForm({ dataScopes: 'general, personal' }).dataScopes, ['general', 'personal']);
  assert.deepStrictEqual(normalizeBusinessSystemForForm({ dataScopes: ['general', '', ' personal '] }).dataScopes, ['general', 'personal']);
});
