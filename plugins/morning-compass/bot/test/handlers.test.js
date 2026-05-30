import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createApp } from '../bot.js';

const SECRET = 'test-secret-123';
const CHAT_ID = '99999';

const TEST_STATE = path.join(os.tmpdir(), 'mc-handler-test-' + Date.now() + '.json');
const TEST_FEEDBACK = path.join(os.tmpdir(), 'mc-test-feedback-' + Date.now() + '.jsonl');
const TEST_ACTIONS = path.join(os.tmpdir(), 'mc-test-actions-' + Date.now() + '.jsonl');
const TEST_CONVO = path.join(os.tmpdir(), 'mc-test-convo-' + Date.now() + '.jsonl');

test.beforeEach(async () => {
  process.env.TELEGRAM_WEBHOOK_SECRET = SECRET;
  process.env.TELEGRAM_CHAT_ID = CHAT_ID;
  process.env.TELEGRAM_BOT_TOKEN = 'TEST_TOKEN';
  global.fetch = async () => ({ ok: true, json: async () => ({ ok: true }) });

  await fs.writeFile(TEST_STATE, JSON.stringify({
    schema_version: 1,
    energy_history: [],
    skip_days_consecutive: 0,
    last_feedback_rating: null,
    rock_start_dates_cache: { _refreshed_at: null },
    last_brief_timestamp: null,
    last_brief_content: null,
    paused_until: null
  }));
  await fs.writeFile(TEST_FEEDBACK, '');
  await fs.writeFile(TEST_ACTIONS, '');
  await fs.writeFile(TEST_CONVO, '');
});

function makeRes() {
  return {
    _status: 200,
    _body: null,
    status(c) { this._status = c; return this; },
    json(b) { this._body = b; return this; },
    sendStatus(c) { this._status = c; return this; }
  };
}

function appOpts() {
  return {
    stateFile: TEST_STATE,
    feedbackFile: TEST_FEEDBACK,
    actionsFile: TEST_ACTIONS,
    conversationFile: TEST_CONVO,
    disableHeartbeat: true
  };
}

test('GET /health returns ok', async () => {
  const app = createApp(appOpts());
  const req = { headers: {} };
  const res = makeRes();
  app._healthHandler(req, res);
  assert.equal(res._status, 200);
  assert.equal(res._body.status, 'ok');
});

test('POST /telegram-webhook rejects missing secret header', async () => {
  const app = createApp(appOpts());
  const req = { headers: {}, body: {} };
  const res = makeRes();
  await app._webhookHandler(req, res);
  assert.equal(res._status, 401);
});

test('POST /telegram-webhook rejects wrong secret', async () => {
  const app = createApp(appOpts());
  const req = { headers: { 'x-telegram-bot-api-secret-token': 'wrong' }, body: {} };
  const res = makeRes();
  await app._webhookHandler(req, res);
  assert.equal(res._status, 401);
});

test('POST /telegram-webhook rejects wrong chat_id (tenant gate)', async () => {
  const app = createApp(appOpts());
  const req = {
    headers: { 'x-telegram-bot-api-secret-token': SECRET },
    body: { message: { chat: { id: 12345 }, text: '/run' } }
  };
  const res = makeRes();
  await app._webhookHandler(req, res);
  assert.equal(res._status, 403);
});

test('energy callback writes to state', async () => {
  const app = createApp(appOpts());
  const req = {
    headers: { 'x-telegram-bot-api-secret-token': SECRET },
    body: {
      callback_query: {
        id: 'cb1', from: { id: parseInt(CHAT_ID) }, data: 'energy:low'
      }
    }
  };
  const res = makeRes();
  await app._webhookHandler(req, res);
  assert.equal(res._status, 200);
  const state = JSON.parse(await fs.readFile(TEST_STATE, 'utf8'));
  assert.equal(state.energy_history.length, 1);
  assert.equal(state.energy_history[0].bucket, 'low');
});

test('yesterday rating callback writes to feedback.jsonl', async () => {
  const app = createApp(appOpts());
  const req = {
    headers: { 'x-telegram-bot-api-secret-token': SECRET },
    body: {
      callback_query: {
        id: 'cb2', from: { id: parseInt(CHAT_ID) }, data: 'yesterday:thumbs_up'
      }
    }
  };
  const res = makeRes();
  await app._webhookHandler(req, res);
  const lines = (await fs.readFile(TEST_FEEDBACK, 'utf8')).trim().split('\n').filter(Boolean);
  assert.equal(lines.length, 1);
  assert.equal(JSON.parse(lines[0]).rating, 'thumbs_up');
});

test('qbr:done callback appends to actions.jsonl', async () => {
  const app = createApp(appOpts());
  const req = {
    headers: { 'x-telegram-bot-api-secret-token': SECRET },
    body: {
      callback_query: {
        id: 'cb3', from: { id: parseInt(CHAT_ID) }, data: 'qbr:done'
      }
    }
  };
  const res = makeRes();
  await app._webhookHandler(req, res);
  const lines = (await fs.readFile(TEST_ACTIONS, 'utf8')).trim().split('\n').filter(Boolean);
  assert.equal(lines.length, 1);
  assert.equal(JSON.parse(lines[0]).type, 'qbr_done');
});

test('Free-form DM appends to conversation.jsonl', async () => {
  const app = createApp(appOpts());
  const req = {
    headers: { 'x-telegram-bot-api-secret-token': SECRET },
    body: {
      message: { chat: { id: parseInt(CHAT_ID) }, text: 'On retreat 5/15-5/19' }
    }
  };
  const res = makeRes();
  await app._webhookHandler(req, res);
  const lines = (await fs.readFile(TEST_CONVO, 'utf8')).trim().split('\n').filter(Boolean);
  assert.ok(lines.length >= 1);
  assert.equal(JSON.parse(lines[0]).text, 'On retreat 5/15-5/19');
  assert.equal(JSON.parse(lines[0]).direction, 'in');
});

test('/pause command sets paused_until in state', async () => {
  const app = createApp(appOpts());
  const req = {
    headers: { 'x-telegram-bot-api-secret-token': SECRET },
    body: { message: { chat: { id: parseInt(CHAT_ID) }, text: '/pause 7' } }
  };
  const res = makeRes();
  await app._webhookHandler(req, res);
  const state = JSON.parse(await fs.readFile(TEST_STATE, 'utf8'));
  assert.ok(state.paused_until);
  const until = new Date(state.paused_until);
  const now = new Date();
  const days = (until - now) / (1000 * 60 * 60 * 24);
  assert.ok(days > 6.5 && days < 7.5);
});
