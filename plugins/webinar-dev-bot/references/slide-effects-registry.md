# Slide Effects Registry — Webinar Dev Bot

Quick-reference catalog of reusable UX effects for HTML webinar presentations. Reference by **code name** when building slides. Everything you need is in this file.

---

## Active Effects

| Code Name | Effect | Best For | Notes |
|-----------|--------|----------|--------------------|
| **CASCADE-REVEAL** | Split dense slide into N progressive slides with accumulating content | Promise stacks, phase reveals, any slide with 4+ items | `patterns/cascade-slide-progression.md` |
| **SLIDE-IN-FROM-EDGE** | Images slide in from top/left/right/bottom on slide activation, staggered | Peer showcases, credential reveals, visual drama | `patterns/slide-keyframes-vs-transitions.md` |
| **PROGRESS-DOTS** | Dot indicators at top of slide (●●○○) showing position in cascade | Pair with CASCADE-REVEAL | `patterns/cascade-slide-progression.md` |
| **MEDALLION-BADGE** | Small circular image (80-120px) with colored border + shadow | Signature credentials, edge markers | See snippets below |
| **HEADER-PIN** | Prevent title drift during CASCADE-REVEAL by pinning slide-content to top | CRITICAL for cascade sequences | See snippets below |
| **BRIDGE-SLIDE** | Short centered slide with question/statement, no answer — builds suspense | Between major sections, before key reveals | See snippets below |

Snippets and usage for each effect are below.

---

## Copy-Paste Snippets

### CASCADE-REVEAL + PROGRESS-DOTS + HEADER-PIN

Single slide in the cascade (duplicate N times, adjust items + dot states):

```html
<div class="slide layout-center" data-slide="N">
  <div class="slide-content" style="justify-content:flex-start; padding-top:3.5rem;">
    <h2>Your Slide Title</h2>
    <div class="accent-line"></div>

    <!-- Progress dots (fill N of total with brand color, rest gray) -->
    <div style="display:flex; justify-content:center; gap:0.5rem; margin:0.8rem 0 1rem;">
      <div style="width:12px; height:12px; border-radius:50%; background:#4A90D9;"></div>
      <div style="width:12px; height:12px; border-radius:50%; background:#d0d0d0;"></div>
      <div style="width:12px; height:12px; border-radius:50%; background:#d0d0d0;"></div>
      <div style="width:12px; height:12px; border-radius:50%; background:#d0d0d0;"></div>
    </div>

    <!-- Grid of items (accumulates across cascade slides) -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.8rem; margin-top:0.5rem; max-width:850px; text-align:left;">
      <!-- item cards here -->
    </div>
  </div>
  <div class="bottom-bar">
    <div class="logo-space">[ LOGO ]</div>
    <span class="slide-counter">N / TOTAL</span>
  </div>
</div>
```

Key rules:
- Same `<h2>` title on all N slides.
- `justify-content:flex-start; padding-top:3.5rem;` anchors the title (prevents drift as grid grows).
- Progress dots: one slot per slide in the cascade, fill with `#4A90D9` for active/past, `#d0d0d0` for future.
- Kicker/closing line only on the FINAL slide.

### SLIDE-IN-FROM-EDGE

Add to main `<style>` block (once per deck):

```css
@keyframes slideFromTop {
  from { transform: translateY(-120vh); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes slideFromLeft {
  from { transform: translateX(-120vw); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes slideFromRight {
  from { transform: translateX(120vw); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes slideFromBottom {
  from { transform: translateY(120vh); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.slide-in {
  opacity: 0;
  will-change: transform, opacity;
}
.slide.active .slide-in.from-top    { animation: slideFromTop    0.9s cubic-bezier(0.22, 1, 0.36, 1) both; }
.slide.active .slide-in.from-left   { animation: slideFromLeft   0.9s cubic-bezier(0.22, 1, 0.36, 1) both; }
.slide.active .slide-in.from-right  { animation: slideFromRight  0.9s cubic-bezier(0.22, 1, 0.36, 1) both; }
.slide.active .slide-in.from-bottom { animation: slideFromBottom 0.9s cubic-bezier(0.22, 1, 0.36, 1) both; }

.slide.active .slide-in.delay-0 { animation-delay: 0.15s; }
.slide.active .slide-in.delay-1 { animation-delay: 0.30s; }
.slide.active .slide-in.delay-2 { animation-delay: 0.45s; }
.slide.active .slide-in.delay-3 { animation-delay: 0.60s; }
```

Apply to any element:

```html
<img src="..." class="slide-in from-top delay-0">
<img src="..." class="slide-in from-left delay-2">
```

**CRITICAL:** Use `animation` not `transition`. Transitions don't fire when elements go `display:none → display:flex`. See `patterns/slide-keyframes-vs-transitions.md` for why.

### MEDALLION-BADGE

```html
<img src="images/your-medallion.png" alt="..." style="
  width:90px;
  height:90px;
  border-radius:50%;
  object-fit:cover;
  display:block;
  margin:1.4rem auto 0;
  box-shadow:0 4px 16px rgba(201,168,76,0.3);
  border:3px solid #c9a84c;">
```

Scale up to 300px for hero-sized medallions on dedicated slides.

### BRIDGE-SLIDE

```html
<div class="slide layout-center" data-slide="N">
  <div class="slide-content">
    <h2>Your Bridge Question?</h2>
    <div class="accent-line"></div>
    <p style="font-family:'Playfair Display',serif; font-style:italic; font-size:1.9rem; color:#222; margin-top:1.8rem; max-width:900px; line-height:1.45;">"First question you're asking?"</p>
    <p style="font-family:'Playfair Display',serif; font-style:italic; font-size:1.9rem; color:#222; margin-top:1rem; max-width:900px; line-height:1.45;">"Second question that builds tension?"</p>
    <!-- NO ANSWER — next slide reveals it -->
  </div>
  <div class="bottom-bar">
    <div class="logo-space">[ LOGO ]</div>
    <span class="slide-counter">N / TOTAL</span>
  </div>
</div>
```

Rule of thumb: bridge slides END on the question, never the answer. Audience clicks forward hungry for the payoff.

---

## Usage Guide

### During Phase 3 (HTML Build)

When building or refining a webinar deck, check if the user's ask matches a registered effect:

- **"Can we do a cascading reveal?"** → CASCADE-REVEAL + PROGRESS-DOTS + HEADER-PIN
- **"Slide them in from the top/left/right"** → SLIDE-IN-FROM-EDGE
- **"Add a bridge slide"** → BRIDGE-SLIDE
- **"Put a badge/seal next to the text"** → MEDALLION-BADGE

Use code names in responses: *"I'll apply CASCADE-REVEAL with 4 progressive slides..."* — this helps the presenter recognize the pattern on return visits.

### Renumbering After Inserts

Any time you insert a new slide (cascade split, bridge, etc.):
1. Bump `data-slide="N"` attributes **in reverse order** (highest → lowest) to avoid collisions.
2. Bump `slide-counter` numerators the same way.
3. Update `const total = N` in the navigation JS.
4. Global replace `/ OLD` → `/ NEW` for denominators.

### Extending This Registry

New effects discovered during builds:
1. Add a row to the Active Effects table + a copy-paste snippet below.
2. Describe it generically: no client, project or person names.
3. Tell the user the new code name so they can ask for it later.
