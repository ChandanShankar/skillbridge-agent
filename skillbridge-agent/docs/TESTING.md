# Testing

## Automated Checks

Run:

```powershell
npm run check
npm test
```

Expected result:

```text
Type check passes
All tests pass
```

## Slack Manual Tests

Invite the bot to the workspace channels:

```text
#announcements
#general
#mentor-room
#learning-community
```

Test these prompts:

```text
@SkillBridge Agent Check my Apex skill level
@SkillBridge Agent Check my LWC skill level
@SkillBridge Agent Check my Salesforce Admin skill level
@SkillBridge Agent I want a 100-day Apex learning path
@SkillBridge Agent Plan a mentor session for LWC learners with assignments and Q&A support
```

Expected behavior:

- Skill checks ask 3 focused questions.
- Learning paths include phases, practice tasks, and a next step.
- Mentor plans include agenda, assignment, and Q&A support.
- Direct messages work.
- `/skillbridge` works with text and with the modal.
- Feedback buttons post ephemeral confirmations.
- Out-of-scope prompts are refused politely.

## Channel Welcome Test

Add a test user to each supported channel.

Expected behavior:

- `#announcements`: posts updates/reminder onboarding copy.
- `#general`: posts community introduction copy.
- `#mentor-room`: posts mentor/admin planning copy.
- `#learning-community`: posts learner support copy.

## Production Smoke Test

Open:

```text
https://YOUR-SERVICE.onrender.com/health
```

Expected response:

```json
{"ok":true,"app":"SkillBridge Agent","mode":"slack-socket-mode","status":"running"}
```
