import assert from 'assert';
import { existsSync, readFileSync } from 'fs';

const surveyView = readFileSync('src/views/workflow/SurveyView.vue', 'utf8');
const compactInputPath = 'src/components/CompactCellInput.vue';

assert.ok(existsSync(compactInputPath), 'data asset tables should use a reusable compact cell input component');

const compactInput = existsSync(compactInputPath) ? readFileSync(compactInputPath, 'utf8') : '';
const assetsPaneMatch = surveyView.match(/<el-tab-pane[^>]*name="assets"[\s\S]*?<el-tab-pane[^>]*name="processing"/);

assert.ok(assetsPaneMatch, 'SurveyView should contain the data assets tab pane');
const assetsPane = assetsPaneMatch?.[0] || '';

assert.match(surveyView, /import CompactCellInput from '@\/components\/CompactCellInput\.vue';/);
assert.ok(
  (assetsPane.match(/<CompactCellInput\s+v-model="row\.[^"]+"/g) || []).length >= 20,
  'all editable text cells in the data assets tab should use compact inputs'
);
assert.doesNotMatch(assetsPane, /<el-input\s+v-model="row\.[^"]+"/);

assert.match(compactInput, /<el-tooltip[\s\S]*:trigger="\['hover', 'focus'\]"/);
assert.match(compactInput, /<el-input[\s\S]*class="compact-cell-input"/);
assert.match(compactInput, /text-overflow:\s*ellipsis/);
