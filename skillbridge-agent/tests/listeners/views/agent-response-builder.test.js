import assert from 'node:assert';
import { describe, it } from 'node:test';

import { buildAgentResponseBlocks } from '../../../listeners/views/agent-response-builder.js';

describe('buildAgentResponseBlocks', () => {
  it('renders the agent response as a visible section before feedback controls', () => {
    const blocks = buildAgentResponseBlocks('**Skill check**\n- Question 1');

    assert.strictEqual(blocks[0].type, 'section');
    assert.strictEqual(blocks[0].text.type, 'mrkdwn');
    assert.strictEqual(blocks[0].text.text, '**Skill check**\n- Question 1');
    assert.strictEqual(blocks.at(-1).type, 'context_actions');
  });

  it('splits long responses into multiple section blocks', () => {
    const blocks = buildAgentResponseBlocks('a'.repeat(3001));
    const sectionBlocks = blocks.filter((block) => block.type === 'section');

    assert.ok(sectionBlocks.length > 1);
    assert.ok(sectionBlocks.every((block) => block.text.text.length <= 2900));
  });

  it('can render the user question before the agent response', () => {
    const blocks = buildAgentResponseBlocks('Answer text', 'I know JavaScript basics');

    assert.strictEqual(blocks[0].type, 'section');
    assert.match(blocks[0].text.text, /Your question/);
    assert.match(blocks[0].text.text, /I know JavaScript basics/);
    assert.strictEqual(blocks[1].text.text, 'Answer text');
  });
});
