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
 * @param {string} learnerText
 * @returns {string | null}
 */
function buildKnownSalesforceConceptResponse(learnerText) {
  const normalizedText = learnerText.toLowerCase();

  if (normalizedText.includes('permission set group')) {
    return `**Permission set group in Salesforce**

A **permission set group** combines multiple permission sets into one package that you can assign to users.

Use it when a role needs several permission sets together, such as Sales Console access, report access, and custom object access.

Next step: Create separate permission sets by responsibility, then group them for each job role.`;
  }

  if (normalizedText.includes('permission set')) {
    return `**Permission set in Salesforce**

A **permission set** is an extra bundle of access you can assign to a user without changing their profile.

Think of the **profile** as the user's base access, and a **permission set** as an add-on pass for extra permissions.

**Example**
- A sales user profile may not allow exporting reports
- You can give only selected users a permission set with **Export Reports**
- Their profile stays the same, but they get that extra access

**Common uses**
- Give access to an app, object, field, tab, Apex class, or custom permission
- Grant temporary or role-specific access
- Avoid creating too many profiles

Next step: Compare one user’s profile permissions with their assigned permission sets to see where their final access comes from.`;
  }

  if (normalizedText.includes('profile') && normalizedText.includes('salesforce')) {
    return `**Profile in Salesforce**

A **profile** defines a user's base permissions in Salesforce, such as what they can log into, which apps they can use, and their default access to objects, fields, tabs, and system permissions.

In modern Salesforce security design, keep profiles simpler and use **permission sets** for extra access.

Next step: Use profiles for baseline access and permission sets for additional role-based access.`;
  }

  if (normalizedText.includes('role') && normalizedText.includes('salesforce')) {
    return `**Role in Salesforce**

A **role** controls record visibility through the role hierarchy. It helps decide which records a user can see based on ownership and reporting structure.

Simple difference:
- **Profile/permission sets:** what a user can do
- **Role:** which records a user can see

Next step: Check whether the issue is about actions/permissions or record visibility before changing roles.`;
  }

  if (normalizedText.includes('sharing rule')) {
    return `**Sharing rule in Salesforce**

A **sharing rule** opens record access to users who would not normally see those records through org-wide defaults, role hierarchy, or ownership.

Example: If Cases are private, a sharing rule can share high-priority Cases with a support manager group.

Next step: First check org-wide defaults, then add sharing rules only where extra record access is needed.`;
  }

  return null;
}

/**
 * @typedef {{ title: string, topic: string, aliases: string[], summary: string, example: string, uses: string[], nextStep: string }} SalesforceConcept
 */

