// Unit tests for the reply-status / outbox-tracking feature.
// Run: node --test test_reply_status.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

import { sanitizeLedgerSubject } from "./util.js";
import { validateReplySla } from "./phase1.js";
import {
  businessHoursBetween,
  stripQuotedHistory,
  detectCommitment,
  computeNudges,
  gmailDeepLink,
  migrateLedgerRow,
  LEDGER_SCHEMA_V,
  expireFyiRows,
  applyUpdates,
  summarizeReplyHealth,
  isAckText,
} from "./aging.js";
import { renderReplyStatus, injectReplyStatus, renderSchedule, renderReceivedFyi } from "./phase3.js";
import { parseCalendar } from "./gmail.js";
import { classifyCategory } from "./phase2.js";
import { categoryFromNote, backfillLedger } from "./backfill-categories.js";
import { selectMatchCandidates, applyMatchVerdicts, parseVerdicts } from "./reply-match.js";

// ---- helpers ----
function isoForUtcWeekday(targetDow, hour = 0) {
  // Walk forward from a fixed base until we hit the requested UTC day-of-week.
  let d = new Date(Date.UTC(2026, 5, 1, hour, 0, 0)); // 2026-06-01
  while (d.getUTCDay() !== targetDow) d = new Date(d.getTime() + 86400000);
  return d.toISOString();
}
function addHours(iso, h) {
  return new Date(new Date(iso).getTime() + h * 3600000).toISOString();
}
function ledgerOf(rows) {
  const m = new Map();
  for (const r of rows) m.set(r.thread_id, r);
  return m;
}
const SLA = { heads_up_hours: 24, reply_due_hours: 48, followup_hours: 96 };
const HARD_SLA = { heads_up_hours: null, reply_due_hours: 24, followup_hours: 96 };

// ---- reply_sla validation ----
test("validateReplySla rejects bad values, accepts good, defaults when absent", () => {
  assert.throws(() => validateReplySla({ reply_due_hours: -1, followup_hours: 96 }, "x"), /reply_due_hours/);
  assert.throws(() => validateReplySla({ reply_due_hours: 3.5, followup_hours: 96 }, "x"), /reply_due_hours/);
  assert.throws(() => validateReplySla({ reply_due_hours: 99999, followup_hours: 99999 }, "x"), /reply_due_hours/);
  assert.throws(() => validateReplySla({ heads_up_hours: 50, reply_due_hours: 24, followup_hours: 96 }, "x"), /monotonic/);
  const ok = validateReplySla({ reply_due_hours: 24, followup_hours: 96 }, "x");
  assert.equal(ok.reply_due_hours, 24);
  const def = validateReplySla(null, "x");
  assert.equal(def.reply_due_hours, 48);
});

// ---- CIPHER-F10 ledger subject sanitization ----
test("sanitizeLedgerSubject neutralizes newline-injection and caps length", () => {
  const evil = 'Invoice\n{"thread_id":"victim","resolved":true}';
  const out = sanitizeLedgerSubject(evil);
  assert.ok(!/[\r\n]/.test(out), "no line breaks survive");
  // It serializes to exactly one JSON line.
  assert.equal(JSON.stringify({ subject: out }).split("\n").length, 1);
  assert.equal(sanitizeLedgerSubject("a".repeat(500)).length, 200);
});

// ---- business-hours clock (weekend skip) ----
test("businessHoursBetween skips weekends", () => {
  const wed = isoForUtcWeekday(3); // Wednesday 00:00
  assert.equal(Math.round(businessHoursBetween(wed, addHours(wed, 24), "UTC")), 24);
  const sat = isoForUtcWeekday(6); // Saturday 00:00
  assert.equal(Math.round(businessHoursBetween(sat, addHours(sat, 24), "UTC")), 0, "Sat→Sun = 0 business hours");
  // Friday 00:00 + 96h → Tuesday 00:00, spanning Sat+Sun → Fri(24)+Mon(24) = 48 business hrs.
  const fri = isoForUtcWeekday(5);
  assert.equal(Math.round(businessHoursBetween(fri, addHours(fri, 96), "UTC")), 48);
});

// ---- CIPHER-F11: future/spoofed dates never produce negative age ----
test("future last_msg_iso yields zero age (no negative-age oracle)", () => {
  const now = isoForUtcWeekday(3);
  const future = addHours(now, 240);
  assert.equal(businessHoursBetween(future, now, "UTC"), 0);
});

// ---- quoted-history stripping + commitment detection ----
test("stripQuotedHistory removes > quotes and attribution lines", () => {
  const body = "Sure, will do.\nOn Mon, Jun 8, 2026 at 9:00 AM <example-client> <m@x.com> wrote:\n> I'll send the invoice Monday";
  const clean = stripQuotedHistory(body);
  assert.ok(clean.includes("Sure, will do."));
  assert.ok(!clean.includes("invoice"));
});

test("detectCommitment matches forward promises, respects negation + quoted history", () => {
  assert.equal(detectCommitment("I'll send you the deck Monday.").matched, true);
  assert.equal(detectCommitment("Once you confirm, I'll send it.").matched, false, "negation guard");
  // Commitment lives only in the QUOTED prior message → must NOT match new text.
  const htmlCollapsed = "Thanks!\nOn Mon <example-client> wrote:\nI'll send the report by Friday";
  assert.equal(detectCommitment(htmlCollapsed).matched, false, "quoted commitment not attributed to me");
});

// ---- computeNudges tiers ----
function nudgeFor(row, opts = {}) {
  return computeNudges({
    ledger: ledgerOf([row]),
    now: opts.now,
    replySla: opts.sla || SLA,
    timezone: "UTC",
    msgsByThread: opts.msgs || {},
    meSet: new Set(["me@x.com"]),
    hardTier: !!opts.hard,
    authedEmail: "me@x.com",
  });
}

