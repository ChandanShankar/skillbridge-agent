import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isLearningRelated } from '../../agent/learning-guard.js';

describe('isLearningRelated', () => {
  it('allows Salesforce admin concept questions without the word Salesforce', () => {
    assert.strictEqual(isLearningRelated('what is permission set?'), true);
    assert.strictEqual(isLearningRelated('explain field level security'), true);
  });

  it('still rejects unrelated questions', () => {
    assert.strictEqual(isLearningRelated('what is the weather today?'), false);
  });
});
