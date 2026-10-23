"""
Webinar Dev Bot — extract slides.json from the locked HTML deck.

The HTML deck is the source of truth (Phase 3 edits it directly), so the PPTX
for Canva is built from what's IN the HTML, not retyped from the outline. This
keeps the Canva deck word-for-word identical to the deck you approved.

Usage:
    python3 extract_slides.py presentation.html [--out slides.json] [--force]
    python3 extract_slides.py presentation.html --check slides.json

What it does:
    - one entry per .slide[data-slide], in order
    - layout from the slide's class (unknown layouts: split if it has an image, else center)
    - title (h1/h2), subtitle, body paragraphs, bullets, tables, cards (h3 groups / .card boxes)
    - <strong> and .highlight become **highlight** markup
    - first image per slide; base64 images are saved to images/_extracted/
    - speaker notes from .notes / .speaker-notes / <aside>
    - brand colors from the CSS :root variables

Anything it can't map cleanly (SVG timelines, multi-image collages, custom layouts,
text it didn't capture) is listed as REVIEW so Claude/you can fix that slide's entry.

Exit codes: 0 ok · 1 error, or --check found differences · 2 written, with REVIEW items
"""

import argparse
import base64
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
SKIP_CLASSES = {"bottom-bar", "notes", "speaker-notes", "slide-counter", "logo-space", "nav", "progress"}
SKIP_TAGS = {"script", "style", "nav", "svg", "noscript"}
NOTE_CLASSES = {"notes", "speaker-notes"}

LAYOUT_MAP = {
    "layout-split": "split", "layout-split-reverse": "split-reverse", "layout-center": "center",
    "layout-stack": "stack", "layout-dark": "dark",
    "l-split-left": "split", "l-split-right": "split-reverse", "l-center": "center",
    "l-stack": "stack", "l-dark": "dark",
}


class Node:
    __slots__ = ("tag", "attrs", "children", "parent")

    def __init__(self, tag, attrs, parent):
        self.tag, self.attrs, self.children, self.parent = tag, dict(attrs), [], parent

    @property
    def classes(self):
        return set((self.attrs.get("class") or "").lower().split())

    def iter(self):
        yield self
        for c in self.children:
            if isinstance(c, Node):
                yield from c.iter()

    def find_all(self, pred):
        return [n for n in self.iter() if pred(n)]


class TreeBuilder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("root", {}, None)
        self.cur = self.root

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs, self.cur)
        self.cur.children.append(node)
        if tag not in VOID:
            self.cur = node

    def handle_startendtag(self, tag, attrs):
        self.cur.children.append(Node(tag, attrs, self.cur))

    def handle_endtag(self, tag):
        n = self.cur
        while n is not self.root and n.tag != tag:   # tolerate unclosed tags
            n = n.parent
        if n is not self.root:
            self.cur = n.parent

    def handle_data(self, data):
        self.cur.children.append(data)


HIDDEN_RE = re.compile(r"(visibility\s*:\s*hidden|display\s*:\s*none|opacity\s*:\s*0(\.0*)?\s*(;|$))", re.I)
BLOCK_TAGS = {"p", "div", "h3", "h4", "h5", "blockquote", "figcaption", "section", "article"}


def skipped(node):
    """Containers we never read: chrome (bottom bar, notes), scripts, and anything
    hidden on this slide (progressive reveals show it on a LATER slide)."""
    return (node.tag in SKIP_TAGS or bool(node.classes & SKIP_CLASSES)
            or "hidden" in node.attrs or "hidden" in node.classes
            or (node.attrs.get("aria-hidden") or "").lower() == "true"
            or bool(HIDDEN_RE.search(node.attrs.get("style") or "")))


