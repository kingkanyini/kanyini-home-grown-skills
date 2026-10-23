# HTML Playbook Template

*The orchestrator reads this file during Phase 6 (Playbook Generation), resolves all {VARIABLES} with data from the agent outputs and registry, and writes the result as XRAY_PLAYBOOK.html.*

---

## Variable Reference

| Variable | Source | Description |
|----------|--------|-------------|
| `{VIDEO_TITLE}` | Registry `name` | Human-readable video name |
| `{VIDEO_STATS}` | Registry metadata | "13:27 \| 1080p \| 30fps \| 141 scene changes" |
| `{TEMPLATE_COUNT}` | Agent 4 output | Number of templates found |
| `{TRANSITION_COUNT}` | Agent 4 output | Number of transitions found |
| `{COUNSEL_NAMES}` | Skill identity | "Visual Visionary Counsel" |
| `{SIDEBAR_TEMPLATE_LINKS}` | Agent 4 output | Generated `<a>` tags for each template |
| `{SIDEBAR_TRANSITION_LINKS}` | Agent 4 output | Generated `<a>` tags for each transition |
| `{COLOR_SWATCHES}` | Agent 3 output | Generated swatch divs with hex colors |
| `{FONT_TABLE_ROWS}` | Agent 2 output | Generated `<tr>` rows for font system |
| `{TEMPLATE_CARDS}` | Agent 4 + YouTube | Generated template card HTML blocks |
| `{TRANSITION_CARDS}` | Agent 4 + YouTube | Generated transition card HTML blocks |
| `{TIMELINE_ROWS}` | Agent 5 output | Generated timeline row divs |
| `{PACING_TABLE_ROWS}` | Agent 5 output | Generated pacing table rows |
| `{COLOR_EMOTION_ROWS}` | Agent 3 output | Generated color/emotion table rows |
| `{AUTHENTICITY_RULES}` | Agent 3 output | Generated list items |
| `{ESSENTIAL_VIDEO_LINKS}` | YouTube research | Top 4-5 general technique YouTube links |
| `{GENERATION_DATE}` | Current date | YYYY-MM-DD |

## How the Orchestrator Uses This

1. Read this entire file (the HTML block below)
2. For each `{VARIABLE}`, replace with the resolved value
3. For compound variables (`{TEMPLATE_CARDS}`, `{TIMELINE_ROWS}`, etc.), generate the HTML using the sub-templates documented below
4. Write the resolved HTML to `{OUTPUT_DIR}/XRAY_PLAYBOOK.html`

---

## Sub-Templates (for generating compound variables)

### Template Card Sub-Template
For each template in Agent 4's MERGED TEMPLATE LIST, generate:
```html
<div class="template-card" id="t{N}">
  <div class="template-header" onclick="toggleCard(this)">
    <h3>Template {N}: {TEMPLATE_NAME}</h3>
    <div><span class="badge badge-{BADGE}">{BADGE_LABEL}</span> &nbsp;<span class="chevron">▼</span></div>
  </div>
  <div class="template-body">
    <p><strong>Used for:</strong> {USAGE} &nbsp;|&nbsp; <strong>Appears at:</strong> {TIMESTAMPS}</p>
    <div class="frame-preview"><div><img src="frame_{SLUG}.jpg" alt="{TEMPLATE_NAME}"><div class="frame-caption">{FRAME_CAPTION}</div></div></div>
    <h3>How to Build</h3>
    <ol class="steps">{BUILD_STEPS_LI}</ol>
    <h3>Watch How</h3>
    {YOUTUBE_LINKS_HTML}
  </div>
</div>
```

Badge mapping: LAYOUT→badge-layout, OVERLAY→badge-overlay, TEXT→badge-text, GRAPHIC→badge-graphic, MICRO-SCAN→badge-overlay

### Transition Card Sub-Template
Same structure but with `id="tr{N}"` and `<span class="badge badge-overlay">TRANSITION</span>`

### YouTube Link Sub-Template
For each validated URL:
```html
<a class="yt-link" href="{URL}" target="_blank" rel="noopener"><div class="yt-icon"></div>{TITLE} — {CHANNEL} ({VIEWS})</a>
```

### Timeline Row Sub-Template
```html
<div class="timeline-row"><div class="timeline-time">[{TIME}]</div><div class="timeline-template">{ELEMENT}</div><div class="timeline-content">{DESCRIPTION}</div></div>
```
For micro-scan discoveries, add: `style="background:rgba(77,185,164,0.08)"` and `style="color:var(--accent-green)"` on the template div.

### Color Swatch Sub-Template
```html
<div class="swatch"><div class="swatch-circle" style="background:{HEX}"></div><div class="swatch-info"><strong>{NAME}</strong><br><span class="swatch-hex">{HEX}</span> — {USAGE}</div></div>
```

---

