# Animation Library (web-dev-bot)

> GSAP catalog the build agent picks from during Phase 3 component generation.
> All animations gated on `prefers-reduced-motion: no-preference` per voice-aligned-motion.md.

---

## Motion Budget (PHANTOM guardrail)

- Max **1 entrance** animation per section
- Max **1 hover** effect per interactive element
- Max **1 background** motion per page
- Default duration: **0.6–1.2s** (slower than typical AI defaults)
- Default easing: `power3.out` for entrances, `power2.inOut` for hover

---

## Category 1 — Entrance

### Pattern E1: Split-letter hero
For top-of-page headlines.

```tsx
"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

export function HeroHeadline({ text }: { text: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useGSAP(() => {
    if (!ref.current) return;
    const chars = text.split("").map((c) =>
      `<span style="display:inline-block;opacity:0;transform:translateY(20px)">${c === " " ? "&nbsp;" : c}</span>`
    ).join("");
    ref.current.innerHTML = chars;
    gsap.to(ref.current.querySelectorAll("span"), {
      opacity: 1, y: 0, duration: 0.8, stagger: 0.03, ease: "power3.out",
    });
  }, []);
  return <h1 ref={ref}>{text}</h1>;
}
```

### Pattern E2: Section reveal on scroll

```tsx
"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useRef } from "react";
gsap.registerPlugin(ScrollTrigger);

export function RevealSection({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.from(ref.current, {
      opacity: 0, y: 40, duration: 1.0, ease: "power3.out",
      scrollTrigger: { trigger: ref.current, start: "top 75%", toggleActions: "play none none none" },
    });
  }, []);
  return <div ref={ref}>{children}</div>;
}
```

### Pattern E3: Image fade-up

```tsx
useGSAP(() => {
  gsap.from(imgRef.current, {
    opacity: 0, y: 30, duration: 1.2, ease: "power2.out",
    scrollTrigger: { trigger: imgRef.current, start: "top 80%" },
  });
}, []);
```

---

## Category 2 — Scroll-Triggered

### Pattern S1: Subtle parallax background (0.3× scroll speed max)

```tsx
useGSAP(() => {
  gsap.to(bgRef.current, {
    yPercent: -30, ease: "none",
    scrollTrigger: { trigger: bgRef.current, start: "top bottom", end: "bottom top", scrub: true },
  });
}, []);
```

### Pattern S2: Pinned section with progress (use sparingly — max once/page)

```tsx
useGSAP(() => {
  gsap.timeline({
    scrollTrigger: { trigger: pinRef.current, start: "top top", end: "+=200%", pin: true, scrub: 1 },
  })
    .to(stage1Ref.current, { opacity: 0 })
    .to(stage2Ref.current, { opacity: 1 }, "<");
}, []);
```

---

## Category 3 — Hover / Interaction

### Pattern H1: Magnetic button (primary CTAs only)

```tsx
useGSAP(() => {
  const btn = btnRef.current;
  if (!btn) return;
  const onMove = (e: MouseEvent) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(btn, { x: x * 0.2, y: y * 0.2, duration: 0.4 });
  };
  const onLeave = () => gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
  btn.addEventListener("mousemove", onMove);
  btn.addEventListener("mouseleave", onLeave);
  return () => {
    btn.removeEventListener("mousemove", onMove);
    btn.removeEventListener("mouseleave", onLeave);
  };
}, []);
```

### Pattern H2: Link underline draw (CSS-only, preferred)

```css
.link { position: relative; text-decoration: none; }
.link::after {
  content: ""; position: absolute; left: 0; bottom: -2px;
  width: 100%; height: 1px; background: currentColor;
  transform: scaleX(0); transform-origin: left;
  transition: transform 0.4s cubic-bezier(0.65, 0, 0.35, 1);
}
.link:hover::after { transform: scaleX(1); }
```

---

## Category 4 — Transitions

### Pattern T1: Page transition (App Router)

```tsx
useGSAP(() => {
  gsap.fromTo("main", { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" });
}, [pathname]);
```

### Pattern T2: Modal open

```tsx
useGSAP(() => {
  if (open) {
    gsap.to(overlayRef.current, { opacity: 1, duration: 0.3 });
    gsap.from(modalRef.current, { y: 30, opacity: 0, duration: 0.5, ease: "power3.out" });
  }
}, [open]);
```

---

## Category 5 — Background

### Pattern B1: Controlled animated gradient (NEVER generic CSS rainbows)

```tsx
useGSAP(() => {
  gsap.to(bgRef.current, {
    backgroundPosition: "200% 0%", duration: 20, repeat: -1, ease: "none",
  });
}, []);
```

```css
.bg-shift {
  background: linear-gradient(120deg, var(--brand-1), var(--brand-2), var(--brand-1));
  background-size: 200% 200%;
}
```

### Pattern B2: Grain overlay (CSS-only, premium)

```css
.grain::before {
  content: ""; position: absolute; inset: 0;
  background: url("/grain.png");
  opacity: 0.04; mix-blend-mode: overlay; pointer-events: none;
}
```

---

## Selection Logic (build agent reads this)

Phase 3 component-generation step picks from this catalog using:

1. Read `structure.json` from `.design-source/` to identify section types
2. Read `voice-aligned-motion.md` to determine motion philosophy
3. For each section, pick AT MOST one entrance (Cat 1):
   - Hero → E1 (split-letter)
   - Below-fold sections → E2 (reveal) or E3 (image fade)
4. For interactive elements, pick AT MOST one hover (Cat 3):
   - Primary CTA → H1 (magnetic)
   - Nav/inline links → H2 (CSS underline draw)
5. For page background, pick AT MOST one (Cat 5):
   - Marketing pages → B1 (gradient) OR B2 (grain) — never both
   - App pages → none
6. Transitions (Cat 4) only if multi-page App Router structure
7. Scroll-triggered (Cat 2) only if explicitly indicated by design

---

## Out of Scope for v1

- Custom Lottie pipelines
- WebGL / Three.js
- Scroll-jacking (hijacked native scroll behavior)
