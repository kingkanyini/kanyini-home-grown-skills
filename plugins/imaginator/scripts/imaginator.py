"""
IMAGINATOR - Gemini Image Generator
Generates images via Google's Gemini API.
Standard ("free" flag): gemini-3.1-flash-lite-image - cheapest; Google has no free image tier, billing required (2.5-flash-image retired 2026-10-02)
Premium: gemini-3.1-flash-image-preview (Nano Banana 2) - pay-per-image, up to 4K

Usage:
  python imaginator.py --prompt "A sunset over mountains" --model free --output ./image.png
  python imaginator.py --prompt "A sunset" --model premium --aspect 16:9 --output ./image.png
  python imaginator.py --prompt "Add a dragon behind this person" --image ./photo.jpg --model free --output ./result.png
  python imaginator.py --prompt "Place these two people in this scene" --image ./scene.png --image ./refs.png --model premium --output ./result.png
  python imaginator.py --costs                     # Show cost summary
  python imaginator.py --costs --since 2026-03-01  # Filter by date
  python imaginator.py --video --prompt "A sunset" --model fast --duration 4 --aspect "16:9" --person allow --output ./clip.mp4
  python imaginator.py --video --prompt "Animate this" --image ./still.png --model fast --duration 4 --output ./clip.mp4
"""

import argparse
import sys
import os
import json
import time
from pathlib import Path
from datetime import datetime

# Force UTF-8 stdout so unicode in prompts (e.g. arrows, smart quotes, em-dashes)
# doesn't crash on Windows cp1252 consoles.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, OSError):
    pass

# Cost log location
COST_LOG = Path.home() / ".claude" / "projects" / "imaginator" / "generation_log.jsonl"

