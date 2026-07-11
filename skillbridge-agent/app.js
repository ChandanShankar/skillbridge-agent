import 'dotenv/config';

import http from 'node:http';

import { App, LogLevel } from '@slack/bolt';

import { startLearningNudges } from './learning-nudges/index.js';
import { registerListeners } from './listeners/index.js';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
  logLevel: LogLevel.DEBUG,
  ignoreSelf: false,
});

registerListeners(app);

function startHealthServer() {
  const port = process.env.PORT;
  if (!port) return;

  const server = http.createServer((req, res) => {
    const payload = JSON.stringify({
      ok: true,
      app: 'SkillBridge Agent',
      mode: 'slack-socket-mode',
      status: 'running',
    });

    res.writeHead(req.url === '/health' ? 200 : 200, {
      'content-type': 'application/json',
    });
    res.end(payload);
  });

  server.listen(Number(port), () => {
    app.logger.info(`SkillBridge health endpoint is running on port ${port}`);
  });
}

(async () => {
  await app.start();
  startHealthServer();
  startLearningNudges(app);
  app.logger.info('SkillBridge Agent is running!');
})();