def text_of(node, marks=True, exclude=()):
    """Readable text; <strong>/.highlight -> **x**; <br> -> newline."""
    def walk(n):
        out = []
        for c in n.children:
            if isinstance(c, str):
                out.append(c)
                continue
            if c in exclude or skipped(c):
                continue
            if c.tag == "br":
                out.append("\n")
                continue
            if c.attrs.get("data-target") not in (None, ""):
                try:
                    dec = int(c.attrs.get("data-decimals") or 0)
                    out.append(f"{float(c.attrs['data-target']):,.{dec}f}")
                    continue
                except ValueError:
                    pass
            inner = walk(c)
            if marks and (c.tag in ("strong", "b") or "highlight" in c.classes) and inner.strip():
                # keep surrounding spaces OUTSIDE the markers: " **word** "
                lead = inner[: len(inner) - len(inner.lstrip())]
                trail = inner[len(inner.rstrip()):]
                inner = f"{lead}**{inner.strip()}**{trail}"
            out.append(inner)
            if c.tag in ("p", "div", "li", "h1", "h2", "h3", "h4", "tr"):
                out.append(" ")
        return "".join(out)

    s = walk(node)
    s = re.sub(r"[ \t\r\f\v]+", " ", s)
    s = re.sub(r" *\n *", "\n", s)
    s = re.sub(r"\n{2,}", "\n", s)
    return s.strip().strip('"').strip()


def plain(s):
    return re.sub(r"\s+", " ", s.replace("**", "")).strip()


def first(node, pred):
    for n in node.iter():
        if n is not node and not any(skipped(a) for a in ancestors(n, node)) and pred(n):
            return n
    return None


def ancestors(n, stop):
    out, p = [], n.parent
    while p is not None and p is not stop:
        out.append(p)
        p = p.parent
    return out


def inside(n, group):
    return any(a in group for a in ancestors(n, None))


def visible(slide):
    """All nodes in the slide that aren't inside skipped containers."""
    return [n for n in slide.iter() if n is not slide and not skipped(n)
            and not any(skipped(a) for a in ancestors(n, slide))]


# ---------------------------------------------------------------------------

def extract_image(slide, idx, html_dir, review):
    imgs = [n for n in visible(slide) if n.tag == "img" and n.attrs.get("src")]
    src = imgs[0].attrs["src"] if imgs else None
    if not src:
        for n in visible(slide):
            m = re.search(r"background(?:-image)?\s*:[^;]*url\(['\"]?([^'\")]+)", n.attrs.get("style") or "")
            if m:
                src = m.group(1)
                break
    if len(imgs) > 1:
        review.append(f"slide {idx}: {len(imgs)} images (collage); only the first is used")
    if not src:
        return None, None
    if src.startswith("data:image/"):
        m = re.match(r"data:image/(\w+);base64,(.+)", src, re.S)
        if not m:
            review.append(f"slide {idx}: embedded image couldn't be decoded")
            return None, None
        ext = {"jpeg": "jpg", "svg+xml": "svg"}.get(m.group(1), m.group(1))
        out = html_dir / "images" / "_extracted" / f"slide-{idx:03d}.{ext}"
        out.parent.mkdir(parents=True, exist_ok=True)
        try:
            data = base64.b64decode(m.group(2), validate=False)
        except (ValueError, base64.binascii.Error):
            review.append(f"slide {idx}: embedded image couldn't be decoded")
            return None, None
        out.write_bytes(data)
        return out.relative_to(html_dir).as_posix(), None
    if re.match(r"^(https?:)?//", src):
        review.append(f"slide {idx}: image is a web URL; download it into images/ first")
        return None, src
    return src.replace("\\", "/"), None


