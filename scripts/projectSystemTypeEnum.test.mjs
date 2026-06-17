import assert from 'assert';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

const filesToCheck = [
  'src/api/knowledgeApi.ts',
  'src/mock/db.ts'
];

const sources = await Promise.all(
  filesToCheck.map(async (relativePath) => ({
    relativePath,
    source: await readFile(path.join(rootDir, relativePath), 'utf8')
  }))
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

runTest('project system type options use backend-supported OTHER_SYSTEM_PLATFORM enum', () => {
  const combinedSource = sources.map(({ source }) => source).join('\n');

  assert.match(combinedSource, /OTHER_SYSTEM_PLATFORM/);
  assert.doesNotMatch(combinedSource, /OTHER_PLATFORM/);
});

runTest('mock project seed data does not keep legacy OTHER_PLATFORM system type', () => {
  const mockDb = sources.find((item) => item.relativePath === 'src/mock/db.ts');

  assert.ok(mockDb);
  assert.doesNotMatch(mockDb.source, /systemType:\s*'OTHER_PLATFORM'/);
  assert.match(mockDb.source, /systemType:\s*'OTHER_SYSTEM_PLATFORM'/);
});
