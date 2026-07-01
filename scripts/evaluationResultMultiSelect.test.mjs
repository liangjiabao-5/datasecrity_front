import assert from 'assert';
import { readFileSync } from 'fs';

const evaluationView = readFileSync('src/views/workflow/EvaluationView.vue', 'utf8');
const evaluationTypes = readFileSync('src/types/evaluation.ts', 'utf8');
const workflowDb = readFileSync('src/mock/workflowDb.ts', 'utf8');

const resultSelect = evaluationView.match(/<el-select[^>]*v-model="query\.results"[^>]*>/)?.[0] || '';

assert.ok(resultSelect, 'evaluation result filter should bind to query.results');
assert.match(resultSelect, /\bmultiple\b/);
assert.match(resultSelect, /collapse-tags/);
assert.match(evaluationView, /results:\s*EvaluationResult\[\]/);
assert.match(evaluationView, /results:\s*\[\]/);
assert.match(evaluationView, /results:\s*query\.results\.length\s*\?\s*query\.results/);
assert.doesNotMatch(evaluationView, /query\.result\b/);

assert.match(evaluationTypes, /results\?: EvaluationResult\[\]/);
assert.match(workflowDb, /params\.results/);
assert.match(workflowDb, /includes\(item\.evaluationResult\)/);