def extract_slide(slide, idx, html_dir, review):
    entry = {}
    classes = slide.classes
    layout_tok = next((c for c in classes if c in LAYOUT_MAP), None)
    nodes = visible(slide)

    image, image_url = extract_image(slide, idx, html_dir, review)
    placeholder = next((n for n in nodes if "photo-placeholder" in n.classes), None)

    if layout_tok:
        entry["layout"] = LAYOUT_MAP[layout_tok]
    else:
        custom = next((c for c in classes if c.startswith(("layout-", "l-"))), "none")
        entry["layout"] = "split" if (image or placeholder) else "center"
        review.append(f"slide {idx}: custom layout '{custom}' mapped to '{entry['layout']}'")

    h1 = next((n for n in nodes if n.tag == "h1"), None)
    h2s = [n for n in nodes if n.tag == "h2"]
    title_node = h1 or (h2s[0] if h2s else None)
    if title_node:
        entry["title"] = text_of(title_node)
    sub = next((n for n in nodes if "subtitle" in n.classes), None)
    if sub:
        entry["subtitle"] = text_of(sub)
    elif h1 and h2s:
        entry["subtitle"] = text_of(h2s[0])

    used = {n for n in (title_node, sub) if n}
    if h1 and h2s and not sub:
        used.add(h2s[0])

    # Table
    table = next((n for n in nodes if n.tag == "table"), None)
    if table:
        rows = []
        trs = [n for n in table.iter() if n.tag == "tr"]
        for tr in trs:
            cells = [text_of(c) for c in tr.children if isinstance(c, Node) and c.tag in ("td", "th")]
            if any(cells):
                rows.append(cells)
        if rows:
            entry["table"] = rows
            if trs and any(c.tag == "th" for c in trs[0].children if isinstance(c, Node)):
                entry["table_header"] = True
            if trs and "total-row" in trs[-1].classes:
                entry["table_total"] = True
        used.add(table)

    # Cards: >=2 h3 groups, else >=2 elements whose class mentions card/path-box
    cards, card_nodes = [], []
    h3s = [n for n in nodes if n.tag == "h3"]
    if len(h3s) >= 2:
        for h in h3s:
            box = h.parent
            cards.append({"title": text_of(h), "body": text_of(box, exclude=(h,))})
            card_nodes.append(box)
    else:
        boxes = [n for n in nodes if any("card" in c or c.startswith("path-") for c in n.classes)]
        boxes = [b for b in boxes if not any(a in boxes for a in ancestors(b, slide))]   # outermost only
        if len(boxes) >= 2:
            for b in boxes:
                head = first(b, lambda n: n.tag in ("h4", "strong", "b"))
                title = text_of(head, marks=False) if head else ""
                body = text_of(b, exclude=(head,) if head else ())
                cards.append({"title": title or plain(body)[:40], "body": body if title else ""})
                card_nodes.append(b)
    if cards:
        entry["cards"] = cards
        review.append(f"slide {idx}: {len(cards)} cards detected, check titles/bodies")
        used.update(card_nodes)

    grouped = set(used)

    def free(n):
        return n not in grouped and not any(a in grouped for a in ancestors(n, slide))

    bullets = [text_of(n) for n in nodes if n.tag == "li" and free(n)]
    if bullets and not cards:
        entry["bullets"] = [b for b in bullets if b]
    # Body = every "leaf" text block (a <p>, or a styled <div> holding text with no
    # text-bearing block inside it), in reading order.
    def is_leaf_block(n):
        if n.tag not in BLOCK_TAGS or not free(n) or n is sub or not text_of(n):
            return False
        if any(a.tag in ("li", "table") for a in ancestors(n, slide)):
            return False
        return not any(d is not n and d.tag in BLOCK_TAGS | {"li", "table"} and text_of(d)
                       for d in n.iter() if not skipped(d))

    paras = [text_of(n) for n in nodes if is_leaf_block(n)]
    if paras and not cards and not table:
        entry["body"] = "\n".join(paras)

    if image:
        entry["image"] = image
    if placeholder:
        entry["image_description"] = plain(text_of(placeholder, marks=False)).replace("[ YOUR IMAGE ]", "").strip() or "image"
    elif image_url:
        entry["image_description"] = f"web image: {image_url}"

    notes = [text_of(n, marks=False) for n in slide.iter() if n.classes & NOTE_CLASSES or n.tag == "aside"]
    if notes:
        entry["notes"] = "\n".join(t for t in notes if t)

    body_lines = entry.get("body", "").split("\n") if entry.get("body") else []
    tiny = [ln for ln in body_lines if len(plain(ln)) <= 2]
    if len(tiny) >= 2:
        review.append(f"slide {idx}: body has {len(body_lines)} lines ({len(tiny)} are just a symbol or number), "
                      "this looks like a grid (e.g. Core 6 Beliefs) flattened into text; rebuild it as cards or a table")
    elif len(body_lines) > 12:
        review.append(f"slide {idx}: long list ({len(body_lines)} lines), split it across slides or turn it into cards")
    if any(n is not slide and "slide" in n.classes and "data-slide" in n.attrs for n in slide.iter()):
        review.append(f"slide {idx}: another slide is nested inside it (a broken insert), fix the HTML first")

    # Did we miss visible text? (SVG timelines, styled divs, etc.)
    if any(n.tag == "svg" for n in slide.iter()):
        review.append(f"slide {idx}: contains an SVG graphic (timeline/diagram), rebuild it as cards or a table")
    total = len(plain(text_of(slide, marks=False)))
    captured = len(plain(" ".join(str(v) if not isinstance(v, (list, dict)) else json.dumps(v)
                                  for k, v in entry.items() if k in ("title", "subtitle", "body", "bullets", "cards", "table"))))
    if total > 40 and captured < total * 0.7:
        review.append(f"slide {idx}: only ~{int(100 * captured / total)}% of its text was captured, check it")
    return entry