/** @type {SalesforceConcept[]} */
const SALESFORCE_CONCEPTS = [
  {
    title: 'Permission set in Salesforce',
    topic: 'Salesforce Admin',
    aliases: ['permission set', 'permission sets'],
    summary: 'A **permission set** is an extra bundle of access you can assign to a user without changing their profile.',
    example:
      'A sales user profile may not allow exporting reports. You can give only selected users a permission set with **Export Reports**, while their profile stays the same.',
    uses: [
      'Give access to an app, object, field, tab, Apex class, or custom permission',
      'Grant temporary or role-specific access',
      'Avoid creating too many profiles',
    ],
    nextStep: 'Compare one user profile with their assigned permission sets to see where their final access comes from.',
  },
  {
    title: 'Permission set group in Salesforce',
    topic: 'Salesforce Admin',
    aliases: ['permission set group', 'permission set groups'],
    summary: 'A **permission set group** combines multiple permission sets into one package that you can assign to users.',
    example:
      'A sales operations user might need Sales Console access, report export access, and custom object access. A permission set group can bundle those together.',
    uses: ['Assign a role-based access package', 'Keep permission sets modular', 'Make user access easier to review'],
    nextStep: 'Create separate permission sets by responsibility, then group them for each job role.',
  },
  {
    title: 'Salesforce System Administration',
    topic: 'Salesforce System Administration',
    aliases: ['system administration', 'salesforce system administration', 'salesforce sys admin', 'sys admin'],
    summary:
      '**Salesforce System Administration** is the work of configuring, securing, monitoring, and maintaining a Salesforce org so users can work safely and efficiently.',
    example:
      'A system administrator creates users, assigns permission sets, manages profiles, configures flows, builds reports, and reviews login or audit activity.',
    uses: ['User and access management', 'Automation and data quality setup', 'Reports, dashboards, releases, and org health checks'],
    nextStep: 'Start with users, profiles, permission sets, roles, sharing, objects, fields, Flow, reports, and dashboards.',
  },
  {
    title: 'Org-wide defaults in Salesforce',
    topic: 'Salesforce System Administration',
    aliases: ['org-wide default', 'org wide default', 'owd', 'organization-wide default', 'organization wide default'],
    summary:
      '**Org-wide defaults** define the baseline record access for an object, such as Private, Public Read Only, or Public Read/Write.',
    example: 'If Opportunities are Private, users normally see only the opportunities they own unless roles, sharing rules, or teams open access.',
    uses: ['Set the minimum record visibility', 'Protect sensitive records', 'Design sharing rules and role hierarchy correctly'],
    nextStep: 'Decide the most restrictive default first, then open access with roles, sharing rules, teams, or manual sharing.',
  },
  {
    title: 'Field-level security in Salesforce',
    topic: 'Salesforce System Administration',
    aliases: ['field-level security', 'field level security', 'fls'],
    summary:
      '**Field-level security** controls whether users can see or edit a specific field, even if they can access the object and record.',
    example: 'A recruiter may see Candidate records but not see a confidential Salary Expectation field.',
    uses: ['Hide sensitive fields', 'Control edit access', 'Troubleshoot missing fields on pages and reports'],
    nextStep: 'Check object permission, field-level security, and page layout when a user cannot see or edit a field.',
  },
  {
    title: 'Validation rule in Salesforce',
    topic: 'Salesforce System Administration',
    aliases: ['validation rule', 'validation rules'],
    summary: 'A **validation rule** prevents bad data from being saved when a record does not meet a business condition.',
    example: 'Require a Close Reason when an Opportunity stage changes to Closed Lost.',
    uses: ['Improve data quality', 'Enforce required business rules', 'Show clear error messages to users'],
    nextStep: 'Write the rule condition for the invalid case, then add a friendly error message.',
  },
  {
    title: 'Flow in Salesforce',
    topic: 'Salesforce System Administration',
    aliases: ['flow', 'salesforce flow', 'record-triggered flow', 'screen flow'],
    summary: '**Flow** is Salesforce automation that can update records, guide users through screens, and run business processes without Apex.',
    example: 'A record-triggered flow can create a follow-up Task whenever a high-priority Case is opened.',
    uses: ['Automate record updates', 'Build guided screen processes', 'Replace many workflow/process-builder automations'],
    nextStep: 'Learn screen flows, record-triggered flows, entry conditions, fault paths, and debug runs.',
  },
  {
    title: 'Apex in Salesforce',
    topic: 'Apex',
    aliases: ['apex', 'apex class', 'apex classes'],
    summary: '**Apex** is Salesforce server-side programming language used for custom business logic and data operations.',
    example: 'An Apex class can calculate a customer score and update related Account records after new data arrives.',
    uses: ['Custom backend logic', 'Complex validations or integrations', 'Reusable services for triggers, flows, and LWCs'],
    nextStep: 'Start with variables, data types, collections, classes, methods, SOQL, DML, and test classes.',
  },
  {
    title: 'SOQL in Salesforce',
    topic: 'Apex',
    aliases: ['soql', 'salesforce object query language'],
    summary: '**SOQL** is the query language used to read Salesforce records from objects and relationships.',
    example: '`SELECT Id, Name FROM Account WHERE Industry = \'Technology\'` reads technology Account records.',
    uses: ['Read records in Apex', 'Filter Salesforce data', 'Query parent or child relationships'],
    nextStep: 'Practice SELECT, WHERE, LIMIT, relationship queries, and bulk-safe queries inside Apex.',
  },
  {
    title: 'Apex trigger',
    topic: 'Apex',
    aliases: ['trigger', 'apex trigger', 'triggers'],
    summary: 'An **Apex trigger** runs custom logic automatically before or after records are inserted, updated, deleted, or undeleted.',
    example: 'A trigger can update Account summary fields when related Opportunity records change.',
    uses: ['React to record changes', 'Enforce complex logic', 'Coordinate updates across related records'],
    nextStep: 'Learn trigger context variables, bulk-safe loops, handler classes, recursion control, and tests.',
  },
  {
    title: 'Governor limits in Apex',
    topic: 'Apex',
    aliases: ['governor limit', 'governor limits'],
    summary: '**Governor limits** are Salesforce runtime limits that keep shared platform resources stable.',
    example: 'A transaction can run only a limited number of SOQL queries, so code should query outside loops.',
    uses: ['Write scalable Apex', 'Avoid runtime failures', 'Design bulk-safe triggers and services'],
    nextStep: 'Learn the main SOQL, DML, CPU, heap, and callout limits, then practice bulk-safe patterns.',
  },
  {
    title: 'Lightning Web Component',
    topic: 'LWC',
    aliases: ['lwc', 'lightning web component', 'lightning web components'],
    summary: '**LWC** is Salesforce UI technology for building reusable web components with HTML, JavaScript, and metadata XML.',
    example: 'An LWC can display learner progress, let a user select a topic, and call Apex to save the update.',
    uses: ['Build Salesforce UI components', 'Create reusable Lightning pages', 'Connect user interfaces to Salesforce data'],
    nextStep: 'Learn component files, templates, JavaScript properties, events, wire adapters, and Apex calls.',
  },
  {
    title: 'Wire adapter in LWC',
    topic: 'LWC',
    aliases: ['wire adapter', 'wire adapters', '@wire', 'wire in lwc'],
    summary: 'A **wire adapter** connects an LWC to Salesforce data or Apex reactively, so the component updates when inputs change.',
    example: '`@wire(getRecord, { recordId: "$recordId", fields })` can load a record into a component.',
    uses: ['Read Salesforce data', 'Call cacheable Apex', 'Keep UI data reactive'],
    nextStep: 'Practice `getRecord`, `getObjectInfo`, wired Apex, and handling `data` and `error` states.',
  },
  {
    title: 'Events in LWC',
    topic: 'LWC',
    aliases: ['event in lwc', 'events in lwc', 'custom event', 'custom events'],
    summary: '**Events** let an LWC communicate user actions or data changes to another component.',
    example: 'A child topic selector can dispatch a custom event when a learner chooses Apex, and the parent component can react.',
    uses: ['Child-to-parent communication', 'Button and form interactions', 'Composable component design'],
    nextStep: 'Practice `CustomEvent`, `dispatchEvent`, event detail payloads, and parent handlers.',
  },
  {
    title: 'Salesforce Data Cloud',
    topic: 'Data Cloud',
    aliases: ['data cloud', 'salesforce data cloud', 'customer data platform', 'cdp'],
    summary:
      '**Salesforce Data Cloud** brings customer data from different systems together so teams can unify profiles, segment audiences, and activate data across Salesforce.',
    example: 'A customer profile can combine CRM records, website behavior, purchase history, and support activity into one unified view.',
    uses: ['Unify customer profiles', 'Create segments', 'Power personalization, analytics, and AI use cases'],
    nextStep: 'Start by learning data streams, data model objects, identity resolution, calculated insights, and segments.',
  },
  {
    title: 'Sales Cloud',
    topic: 'Salesforce Clouds',
    aliases: ['sales cloud'],
    summary: '**Sales Cloud** helps sales teams manage leads, accounts, contacts, opportunities, forecasts, and pipeline activity.',
    example: 'A sales rep can convert a Lead, track an Opportunity, and update the deal stage until it closes.',
    uses: ['Lead and opportunity management', 'Sales forecasting', 'Pipeline reporting'],
    nextStep: 'Learn Lead, Account, Contact, Opportunity, Product, Quote, and Forecast objects first.',
  },
  {
    title: 'Service Cloud',
    topic: 'Salesforce Clouds',
    aliases: ['service cloud'],
    summary: '**Service Cloud** helps support teams manage customer cases, knowledge articles, service channels, and agent productivity.',
    example: 'A support agent can receive a Case, use Knowledge to answer it, and track service-level progress.',
    uses: ['Case management', 'Knowledge base support', 'Omni-channel service operations'],
    nextStep: 'Learn Cases, queues, assignment rules, escalation rules, Knowledge, and Omni-Channel.',
  },
  {
    title: 'Marketing Cloud',
    topic: 'Salesforce Clouds',
    aliases: ['marketing cloud'],
    summary: '**Marketing Cloud** helps teams design customer journeys, send campaigns, personalize messages, and measure engagement.',
    example: 'A marketer can send a welcome journey after a customer signs up and personalize follow-up messages.',
    uses: ['Email and journey automation', 'Audience segmentation', 'Campaign analytics'],
    nextStep: 'Start with contacts, data extensions, Journey Builder, Email Studio, and consent basics.',
  },
  {
    title: 'Experience Cloud',
    topic: 'Salesforce Clouds',
    aliases: ['experience cloud', 'community cloud'],
    summary: '**Experience Cloud** lets teams build portals and sites for customers, partners, or employees on top of Salesforce data.',
    example: 'A partner portal can let partners register deals, view records, and collaborate with your sales team.',
    uses: ['Customer portals', 'Partner portals', 'Self-service knowledge sites'],
    nextStep: 'Learn site setup, external users, sharing sets, audience targeting, and Experience Builder.',
  },
  {
    title: 'Commerce Cloud',
    topic: 'Salesforce Clouds',
    aliases: ['commerce cloud'],
    summary: '**Commerce Cloud** supports ecommerce storefronts, product catalogs, pricing, carts, checkout, and order experiences.',
    example: 'A business can run an online store where customers browse products, add items to cart, and place orders.',
    uses: ['B2C or B2B commerce', 'Product catalog management', 'Checkout and order workflows'],
    nextStep: 'Learn catalog, product, price book, cart, checkout, and order-management basics.',
  },
  {
    title: 'Agentforce',
    topic: 'Salesforce AI',
    aliases: ['agentforce', 'einstein copilot', 'salesforce ai agent'],
    summary: '**Agentforce** is Salesforce AI agent functionality for helping users complete work using trusted CRM data and configured actions.',
    example: 'An agent can help summarize a case, suggest next steps, or guide a user through a service workflow.',
    uses: ['AI-assisted CRM work', 'Guided actions', 'Service, sales, and internal productivity use cases'],
    nextStep: 'Learn topics, actions, grounding data, testing, and guardrails before building a production agent.',
  },
];