# ---------------------------------------------------------------------------
# ===========================================================================
# HUMAN IMAGES — GLOBAL RULE (2026-07-17)
# When generating a HUMAN with ANY preset, SEED FROM A REAL ROYALTY-FREE FACE
# passed via --image. Our people shouldn't look AI-generated because they are
# built from a real person, not conjured. Process: pick the profile → web-search
# a royalty-free face (Unsplash / Pexels / Pixabay / CC0) → download → pass it as
# --image alongside the --style + action/world in --prompt (premium edit mode).
# ETHICS: royalty-free/licensed seeds only; the output is a NEW composite seeded
# for authenticity, NEVER presented as the real seed individual, transformed enough
# to not be a 1:1 reproduction. A subject's own consented photo (e.g. a founder's
# headshot) is the ideal seed. Applies to EVERY preset that renders a person.
# ===========================================================================
#
# STYLE PRESETS
# Named, reusable --style recipes. Pass the NAME to --style (case-insensitive)
# and it expands to the full recipe below. Free-text styles still work as before.
#
# PENN ACTION PORTRAITS  (condition-page hero recipe, 2026-06-30)
#   The fusion of the Penn portraits' human-spirit energy with an editorial
#   action/environmental setting. Built from a proven hero keeper.
#
#   STYLE: Environmental editorial photograph, chic fashion sensibility, luxury
#          wellness campaign. Off-center composition, subject to one side at
#          ~20-25% of frame with generous negative space for a headline. Warm
#          golden natural light, medium-format film grain, candid and emotive,
#          not posed.
#   SOUL (non-negotiable in every image): an emotionally charged gesture of
#          release / arrival / surrender — the body language of the *after*
#          state. Face lifted, arms opening, shoulders softening, the breath of
#          letting go. Captured from behind or three-quarter.
#   WORLD: a beautiful, specific aspirational environment chosen per subject —
#          provided in the --prompt (the reclaimed life, not the symptom).
# ---------------------------------------------------------------------------
STYLE_PRESETS = {
    "PENN ACTION PORTRAITS": (
        "Environmental editorial photograph with a chic fashion sensibility, luxury wellness brand campaign. "
        "Off-center composition, the subject clearly present to one side at about 20-25 percent of the frame "
        "with generous negative space for a headline. Warm golden natural light, medium-format film grain with "
        "a gentle natural color grade, crisp natural clarity, candid and emotive, not posed. "
        "THE SOUL: the subject embodies an emotionally charged gesture of release, arrival, or surrender — the "
        "body language of the after-state — face lifted or turned away, arms or shoulders opening, the breath of "
        "letting go, captured from behind or three-quarter, never facing the camera. "
        "THE WORLD: a beautiful, specific, aspirational environment as described in the prompt. "
        "No text, no logos, no watermark."
    ),
    # IG PENN ACTION PORTRAITS  (feed-native variant, 2026-07-14)
    #   Same Penn editorial grade as the web-hero preset above, but CONNECTION-first
    #   instead of turned-away — because the web-hero PENN reads "disconnected" on an
    #   Instagram feed (learned: image-gen-preset-medium-contract).
    #   Use for any PERSON shot destined for an IG feed post / reel cover.
    #   Default for IG people-shots; web heroes still use plain PENN ACTION PORTRAITS.
    "IG PENN ACTION PORTRAITS": (
        "Environmental editorial photograph with a chic fashion sensibility, luxury wellness brand campaign, "
        "composed for a vertical Instagram feed (4:5 or 9:16). Warm golden natural light, medium-format film grain "
        "with a gentle natural color grade, crisp natural clarity, candid and emotive, not posed. Clean, uncluttered "
        "negative space in the TOP THIRD for a headline. "
        "THE SOUL: connection with the viewer — the subject is present and engaged, either looking softly toward the "
        "camera with a warm, genuine micro-expression that says 'this is me,' OR actively engaged in a nourishing "
        "gesture (holding, sipping, spooning, releasing) with hands and face involved in the moment. Feed-native and "
        "intimate; the subject fills a confident portion of the frame. NOT turned fully away, NOT a distant "
        "back-of-head hero — the pull comes from presence and warmth, not aspirational distance. "
        "THE WORLD: a beautiful, specific, aspirational environment as described in the prompt. "
        "No text, no logos, no watermark."
    ),
    # IG PENN ORGANIC LUXURY  (people-shot upgrade, 2026-07-17)
    #   The IG connection-first PENN bones, but with the two clauses the older preset
    #   was missing and that made outputs read drab + AI-generated: an explicit
    #   ORGANIC-LUXURY WARDROBE and an anti-AI REALISM clause. Pair with the global
    #   HUMAN-IMAGES rule below — seed from a real royalty-free face via --image so the
    #   person is built from a real human, not conjured. Default going forward for
    #   IG people-shots; the plainer "IG PENN ACTION PORTRAITS" stays for back-compat.
    "IG PENN ORGANIC LUXURY": (
        "Environmental editorial photograph, chic fashion sensibility, luxury wellness brand campaign, "
        "composed for a vertical Instagram feed (4:5 or 9:16). Warm golden natural light, medium-format film "
        "grain, gentle natural color grade, candid and emotive, not posed. Clean negative space in the TOP THIRD "
        "for a headline. "
        "THE SOUL: connection with the viewer — present and engaged, either a warm genuine micro-expression "
        "softly toward camera that says 'this is me,' OR actively in a nourishing gesture (holding, sipping, "
        "spooning, releasing), hands and face in the moment. Feed-native, intimate; subject fills a confident "
        "portion of the frame. "
        "WARDROBE: an elegant, coordinated outfit in ONE warm earth tone head to toe (soft olive, cream, camel, "
        "clay, or dusty sage) — a clean simple top with wide-leg, softly draped trousers, optionally layered with "
        "a longline open jacket or duster. Natural fabric with visible texture, tailored clean lines, sleek and "
        "put-together. Refined gold accents: a pendant necklace, hoop earrings, or a slim cuff. NO athleisure, "
        "NO synthetic sheen, NO shapeless or drab clothing, NO loud logos. "
        "REALISM (authentic, never AI-looking): a real person on a real camera — visible skin texture and pores, "
        "fine flyaway hairs, subtle asymmetry and genuine imperfections, real fabric weight and wrinkles, natural "
        "catchlights, shallow lens depth of field. NO plastic or waxy skin, NO over-smoothing, NO uncanny symmetry, "
        "NO glossy CGI or 3D-render sheen, NO airbrushed influencer gloss. "
        "THE WORLD: a beautiful, specific, aspirational environment as described in the prompt. "
        "No text, no logos, no watermark."
    ),
    # EARTHY COMIC REALISM  (warm earthy version of Comic Realism)
    #   Comic-come-to-life technique in a warm earthy palette. Brand-aligned,
    #   Kinfolk-editorial finish. Used for a webinar deck
    #   (2026-07-07). NO neon/CMYK/onomatopoeia — the earthy counterpart to the
    #   "Comic Realism" style in the skill's style table.
    "EARTHY COMIC REALISM": (
        "A scene rendered like a printed comic book come to life — cel-shaded surfaces with visible hand-drawn "
        "ink outlines, hatching and cross-hatching for shadows, subtle Ben-Day halftone dots across the mid-tones, "
        "gentle offset-print texture with slight print misregistration along edges, editorial hand-illustrated "
        "comic finish. Palette stays STRICTLY in warm earthy tones: cream #F2EBDB, ink-brown #1A1410, "
        "gold #C9A661, teal #5FA6A6, sage green #8FA289, terracotta #D9856E. NO neon, no magenta/cyan/violet, "
        "no CMYK neon fringing, no onomatopoeia, no speed lines. Warm, refined, premium, Kinfolk-editorial."
    ),
    # NATURAL FOUNDER REPLICATION  (founder photos, 2026-07-21)
    #   A photo-composite REPLICATION recipe, not an editorial style. Requires --image
    #   (a clear front-facing seed of the subject; their own consented photo is ideal).
    #   Beats Gemini's face-slimming/beautify bias by telling the model to REPLICATE the
    #   seed face exactly and change only outfit/body/pose/location — never describe facial
    #   features (learned: imaginator-replicate-face-dont-describe-it). The un-polished,
    #   elevated-casual counterpart to IG PENN ORGANIC LUXURY (which read glossy + drapey).
    #   Wardrobe STRUCTURE is baked in; color + setting come from the --prompt.
    "NATURAL FOUNDER REPLICATION": (
        "Edit this photograph as a PURE IDENTITY REPLICATION. Keep the subject face, head, hair, skin, and "
        "expression EXACTLY as in the original photo. Do NOT reshape, slim, thin, beautify, or re-draw the face, "
        "and do NOT describe or reinterpret facial features — replicate the face precisely as photographed. Change "
        "ONLY the outfit, body build, pose, and location as described in the prompt. "
        "FINISH — natural and un-polished: a real candid photo taken on a nice camera in natural daylight, NOT a "
        "glossy magazine editorial and NOT AI-generated. Real skin texture with visible pores and subtle natural "
        "imperfections, soft natural window light, shallow depth of field, true-to-life color. NO plastic or CGI "
        "sheen, NO airbrushing, NO studio-perfect retouching, NO uncanny symmetry. "
        "WARDROBE — elevated-casual, chic Upper West Side mom: a form-fitting fine-ribbed knit or fitted top with "
        "tailored trousers or well-fitted high-waisted denim, trendy and understated, flattering and put-together, "
        "NEVER loose, baggy, drapey, or matronly, NO athleisure, NO synthetic sheen, NO loud logos. Refined minimal "
        "accents only. "
        "PROPORTIONS: natural realistic human proportions, arms and hands correctly proportioned and never "
        "elongated; if the subject is holding an object, the hands genuinely grip it. "
        "No text, no logos, no watermark."
    ),
}


