import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isLearningRelated } from '../../agent/learning-guard.js';

describe('isLearningRelated', () => {
  it('allows Salesforce admin concept questions without the word Salesforce', () => {
    assert.strictEqual(isLearningRelated('what is permission set?'), true);
    assert.strictEqual(isLearningRelated('explain field level security'), true);
  });

  it('allows major Salesforce, SAP, and PMP learning topics', () => {
    assert.strictEqual(isLearningRelated('SOQL vs SOSL difference'), true);
    assert.strictEqual(isLearningRelated('what is SAP S/4HANA?'), true);
    assert.strictEqual(isLearningRelated('explain risk management for PMP'), true);
  });

  it('still rejects unrelated questions', () => {
    assert.strictEqual(isLearningRelated('what is the weather today?'), false);
  });
});
