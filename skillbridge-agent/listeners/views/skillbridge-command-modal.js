/**
 * Build the slash command modal for collecting a learning goal.
 * @param {string | null} channelId
 * @param {object} [options]
 * @param {string} [options.source]
 * @param {string} [options.title]
 * @param {string} [options.submitText]
 * @param {string} [options.intro]
 * @param {string} [options.placeholder]
 * @returns {import('@slack/types').ModalView}
 */
export function buildSkillBridgeCommandModal(channelId, options = {}) {
  const title = options.title || 'SkillBridge';
  const submitText = options.submitText || 'Create Plan';
  const intro = options.intro || 'Tell SkillBridge what you want to learn or what role you are aiming for.';
  const placeholder = options.placeholder || 'Example: I want to become a Salesforce developer';

  return {
    type: 'modal',
    callback_id: 'skillbridge_command_submit',
    private_metadata: JSON.stringify({ channelId, source: options.source || 'slash_command' }),
    title: {
      type: 'plain_text',
      text: title,
    },
    submit: {
      type: 'plain_text',
      text: submitText,
    },
    close: {
      type: 'plain_text',
      text: 'Cancel',
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: intro,
        },
      },
      {
        type: 'input',
        block_id: 'learning_goal',
        label: {
          type: 'plain_text',
          text: 'Learning goal',
        },
        element: {
          type: 'plain_text_input',
          action_id: 'goal',
          multiline: true,
          placeholder: {
            type: 'plain_text',
            text: placeholder,
          },
        },
      },
    ],
  };
}