def resolve_style(style):
    """Expand a preset NAME (case-insensitive) to its full recipe; pass free text through."""
    if not style:
        return style
    return STYLE_PRESETS.get(style.strip().upper(), style)

# Pricing per image (update these as Gemini pricing changes)
PRICING = {
    "free": 0.00,
    "premium": 0.04,       # ~$0.04 per image generation (Gemini Flash Image)
    "premium_edit": 0.05,  # ~$0.05 per image edit (input image + generation)
    "video_fast": 0.15,       # per second, Veo 3.1 Fast (720-1080p)
    "video_full": 0.40,       # per second, Veo 3.1 Full (720-1080p)
}

def ensure_dependencies():
    try:
        from google import genai
    except ImportError:
        print("Installing google-genai package...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "google-genai", "-q"])
    try:
        from PIL import Image
    except ImportError:
        print("Installing Pillow package...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow", "-q"])

def log_generation(model_tier, prompt, output_path, image_path=None, success=True):
    """Append a generation record to the cost log."""
    COST_LOG.parent.mkdir(parents=True, exist_ok=True)

    has_input_image = image_path is not None
    if model_tier == "free":
        cost = PRICING["free"]
    elif has_input_image:
        cost = PRICING["premium_edit"]
    else:
        cost = PRICING["premium"]

    record = {
        "timestamp": datetime.now().isoformat(),
        "type": "image",
        "model": model_tier,
        "has_input_image": has_input_image,
        "prompt_preview": prompt[:80] + "..." if len(prompt) > 80 else prompt,
        "output": str(output_path),
        "success": success,
        "cost_usd": cost,
    }

    with open(COST_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")

def log_generation_video(model_tier, prompt, duration, output_path, image_path=None, success=True):
    """Append a video generation record to the cost log."""
    COST_LOG.parent.mkdir(parents=True, exist_ok=True)

    cost_per_sec = PRICING.get(f"video_{model_tier}", 0.15)
    cost = cost_per_sec * duration

    record = {
        "timestamp": datetime.now().isoformat(),
        "type": "video",
        "model": model_tier,
        "duration": duration,
        "has_input_image": image_path is not None,
        "prompt_preview": prompt[:80] + "..." if len(prompt) > 80 else prompt,
        "output": str(output_path),
        "success": success,
        "cost_usd": round(cost, 2),
    }

    with open(COST_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")

def show_costs(since_date=None):
    """Display cost summary from the generation log."""
    if not COST_LOG.exists():
        print("No generation history found yet.")
        return

    records = []
    with open(COST_LOG, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))

    if since_date:
        records = [r for r in records if r["timestamp"][:10] >= since_date]

    if not records:
        print(f"No generations found{f' since {since_date}' if since_date else ''}.")
        return

    image_records = [r for r in records if r.get("type", "image") == "image"]
    video_records = [r for r in records if r.get("type") == "video"]

    total = len(records)
    total_cost = sum(r.get("cost_usd", 0) for r in records)
    successful = sum(1 for r in records if r.get("success", True))

    first_date = records[0]["timestamp"][:10]
    last_date = records[-1]["timestamp"][:10]

    free_count = sum(1 for r in image_records if r["model"] == "free")
    premium_count = sum(1 for r in image_records if r["model"] == "premium")
    edit_count = sum(1 for r in image_records if r.get("has_input_image", False) and r["model"] == "premium")
    image_cost = sum(r.get("cost_usd", 0) for r in image_records)

    video_fast = sum(1 for r in video_records if r["model"] == "fast")
    video_full = sum(1 for r in video_records if r["model"] == "full")
    video_cost = sum(r.get("cost_usd", 0) for r in video_records)
    video_seconds = sum(r.get("duration", 4) for r in video_records)

    daily = {}
    for r in records:
        day = r["timestamp"][:10]
        if day not in daily:
            daily[day] = {"count": 0, "cost": 0.0}
        daily[day]["count"] += 1
        daily[day]["cost"] += r.get("cost_usd", 0)

    print("=" * 60)
    print("  IMAGINATOR - COST ANALYSIS")
    print("=" * 60)
    print(f"  Period: {first_date} to {last_date}")
    print(f"  Total generations: {total} ({successful} successful)")

    if image_records:
        print("-" * 60)
        print("  IMAGES")
        print(f"    Free tier:       {free_count} images    ${0:.2f}")
        print(f"    Premium (new):   {premium_count - edit_count} images    ${(premium_count - edit_count) * PRICING['premium']:.2f}")
        print(f"    Premium (edit):  {edit_count} images    ${edit_count * PRICING['premium_edit']:.2f}")
        print(f"    Subtotal:        ${image_cost:.2f}")

    if video_records:
        print("-" * 60)
        print("  VIDEOS")
        print(f"    Fast (Veo 3.1):  {video_fast} clips     ${sum(r.get('cost_usd', 0) for r in video_records if r['model'] == 'fast'):.2f}")
        print(f"    Full (Veo 3.1):  {video_full} clips     ${sum(r.get('cost_usd', 0) for r in video_records if r['model'] == 'full'):.2f}")
        print(f"    Total seconds:   {video_seconds}s")
        print(f"    Subtotal:        ${video_cost:.2f}")

    print("-" * 60)
    print(f"  TOTAL COST:        ${total_cost:.2f}")
    print("=" * 60)

    if len(daily) > 1:
        print("\n  Daily Breakdown:")
        print("  " + "-" * 40)
        for day in sorted(daily.keys()):
            d = daily[day]
            cost_str = f"${d['cost']:.2f}" if d['cost'] > 0 else "free"
            print(f"  {day}:  {d['count']} gens  ({cost_str})")
        print("  " + "-" * 40)

    print(f"\n  Last {min(5, len(records))} generations:")
    for r in records[-5:]:
        ts = r["timestamp"][:16].replace("T", " ")
        gen_type = r.get("type", "image")
        if gen_type == "video":
            tier = "FAST" if r["model"] == "fast" else "FULL"
            dur = f" {r.get('duration', '?')}s"
            label = f"VID {tier}{dur}"
        else:
            tier = "FREE" if r["model"] == "free" else "PREM"
            edit = "+edit" if r.get("has_input_image") else ""
            label = f"IMG {tier}{edit}"
        cost = f"${r.get('cost_usd', 0):.2f}"
        print(f"  [{ts}] {label} {cost} - {r['prompt_preview'][:40]}")

    print()
    print(f"  Pricing rates (editable in imaginator.py):")
    print(f"    Image: Free ${PRICING['free']:.2f} | Premium ${PRICING['premium']:.2f} | Edit ${PRICING['premium_edit']:.2f}")
    print(f"    Video: Fast ${PRICING['video_fast']:.2f}/s | Full ${PRICING['video_full']:.2f}/s")
    print("=" * 60)

def generate_image(prompt, model_tier, aspect_ratio, output_path, image_path=None,
                   image_size=None):
    from google import genai
    from google.genai import types
    from PIL import Image as PILImage
    import io

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY not set. Get your key at https://aistudio.google.com/apikey")
        sys.exit(1)

    client = genai.Client(api_key=api_key)

    model_id = "gemini-3.1-flash-lite-image" if model_tier == "free" else "gemini-3.1-flash-image-preview"

    # Normalize image_path to a list (None | str | list[str] all accepted)
    if image_path is None:
        image_paths = []
    elif isinstance(image_path, str):
        image_paths = [image_path]
    else:
        image_paths = list(image_path)

    print(f"Model: {model_id} ({'Free' if model_tier == 'free' else 'Premium'})")
    print(f"Prompt: {prompt}")
    for p in image_paths:
        print(f"Input image: {p}")
    if aspect_ratio:
        print(f"Aspect ratio: {aspect_ratio}")
    if image_size:
        print(f"Image size: {image_size}")

    try:
        config = types.GenerateContentConfig(
            response_modalities=["Text", "Image"],
        )
        # image_config carries aspect_ratio and/or image_size; only build it if
        # at least one was asked for, so the default path stays untouched.
        if aspect_ratio or image_size:
            img_cfg = {}
            if aspect_ratio:
                img_cfg["aspect_ratio"] = aspect_ratio
            if image_size:
                img_cfg["image_size"] = image_size
            config.image_config = types.ImageConfig(**img_cfg)

        # Build content — text only or text + N images
        if image_paths:
            imgs = [PILImage.open(p) for p in image_paths]
            contents = [prompt, *imgs]
        else:
            contents = prompt

        response = client.models.generate_content(
            model=model_id,
            contents=contents,
            config=config,
        )

        image_saved = False
        for part in response.parts:
            if part.text is not None:
                print(f"Model note: {part.text}")
            elif image := part.as_image():
                Path(output_path).parent.mkdir(parents=True, exist_ok=True)
                image.save(output_path)
                print(f"SUCCESS: Image saved to {output_path}")
                try:
                    print(f"Resolution: {image.size[0]}x{image.size[1]}")
                except (AttributeError, TypeError):
                    print("Resolution: check file properties")
                image_saved = True
                break

        if not image_saved:
            log_generation(model_tier, prompt, output_path, image_path, success=False)
            print("WARNING: No image generated. The model returned text only.")
            print("Try adding more visual detail to your prompt.")
            sys.exit(2)

        # Log successful generation
        log_generation(model_tier, prompt, output_path, image_path, success=True)

    except Exception as e:
        log_generation(model_tier, prompt, output_path, image_path, success=False)
        error_msg = str(e)
        if "401" in error_msg or "UNAUTHENTICATED" in error_msg:
            print("ERROR: Invalid API key. Check your GEMINI_API_KEY.")
        elif "402" in error_msg or "prepayment" in error_msg.lower():
            # Prepay billing comes back as RESOURCE_EXHAUSTED too, so test it before the rate-limit branch.
            print("ERROR: Google AI Studio prepaid credit is used up. Top up at https://ai.studio/projects (Billing).")
        elif "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            print("ERROR: Rate limit reached. Free tier allows 500 images/day.")
            print(f"       Raw error: {error_msg[:300]}")
        elif "SAFETY" in error_msg or "blocked" in error_msg.lower():
            print("ERROR: Content blocked by safety filters. Try a different prompt.")
        else:
            print(f"ERROR: {error_msg}")
        sys.exit(1)

def generate_video(prompt, model_tier, aspect_ratio, duration, person_gen, output_path, image_path=None,
                   last_image_path=None, negative_prompt=None, generate_audio=True):
    from google import genai
    from google.genai import types
    import mimetypes

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY not set. Get your key at https://aistudio.google.com/apikey")
        sys.exit(1)

    client = genai.Client(api_key=api_key)
    model_id = "veo-3.1-fast-generate-preview" if model_tier == "fast" else "veo-3.1-generate-preview"

    print(f"Model: {model_id} ({'Fast' if model_tier == 'fast' else 'Full'})")
    print(f"Prompt: {prompt}")
    print(f"Duration: {duration}s | Aspect: {aspect_ratio} | People: {person_gen}")
    if image_path:
        print(f"Source image: {image_path}")
    if last_image_path:
        print(f"Last frame: {last_image_path}")
    if negative_prompt:
        print(f"Negative prompt: {negative_prompt}")
    print(f"Audio: {'on' if generate_audio else 'off'}")

    try:
        # NOTE: generate_audio is a Vertex-only config field; the Gemini API rejects it.
        # Silent output is handled by stripping the audio track in post (see --no-audio handling).
        config_kwargs = dict(
            aspect_ratio=aspect_ratio,
            duration_seconds=duration,
            person_generation="allow_adult" if person_gen == "allow" else "dont_allow",
            number_of_videos=1,
        )
        if negative_prompt:
            config_kwargs["negative_prompt"] = negative_prompt
        if last_image_path:
            lf_mime = mimetypes.guess_type(last_image_path)[0] or "image/png"
            with open(last_image_path, "rb") as f:
                lf_bytes = f.read()
            config_kwargs["last_frame"] = types.Image(image_bytes=lf_bytes, mime_type=lf_mime)
        config = types.GenerateVideosConfig(**config_kwargs)

        kwargs = {
            "model": model_id,
            "prompt": prompt,
            "config": config,
        }
        if image_path:
            mime_type = mimetypes.guess_type(image_path)[0] or "image/png"
            with open(image_path, "rb") as f:
                image_bytes = f.read()
            kwargs["image"] = types.Image(image_bytes=image_bytes, mime_type=mime_type)

        print("Submitting video generation request...")
        operation = client.models.generate_videos(**kwargs)

        elapsed = 0
        max_wait = 300
        while not operation.done:
            if elapsed >= max_wait:
                print(f"ERROR: Generation timed out after {max_wait}s. Try a simpler prompt or retry.")
                log_generation_video(model_tier, prompt, duration, output_path, image_path, success=False)
                sys.exit(1)
            time.sleep(10)
            elapsed += 10
            print(f"Generating... {elapsed}s elapsed...")
            operation = client.operations.get(operation)

        if operation.error:
            print(f"ERROR: Video generation failed: {operation.error}")
            log_generation_video(model_tier, prompt, duration, output_path, image_path, success=False)
            sys.exit(1)

        result = operation.result or operation.response
        if not result or not result.generated_videos:
            print("ERROR: No video generated. Try a different prompt.")
            log_generation_video(model_tier, prompt, duration, output_path, image_path, success=False)
            sys.exit(2)

        generated_video = result.generated_videos[0]
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        video_bytes = client.files.download(file=generated_video)
        with open(output_path, "wb") as f:
            f.write(video_bytes)
        print(f"SUCCESS: Video saved to {output_path}")

        log_generation_video(model_tier, prompt, duration, output_path, image_path, success=True)

    except Exception as e:
        log_generation_video(model_tier, prompt, duration, output_path, image_path, success=False)
        error_msg = str(e)
        if "401" in error_msg or "UNAUTHENTICATED" in error_msg:
            print("ERROR: Invalid API key. Check your GEMINI_API_KEY.")
        elif "402" in error_msg or "prepayment" in error_msg.lower():
            print("ERROR: Google AI Studio prepaid credit is used up. Top up at https://ai.studio/projects (Billing).")
        elif "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            print("ERROR: Quota exceeded or billing issue. Check your Google AI Studio account.")
            print(f"       Raw error: {error_msg[:300]}")
        elif "SAFETY" in error_msg or "blocked" in error_msg.lower():
            print("ERROR: Content blocked by safety filters. Try rephrasing.")
        else:
            print(f"ERROR: {error_msg}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Imaginator - Gemini Image & Video Generator")
    parser.add_argument("--prompt", default=None, help="Image/video description")
    parser.add_argument("--model", choices=["free", "premium", "fast", "full"], default=None,
                        help="Model tier: free/premium for images, fast/full for video")
    parser.add_argument("--aspect", default="", help="Aspect ratio (e.g. 16:9, 9:16, 1:1)")
    parser.add_argument("--image-size", dest="image_size", default=None,
                        choices=["1K", "2K", "4K"],
                        help="Output resolution for premium image gen (1K default, 2K, 4K). "
                             "Use 2K/4K when the image is a web hero or print asset - 1K "
                             "returns ~768px on the short edge and upscales soft.")
    parser.add_argument("--output", default=None, help="Output file path (.png or .mp4)")
    parser.add_argument("--style", default="", help="Style prefix to prepend to prompt. Accepts a preset NAME (e.g. 'PENN ACTION PORTRAITS') or free text.")
    parser.add_argument("--list-presets", action="store_true", help="List available named style presets and exit")
    parser.add_argument("--image", action="append", default=None, help="Input image path for editing/compositing/animation. Pass multiple times to provide reference images (e.g. --image slide.png --image faces.png).")
    parser.add_argument("--costs", action="store_true", help="Show cost analysis summary")
    parser.add_argument("--since", default=None, help="Filter costs since date (YYYY-MM-DD)")
    parser.add_argument("--video", action="store_true", help="Video generation mode (uses Veo 3.1)")
    parser.add_argument("--duration", type=int, choices=[4, 6, 8], default=4,
                        help="Video duration in seconds (4, 6, or 8)")
    parser.add_argument("--person", choices=["allow", "block"], default="block",
                        help="Allow person generation in video")
    parser.add_argument("--last-image", dest="last_image", default=None,
                        help="Video only: last-frame image to anchor the clip's end pose. Use the same path as --image to force start and end on the same pose (e.g. a still 'listening' loop).")
    parser.add_argument("--negative-prompt", dest="negative_prompt", default=None,
                        help="Video only: things to avoid (e.g. 'talking, open mouth, lip movement').")
    parser.add_argument("--no-audio", dest="no_audio", action="store_true",
                        help="Video only: generate a silent clip (Veo 3.1 makes audio by default).")

    args = parser.parse_args()

    if args.costs:
        show_costs(args.since)
        sys.exit(0)

    if args.list_presets:
        print("Available style presets (pass the name to --style):\n")
        for name, recipe in STYLE_PRESETS.items():
            print(f"  {name}\n    {recipe}\n")
        sys.exit(0)

    # Expand a preset NAME in --style to its full recipe (free text passes through).
    args.style = resolve_style(args.style)

    if args.model is None:
        args.model = "fast" if args.video else "free"

    if args.video and args.model not in ("fast", "full"):
        parser.error("Video mode requires --model fast or --model full")
    if not args.video and args.model not in ("free", "premium"):
        parser.error("Image mode requires --model free or --model premium")

    if not args.prompt or not args.output:
        parser.error("--prompt and --output are required for generation")

    ensure_dependencies()

    if args.image:
        for p in args.image:
            if not os.path.isfile(p):
                print(f"ERROR: Input image not found: {p}")
                sys.exit(1)
    if getattr(args, "last_image", None) and not os.path.isfile(args.last_image):
        print(f"ERROR: Last-frame image not found: {args.last_image}")
        sys.exit(1)

    if args.video:
        full_prompt = f"{args.style} {args.prompt}".strip() if args.style else args.prompt
        # Veo image-to-video takes a single seed image; --image collects a list, so use the first.
        video_seed = args.image[0] if args.image else None
        generate_video(full_prompt, args.model, args.aspect or "16:9",
                       args.duration, args.person, args.output, video_seed,
                       last_image_path=args.last_image,
                       negative_prompt=args.negative_prompt,
                       generate_audio=not args.no_audio)
    else:
        full_prompt = f"{args.style} {args.prompt}".strip() if args.style else args.prompt
        generate_image(full_prompt, args.model, args.aspect or None, args.output, args.image,
                       args.image_size)
