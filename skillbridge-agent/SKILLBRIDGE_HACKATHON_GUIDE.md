# SkillBridge Agent Hackathon Guide

## Product Positioning

SkillBridge Agent is a generic Slack mentor for learning communities.

It can support Salesforce, SAP, PMP, web development, data skills, soft skills, or custom training topics. For the hackathon demo, Salesforce/Apex is the strongest first use case because it is specific, real-world, and tied to an actual learning community.

## Submission Title

SkillBridge Agent: AI Mentor for Salesforce Learning Communities in Slack

## One-Line Pitch

SkillBridge Agent helps freshers and working professionals learn Salesforce inside Slack by checking their skill level, recommending topic-wise learning paths, answering doubts, and helping mentors manage sessions.

## Problem

Freshers and working professionals join a Slack learning community, but they do not know what to learn next, where they are weak, or how to ask doubts.

Mentors also repeat the same work: answering beginner doubts, preparing session notes, reminding students what to study, and deciding which doubts need mentor attention.

## Solution

SkillBridge Agent acts as a learning community mentor inside Slack. It guides learners with topic-wise learning paths, quizzes, doubt support, session preparation, and progress-friendly conversation memory.

Salesforce/Apex is the demo track, but the same structure can be reused for other community learning tracks.

## Four Differentiators

1. Skill check
   - Demo prompt: `Check my Apex level`
   - Agent asks 3 to 5 questions.
   - After answers, it marks the learner Beginner or Intermediate.

2. Personal learning path
   - Demo prompt: `I want a 100-day Apex learning path`
   - Agent gives a dynamic learning roadmap. For beginner-to-job-ready Apex, it can produce a 100-day mastery path:
     variables, data types, list, set, map, if-else, loops, class, methods.

3. Session assistant
   - Demo prompt: `Create an Apex session plan`
   - Agent prepares a topic summary, small examples, and questions for students.

4. Doubt router
   - Demo prompt: `What is a Map in Apex?`
   - Basic doubts are answered directly.
   - Demo prompt: `I have an Apex deployment error`
   - Advanced doubts are routed to `@mentor` or `@admin`.

5. Progress nudges and badges
   - Optional scheduled quiz questions can be posted into a Slack channel.
   - Learners answer in threads.
   - SkillBridge tracks score, daily learning stack, and badges.
   - Demo progress is persisted in `data/learning-progress.json`.

6. Learning guardrail
   - The agent refuses unrelated prompts and redirects users back to learning/community support topics.

## Architecture

```text
Slack learner or mentor
  -> Slack Bolt app
  -> SkillBridge Agent prompt and thread memory
  -> Learning-topic guardrail
  -> Gemini API
  -> Reusable learning-track context
  -> Optional timed quiz nudges and badge tracking
  -> Resilient learning response when the model provider is overloaded
  -> Response back in Slack thread or DM
```

## Why The Code Is Generic

- The system prompt supports any learning topic.
- `knowledge-base.js` stores reusable tracks, not only Salesforce.
- Session and doubt logic can adapt to any domain.
- Salesforce/Apex is used as the first polished demo track, not as a hard product limitation.

## Three-Minute Demo Script

0:00-0:20 Problem:
Freshers join learning communities but do not know what to study next, where they are weak, or how to ask doubts. Mentors lose time repeating the same guidance.

0:20-1:00 Skill check:
In Slack, type `Check my Apex level`. Show the agent asking 5 Apex questions.

1:00-1:35 Learning path:
Type `I want a 100-day Apex learning path`. Show the roadmap from Apex basics through triggers, tests, projects, and interview prep.

1:35-2:10 Session assistant:
Type `Create an Apex session plan`. Show topic summary, code example, and student questions.

2:10-2:40 Doubt router:
Type `What is a Map in Apex?`, then `I have an Apex deployment error`. Show that the basic doubt is answered directly and the advanced doubt recommends tagging `@mentor` or `@admin`.

2:40-3:00 Impact:
SkillBridge Agent reduces repeated mentor work and gives learners structured help inside the Slack community they already use.

## Submission Description

SkillBridge Agent is a Slack-based AI mentor for learning communities. It helps freshers and working professionals decide what to learn next, identify weak areas through skill checks, follow topic-wise learning plans, ask basic doubts, and route advanced doubts to mentors or admins.

For this submission, the demo focuses on Salesforce/Apex because it is a concrete community learning problem. The same SkillBridge structure can support other learning tracks such as SAP, PMP, web development, data skills, soft skills, or company onboarding.
