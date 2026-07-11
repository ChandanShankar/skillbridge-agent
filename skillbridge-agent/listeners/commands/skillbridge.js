import { AgentDeps, runAgent } from '../../agent/index.js';
import { buildOutOfScopeMessage, isLearningRelated } from '../../agent/learning-guard.js';
import { conversationStore } from '../../thread-context/index.js';
import { buildAgentErrorMessage } from '../events/error-message.js';
import { buildAgentResponseBlocks } from '../views/agent-response-builder.js';
import { buildSkillBridgeCommandModal } from '../views/skillbridge-command-modal.js';

/**
 * Handle the /skillbridge slash command.
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackCommandMiddlewareArgs} args
 * @returns {Promise<void>}
 */
export async function handleSkillBridgeCommand({ ack, client, command, context, logger, respond }) {
  await ack();

  const text = command.text.trim();
  const userId = command.user_id;
  const channelId = command.channel_id;

  try {
    if (!text) {
      await client.views.open({
        trigger_id: command.trigger_id,
        view: buildSkillBridgeCommandModal(channelId),
      });
      return;
    }

    if (!isLearningRelated(text)) {
      await respond({
        response_type: 'ephemeral',
        text: buildOutOfScopeMessage(),
      });
      return;
    }

    await respond({
      response_type: 'ephemeral',
      text: 'Preparing your SkillBridge learning plan...',
    });

    const threadKey = `slash:${command.trigger_id}`;
    const deps = new AgentDeps(client, userId, channelId, threadKey, command.trigger_id, context.userToken);
    const result = await runAgent(text, deps);

    await client.chat.postMessage({
      channel: channelId,
      text: result.finalOutput,
      blocks: buildAgentResponseBlocks(result.finalOutput),
    });

    conversationStore.setHistory(channelId, threadKey, result.history);
  } catch (e) {
    logger.error(`Failed to handle /skillbridge command: ${e}`);
    await respond({
      response_type: 'ephemeral',
      text: buildAgentErrorMessage(e),
    });
  }
}
