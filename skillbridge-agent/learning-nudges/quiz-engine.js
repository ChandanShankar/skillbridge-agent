import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_INTERVAL_MINUTES = 1440;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data');
const PROGRESS_FILE = path.join(DATA_DIR, 'learning-progress.json');

const QUESTION_BANK = [
  {
    topic: 'Apex',
    question: 'Which Apex collection stores only unique values: List, Set, or Map?',
    answerKeywords: ['set'],
    explanation: 'A Set stores unique values and automatically avoids duplicates.',
  },
  {
    topic: 'Apex',
    question: 'In Apex, which collection would you use to connect an Account Id to an Account record?',
    answerKeywords: ['map'],
    explanation: 'A Map connects a key to a value, such as Map<Id, Account>.',
  },
  {
    topic: 'Apex',
    question: 'What control statement helps Apex choose between two paths based on a condition?',
    answerKeywords: ['if', 'else', 'if-else'],
    explanation: 'An if-else statement runs different code depending on whether a condition is true.',
  },
  {
    topic: 'PMP',
    question: 'In risk management, what do we call a planned action for handling a known risk?',
    answerKeywords: ['response', 'risk response'],
    explanation: 'A risk response is the planned action for handling a risk.',
  },
  {
    topic: 'SAP',
    question: 'In SAP basics, what is master data: long-term reference data or one-time transaction data?',
    answerKeywords: ['long', 'reference', 'master'],
    explanation: 'Master data is long-term reference data used across transactions.',
  },
];

const activeQuestions = new Map();
const progressByUser = new Map();
const topicSubscriptionsByUser = new Map();
let storageLoaded = false;
let questionIndex = 0;

/**
 * @returns {string}
 */
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * @returns {{ subscriptions?: Record<string, string[]>, progress?: Record<string, any> }}
 */
function readStorageFile() {
  if (!existsSync(PROGRESS_FILE)) return {};
  return JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'));
}

/**
 * @returns {void}
 */
function ensureStorageLoaded() {
  if (storageLoaded) return;
  storageLoaded = true;

  const stored = readStorageFile();
  for (const [userId, topics] of Object.entries(stored.subscriptions || {})) {
    topicSubscriptionsByUser.set(userId, new Set(topics));
  }

  for (const [userId, progress] of Object.entries(stored.progress || {})) {
    progressByUser.set(userId, {
      correct: Number(progress.correct || 0),
      attempted: Number(progress.attempted || 0),
      stack: Number(progress.stack || 0),
      badges: new Set(progress.badges || []),
      days: progress.days || {},
    });
  }
}

/**
 * @returns {void}
 */
function saveStorageFile() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  const subscriptions = Object.fromEntries(
    [...topicSubscriptionsByUser.entries()].map(([userId, topics]) => [userId, [...topics]]),
  );
  const progress = Object.fromEntries(
    [...progressByUser.entries()].map(([userId, item]) => [
      userId,
      {
        correct: item.correct,
        attempted: item.attempted,
        stack: item.stack,
        badges: [...item.badges],
        days: item.days || {},
      },
    ]),
  );

  writeFileSync(PROGRESS_FILE, JSON.stringify({ subscriptions, progress }, null, 2));
}

/**
 * @param {string | undefined} value
 * @returns {string[]}
 */
function parseList(value) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * @param {string} value
 * @returns {string}
 */