## Full HTML Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SixthSense X-Ray | CapCut Playbook — {VIDEO_TITLE}</title>
<style>
:root {
  --bg: #0d0d0d; --surface: #1a1a1a; --surface2: #222; --border: #333;
  --text: #e0e0e0; --text-muted: #888; --accent-green: #4CD964;
  --accent-teal: #4DB8A4; --accent-red: #E52222; --accent-gold: #D4A633;
  --accent-blue: #A8D8EA; --white: #fff;
}
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: 'Segoe UI', system-ui, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }
a { color: var(--accent-teal); text-decoration: none; }
a:hover { text-decoration: underline; }
.sidebar { position: fixed; top: 0; left: 0; width: 260px; height: 100vh; background: var(--surface);
  border-right: 1px solid var(--border); padding: 20px 0; overflow-y: auto; z-index: 100; }
.sidebar h2 { padding: 0 20px 15px; font-size: 14px; color: var(--accent-green); text-transform: uppercase;
  letter-spacing: 2px; border-bottom: 1px solid var(--border); margin-bottom: 10px; }
.sidebar .logo { padding: 0 20px 20px; font-size: 18px; font-weight: 800; color: var(--white); }
.sidebar .logo span { color: var(--accent-green); }
.sidebar a { display: block; padding: 8px 20px; font-size: 13px; color: var(--text-muted); transition: all 0.2s; }
.sidebar a:hover { color: var(--white); background: rgba(77,185,164,0.1); text-decoration: none; border-left: 3px solid var(--accent-teal); }
.sidebar .section-label { padding: 15px 20px 5px; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: var(--accent-gold); }
.main { margin-left: 260px; padding: 40px 50px; max-width: 1000px; }
h1 { font-size: 32px; font-weight: 800; margin-bottom: 5px; }
h1 span { color: var(--accent-green); }
.subtitle { color: var(--text-muted); font-size: 14px; margin-bottom: 30px; }
h2 { font-size: 22px; font-weight: 700; margin: 40px 0 15px; padding-top: 20px; border-top: 1px solid var(--border); }
h3 { font-size: 17px; font-weight: 600; margin: 25px 0 10px; color: var(--accent-teal); }
.template-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; margin: 25px 0; overflow: hidden; }
.template-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 24px;
  background: var(--surface2); cursor: pointer; user-select: none; }
