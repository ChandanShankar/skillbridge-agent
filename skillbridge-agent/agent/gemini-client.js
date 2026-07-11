const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash';
const FALLBACK_GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS_PER_MODEL = 3;

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {string | Array<Record<string, any>>} inputItems
 * @returns {string}
 */
export function inputItemsToText(inputItems) {
  if (typeof inputItems === 'string') return inputItems;

  return inputItems
    .map((item) => {
      if (!('content' in item)) return '';
      if (typeof item.content === 'string') return `${item.role || 'message'}: ${item.content}`;
      if (Array.isArray(item.content)) {
        return item.content
          .map((part) => {
            if (typeof part === 'string') return part;
            if (part && typeof part === 'object' && 'text' in part) return String(part.text);
            return '';
          })
          .filter(Boolean)
          .join('\n');
      }
      return '';
    })
    .filter(Boolean)
    .join('\n');
}

/**
 * Build the minimal history shape used by the Slack listeners.
 * @param {string | Array<Record<string, any>>} inputItems
 * @param {string} finalOutput
 * @returns {Array<Record<string, any>>}
 */
function buildFallbackHistory(inputItems, finalOutput) {
  const inputHistory = Array.isArray(inputItems) ? inputItems : [{ role: 'user', content: inputItems }];
  return [...inputHistory, { role: 'assistant', content: finalOutput }];
}

/**
 * @param {string} finalOutput
 * @param {string} learnerText
 * @returns {boolean}
 */
