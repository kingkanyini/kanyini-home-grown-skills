(async function () {
  const dataPath = window.__DATA_PATH__ || "./data.json";
  const res = await fetch(dataPath);
  const data = await res.json();

  const slideImg = document.getElementById("slide-image");
  const slideCaption = document.getElementById("slide-caption");
  const currentTitle = document.getElementById("current-title");
  const breadcrumb = document.getElementById("breadcrumb");
  const drawer = document.getElementById("examples-drawer");
  const toggle = document.getElementById("examples-toggle");
  const grid = document.getElementById("examples-grid");
  const showAll = document.getElementById("show-all-examples");

  toggle.addEventListener("click", () => {
    const open = drawer.hidden;
    drawer.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
  });
  showAll.addEventListener("change", renderExamples);
  window.addEventListener("hashchange", render);

  function parseHash() {
    const h = (location.hash || "").replace(/^#/, "");
    const m = h.match(/^(ch\d+)(?:\.(sec\d+))?$/);
    if (!m) return { chapter: null, section: null };
    return { chapter: m[1], section: m[2] || null };
  }

  function chapterKeyFromShort(shortKey) {
    if (!shortKey) return null;
    const match = Object.keys(data.sections_map).find(k => k.startsWith(shortKey + "_"));
    return match || null;
  }

  function render() {
    const { chapter, section } = parseHash();
    const chapterKey = chapterKeyFromShort(chapter);
    if (!chapterKey) {
      currentTitle.textContent = "Webinar Forge Companion";
      breadcrumb.textContent = "Waiting for Claude to send a section...";
      slideImg.src = "";
      slideImg.alt = "";
      slideCaption.textContent = "Use #ch1.sec1 through #ch5.secN in the URL hash.";
      renderExamples();
      return;
    }
    const secList = data.sections_map[chapterKey] || [];
    if (!section) {
      currentTitle.textContent = chapterKey.replace(/_/g, " ");
      breadcrumb.textContent = "Chapter intro - " + secList.length + " sections";
      slideImg.src = "./slides/" + chapter + "-intro.png";
      slideImg.alt = "Slides you will build in this chapter";
      slideCaption.textContent = "These are the slides you will forge in this chapter.";
    } else {
      const sec = secList.find(s => s.id === section);
      if (!sec) {
        currentTitle.textContent = chapterKey;
        breadcrumb.textContent = "Unknown section " + section;
        slideImg.src = "";
        slideCaption.textContent = "";
      } else {
        currentTitle.textContent = sec.title;
        breadcrumb.textContent = chapterKey.replace(/_/g, " ") + " / " + sec.id;
        slideImg.src = "./slides/" + sec.companion_slide_id + "-teaching.png";
        slideImg.alt = sec.title;
        slideCaption.textContent = sec.title;
      }
    }
    renderExamples();
  }

  function renderExamples() {
    const { chapter } = parseHash();
    const chapterKey = chapterKeyFromShort(chapter);
    grid.innerHTML = "";
    const allExamples = [];
    for (const [chKey, secs] of Object.entries(data.sections_map)) {
      for (const sec of secs) {
        const bankEntry = (data.interview_bank[chKey] || {})[sec.id];
        if (!bankEntry) continue;
        for (const ex of bankEntry.example_moments || []) {
          allExamples.push({ chapterKey: chKey, sec, ex });
        }
      }
    }
    const filtered = showAll.checked || !chapterKey
      ? allExamples
      : allExamples.filter(e => e.chapterKey === chapterKey);
    for (const e of filtered) {
      const tile = document.createElement("figure");
      const img = document.createElement("img");
      img.src = "./slides/" + (e.ex.image_path || "");
      img.alt = e.ex.what_illustrates || "";
      const cap = document.createElement("figcaption");
      cap.textContent = (e.ex.what_illustrates || "") + " (" + e.chapterKey + " / " + e.sec.id + ")";
      tile.appendChild(img);
      tile.appendChild(cap);
      grid.appendChild(tile);
    }
  }

  render();
})();
