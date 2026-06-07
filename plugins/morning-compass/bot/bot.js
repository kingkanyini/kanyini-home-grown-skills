import dotenv from 'dotenv';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
dotenv.config({ path: path.join(os.homedir(), '.claude', '.env.morning-compass') });

// When BOT_ENV=test, remap standard env vars to TEST_* values so all
// downstream code (which uses TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID /
// TELEGRAM_WEBHOOK_SECRET unconditionally) automatically uses the test bot.
if (process.env.BOT_ENV === 'test') {
  if (process.env.TEST_BOT_TOKEN)       process.env.TELEGRAM_BOT_TOKEN       = process.env.TEST_BOT_TOKEN;
  if (process.env.TEST_CHAT_ID)         process.env.TELEGRAM_CHAT_ID         = process.env.TEST_CHAT_ID;
  if (process.env.TEST_WEBHOOK_SECRET)  process.env.TELEGRAM_WEBHOOK_SECRET  = process.env.TEST_WEBHOOK_SECRET;
}
import { writeBotField, appendJsonl, readState } from './state.js';
import { answerCallbackQuery, sendMessage } from './telegram.js';
import { spawnRunner } from './spawn.js';

const STATE_DIR = path.join(os.homedir(), '.claude', 'state');
const DEFAULT_STATE_FILE = path.join(STATE_DIR, 'morning-compass-<your-username>.json');

// Track chat IDs that have already triggered a TENANT_REJECTED warning, so each
// unauthorized chat logs once per process lifetime instead of every webhook.
const loggedRejections = new Set();

function bucketToScore(b) { return { low: 2, mid: 5, high: 8 }[b] || 5; }

function isLiveBot() {
  return process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== 'TEST_TOKEN';
}

async function handleCallbackQuery(cq, opts) {
  const data = cq.data;
  const stateFile = opts.stateFile;
  const feedbackFile = opts.feedbackFile || path.join(STATE_DIR, 'morning-compass-feedback.jsonl');
  const actionsFile = opts.actionsFile || path.join(STATE_DIR, 'morning-compass-actions.jsonl');
  const today = new Date().toISOString().slice(0, 10);
  const ts = new Date().toISOString();

  if (data.startsWith('energy:')) {
    const bucket = data.split(':')[1];
    const state = await readState(stateFile);
    const history = state.energy_history.filter(e => e.date !== today);
    history.push({ date: today, bucket, raw_value: null });
    await writeBotField(stateFile, 'energy_history', history);
    await appendJsonl(actionsFile, {
      schema_version: 1, ts, type: 'energy_tapped', bucket, raw_value: null
    });
    if (isLiveBot()) {
      await answerCallbackQuery(process.env.TELEGRAM_BOT_TOKEN, cq.id, `Logged: ${bucket}`);

      // Energy-shift follow-up: only post if shift > 2 from yesterday's bucket
      const stateAfter = await readState(stateFile);
      const yesterdayDate = (() => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toISOString().slice(0, 10);
      })();
      const yesterdayEntry = stateAfter.energy_history.find(e => e.date === yesterdayDate);
      const defaultBucket = yesterdayEntry?.bucket || 'mid';
      if (bucket !== defaultBucket && Math.abs(bucketToScore(bucket) - bucketToScore(defaultBucket)) >= 2) {
        await sendMessage(
          process.env.TELEGRAM_BOT_TOKEN,
          process.env.TELEGRAM_CHAT_ID,
          `Energy noted: ${bucket}\\. Counsel may shift toward restoration\\. Refresh\\?`,
          { inline_keyboard: [[
            { text: '✅ Refresh', callback_data: 'cmd:refresh' },
            { text: '❌ Keep current', callback_data: 'cmd:dismiss' }
          ]]}
        );
      }
    }
  }
  else if (data.startsWith('yesterday:')) {
    const rating = data.split(':')[1];
    await appendJsonl(feedbackFile, {
      schema_version: 1, date: today, rating, reason: null
    });
    await writeBotField(stateFile, 'last_feedback_rating', rating);
    if (isLiveBot()) {
      await answerCallbackQuery(process.env.TELEGRAM_BOT_TOKEN, cq.id, `Logged: ${rating}`);
    }
  }
  else if (data === 'qbr:done') {
    await appendJsonl(actionsFile, {
      schema_version: 1, ts, type: 'qbr_done', took_min: null
    });
    if (isLiveBot()) {
      await answerCallbackQuery(process.env.TELEGRAM_BOT_TOKEN, cq.id, '✅ QBR logged');
    }
  }
  else if (data.startsWith('reply:')) {
    const [, action, draftId] = data.split(':');
    await appendJsonl(actionsFile, {
      schema_version: 1, ts,
      type: action === 'sent' ? 'reply_to_sent' : 'reply_to_skipped',
      draft_id: draftId
    });
    if (isLiveBot()) {
      await answerCallbackQuery(process.env.TELEGRAM_BOT_TOKEN, cq.id, `Logged: ${action}`);
    }
  }
  else if (data.startsWith('cmd:')) {
    const cmd = data.split(':')[1];
    if (cmd === 'refresh') {
      spawnRunner('refresh');
      await appendJsonl(actionsFile, { schema_version: 1, ts, type: 'refresh_invoked' });
      if (isLiveBot()) {
        await answerCallbackQuery(process.env.TELEGRAM_BOT_TOKEN, cq.id, '🔄 Regenerating...');
      }
    } else if (cmd === 'status') {
      const state = await readState(stateFile);
      if (isLiveBot()) {
        await answerCallbackQuery(
          process.env.TELEGRAM_BOT_TOKEN, cq.id,
          `Last brief: ${state.last_brief_timestamp || 'never'}`
        );
      }
    } else if (cmd === 'dismiss') {
      if (isLiveBot()) {
        await answerCallbackQuery(process.env.TELEGRAM_BOT_TOKEN, cq.id, 'Kept current brief');
      }
    }
  }
}