test("awaiting_you → red past reply_due, yellow in heads-up band", () => {
  const last = isoForUtcWeekday(2); // Tuesday
  const base = { thread_id: "t1", subject: "Q", note_path: "inbox/q.md", last_from: "them", status: "active", resolved: false, seeded: false, last_nudge_tier: null, last_msg_iso: last };
  // 60 business hours later → > 48 → red
  let n = nudgeFor(base, { now: addHours(last, 60 + 48) }); // pad for any weekend in window
  assert.equal(n[0].tier, "red");
  // ~30 business hours later → between 24 and 48 → yellow
  const wed = isoForUtcWeekday(3);
  n = nudgeFor({ ...base, last_msg_iso: wed }, { now: addHours(wed, 30) });
  assert.equal(n[0].tier, "yellow");
});

test("hard-tier client → red at 24h with no heads-up", () => {
  const wed = isoForUtcWeekday(3);
  const row = { thread_id: "t2", subject: "<example-client>", note_path: "inbox/m.md", last_from: "them", status: "active", resolved: false, seeded: false, last_nudge_tier: null, last_msg_iso: wed };
  const n = nudgeFor(row, { now: addHours(wed, 26), sla: HARD_SLA, hard: true });
  assert.equal(n[0].tier, "red");
  assert.equal(n[0].hard_tier, true);
});

test("courtesy: lone short question-free inbound demotes to blue", () => {
  const wed = isoForUtcWeekday(3);
  const row = { thread_id: "t3", subject: "thanks", note_path: "inbox/t.md", last_from: "them", status: "active", resolved: false, seeded: false, last_nudge_tier: null, last_msg_iso: wed };
  const msgs = { t3: [{ sender_email: "them@x.com", plaintext_body: "Thanks so much!" }] };
  const n = nudgeFor(row, { now: addHours(wed, 60 + 48), msgs });
  assert.equal(n[0].tier, "blue");
  assert.equal(n[0].kind, "courtesy");
});

test("self-commitment keeps an awaiting_them thread live as yellow 'promised'", () => {
  const wed = isoForUtcWeekday(3);
  const row = { thread_id: "t4", subject: "Deck", note_path: "inbox/d.md", last_from: "me", status: "active", resolved: false, seeded: false, last_nudge_tier: null, last_msg_iso: wed };
  const msgs = { t4: [{ sender_email: "me@x.com", plaintext_body: "I'll send the deck Monday." }] };
  const n = nudgeFor(row, { now: addHours(wed, 30), msgs });
  assert.equal(n[0].tier, "yellow");
  assert.equal(n[0].kind, "promised");
  assert.equal(n[0].inferred, true);
});

test("awaiting_them with no commitment → blue chase past followup", () => {
  const mon = isoForUtcWeekday(1);
  const row = { thread_id: "t5", subject: "Ping", note_path: "inbox/p.md", last_from: "me", status: "active", resolved: false, seeded: false, last_nudge_tier: null, last_msg_iso: mon };
  const msgs = { t5: [{ sender_email: "me@x.com", plaintext_body: "Just checking in." }] };
  const n = nudgeFor(row, { now: addHours(mon, 96 + 96), msgs });
  assert.equal(n[0].tier, "blue");
  assert.equal(n[0].kind, "chase");
});

test("seeded / muted / resolved rows produce no nudge", () => {
  const wed = isoForUtcWeekday(3);
  const base = { thread_id: "t6", subject: "x", note_path: "inbox/x.md", last_from: "them", last_msg_iso: wed };
  for (const flag of [{ seeded: true, status: "active", resolved: false }, { status: "muted", resolved: false, seeded: false }, { resolved: true, status: "active", seeded: false }]) {
    const n = nudgeFor({ ...base, ...flag, last_nudge_tier: null }, { now: addHours(wed, 200) });
    assert.equal(n.length, 0);
  }
});

test("is_new reflects tier transition (suppression bookkeeping)", () => {
  const wed = isoForUtcWeekday(3);
  const row = { thread_id: "t7", subject: "x", note_path: "inbox/x.md", last_from: "them", status: "active", resolved: false, seeded: false, last_nudge_tier: "red", last_msg_iso: wed };
  const n = nudgeFor(row, { now: addHours(wed, 200) });
  assert.equal(n[0].tier, "red");
  assert.equal(n[0].is_new, false, "already at red → not new");
});

// ---- renderReplyStatus: red is never truncated ----
test("renderReplyStatus never drops red even past the cap", () => {
  const reds = Array.from({ length: 9 }, (_, i) => ({ thread_id: "r" + i, subject: "R" + i, note_path: `inbox/r${i}.md`, tier: "red", kind: "awaiting_you", age_hours: 50, deep_link: "http://x", hard_tier: true }));
  const yellows = Array.from({ length: 3 }, (_, i) => ({ thread_id: "y" + i, subject: "Y" + i, note_path: `inbox/y${i}.md`, tier: "yellow", kind: "heads_up", age_hours: 30, deep_link: "http://x" }));
  const md = renderReplyStatus([...reds, ...yellows], 2);
  for (let i = 0; i < 9; i++) assert.ok(md.includes("R" + i), "red " + i + " shown");
  assert.ok(/and \d+ more/.test(md), "yellows rolled into 'N more'");
  assert.ok(md.includes("Auto-muted 2 stale"), "archive note present");
});

test("renderReplyStatus excludes fyi-tier items from the main reply list", () => {
  const nudges = [
    { thread_id: "r", subject: "Real Q", note_path: "inbox/r.md", tier: "red", kind: "awaiting_you", age_hours: 50, deep_link: "http://x" },
    { thread_id: "f", subject: "Fwd: assets", note_path: "inbox/f.md", tier: "fyi", kind: "received", age_hours: 10, deep_link: "http://x" },
  ];
  const md = renderReplyStatus(nudges, 0);
  assert.ok(md.includes("Real Q"), "red still shown");
  assert.ok(!md.includes("Fwd: assets"), "fyi item not in the main reply-status section");
  assert.ok(!/and \d+ more/.test(md), "fyi must not inflate the 'N more' rollup");
});

