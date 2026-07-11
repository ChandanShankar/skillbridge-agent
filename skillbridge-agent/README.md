# SkillBridge Agent

SkillBridge Agent is a generic AI mentor for learning communities in Slack.

It helps freshers and working professionals learn job-ready skills inside Slack by checking their level, recommending topic-wise learning paths, answering doubts, helping mentors prepare sessions, and tracking recent conversation context.

Salesforce/Apex is the featured hackathon demo track, but the code and product idea are intentionally reusable for SAP, PMP, web development, data skills, soft skills, or custom training topics.

## One-Line Pitch

SkillBridge Agent helps learning communities inside Slack by checking learner skill levels, recommending topic-wise learning paths, answering doubts, and helping mentors manage sessions.

## Featured Demo Angle

For submission, the strongest story is:

```text
SkillBridge Agent: AI Mentor for Salesforce Learning Communities in Slack
```

That pitch is specific and real-world, while the underlying agent stays generic.

## Core Features

1. Skill check
   - Example prompt: `Check my Apex level`
   - The agent asks 3 to 5 questions.
   - After the learner answers, it marks them Beginner or Intermediate and suggests next steps.

2. Personal learning path
   - Example prompt: `I want a 100-day Apex learning path`
   - The agent gives a dynamic roadmap. For beginner-to-job-ready Salesforce tracks, it prefers a 100-day plan with weekly phases, practice tasks, checkpoints, and a final project.

3. Session assistant
   - Example prompt: `Create an Apex session plan`
   - The agent prepares a topic summary, small examples, and questions for students before a mentor session.

4. Doubt router
   - Basic doubts get a direct explanation.
   - Advanced doubts involving deployment, integrations, security, production data, or domain-specific decisions are routed to `@mentor` or `@admin`.

5. Learning guardrail
   - The agent only answers learning, course, mentorship, quiz, assignment, career prep, or training-community questions.
   - Unrelated prompts are politely refused and redirected to learning topics.

6. Timed quiz nudges and badges
   - Optional scheduled questions can be posted into Slack channels.
   - Learners reply in the thread.
   - The bot scores answers, tracks a learning stack, and awards badges such as `First Step`, `3-Star Learner`, `5 Stack Streak`, and `Trail Builder`.

## Slack Workspace Setup

Create these channels for the demo:

```text
#learning-community
#mentor-room
#announcements
#general
```

Use `#learning-community` for learner doubts, `#mentor-room` for mentor/admin discussions, `#announcements` for session reminders, and `#general` for introductions and broad community questions.

SkillBridge welcomes learners when they join these channels:

- `#announcements`: cohort updates, session reminders, assignment deadlines, and important notices
- `#general`: introductions, quick questions, and starter SkillBridge prompts
- `#mentor-room`: mentor planning, learner blockers, assignments, and session coordination
- `#learning-community`: learner questions, guided practice, and topic-specific help

The app matches these channels by name. For production workspaces, you can also set channel IDs in `.env`:

```text
SKILLBRIDGE_ANNOUNCEMENTS_CHANNEL_ID=C0123456789
SKILLBRIDGE_GENERAL_CHANNEL_ID=C0123456790
SKILLBRIDGE_MENTOR_ROOM_CHANNEL_ID=C0123456791
SKILLBRIDGE_LEARNING_COMMUNITY_CHANNEL_ID=C0123456792
```

## Demo Prompts

```text
Check my Apex level
Check my LWC level
Check my Salesforce Admin level
I want a 100-day Salesforce Admin mastery learning path
Plan a mentor session for LWC learners
What is a Map in Apex?
I have an Apex deployment error
Give me a beginner assignment for PMP risk management
reset
```

## Timed Quiz Nudges

Timed quiz nudges are disabled by default. Enable them only for a real demo or learning channel.

Use Slack user IDs for interest-based daily DMs, or channel IDs for broad channel demos:

```text
SKILLBRIDGE_NUDGE_ENABLED=true
SKILLBRIDGE_NUDGE_USERS=U0123456789
SKILLBRIDGE_NUDGE_INTERVAL_MINUTES=1440
SKILLBRIDGE_NUDGE_TOPIC=Apex
```

Learners can manage interests in Slack:

```text
subscribe Apex
unsubscribe Apex
my topics
```

The guardrail is opt-in: users only receive daily quiz nudges for topics they subscribed to. For a fast demo, set `SKILLBRIDGE_NUDGE_INTERVAL_MINUTES=1`, restart the app, and wait for the bot to post a quiz question.

For demo persistence, subscriptions, scores, daily stacks, and badges are saved to:

```text
data/learning-progress.json
```

The `data/` folder is ignored by git, so demo progress stays local.

## Setup

This Windows machine uses `slackcli` because `slack.exe` is already used by the Slack desktop app.

```powershell
cd "C:\Users\Chandan\OneDrive\Documents\SkillBridge Agent\skillbridge-agent"
& "$env:LOCALAPPDATA\slack-cli\bin\slackcli.exe" login
```

Create `.env` from `.env.sample` and add:

```text
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash
```

When running without Slack CLI, also set:

```text
SLACK_APP_TOKEN=your_app_level_token
SLACK_BOT_TOKEN=xoxb-your_bot_token
```

## Run

```powershell
& "$env:LOCALAPPDATA\slack-cli\bin\slackcli.exe" run
```

Or:

```powershell
npm.cmd start
```

## Useful Commands

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run lint
```

## Important Files

- `agent/agent.js` - generic mentor behavior and Gemini prompt
- `agent/learning-guard.js` - educational-topic guardrail
- `agent/gemini-client.js` - Gemini API runner plus resilient learning responses
- `learning-nudges/quiz-engine.js` - timed questions, scoring, stacks, and badges
- `agent/knowledge-base.js` - reusable sample learning tracks
- `listeners/events/` - Slack message and mention handlers
- `thread-context/store.js` - recent conversation memory and reset support
- `manifest.json` - Slack app manifest
- `SKILLBRIDGE_HACKATHON_GUIDE.md` - submission story and demo script