function normalizeTopic(value) {
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * @param {string} text
 * @returns {{ action: 'subscribe' | 'unsubscribe' | 'list' | null, topic: string | null }}
 */
export function parseQuizSubscriptionCommand(text) {
  const normalizedText = text.trim();
  const match = normalizedText.match(/^(subscribe|unsubscribe)\s+(.+)$/i);
  if (match) {
    return {
      action: /** @type {'subscribe' | 'unsubscribe'} */ (match[1].toLowerCase()),
      topic: normalizeTopic(match[2]),
    };
  }

  if (/^(my topics|subscriptions|list subscriptions)$/i.test(normalizedText)) {
    return { action: 'list', topic: null };
  }

  return { action: null, topic: null };
}

/**
 * @param {string} userId
 * @returns {string[]}
 */
function getSubscribedTopics(userId) {
  ensureStorageLoaded();
  return [...(topicSubscriptionsByUser.get(userId) || new Set())];
}

/**
 * @param {string} userId
 * @param {string} topic
 */
function subscribeUser(userId, topic) {
  ensureStorageLoaded();
  const topics = topicSubscriptionsByUser.get(userId) || new Set();
  topics.add(normalizeTopic(topic));
  topicSubscriptionsByUser.set(userId, topics);
  saveStorageFile();
  return [...topics];
}

/**
 * @param {string} userId
 * @param {string} topic
 */
function unsubscribeUser(userId, topic) {
  ensureStorageLoaded();
  const topics = topicSubscriptionsByUser.get(userId) || new Set();
  const normalizedTopic = normalizeTopic(topic).toLowerCase();
  for (const savedTopic of topics) {
    if (savedTopic.toLowerCase() === normalizedTopic) {
      topics.delete(savedTopic);
    }
  }
  topicSubscriptionsByUser.set(userId, topics);
  saveStorageFile();
  return [...topics];
}

/**
 * @param {string} topic
 */
function nextQuestion(topic) {
  const matchingQuestions = QUESTION_BANK.filter((item) => item.topic.toLowerCase() === topic.toLowerCase());
  const questions = matchingQuestions.length ? matchingQuestions : QUESTION_BANK;
  const question = questions[questionIndex % questions.length];
  questionIndex += 1;
  return question;
}

/**
 * @param {string} userId
 * @param {boolean} isCorrect
 */
function updateProgress(userId, isCorrect) {
  ensureStorageLoaded();
  const progress = progressByUser.get(userId) || {
    correct: 0,
    attempted: 0,
    stack: 0,
    badges: new Set(),
    days: {},
  };
  progress.days ||= {};

  progress.attempted += 1;
  if (isCorrect) {
    progress.correct += 1;
    progress.stack += 1;
  } else {
    progress.stack = 0;
  }

  if (progress.attempted >= 1) progress.badges.add('First Step');
  if (progress.correct >= 3) progress.badges.add('3-Star Learner');
  if (progress.stack >= 5) progress.badges.add('5 Stack Streak');
  if (progress.correct >= 10) progress.badges.add('Trail Builder');

  const dayKey = todayKey();
  const day = progress.days[dayKey] || { attempted: 0, correct: 0, stack: 0 };
  day.attempted += 1;
  if (isCorrect) {
    day.correct += 1;
    day.stack += 1;
  } else {
    day.stack = 0;
  }
  progress.days[dayKey] = day;

  if (day.correct >= 3) progress.badges.add('Daily 3 Stack');
  if (Object.keys(progress.days).length >= 3) progress.badges.add('3-Day Learner');

  progressByUser.set(userId, progress);
  saveStorageFile();
  return progress;
}

/**
 * @param {string[]} badges
 */
function formatBadges(badges) {
  return badges.length ? badges.join(', ') : 'No badges yet';
}

/**
 * @param {import('@slack/bolt').App} app
 * @returns {void}
 */
export function startLearningNudges(app) {
  if (process.env.SKILLBRIDGE_NUDGE_ENABLED !== 'true') return;
  ensureStorageLoaded();

  const channels = parseList(process.env.SKILLBRIDGE_NUDGE_CHANNELS);
  const users = parseList(process.env.SKILLBRIDGE_NUDGE_USERS);
  const defaultTopics = parseList(process.env.SKILLBRIDGE_NUDGE_TOPIC || 'Apex');
  for (const user of users) {
    for (const topic of defaultTopics) {
      subscribeUser(user, topic);
    }
  }

  if (!channels.length && !users.length) {
    app.logger.warn('SkillBridge nudges are enabled, but no channels or users are configured.');
    return;
  }

  const intervalMinutes =
    Number.parseInt(process.env.SKILLBRIDGE_NUDGE_INTERVAL_MINUTES || '', 10) || DEFAULT_INTERVAL_MINUTES;

  const postQuestion = async () => {
    for (const user of users) {
      for (const topic of getSubscribedTopics(user)) {
        const question = nextQuestion(topic);
        const result = await app.client.chat.postMessage({
          channel: user,
          text:
            `SkillBridge daily quiz: ${question.topic}\n\n${question.question}\n\n` +
            'Reply in this thread. I will score your answer and update your stack.',
        });

        if (result.ts) {
          activeQuestions.set(`${user}:${result.ts}`, question);
        }
      }
    }

    for (const channel of channels) {
      for (const topic of defaultTopics) {
        const question = nextQuestion(topic);
        const result = await app.client.chat.postMessage({
          channel,
          text:
            `SkillBridge quiz: ${question.topic}\n\n${question.question}\n\n` +
            'Reply in this thread. I will score your answer and update your stack.',
        });

        if (result.ts) {
          activeQuestions.set(`${channel}:${result.ts}`, question);
        }
      }
    }
  };

  setTimeout(() => {
    postQuestion().catch((error) => app.logger.error(`Failed to post SkillBridge quiz: ${error}`));
  }, 5000);

  setInterval(
    () => {
      postQuestion().catch((error) => app.logger.error(`Failed to post SkillBridge quiz: ${error}`));
    },
    intervalMinutes * 60 * 1000,
  );

  app.logger.info(
    `SkillBridge nudges enabled every ${intervalMinutes} minutes for ${channels.length} channel(s) and ${users.length} user(s).`,
  );
}

/**
 * @param {object} args
 * @param {import('@slack/web-api').WebClient} args.client
 * @param {string} args.channelId
 * @param {string} args.userId
 * @param {string} args.text
 * @param {string | undefined} [args.threadTs]
 * @returns {Promise<boolean>}
 */
export async function handleQuizSubscription({ client, channelId, userId, text, threadTs = undefined }) {
  const command = parseQuizSubscriptionCommand(text);
  if (!command.action) return false;

  if (command.action === 'list') {
    const topics = getSubscribedTopics(userId);
    await client.chat.postMessage({
      channel: channelId,
      thread_ts: threadTs,
      text: topics.length
        ? `You are subscribed to: ${topics.join(', ')}`
        : 'You are not subscribed to any quiz topics yet. Try `subscribe Apex`.',
    });
    return true;
  }

  if (!command.topic) return false;

  const topics =
    command.action === 'subscribe' ? subscribeUser(userId, command.topic) : unsubscribeUser(userId, command.topic);

  await client.chat.postMessage({
    channel: channelId,
    thread_ts: threadTs,
    text:
      command.action === 'subscribe'
        ? `Subscribed you to daily ${command.topic} quiz nudges. Current topics: ${topics.join(', ')}`
        : `Unsubscribed you from ${command.topic}. Current topics: ${topics.length ? topics.join(', ') : 'none'}`,
  });

  return true;
}

/**
 * @param {object} args
 * @param {import('@slack/web-api').WebClient} args.client
 * @param {string} args.channelId
 * @param {string} args.threadTs
 * @param {string} args.userId
 * @param {string} args.text
 * @returns {Promise<boolean>}
 */
export async function handleQuizAnswer({ client, channelId, threadTs, userId, text }) {
  const question = activeQuestions.get(`${channelId}:${threadTs}`);
  if (!question) return false;

  const normalizedAnswer = text.toLowerCase();
  const isCorrect = question.answerKeywords.some((/** @type {string} */ keyword) =>
    normalizedAnswer.includes(keyword.toLowerCase()),
  );
  const progress = updateProgress(userId, isCorrect);
  const badges = formatBadges([...progress.badges]);
  const day = progress.days?.[todayKey()] || { attempted: 0, correct: 0, stack: 0 };

  await client.chat.postMessage({
    channel: channelId,
    thread_ts: threadTs,
    text:
      `${isCorrect ? 'Correct.' : 'Good try.'} ${question.explanation}\n\n` +
      `Your learning stack: ${progress.stack}\n` +
      `Today's stack: ${day.stack}\n` +
      `Score: ${progress.correct}/${progress.attempted}\n` +
      `Today: ${day.correct}/${day.attempted}\n` +
      `Badges: ${badges}\n\n` +
      'Next step: Keep answering quiz questions to build your stack.',
  });

  return true;
}
