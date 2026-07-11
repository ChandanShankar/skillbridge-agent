import { handleSkillBridgeCommandSubmit } from './skillbridge-command-submit.js';

/**
 * Register view listeners with the Bolt app.
 * @param {import('@slack/bolt').App} app
 * @returns {void}
 */
export function register(app) {
  app.view('skillbridge_command_submit', handleSkillBridgeCommandSubmit);
}
