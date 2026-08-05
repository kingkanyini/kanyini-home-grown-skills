# Artgrid Browser Integration Reference

> Reference file for Phase 6: Artgrid Browser Integration.
> Contains Playwright patterns, element selectors, and workflow sequences validated during the example-collective POC.

---

## Critical Platform Note

**The platform is artgrid.io, NOT artlist.io.**

Artgrid and Artlist are separate products under the same parent company. B-roll footage lives on Artgrid. Music lives on Artlist. All URLs, prompts, and UI text in this skill must use `artgrid.io`.

---

## Authentication

- **No Chrome profile available.** Playwright opens default Chromium, not the user's Chrome.
- **User must sign in manually.** After opening artgrid.io, wait for user confirmation before proceeding.
- **NEVER close the browser during sign-in.** The user sees the Playwright browser window and is actively interacting with it. Closing it mid-login destroys the session.
- **Session persists within Phase 6.** Once logged in, all subsequent searches and actions use the same browser session.

### Login Flow
1. Navigate to `https://artgrid.io`
2. Display message: "Artgrid is open. Please sign in if needed. Let me know when you are ready to continue."
3. AskUserQuestion: "I'm logged in and ready" / "I need help signing in" / "Skip Artgrid sourcing"
4. If help needed: guide user to click "Log In" in top right, enter credentials. Do NOT type credentials via Playwright.

---

## Search Flow

### Step 1: Navigate to Search
- Start at `https://artgrid.io` (or current page if already on the site)
- Click the search combobox (selector: `combobox "What are you looking for ?"`)
- Type the search term
- Press Enter

### Step 2: View Results
- Results load as a grid of video thumbnails (`figure` elements)
- Each result shows: thumbnail preview, title, filmmaker name
- Hover over a thumbnail to see clip preview (auto-plays short loop)
- Screenshot the results grid for user review

### Step 3: Browse Clip Details
- Click on a clip thumbnail to open full details page
- URL pattern: `https://artgrid.io/clip/{ID}/{slug}`
- Details page shows: full preview video, resolution, fps, camera, duration, tags, story link
- Filmmaker attribution: `link "By {Filmmaker}"`
- Story link leads to all clips by the same filmmaker in the same shoot

### Search URL Format
For generating direct search links in the playbook:
```
https://artgrid.io/?search={QUERY_WITH_PLUS_SIGNS}
```
Spaces in search terms become `+` in URLs. Example:
```
https://artgrid.io/?search=couple+in+bed+emotional+distance
```

---

## Collection Management

### Creating a Collection
1. Open any clip details page
2. Click "Add to collection" button
3. In the dialog, type a new collection name (use project slug, e.g., "example-collective")
4. Click "Create" button
5. Collection is created and clip is added

### Adding Clips to Existing Collection
1. Open clip details page
2. Click "Add to collection"
3. Collection list appears as `listitem` elements with collection names
4. Click "Add" button next to the target collection name
5. If "Remove" button appears instead, the clip is already in the collection

### Accessing Collections
1. Click "Chris's Footage" in top navigation bar
2. Go to "My Collections" tab
3. Collections listed with clip counts
4. Click on a collection name to browse its contents

### Getting Shareable URL
1. Inside a collection view, click the "Share" icon
2. A dialog opens with a `textbox` containing the shareable URL
3. URL format: `https://artgrid.io/my-collection/{ID}/{slug}`
4. Click `button "copy to clipboard"` to copy (or read the textbox value directly)

---

## Story Bundles

Artgrid organizes clips into "stories" by filmmakers. Each story contains multiple clips shot during the same session with the same actors/setting/camera.

### Why Stories Matter
- **Visual thread consistency:** All clips in a story share the same actors, lighting, camera, and setting
- **Ideal for bookend pairs:** Find the "before" and "after" clips in the same story
- **Efficient sourcing:** One story can provide multiple B-roll moments for the same thread
- **Example:** "Complex Marriage" by Azulroto contains 15+ clips of the same couple, shot on Arri Amira 4K

