import { AgentDeps, runAgent } from '../../agent/index.js';
import { buildOutOfScopeMessage, isLearningRelated } from '../../agent/learning-guard.js';
import { handleQuizAnswer, handleQuizSubscription } from '../../learning-nudges/index.js';
import { conversationStore } from '../../thread-context/index.js';
import { buildFeedbackBlocks } from '../views/feedback-builder.js';
import { buildAgentErrorMessage } from './error-message.js';

/**
 * @param {import('@slack/types').MessageEvent} event
 * @returns {event is import('@slack/types').GenericMessageEvent}
 */
function isGenericMessageEvent(event) {
  return !('subtype' in event && event.subtype !== undefined);
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function isResetRequest(text) {
  return ['reset', 'start over', 'new topic', 'clear context'].includes(text.trim().toLowerCase());
}

/**
 * Handle messages sent to the agent via DM or in threads the bot is part of.
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackEventMiddlewareArgs<'message'>} args
 * @returns {Promise<void>}
 */
export async function handleMessage({ client, context, event, logger, say, sayStream, setStatus }) {
  // Skip message subtypes (edits, deletes, etc.)
  if (!isGenericMessageEvent(event)) return;

  // Skip bot messages
  if (event.bot_id) return;

  const isDm = event.channel_type === 'im';
  const isThreadReply = !!event.thread_ts;

  if (isDm) {
    // DMs are always handled
  } else if (isThreadReply) {
    // Channel thread replies are handled only if the bot is already engaged
    const history = conversationStore.getHistory(event.channel, /** @type {string} */ (event.thread_ts));
    if (history === null) {
      const handledQuizAnswer = await handleQuizAnswer({
        client,
        channelId: event.channel,
        threadTs: /** @type {string} */ (event.thread_ts),
        userId: /** @type {string} */ (context.userId),
        text: event.text || '',
      });
      if (!handledQuizAnswer) return;
      return;
    }
  } else {
    // Top-level channel messages are handled by app_mentioned
    return;
  }

  try {
    const channelId = event.channel;
    const text = event.text || '';
    const threadTs = isDm ? `dm:${channelId}` : event.thread_ts || event.ts;
    const slackThreadTs = event.thread_ts || event.ts;
    const userId = /** @type {string} */ (context.userId);

    const handledSubscription = await handleQuizSubscription({
      client,
      channelId,
      userId,
      text,
      threadTs: isDm ? undefined : slackThreadTs,
    });
    if (handledSubscription) return;

    if (isResetRequest(text)) {
      conversationStore.deleteHistory(channelId, threadTs);
      await say({
        text: 'Context cleared. Ask me a fresh Salesforce learning question when you are ready.',
        thread_ts: isDm ? undefined : slackThreadTs,
      });
      return;
    }

    if (!isLearningRelated(text)) {
      await say({
        text: buildOutOfScopeMessage(),
        thread_ts: isDm ? undefined : slackThreadTs,
      });
      return;
    }

    // Get conversation history
    const history = conversationStore.getHistory(channelId, threadTs);

    // Set assistant thread status with loading messages
    await setStatus({
      status: 'Preparing a learning answer...',
      loading_messages: [
        'Checking the learning path...',
        'Building a practical example...',
        'Preparing mentor-style guidance...',
        'Turning the topic into next steps...',
      ],
    });

    // Build input for the agent
    /** @type {string | Array<Record<string, any>>} */
    const inputItems = history ? [...history, { role: 'user', content: text }] : text;

    // Run the agent
    const deps = new AgentDeps(client, userId, channelId, threadTs, event.ts, context.userToken);
    const result = await runAgent(inputItems, deps);

    // Stream response in thread with feedback buttons
    const streamer = sayStream();
    await streamer.append({ markdown_text: result.finalOutput });
    const feedbackBlocks = buildFeedbackBlocks();
    await streamer.stop({ blocks: feedbackBlocks });

    // Store conversation history
    conversationStore.setHistory(channelId, threadTs, result.history);
  } catch (e) {
    logger.error(`Failed to handle message: ${e}`);
    await say({
      text: buildAgentErrorMessage(e),
      thread_ts: event.thread_ts || event.ts,
    });
  }
}
