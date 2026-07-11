import { AgentDeps, runAgent } from '../../agent/index.js';
import { buildOutOfScopeMessage, isLearningRelated } from '../../agent/learning-guard.js';
import { conversationStore } from '../../thread-context/index.js';
import { buildAgentErrorMessage } from '../events/error-message.js';
import { buildAgentResponseBlocks } from './agent-response-builder.js';

/**
 * Handle SkillBridge slash command modal submissions.
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackViewMiddlewareArgs} args
 * @returns {Promise<void>}
 */
export async function handleSkillBridgeCommandSubmit({ ack, body, client, context, logger, view }) {
  const goal = view.state.values.learning_goal.goal.value?.trim() || '';

  if (!isLearningRelated(goal)) {
    await ack({
      response_action: 'errors',
      errors: {
        learning_goal: buildOutOfScopeMessage(),
      },
    });
    return;
  }

  await ack();

  try {
    const metadata = JSON.parse(view.private_metadata);
    const userId = body.user.id;
    const channelId = metadata.channelId || (await openUserDm(client, userId));
    const threadKey = `modal:${view.id}`;

    const deps = new AgentDeps(client, userId, channelId, threadKey, view.id, context.userToken);
    const result = await runAgent(buildHomeActionAgentInput(goal, metadata.source), deps);

    await client.chat.postMessage({
      channel: channelId,
      text: result.finalOutput,
      blocks: buildAgentResponseBlocks(result.finalOutput, goal),
    });

    conversationStore.setHistory(channelId, threadKey, result.history);
  } catch (e) {
    logger.error(`Failed to handle SkillBridge modal submission: ${e}`);
    const metadata = JSON.parse(view.private_metadata);
    const fallbackChannelId = metadata.channelId || (await openUserDm(client, body.user.id));
    await client.chat.postEphemeral({
      channel: fallbackChannelId,
      user: body.user.id,
      text: buildAgentErrorMessage(e),
    });
  }
}

/**
 * @param {import('@slack/web-api').WebClient} client
 * @param {string} userId
 * @returns {Promise<string>}
 */
async function openUserDm(client, userId) {
  const result = await client.conversations.open({ users: userId });
  if (!result.channel?.id) {
    throw new Error('Unable to open a SkillBridge DM for this user.');
  }
  return result.channel.id;
}

/**
 * @param {string} goal
 * @param {string | undefined} source
 * @returns {string}
 */
function buildHomeActionAgentInput(goal, source) {
  if (source === 'check_skill_gap') {
    return (
      'The user selected "Check Skill Gap". Do not create a learning plan yet. ' +
      'Ask exactly 3 short diagnostic questions to assess their current level, then say you will mark them Beginner or Intermediate after they answer.\n\n' +
      `Learner context: ${goal}`
    );
  }

  if (source === 'find_learning_path') {
    return (
      'The user selected "Find Learning Path". Create a practical, topic-wise learning path for this request. ' +
      'If the learner did not provide a timeline, choose a realistic timeline yourself. For beginner-to-job-ready Salesforce tracks, prefer a 100-day roadmap with weekly phases, practice tasks, checkpoints, and a clear next step.\n\n' +
      `Learner request: ${goal}`
    );
  }

  if (source === 'find_mentor') {
    return (
      'The user selected "Find Mentor". Help them prepare for mentor support. Summarize the topic, suggest what to ask a mentor, and recommend @mentor or @admin if the issue is advanced.\n\n' +
      `Mentor support request: ${goal}`
    );
  }

  return goal;
}