/**
 * @param {string} text
 * @param {string} alias
 * @returns {boolean}
 */
function includesConceptAlias(text, alias) {
  const normalizedAlias = alias.replaceAll(' ', '\\s+');
  return new RegExp(`(^|[^a-z0-9])${normalizedAlias}([^a-z0-9]|$)`, 'i').test(text);
}

/**
 * @param {SalesforceConcept} concept
 * @returns {string}
 */
function formatSalesforceConceptResponse(concept) {
  return `**${concept.title}**

Topic: **${concept.topic}**

${concept.summary}

**Example**
${concept.example}

**Common uses**
${concept.uses.map((use) => `- ${use}`).join('\n')}

Next step: ${concept.nextStep}`;
}

/**
 * @param {string} learnerText
 * @returns {string | null}
 */
function buildSalesforceConceptCatalogResponse(learnerText) {
  const normalizedText = learnerText.toLowerCase();
  const matches = SALESFORCE_CONCEPTS.flatMap((concept) =>
    concept.aliases
      .filter((alias) => includesConceptAlias(normalizedText, alias))
      .map((alias) => ({ alias, concept })),
  );
  matches.sort((a, b) => b.alias.length - a.alias.length);
  const concept = matches[0]?.concept;

  return concept ? formatSalesforceConceptResponse(concept) : null;
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
  const knownConceptResponse = buildSalesforceConceptCatalogResponse(learnerText);
  if (knownConceptResponse) return knownConceptResponse;

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
  const learnerText = inputItemsToText(inputItems);
  const knownConceptResponse = buildSalesforceConceptCatalogResponse(learnerText);
  if (knownConceptResponse) {
    return {
      finalOutput: knownConceptResponse,
      history: buildFallbackHistory(inputItems, knownConceptResponse),
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Add it to `.env`, then restart the app.');
  }

  const configuredModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const modelsToTry = [...new Set([configuredModel, ...FALLBACK_GEMINI_MODELS])];
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