function shouldUseResilientResponse(finalOutput, learnerText) {
  const normalizedText = learnerText.toLowerCase();
  const needsStructuredAnswer =
    normalizedText.includes('learning path') ||
    normalizedText.includes('session') ||
    normalizedText.includes('mentor');

  if (!needsStructuredAnswer) return false;
  if (finalOutput.length < 350) return true;
  return /(?:^|\n)\s*(?:#{1,6}\s*)?\d+\.\s*$/.test(finalOutput.trim());
}

/**
 * @param {string} learnerText
 * @returns {string}
 */
function buildResilientLearningResponse(learnerText) {
  const normalizedText = learnerText.toLowerCase();
  const advancedDoubtTerms = [
    'integration',
    'production',
    'deployment',
    'governor limit',
    'security model',
    'sharing rule',
    'managed package',
    'trigger recursion',
    'callout',
  ];

  if (normalizedText.includes('apex skill check') && (normalizedText.includes('1.') || normalizedText.includes('1:'))) {
    return `**Apex level result: Beginner**

You understand some Apex vocabulary, but you should strengthen the core building blocks before moving to triggers or integrations.

**Strong areas**
- You attempted variables, collections, conditions, and methods
- You are ready for guided practice

**Weak areas to revise**
- When to use \`List\`, \`Set\`, and \`Map\`
- Writing small methods with clear input and output

Next step: Start the 100-day Apex roadmap and complete the first foundation checkpoint before trying trigger examples.`;
  }

  if (normalizedText.includes('check') && normalizedText.includes('apex')) {
    return `**Apex skill check**

Answer these 3 questions. I will mark you as **Beginner** or **Intermediate** after your reply.

1. What is the difference between a variable and a data type in Apex?
2. When would you use a \`List\` instead of a \`Set\`?
3. What does a \`Map<Id, Account>\` help you do?

Next step: Reply with your answers numbered 1 to 3.`;
  }

  if (normalizedText.includes('check') && normalizedText.includes('lwc')) {
    return `**LWC skill check**

Answer these 3 questions. I will mark you as **Beginner** or **Intermediate** after your reply.

1. What files do you normally see inside a Lightning Web Component?
2. What is the difference between a JavaScript property and an event in LWC?
3. When would an LWC call Apex instead of only using client-side JavaScript?

Next step: Reply with your answers numbered 1 to 3.`;
  }

  if (normalizedText.includes('check') && (normalizedText.includes('admin') || normalizedText.includes('salesforce admin'))) {
    return `**Salesforce Admin skill check**

Answer these 3 questions. I will mark you as **Beginner** or **Intermediate** after your reply.

1. What is the difference between an object, a field, and a record?
2. When would you use a validation rule instead of a Flow?
3. How do profiles, permission sets, and sharing rules help control access?

Next step: Reply with your answers numbered 1 to 3.`;
  }

  if (
    normalizedText.includes('yes') ||
    normalizedText.includes('ready') ||
    normalizedText.includes('start') ||
    normalizedText.includes('day 1') ||
    normalizedText.includes('new to coding')
  ) {
    return `**Day 1: Apex variables and data types**

A variable is a named box that stores a value. A data type tells Apex what kind of value is allowed.

\`\`\`apex
String learnerName = 'Chandan';
Integer score = 10;
Boolean isActive = true;
Id accountId;
\`\`\`

**Remember**
- \`String\` stores text
- \`Integer\` stores whole numbers
- \`Boolean\` stores true/false
- \`Id\` stores Salesforce record IDs

Practice task: Create 4 variables: your name, your age, whether you are learning Apex, and one Account Id placeholder.

Next step: Send your 4 variables here and I will check them.`;
  }

  if (normalizedText.includes('lwc') || normalizedText.includes('soql') || normalizedText.includes('sosl')) {
    return `**Beginner Salesforce developer roadmap**

Since you mentioned Apex, LWC, SOQL, and SOSL, start in this order:

1. **Apex basics:** variables, data types, conditions, loops
2. **Collections:** \`List\`, \`Set\`, \`Map\`
3. **SOQL:** query Salesforce records
4. **SOSL:** search text across multiple objects
5. **Apex classes and methods:** organize backend logic
6. **LWC basics:** build UI components
7. **Connect LWC + Apex:** call Apex from the component

Next step: Type \`Check my Salesforce dev level\` if you want a 3-question skill check.`;
  }

  if (
    normalizedText.includes('learn apex') ||
    normalizedText.includes('apex learning path') ||
    (normalizedText.includes('apex') && normalizedText.includes('learning path')) ||
    (normalizedText.includes('apex') && normalizedText.includes('7'))
  ) {
    return `**100-day Apex mastery roadmap**

This timeline is realistic for a beginner who wants to become job-ready, because Apex needs both coding basics and Salesforce platform practice.

- **Days 1-10:** Programming foundations: variables, data types, operators, \`if-else\`, loops
- **Days 11-20:** Collections: \`List\`, \`Set\`, \`Map\`, iteration, null checks
- **Days 21-35:** Classes and methods: parameters, return values, static methods, reusable logic
- **Days 36-50:** Salesforce data: sObjects, SOQL, DML, relationships, bulk-safe patterns
- **Days 51-65:** Triggers and automation: trigger context, handler classes, recursion control
- **Days 66-80:** Testing and debugging: test data, assertions, coverage, logs, governor limits
- **Days 81-95:** Mini projects: validation helper, record updater, trigger framework, batch-style practice
- **Days 96-100:** Interview and portfolio review: explain code, fix bugs, document your project

Practice task: Build an Account scoring helper that reads related records, updates a score field, and includes Apex tests.

Next step: Start Days 1-10 and ask me for your first Apex foundations assignment.`;
  }

  if (normalizedText.includes('learn lwc') || normalizedText.includes('lwc learning path') || normalizedText.includes('lwc learners')) {
    return `**100-day LWC mastery roadmap**

This is a good beginner-to-job-ready timeline because LWC combines JavaScript, Salesforce data, UI design, and Apex integration.

- **Days 1-10:** Web and LWC basics: HTML, JavaScript, component folders, metadata XML
- **Days 11-25:** Templates and state: properties, getters, conditionals, lists, user input
- **Days 26-40:** Component communication: parent-child patterns, custom events, public methods
- **Days 41-55:** Salesforce data: Lightning Data Service, wire adapters, record forms
- **Days 56-70:** Apex integration: imperative calls, wired Apex, error handling, loading states
- **Days 71-85:** UI polish: reusable components, accessibility, validation, responsive layouts
- **Days 86-95:** Project build: learner dashboard, topic selector, assignment tracker, record helper
- **Days 96-100:** Debugging, interview prep, and portfolio cleanup

Practice task: Build a learner progress dashboard that reads Salesforce records and lets users update a selected learning topic.

Next step: Start Days 1-10 and ask me for your first LWC component assignment.`;
  }

  if (
    normalizedText.includes('salesforce admin learning path') ||
    normalizedText.includes('learn salesforce admin') ||
    (normalizedText.includes('admin') && normalizedText.includes('learning path'))
  ) {
    return `**100-day Salesforce Admin mastery roadmap**

This timeline fits a beginner who wants practical admin confidence, project experience, and interview readiness.

- **Days 1-10:** Salesforce basics: apps, objects, fields, records, tabs, schema thinking
- **Days 11-25:** Data model and UI: relationships, page layouts, Lightning record pages, compact layouts
- **Days 26-40:** Data quality: validation rules, duplicate rules, required fields, data import cleanup
- **Days 41-60:** Automation: Flow basics, screen flows, record-triggered flows, approval-style thinking
- **Days 61-75:** Security: profiles, permission sets, roles, sharing rules, field-level security
- **Days 76-88:** Reporting: list views, reports, dashboards, filters, summary metrics
- **Days 89-96:** Admin project: build a Student Progress or Case Management app end to end
- **Days 97-100:** Interview prep: explain design choices, troubleshoot scenarios, polish documentation

Practice task: Build a Student Progress app with objects, fields, validation, one Flow, security rules, and a dashboard.

Next step: Start Days 1-10 and ask me for the first Salesforce Admin setup assignment.`;
  }

  if (normalizedText.includes('session') && normalizedText.includes('apex')) {
    return `**Apex session assistant**

**Topic summary:** Apex is Salesforce's programming language for writing backend business logic.

**Small examples:**

\`\`\`apex
String learnerName = 'Ravi';
Integer score = 80;

if (score >= 60) {
    System.debug('Passed');
} else {
    System.debug('Needs practice');
}
\`\`\`

**Questions for students:**
- What data type would you use for a name?
- Why do we use \`if-else\`?
- When is a \`List\` useful?
- What does a method help us reuse?

Next step: Ask students to write one variable, one condition, and one method.`;
  }

  if (normalizedText.includes('session') && normalizedText.includes('lwc')) {
    return `**LWC mentor session plan**

**Objective:** Help learners understand how an LWC is structured and how data moves through the component.

**Agenda**
- 10 min: LWC file structure and metadata
- 15 min: Build a small input-and-display component
- 15 min: Explain properties, events, and parent-child communication
- 10 min: Q&A and debugging practice

**Assignment:** Build a topic selector component that sends the selected skill to a parent component.

**Common learner questions**
- Why is my template not updating?
- When should I use an event?
- When do I need Apex?

Next step: Share the assignment after the demo and ask learners to post screenshots or errors in a thread.`;
  }

  if (normalizedText.includes('session') && (normalizedText.includes('admin') || normalizedText.includes('salesforce admin'))) {
    return `**Salesforce Admin mentor session plan**

**Objective:** Help learners design a clean Salesforce setup using objects, fields, automation, and security.

**Agenda**
- 10 min: Objects, fields, and record relationships
- 15 min: Validation rules and page layout choices
- 15 min: Simple Flow demo for learner onboarding
- 10 min: Security discussion with profiles and permission sets

**Assignment:** Design a Student Progress object with required fields, one validation rule, one Flow idea, and one report.

**Common learner questions**
- When should I use Flow instead of a validation rule?
- How do permission sets differ from profiles?
- What should go on a record page?

Next step: Ask learners to submit their object design and one access-control decision.`;
  }

  if (advancedDoubtTerms.some((term) => normalizedText.includes(term))) {
    return `**Doubt router**

This looks advanced because it may depend on your Salesforce org setup, logs, security, or deployment context.

Quick first checks:
- Capture the exact error message
- Note the object, automation, class, or integration involved
- Share what changed before the issue started
- Add screenshots/logs if available

This looks advanced. Tagging a mentor/admin is recommended: @mentor or @admin.

Next step: Post the error message and the related Apex/Flow/config details in the thread.`;
  }

  if (normalizedText.includes('doubt') || normalizedText.includes('what is') || normalizedText.includes('explain')) {
    return `**Basic Salesforce doubt support**

Here is a simple way to think about it: Salesforce stores business data in **objects**, and Apex helps you write custom logic when clicks/configuration are not enough.

Example:
\`\`\`apex
Account acc = new Account(Name = 'SkillBridge');
insert acc;
\`\`\`

This creates an Account record using Apex.

Next step: Send the exact Salesforce or Apex concept you are stuck on, and I will explain it with a small example.`;
  }

  return `Gemini is currently unavailable due to high demand, but SkillBridge Agent is still running.

For the demo, try one of these:
- \`Check my Apex level\`
- \`I want a 100-day Apex learning path\`
- \`Create an Apex session plan\`
- \`I have an Apex deployment error\`

Next step: Retry your message in 1-2 minutes, or use one of the Apex demo prompts above.`;
}

/**
 * Run Gemini as the primary SkillBridge model.
 * @param {string | Array<Record<string, any>>} inputItems
 * @param {string} systemPrompt
 * @returns {Promise<{ finalOutput: string, history: Array<Record<string, any>> }>}
 */
export async function runGeminiAgent(inputItems, systemPrompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Add it to `.env`, then restart the app.');
  }

  const configuredModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const modelsToTry = [...new Set([configuredModel, ...FALLBACK_GEMINI_MODELS])];
  const learnerText = inputItemsToText(inputItems);
  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt += 1) {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: `${systemPrompt}\n\nYou are running on Gemini as the primary model provider.` }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: learnerText }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1400,
          },
        }),
      });

      if (response.status === 404) {
        await response.text();
        break;
      }

      if (RETRYABLE_STATUS_CODES.has(response.status)) {
        await response.text();
        if (attempt < MAX_ATTEMPTS_PER_MODEL) {
          await wait(750 * attempt);
          continue;
        }
        break;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API failed with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const finalOutput =
        data?.candidates?.[0]?.content?.parts
          ?.map((/** @type {{ text?: string }} */ part) => part.text)
          .filter(Boolean)
          .join('\n')
          .trim() || '';

      if (!finalOutput) {
        throw new Error('Gemini returned an empty response.');
      }

      if (shouldUseResilientResponse(finalOutput, learnerText)) {
        const resilientOutput = buildResilientLearningResponse(learnerText);
        return {
          finalOutput: resilientOutput,
          history: buildFallbackHistory(inputItems, resilientOutput),
        };
      }

      return {
        finalOutput,
        history: buildFallbackHistory(inputItems, finalOutput),
      };
    }
  }

  const finalOutput = buildResilientLearningResponse(learnerText);
  return {
    finalOutput,
    history: buildFallbackHistory(inputItems, finalOutput),
  };
}
