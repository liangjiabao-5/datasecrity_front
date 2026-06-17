# 基本信息与评估团队 Excel 导入导出 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Excel template export, import, and export actions for project basic information and the two team tabs in assessment plan.

**Architecture:** The browser delegates Excel generation and parsing to backend file endpoints, matching the existing evaluation page pattern. Frontend changes are limited to API wrappers, download helpers, import-result normalization, page button wiring, and backend handoff documentation.

**Tech Stack:** Vue 3, TypeScript, Element Plus, Axios, Vite, existing script-based Node tests.

---

## File Structure

- Create `src/utils/basicInfoExcelImportResult.ts`: normalize backend import payloads into `BasicInfoPayload`.
- Create `src/utils/planTeamExcelImportResult.ts`: normalize backend import payloads into assessment/client team arrays.
- Modify `src/utils/fileActions.ts`: add a blob download helper for Excel responses.
- Modify `src/api/basicInfoApi.ts`: add template export, Excel export, and Excel import methods.
- Modify `src/api/planApi.ts`: add team template export, team Excel export, and team Excel import methods.
- Modify `src/views/workflow/BasicInfoView.vue`: add “导出模板”, switch import accept to Excel, call Excel API methods.
- Modify `src/views/workflow/AssessmentPlanView.vue`: add “导出模板”, switch import accept to Excel, call team Excel API methods.
- Create `scripts/basicInfoExcelImportResult.test.mjs`: test the normalization behavior before TypeScript implementation.
- Create `scripts/planTeamExcelImportResult.test.mjs`: test the team normalization behavior before TypeScript implementation.
- Create `doc/项目基本信息与评估团队Excel导入导出功能修改说明.md`: backend adjustment guide.

### Task 1: Add Basic Info Import Normalization

**Files:**
- Create: `scripts/basicInfoExcelImportResult.test.mjs`
- Create: `src/utils/basicInfoExcelImportResult.ts`

- [ ] **Step 1: Write the failing test**

```js
import assert from 'node:assert/strict';
import { normalizeBasicInfoExcelImportResult } from '../dist-test/basicInfoExcelImportResult.mjs';

const payload = normalizeBasicInfoExcelImportResult({
  projectNumber: 'P-001',
  projectName: '电力评估',
  laws: [{ id: 'law-1', name: '网络安全法' }],
  organization: { name: '被评估单位' },
  contacts: [{ name: '张三', mobile: '13800000000' }]
});

assert.equal(payload.projectNumber, 'P-001');
assert.equal(payload.projectName, '电力评估');
assert.deepEqual(payload.laws, [{ id: 'law-1', name: '网络安全法' }]);
assert.deepEqual(payload.standards, []);
assert.deepEqual(payload.assessmentPlan, { startDate: '', endDate: '' });
assert.equal(payload.organization.name, '被评估单位');
assert.equal(payload.organization.postalCode, '');
assert.deepEqual(payload.contacts, [
  { id: undefined, name: '张三', department: '', mobile: '13800000000', title: '', phone: '', email: '' }
]);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/basicInfoExcelImportResult.test.mjs`

Expected: FAIL because `../dist-test/basicInfoExcelImportResult.mjs` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `src/utils/basicInfoExcelImportResult.ts` exporting `normalizeBasicInfoExcelImportResult(payload)`. It must create defaults for missing text fields, arrays, `assessmentPlan`, `organization`, and contact optional fields.

- [ ] **Step 4: Run test to verify it passes**

Because the project has no direct TypeScript test runner, create a temporary ES module mirror in `dist-test/basicInfoExcelImportResult.mjs` during execution or adapt the script to test equivalent pure normalization code, then run:

Run: `node scripts/basicInfoExcelImportResult.test.mjs`

Expected: PASS with no assertion failures.

### Task 2: Add Plan Team Import Normalization

**Files:**
- Create: `scripts/planTeamExcelImportResult.test.mjs`
- Create: `src/utils/planTeamExcelImportResult.ts`

- [ ] **Step 1: Write the failing test**

```js
import assert from 'node:assert/strict';
import { normalizePlanTeamExcelImportResult } from '../dist-test/planTeamExcelImportResult.mjs';

const payload = normalizePlanTeamExcelImportResult({
  assessmentTeam: [{ id: 'a1', name: '李四', organization: '评估机构', role: '组长' }],
  clientTeam: [{ name: '王五', department: '信息部', position: '经理', contact: '13900000000' }],
  focusPoints: [{ name: '不应处理' }]
});

assert.deepEqual(payload.assessmentTeam, [
  { id: 'a1', name: '李四', organization: '评估机构', role: '组长' }
]);
assert.deepEqual(payload.clientTeam, [
  { id: undefined, department: '信息部', name: '王五', position: '经理', contact: '13900000000' }
]);
assert.equal('focusPoints' in payload, false);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/planTeamExcelImportResult.test.mjs`

