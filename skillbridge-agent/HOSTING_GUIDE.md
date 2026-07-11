# SkillBridge Agent Hosting Guide

This Slack app is a long-running Node.js process using Slack Socket Mode. It should be hosted on a platform that can keep a Node server running continuously.

## Recommended Hackathon Option: Render

Render is the easiest option for a short hackathon demo because it can run a Node.js web service and provide a public health URL.

Important limitation: Render Free web services can spin down after 15 minutes without inbound traffic. For a live hackathon demo, open the Render service URL before testing Slack so the service is awake.

The app includes:

- `app.js`: Slack Socket Mode app plus `/health` endpoint when `PORT` is provided
- `render.yaml`: Render blueprint configuration
- `npm start`: starts the Slack app

## Required Environment Variables

Set these in Render:

```text
GEMINI_API_KEY=your Gemini API key
GEMINI_MODEL=gemini-3.5-flash
SLACK_APP_TOKEN=xapp-your-slack-app-token
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
```

Optional welcome-channel IDs:

```text
SKILLBRIDGE_ANNOUNCEMENTS_CHANNEL_ID=C...
SKILLBRIDGE_GENERAL_CHANNEL_ID=C...
SKILLBRIDGE_MENTOR_ROOM_CHANNEL_ID=C...
SKILLBRIDGE_LEARNING_COMMUNITY_CHANNEL_ID=C...
```

## Deploy Steps On Render

1. Push this `skillbridge-agent` folder to a GitHub repository.
2. Go to Render Dashboard.
3. Choose New > Web Service.
4. Connect the GitHub repository.
5. Use these settings:

```text
Root Directory: skillbridge-agent
Runtime: Node
Build Command: npm install
Start Command: npm start
Instance Type: Free
Health Check Path: /health
```

6. Add the required environment variables.
7. Deploy.
8. Open:

```text
https://YOUR-RENDER-SERVICE.onrender.com/health
```

Expected response:

```json
{"ok":true,"app":"SkillBridge Agent","mode":"slack-socket-mode","status":"running"}
```

## Slack Setup After Hosting

Because this app uses Socket Mode, you do not need to set a public Request URL for normal events. Keep Socket Mode enabled in the Slack app.

Confirm these bot scopes are installed:

```text
app_mentions:read
assistant:write
channels:history
channels:read
chat:write
commands
groups:history
groups:read
im:history
im:read
im:write
mpim:read
reactions:read
reactions:write
users:read
```

Invite the bot to:

```text
#announcements
#general
#mentor-room
#learning-community
```

## Demo Smoke Test

In Slack, test:

```text
@SkillBridge Agent Check my Apex skill level
@SkillBridge Agent I want a 100-day Apex learning path
@SkillBridge Agent Plan a mentor session for LWC learners with assignments and Q&A support
```

Also open:

```text
https://YOUR-RENDER-SERVICE.onrender.com/health
```

This gives judges a simple public proof that the hosted Node app is live.

## Stop Or Remove After August

After the hackathon:

1. In Render, open the `skillbridge-agent` service.
2. Choose Suspend if you may use it later.
3. Choose Delete if you want it fully removed.
4. Remove `GEMINI_API_KEY`, `SLACK_APP_TOKEN`, and `SLACK_BOT_TOKEN` from Render environment variables.
5. In Slack app settings, rotate or revoke tokens if the demo app will no longer be used.

## Other Hosting Options

- Railway: easy Node deploy, but current free/trial availability can vary and may require billing setup.
- Koyeb: good for long-running services, but free/credit availability can vary.
- Oracle Cloud Always Free VM: best always-on free option, but setup is more complex because you manage a Linux VM yourself.
- Vercel/Netlify: not recommended for this app because Slack Socket Mode needs a long-running process.
