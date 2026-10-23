# Slide Templates — HTML Snippets

*Each template is a reusable HTML pattern. During Phase 3 (Build), the skill selects the appropriate template per slide and injects content.*

---

## T01: Title/Hero (layout-split)

```html
<div class="slide layout-split" data-slide="{N}">
  <div class="slide-image">
    {IMAGE_OR_PLACEHOLDER}
  </div>
  <div class="slide-content">
    <h1>"{HEADLINE}"</h1>
    <div class="accent-line"></div>
    <p class="subtitle">{SUBTITLE}</p>
  </div>
  {BOTTOM_BAR}
</div>
```

## T02: Split Image-Text (layout-split)

```html
<div class="slide layout-split" data-slide="{N}">
  <div class="slide-image">{IMAGE_OR_PLACEHOLDER}</div>
  <div class="slide-content">
    <h2>{HEADLINE}</h2>
    <div class="accent-line"></div>
    <p class="body-large">{BODY_LARGE}</p>
    <p class="body-text">{BODY_TEXT}</p>
  </div>
  {BOTTOM_BAR}
</div>
```

## T03: Split Reverse (layout-split-reverse)

```html
<div class="slide layout-split-reverse" data-slide="{N}">
  <div class="slide-content">
    <h2>{HEADLINE}</h2>
    <div class="accent-line"></div>
    {BODY_CONTENT}
  </div>
  <div class="slide-image">{IMAGE_OR_PLACEHOLDER}</div>
  {BOTTOM_BAR}
</div>
```

## T04: Center Headline (layout-center)

```html
<div class="slide layout-center" data-slide="{N}">
  <div class="slide-content">
    <h2>{HEADLINE}</h2>
    <div class="accent-line"></div>
    <p class="body-large">{BODY}</p>
  </div>
  {BOTTOM_BAR}
</div>
```

## T05: Bullet List (layout-split)

```html
<div class="slide layout-split" data-slide="{N}">
  <div class="slide-image">{IMAGE_OR_PLACEHOLDER}</div>
  <div class="slide-content">
    <h2>{HEADLINE}</h2>
    <div class="accent-line"></div>
    <ul class="bullet-list">
      <li>{BULLET_1}</li>
      <li>{BULLET_2}</li>
      <li>{BULLET_3}</li>
      <li>{BULLET_4}</li>
    </ul>
  </div>
  {BOTTOM_BAR}
</div>
```

## T06: Polaroid Stack (layout-split, 3 images)

```html
<div class="slide layout-split" data-slide="{N}">
  <div class="slide-image">
    <div style="position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center; padding:1rem;">
      <div style="position:absolute; top:8%; left:5%; transform:rotate(-7deg); background:#fff; padding:6px 6px 25px; box-shadow:var(--shadow-polaroid); z-index:1;">
        <img src="{IMG_1}" style="width:200px; height:155px; object-fit:cover; object-position:top;" alt="">
      </div>
      <div style="position:absolute; top:5%; right:8%; transform:rotate(5deg); background:#fff; padding:6px 6px 25px; box-shadow:var(--shadow-polaroid); z-index:2;">
        <img src="{IMG_2}" style="width:200px; height:155px; object-fit:cover; object-position:top;" alt="">
      </div>
      <div style="position:absolute; bottom:10%; left:50%; transform:translateX(-50%) rotate(-2deg); background:#fff; padding:6px 6px 25px; box-shadow:0 8px 25px rgba(0,0,0,0.3); z-index:3;">
        <img src="{IMG_3}" style="width:210px; height:160px; object-fit:cover; object-position:top;" alt="">
      </div>
    </div>
  </div>
  <div class="slide-content">
    <h2>{HEADLINE}</h2>
    <div class="accent-line"></div>
    {BODY_CONTENT}
  </div>
  {BOTTOM_BAR}
</div>
```

## T07: 2x2 Image Grid (layout-split, 4 images)

```html
<div class="slide layout-split" data-slide="{N}">
  <div class="slide-image">
    <div style="display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; gap:4px; width:100%; height:100%; padding:4px;">
      <img src="{IMG_1}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;" alt="">
      <img src="{IMG_2}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;" alt="">
      <img src="{IMG_3}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;" alt="">
      <img src="{IMG_4}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;" alt="">
    </div>
  </div>
  <div class="slide-content">
    <h2>{HEADLINE}</h2>
    <div class="accent-line"></div>
    {BODY_CONTENT}
  </div>
  {BOTTOM_BAR}
</div>
```

