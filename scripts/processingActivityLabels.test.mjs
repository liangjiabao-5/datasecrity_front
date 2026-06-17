import assert from 'assert';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { transform } from 'esbuild';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

async function loadLabels() {
  const sourcePath = path.join(rootDir, 'src', 'utils', 'labels.ts');
  const source = await readFile(sourcePath, 'utf8');
  const result = await transform(source, {
    loader: 'ts',
    format: 'esm',
    target: 'es2020'
  });

  return import(`data:text/javascript;base64,${Buffer.from(result.code).toString('base64')}`);
}

const { formatProcessingActivityList } = await loadLabels();

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

runTest('formats related processing activity codes as Chinese labels', () => {
  assert.strictEqual(formatProcessingActivityList(['STORE', 'TRANSFER', 'USE_PROCESS']), '存储、传输、使用和加工');
});

runTest('returns dash for empty related processing activity lists', () => {
  assert.strictEqual(formatProcessingActivityList([]), '-');
  assert.strictEqual(formatProcessingActivityList(undefined), '-');
});

runTest('keeps unknown processing activity values visible', () => {
  assert.strictEqual(formatProcessingActivityList(['COLLECT', 'CUSTOM_ACTIVITY']), '收集、CUSTOM_ACTIVITY');
});
