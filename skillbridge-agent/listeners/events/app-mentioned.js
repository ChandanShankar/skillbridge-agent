import { AgentDeps, runAgent } from '../../agent/index.js';
import { buildOutOfScopeMessage, isLearningRelated } from '../../agent/learning-guard.js';
import { handleQuizSubscription } from '../../learning-nudges/index.js';
import { conversationStore } from '../../thread-context/index.js';
import { buildFeedbackBlocks } from '../views/feedback-builder.js';
import { buildAgentErrorMessage } from './error-message.js';

/**
 * @param {string} text
 * @returns {boolean}
 */
function isResetRequest(text) {
  return ['reset', 'start over', 'new topic', 'clear context'].includes(text.trim().toLowerCase());
}

/**
 * Handle app_mention events and run the agent.
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackEventMiddlewareArgs<'app_mention'>} args
 * @returns {Promise<void>}
 */
export async function handleAppMentioned({ client, context, event, logger, say, sayStream, setStatus }) {
  try {
    const channelId = event.channel;
    const text = event.text || '';
    const threadTs = event.thread_ts || event.ts;
    const userId = /** @type {string} */ (context.userId);

    // Strip the bot mention from the text
    const cleanedText = text.replace(/<@[A-Z0-9]+>/g, '').trim();

    if (!cleanedText) {
      await say({
        text: 'Hi, I can help with learning roadmaps, concept doubts, assignments, session plans, and mentor summaries.',
        thread_ts: threadTs,
      });
      return;
    }

    const handledSubscription = await handleQuizSubscription({
      client,
      channelId,
      userId,
      text: cleanedText,
      threadTs,
    });
    if (handledSubscription) return;

    if (isResetRequest(cleanedText)) {
      conversationStore.deleteHistory(channelId, threadTs);
      await say({
        text: 'Context cleared for this thread. Ask me a fresh Salesforce learning question when you are ready.',
        thread_ts: threadTs,
      });
      return;
    }

    if (!isLearningRelated(cleanedText)) {
      await say({
        text: buildOutOfScopeMessage(),
        thread_ts: threadTs,
      });
      return;
    }

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

    // Get conversation history
    const history = conversationStore.getHistory(channelId, threadTs);
    /** @type {string | Array<Record<string, any>>} */
    const inputItems = history ? [...history, { role: 'user', content: cleanedText }] : cleanedText;

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
    logger.error(`Failed to handle app mention: ${e}`);
    await say({
      text: buildAgentErrorMessage(e),
      thread_ts: event.thread_ts || event.ts,
    });
  }
}
