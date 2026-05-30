import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sendMessage, answerCallbackQuery, setWebhook, buildInlineKeyboard } from '../telegram.js';

test.beforeEach(() => {
  global.fetch = async (url, opts) => {
    global.__lastFetch = { url, opts };
    return {
      ok: true,
      json: async () => ({ ok: true, result: { message_id: 42 } })
    };
  };
});

test('sendMessage POSTs correct payload', async () => {
  await sendMessage('TOKEN', '12345', 'hello', null);
  const url = global.__lastFetch.url;
  const body = JSON.parse(global.__lastFetch.opts.body);
  assert.match(url, /\/botTOKEN\/sendMessage/);
  assert.equal(body.chat_id, '12345');
  assert.equal(body.text, 'hello');
  assert.equal(body.parse_mode, 'MarkdownV2');
});

test('sendMessage includes reply_markup when provided', async () => {
  const kb = { inline_keyboard: <your-related-note> };
  await sendMessage('TOKEN', '12345', 'hi', kb);
  const body = JSON.parse(global.__lastFetch.opts.body);
  assert.deepEqual(body.reply_markup, kb);
});

test('answerCallbackQuery POSTs with callback_query_id and text', async () => {
  await answerCallbackQuery('TOKEN', 'cb_123', 'Logged: energy 4');
  const body = JSON.parse(global.__lastFetch.opts.body);
  assert.equal(body.callback_query_id, 'cb_123');
  assert.equal(body.text, 'Logged: energy 4');
});

test('setWebhook POSTs URL and secret_token', async () => {
  await setWebhook('TOKEN', 'https://example.com/hook', 'SECRET123');
  const body = JSON.parse(global.__lastFetch.opts.body);
  assert.equal(body.url, 'https://example.com/hook');
  assert.equal(body.secret_token, 'SECRET123');
});

test('buildInlineKeyboard produces 6-row layout', () => {
  const kb = buildInlineKeyboard([
    { id: 'r1', preview: 'Reply 1' },
    { id: 'r2', preview: 'Reply 2' },
    { id: 'r3', preview: 'Reply 3' }
  ]);
  assert.equal(kb.inline_keyboard.length, 6);
  assert.equal(kb.inline_keyboard[0][0].callback_data, 'energy:low');
  assert.equal(kb.inline_keyboard[0][1].callback_data, 'energy:mid');
  assert.equal(kb.inline_keyboard[0][2].callback_data, 'energy:high');
  assert.equal(kb.inline_keyboard[1][0].callback_data, 'yesterday:thumbs_down');
  assert.equal(kb.inline_keyboard[2][0].callback_data, 'reply:sent:r1');
  assert.equal(kb.inline_keyboard[2][1].callback_data, 'reply:skip:r1');
  assert.equal(kb.inline_keyboard[5][0].callback_data, 'qbr:done');
  assert.equal(kb.inline_keyboard[5][1].callback_data, 'cmd:refresh');
  assert.equal(kb.inline_keyboard[5][2].callback_data, 'cmd:status');
});
