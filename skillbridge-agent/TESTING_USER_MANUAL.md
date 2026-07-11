# SkillBridge Agent Testing User Manual

Use this manual to test the SkillBridge Slack app after deployment or during a local demo.

## 1. Before You Start

Confirm the app is installed in the Slack workspace and the latest `manifest.json` has been applied.

Required channels:

```text
#announcements
#general
#mentor-room
#learning-community
```

Required local values in `.env`:

```text
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-3.5-flash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

Optional welcome-channel IDs:

```text
SKILLBRIDGE_ANNOUNCEMENTS_CHANNEL_ID=C...
SKILLBRIDGE_GENERAL_CHANNEL_ID=C...
SKILLBRIDGE_MENTOR_ROOM_CHANNEL_ID=C...
SKILLBRIDGE_LEARNING_COMMUNITY_CHANNEL_ID=C...
```

## 2. Start The App

From PowerShell:

```powershell
cd skillbridge-agent
npm.cmd run check
slack run
```

Expected result: Slack CLI starts the app without manifest errors.

## 3. Test Channel Welcome Workflow

Invite `@SkillBridge Agent` to each channel:

```text
/invite @SkillBridge Agent
```

Then add a test user to each channel.

Expected messages:

- `#announcements`: welcomes the user and explains updates, reminders, deadlines, and notices.
- `#general`: welcomes the user and suggests starter SkillBridge prompts.
- `#mentor-room`: welcomes the user and explains mentor/admin planning.
- `#learning-community`: welcomes the user and suggests learning, doubts, and skill checks.

If no welcome message appears:

- Confirm the bot is in the channel.
- Confirm `member_joined_channel` exists in `manifest.json`.
- Confirm bot scopes include `channels:read`, `groups:read`, and `mpim:read`.
- Reinstall the Slack app after manifest changes.

## 4. Test Assistant Suggested Prompts

Open the SkillBridge assistant surface in Slack and start a new assistant thread.

Expected suggested prompts:

```text
Check Skill Levels
Get Learning Path
Plan Mentor Session
Explain Simply
```

Click each prompt and confirm the agent returns a useful learning response.

## 5. Test Skill Checks

In a channel, mention the bot:

```text
@SkillBridge Agent Check my Apex skill level
@SkillBridge Agent Check my LWC skill level
@SkillBridge Agent Check my Salesforce Admin skill level
```

Expected result: SkillBridge asks 3 focused questions specific to the selected skill.

Reply with numbered answers in the same thread. Expected result: SkillBridge marks the learner as Beginner or Intermediate and gives next study steps.

## 6. Test Learning Paths

Try:

```text
@SkillBridge Agent I want a 100-day Apex learning path
@SkillBridge Agent I want a beginner LWC learning path
@SkillBridge Agent I want a 100-day Salesforce Admin mastery learning path with practice tasks
```

Expected result: SkillBridge gives a practical path that matches the requested skill. If the learner wants job readiness or gives no timeline, SkillBridge should choose a realistic timeline such as a 100-day roadmap.

## 7. Test Mentor Session Planning

Try:

```text
@SkillBridge Agent Plan a mentor session for Apex learners
@SkillBridge Agent Plan a mentor session for LWC learners with assignments and Q&A support
@SkillBridge Agent Plan a Salesforce Admin mentor session
```

Expected result: SkillBridge provides an objective, agenda, concept summary, demo idea, assignment, common learner questions, and follow-up practice.

## 8. Test Slash Command

Run:

```text
/skillbridge I want a 100-day Apex learning path
```

Expected result: Slack shows an immediate progress message, then SkillBridge posts a learning plan.

Run:

```text
/skillbridge
```

Expected result: A modal opens. Enter a learning request and submit it.

## 9. Test Direct Message

Open a DM with SkillBridge Agent and send:

```text
I want to learn Salesforce Admin
```

Expected result: SkillBridge responds in DM with a learning path.

## 10. Test Guardrails

Valid prompts should get answers:

```text
Prepare me for a Salesforce interview
Give me a beginner assignment for Apex
Explain Flow in simple words
```

Invalid prompts should be refused politely:

```text
Tell me sports news
Order food for me
Write a random song
```

## 11. Test Feedback Buttons

Ask any learning question, then click:

```text
Good Response
Bad Response
```

Expected result: SkillBridge posts an ephemeral feedback confirmation.

## 12. Final Pass Checklist

- App starts without manifest errors.
- App Home loads.
- Channel welcome works in all four channels.
- App mention works.
- Direct message works.
- Slash command works with text.
- Slash command modal works.
- Assistant suggested prompts show the new prompt names.
- Apex, LWC, and Salesforce Admin skill checks ask specific questions.
- Learning paths match the selected skill.
- Mentor session planning includes assignments and Q&A support.
- Guardrails block unrelated prompts.
- Feedback buttons work.
