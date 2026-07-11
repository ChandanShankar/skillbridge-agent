# SkillBridge Agent Full Product Testing Guide

This document explains how to test SkillBridge Agent end to end: Slack setup, tokens, scopes, event behavior, slash command behavior, modals, interactive messages, App Home, assistant threads, learning guardrails, quiz nudges, and automated checks.

## 1. Product Summary

SkillBridge Agent is a Slack-native AI mentor for learning communities. It helps learners ask skill questions, get learning paths, check their level, prepare assignments, receive mentor-style explanations, welcome new channel members, and subscribe to quiz nudges.

The app is built with:

- Slack Bolt for JavaScript / Node.js
- Slack App Home
- Slack Events API through Bolt listeners
- Slash command `/skillbridge`
- Block Kit sections, modals, and interactive feedback controls
- Gemini API for AI answers
- Optional Slack MCP Server / OAuth mode for Slack workspace-context features
- Optional daily quiz/nudge workflow

## 2. Slack Concepts Used

### Bot Token

A bot token usually starts with `xoxb-`.

SkillBridge uses the bot token to call Slack APIs as the bot, including posting messages, publishing App Home, opening modals, posting feedback responses, and sending quiz nudges.

Examples in this app:

- `client.chat.postMessage(...)`
- `client.chat.postEphemeral(...)`
- `client.views.publish(...)`
- `client.views.open(...)`

### App Token

An app token usually starts with `xapp-`.

SkillBridge uses the app token for Socket Mode when running `app.js`. Socket Mode lets the local Node.js app receive Slack events without exposing a public HTTP endpoint.

Required when running:

```bash
npm start
```

with:

