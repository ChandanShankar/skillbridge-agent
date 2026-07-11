import { handleFeedbackButton } from './feedback-buttons.js';
import { handleHomeAction } from './home-actions.js';

/**
 * Register action listeners with the Bolt app.
 * @param {import('@slack/bolt').App} app
 * @returns {void}
 */
export function register(app) {
  app.action('feedback', handleFeedbackButton);
  app.action('check_skill_gap', handleHomeAction);
  app.action('find_learning_path', handleHomeAction);
  app.action('find_mentor', handleHomeAction);
  app.action('ask_skillbridge', handleHomeAction);
}
