import assert from 'assert';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

const files = Object.fromEntries(
  await Promise.all(
    [
      'src/api/basicInfoApi.ts',
      'doc/模块开发文档/项目基本信息与评估团队/项目基本信息与评估团队Excel导入导出功能修改说明.md',
      'docs/superpowers/specs/2026-06-15-basic-info-plan-team-excel-design.md'
    ].map(async (relativePath) => [
      relativePath,
      await readFile(path.join(rootDir, relativePath), 'utf8')
    ])
  )
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

const apiSource = files['src/api/basicInfoApi.ts'];
const backendDoc = files['doc/模块开发文档/项目基本信息与评估团队/项目基本信息与评估团队Excel导入导出功能修改说明.md'];
const designDoc = files['docs/superpowers/specs/2026-06-15-basic-info-plan-team-excel-design.md'];

const currentBasicInfoLabels = [
  '项目编号',
  '项目名称',
  '评估所依据的法律法规',
  '评估所参考的标准规范',
  '评估开始日期',
  '评估结束日期',
  '单位名称',
  '邮政编码',
  '姓名',
  '所属部门',
  '移动电话',
  '职务/职称',
  '办公电话',
  '电子邮件'
];

const removedBasicInfoLabels = [
  '项目描述',
  '系统描述',
  '评估对象',
  '统一社会信用代码',
  '单位地址',
  '数据安全负责人',
  '公司简介'
];

runTest('basic info Excel template metadata lists current fields', () => {
  for (const label of ['项目基本情况', '被评估单位基本信息', '联系人信息', ...currentBasicInfoLabels]) {
    assert.match(apiSource, new RegExp(label));
  }

  for (const removedLabel of removedBasicInfoLabels) {
    assert.doesNotMatch(apiSource, new RegExp(removedLabel));
  }
});

runTest('backend handoff document describes current basic info import and export fields', () => {
  for (const label of ['项目基本情况', '被评估单位基本信息', '联系人信息', ...currentBasicInfoLabels]) {
    assert.match(backendDoc, new RegExp(label));
  }

  for (const removedLabel of removedBasicInfoLabels) {
    assert.doesNotMatch(backendDoc, new RegExp(removedLabel));
  }

  for (const key of ['projectNumber', 'projectName', 'organization.postalCode']) {
    assert.match(backendDoc, new RegExp(key));
  }

  for (const removedKey of [
    'projectDescription',
    'systemDescription',
    'assessmentTarget',
    'organization.creditCode',
    'organization.address',
    'organization.dataSecurityOwner',
    'organization.description'
  ]) {
    assert.doesNotMatch(backendDoc, new RegExp(removedKey.replace('.', '\\.')));
  }
});

runTest('design document describes current basic info Excel sheets', () => {
  for (const label of ['项目编号', '项目名称', '评估所依据的法律法规', '评估所参考的标准规范', '联系人信息']) {
    assert.match(designDoc, new RegExp(label));
  }

  for (const removedLabel of removedBasicInfoLabels) {
    assert.doesNotMatch(designDoc, new RegExp(removedLabel));
  }
});
