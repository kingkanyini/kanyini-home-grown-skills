# HTML Playbook Templates

> Reference file for Phase 5: HTML Playbook + Deploy.
> The orchestrator reads this file, resolves all `{VARIABLES}`, and writes the final HTML files.

---

## Variable Resolution Guide

### From Registry (`project-registry.json`)
| Variable | Registry Path |
|----------|--------------|
| `{PROJECT_NAME}` | `project_name` |
| `{PROJECT_SLUG}` | `project_slug` |
| `{RUNTIME}` | `runtime` |
| `{DATE}` | `last_updated` |
| `{ARTGRID_COLLECTION_URL}` | `artgrid.collection_url` (may be empty) |
| `{ARTGRID_STORY_URL}` | `artgrid.story_url` (optional, may be empty) |

### From B-Roll Map (`broll-map-final.md`)
| Variable | How to Generate |
|----------|----------------|
| `{MOMENT_COUNT}` | Count `### BRM-` entries in the final map |
| `{THREAD_COUNT}` | Count unique thread letters across all entries |
| `{MOMENTS_JSON}` | Iterate all BRM entries, build JS array of objects (see Data Shape below) |
| `{THREAD_MAP_JSON}` | Build `{A: ["BRM-005","BRM-028",...], B: [...]}` from thread assignments |

### Generated Conditionally
| Variable | How to Generate |
|----------|----------------|
| `{ARTGRID_LINKS_HTML}` | If `artgrid.collection_url` exists in registry: `<a href="{ARTGRID_COLLECTION_URL}" target="_blank" class="link-btn">Artgrid Collection</a>`. If `artgrid.story_url` also exists: append `<a href="{ARTGRID_STORY_URL}" target="_blank" class="link-btn">Artgrid Story</a>`. If neither exists (Phase 6 not yet complete): set to empty string `""` |
| `{ARTGRID_LINK_HTML}` | For the Master Script page header: if `artgrid.collection_url` exists: `<a href="{ARTGRID_COLLECTION_URL}" target="_blank" class="back-link">Artgrid Collection</a>`. Otherwise: empty string `""` |
| `{COVERAGE_PCT}` | Calculate from production brief data: `(total B-roll duration in seconds / video runtime in seconds) * 100`, formatted as `"~42%"`. If duration data is unavailable, use the recommended target: `"~40-45%"` |

**Re-deploy note:** After Phase 6 completes and Artgrid URLs are available, re-generate the HTML files with `{ARTGRID_LINKS_HTML}` and `{ARTGRID_LINK_HTML}` populated, then re-deploy to Vercel if it was chosen.

### From Production Brief
| Variable | How to Generate |
|----------|----------------|
| `{SIDEBAR_THREAD_LINKS}` | One `<a>` per thread from Thread Visual Continuity section |
| `{SIDEBAR_SOURCE_LINKS}` | One `<a>` per source type with counts |
| `{OVERVIEW_STATS_HTML}` | Dashboard cards from Brief Overview section |
| `{SOURCE_BREAKDOWN_BAR}` | Colored bar segments proportional to source counts |
| `{PRIORITY_SHOOTING_HTML}` | Ordered list from brief priority guidance |
| `{THREAD_SECTIONS_HTML}` | Thread arc descriptions + empty `<div class="thread-cards">` containers |
| `{DIY_SHOOT_HTML}` | Checklist sections from DIY Shoot List |
| `{STYLE_GUIDE_HTML}` | Mood legend, audio handling, visual types, color arc, bookend pairs |

### From SRT Files (for Master Script)
| Variable | How to Generate |
|----------|----------------|
| `{LINE_COUNT}` | Count lines in English SRT |
| `{SCRIPT_ROWS_HTML}` | Read both SRTs, align by timecode, generate `<tr>` rows |

### User-Configurable (interview or defaults)
| Variable | Default |
|----------|---------|
| `{COLOR_BG}` | `#1a1612` |
| `{COLOR_CARD}` | `#2a2420` |
| `{COLOR_CARD_HOVER}` | `#342e28` |
| `{COLOR_TEXT}` | `#f5f0e8` |
| `{COLOR_TEXT_SEC}` | `#b8a99a` |
| `{COLOR_ACCENT_1}` | `#c9a84c` (gold) |
| `{COLOR_ACCENT_2}` | `#7fb5c9` (sky blue) |
| `{COLOR_ACCENT_3}` | `#8b6b4a` (earth brown) |

Orchestrator asks user during Phase 5: "Use default earth tone palette, or customize?" If customize, collect 3 accent colors + bg/card/text.

---

## Moment Data Shape (for `{MOMENTS_JSON}`)

Each BRM entry in the final map gets converted to this JS object:

```json
{
  "id": "BRM-001",
  "tc": "00:00",
  "p": "P1",
  "threads": ["J1"],
  "cat": "emotional",
  "cutInDe": "Was, wenn ganz genau das...",
  "cutInEn": "What if the very thing...",
  "broll": "Slow-mo high-performer in tailored suit...",
  "dur": "5-7s",
  "type": "full",
  "audio": "vo-continues",
  "mood": "dark-dramatic",
  "cutOutDe": "exakt das ist, was...",
  "cutOutEn": "is exactly what...",
  "src": "ART",
  "search": ["businessman walking office corridor slow motion"],
  "aiPrompt": null,
  "continuity": null,
  "cutCandidate": false,
  "note": null
}
```