```env
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

### App Mention

An app mention happens when someone types:

```text
@SkillBridge Agent help me learn Apex
```

SkillBridge listens for the `app_mention` event and routes the message to the AI agent.

### Slash Command

A slash command is a Slack command such as:

```text
/skillbridge I want a 100-day Apex learning path
```

Slack sends the command payload to the app. SkillBridge now implements:

```js
app.command('/skillbridge', handleSkillBridgeCommand)
```

### Events

Events are things that happen in Slack. This app listens to:

- `app_home_opened`
- `app_mention`
- `assistant_thread_started`
- `member_joined_channel`
- `message`

The manifest subscribes to:

- `app_home_opened`
- `app_mention`
- `assistant_thread_started`
- `member_joined_channel`
- `message.channels`
- `message.groups`
- `message.im`

### Permissions / Scopes

Scopes are exact permissions requested by the Slack app.

Important bot scopes in SkillBridge:

- `app_mentions:read`: receive app mention events
- `chat:write`: post messages
- `channels:history`: read public channel messages where allowed
- `channels:read`: read public channel metadata for welcome workflow
- `groups:history`: read private channel messages where allowed
- `groups:read`: read private channel metadata for welcome workflow
- `im:history`: read DMs
- `im:read`: read IM metadata
- `im:write`: send DMs
- `mpim:read`: read multi-person IM metadata required by Slack for `member_joined_channel`
- `assistant:write`: use Slack assistant features
- `users:read`: read user information
- `reactions:read` / `reactions:write`: reaction support if needed

Important user scopes in OAuth/MCP mode:

- `search:read.public`
- `search:read.private`
- `search:read.mpim`
- `search:read.im`
- `search:read.files`
- `search:read.users`
- `channels:history`
- `groups:history`
- `im:history`
- `mpim:history`
- `canvases:read`
- `canvases:write`
- `chat:write`
- `users:read`
- `users:read.email`

## 3. Setup Before Testing

### 3.1 Install Dependencies

From the project folder:

```bash
npm install
```

### 3.2 Create `.env`

Copy `.env.sample` to `.env`, then fill in at least:

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-3.5-flash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

### 3.3 Slack App Manifest

Confirm `manifest.json` contains:

- Bot user enabled
- App Home enabled
- Assistant view enabled
- Slash command `/skillbridge`
- Event subscriptions enabled
- Interactivity enabled
- Socket Mode enabled
- Required bot/user scopes

### 3.4 Install App In Slack Sandbox

Install the app into the Slack developer sandbox.

After installing or updating the manifest, reinstall the app if Slack asks for new permissions.

## 4. Run The App

### Socket Mode

Use this for local testing without ngrok:

```bash
npm start
```

Expected terminal output:

```text
SkillBridge Agent is running!
```

### OAuth / HTTP Mode

Use this when testing OAuth and Slack MCP Server connection flows:

```bash
node app-oauth.js
```

Required `.env` values:

```env
SLACK_CLIENT_ID=...
SLACK_CLIENT_SECRET=...
SLACK_SIGNING_SECRET=...
SLACK_REDIRECT_URI=https://YOUR_NGROK_SUBDOMAIN.ngrok-free.app/slack/oauth_redirect
```

Expected terminal output includes:

```text
SkillBridge Agent is running on port 3000!
Connect the Slack MCP Server: https://YOUR_NGROK_SUBDOMAIN.ngrok-free.app/slack/install
```

## 5. Automated Checks

Run tests:

```bash
npm.cmd test
```

Expected result:

```text
tests 19
pass 19
fail 0
```

Run type check:

```bash
npm.cmd run check
```

Expected result: command exits successfully with no TypeScript errors.

Note: on Windows PowerShell, use `npm.cmd` if `npm` is blocked by execution policy.

## 6. Core Slack Listener Registration

SkillBridge registers listeners from `listeners/index.js`.

Current listener groups:

- Actions: `listeners/actions/index.js`
- Commands: `listeners/commands/index.js`
- Events: `listeners/events/index.js`
- Views: `listeners/views/index.js`

Expected command registration:

```js
app.command('/skillbridge', handleSkillBridgeCommand);
```

Expected event registrations:

```js
app.event('app_home_opened', handleAppHomeOpened);
app.event('app_mention', handleAppMentioned);
app.event('assistant_thread_started', handleAssistantThreadStarted);
app.event('member_joined_channel', handleMemberJoinedChannel);
app.event('message', handleMessage);
```

Expected action registration:

```js
app.action('feedback', handleFeedbackButton);
```

Expected view registration:

```js
app.view('skillbridge_command_submit', handleSkillBridgeCommandSubmit);
```

## 7. Test Channel Welcome Workflow

### Purpose

Tests `member_joined_channel`, channel lookup, channel-specific onboarding copy, and `client.chat.postMessage`.

### Steps

1. Confirm these Slack channels exist:

```text
#announcements
#general
#mentor-room
#learning-community
```

2. Invite the bot to each channel:

```text
/invite @SkillBridge Agent
```

3. Add a test user to each channel.

### Expected Result

SkillBridge should post a channel-specific welcome message:

- `#announcements`: cohort updates, reminders, deadlines, and important notices
- `#general`: introductions, quick questions, and starter SkillBridge prompts
- `#mentor-room`: mentor/admin planning, learner blockers, assignments, and session coordination
- `#learning-community`: learner questions, guided practice, and topic-specific help

### Logic Tested

- Slack fires `member_joined_channel`
- `handleMemberJoinedChannel(...)` ignores the bot joining
- `client.conversations.info(...)` reads the channel name
- Optional `SKILLBRIDGE_*_CHANNEL_ID` values can match by channel ID
- `client.chat.postMessage(...)` posts the welcome message

## 8. Test App Home

### Purpose

Tests `app_home_opened` and Block Kit App Home sections.

### Steps

1. Open Slack.
2. Click the SkillBridge Agent app.
3. Open the Home tab.

### Expected Result

The App Home should show:

- Header: `SkillBridge Agent`
- Description of what the app can help with
- Example prompts
- MCP connection status

### Logic Tested

- Slack fires `app_home_opened`
- `handleAppHomeOpened(...)` runs
- `buildAppHomeView(...)` creates a Home view
- `client.views.publish(...)` publishes the view

## 9. Test App Mention

### Purpose

Tests `app_mention`, learning guardrails, AI answer generation, streaming response, and feedback controls.

