/** @type {Record<string, { envKey: string, message: string }>} */
const CHANNEL_WELCOME_CONFIG = {
  announcements: {
    envKey: 'SKILLBRIDGE_ANNOUNCEMENTS_CHANNEL_ID',
    message:
      'Welcome <@{userId}> to #announcements. This is where SkillBridge shares cohort updates, session reminders, assignment deadlines, and important learning notices. Keep notifications on so you do not miss mentor-led activities.',
  },
  general: {
    envKey: 'SKILLBRIDGE_GENERAL_CHANNEL_ID',
    message:
      'Welcome <@{userId}> to #general. Use this space for quick introductions, community questions, and SkillBridge help. Try asking `Check my Apex level`, `Get a Salesforce Admin learning path`, or `Plan a mentor session for LWC`.',
  },
  'mentor-room': {
    envKey: 'SKILLBRIDGE_MENTOR_ROOM_CHANNEL_ID',
    message:
      'Welcome <@{userId}> to #mentor-room. This space is for mentors and admins to plan sessions, review learner blockers, assign practice work, and coordinate next steps. Ask SkillBridge to `Plan a mentor session for Apex triggers` when preparing a class.',
  },
  'learning-community': {
    envKey: 'SKILLBRIDGE_LEARNING_COMMUNITY_CHANNEL_ID',
    message:
      'Welcome <@{userId}> to #learning-community. Share what you want to learn, ask doubts in threads, and request guided practice. Start with `Check my Apex level`, `Check my LWC level`, or `I want a Salesforce Admin learning path`.',
  },
};

/**
 * @param {string} channelName
 * @returns {string}
 */
function normalizeChannelName(channelName) {
  return channelName.trim().toLowerCase();
}

/**
 * @param {string} template
 * @param {string} userId
 * @returns {string}
 */
function buildWelcomeMessage(template, userId) {
  return template.replaceAll('{userId}', userId);
}

/**
 * @param {string} channelId
 * @param {string | undefined} channelName
 * @returns {{ envKey: string, message: string } | undefined}
 */
function getWelcomeConfig(channelId, channelName) {
  const configuredMatch = Object.values(CHANNEL_WELCOME_CONFIG).find(
    (config) => process.env[config.envKey] === channelId,
  );
  if (configuredMatch) return configuredMatch;

  if (!channelName) return undefined;
  return CHANNEL_WELCOME_CONFIG[normalizeChannelName(channelName)];
}

/**
 * Handle member_joined_channel events with channel-specific onboarding messages.
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackEventMiddlewareArgs<'member_joined_channel'>} args
 * @returns {Promise<void>}
 */
export async function handleMemberJoinedChannel({ client, context, event, logger }) {
  if (event.user === context.botUserId) return;

  try {
    const info = await client.conversations.info({
      channel: event.channel,
    });
    const channelName = info.channel?.name;
    const welcomeConfig = getWelcomeConfig(event.channel, channelName);
    if (!welcomeConfig) return;

    await client.chat.postMessage({
      channel: event.channel,
      text: buildWelcomeMessage(welcomeConfig.message, event.user),
      unfurl_links: false,
      unfurl_media: false,
    });
  } catch (e) {
    logger.error(`Failed to welcome member joining channel ${event.channel}: ${e}`);
  }
}