.template-header h3 { margin: 0; color: var(--white); font-size: 16px; }
.template-header .badge { font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: 600; }
.badge-overlay { background: rgba(76,217,100,0.15); color: var(--accent-green); }
.badge-layout { background: rgba(77,184,164,0.15); color: var(--accent-teal); }
.badge-text { background: rgba(229,34,34,0.15); color: var(--accent-red); }
.badge-graphic { background: rgba(212,166,51,0.15); color: var(--accent-gold); }
.template-header .chevron { transition: transform 0.3s; font-size: 18px; color: var(--text-muted); }
.template-header.open .chevron { transform: rotate(180deg); }
.template-body { padding: 24px; display: none; }
.template-body.open { display: block; }
.frame-preview { display: flex; gap: 20px; margin: 15px 0; flex-wrap: wrap; }
.frame-preview img { border-radius: 8px; border: 1px solid var(--border); max-width: 420px; width: 100%; }
.frame-caption { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
.steps { counter-reset: step; margin: 15px 0; }
.steps li { counter-increment: step; list-style: none; padding: 8px 0 8px 40px; position: relative; font-size: 14px; }
.steps li::before { content: counter(step); position: absolute; left: 0; top: 6px; width: 26px; height: 26px;
  background: var(--surface2); border: 1px solid var(--border); border-radius: 50%; text-align: center;
  line-height: 26px; font-size: 12px; font-weight: 700; color: var(--accent-teal); }
.steps code { background: var(--surface2); padding: 2px 6px; border-radius: 4px; font-family: Consolas, monospace; font-size: 13px; color: var(--accent-green); }
.yt-link { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; background: rgba(229,34,34,0.1);
  border: 1px solid rgba(229,34,34,0.2); border-radius: 8px; margin: 5px 4px; font-size: 13px; transition: all 0.2s; }
.yt-link:hover { background: rgba(229,34,34,0.2); text-decoration: none; }
.yt-icon { width: 20px; height: 14px; background: var(--accent-red); border-radius: 3px; display: flex;
  align-items: center; justify-content: center; flex-shrink: 0; }
.yt-icon::after { content: ''; width: 0; height: 0; border-left: 6px solid white; border-top: 4px solid transparent; border-bottom: 4px solid transparent; }
.swatch-grid { display: flex; flex-wrap: wrap; gap: 12px; margin: 15px 0; }
.swatch { display: flex; align-items: center; gap: 10px; padding: 8px 14px; background: var(--surface);
  border: 1px solid var(--border); border-radius: 8px; min-width: 200px; }
.swatch-circle { width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--border); flex-shrink: 0; }
.swatch-info { font-size: 13px; }
.swatch-hex { font-family: Consolas, monospace; font-size: 12px; color: var(--text-muted); }
.timeline { margin: 20px 0; }
.timeline-row { display: flex; gap: 12px; padding: 6px 0; border-bottom: 1px solid rgba(51,51,51,0.5); font-size: 13px; }
.timeline-time { font-family: Consolas, monospace; color: var(--accent-teal); min-width: 80px; flex-shrink: 0; }
.timeline-template { color: var(--accent-gold); min-width: 180px; flex-shrink: 0; }
.timeline-content { color: var(--text); }
table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; }
th { text-align: left; padding: 10px 12px; background: var(--surface2); border: 1px solid var(--border);
  color: var(--accent-teal); font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
td { padding: 10px 12px; border: 1px solid var(--border); }
@media (max-width: 900px) { .sidebar { display: none; } .main { margin-left: 0; padding: 20px; } }
@media print { .sidebar { display: none; } .main { margin-left: 0; } .template-body { display: block !important; } }
</style>
</head>
<body>

<nav class="sidebar">
  <div class="logo">SixthSense <span>X-Ray</span></div>
  <h2>Playbook</h2>
  <a href="#setup">Project Setup</a>
  <a href="#colors">Color Palette</a>
  <a href="#fonts">Font System</a>
  <div class="section-label">Template Changes ({TEMPLATE_COUNT})</div>
  {SIDEBAR_TEMPLATE_LINKS}
  <div class="section-label">Transition Effects ({TRANSITION_COUNT})</div>
  {SIDEBAR_TRANSITION_LINKS}
  <div class="section-label">Reference</div>
  <a href="#timeline">Timeline Map</a>
  <a href="#pacing">Pacing Rules</a>
  <a href="#styleguide">Style Guide</a>
</nav>

<div class="main">

<h1>CapCut Recreation <span>Playbook</span></h1>
<p class="subtitle">{VIDEO_TITLE} &nbsp;|&nbsp; {VIDEO_STATS} &nbsp;|&nbsp; {TEMPLATE_COUNT} templates + {TRANSITION_COUNT} transition effects &nbsp;|&nbsp; {COUNSEL_NAMES}</p>

<h2 id="setup">Project Setup</h2>
<p>Before building any templates, set up your CapCut project and gather assets.</p>
<h3>Project Settings</h3>
<table>
  <tr><th>Setting</th><th>Value</th></tr>
  <tr><td>Resolution</td><td>1920 x 1080 (16:9)</td></tr>
  <tr><td>Frame Rate</td><td>30fps</td></tr>
  <tr><td>Background</td><td>Black (default)</td></tr>
</table>

<h2 id="colors">Color Palette</h2>
<p>Save these as swatches in CapCut. Every color in the video maps to one of these.</p>
<div class="swatch-grid">
{COLOR_SWATCHES}
</div>

<h2 id="fonts">Font System</h2>
<table>
  <tr><th>Role</th><th>Font</th><th>Weight</th><th>Example</th></tr>
  {FONT_TABLE_ROWS}
</table>

<h2>Template Changes</h2>
<p>{TEMPLATE_COUNT} distinct visual layouts/overlays. Build each once as a CapCut preset — reuse on every future video.</p>
{TEMPLATE_CARDS}

<h2>Transition Effects</h2>
<p>{TRANSITION_COUNT} motion patterns — how elements enter, exit, and move between templates.</p>
{TRANSITION_CARDS}

<h2 id="timeline">Timestamped Recreation Map</h2>
<p>Follow this timeline to rebuild the video section by section.</p>
<div class="timeline">
{TIMELINE_ROWS}
</div>

<h2 id="pacing">Pacing Rules</h2>
<h3>Visual Rhythm</h3>
<p style="font-family:Consolas;background:var(--surface);padding:12px 16px;border-radius:8px;font-size:14px;margin:10px 0;">
  SPEAKER (30-60s) → <span style="color:var(--accent-gold)">EMPHASIS CARD</span> (5-15s) → SPEAKER (30-60s) → <span style="color:var(--accent-gold)">EMPHASIS CARD</span> (5-15s)
</p>
<table>
  <tr><th>Section</th><th>Cut Frequency</th><th>Feel</th></tr>
  {PACING_TABLE_ROWS}
</table>

<h2 id="styleguide">Reusable Style Guide</h2>
<h3>Color = Emotion</h3>
<table>
  <tr><th>Color</th><th>Emotion</th><th>When to Use</th></tr>
  {COLOR_EMOTION_ROWS}
</table>
<h3>Authenticity Rules</h3>
<ul style="padding-left:20px;margin:10px 0;font-size:14px;">
{AUTHENTICITY_RULES}
</ul>
<h3>Essential Skill Videos</h3>
<p>Core techniques that apply across all templates:</p>
{ESSENTIAL_VIDEO_LINKS}

<br><br>
<p style="color:var(--text-muted);font-size:12px;border-top:1px solid var(--border);padding-top:15px;">
  Generated by <strong>SixthSense X-Ray</strong> on {GENERATION_DATE} &nbsp;|&nbsp; {COUNSEL_NAMES}
</p>

</div>

<script>
function toggleCard(header) {
  header.classList.toggle('open');
  const body = header.nextElementSibling;
  body.classList.toggle('open');
}
document.querySelectorAll('.template-header').forEach(h => { h.classList.add('open'); h.nextElementSibling.classList.add('open'); });
</script>
</body>
</html>
```