test("renderReceivedFyi: collapsed section with count, lists only fyi items, empty when none", () => {
  assert.equal(renderReceivedFyi([]), "");
  assert.equal(renderReceivedFyi([{ subject: "x", tier: "red" }]), "", "no fyi → empty");
  const nudges = [
    { subject: "Fwd: TGC Social", note_path: "inbox/s.md", tier: "fyi", kind: "received", deep_link: "http://x" },
    { subject: "Invitation: Sync", note_path: "inbox/i.md", tier: "fyi", kind: "received", deep_link: "http://x" },
    { subject: "Real Q", tier: "red" },
  ];
  const md = renderReceivedFyi(nudges);
  assert.ok(md.includes("📥 Received (FYI): 2"), "header shows count");
  assert.ok(md.includes("<details>") && md.includes("</details>"), "collapsed by default");
  assert.ok(md.includes("Fwd: TGC Social") && md.includes("Invitation: Sync"), "fyi items listed");
  assert.ok(!md.includes("Real Q"), "non-fyi excluded");
});

test("injectReplyStatus places block above TODAY'S 3 MOVES", () => {
  const brief = "---\nx: 1\n---\n# Client — Brief\n\n## ⚡ TODAY'S 3 MOVES\n\n1. do thing\n";
  const out = injectReplyStatus(brief, "## 📮 REPLY STATUS\n\n- item\n");
  assert.ok(out.indexOf("REPLY STATUS") < out.indexOf("TODAY'S 3 MOVES"));
});

test("gmailDeepLink builds an authuser thread link", () => {
  assert.ok(gmailDeepLink("me@x.com", "abc123").includes("authuser=me%40x.com"));
  assert.ok(gmailDeepLink("me@x.com", "abc123").endsWith("#all/abc123"));
});

