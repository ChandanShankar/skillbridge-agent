/**
 * Build a learner-friendly error message for Slack.
 * @param {unknown} error
 * @returns {string}
 */
export function buildAgentErrorMessage(error) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('429') || message.toLowerCase().includes('quota')) {
    return ':warning: Gemini API quota or rate limit was reached. Please wait, check Google AI Studio quota, or enable billing for higher limits.';
  }

  if (message.includes('401') || message.includes('403') || message.toLowerCase().includes('api key')) {
    return ':warning: The Gemini API key looks invalid or missing. Please update `GEMINI_API_KEY` in `.env` and restart the app.';
  }

  return ':warning: Something went wrong while preparing the answer. Please check the app terminal logs.';
}
