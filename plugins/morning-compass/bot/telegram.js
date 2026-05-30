const TG_BASE = 'https://api.telegram.org';

async function tgPost(token, method, payload) {
  const res = await fetch(`${TG_BASE}/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error(`Telegram ${method} failed: HTTP ${res.status}`);
  }
  return await res.json();
}

export async function sendMessage(token, chatId, text, replyMarkup = null) {
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: 'MarkdownV2'
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  return tgPost(token, 'sendMessage', payload);
}

export async function answerCallbackQuery(token, callbackQueryId, text) {
  return tgPost(token, 'answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text
  });
}

export async function setWebhook(token, url, secretToken) {
  return tgPost(token, 'setWebhook', {
    url,
    secret_token: secretToken
  });
}

export function buildInlineKeyboard(replyToDrafts = []) {
  const rows = [
    [
      { text: '⚡ Low (1-3)', callback_data: 'energy:low' },
      { text: '⚡ Mid (4-6)', callback_data: 'energy:mid' },
      { text: '⚡ High (7-10)', callback_data: 'energy:high' }
    ],
    [
      { text: '📊 👎', callback_data: 'yesterday:thumbs_down' },
      { text: '📊 😐', callback_data: 'yesterday:meh' },
      { text: '📊 👍', callback_data: 'yesterday:thumbs_up' }
    ]
  ];
  for (let i = 0; i < Math.min(replyToDrafts.length, 3); i++) {
    rows.push([
      { text: `📤 ${replyToDrafts[i].preview || `Reply ${i+1}`}`, callback_data: `reply:sent:${replyToDrafts[i].id}` },
      { text: '⏭ Skip', callback_data: `reply:skip:${replyToDrafts[i].id}` }
    ]);
  }
  while (rows.length < 5) rows.push([]);
  rows.push([
    { text: '✅ QBR done', callback_data: 'qbr:done' },
    { text: '🔄 Refresh', callback_data: 'cmd:refresh' },
    { text: '📋 Status', callback_data: 'cmd:status' }
  ]);
  return { inline_keyboard: rows };
}