def _is_neutral(hex_color):
    r, g, b = (int(hex_color[i:i + 2], 16) for i in (1, 3, 5))
    return max(r, g, b) - min(r, g, b) < 24        # greys, white, black


def _first_family(value):
    fam = value.split(",")[0].strip().strip("'\"")
    return fam if fam and fam.lower() not in ("inherit", "serif", "sans-serif", "var") else None


def brand_from_css(root, review):
    css = " ".join(c for n in root.iter() if n.tag == "style" for c in n.children if isinstance(c, str))
    inline = " ".join(n.attrs.get("style") or "" for n in root.iter())
    brand = {}
    for var, key in (("--color-primary", "primary"), ("--color-secondary", "secondary"), ("--color-accent", "accent")):
        m = re.search(re.escape(var) + r"\s*:\s*(#[0-9A-Fa-f]{6})\b", css)
        if m:
            brand[key] = m.group(1)
    if brand:
        return brand
    # No CSS variables: guess from the most-used non-grey colors, and the heading/body fonts.
    counts = {}
    for c in re.findall(r"#[0-9A-Fa-f]{6}\b", css + " " + inline):
        c = c.upper()
        if not _is_neutral(c):
            counts[c] = counts.get(c, 0) + 1
    ranked = sorted(counts, key=counts.get, reverse=True)
    for key, color in zip(("primary", "secondary", "accent"), ranked):
        brand[key] = color
    m = re.search(r"h[12][^{]*\{[^}]*font-family\s*:\s*([^;}]+)", css)
    if m and _first_family(m.group(1)):
        brand["heading_font"] = _first_family(m.group(1))
    m = re.search(r"body[^{]*\{[^}]*font-family\s*:\s*([^;}]+)", css)
    if m and _first_family(m.group(1)):
        brand["body_font"] = _first_family(m.group(1))
    review.append("brand: the deck has no CSS color variables, so colors/fonts were GUESSED "
                  f"({', '.join(f'{k}={v}' for k, v in brand.items()) or 'nothing found'}); "
                  "confirm against design-choices.md or the live deck before building")
    return brand


def parse(html_path):
    tb = TreeBuilder()
    raw = Path(html_path).read_bytes()
    try:
        html = raw.decode("utf-8")
    except UnicodeDecodeError:           # older decks saved as Windows-1252
        html = raw.decode("cp1252", errors="replace")
    tb.feed(html)
    slides = tb.root.find_all(lambda n: "slide" in n.classes and "data-slide" in n.attrs)
    # Outermost only (nested .slide elements are rare but possible)
    slides = [s for s in slides if not any(a in slides for a in ancestors(s, None))]
    return tb.root, slides


