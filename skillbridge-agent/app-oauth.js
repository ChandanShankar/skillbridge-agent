import 'dotenv/config';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { App, ExpressReceiver, LogLevel } from '@slack/bolt';
import pkg from '@slack/oauth';

const { FileInstallationStore } = pkg;

import { startLearningNudges } from './learning-nudges/index.js';
import { registerListeners } from './listeners/index.js';

const manifest = JSON.parse(readFileSync('manifest.json', 'utf-8'));
const botScopes = manifest.oauth_config.scopes.bot;
const userScopes = manifest.oauth_config.scopes.user;
const logoPath = fileURLToPath(new URL('./public/assets/skillbridge-agent-logo.png', import.meta.url));

// ---------------------------------------------------------------------------
// Installation store with bot-token fallback
// ---------------------------------------------------------------------------
// When installed via Slack CLI, SLACK_BOT_TOKEN is available but Bolt clears
// it when OAuth options are present. This wrapper lets the bot token serve as
// a fallback so App Home (with the OAuth install URL) and basic bot operations
// work before anyone has completed the OAuth flow.

const fileStore = new FileInstallationStore({ baseDir: './data/installations' });
const fallbackBotToken = process.env.SLACK_BOT_TOKEN;

/** @type {import('@slack/bolt').InstallationStore} */
const installationStore = {
  storeInstallation: async (installation) => fileStore.storeInstallation(installation),
  fetchInstallation: async (query) => {
    try {
      return await fileStore.fetchInstallation(query);
    } catch {
      if (fallbackBotToken) {
        return /** @type {any} */ ({ bot: { token: fallbackBotToken } });
      }
      throw new Error('No installation found and no fallback bot token configured');
    }
  },
  deleteInstallation: async (query) => fileStore.deleteInstallation(query),
};

const receiver = new ExpressReceiver({
  logLevel: LogLevel.DEBUG,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: 'skillbridge-agent',
  scopes: botScopes,
  installationStore,
  installerOptions: {
    stateVerification: true,
    userScopes,
  },
});

receiver.app.get('/assets/skillbridge-agent-logo.png', (_req, res) => {
  res.sendFile(logoPath);
});

const app = new App({
  logLevel: LogLevel.DEBUG,
  ignoreSelf: false,
  receiver,
});

registerListeners(app);

(async () => {
  const port = Number.parseInt(process.env.PORT || '3000', 10);
  await app.start(port);
  startLearningNudges(app);
  app.logger.info(`SkillBridge Agent is running on port ${port}!`);
  if (process.env.SLACK_REDIRECT_URI) {
    const origin = new URL(process.env.SLACK_REDIRECT_URI).origin;
    app.logger.info(`Connect the Slack MCP Server: ${origin}/slack/install`);
  }
})();
