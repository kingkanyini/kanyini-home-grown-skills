# CapCut Mapping Reference

*Loaded by the orchestrator and injected into Agent 4 (CapCut Language Translator). Single source of truth for all CapCut-specific terminology, menu paths, and scale conversions.*

---

## Terminology Translation

| Generic Term | CapCut Equivalent | Menu Path | Notes |
|-------------|-------------------|-----------|-------|
| Gaussian Blur (px) | Blur (0-100 scale) | Effects > Video Effects > Blur | Conversion: CapCut value ≈ pixel_value × 2. E.g., "30px blur" = 60 on CapCut scale |
| Add blend mode | Linear Dodge | Overlay panel > Blend Mode | Only works on overlay tracks, NOT on text or shape layers |
| Screen blend mode | Screen | Overlay panel > Blend Mode | Works on overlays. Good for light leaks and lens flares |
| Draw animation (line) | Scale-X keyframes | No native draw. Workaround: keyframe Scale X from 0% → 100%, anchor left | Set anchor point to left edge before keyframing |
| Loop animation | Manual keyframe copy | No loop toggle. Copy-paste keyframe pairs to repeat | Select keyframes → Ctrl+C → move playhead → Ctrl+V |
| Screen shake | Earthquake effect | Effects > Video Effects > Lens > Earthquake | Adjust intensity and frequency. Duration matches the shake window |
| Overshoot bounce | Keyframe + Bezier curve | Keyframe Scale: 0% → 110% → 100% (3 keyframes) | Right-click middle keyframe → set curve to ease-in-out |
| Fade In | Opacity keyframes | Keyframe Opacity: 0% → 100% over duration | OR use Text > Animation > In > Fade In (for text layers) |
| Slide Up | Position-Y keyframes | Keyframe Position Y: off-screen bottom → final Y | Set curve to Ease Out for natural deceleration |
| Typewriter | Text animation preset | Text > Animation > In > Typewriter | Built-in preset. Adjust speed in animation settings |
| Pop In / Scale Up | Scale keyframes | Keyframe Scale: 0% → 100% over 0.2-0.3s | Add ease-out curve for smooth landing |
| Drop shadow | Text style setting | Text > Style > Shadow | Settings: Color, Opacity (0-100), X offset, Y offset, Blur radius |
| Gradient text fill | Text style setting | Text > Style > Fill > Gradient | Requires CapCut PC v3.5+. Set start/end colors and angle |
| Color grading | Adjust panel | Adjust > Color (or Filters for presets) | Sliders: Brightness, Contrast, Saturation, Temperature, Tint, HSL |

## Menu Path Quick Reference

### Text Layers
- Add text: `Text > Default Text` (click to add)
- Font: `Text > Style > Font` (dropdown)
- Size: `Text > Style > Font Size` (slider or type number)
- Color: `Text > Style > Fill > Color` (color picker)
- Gradient fill: `Text > Style > Fill > Gradient` (toggle, set 2 colors + angle)
- Outline: `Text > Style > Stroke` (toggle, set color + width)
- Shadow: `Text > Style > Shadow` (toggle, set color + opacity + offset + blur)
- Animation In: `Text > Animation > In > [preset name]`
- Animation Out: `Text > Animation > Out > [preset name]`
- Keyframes: Click diamond icon next to any property → set value → move playhead → set new value

### Shape Layers
- Add shape: `Elements > Shape > [Rectangle / Circle / Triangle]`
- Fill color: Select shape → `Style > Fill Color`
- Opacity: Select shape → `Opacity` slider in properties panel
- Border radius: Select shape → drag corner handles (for rounded rectangles)
- Position/size: Drag on canvas or set exact values in properties panel

### Overlay Layers
- Add overlay: Drag media to overlay track (track above main video)
- Blend mode: Select overlay → `Blend Mode` dropdown in properties panel
- Opacity: Select overlay → `Opacity` slider

### Keyframes (Universal)
- Add keyframe: Click diamond icon (◇) next to any animatable property
- Delete keyframe: Click filled diamond (◆) to remove
- Move between keyframes: Use arrow buttons next to diamond icon
- Easing curves: Right-click keyframe → select curve type
  - Linear (default): constant speed
  - Ease In: starts slow, ends fast
  - Ease Out: starts fast, ends slow (most natural for entrances)
  - Ease In-Out: slow start and end (smooth)
  - Bezier: custom curve (drag handles)