async function handleMessage(msg, opts) {
  const stateFile = opts.stateFile;
  const actionsFile = opts.actionsFile || path.join(STATE_DIR, 'morning-compass-actions.jsonl');
  const conversationFile = opts.conversationFile || path.join(STATE_DIR, 'morning-compass-conversation.jsonl');
  const text = msg.text;
  const ts = new Date().toISOString();

  if (text.startsWith('/')) {
    const [cmd, ...rest] = text.slice(1).split(' ');
    if (cmd === 'run') {
      spawnRunner('manual');
      await appendJsonl(actionsFile, { schema_version: 1, ts, type: 'run_invoked', source: 'telegram' });
    } else if (cmd === 'refresh') {
      spawnRunner('refresh');
      await appendJsonl(actionsFile, { schema_version: 1, ts, type: 'refresh_invoked' });
    } else if (cmd === 'status') {
      if (isLiveBot()) {
        const state = await readState(stateFile);
        const summary =
          `Last brief: \`${state.last_brief_timestamp || 'never'}\`\n` +
          `Skip days: ${state.skip_days_consecutive}\n` +
          `Paused until: \`${state.paused_until || 'no'}\``;
        await sendMessage(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID, summary, null);
      }
    } else if (cmd === 'pause') {
      const days = parseInt(rest[0] || '7', 10);
      const pauseUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      await writeBotField(stateFile, 'paused_until', pauseUntil);
      await appendJsonl(actionsFile, { schema_version: 1, ts, type: 'paused', until: pauseUntil });
    } else if (cmd === 'skip-today') {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await writeBotField(stateFile, 'paused_until', tomorrow);
      await appendJsonl(actionsFile, { schema_version: 1, ts, type: 'skipped', date: ts.slice(0, 10) });
    }
    return;
  }

  // Free-form DM — log to conversation
  await appendJsonl(conversationFile, {
    schema_version: 1, ts, direction: 'in', text
  });

  if (isLiveBot()) {
    const ack = "Got it, logged for tomorrow's brief context.";
    await sendMessage(
      process.env.TELEGRAM_BOT_TOKEN,
      process.env.TELEGRAM_CHAT_ID,
      ack.replace(/[.]/g, '\\.').replace(/[']/g, "\\'"),
      null
    );
    await appendJsonl(conversationFile, {
      schema_version: 1, ts: new Date().toISOString(), direction: 'out', text: ack
    });
  }
}

export function createApp(opts = {}) {
  const stateFile = opts.stateFile || DEFAULT_STATE_FILE;
  const startedAt = Date.now();
  let lastCallbackTs = null;

  const app = express();
  app.use(express.json());

  function healthHandler(req, res) {
    res.status(200).json({
      status: 'ok',
      uptime_s: Math.round((Date.now() - startedAt) / 1000),
      last_callback_ts: lastCallbackTs
    });
  }
  app.get('/health', healthHandler);
  app._healthHandler = healthHandler;

  async function webhookHandler(req, res) {
    const isTest = process.env.BOT_ENV === 'test';
    const expectedSecret = isTest ? process.env.TEST_WEBHOOK_SECRET : process.env.TELEGRAM_WEBHOOK_SECRET;
    const expectedChatId = isTest ? process.env.TEST_CHAT_ID : process.env.TELEGRAM_CHAT_ID;
    const provided = req.headers['x-telegram-bot-api-secret-token'];
    if (provided !== expectedSecret) {
      console.warn('WEBHOOK_REJECTED', { reason: 'auth_fail', mode: isTest ? 'test' : 'production' });
      return res.sendStatus(401);
    }
    const chatId =
      req.body?.message?.chat?.id?.toString() ||
      req.body?.callback_query?.from?.id?.toString();
    if (chatId !== expectedChatId) {
      if (chatId && !loggedRejections.has(chatId)) {
        loggedRejections.add(chatId);
        console.warn('TENANT_REJECTED', { provided: chatId, note: 'logged once per chat for this process lifetime' });
      }
      return res.sendStatus(403);
    }
    lastCallbackTs = new Date().toISOString();

    try {
      if (req.body.callback_query) {
        await handleCallbackQuery(req.body.callback_query, { stateFile, ...opts });
      } else if (req.body.message?.text) {
        await handleMessage(req.body.message, { stateFile, ...opts });
      }
    } catch (err) {
      console.error('HANDLER_ERROR', err);
    }
    res.sendStatus(200);
  }
  app.post('/telegram-webhook', webhookHandler);
  app._webhookHandler = webhookHandler;

  // Tunnel heartbeat — pings /health through the public tunnel hostname.
  // 5 consecutive failures (5 min) = log TUNNEL_DOWN_5MIN. NSSM restarts.
  if (!opts.disableHeartbeat) {
    const tunnelUrl = process.env.CLOUDFLARE_TUNNEL_HOSTNAME
      ? `https://${process.env.CLOUDFLARE_TUNNEL_HOSTNAME}/health`
      : null;
    let consecutiveFails = 0;
    if (tunnelUrl) {
      setInterval(async () => {
        try {
          const r = await fetch(tunnelUrl, { signal: AbortSignal.timeout(5000) });
          if (r.ok) consecutiveFails = 0;
          else consecutiveFails++;
        } catch {
          consecutiveFails++;
        }
        if (consecutiveFails === 5) {
          console.error('TUNNEL_DOWN_5MIN', { ts: new Date().toISOString() });
        }
      }, 60_000);
    }
  }

  return app;
}

if (import.meta.url === `file://${process.argv[1]}` || import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`) {
  const app = createApp();
  const port = process.env.BOT_PORT || 3000;
  app.listen(port, () => {
    console.log(`morning-compass-bot listening on :${port}`);
  });
}