### Steps

1. Invite the bot to a public test channel.
2. Send:

```text
@SkillBridge Agent I want a 100-day Apex learning path
```

### Expected Result

SkillBridge should:

- Remove the bot mention from the text
- Recognize this as a learning-related request
- Set assistant status to `Preparing a learning answer...`
- Generate a learning answer
- Stream the answer in the thread
- Attach feedback controls
- Store conversation history for the thread

### Logic Tested

- `app_mention`
- `handleAppMentioned(...)`
- `isLearningRelated(...)`
- `runAgent(...)`
- `sayStream(...)`
- `buildFeedbackBlocks(...)`
- `conversationStore.setHistory(...)`

### Empty Mention Test

Send only:

```text
@SkillBridge Agent
```

Expected response:

```text
Hi, I can help with learning roadmaps, concept doubts, assignments, session plans, and mentor summaries.
```

### Out-Of-Scope Test

Send:

```text
@SkillBridge Agent tell me a movie story
```

Expected result: SkillBridge politely refuses and redirects the user to learning/upskilling topics.

### Reset Context Test

Send:

```text
@SkillBridge Agent reset
```

Expected result:

```text
Context cleared for this thread. Ask me a fresh Salesforce learning question when you are ready.
```

## 10. Test Direct Message

### Purpose

Tests the `message` event in DM mode.

### Steps

1. Open a DM with SkillBridge Agent.
2. Send:

```text
I want to learn web development
```

### Expected Result

SkillBridge should answer directly in the DM with a learning path and feedback controls.

### Logic Tested

- `message.im`
- `handleMessage(...)`
- DM detection with `event.channel_type === 'im'`
- AI answer generation
- DM conversation history key: `dm:<channelId>`

## 11. Test Channel Thread Reply

### Purpose

Tests thread memory and follow-up behavior.

### Steps

1. In a channel, mention the bot:

```text
@SkillBridge Agent I want to learn Salesforce automation
```

2. Wait for the bot response.
3. Reply in the same thread:

```text
Start Day 1
```

### Expected Result

SkillBridge should continue the same learning context instead of asking for the topic again.

### Logic Tested

- Existing thread history is loaded with `conversationStore.getHistory(...)`
- Follow-up input is appended to previous history
- Updated history is saved

## 12. Test Top-Level Channel Message Without Mention

### Purpose

Verifies the bot does not respond to every channel message.

### Steps

In a public channel, send:

```text
I want a 100-day Apex learning path
```

without mentioning the bot.

### Expected Result

SkillBridge should not respond.

### Logic Tested

- `handleMessage(...)` ignores top-level channel messages
- Channel entry point is intentionally `app_mention`

## 13. Test Slash Command With Text

### Purpose

Tests `/skillbridge`, `app.command`, immediate acknowledgement, AI result posting, and `client.chat.postMessage`.

### Steps

Run:

```text
/skillbridge I want a 100-day Apex learning path
```

### Expected Result

Slack should first show an ephemeral response:

```text
Preparing your SkillBridge learning plan...
```

Then the bot should post a learning plan in the channel using `client.chat.postMessage(...)`.

### Logic Tested

- `app.command('/skillbridge', ...)`
- `ack()`
- `respond(...)`
- `isLearningRelated(...)`
- `runAgent(...)`
- `client.chat.postMessage(...)`
- `buildFeedbackBlocks(...)`

### Out-Of-Scope Slash Command Test

Run:

```text
/skillbridge write a random song
```

Expected result: ephemeral out-of-scope message.

## 14. Test Slash Command Modal

### Purpose

Tests Block Kit modal UI, `client.views.open`, and `app.view`.

### Steps

1. Run:

```text
/skillbridge
```

2. A modal should open.
3. Enter:

```text
I want to become a Salesforce developer
```

4. Click `Create Plan`.

### Expected Result

SkillBridge should:

- Open a modal with a section and multiline input
- Acknowledge the modal submission
- Post an ephemeral progress message
- Run the agent
- Post the final learning plan to the channel
- Attach feedback controls

