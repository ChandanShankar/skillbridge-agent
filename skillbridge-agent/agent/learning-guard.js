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
  'permission set',
  'permission set group',
  'profile',
  'role hierarchy',
  'sharing rule',
  'org-wide default',
  'org wide default',
  'owd',
  'field-level security',
  'field level security',
  'fls',
  'validation rule',
  'soql',
  'trigger',
  'governor limit',
  'wire adapter',
  'custom event',
  'data cloud',
  'sales cloud',
  'service cloud',
  'marketing cloud',
  'experience cloud',
  'commerce cloud',
  'agentforce',
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
