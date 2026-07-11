/**
 * Build the App Home Block Kit view.
 * @param {string | null} [installUrl] - OAuth install URL shown when MCP is disconnected.
 * @param {boolean} [isConnected] - Whether the Slack MCP Server is connected.
 * @param {string | null} [logoUrl] - Public HTTPS URL for the SkillBridge Agent logo.
 * @returns {import('@slack/types').HomeView}
 */
export function buildAppHomeView(installUrl = null, isConnected = false, logoUrl = null) {
  /** @type {import('@slack/types').KnownBlock[]} */
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: 'SkillBridge Agent',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          '*Welcome to SkillBridge Agent!* :rocket:\n' +
          'Your learning assistant inside Slack.\n\n' +
          '*Choose an action:*',
      },
      ...(logoUrl
        ? {
            accessory: {
              type: 'image',
              image_url: logoUrl,
              alt_text: 'SkillBridge Agent logo',
            },
          }
        : {}),
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Check Skill Gap',
          },
          action_id: 'check_skill_gap',
          value: 'check_skill_gap',
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Find Learning Path',
          },
          action_id: 'find_learning_path',
          value: 'find_learning_path',
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Find Mentor',
          },
          action_id: 'find_mentor',
          value: 'find_mentor',
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Ask SkillBridge',
          },
          action_id: 'ask_skillbridge',
          value: 'ask_skillbridge',
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          '*Try:*\n' +
          '- `Check my Apex level`\n' +
          '- `I want a 100-day Apex learning path`\n' +
          '- `Give me a beginner assignment for PMP risk management`\n' +
          '- `Create an Apex session plan`\n' +
          '- `I have an Apex deployment error`',
      },
    },
    { type: 'divider' },
  ];

  if (isConnected) {
    blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Slack MCP Server is connected.*',
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: 'The agent can use Slack channels, canvases, and files as the live knowledge base.',
          },
        ],
      },
    );
  } else if (installUrl) {
    blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Slack MCP Server is disconnected.* <${installUrl}|Connect the Slack MCP Server.>`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: 'Slack MCP enables channel summaries, canvas reading, and Slack-hosted training documents.',
          },
        ],
      },
    );
  } else {
    blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Slack MCP Server is disconnected.* Learn how to enable it for channel summaries and mentor workflows.',
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: 'You can still use roadmaps, explanations, and assignment generation without MCP.',
          },
        ],
      },
    );
  }

  return { type: 'home', blocks };
}