### Effects
- Video effects: `Effects > Video Effects > [category] > [effect name]`
- Blur: `Effects > Video Effects > Blur` (adjust intensity 0-100)
- Lens effects: `Effects > Video Effects > Lens > [Earthquake / Zoom / etc.]`

## Effect-to-Setting Conversion Tables

### Drop Shadow Settings
| Description | CapCut Setting |
|------------|---------------|
| Subtle shadow (lower thirds) | Color: #000000, Opacity: 30, X: 2, Y: 2, Blur: 4 |
| Medium shadow (title cards) | Color: #000000, Opacity: 40, X: 3, Y: 5, Blur: 8 |
| Heavy shadow (hero text) | Color: #000000, Opacity: 50, X: 4, Y: 6, Blur: 10 |

### Blur Intensity Conversion
| Visual Description | Pixel Equivalent | CapCut Value (0-100) |
|-------------------|-----------------|---------------------|
| Subtle softness | ~5px | 10 |
| Noticeable blur | ~15px | 30 |
| Strong blur (pillarbox sides) | ~30px | 60-80 |
| Heavy blur (unrecognizable) | ~50px | 90-100 |

### Opacity Levels
| Visual Description | CapCut Opacity |
|-------------------|---------------|
| Barely visible (watermark/ghost) | 15-25% |
| Semi-transparent (gradient bar) | 50-70% |
| Mostly opaque (overlay) | 80-90% |
| Solid | 100% |

### Keyframe Animation Presets
| Animation | Keyframe Setup | Duration |
|-----------|---------------|----------|
| Fade In | Opacity: 0% → 100% | 0.3-0.5s |
| Slide Up | Y: +300 → 0 (from below frame) | 0.3-0.5s, ease-out |
| Slide In from Right | X: +1200 → final position | 0.4-0.5s, ease-out |
| Scale Up (pop) | Scale: 0% → 100% | 0.2-0.3s, ease-out |
| Slam In (overshoot) | Scale: 0% → 110% → 100% | 0.3-0.4s (3 keyframes) |
| Bounce In | Scale: 0% → 115% → 95% → 100% | 0.5s (4 keyframes) |
| Pulse (repeating) | Scale: 100% → 105% → 100% | 0.8s per cycle, copy-paste to repeat |

## Template vs Transition Categorization Rule

Agent 4 uses this rule to classify each finding:

- **Template Change** = A visual state that persists for >1 second as a recognizable layout or overlay. It is the "what" — a split panel, a lower third bar, a title card, a pillarbox frame. If you paused the video and took a screenshot, this is what you'd see.

- **Transition Effect** = Motion between states, typically <1 second duration. It is the "how" — a slide-in, a fade, an edge vignette that accompanies an overlay. If you paused mid-transition, you'd see a partial state (half-faded, mid-slide).

- **Sub-elements** (e.g., a globe icon that appears alongside a book cover slide-in) are documented as part of their parent template or transition, NOT as standalone entries. Note them in the parent's build steps.

## Save-as-Preset Instructions

After building a template in CapCut, save it for reuse:
1. Select ALL layers composing the template (Ctrl+click each layer)
2. Right-click selected layers → "Save as Custom Preset" (or "Save as Template" in newer versions)
3. Name convention: `XRAY_T[number]_[short-name]` (e.g., `XRAY_T1_SplitPanel`, `XRAY_T2_GreenLowerThird`)
4. Saved presets appear in: `Templates > Custom` tab
5. To use: drag preset onto timeline, replace placeholder content with new text/media

## Version Compatibility

| Feature | Minimum CapCut Version | Workaround for Older |
|---------|----------------------|---------------------|
| Gradient text fill | PC v3.5+ | Dual-layer method: white text + colored gradient shape masked to text shape |
| Keyframe easing curves | PC v2.0+ | Use linear keyframes with more intermediate points |
| Custom blend modes | PC v2.5+ | Use opacity adjustments instead |
| Shape elements | PC v2.0+ | Import pre-made PNG shapes as overlays |