For monolingual projects (`is_translated = false`), omit `cutInDe`/`cutOutDe` fields and rename `cutInEn`/`cutOutEn` to `cutIn`/`cutOut`. The card template adapts (see Monolingual Card Variant below).

---

## Template 1: B-Roll Playbook

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{PROJECT_NAME} - B-Roll Production Playbook</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
--bg:{COLOR_BG};--card:{COLOR_CARD};--card-hover:{COLOR_CARD_HOVER};
--text:{COLOR_TEXT};--text-sec:{COLOR_TEXT_SEC};
--gold:{COLOR_ACCENT_1};--sky:{COLOR_ACCENT_2};--earth:{COLOR_ACCENT_3};
--dark-dram:#8b4a4a;--bright-asp:#4a8b5e;--cool-clin:#4a6a8b;
--warm-grd:#8b7a4a;--myst-eth:#6a4a8b;
--sidebar-w:240px;--font:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;
--mono:'SF Mono','Fira Code','Consolas',monospace;
}
html{scroll-behavior:smooth}
body{font-family:var(--font);background:var(--bg);color:var(--text);font-size:14px;line-height:1.6;display:flex;min-height:100vh}

/* Sidebar */
.sidebar{position:fixed;top:0;left:0;width:var(--sidebar-w);height:100vh;background:#151210;border-right:1px solid var(--earth);overflow-y:auto;z-index:100;transition:transform .3s}
.sidebar h2{font-size:1em;color:var(--gold);padding:16px 16px 8px;letter-spacing:1px;text-transform:uppercase}
.sidebar a{display:block;padding:6px 16px;color:var(--text-sec);text-decoration:none;font-size:.85em;transition:color .2s,background .2s}
.sidebar a:hover{color:var(--gold);background:rgba(201,168,76,.08)}
.sidebar .sub{padding-left:28px;font-size:.8em}
.sidebar details{margin:0}
.sidebar summary{cursor:pointer;padding:6px 16px;color:var(--text-sec);font-size:.85em;list-style:none}
.sidebar summary::-webkit-details-marker{display:none}
.sidebar summary::before{content:'+ ';color:var(--gold);font-family:var(--mono)}
.sidebar details[open] summary::before{content:'- '}
.hamburger{display:none;position:fixed;top:12px;left:12px;z-index:200;background:var(--card);border:1px solid var(--earth);color:var(--gold);padding:8px 12px;cursor:pointer;font-size:1.2em;border-radius:4px}

/* Main */
.main{margin-left:var(--sidebar-w);flex:1;padding:24px 32px 60px;max-width:1100px}
.main h1{font-size:1.8em;color:var(--gold);margin-bottom:4px}
.main .subtitle{color:var(--text-sec);font-size:.95em;margin-bottom:16px}
.main h2{font-size:1.4em;color:var(--gold);margin:32px 0 12px;padding-bottom:6px;border-bottom:1px solid var(--earth)}
.main h3{font-size:1.1em;color:var(--text);margin:20px 0 8px}
.main p{color:var(--text-sec);margin-bottom:10px}

/* Search & Filters */
.search-bar{position:sticky;top:0;z-index:50;background:var(--bg);padding:12px 0;margin-bottom:16px}
.search-bar input{width:100%;padding:10px 14px;background:var(--card);border:1px solid var(--earth);color:var(--text);border-radius:4px;font-size:.9em;font-family:var(--font)}
.search-bar input::placeholder{color:var(--text-sec)}
.filters{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px}
.filters button{padding:5px 12px;background:var(--card);border:1px solid var(--earth);color:var(--text-sec);cursor:pointer;border-radius:3px;font-size:.8em;font-family:var(--font);transition:all .2s}
.filters button.active,.filters button:hover{border-color:var(--gold);color:var(--gold);background:rgba(201,168,76,.1)}
.filter-group{display:flex;gap:4px;align-items:center;margin-right:12px}
.filter-group label{color:var(--text-sec);font-size:.75em;text-transform:uppercase;letter-spacing:.5px;margin-right:4px}

/* Dashboard */
.dashboard{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:24px}
.dash-card{background:var(--card);border:1px solid var(--earth);border-radius:6px;padding:16px}
.dash-card .num{font-size:1.8em;color:var(--gold);font-weight:700}
.dash-card .lbl{color:var(--text-sec);font-size:.8em;text-transform:uppercase;letter-spacing:.5px}
.source-bar{display:flex;height:24px;border-radius:4px;overflow:hidden;margin:8px 0}
.source-bar div{display:flex;align-items:center;justify-content:center;font-size:.65em;color:#1a1612;font-weight:600}
.link-btn{display:inline-block;padding:6px 14px;background:var(--card);border:1px solid var(--sky);color:var(--sky);border-radius:4px;text-decoration:none;font-size:.85em;margin:4px 4px 4px 0;transition:all .2s}
.link-btn:hover{background:rgba(127,181,201,.15)}

/* Cards */
.broll-card{background:var(--card);border:1px solid var(--earth);border-radius:6px;margin-bottom:10px;transition:background .2s;border-left:3px solid var(--earth)}
.broll-card[data-thread^="A"]{border-left-color:#c9a84c}
.broll-card[data-thread^="B"]{border-left-color:#7fb5c9}
.broll-card[data-thread^="C"]{border-left-color:#8b6b4a}
.broll-card[data-thread^="D"]{border-left-color:#6a4a8b}
.broll-card[data-thread^="E"]{border-left-color:#4a8b5e}
.broll-card[data-thread^="F"]{border-left-color:#8b4a4a}
.broll-card[data-thread^="G"]{border-left-color:#4a6a8b}
.broll-card[data-thread^="H"]{border-left-color:#8b7a4a}
.broll-card[data-thread^="I"]{border-left-color:#c97f4c}
.broll-card[data-thread^="J"]{border-left-color:#c94c4c}
.broll-card[data-thread^="K"]{border-left-color:#4ac9a8}
.broll-card[data-thread^="L"]{border-left-color:#a84cc9}
.card-header{padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.card-header:hover{background:var(--card-hover)}
.tc{font-family:var(--mono);color:var(--gold);font-size:.9em;font-weight:600;min-width:50px}
.badge{display:inline-block;padding:2px 8px;border-radius:3px;font-size:.7em;font-weight:600;text-transform:uppercase}
.badge-p1{background:rgba(201,168,76,.2);color:var(--gold);border:1px solid var(--gold)}
.badge-p2{background:rgba(127,181,201,.15);color:var(--sky);border:1px solid var(--sky)}
.badge-p3{background:rgba(139,107,74,.2);color:var(--earth);border:1px solid var(--earth)}
.thread-tag{display:inline-block;padding:1px 7px;border:1px solid var(--gold);color:var(--gold);border-radius:3px;font-size:.7em;font-weight:500}
.card-desc{color:var(--text);font-size:.85em;flex:1;min-width:200px}
.mood-dot{width:8px;height:8px;border-radius:50%;display:inline-block}
.mood-dark-dramatic{background:var(--dark-dram)}
.mood-bright-aspirational{background:var(--bright-asp)}
.mood-cool-clinical{background:var(--cool-clin)}
.mood-warm-grounded{background:var(--warm-grd)}
.mood-mystical-ethereal{background:var(--myst-eth)}
.source-tag{font-size:.7em;padding:2px 6px;border-radius:3px;background:rgba(127,181,201,.1);color:var(--sky);border:1px solid rgba(127,181,201,.3)}
.card-body{display:none;padding:0 14px 14px;border-top:1px solid rgba(139,107,74,.3)}
.card-body.open{display:block}
.field-row{display:grid;grid-template-columns:100px 1fr;gap:8px;padding:5px 0;border-bottom:1px solid rgba(139,107,74,.15);font-size:.85em}
.field-label{color:var(--text-sec);font-weight:600;text-transform:uppercase;font-size:.75em;letter-spacing:.3px}
.field-val{color:var(--text)}
.field-val.de{color:var(--text);font-style:italic}
.field-val.en{color:var(--text-sec)}
.code-block{background:#1a1612;border:1px solid var(--earth);border-radius:4px;padding:10px;font-family:var(--mono);font-size:.8em;color:var(--text-sec);margin:6px 0;position:relative;white-space:pre-wrap;word-break:break-word}
.copy-btn{position:absolute;top:4px;right:4px;background:var(--card);border:1px solid var(--earth);color:var(--text-sec);padding:3px 8px;cursor:pointer;font-size:.7em;border-radius:3px;font-family:var(--font)}
.copy-btn:hover{border-color:var(--gold);color:var(--gold)}
.continuity-note{background:rgba(201,168,76,.08);border-left:3px solid var(--gold);padding:8px 12px;margin:6px 0;font-size:.82em;color:var(--gold)}
.cut-candidate{background:rgba(139,75,75,.15);border-left:3px solid var(--dark-dram);padding:6px 10px;margin:4px 0;font-size:.8em;color:#c97a7a}
.meta-row{display:flex;gap:12px;flex-wrap:wrap;padding:6px 0;font-size:.82em;align-items:center}
.meta-row span{color:var(--text-sec)}

/* Thread section */
.thread-arc{background:rgba(201,168,76,.05);border:1px solid rgba(201,168,76,.15);border-radius:6px;padding:12px 16px;margin-bottom:16px;font-size:.85em}
.thread-arc strong{color:var(--gold)}

/* Style guide */
.mood-legend{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px}
.mood-item{display:flex;align-items:center;gap:8px;font-size:.85em;color:var(--text-sec)}

/* Checklist */
.checklist label{display:flex;align-items:flex-start;gap:8px;padding:6px 0;font-size:.85em;color:var(--text-sec);cursor:pointer;border-bottom:1px solid rgba(139,107,74,.1)}
.checklist input[type=checkbox]{accent-color:var(--gold);margin-top:3px}
.checklist input:checked+span{text-decoration:line-through;opacity:.5}

/* Script table (embedded in same page if needed) */
.script-table td.script-ts{padding:6px 8px;color:var(--gold);font-family:var(--mono);font-size:.85em;white-space:nowrap;vertical-align:top;border-bottom:1px solid rgba(139,107,74,.3)}
.script-table td.script-de{padding:6px 8px;color:var(--text);line-height:1.5;vertical-align:top;border-bottom:1px solid rgba(139,107,74,.3);border-right:1px solid rgba(139,107,74,.2)}
.script-table td.script-en{padding:6px 8px;color:var(--sky);line-height:1.5;vertical-align:top;border-bottom:1px solid rgba(139,107,74,.3)}
.script-table tr:hover td{background:rgba(201,168,76,.05)}

/* Print */
@media print{
.sidebar,.hamburger,.search-bar,.filters,.copy-btn{display:none!important}
.main{margin-left:0;padding:10px;max-width:100%}
.card-body{display:block!important}
.broll-card{break-inside:avoid;border:1px solid #ccc;margin-bottom:8px}
body{background:#fff;color:#111}
.main h1,.main h2,.tc,.badge{color:#111}
.dash-card{border:1px solid #ccc}
}

/* Mobile */
@media(max-width:768px){
.sidebar{transform:translateX(-100%)}
.sidebar.open{transform:translateX(0)}
.hamburger{display:block}
.main{margin-left:0;padding:16px}
.dashboard{grid-template-columns:1fr 1fr}
.card-header{flex-direction:column;align-items:flex-start;gap:6px}
}
</style>
</head>
<body>

<button class="hamburger" onclick="document.querySelector('.sidebar').classList.toggle('open')" aria-label="Menu">&#9776;</button>

<!-- SIDEBAR: Orchestrator generates from thread list + source counts -->
<nav class="sidebar">
<h2>Playbook</h2>
<a href="#overview">Overview</a>
<a href="#timeline">Master Timeline</a>
<a href="#master-script">Master Script</a>
<details open>
<summary>Threads ({THREAD_COUNT})</summary>
{SIDEBAR_THREAD_LINKS}
<!-- Each thread link: <a href="#thread-{LETTER}" class="sub">{LETTER} - {THREAD_NAME}</a> -->
</details>
<a href="#standalone">Standalone Moments</a>
<details>
<summary>By Source</summary>
{SIDEBAR_SOURCE_LINKS}
<!-- Each source link: <a href="#src-{CODE}" class="sub">{SOURCE_NAME} ({COUNT})</a> -->
</details>
<a href="#artgrid-terms">Artgrid Search Terms</a>
<a href="#ai-prompts">AI-Gen Prompts</a>
<a href="#diy-shoot">DIY Shoot List</a>
<a href="#style-guide">Style Guide</a>
</nav>

<div class="main">

<h1>{PROJECT_NAME} -- B-Roll Production Playbook</h1>
<p class="subtitle">{MOMENT_COUNT} Moments &middot; {THREAD_COUNT} Visual Threads &middot; {RUNTIME} Runtime &middot; Updated {DATE}</p>
<p>
<!-- Only render Artgrid links if URLs exist in registry -->
{ARTGRID_LINKS_HTML}
</p>

<!-- SEARCH -->
<div class="search-bar">
<input type="text" id="searchInput" placeholder="Search moments: text, thread, category, source, BRM ID..." oninput="filterCards()">
</div>

<!-- FILTERS: Orchestrator generates source filter buttons from source types in the data -->
<div class="filters">
<div class="filter-group">
<label>Priority</label>
<button class="active" data-filter="priority" data-val="all" onclick="setFilter(this)">All</button>
<button data-filter="priority" data-val="P1" onclick="setFilter(this)">P1 Only</button>
<button data-filter="priority" data-val="P2+" onclick="setFilter(this)">P2+</button>
</div>
<div class="filter-group">
<label>Source</label>
<button class="active" data-filter="source" data-val="all" onclick="setFilter(this)">All</button>
{SOURCE_FILTER_BUTTONS}
<!-- Each: <button data-filter="source" data-val="{SRC_CODE}" onclick="setFilter(this)">{SRC_LABEL}</button> -->
</div>
<div class="filter-group">
<label>View</label>
<button onclick="expandAll()">Expand All</button>
<button onclick="collapseAll()">Collapse All</button>
</div>
</div>

<!-- OVERVIEW -->
<section id="overview">
<h2>Overview Dashboard</h2>
{OVERVIEW_STATS_HTML}
<!--
Orchestrator generates dashboard cards:
<div class="dashboard">
  <div class="dash-card"><div class="num">{MOMENT_COUNT}</div><div class="lbl">Total B-Roll Moments</div></div>
  <div class="dash-card"><div class="num" style="color:var(--gold)">{P1_COUNT}</div><div class="lbl">P1 Must Have</div></div>
  <div class="dash-card"><div class="num" style="color:var(--sky)">{P2_COUNT}</div><div class="lbl">P2 Should Have</div></div>
  <div class="dash-card"><div class="num" style="color:var(--earth)">{P3_COUNT}</div><div class="lbl">P3 Nice to Have</div></div>
  <div class="dash-card"><div class="num">{RUNTIME}</div><div class="lbl">Runtime</div></div>
  <div class="dash-card"><div class="num">{COVERAGE_PCT}</div><div class="lbl">Target B-Roll Coverage</div></div>
</div>
-->

<h3>Source Breakdown</h3>
{SOURCE_BREAKDOWN_BAR}
<!--
Orchestrator generates:
<div class="source-bar">
  <div style="width:{PCT}%;background:var(--sky)" title="{LABEL}: {COUNT}">{CODE} {COUNT}</div>
  ...
</div>
<p style="font-size:.8em;color:var(--text-sec)">{SOURCE_SUMMARY_TEXT}</p>
-->

<h3>Priority Shooting Order (Budget Limited)</h3>
{PRIORITY_SHOOTING_HTML}
<!-- Orchestrator generates <ol> from production brief priority guidance -->
</section>

<!-- MASTER TIMELINE -->
<section id="timeline">
<h2>Master Timeline</h2>
<p>All {MOMENT_COUNT} moments in chronological order. Click any card to expand full details.</p>
<div id="timelineCards"></div>
</section>

<!-- MASTER SCRIPT LINK -->
<section id="master-script" style="margin-bottom:24px">
<h2>Master Script</h2>
<p style="margin-bottom:12px">Full script on a separate page. Open alongside this playbook so you can read the script while browsing B-roll cards.</p>
<a href="{MASTER_SCRIPT_FILENAME}" target="_blank" style="display:inline-block;padding:12px 24px;background:var(--gold);color:#1a1612;text-decoration:none;border-radius:4px;font-weight:bold;font-size:.95em;transition:opacity .2s">Open Master Script in New Tab &rarr;</a>
</section>

<!-- THREAD SECTIONS -->
<section id="threads">
<h2>Visual Threads</h2>
{THREAD_SECTIONS_HTML}
<!--
Orchestrator generates per thread:
<div id="thread-{LETTER}">
  <h3>Thread {LETTER}: {THREAD_NAME} ({MOMENT_COUNT_IN_THREAD} moments)</h3>
  <div class="thread-arc"><strong>Arc:</strong> {ARC_DESCRIPTION}<br><strong>Continuity:</strong> {CONTINUITY_NOTES}</div>
  <div class="thread-cards" data-thread="{LETTER}"></div>
</div>
-->
</section>

<!-- STANDALONE -->
<section id="standalone">
<h2>Standalone Moments (No Thread)</h2>
<p>Moments not assigned to any visual thread, organized by priority.</p>
<div id="standaloneCards"></div>
</section>

<!-- ARTGRID SEARCH TERMS -->
<section id="artgrid-terms">
<h2>Artgrid Search Terms Reference</h2>
<p>All stock footage search queries. Click any term to search Artgrid directly.</p>
<div id="artgridTerms"></div>
</section>

<!-- AI PROMPTS -->
<section id="ai-prompts">
<h2>AI-Gen Prompts (Runway Gen-3)</h2>
<p>All AI video generation prompts. Click "Copy" to grab the full prompt.</p>
<div id="aiPrompts"></div>
</section>

<!-- DIY SHOOT LIST -->
<section id="diy-shoot">
<h2>DIY Shoot List</h2>
{DIY_SHOOT_HTML}
<!-- Orchestrator generates from production brief Section 6 -->
</section>

<!-- STYLE GUIDE -->
<section id="style-guide">
<h2>Style Guide</h2>
{STYLE_GUIDE_HTML}
<!-- Orchestrator generates mood legend, audio handling, visual types, color arc, bookend pairs -->
</section>

</div><!-- /main -->

<script>
// ===== DATA (Orchestrator injects) =====
const moments = {MOMENTS_JSON};
const threadMap = {THREAD_MAP_JSON};

// ===== RENDERING ENGINE (static, no changes needed) =====
const activeFilters = {priority:'all', source:'all'};

function esc(s){
  if(!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/`/g,'&#96;');
}

function renderCard(m, context){
  const pClass = m.p==='P1'?'badge-p1':m.p==='P2'?'badge-p2':'badge-p3';
  const threadTags = m.threads.map(t=>`<span class="thread-tag">${t}</span>`).join('');
  const threadAttr = m.threads.length ? m.threads[0].replace(/[0-9]/g,'') : '';
  const srcNorm = (m.src||'').replace(/[^A-Za-z]/g,'');

  let searchHtml='';
  if(m.search && m.search.length){
    searchHtml='<div class="field-row"><div class="field-label">Search</div><div class="field-val">';
    m.search.forEach(q=>{
      const url='https://artgrid.io/?search='+encodeURIComponent(q);
      searchHtml+=`<div class="code-block" style="display:inline-block;margin:2px 4px 2px 0"><button class="copy-btn" onclick="copyText(this,\`${esc(q)}\`)">Copy</button><a href="${url}" target="_blank" style="color:var(--sky);text-decoration:none">${esc(q)}</a></div>`;
    });
    searchHtml+='</div></div>';
  }

  let aiHtml='';
  if(m.aiPrompt){
    aiHtml=`<div class="field-row"><div class="field-label">AI Prompt</div><div class="field-val"><div class="code-block"><button class="copy-btn" onclick="copyText(this,this.parentElement.querySelector('.prompt-text').textContent)">Copy</button><span class="prompt-text">${esc(m.aiPrompt)}</span></div></div></div>`;
  }

  let contHtml='';
  if(m.continuity){
    contHtml=`<div class="continuity-note">${esc(m.continuity)}</div>`;
  }

  let cutHtml='';
  if(m.cutCandidate){
    cutHtml='<div class="cut-candidate">CUT CANDIDATE -- consider lower-third or merge</div>';
  }

  let noteHtml='';
  if(m.note){
    noteHtml=`<div class="continuity-note" style="border-left-color:var(--sky);color:var(--sky)">${esc(m.note)}</div>`;
  }

  // Bilingual vs monolingual card body
  const cutInFields = m.cutInDe
    ? `<div class="field-row"><div class="field-label">CUT IN (DE)</div><div class="field-val de">"${esc(m.cutInDe)}"</div></div>
       <div class="field-row"><div class="field-label">CUT IN (EN)</div><div class="field-val en">"${esc(m.cutInEn)}"</div></div>`
    : `<div class="field-row"><div class="field-label">CUT IN</div><div class="field-val">"${esc(m.cutIn||m.cutInEn)}"</div></div>`;

  const cutOutFields = m.cutOutDe
    ? `<div class="field-row"><div class="field-label">CUT OUT (DE)</div><div class="field-val de">"${esc(m.cutOutDe)}"</div></div>
       <div class="field-row"><div class="field-label">CUT OUT (EN)</div><div class="field-val en">"${esc(m.cutOutEn)}"</div></div>`
    : `<div class="field-row"><div class="field-label">CUT OUT</div><div class="field-val">"${esc(m.cutOut||m.cutOutEn)}"</div></div>`;

  return `<div class="broll-card" data-id="${m.id}" data-priority="${m.p}" data-source="${srcNorm}" data-cat="${m.cat}" data-thread="${threadAttr}" data-search="${esc((m.cutInDe||m.cutIn||'')+' '+(m.cutInEn||'')+' '+(m.broll||'')+' '+m.id+' '+m.threads.join(' ')+' '+m.cat+' '+m.src)}">
<div class="card-header" onclick="this.nextElementSibling.classList.toggle('open')">
<span class="tc">${esc(m.tc)}</span>
<span class="badge ${pClass}">${m.p}</span>
${threadTags}
<span class="mood-dot mood-${m.mood}" title="${m.mood}"></span>
<span class="source-tag">${esc(m.src)}</span>
<span class="badge" style="background:rgba(139,107,74,.15);color:var(--text-sec);border:1px solid rgba(139,107,74,.3);font-size:.65em">${m.type}</span>
<span class="card-desc">${esc(m.id)}: ${esc(m.broll).substring(0,120)}${m.broll.length>120?'...':''}</span>
</div>
<div class="card-body">
${cutHtml}
${contHtml}
${noteHtml}
${cutInFields}
<div class="field-row"><div class="field-label">B-Roll</div><div class="field-val">${esc(m.broll)}</div></div>
${cutOutFields}
<div class="meta-row">
<span><strong>Duration:</strong> ${m.dur}</span>
<span><strong>Type:</strong> ${m.type}</span>
<span><strong>Audio:</strong> ${m.audio||'vo-continues'}</span>
<span><strong>Mood:</strong> <span class="mood-dot mood-${m.mood}"></span> ${m.mood}</span>
<span><strong>Source:</strong> ${esc(m.src)}</span>
<span><strong>Category:</strong> ${m.cat}</span>
</div>
${searchHtml}
${aiHtml}
</div>
</div>`;
}

function renderAll(){
  // Timeline
  document.getElementById('timelineCards').innerHTML = moments.map(m=>renderCard(m,'timeline')).join('');

  // Threads
  Object.keys(threadMap).forEach(t=>{
    const container = document.querySelector(`.thread-cards[data-thread="${t}"]`);
    if(container){
      const ids = threadMap[t];
      container.innerHTML = ids.map(id=>{
        const m = moments.find(x=>x.id===id);
        return m ? renderCard(m,'thread') : '';
      }).join('');
    }
  });

  // Standalone
  const threadedIds = new Set();
  Object.values(threadMap).forEach(arr=>arr.forEach(id=>threadedIds.add(id)));
  const standalone = moments.filter(m=>!threadedIds.has(m.id));
  document.getElementById('standaloneCards').innerHTML = standalone.map(m=>renderCard(m,'standalone')).join('');

  // Artgrid terms
  const artgridMoments = moments.filter(m=>m.search && m.search.length);
  let artHtml='';
  artgridMoments.forEach(m=>{
    artHtml+=`<h3 style="font-size:.95em;margin-top:16px">${m.id} | ${m.tc} | ${m.threads.join(', ')||'No thread'}</h3>`;
    m.search.forEach(q=>{
      const url='https://artgrid.io/?search='+encodeURIComponent(q);
      artHtml+=`<div class="code-block" style="display:inline-block;margin:2px 4px 2px 0"><button class="copy-btn" onclick="copyText(this,\`${esc(q)}\`)">Copy</button><a href="${url}" target="_blank" style="color:var(--sky);text-decoration:none">${esc(q)}</a></div>`;
    });
  });
  document.getElementById('artgridTerms').innerHTML=artHtml;

  // AI Prompts
  const aiMoments = moments.filter(m=>m.aiPrompt);
  let promptHtml='';
  aiMoments.forEach(m=>{
    promptHtml+=`<h3 style="font-size:.95em;margin-top:16px">${m.id} | ${m.tc} | ${m.broll.substring(0,60)}...</h3>`;
    promptHtml+=`<div class="code-block"><button class="copy-btn" onclick="copyText(this,this.parentElement.querySelector('.prompt-text').textContent)">Copy</button><span class="prompt-text">${esc(m.aiPrompt)}</span></div>`;
  });
  document.getElementById('aiPrompts').innerHTML=promptHtml;
}

function setFilter(btn){
  const group = btn.dataset.filter;
  const val = btn.dataset.val;
  activeFilters[group]=val;
  btn.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  filterCards();
}

function filterCards(){
  const query = document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('.broll-card').forEach(card=>{
    let show = true;
    const p = activeFilters.priority;
    if(p==='P1' && card.dataset.priority!=='P1') show=false;
    if(p==='P2+' && card.dataset.priority==='P3') show=false;
    const s = activeFilters.source;
    if(s!=='all' && !card.dataset.source.includes(s)) show=false;
    if(query && !card.dataset.search.toLowerCase().includes(query)) show=false;
    card.style.display = show ? '' : 'none';
  });
}

function expandAll(){document.querySelectorAll('.card-body').forEach(b=>b.classList.add('open'));}
function collapseAll(){document.querySelectorAll('.card-body').forEach(b=>b.classList.remove('open'));}

function copyText(btn,text){
  navigator.clipboard.writeText(text).then(()=>{
    btn.textContent='Copied!';
    setTimeout(()=>btn.textContent='Copy',1500);
  }).catch(()=>{
    const ta=document.createElement('textarea');
    ta.value=text;document.body.appendChild(ta);ta.select();
    document.execCommand('copy');document.body.removeChild(ta);
    btn.textContent='Copied!';
    setTimeout(()=>btn.textContent='Copy',1500);
  });
}

// Close sidebar on mobile link click
document.querySelectorAll('.sidebar a').forEach(a=>{
  a.addEventListener('click',()=>{
    if(window.innerWidth<=768) document.querySelector('.sidebar').classList.remove('open');
  });
});

renderAll();
</script>
</body>
</html>
```

---

## Template 2: Master Script Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{PROJECT_NAME} - Master Script</title>
<style>
:root{
--bg:{COLOR_BG};--card:{COLOR_CARD};--text:{COLOR_TEXT};--text-sec:{COLOR_TEXT_SEC};
--gold:{COLOR_ACCENT_1};--sky:{COLOR_ACCENT_2};--earth:{COLOR_ACCENT_3};
--font:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;
--mono:'SF Mono','Fira Code','Consolas',monospace;
}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--font);background:var(--bg);color:var(--text);font-size:14px;line-height:1.6;padding:0}

.header{background:#151210;border-bottom:1px solid var(--earth);padding:20px 32px;position:sticky;top:0;z-index:100}
.header h1{font-size:1.5em;color:var(--gold);margin-bottom:4px}
.header .subtitle{color:var(--text-sec);font-size:.9em;margin-bottom:12px}
.header .back-link{display:inline-block;padding:8px 16px;background:var(--card);border:1px solid var(--earth);color:var(--gold);text-decoration:none;border-radius:4px;font-size:.85em;transition:all .2s;margin-right:12px}
.header .back-link:hover{border-color:var(--gold);background:rgba(201,168,76,.1)}
.header input{width:100%;max-width:600px;padding:8px 14px;background:var(--card);border:1px solid var(--earth);color:var(--text);border-radius:4px;font-size:.9em;margin-top:12px}
.header input::placeholder{color:var(--text-sec)}

.content{max-width:1200px;margin:0 auto;padding:24px 32px 60px}

table{width:100%;border-collapse:collapse}
thead{position:sticky;top:130px;z-index:50}
th{padding:10px 8px;text-align:left;border-bottom:2px solid var(--gold);background:var(--bg);font-size:.85em}
th:nth-child(1){color:var(--gold);width:60px;font-family:var(--mono)}
th:nth-child(2){color:var(--gold);width:45%}
th:nth-child(3){color:var(--sky);width:45%}

td{padding:8px;vertical-align:top;border-bottom:1px solid rgba(139,107,74,.25)}
td:nth-child(1){color:var(--gold);font-family:var(--mono);font-size:.85em;white-space:nowrap}
td:nth-child(2){color:var(--text);line-height:1.6;border-right:1px solid rgba(139,107,74,.15)}
td:nth-child(3){color:var(--sky);line-height:1.6}

tr:hover td{background:rgba(201,168,76,.04)}
tr.minute-mark td{border-top:2px solid rgba(201,168,76,.3)}

@media print{
body{background:#fff;color:#000}
.header{position:static;background:#fff;border-bottom:2px solid #000}
.header h1{color:#000}
.header .back-link,.header input{display:none}
th{background:#fff;color:#000;border-bottom:2px solid #000}
td:nth-child(1){color:#666}
td:nth-child(2){color:#000}
td:nth-child(3){color:#333}
td{border-bottom:1px solid #ccc}
}

@media(max-width:768px){
.content{padding:16px}
td,th{font-size:.8em;padding:6px 4px}
}
</style>
</head>
<body>

<div class="header">
<h1>{PROJECT_NAME} &mdash; Master Script</h1>
<p class="subtitle">{LINE_COUNT} lines &middot; {LANG_LABEL} &middot; {RUNTIME} Runtime</p>
<a href="{PLAYBOOK_FILENAME}" class="back-link">&larr; Back to B-Roll Playbook</a>
{ARTGRID_LINK_HTML}
<!-- If collection URL exists: <a href="{ARTGRID_COLLECTION_URL}" target="_blank" class="back-link">Artgrid Collection</a> -->
<br>
<input type="text" id="search" placeholder="Search script text..." onkeyup="filterScript()">
</div>

<div class="content">
<table>
<thead>
<tr>
<th>Time</th>
{TABLE_HEADERS}
<!--
Bilingual: <th>{SOURCE_LANG_NAME} (Original)</th><th>English (Translation)</th>
Monolingual: <th>Script</th>
-->
</tr>
</thead>
<tbody id="script-body">
{SCRIPT_ROWS_HTML}
<!--
Bilingual rows:
<tr><td class="script-ts">{TIMECODE}</td><td class="script-de">{SOURCE_TEXT}</td><td class="script-en">{ENGLISH_TEXT}</td></tr>

Monolingual rows:
<tr><td class="script-ts">{TIMECODE}</td><td>{SCRIPT_TEXT}</td></tr>

Add class="minute-mark" to first row of each new minute.
-->
</tbody>
</table>
</div>

<script>
function filterScript(){
  const q=document.getElementById('search').value.toLowerCase();
  const rows=document.querySelectorAll('#script-body tr');
  rows.forEach(r=>{
    const text=r.textContent.toLowerCase();
    r.style.display=text.includes(q)?'':'none';
  });
}
</script>
</body>
</html>
```

---

## Monolingual Adaptation Notes

When `is_translated = false` in the registry:

1. **Playbook cards:** Use `cutIn`/`cutOut` instead of `cutInDe`/`cutInEn`. The JS rendering engine handles this automatically (see the ternary in `renderCard`).
2. **Master Script page:** Single column instead of two. `{TABLE_HEADERS}` becomes `<th>Script</th>`. Rows have only two `<td>` cells.
3. **Sidebar/labels:** No "(DE)" or "(EN)" labels. Just "CUT IN" / "CUT OUT".

---

## Orchestrator Generation Steps

The orchestrator performs these steps to build the final HTML files:

### Step 1: Read data sources
- Read `project-registry.json` for project metadata
- Read `broll-map-final.md` and parse all BRM entries
- Read `{PROJECT_SLUG}_PRODUCTION_BRIEF.md` for thread arcs, DIY shoot list, style guide
- Read both SRT files for Master Script page

### Step 2: Build moments array
- For each BRM entry in the final map, create a JS object matching the Data Shape above
- Serialize as JSON and inject into `{MOMENTS_JSON}`

### Step 3: Build thread map
- For each thread, collect the BRM IDs assigned to it
- Serialize as JSON object: `{"A":["BRM-005","BRM-028",...], "B":[...]}`
- Inject into `{THREAD_MAP_JSON}`

### Step 4: Generate HTML sections
- Count P1/P2/P3 moments for dashboard cards
- Count moments per source type for source bar
- Generate thread sections HTML from thread arcs in the brief
- Generate DIY shoot HTML from the brief
- Generate style guide HTML from the brief
- Generate sidebar links from thread names and source counts

### Step 5: Generate Master Script rows
- Read English SRT, parse timecodes and text
- If bilingual: read source language SRT, align by timecode
- Generate `<tr>` rows, adding `class="minute-mark"` at minute boundaries

### Step 6: Resolve template
- Read this template file
- Replace all `{VARIABLES}` with generated content
- Write to `{output_dir}/{PROJECT_SLUG}_BROLL_PLAYBOOK.html`
- Write to `{output_dir}/{PROJECT_SLUG}_MASTER_SCRIPT.html`