Expected: FAIL because `../dist-test/planTeamExcelImportResult.mjs` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `src/utils/planTeamExcelImportResult.ts` exporting `normalizePlanTeamExcelImportResult(payload)`. It must return only `assessmentTeam` and `clientTeam`, default missing text fields to empty strings, and preserve optional ids.

- [ ] **Step 4: Run test to verify it passes**

Use the same temporary ES module mirror approach as Task 1, then run:

Run: `node scripts/planTeamExcelImportResult.test.mjs`

Expected: PASS with no assertion failures.

### Task 3: Add File Download and API Methods

**Files:**
- Modify: `src/utils/fileActions.ts`
- Modify: `src/api/basicInfoApi.ts`
- Modify: `src/api/planApi.ts`

- [ ] **Step 1: Add `downloadBlobFile`**

Add a helper that creates an object URL, clicks a temporary anchor, downloads the blob, and revokes the URL. Accept `fileName` and `blob`.

- [ ] **Step 2: Add basic info API methods**

Add:

```ts
exportTemplate(projectId: string): Promise<Blob>
exportFile(projectId: string): Promise<Blob>
importExcel(projectId: string, file: File): Promise<BasicInfoPayload>
```

Use endpoints:

```text
GET /projects/{projectId}/basic-info/export-template
GET /projects/{projectId}/basic-info/export
POST /projects/{projectId}/basic-info/import
```

- [ ] **Step 3: Add plan team API methods**

Add:

```ts
exportTeamTemplate(projectId: string): Promise<Blob>
exportTeamFile(projectId: string): Promise<Blob>
importTeams(projectId: string, file: File): Promise<PlanTeamExcelImportResult>
```

Use endpoints:

```text
GET /projects/{projectId}/plan/team-export-template
GET /projects/{projectId}/plan/team-export
POST /projects/{projectId}/plan/team-import
```

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`

Expected: TypeScript passes.

### Task 4: Wire Basic Info Page

**Files:**
- Modify: `src/views/workflow/BasicInfoView.vue`

- [ ] **Step 1: Add template button and Excel accept**

Change the action bar to include:

```vue
<el-button :icon="Download" @click="exportBasicInfoTemplate">导出模板</el-button>
<el-upload :auto-upload="false" :show-file-list="false" accept=".xlsx,.xls" :on-change="importBasicInfo">
  <el-button :icon="Upload">导入</el-button>
</el-upload>
```

- [ ] **Step 2: Replace JSON import/export logic**

Use `basicInfoApi.exportTemplate`, `basicInfoApi.exportFile`, and `basicInfoApi.importExcel`. Import result must pass through `normalizeBasicInfoExcelImportResult`, then assign to `form`.

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`

Expected: TypeScript passes.

### Task 5: Wire Assessment Plan Team Page

**Files:**
- Modify: `src/views/workflow/AssessmentPlanView.vue`

- [ ] **Step 1: Add template button and Excel accept**

Change the action bar to include:

```vue
<el-button :icon="Download" @click="exportTeamTemplate">导出模板</el-button>
<el-upload :auto-upload="false" :show-file-list="false" accept=".xlsx,.xls" :on-change="importPlan">
  <el-button :icon="Upload">导入</el-button>
</el-upload>
```

- [ ] **Step 2: Replace JSON team import/export logic**

Use `planApi.exportTeamTemplate`, `planApi.exportTeamFile`, and `planApi.importTeams`. After import, normalize the result, assign `assessmentTeam` and `clientTeam`, reload existing plan data, and leave `focusPoints` and `gapItems` untouched.

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`

Expected: TypeScript passes.

### Task 6: Add Backend Handoff Document

**Files:**
- Create: `doc/项目基本信息与评估团队Excel导入导出功能修改说明.md`

- [ ] **Step 1: Write backend-facing details**

Document exact endpoints, methods, Excel sheet names, columns, import behavior, export behavior, validation expectations, and response examples.

- [ ] **Step 2: Check document for scope**

Ensure it states that assessment plan import/export covers only `assessmentTeam` and `clientTeam`, not `focusPoints` or `gapItems`.

### Task 7: Final Verification

**Files:**
- All changed files.

- [ ] **Step 1: Run focused script tests**

Run:

```text
node scripts/basicInfoExcelImportResult.test.mjs
node scripts/planTeamExcelImportResult.test.mjs
```

Expected: both pass.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: exit code 0.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: exit code 0 and Vite build output.

- [ ] **Step 4: Git status check**

Run: `git status --short`

Expected: if Git metadata is unavailable, record that the workspace is not a Git repository; otherwise review changed files.