## T08: Core 6 Beliefs (layout-stack, glossy cards)

*Complex template. Build it from the pattern below with the glossy-card CSS in design-system.md:*
- Column headers: "STUCK" (red) vs "SHIFTED" (blue)
- 6 rows: red gradient card (X) | dark pill badge (#/name) | blue gradient card (checkmark)
- Pill badges: 72x52px, border-radius:26px

## T09: Timeline / Treasure Map (layout-stack)

*Complex template. Key pattern:*
- SVG background with dotted path lines + compass rose hint
- 7 timeline phases as flex rows
- Day pill badges progress: red → orange → amber → yellow → gold
- Final "REVEAL" badge is full gold with glow

## T10: Two-Column Split (layout-center)

```html
<div class="slide layout-center" data-slide="{N}">
  <div class="slide-content">
    <h2>{HEADLINE}</h2>
    <div class="accent-line"></div>
    <div style="display:flex; gap:3rem; margin-top:1.5rem; width:100%; max-width:900px;">
      <div style="flex:1; text-align:left;">
        <h3 style="color:var(--color-primary);">{COL_1_TITLE}</h3>
        <ul class="bullet-list">{COL_1_ITEMS}</ul>
      </div>
      <div style="width:2px; background:#e0e0e0;"></div>
      <div style="flex:1; text-align:left;">
        <h3>{COL_2_TITLE}</h3>
        <ul class="bullet-list">{COL_2_ITEMS}</ul>
      </div>
    </div>
  </div>
  {BOTTOM_BAR}
</div>
```

## T12: Stack Value (layout-split, progressive pricing)

```html
<div class="slide layout-split" data-slide="{N}">
  <div class="slide-image">{IMAGE_OR_PLACEHOLDER}</div>
  <div class="slide-content">
    <h2>{TIER_NAME}</h2>
    <div class="accent-line"></div>
    <table class="stack-table">
      <!-- Previous tier items (grayed) -->
      <tr><td class="item-name" style="color:#999;">{PREV_ITEM}</td><td class="item-value" style="color:#999;">{PREV_VALUE}</td></tr>
      <!-- New tier items (bold, with border-top) -->
      <tr style="border-top:2px solid {TIER_COLOR};"><td class="item-name"><strong>{NEW_ITEM}</strong></td><td class="item-value">{NEW_VALUE}</td></tr>
      <!-- Running total -->
      <tr class="total-row">
        <td class="item-name" style="color:#c0392b;">Total Value:</td>
        <td class="item-value" style="color:#c0392b; font-size:2rem;">{RUNNING_TOTAL}</td>
      </tr>
    </table>
  </div>
  {BOTTOM_BAR}
</div>
```

## T13: If All I Did Was (layout-center, 3 cards)

*3 gradient cards with left border accents (red, blue, gold). Each card:*
- Playfair Display italic body
- Bold "would it be worth it?" in accent color
- Left border: 5px solid [accent color]

## T14: Two Paths (layout-center)

*Two path boxes side by side:*
- `.path-old`: gray bg, dashed border
- `.path-new`: blue gradient bg, white text
- Closing line: "Which path are you on?"

## T15: Cost of Inaction (layout-center)

*4 rows with red X markers + pain point text. Closing paragraph about undivided attention.*

## T16: Price Reveal (layout-center)

*Crossed value (large, gray, strikethrough) + actual price (huge, black) + monthly (accent color).*

## T17: Referral/Highlight Offer (layout-center)

*Centered text with highlight span in accent color.*

## T18: Thank You (layout-split)

*Image left + centered "Thank You" heading + closing message.*

---

## BOTTOM BAR (All Slides)

```html
<div class="bottom-bar">
  <div class="logo-space">[ LOGO ]</div>
  <span class="slide-counter">{N} / {TOTAL}</span>
</div>
```

## PLACEHOLDER (When No Image)

```html
<div class="photo-placeholder {COLOR_CLASS}">[ YOUR IMAGE ]<br>{DESCRIPTION}</div>
```

Color classes: `dark-warm`, `gold`, `teal`, `purple`, `warm` (or default blue gradient).