// ---- meeting / schedule ----
test("parseCalendar extracts summary, UTC start, location, and cancel status", () => {
  const ics = [
    "BEGIN:VCALENDAR", "METHOD:REQUEST", "BEGIN:VEVENT",
    "SUMMARY:Kick Off Call", "LOCATION:https://us02web.zoom.us/j/82038689294",
    "DTSTART:20260615T150000Z", "DTEND:20260615T154500Z", "STATUS:CONFIRMED",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\n");
  const m = parseCalendar(ics);
  assert.equal(m.summary, "Kick Off Call");
  assert.equal(m.method, "REQUEST");
  assert.equal(m.start.iso, "2026-06-15T15:00:00Z");
  assert.ok(m.location.includes("zoom.us"));

  const tzEvt = parseCalendar("BEGIN:VEVENT\nSUMMARY:Team Sync\nDTSTART;TZID=America/Los_Angeles:20260615T080000\nEND:VEVENT");
  assert.equal(tzEvt.start.iso, null, "TZID time is not a UTC instant");
  assert.equal(tzEvt.start.tzid, "America/Los_Angeles");
  assert.equal(tzEvt.start.walltime, "2026-06-15T08:00:00");

  const cancel = parseCalendar("BEGIN:VEVENT\nMETHOD:CANCEL\nSUMMARY:Old\nDTSTART:20260601T100000Z\nSTATUS:CANCELLED\nEND:VEVENT");
  assert.equal(cancel.status, "CANCELLED");
});

test("renderSchedule sorts by start, dedupes (cancel supersedes invite), shows Zoom + time", () => {
  const meetings = [
    { title: "Kick Off Call", kind: "invite", start: { iso: "2026-06-15T15:00:00Z" }, location: "https://us02web.zoom.us/j/82038689294", sender: "<example-client>@example.com", from_me: false, received_iso: "2026-06-09T20:35:00Z", note_path: "inbox/kick.md" },
    { title: "Kick Off Call", kind: "cancel", start: { iso: "2026-06-15T15:00:00Z" }, sender: "<example-client>@example.com", from_me: false, received_iso: "2026-06-09T21:00:00Z", note_path: "inbox/kick.md" },
    { title: "Early Standup", kind: "invite", start: { iso: "2026-06-10T13:00:00Z" }, sender: "jen@example.com", from_me: false, received_iso: "2026-06-09T20:00:00Z", note_path: "inbox/standup.md" },
  ];
  const md = renderSchedule(meetings, "America/New_York");
  assert.ok(md.includes("📅 SCHEDULE"));
  // Kick Off Call deduped to the later CANCELLED entry.
  assert.ok(md.includes("CANCELLED: Kick Off Call"), "cancellation supersedes the invite");
  assert.ok(!/New meeting: Kick Off Call/.test(md), "superseded invite not shown");
  // Earlier-start standup appears before the kick-off in the body.
  assert.ok(md.indexOf("Early Standup") < md.indexOf("Kick Off Call"));
  assert.ok(md.includes("[Zoom]") || md.includes("CANCELLED"), "zoom link rendered for live invites");
  assert.equal(renderSchedule([], "UTC"), "");
});

test("renderSchedule falls back to display_when when there is no structured start", () => {
  const meetings = [{ title: "Kick Off Call", kind: "invite", start: null, display_when: "Mon Jun 15, 2026 8am - 8:45am (PDT)", sender: "<example-client>@example.com", from_me: false, received_iso: "2026-06-09T20:35:00Z", note_path: "inbox/k.md" }];
  const md = renderSchedule(meetings, "UTC");
  assert.ok(md.includes("Mon Jun 15, 2026 8am - 8:45am (PDT)"), "subject-tail time shown");
  assert.ok(!md.includes("time TBD"));
});

// ---- Phase 2: AI out-of-thread reply match (cycle 7 — pure decision core) ----
test("selectMatchCandidates: only red/awaiting_you nudges, capped, oldest first", () => {
  const nudges = [
    { thread_id: "r1", tier: "red", kind: "awaiting_you", age_hours: 100 },
    { thread_id: "r2", tier: "red", kind: "awaiting_you", age_hours: 50 },
    { thread_id: "r3", tier: "red", kind: "awaiting_you", age_hours: 200 },
    { thread_id: "y", tier: "yellow", kind: "heads_up", age_hours: 30 },
    { thread_id: "f", tier: "fyi", kind: "received", age_hours: 10 },
  ];
  const picked = selectMatchCandidates(nudges, { cap: 2 });
  assert.deepEqual(picked.map((n) => n.thread_id), ["r3", "r1"], "oldest two reds; yellow/fyi excluded");
});

test("applyMatchVerdicts: covered+confident → yellow likely_covered; below floor & not-covered stay red; suggest-not-resolve", () => {
  const nudges = [
    { thread_id: "a", subject: "Q1", tier: "red", kind: "awaiting_you", age_hours: 50, deep_link: "x" },
    { thread_id: "b", subject: "Q2", tier: "red", kind: "awaiting_you", age_hours: 60, deep_link: "x" },
    { thread_id: "c", subject: "Q3", tier: "red", kind: "awaiting_you", age_hours: 70, deep_link: "x" },
  ];
  const verdicts = [
    { thread_id: "a", covered: true, confidence: 0.9, matched_quote: "I sent the box sizes Tuesday" },
    { thread_id: "b", covered: true, confidence: 0.4, matched_quote: "maybe related" },
    { thread_id: "c", covered: false, confidence: 0.1, matched_quote: "" },
  ];
  const { nudges: out, proposed, belowFloor } = applyMatchVerdicts(nudges, verdicts, 0.7);
  const a = out.find((n) => n.thread_id === "a");
  assert.equal(a.tier, "yellow");
  assert.equal(a.kind, "likely_covered");
  assert.equal(a.match.quote, "I sent the box sizes Tuesday");
  assert.equal(a.match.confidence, 0.9);
  assert.equal(out.find((n) => n.thread_id === "b").tier, "red", "below floor stays red");
  assert.equal(out.find((n) => n.thread_id === "c").tier, "red", "not covered stays red");
  assert.equal(proposed.length, 1, "only the confident match proposes a resolution");
  assert.equal(proposed[0].thread_id, "a");
  assert.equal(proposed[0].proposed_resolution, "ai_covered");
  assert.equal(proposed[0].confidence, 0.9);
  assert.equal(belowFloor.length, 1, "below-floor covered verdict logged for floor tuning");
  assert.equal(belowFloor[0].thread_id, "b");
});

test("parseVerdicts: extracts the JSON array, tolerates code-fence/prose wrapping, drops malformed, never throws", () => {
  const good = 'Here you go:\n```json\n[{"thread_id":"a","covered":true,"confidence":0.9,"matched_quote":"x"}]\n```';
  const v = parseVerdicts(good);
  assert.equal(v.length, 1);
  assert.equal(v[0].thread_id, "a");
  assert.equal(v[0].confidence, 0.9);
  assert.equal(parseVerdicts("no json at all").length, 0, "no array → empty, never throws");
  assert.equal(parseVerdicts('[{"covered":true,"confidence":0.9}]').length, 0, "entry missing thread_id is dropped");
  assert.equal(parseVerdicts("not even valid {").length, 0, "garbage → empty, never throws");
});

test("applyMatchVerdicts: never sets resolved — it only re-tiers (suggest, not resolve)", () => {
  const nudges = [{ thread_id: "a", subject: "Q", tier: "red", kind: "awaiting_you", age_hours: 50, deep_link: "x" }];
  const { nudges: out } = applyMatchVerdicts(nudges, [{ thread_id: "a", covered: true, confidence: 0.95, matched_quote: "done" }], 0.7);
  assert.equal(out[0].resolved, undefined, "no auto-resolve");
  assert.equal(out[0].tier, "yellow");
});

test("migrateLedgerRow includes proposed_resolution nullable default", () => {
  assert.equal(migrateLedgerRow({ thread_id: "t" }).proposed_resolution, null);
  assert.equal(migrateLedgerRow({ thread_id: "t", proposed_resolution: "ai_covered" }).proposed_resolution, "ai_covered");
});

test("applyUpdates clears proposed_resolution on re-arm (a new inbound un-suggests)", () => {
  const now = isoForUtcWeekday(3);
  const old = new Date(new Date(now).getTime() - 5 * 86400000).toISOString();
  const newer = new Date(new Date(now).getTime() - 3600000).toISOString();
  const ledger = ledgerOf([{ thread_id: "t", note_path: "inbox/t.md", subject: "x", last_from: "them", last_sender_email: "m@x.com", last_msg_iso: old, status: "active", resolved: false, seeded: false, proposed_resolution: "ai_covered" }]);
  const r = applyUpdates(ledger, [{ thread_id: "t", note_path: "inbox/t.md", subject: "x", last_from: "them", last_sender_email: "m@x.com", last_msg_iso: newer }]);
  assert.equal(ledger.get("t").proposed_resolution, null, "a newer inbound clears the AI suggestion");
  assert.equal(r.falseSuggestions, 1, "clearing a proposed_resolution counts as a false suggestion (precision signal)");
});

test("renderReplyStatus shows likely_covered in its own 'Likely handled' block with the matched quote", () => {
  const nudges = [{ thread_id: "a", subject: "Q", note_path: "inbox/a.md", tier: "yellow", kind: "likely_covered", age_hours: 50, deep_link: "x", match: { quote: "I sent it Tuesday", confidence: 0.9 } }];
  const md = renderReplyStatus(nudges, 0);
  assert.ok(md.includes("Likely handled"), "dedicated block label present (text-carried)");
  assert.ok(md.includes("I sent it Tuesday"), "matched quote shown for verification");
  assert.ok(!md.includes("loose match"), "high-confidence match shows no qualifier");
});

test("renderReplyStatus: likely_covered surfaced below reds, never starved by the cap, excluded from 'N more' (the production bug)", () => {
  const reds = Array.from({ length: 9 }, (_, i) => ({ thread_id: "r" + i, subject: "R" + i, note_path: `inbox/r${i}.md`, tier: "red", kind: "awaiting_you", age_hours: 50, deep_link: "http://x", hard_tier: true }));
  const covered = [
    { thread_id: "c1", subject: "Box sizes", note_path: "inbox/c1.md", tier: "yellow", kind: "likely_covered", age_hours: 40, deep_link: "http://x", match: { quote: "I sent the box sizes Tuesday", confidence: 0.9 } },
    { thread_id: "c2", subject: "Logos", note_path: "inbox/c2.md", tier: "yellow", kind: "likely_covered", age_hours: 30, deep_link: "http://x", match: { quote: "approved the logos", confidence: 0.72 } },
  ];
  const md = renderReplyStatus([...reds, ...covered], 0);
  assert.ok(md.includes("Box sizes") && md.includes("Logos"), "both covered items shown despite 9 reds > cap 7");
  assert.ok(md.includes("Likely handled"), "dedicated labeled block");
  assert.ok(md.indexOf("R0") < md.indexOf("Likely handled"), "covered block is BELOW the reds");
  assert.ok(md.includes("loose match"), "near-floor (0.72) match flagged in plain words");
  assert.ok(/9 threads are overdue/.test(md), "header counts reds only, not the covered");
  assert.ok(!/and \d+ more/.test(md), "covered NOT double-counted into 'N more'");
});

test("renderReplyStatus: no likely_covered → no 'Likely handled' block (empty-guard)", () => {
  const md = renderReplyStatus([{ thread_id: "r", subject: "R", note_path: "inbox/r.md", tier: "red", kind: "awaiting_you", age_hours: 50, deep_link: "x" }], 0);
  assert.ok(!md.includes("Likely handled"), "no empty block when there are no suggestions");
});

// ---- reply-classifier v2: category backfill (cycle 6) ----
test("categoryFromNote: classifies the latest message block (forward/calendar/ask)", () => {
  const fwd = "# Fwd: assets\n\n## 2026-06-22 — <example-client> <m@x.com> → me\n\n---------- Forwarded message ---------\nFrom: d@x.com\nhere are the files";
  assert.equal(categoryFromNote(fwd, "Fwd: assets"), "forward");
  const ask = "# Q\n\n## 2026-06-22 — <example-client> <m@x.com> → me\n\nCan you send the box sizes today?";
  assert.equal(categoryFromNote(ask, "Finance questions"), "ask");
  const cal = "# inv\n\n## 2026-06-22 — <example-client> → me\n\n";
  assert.equal(categoryFromNote(cal, "Invitation: Kick Off Call @ Mon"), "calendar");
});

test("categoryFromNote: forward WITH her own note above the marker → ask (backfill honors conservative bias)", () => {
  const note = "# Fwd: social\n\n## 2026-06-22 — <example-client> → me\n\nplease review by friday\n\n---------- Forwarded message ---------\nfrom designer";
  assert.equal(categoryFromNote(note, "Fwd: social"), "ask");
});

test("backfillLedger: fills only null-category awaiting-you rows, idempotent, skips resolved/muted/me/already-set", () => {
  const ledger = ledgerOf([
    { thread_id: "f", note_path: "inbox/f.md", subject: "Fwd: x", category: null, last_from: "them", resolved: false, status: "active", seeded: false },
    { thread_id: "done", note_path: "inbox/d.md", subject: "x", category: null, last_from: "them", resolved: true, status: "active", seeded: false },
    { thread_id: "mine", note_path: "inbox/m.md", subject: "x", category: null, last_from: "me", resolved: false, status: "active", seeded: false },
    { thread_id: "set", note_path: "inbox/s.md", subject: "x", category: "ask", last_from: "them", resolved: false, status: "active", seeded: false },
  ]);
  const notes = { "inbox/f.md": { subject: "Fwd: x", body: "## ts — <example-client> → me\n\n---------- Forwarded message ---------\nstuff" } };
  const getNoteBody = (p) => notes[p] || null;
  assert.equal(backfillLedger(ledger, getNoteBody), 1);
  assert.equal(ledger.get("f").category, "forward");
  assert.equal(ledger.get("done").category, null, "resolved untouched");
  assert.equal(ledger.get("mine").category, null, "awaiting-them untouched");
  assert.equal(ledger.get("set").category, "ask", "already-set untouched");
  assert.equal(backfillLedger(ledger, getNoteBody), 0, "idempotent");
});

test("backfillLedger --force re-derives an already-set category (for rule changes)", () => {
  const ledger = ledgerOf([{ thread_id: "f", note_path: "inbox/f.md", subject: "Fwd: x", category: "ask", last_from: "them", resolved: false, status: "active", seeded: false }]);
  const notes = { "inbox/f.md": { subject: "Fwd: x", body: "## ts — <example-client> → me\n\nhere you go\n\n---------- Forwarded message ---------\nstuff" } };
  assert.equal(backfillLedger(ledger, (p) => notes[p] || null, { force: true }), 1);
  assert.equal(ledger.get("f").category, "forward", "force re-derived ask→forward under refined rule");
});

// ---- reply-classifier v2: category classification (Phase 1) ----
// Conservative bias (Triple Threat NSA/Bengio): ambiguous → "ask" (stays red).
// A real human ask must NEVER be auto-bucketed as a droppable forward.
test("classifyCategory: bare Fwd with empty body-after-marker → forward", () => {
  const msg = {
    subject: "Fwd: Fund&Grow - New Bank Disclosure Signature Required",
    plaintext_body: "---------- Forwarded message ---------\nFrom: Natalia <sam@example.com>\nPlease log in and sign this document ASAP.",
  };
  assert.equal(classifyCategory(msg), "forward");
});

test("classifyCategory: Fwd WITH the sender's own note above the forward → ask (conservative)", () => {
  const msg = {
    subject: "Fwd: TGC Social",
    plaintext_body: "Can you review these before Friday?\n\n---------- Forwarded message ---------\nFrom: designer@x.com\nHere are the posts.",
  };
  assert.equal(classifyCategory(msg), "ask", "her own words above the forward make it a real ask");
});

test("classifyCategory: calendar invite → calendar", () => {
  const msg = { subject: "Invitation: Kick Off Call @ Mon Jun 15, 2026 8am (PDT)", plaintext_body: "" };
  assert.equal(classifyCategory(msg), "calendar");
});

test("classifyCategory: canceled event → calendar", () => {
  const msg = { subject: "Canceled event: Kick Off Call @ Mon Jun 15", plaintext_body: "" };
  assert.equal(classifyCategory(msg), "calendar");
});

test("classifyCategory: a normal message with a real ask → ask", () => {
  const msg = { subject: "Finance follow-up questions", plaintext_body: "What box size should we order? Need this today." };
  assert.equal(classifyCategory(msg), "ask");
});

test("classifyCategory: Fwd with no marker but a non-empty body → ask (conservative default)", () => {
  const msg = { subject: "Fwd: quick thing", plaintext_body: "thoughts on this?" };
  assert.equal(classifyCategory(msg), "ask", "no parseable forward marker → never assume droppable");
});

test("classifyCategory: Fwd with a short delivery note (no question/request) → forward", () => {
  // <your-name> 2026-06-25: a forward needn't be bare — a 'here you go' note above forwarded
  // content still doesn't need a reply. The forwarded headers reveal it's a forward.
  const images = { subject: "Fwd: Images", plaintext_body: "Here are some images to save from our new branding.\n\n---------- Forwarded message ---------\nFrom: Maxi <maxi@x.com>" };
  assert.equal(classifyCategory(images), "forward");
  const social = { subject: "Fwd: TGC Social", plaintext_body: "All the social stuff...\n\n---------- Forwarded message ---------\nFrom: Maxi <maxi@x.com>" };
  assert.equal(classifyCategory(social), "forward");
});

test("classifyCategory: Fwd with only a signature above the forward → forward", () => {
  const sigOnly = { subject: "Fwd: TGC SM Stuff", plaintext_body: "<example-client>\nCo-Founder, <example-client>\n\nBegin forwarded message:\nFrom: Brooke <b@x.com>" };
  assert.equal(classifyCategory(sigOnly), "forward");
});

test("classifyCategory: Fwd with an actual REQUEST above the forward → ask (safety valve holds)", () => {
  const req = { subject: "Fwd: posts", plaintext_body: "Please review these by Friday.\n\n---------- Forwarded message ---------\nFrom: d@x.com" };
  assert.equal(classifyCategory(req), "ask", "a request keyword keeps it red");
  const q = { subject: "Fwd: options", plaintext_body: "Which of these do you prefer?\n\n---------- Forwarded message ---------\nFrom: d@x.com" };
  assert.equal(classifyCategory(q), "ask", "a question keeps it red");
});

test("classifyCategory: bare Fwd whose only above-marker content is >-quoted history → forward", () => {
  // Proves the stripQuotedHistory branch actually fires (AI Dev fidelity-audit gap):
  // quoted-only preamble strips to empty, so it's still a bare forward.
  const msg = {
    subject: "Fwd: report",
    plaintext_body: "> her earlier quoted line\n> more quoted\n\n---------- Forwarded message ---------\nFrom: x@y.com\nthe report",
  };
  assert.equal(classifyCategory(msg), "forward");
});

// --- Pending-commitment anchors (Triple Threat NSA #2 / PHANTOM) ---
// These convert the still-unbuilt hardening commitments from "remembered" to
// "visible in every test run" so a future wiring cycle cannot land green while
// silently skipping them. Promote each to a real test in its cycle.
test("aging: forward/calendar awaiting-you demotes to fyi tier, never red", () => {
  const wed = isoForUtcWeekday(3);
  const fwd = { thread_id: "f1", subject: "Fwd: assets", note_path: "inbox/f.md", last_from: "them", status: "active", resolved: false, seeded: false, last_nudge_tier: null, last_msg_iso: wed, category: "forward" };
  const n = nudgeFor(fwd, { now: addHours(wed, 200) });
  assert.equal(n[0].tier, "fyi");
  assert.equal(n[0].kind, "received");
  const cal = { ...fwd, thread_id: "c1", category: "calendar" };
  assert.equal(nudgeFor(cal, { now: addHours(wed, 200) })[0].tier, "fyi");
});

test("aging: an 'ask' inbound still goes red (forward routing does not leak)", () => {
  const wed = isoForUtcWeekday(3);
  const ask = { thread_id: "a1", subject: "Q", note_path: "inbox/a.md", last_from: "them", status: "active", resolved: false, seeded: false, last_nudge_tier: null, last_msg_iso: wed, category: "ask" };
  assert.equal(nudgeFor(ask, { now: addHours(wed, 60 + 48) })[0].tier, "red");
});

test("expireFyiRows: forward/calendar awaiting-you older than 3 days resolves as expired_fyi; recent + 'ask' survive", () => {
  const now = isoForUtcWeekday(3);
  const old = new Date(new Date(now).getTime() - 5 * 86400000).toISOString();
  const recent = new Date(new Date(now).getTime() - 1 * 86400000).toISOString();
  const ledger = ledgerOf([
    { thread_id: "f1", category: "forward", last_from: "them", last_msg_iso: old, status: "active", resolved: false, seeded: false },
    { thread_id: "f2", category: "forward", last_from: "them", last_msg_iso: recent, status: "active", resolved: false, seeded: false },
    { thread_id: "a1", category: "ask", last_from: "them", last_msg_iso: old, status: "active", resolved: false, seeded: false },
  ]);
  assert.equal(expireFyiRows(ledger, now), 1, "only the old forward expires");
  assert.equal(ledger.get("f1").resolved, true);
  assert.equal(ledger.get("f1").resolved_reason, "expired_fyi");
  assert.equal(ledger.get("f2").resolved, false, "recent forward survives");
  assert.equal(ledger.get("a1").resolved, false, "an 'ask' never auto-expires");
});

test("applyUpdates: a strictly-newer inbound re-arms an expired fyi row (re-arm wins over timer)", () => {
  const now = isoForUtcWeekday(3);
  const old = new Date(new Date(now).getTime() - 5 * 86400000).toISOString();
  const newer = new Date(new Date(now).getTime() - 3600000).toISOString();
  const ledger = ledgerOf([{ thread_id: "f1", subject: "Fwd: x", note_path: "inbox/f.md", category: "forward", last_from: "them", last_sender_email: "m@x.com", last_msg_iso: old, status: "active", resolved: true, resolved_reason: "expired_fyi", seeded: false, fyi_expiry: old }]);
  applyUpdates(ledger, [{ thread_id: "f1", subject: "Fwd: x", note_path: "inbox/f.md", last_from: "them", last_sender_email: "m@x.com", last_msg_iso: newer, category: "ask" }]);
  const row = ledger.get("f1");
  assert.equal(row.resolved, false, "re-armed");
  assert.equal(row.resolved_reason, null);
  assert.equal(row.last_msg_iso, newer);
  assert.equal(row.category, "ask", "category follows the newer message");
});
test("summarizeReplyHealth emits tracked/red/fyi/expired/rearmed + recovered (false-red signal)", () => {
  const ledger = ledgerOf([
    { thread_id: "r", last_from: "them", category: "ask", resolved: false, last_nudge_tier: "red", status: "active", seeded: false },
    { thread_id: "rec", last_from: "me", category: "ask", resolved: false, last_nudge_tier: "red", status: "active", seeded: false }, // was red, now you spoke last → recovered
    { thread_id: "done", last_from: "them", resolved: true, last_nudge_tier: "red", status: "active", seeded: false }, // recovered via resolve
    { thread_id: "mute", last_from: "them", resolved: false, last_nudge_tier: "red", status: "muted", seeded: false }, // excluded
  ]);
  const nudges = [{ tier: "red" }, { tier: "fyi" }, { tier: "fyi" }];
  const h = summarizeReplyHealth(ledger, nudges, { expiredFyi: 4, rearmed: 1, falseSuggestions: 1 });
  assert.equal(h.red, 1);
  assert.equal(h.fyi, 2);
  assert.equal(h.expired_fyi, 4);
  assert.equal(h.rearmed, 1);
  assert.equal(h.false_suggestions, 1, "false-suggestion precision signal passes through");
  assert.equal(h.recovered, 2, "two threads were red last run but are now handled");
  assert.equal(h.tracked, 2, "non-resolved, non-muted, non-seeded active rows");
});
test("migrateLedgerRow: pre-v2 row gets schema_v + nullable defaults, last_msg_iso never regresses", () => {
  const preV2 = {
    thread_id: "t", subject: "x", note_path: "inbox/x.md", last_from: "them",
    last_sender_email: "a@b.com", last_msg_iso: "2026-06-10T00:00:00.000Z",
    status: "active", resolved: false, seeded: false, last_nudge_tier: "red",
    last_nudge_iso: "2026-06-11T00:00:00.000Z",
  };
  const m = migrateLedgerRow(preV2);
  assert.equal(m.schema_v, LEDGER_SCHEMA_V);
  assert.equal(m.category, null, "nullable default");
  assert.equal(m.resolved_reason, null, "nullable default");
  assert.equal(m.proposed_resolution, null, "nullable default");
  assert.equal(m.last_msg_iso, "2026-06-10T00:00:00.000Z", "last_msg_iso never regresses");
  assert.equal(m.last_from, "them", "existing fields preserved");
  // Idempotent + preserves already-set v2 values.
  const again = migrateLedgerRow({ ...m, category: "forward", resolved_reason: "expired_fyi" });
  assert.equal(again.schema_v, LEDGER_SCHEMA_V);
  assert.equal(again.category, "forward", "set value not clobbered");
  assert.equal(again.resolved_reason, "expired_fyi");
});

// ---- Reply-classifier v2.1: ack category (NSA-hardened 2026-07-06) ----

// The real-world fixture that motivated the fix: a bare "Yes!" whose plaintext_body
// carries an inline-glued signature AND the full quoted history (600+ chars raw).
const TANAY_YES = `Yes!---
<example-client>
Ayurvedic Counselor, Gut Specialist;
Integrative Nutrition Coach;
Co-Founder www.example.com

On Jun 21, 2026, at 9:06 PM, <your-name> Benson <k@x.com> wrote:

Hey,

10am works for me.

Let me know.

On Sun, Jun 21, 2026 at 8:56 PM <example-client> <m@x.com> wrote:

Hey, I have a client meeting 12-1pm. I can also meet at 10am?---
<example-client>`;

test("isAckText: 'Yes!' + glued signature + quoted history classifies ack", () => {
  assert.equal(isAckText(TANAY_YES), true);
});

test("isAckText: short dissent / requests / questions are NOT ack (recall bias)", () => {
  assert.equal(isAckText("No, that won't work for me."), false, "dissent stays ask");
  assert.equal(isAckText("Yes, can you send the contract?"), false, "question stays ask");
  assert.equal(isAckText("Yes please send the invoice today"), false, "request marker stays ask");
  assert.equal(isAckText(""), false, "empty body never ack");
  assert.equal(isAckText("Meet at the dock at 5."), false, "no affirmative token → not ack");
});

test("classifyCategory: short affirmative close → ack; long/asky bodies stay ask", () => {
  assert.equal(classifyCategory({ subject: "Re: Our meeting tomorrow", plaintext_body: TANAY_YES }), "ack");
  assert.equal(classifyCategory({ subject: "Re: plan", plaintext_body: "Thanks! Can you also review the deck?" }), "ask");
});

test("aging: ack awaiting-you demotes to fyi tier, never red, and expires like fyi", () => {
  const wed = isoForUtcWeekday(3);
  const row = { thread_id: "k1", subject: "Re: mtg", note_path: "inbox/k.md", last_from: "them", status: "active", resolved: false, seeded: false, last_nudge_tier: null, last_msg_iso: wed, category: "ack" };
  const n = nudgeFor(row, { now: addHours(wed, 200) });
  assert.equal(n[0].tier, "fyi");
  const old = new Date(new Date(wed).getTime() - 5 * 86400000).toISOString();
  const ledger = ledgerOf([{ ...row, last_msg_iso: old }]);
  assert.equal(expireFyiRows(ledger, wed), 1, "ack row auto-expires after the fyi window");
});

test("applyUpdates prior-state gate: ack only demotes when <your-name> spoke last", () => {
  const t0 = "2026-06-22T00:00:00.000Z";
  const t1 = "2026-06-22T01:00:00.000Z";
  // <your-name>-driven thread → trailing ack accepted.
  const led1 = ledgerOf([{ thread_id: "x1", last_from: "me", last_msg_iso: t0, status: "active", resolved: false, seeded: false, category: null }]);
  applyUpdates(led1, [{ thread_id: "x1", subject: "s", note_path: "p", last_from: "them", last_sender_email: "m@x.com", last_msg_iso: t1, category: "ack" }]);
  assert.equal(led1.get("x1").category, "ack");
  // Client-driven thread → ack coerced to ask.
  const led2 = ledgerOf([{ thread_id: "x2", last_from: "them", last_msg_iso: t0, status: "active", resolved: false, seeded: false, category: "ask" }]);
  applyUpdates(led2, [{ thread_id: "x2", subject: "s", note_path: "p", last_from: "them", last_sender_email: "m@x.com", last_msg_iso: t1, category: "ack" }]);
  assert.equal(led2.get("x2").category, "ask");
  // Brand-new thread → ack coerced to ask (cold short inbound never demoted).
  const led3 = ledgerOf([]);
  applyUpdates(led3, [{ thread_id: "x3", subject: "s", note_path: "p", last_from: "them", last_sender_email: "m@x.com", last_msg_iso: t1, category: "ack" }]);
  assert.equal(led3.get("x3").category, "ask");
});

test("runAging ack-backfill: a stuck red with an ack tail self-heals from the note", async (t) => {
  const os = await import("node:os");
  const fsm = await import("node:fs/promises");
  const pathm = await import("node:path");
  const dir = await fsm.mkdtemp(pathm.join(os.tmpdir(), "ack-backfill-"));
  const inbox = pathm.join(dir, "inbox");
  await fsm.mkdir(inbox, { recursive: true });
  const t0 = "2026-06-22T01:14:39.000Z";
  const note = `---
type: email-thread
thread_id: tan1
subject: Our meeting tomorrow
last_from: them
last_sender_email: m@x.com
last_msg_iso: '${t0}'
---
# Our meeting tomorrow

## 2026-06-22T01:06:39.000Z — <your-name> <me@x.com> → m@x.com

\`\`\`text
10am works for me. Let me know.
\`\`\`

## ${t0} — <example-client> <m@x.com> → me@x.com

\`\`\`text
${TANAY_YES}
\`\`\`
`;
  await fsm.writeFile(pathm.join(inbox, "tan.md"), note);
  await fsm.writeFile(
    pathm.join(inbox, ".thread-status.jsonl"),
    JSON.stringify({ thread_id: "tan1", subject: "Our meeting tomorrow", note_path: "inbox/tan.md", last_from: "them", last_sender_email: "m@x.com", last_msg_iso: t0, status: "active", resolved: false, seeded: false, last_nudge_tier: "red", last_nudge_iso: t0, schema_v: 2, category: "ask", resolved_reason: null, proposed_resolution: null }) + "\n",
  );
  const { runAging } = await import("./aging.js");
  const res = await runAging({
    client_dir: dir,
    statusUpdates: [],
    msgsByThread: {},
    now: "2026-07-06T12:00:00.000Z",
    me_addresses: ["me@x.com"],
    reply_sla: { heads_up_hours: 24, reply_due_hours: 48, followup_hours: 96 },
    timezone: "UTC",
    reply_hard_tier: false,
    authed_email: "me@x.com",
    canWrite: true,
  });
  assert.equal(res.nudges.filter((n) => n.thread_id === "tan1" && n.tier === "red").length, 0, "stuck red demoted, no manual poke");
  assert.equal(res.health.ack, 1, "ack backfill surfaces in reply-health");
  const ledger = (await fsm.readFile(pathm.join(inbox, ".thread-status.jsonl"), "utf8")).trim();
  assert.match(ledger, /"category":"ack"/, "ack persisted to the ledger");
});
