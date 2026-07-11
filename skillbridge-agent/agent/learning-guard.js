const LEARNING_KEYWORDS = [
  'learn',
  'study',
  'skill',
  'course',
  'quiz',
  'question',
  'answer',
  'doubt',
  'mentor',
  'session',
  'assignment',
  'roadmap',
  'level',
  'beginner',
  'intermediate',
  'salesforce',
  'apex',
  'flow',
  'lwc',
  'admin',
  'trailhead',
  'sap',
  'pmp',
  'web development',
  'javascript',
  'python',
  'data',
  'soft skill',
  'interview',
  'career',
  'onboarding',
  'coding',
  'code',
  'yes',
  'yeah',
  'ok',
  'okay',
  'ready',
  'start',
  'new to coding',
  'test my level',
  'reset',
  'start over',
  'new topic',
  'clear context',
];

/**
 * @param {string} text
 * @returns {boolean}
 */
export function isLearningRelated(text) {
  const normalizedText = text.toLowerCase();
  return LEARNING_KEYWORDS.some((keyword) => normalizedText.includes(keyword));
}

/**
 * @returns {string}
 */
export function buildOutOfScopeMessage() {
  return (
    'I can help only with learning, upskilling, session preparation, quizzes, assignments, and mentor support. ' +
    'Please ask me about a course topic such as Salesforce, Apex, SAP, PMP, web development, data skills, soft skills, or interview prep.'
  );
}
