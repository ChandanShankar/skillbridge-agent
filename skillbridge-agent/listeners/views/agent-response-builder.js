import { buildFeedbackBlocks } from './feedback-builder.js';

const MAX_SECTION_TEXT_LENGTH = 2900;

/**
 * Build visible Slack blocks for an agent response plus feedback controls.
 * @param {string} markdownText
 * @param {string | null} [userQuestion]
 * @returns {import('@slack/types').KnownBlock[]}
 */
export function buildAgentResponseBlocks(markdownText, userQuestion = null) {
  /** @type {import('@slack/types').SectionBlock[]} */
  const questionBlocks = userQuestion
    ? [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Your question:*\n>${userQuestion.trim().replaceAll('\n', '\n>')}`,
          },
        },
      ]
    : [];

  /** @type {import('@slack/types').SectionBlock[]} */
  const responseBlocks = splitMarkdownForSections(markdownText).map((text) => ({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text,
    },
  }));

  return [...questionBlocks, ...responseBlocks, ...buildFeedbackBlocks()];
}

/**
 * @param {string} markdownText
 * @returns {string[]}
 */
function splitMarkdownForSections(markdownText) {
  const normalizedText = markdownText.trim() || 'I prepared a response, but it came back empty. Please try again.';
  const chunks = [];
  let currentChunk = '';

  for (const line of normalizedText.split('\n')) {
    const nextLine = currentChunk ? `${currentChunk}\n${line}` : line;

    if (nextLine.length <= MAX_SECTION_TEXT_LENGTH) {
      currentChunk = nextLine;
      continue;
    }

    if (currentChunk) chunks.push(currentChunk);
    currentChunk = line;
  }

  if (currentChunk) chunks.push(currentChunk);

  return chunks.flatMap(splitLongChunk);
}

/**
 * @param {string} chunk
 * @returns {string[]}
 */
function splitLongChunk(chunk) {
  if (chunk.length <= MAX_SECTION_TEXT_LENGTH) return [chunk];

  const parts = [];
  for (let start = 0; start < chunk.length; start += MAX_SECTION_TEXT_LENGTH) {
    parts.push(chunk.slice(start, start + MAX_SECTION_TEXT_LENGTH));
  }
  return parts;
}