### Logic Tested

- `client.views.open(...)`
- `buildSkillBridgeCommandModal(...)`
- `app.view('skillbridge_command_submit', ...)`
- `handleSkillBridgeCommandSubmit(...)`
- `client.chat.postEphemeral(...)`
- `client.chat.postMessage(...)`

### Modal Validation Test

Open `/skillbridge`, enter:

```text
weather today
```

Expected result: modal validation error explaining that SkillBridge only supports learning/upskilling topics.

## 15. Test Assistant Thread Started

### Purpose

Tests Slack assistant suggested prompts.

### Steps

1. Open the Slack assistant surface for SkillBridge if available in your sandbox.
2. Start a new assistant thread.

### Expected Result

SkillBridge should set suggested prompts:

- Check Skill Levels
- Get Learning Path
- Plan Mentor Session
- Explain Simply

### Logic Tested

- `assistant_thread_started`
- `handleAssistantThreadStarted(...)`
- `client.assistant.threads.setSuggestedPrompts(...)`

## 16. Test Feedback Buttons / Interactive Messages

### Purpose

Tests interactive feedback controls and `app.action`.

### Steps

1. Ask any valid learning question.
2. Wait for the response.
3. Click `Good Response` or `Bad Response`.

### Expected Result

For `Good Response`, SkillBridge posts an ephemeral confirmation:

```text
Glad that was helpful! :tada:
```

For `Bad Response`, SkillBridge posts an ephemeral retry message.

### Logic Tested

- Block Kit feedback controls
- `app.action('feedback', ...)`
- `ack()`
- `client.chat.postEphemeral(...)`

## 17. Test Quiz Subscription Commands

### Purpose

Tests quiz subscription logic inside message and mention flows.

### Steps

In DM or a bot-engaged thread, send:

```text
subscribe Apex
```

Then send:

```text
my topics
```

Then send:

```text
unsubscribe Apex
```

### Expected Result

SkillBridge should:

- Subscribe the user to Apex
- List current subscriptions
- Unsubscribe the user from Apex

### Logic Tested

- `handleQuizSubscription(...)`
- Local storage at `data/learning-progress.json`
- `client.chat.postMessage(...)`

## 18. Test Timed Quiz Nudges

### Purpose

Tests optional scheduled quiz nudges.

### Setup

Set these values in `.env`:

```env
SKILLBRIDGE_NUDGE_ENABLED=true
SKILLBRIDGE_NUDGE_CHANNELS=C0123456789
SKILLBRIDGE_NUDGE_USERS=U0123456789
SKILLBRIDGE_NUDGE_INTERVAL_MINUTES=1
SKILLBRIDGE_NUDGE_TOPIC=Apex
```

Restart the app.

### Expected Result

Within a few seconds, SkillBridge posts a quiz question to the configured channel/user.

Reply in the quiz thread:

```text
Set
```

Expected response:

- Correct or good-try scoring
- Explanation
- Learning stack
- Today's stack
- Score
- Badges

### Logic Tested

- `startLearningNudges(...)`
- `handleQuizAnswer(...)`
- `activeQuestions`
- `updateProgress(...)`
- `data/learning-progress.json`

## 19. Test Learning Guardrails

### Valid Learning Prompts

Try:

```text
I want a 100-day Apex learning path
Check my Salesforce level
Give me a beginner assignment for PMP risk management
Create a SAP session plan
I have an Apex deployment error
Prepare me for an interview
```

Expected result: SkillBridge answers.

### Invalid Prompts

Try:

```text
Write a love poem
Tell me sports news
Order food for me
```

Expected result: SkillBridge refuses and redirects to learning topics.

### Logic Tested

- `isLearningRelated(...)`
- `buildOutOfScopeMessage(...)`
- system prompt guardrails

## 20. Test MCP / Slack Workspace Context Readiness

### Purpose

Tests whether the product is ready to explain and demonstrate MCP integration.

SkillBridge has MCP-related readiness in:

