# Webinar Dev Bot — Design System

*Base CSS, layout types, typography, and component library for HTML presentation builds.*

---

## FONTS (Google Fonts CDN)

```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&family=Source+Sans+3:wght@300;400;600;700&display=swap" rel="stylesheet">
```

### Typography Scale

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| h1 | Playfair Display, serif | 3.4rem | 900 | var(--text-primary) |
| h2 | Playfair Display, serif | 2.8rem | 900 | var(--text-primary) |
| h3 | Playfair Display, serif | 2rem | 700 | var(--text-primary) |
| .subtitle | Playfair Display, italic | 1.8rem | 400 | var(--text-secondary) |
| .body-text | Source Sans 3, sans-serif | 1.6rem | 400 | var(--text-body) |
| .body-large | Playfair Display, italic | 2.2rem | 400 | var(--text-body) |
| .highlight | inherit | inherit | inherit | var(--color-primary) |

---

## CSS CUSTOM PROPERTIES (Client Brandable)

```css
:root {
  /* Brand Colors (override per client) */
  --color-primary: #4A90D9;
  --color-secondary: #c0392b;
  --color-accent: #c9a84c;
  --color-success: #27ae60;

  /* Text */
  --text-primary: #000;
  --text-secondary: #333;
  --text-body: #222;
  --text-muted: #666;
  --text-light: #999;

  /* Backgrounds */
  --bg-white: #fff;
  --bg-light: #f8f9fa;
  --bg-subtle: #f0f4ff;
  --bg-dark: #1a1a2e;

  /* Shadows */
  --shadow-card: 0 3px 12px rgba(0,0,0,0.15);
  --shadow-glossy: 0 4px 15px rgba(0,0,0,0.25);
  --shadow-polaroid: 0 6px 20px rgba(0,0,0,0.25);

  /* Spacing */
  --content-padding: 3rem 4rem;
  --stack-padding: 2rem 5rem;
}
```

---

## LAYOUT TYPES (5 Core)

### layout-split (Image Left 42%, Text Right 58%)
- Most common layout. Used for title, story, credibility, stack slides.
- Image: `width:42%; height:calc(100% - 48px);`
- Content: `width:58%; padding:3rem 4rem;`

### layout-split-reverse (Text Left 55%, Image Right 45%)
- Used when image should be on the right (e.g., "Why Funnels Fail" with meme).
- Content first, image second in DOM order.

### layout-center (No Image, Centered Content)
- Full-width centered content. Max-width 1000px.
- Used for: headlines, Two Paths, Price Reveal, If All I Did Was, Cost of Inaction.

### layout-stack (Full Width, Vertical)
- Full-width content, no image column.
- Used for: Core 6 Beliefs table, Timeline, Stack value tables.

### layout-dark (Dark Background Variant)
- Same as layout-split but with `background:#000; color:#fff`.
- Used sparingly (title slide only, if at all).

---

## COMPONENT PATTERNS

### Accent Line
```css
.accent-line {
  width: 120px; height: 4px;
  background: var(--color-primary);
  margin: 0.8rem 0 1.2rem;
  border-radius: 2px;
}
```

### Bottom Bar (All Slides)
```css
.bottom-bar {
  position: absolute; bottom: 0; left: 0; width: 100%; height: 48px;
  background: linear-gradient(90deg, var(--color-primary) 0%, #6bb3f0 100%);
  display: flex; align-items: center; padding: 0 1.5rem;
}
```

### Pill Badge (Timeline, Beliefs)
```css
/* Dark pill */
background: var(--bg-dark); color: #fff;
min-width: 72px; height: 52px; border-radius: 26px;
box-shadow: var(--shadow-glossy);
font-weight: 900; font-size: 1.4rem;
```

### Glossy Card (Belief Shifts)
```css
/* Red (old belief) */
background: linear-gradient(135deg, #e74c3c, #c0392b);
color: #fff; padding: 0.65rem 1.1rem; border-radius: 10px;
box-shadow: 0 3px 12px rgba(231,76,60,0.3);

/* Blue (new belief) */
background: linear-gradient(135deg, #3498db, #2980b9);
box-shadow: 0 3px 12px rgba(52,152,219,0.3);
```

### Stack Table
```css
.stack-table { width:100%; border-collapse:collapse; }
.stack-table tr { border-bottom: 1px solid #e0e0e0; }
.item-name { font-weight:600; width:70%; padding:0.55rem 0.5rem; }
.item-value { font-weight:700; color:var(--color-primary); text-align:right; width:30%; }
.total-row { border-top:3px solid #000; }
.total-row td { font-size:1.5rem; font-weight:900; }
```

### Price Box
```css
.price-crossed { font-size:2.5rem; color:#999; text-decoration:line-through; }
.price-actual { font-size:3.5rem; font-weight:900; color:#000; }
.price-monthly { font-size:1.5rem; color:var(--color-primary); font-weight:600; }
```

### Two Paths
```css
.path-old { background:#f5f5f5; border:2px solid #ddd; border-radius:12px; }
.path-new { background:linear-gradient(135deg, var(--color-primary), #3a7bc8); color:#fff; border-radius:12px; }
```

### Polaroid Stack (3 Images)
- 3 absolutely positioned divs with `transform:rotate()` and `translate()`
- White padding (8px sides, 25px bottom) = polaroid border
- `box-shadow: var(--shadow-polaroid);`
- Images: `object-fit:cover; object-position:top;`

### 2x2 Image Grid (4 Images)
- CSS Grid: `grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; gap:4px;`
- Images: `width:100%; height:100%; object-fit:cover; border-radius:4px;`

---

## TIMELINE COLOR PROGRESSION (Red → Gold)

For treasure map timeline slides, day badges progress through this gradient:

| Position | Color | Hex |
|----------|-------|-----|
| Start (Day 1) | Red | #c0392b → #a93226 |
| Early | Red-Orange | #d35400 → #c0392b |
| Mid-Early | Orange | #e67e22 → #d35400 |
| Mid | Amber | #f39c12 → #e67e22 |
| Mid-Late | Yellow | #f1c40f → #f39c12 |
| Late | Light Gold | #d4ac0d → #c9a84c |
| Final (Reveal) | Full Gold | #c9a84c → #b8942e |

---

## RESPONSIVE BREAKPOINT

```css
@media (max-width: 1200px) {
  h1 { font-size: 2.6rem; }
  h2 { font-size: 2.2rem; }
  .subtitle { font-size: 1.4rem; }
  .body-text { font-size: 1.3rem; }
}
```

---

## NAVIGATION SCRIPT (Standard)

```javascript
let current = 1;
const total = SLIDE_COUNT;
function showSlide(n) {
  if (n < 1 || n > total) return;
  document.querySelectorAll('.slide').forEach(s => s.classList.remove('active'));
  document.querySelector(`[data-slide="${n}"]`)?.classList.add('active');
  current = n;
}
// Arrow keys, space, click zones, touch swipe, F=fullscreen, Home/End
```