### Browsing Stories
- On a clip details page, click the story link (usually near the filmmaker name)
- URL pattern: `https://artgrid.io/story/{ID}/{slug}`
- Story page shows all clips in the collection
- Browse clips within the story and add relevant ones to the project collection

---

## Existing Collections Scan (Opt-In)

This is an OPTIONAL step. The user decides which collections to scan.

### When to Offer
- After the project collection is created
- AskUserQuestion: "Want to scan your existing Artgrid collections for reusable clips?" / "Skip"

### Scan Flow
1. Navigate to "My Collections" tab
2. Screenshot the list of collections with names and clip counts
3. Present list to user via AskUserQuestion: "Which collections should I scan? Select all that apply." with collection names as options
4. For each selected collection:
   - Open the collection
   - Screenshot its contents
   - Flag any clips that appear in 3+ other project collections as "potentially overused"
5. Report findings: "Found {N} potentially relevant clips across {M} collections. {X} flagged as overused."

### Rules
- NEVER scan all collections automatically. User must select.
- NEVER delete or modify existing collections. Read-only browsing.
- Flag overuse as a suggestion, not a restriction. The user decides.

---

## Key Element Selectors (from POC)

These selectors were validated during the example-collective POC session. They may change if Artgrid updates their UI. If a selector fails, take a snapshot and identify the new selector.

| Element | Selector | Notes |
|---------|----------|-------|
| Search box | `combobox "What are you looking for ?"` | Main search input |
| Results grid items | `figure` | Each clip in search results |
| Clip link | `link "By {Filmmaker}"` | Links to clip detail page |
| Clip detail URL | `/clip/{ID}/{slug}` | Pattern in browser URL |
| Add to collection | text `"Add to collection"` | Button on clip detail page |
| Collection list items | `listitem` | In the add-to-collection dialog |
| Create collection | button with text `"Create"` | After typing new name |
| Add to collection | button with text `"Add"` | Next to existing collection name |
| Remove from collection | button with text `"Remove"` | Confirms clip is already added |
| Share button | Share icon within collection view | Opens share dialog |
| Share URL textbox | `textbox` in share dialog | Contains the shareable URL |
| Copy URL | `button "copy to clipboard"` | In share dialog |
| My Collections tab | Tab or nav element "My Collections" | Under "Chris's Footage" nav |

---

## Error Handling

### Search Returns No Results
- Try broader search terms (remove adjectives, use 2-3 words max)
- Try alternative phrasing from the production brief's search term list
- Report to user: "No results for '{term}'. Try these alternatives: {alt_terms}"

### Clip Detail Page Fails to Load
- Wait 5 seconds, retry once
- If still failing, screenshot the error and report to user
- Skip this clip and move to the next search term

### Collection Dialog Doesn't Open
- Take a snapshot to identify current UI state
- Try clicking the clip thumbnail first to ensure we are on the detail page
- If still failing, offer manual fallback: "Add this clip to your collection manually. The clip URL is: {url}"

### Login Session Expires
- If any action returns a login page, notify user: "Your Artgrid session expired. Please log in again."
- Wait for user confirmation before continuing
- NEVER attempt to re-login automatically

---

## Workflow Summary (Phase 6 Sequence)

```
1. Ask user: Open Artgrid? / Skip
2. If yes: Navigate to artgrid.io
3. Wait for user login
4. Create project collection (named after project slug)
5. For each thread with Artgrid-sourced moments:
   a. Read search terms from production brief
   b. Run search on artgrid.io
   c. Screenshot results
   d. AskUserQuestion: which clips to save? (show thumbnails in screenshot)
   e. Add selected clips to collection
   f. Check for story bundles (offer to browse related clips)
6. Get collection shareable URL
7. Store URL in registry (artgrid.collection_url)
8. OPTIONAL: Scan existing collections
9. Report summary: clips added, collection URL, stories found
```
