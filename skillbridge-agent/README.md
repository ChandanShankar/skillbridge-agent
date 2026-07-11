# SkillBridge Agent

SkillBridge Agent is a Slack-native AI mentor for learning communities. It helps learners check their skill level, follow dynamic learning paths, ask doubts, plan mentor sessions, and onboard into learning channels.

The current implementation focuses on Salesforce learning tracks such as Apex, LWC, and Salesforce Admin, while keeping the agent flexible enough for other professional learning topics.

## Features

- **Skill checks:** asks focused diagnostic questions and classifies learners as Beginner or Intermediate.
- **Dynamic learning paths:** creates practical roadmaps, including 100-day mastery plans for beginner-to-job-ready Salesforce tracks.
- **Mentor session planning:** prepares objectives, agendas, examples, assignments, and Q&A support.
- **Doubt support:** answers basic learning questions and routes advanced issues to mentors/admins.
- **Channel onboarding:** welcomes users in `#announcements`, `#general`, `#mentor-room`, and `#learning-community`.
- **Quiz nudges:** optionally posts scheduled quiz questions and tracks learner progress locally.

## Architecture

```text
Slack workspace
  -> Slack Events / Socket Mode
  -> Bolt for JavaScript
  -> SkillBridge Agent
  -> Gemini API
  -> Slack response, thread memory, feedback buttons, and quiz workflows
```

## Tech Stack

- Node.js
- Slack Bolt for JavaScript
- Slack Socket Mode
- Slack Block Kit
- Gemini API
- Render-ready web health endpoint

## Setup

Install dependencies:

```powershell
npm install
```

Create `.env` from `.env.sample` and set:

```text
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash
```

When running without the Slack CLI, also set:

```text
SLACK_APP_TOKEN=your_app_level_token
SLACK_BOT_TOKEN=xoxb-your_bot_token
```

## Run

With Slack CLI:

```powershell
slack run
```

With Node:

```powershell
npm start
```

## Test

```powershell
npm run check
npm test
```

Manual test examples:

```text
@SkillBridge Agent Check my Apex skill level
@SkillBridge Agent I want a 100-day Apex learning path
@SkillBridge Agent Plan a mentor session for LWC learners with assignments and Q&A support
```

## Deploy

The app can be deployed as a long-running Node service. A Render blueprint is included in `render.yaml`, and `app.js` exposes `/health` when `PORT` is provided.

Render settings:

```text
Root Directory: skillbridge-agent
Build Command: npm install
Start Command: npm start
Health Check Path: /health
```

Required environment variables:

```text
GEMINI_API_KEY
GEMINI_MODEL
SLACK_APP_TOKEN
SLACK_BOT_TOKEN
```

See `HOSTING_GUIDE.md` for hosting details.

## Project Structure

```text
agent/              Agent instructions, Gemini client, learning guardrails
learning-nudges/   Quiz questions, subscriptions, progress, and badges
listeners/         Slack commands, events, actions, and views
public/assets/     App logo and icon assets
tests/             Node test suite
thread-context/    In-memory conversation history
manifest.json      Slack app manifest
render.yaml        Render deployment blueprint
```