- Manifest: `is_mcp_enabled: true`
- App Home: shows MCP connection status
- OAuth mode: exposes install URL for connecting the Slack MCP Server
- System prompt: explains Slack MCP capabilities such as channel summaries, canvas reading, and workspace search

### Steps

1. Run OAuth mode:

```bash
node app-oauth.js
```

2. Open App Home.
3. Check MCP status.
4. If OAuth values are configured, use the install URL shown in the terminal.

### Expected Result

App Home should show whether Slack MCP Server is connected or disconnected.

### Demo-Friendly Prompt

After MCP/OAuth is connected, test:

```text
@SkillBridge Agent summarize today's common doubts from this channel
```

Expected behavior:

- In full MCP mode, the agent can use Slack workspace context.
- In Gemini-only mode, the agent should honestly state it cannot inspect Slack history directly.

## 21. End-To-End Demo Script

Use this flow for a short full-product test:

1. Open App Home and show the SkillBridge overview.
2. Add a test user to `#learning-community` and show the welcome message.
3. Run `/skillbridge`.
4. Enter `I want to become a Salesforce developer` in the modal.
5. Submit and show the generated plan.
6. Click `Good Response`.
7. Mention the bot in a channel:

```text
@SkillBridge Agent Check my Apex level
```

8. Reply in the thread:

```text
Start Day 1
```

9. Show the assistant suggested prompts if available:

```text
Check Skill Levels
Get Learning Path
Plan Mentor Session
```

10. Mention MCP readiness: App Home shows MCP status and OAuth mode supports connection.

## 22. Known Implementation Notes

- The app uses `app.event('message', handleMessage)` instead of the shortcut `app.message(...)`. This is still a valid Bolt message-event implementation.
- Slash commands are implemented with `app.command('/skillbridge', ...)`.
- Modals are implemented with `client.views.open(...)` and `app.view(...)`.
- Main app-mention and DM answers stream through `sayStream(...)`.
- Slash command and modal answers post through `client.chat.postMessage(...)`.
- Feedback actions use Slack interactive controls and `client.chat.postEphemeral(...)`.
- Gemini API is required for live AI answers.
- MCP mode requires OAuth/HTTP setup and appropriate Slack configuration.

## 23. Troubleshooting

### Slash Command Does Not Appear

- Confirm `/skillbridge` exists in `manifest.json`.
- Reinstall the Slack app after changing the manifest.
- Confirm interactivity is enabled.

### App Does Not Receive Events

- Confirm Socket Mode is enabled.
- Confirm `SLACK_APP_TOKEN` starts with `xapp-`.
- Confirm `SLACK_BOT_TOKEN` starts with `xoxb-`.
- Confirm bot event subscriptions exist in the manifest.

### Bot Cannot Post Messages

- Confirm `chat:write` is included in bot scopes.
- Reinstall the app after adding scopes.
- Confirm the bot is in the channel.

### App Mention Does Not Work

- Confirm `app_mentions:read` is included.
- Invite the bot to the channel.
- Use `@SkillBridge Agent` before the question.

### Modal Does Not Open

- Confirm slash command is installed.
- Confirm interactivity is enabled.
- Confirm the app is running when `/skillbridge` is used.

### Gemini Error

- Confirm `GEMINI_API_KEY` is set.
- Confirm quota/billing is available.
- Check terminal logs for 401, 403, 429, or quota errors.

### PowerShell Blocks npm

Use:

```bash
npm.cmd test
npm.cmd run check
```

instead of:

```bash
npm test
npm run check
```

## 24. Final Submission Checklist

- App runs locally.
- App is installed in Slack sandbox.
- `/skillbridge` works with text.
- `/skillbridge` opens a modal with no text.
- App Home loads.
- Channel welcome workflow works in `#announcements`, `#general`, `#mentor-room`, and `#learning-community`.
- App mention works.
- DM works.
- Thread follow-up works.
- Feedback buttons work.
- Assistant suggested prompts work where available.
- MCP readiness is visible and explainable.
- Automated tests pass.
- Type check passes.
- Demo video is under 3 minutes.
- Architecture diagram is included.
