import assert from 'node:assert';
import { describe, it } from 'node:test';

import { runGeminiAgent } from '../../agent/gemini-client.js';

describe('runGeminiAgent known Salesforce concepts', () => {
  it('answers permission set questions directly', async () => {
    const result = await runGeminiAgent('What is permission set in Salesforce?', 'test prompt');

    assert.match(result.finalOutput, /Permission set in Salesforce/);
    assert.match(result.finalOutput, /Topic: \*\*Salesforce Admin\*\*/);
    assert.match(result.finalOutput, /extra bundle of access/);
    assert.match(result.finalOutput, /without changing their profile/);
  });

  it('compares permission sets and profiles when asked for the difference', async () => {
    const result = await runGeminiAgent('permission set and profile difference', 'test prompt');

    assert.match(result.finalOutput, /Permission set vs Profile|Profile vs Permission set/);
    assert.match(result.finalOutput, /Topic: \*\*Salesforce Admin\*\*/);
    assert.match(result.finalOutput, /baseline access/);
    assert.match(result.finalOutput, /extra bundle of access/);
    assert.match(result.finalOutput, /Key differences/);
    assert.match(result.finalOutput, /Example/);
  });

  it('compares other known Salesforce concepts generically', async () => {
    const result = await runGeminiAgent('SOQL vs SOSL difference', 'test prompt');

    assert.match(result.finalOutput, /SOQL vs SOSL|SOSL vs SOQL/);
    assert.match(result.finalOutput, /Topic: \*\*Apex\*\*/);
    assert.match(result.finalOutput, /queries specific objects|searches text across multiple Salesforce objects/);
    assert.match(result.finalOutput, /Key differences/);
  });

  it('answers PMP concept questions directly', async () => {
    const result = await runGeminiAgent('What is risk management in PMP?', 'test prompt');

    assert.match(result.finalOutput, /Risk Management/);
    assert.match(result.finalOutput, /Topic: \*\*PMP and Project Management\*\*/);
    assert.match(result.finalOutput, /identifies uncertain events/);
  });

  it('answers SAP concept questions directly', async () => {
    const result = await runGeminiAgent('Explain SAP S/4HANA', 'test prompt');

    assert.match(result.finalOutput, /SAP S\/4HANA/);
    assert.match(result.finalOutput, /Topic: \*\*SAP\*\*/);
    assert.match(result.finalOutput, /modern ERP suite/);
  });

  it('distinguishes permission set groups from permission sets', async () => {
    const result = await runGeminiAgent('What is permission set group in Salesforce?', 'test prompt');

    assert.match(result.finalOutput, /Permission set group in Salesforce/);
    assert.match(result.finalOutput, /combines multiple permission sets/);
  });

  it('answers Salesforce Data Cloud questions directly', async () => {
    const result = await runGeminiAgent('What is Data Cloud in Salesforce?', 'test prompt');

    assert.match(result.finalOutput, /Salesforce Data Cloud/);
    assert.match(result.finalOutput, /Topic: \*\*Data Cloud\*\*/);
    assert.match(result.finalOutput, /unify profiles/);
  });

  it('answers Salesforce cloud questions directly', async () => {
    const result = await runGeminiAgent('Explain Service Cloud', 'test prompt');

    assert.match(result.finalOutput, /Service Cloud/);
    assert.match(result.finalOutput, /Topic: \*\*Salesforce Clouds\*\*/);
    assert.match(result.finalOutput, /Case management/);
  });

  it('answers Salesforce system administration questions directly', async () => {
    const result = await runGeminiAgent('What is field level security?', 'test prompt');

    assert.match(result.finalOutput, /Field-level security in Salesforce/);
    assert.match(result.finalOutput, /Topic: \*\*Salesforce System Administration\*\*/);
    assert.match(result.finalOutput, /specific field/);
  });

  it('answers Apex concept questions directly', async () => {
    const result = await runGeminiAgent('What is an Apex trigger?', 'test prompt');

    assert.match(result.finalOutput, /Apex trigger/);
    assert.match(result.finalOutput, /Topic: \*\*Apex\*\*/);
    assert.match(result.finalOutput, /record changes/);
  });

  it('answers LWC concept questions directly', async () => {
    const result = await runGeminiAgent('What is wire adapter in LWC?', 'test prompt');

    assert.match(result.finalOutput, /Wire adapter in LWC/);
    assert.match(result.finalOutput, /Topic: \*\*LWC\*\*/);
    assert.match(result.finalOutput, /reactively/);
  });
});
