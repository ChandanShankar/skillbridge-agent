import { buildSkillBridgeCommandModal } from '../views/skillbridge-command-modal.js';

const HOME_ACTIONS = {
  check_skill_gap: {
    title: 'Skill Gap',
    submitText: 'Check Gap',
    intro: 'Tell SkillBridge your target role or skill, plus what you already know.',
    placeholder: 'Example: I know JavaScript basics and want to become a Salesforce developer',
  },
  find_learning_path: {
    title: 'Learning Path',
    submitText: 'Find Path',
    intro: 'Tell SkillBridge the skill, course, or role you want a learning path for. You can give a timeline, or let SkillBridge choose one.',
    placeholder: 'Example: I want a 100-day job-ready Apex learning path',
  },
  find_mentor: {
    title: 'Find Mentor',
    submitText: 'Find Mentor',
    intro: 'Tell SkillBridge what topic you need mentor support for.',
    placeholder: 'Example: I need mentor help with Apex triggers and deployment errors',
  },
  ask_skillbridge: {
    title: 'Ask SkillBridge',
    submitText: 'Ask',
    intro: 'Ask any learning, assignment, interview, or mentor-support question.',
    placeholder: 'Example: Explain Salesforce Flow in simple words',
  },
};

/**
 * Handle App Home action buttons.
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackActionMiddlewareArgs} args
 * @returns {Promise<void>}
 */
export async function handleHomeAction({ ack, action, body, client, logger }) {
  await ack();

  try {
    const blockAction = /** @type {{ action_id: string }} */ (/** @type {unknown} */ (action));
    const actionBody = /** @type {{ trigger_id: string }} */ (/** @type {unknown} */ (body));
    const actionId = /** @type {keyof typeof HOME_ACTIONS} */ (blockAction.action_id);
    const config = HOME_ACTIONS[actionId] || HOME_ACTIONS.ask_skillbridge;

    await client.views.open({
      trigger_id: actionBody.trigger_id,
      view: buildSkillBridgeCommandModal(null, {
        source: actionId,
        ...config,
      }),
    });
  } catch (e) {
    logger.error(`Failed to handle App Home action: ${e}`);
  }
}