def _content(entry):
    parts = [entry.get("title", ""), entry.get("subtitle", ""), entry.get("body", "")]
    parts += [str(b) for b in entry.get("bullets", []) or []]
    for c in entry.get("cards", []) or []:
        if isinstance(c, dict):
            parts += [str(c.get("title", "")), str(c.get("body", ""))]
    for row in entry.get("table", []) or []:
        parts += [str(x) for x in row]
    return plain(" ".join(str(x) for x in parts))


def check(html_path, manifest_path):
    _, slides = parse(html_path)
    try:
        data = json.loads(Path(manifest_path).read_text(encoding="utf-8"))
    except FileNotFoundError:
        return [f"can't find {manifest_path}"]
    except json.JSONDecodeError as exc:
        return [f"{manifest_path} isn't valid JSON (line {exc.lineno}): {exc.msg}"]
    entries = data.get("slides", []) if isinstance(data, dict) else []
    diffs = []
    if len(entries) != len(slides):
        diffs.append(f"slide count: HTML has {len(slides)}, slides.json has {len(entries)}")
    html_dir = Path(html_path).parent
    for i, (node, entry) in enumerate(zip(slides, entries), start=1):
        h = extract_slide(node, i, html_dir, [])
        if not isinstance(entry, dict):
            diffs.append(f"slide {i}: entry isn't an object")
            continue
        if plain(h.get("title", "")) != plain(str(entry.get("title", ""))):
            diffs.append(f"slide {i}: title differs\n    HTML: {plain(h.get('title', ''))!r}\n    JSON: {plain(str(entry.get('title', '')))!r}")
        elif not entry.get("manual") and _content(h) != _content(entry):
            diffs.append(f"slide {i}: text differs from the HTML (if you rebuilt this slide by hand on purpose, "
                         'add "manual": true to its entry)')
    return diffs


def main():
    ap = argparse.ArgumentParser(description="Extract slides.json from a Webinar Dev Bot HTML deck")
    ap.add_argument("html")
    ap.add_argument("--out", help="Output path (default: slides.json next to the HTML)")
    ap.add_argument("--force", action="store_true", help="Overwrite an existing slides.json")
    ap.add_argument("--check", metavar="SLIDES_JSON", help="Compare an existing slides.json to the HTML")
    args = ap.parse_args()
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass

    html_path = Path(args.html)
    if not html_path.exists():
        print(f"ERROR: can't find {html_path}")
        sys.exit(1)

    if args.check:
        diffs = check(html_path, args.check)
        for d in diffs:
            print(f"DIFF: {d}")
        print("In sync with the HTML." if not diffs else f"{len(diffs)} difference(s). Re-extract or fix slides.json.")
        sys.exit(1 if diffs else 0)

    out = Path(args.out) if args.out else html_path.with_name("slides.json")
    if out.exists() and not args.force:
        print(f"ERROR: {out.name} already exists (it may have hand edits). Use --force to overwrite, or --check to compare.")
        sys.exit(1)

    root, slides = parse(html_path)
    if not slides:
        print("ERROR: no slides found (expected elements with class=\"slide\" and a data-slide attribute).")
        sys.exit(1)
    review = []
    html_dir = html_path.parent
    entries = [extract_slide(s, i, html_dir, review) for i, s in enumerate(slides, start=1)]
    title_node = next((n for n in root.iter() if n.tag == "title"), None)
    manifest = {"title": text_of(title_node, marks=False) if title_node else html_path.stem,
                "brand": brand_from_css(root, review), "slides": entries}
    out.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    for r in review:
        print(f"REVIEW: {r}")
    print(f"Extracted {len(entries)} slides -> {out} ({len(review)} to review)")
    sys.exit(2 if review else 0)


if __name__ == "__main__":
    main()
