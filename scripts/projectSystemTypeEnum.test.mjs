import assert from 'assert';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

const filesToCheck = [
  'src/api/knowledgeApi.ts',
  'src/mock/db.ts',
  'src/utils/labels.ts',
  'src/components/project/ProjectDetailDialog.vue'
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

runTest('project system type options use the complete backend enum mapping', () => {
  const combinedSource = sources.map(({ source }) => source).join('\n');

  const expectedOptions = [
    ['POWER_MONITORING_SYSTEM', '电力监控系统'],
    ['MANAGEMENT_INFO_SYSTEM', '管理信息系统'],
    ['COMMUNICATION_NETWORK_FACILITY', '通信网络设施'],
    ['DATA_RESOURCE', '数据资源'],
    ['OTHER_SYSTEM_PLATFORM', '其他系统平台']
  ];

  for (const [id, name] of expectedOptions) {
    assert.match(combinedSource, new RegExp(`id: '${id}', name: '${name}'`));
  }

  for (const legacyId of ['POWER_CONTROL', 'MANAGEMENT_SYSTEM', 'NETWORK_FACILITY', 'OTHER_PLATFORM']) {
    assert.doesNotMatch(combinedSource, new RegExp(`['"]${legacyId}['"]`));
  }
});

runTest('mock project seed data only uses backend-supported system types', () => {
  const mockDb = sources.find((item) => item.relativePath === 'src/mock/db.ts');

  assert.ok(mockDb);
  const supportedIds = new Set([
    'POWER_MONITORING_SYSTEM',
    'MANAGEMENT_INFO_SYSTEM',
    'COMMUNICATION_NETWORK_FACILITY',
    'DATA_RESOURCE',
    'OTHER_SYSTEM_PLATFORM'
  ]);
  const seedSystemTypes = [...mockDb.source.matchAll(/systemType:\s*'([^']+)'/g)].map((match) => match[1]);

  assert.ok(seedSystemTypes.length > 0);
  assert.ok(seedSystemTypes.every((id) => supportedIds.has(id)));
});

runTest('project detail formats the system type enum as its Chinese label', () => {
  const labels = sources.find((item) => item.relativePath === 'src/utils/labels.ts');
  const projectListView = sources.find((item) => item.relativePath === 'src/components/project/ProjectDetailDialog.vue');

  assert.ok(labels);
  assert.ok(projectListView);
  assert.match(labels.source, /POWER_MONITORING_SYSTEM:\s*'电力监控系统'/);
  assert.match(labels.source, /MANAGEMENT_INFO_SYSTEM:\s*'管理信息系统'/);
  assert.match(labels.source, /COMMUNICATION_NETWORK_FACILITY:\s*'通信网络设施'/);
  assert.match(labels.source, /DATA_RESOURCE:\s*'数据资源'/);
  assert.match(labels.source, /OTHER_SYSTEM_PLATFORM:\s*'其他系统平台'/);
  assert.match(projectListView.source, /formatProjectSystemType\(detail\.systemType, detail\.systemTypeName\)/);
});
