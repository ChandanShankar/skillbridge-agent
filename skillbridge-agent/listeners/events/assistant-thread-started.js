const SUGGESTED_PROMPTS = [
  { title: 'Check Skill Levels', message: 'Check my Apex skill level with questions specific to Apex basics.' },
  { title: 'Get Learning Path', message: 'I want a 100-day Salesforce Admin mastery learning path with practice tasks.' },
  { title: 'Plan Mentor Session', message: 'Plan a mentor session for LWC learners with assignments and Q&A support.' },
  { title: 'Explain Simply', message: 'Explain this Salesforce concept in simple words with a real-world example.' },
];

/**
 * Handle assistant_thread_started events by setting suggested prompts.
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackEventMiddlewareArgs<'assistant_thread_started'>} args
 * @returns {Promise<void>}
 */
export async function handleAssistantThreadStarted({ client, event, logger }) {
  const { channel_id: channelId, thread_ts: threadTs } = event.assistant_thread;

  try {
    await client.assistant.threads.setSuggestedPrompts({
      channel_id: channelId,
      thread_ts: threadTs,
      title: 'What do you want to learn or prepare today?',
      prompts: SUGGESTED_PROMPTS,
    });
  } catch (e) {
    logger.error(`Failed to handle assistant thread started: ${e}`);
  }
}
