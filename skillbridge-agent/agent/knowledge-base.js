export const learningRoadmap = [
  {
    skill: 'Salesforce',
    levels: [
      {
        name: 'Beginner',
        topics: ['CRM basics', 'Objects and fields', 'Reports', 'Flows basics'],
        next: 'Build one small business workflow and explain the data model behind it.',
      },
      {
        name: 'Intermediate',
        topics: ['Automation', 'Security', 'Integrations', 'Apex or LWC basics'],
        next: 'Create an end-to-end scenario with automation, security, and a simple custom UI or code component.',
      },
    ],
  },
  {
    skill: 'SAP',
    levels: [
      {
        name: 'Beginner',
        topics: ['ERP basics', 'SAP navigation', 'Master data', 'Business processes'],
        next: 'Pick one process such as procure-to-pay or order-to-cash and map each step in simple language.',
      },
      {
        name: 'Intermediate',
        topics: ['Module fundamentals', 'Configuration basics', 'Process documentation', 'Testing'],
        next: 'Prepare a process flow, key fields, common errors, and test cases for one SAP module scenario.',
      },
    ],
  },
  {
    skill: 'PMP',
    levels: [
      {
        name: 'Beginner',
        topics: ['Project lifecycle', 'Stakeholders', 'Scope', 'Schedule', 'Risk basics'],
        next: 'Practice identifying scope, risks, stakeholders, and success criteria from a short case study.',
      },
      {
        name: 'Intermediate',
        topics: ['Agile and hybrid delivery', 'Risk responses', 'Communication plans', 'Exam scenarios'],
        next: 'Work through scenario-based questions and explain why each incorrect option is weaker.',
      },
    ],
  },
  {
    skill: 'Web Development',
    levels: [
      {
        name: 'Beginner',
        topics: ['HTML', 'CSS', 'JavaScript basics', 'Forms', 'Responsive layout'],
        next: 'Build a small interactive page with form validation and a clean mobile layout.',
      },
      {
        name: 'Intermediate',
        topics: ['Components', 'APIs', 'State management', 'Testing', 'Deployment'],
        next: 'Create a small app that reads from an API, handles loading/error states, and deploys publicly.',
      },
    ],
  },
];

export const sessionCatalog = [
  {
    keyword: 'salesforce automation',
    title: 'Salesforce Automation Basics',
    prerequisites: ['CRM basics', 'Objects and fields', 'Record lifecycle'],
    assignment: 'Design a simple approval or follow-up workflow and list the trigger, conditions, and outcome.',
  },
  {
    keyword: 'sap process',
    title: 'SAP Business Process Walkthrough',
    prerequisites: ['ERP basics', 'SAP navigation', 'Master data vs transaction data'],
    assignment: 'Map one process from request to completion and identify the users, data, and common mistakes.',
  },
  {
    keyword: 'pmp risk',
    title: 'PMP Risk Management Practice',
    prerequisites: ['Project lifecycle', 'Stakeholder basics', 'Scope and schedule basics'],
    assignment: 'Create a risk register with 5 risks, probability, impact, response, and owner.',
  },
];

export const assignmentPatterns = [
  {
    type: 'concept-practice',
    title: 'Concept Practice Assignment',
    tasks: [
      'Explain the concept in your own words.',
      'Give one real-world example where it is used.',
      'List 3 common mistakes beginners make.',
      'Create 5 quiz questions with answers.',
    ],
  },
  {
    type: 'scenario',
    title: 'Scenario-Based Assignment',
    tasks: [
      'Read a short business scenario.',
      'Identify the goal, users, inputs, and expected output.',
      'Propose the steps or configuration needed.',
      'Write how you would test whether the solution works.',
    ],
  },
  {
    type: 'interview',
    title: 'Interview Readiness Assignment',
    tasks: [
      'Prepare a simple definition.',
      'Prepare one practical example.',
      'Compare it with a related concept.',
      'Answer 5 beginner-to-intermediate interview questions.',
    ],
  },
];
