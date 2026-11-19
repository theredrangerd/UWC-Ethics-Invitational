# Live Competition Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the homepage into a live competition status board driven by one hand-edited `data/live.json`.

**Architecture:** Pure ES modules (`js/live-schema.mjs` validation, `js/live-render.mjs` HTML rendering) tested with `node:test`; a small browser poller (`js/live.mjs`) fetches `data/live.json` every 20s and swaps the hero for the board when `enabled` is true. A `node js/live-validate.mjs` command checks the file before a push.

**Tech Stack:** Vanilla HTML/CSS/ES modules, `node:test` (no dependencies, no build step), GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-11-16-live-board-design.md`

**Branch:** `comp-day`

## Global Constraints

- Static site on GitHub Pages; no new dependencies, no build step.
- Follow existing patterns: `js/*.mjs` modules + `*.test.mjs` beside them, wired from `js/app.js`; styling in `style.css` using existing `:root` tokens.
- `enabled: false` (or any first-load failure) must leave the site exactly as it is today.
- `state` is one of `round`, `main-room`, `break`, `info`, `finished` and only controls style; `headline`/`instruction` are free text.
- Poll `data/live.json?t=<timestamp>` every 20s; pause while the tab is hidden, refetch on becoming visible.
- On fetch/parse/validation failure after a good render: keep the last good render and show "Reconnecting…".
- Times render in the viewer's local time zone with zone abbreviation.
- `aria-live="polite"` on the headline; LIVE dot animation respects `prefers-reduced-motion`.
- Run tests with `node --test js/`.

## Review Focus

1. Announcement/link text containing HTML (`<script>`, `&`) — must render as text, never markup.
2. A `javascript:` (or other non-http/https) URL in `button.url` or `links[].url` — rejected by validation and never rendered as an `href`.
3. A malformed/half-typed `live.json` (trailing comma, missing field) mid-event — page keeps the last good board; first-load failure shows the normal homepage.
4. An announcement or schedule entry with an unparseable `time` — validator reports it; renderer does not throw if it slips through.
5. Empty `announcements`/`schedule`/`links`/`rooms` — sections omitted entirely, no empty headings.

---

### Task 1: Schema validation and validate command

**Files:**
- Create: `js/live-schema.mjs`, `js/live-schema.test.mjs`, `js/live-validate.mjs`, `data/live.json`

**Interfaces:**
- Produces: `validateLive(data: unknown): { ok: boolean, errors: string[] }`; exported `LIVE_STATES: string[]`; `isHttpUrl(s: unknown): boolean`.
- `data/live.json` ships disabled (`"enabled": false`, `"state": "info"`, headline "Welcome", `updated` 2026-11-21T09:00:00+08:00) but pre-filled with the organisers' official schedule and Zoom details (below), so on the day only status/announcements change.
  - `links`: `[{ "label": "Join Zoom — Meeting ID 862 5138 8707 · Passcode 123456", "url": "https://us06web.zoom.us/j/86251388707?pwd=oaUyUbQxPxph14EGvAWgoWaNagFeke.1" }]`; `button` is `null` in the shipped file.
  - `schedule` (all 21 Nov 2026 SGT, +08:00, except the last): 19:00 "Registration & Opening Ceremony / Briefing"; 19:30 "Heat 1"; 20:55 "Heat 2"; 22:20 "Heat 3"; 23:35 "Announcements (between Heat 3 and Heat 4)"; Heat 4 at `2026-11-21T23:50:00+08:00`. Participants must join Zoom by 19:00 SGT.
  - `announcements` and `rooms` are empty arrays.
- Terminology: the organisers call the four sessions **Heats**; use "Heat" (not "Round") in the sample and cheat sheet wording.

- [ ] **Step 1: Write failing tests** in `js/live-schema.test.mjs`: minimal valid file → `{ok:true, errors:[]}`; non-object → not ok; `enabled` not boolean → error mentioning `enabled`; `state: "bogus"` → error mentioning `state`; empty `headline` → error mentioning `headline`; `updated: "not a date"` → error mentioning `updated`; `button: {label:"Go", url:"javascript:alert(1)"}` → error mentioning `button.url`; `button: null` valid; `announcements: [{time:"x", text:"hi"}]` → error mentioning `announcements[0].time`; announcement with empty `text` → error mentioning `announcements[0].text`; `rooms: [{team:"A"}]` → error mentioning `rooms[0].room`; `links` entry with `ftp://` url → error mentioning `links[0].url`; `schedule` entry with bad time → error mentioning `schedule[0].time`; omitted optional arrays valid.
- [ ] **Step 2: Run** `node --test js/live-schema.test.mjs` — expect FAIL (module missing).
- [ ] **Step 3: Implement** `validateLive` per the spec schema, collecting all errors (not stopping at the first) with path-style messages. Required: `enabled`, `state`, `headline`, `updated`. Optional: `instruction` (string), `button`, `announcements[{time,text,pinned?}]`, `schedule[{time,label}]`, `links[{label,url}]`, `rooms[{team,school?,room}]`.
- [ ] **Step 4: Run** the test — expect PASS.
- [ ] **Step 5: Implement `js/live-validate.mjs`:** reads `data/live.json` (path relative to the script via `import.meta.url`), prints `live.json OK` and exits 0, or prints each error / the JSON parse error and exits 1. Create `data/live.json` as specified in Interfaces. Verify: `node js/live-validate.mjs` prints `live.json OK`; temporarily break the JSON and confirm exit code 1.
- [ ] **Step 6: Commit** — `git add js/live-schema.mjs js/live-schema.test.mjs js/live-validate.mjs data/live.json && git commit -m "Add live.json schema validation and validate command"`

### Task 2: Live board rendering

**Files:**
- Create: `js/live-render.mjs`, `js/live-render.test.mjs`

**Interfaces:**
- Consumes: `isHttpUrl` from `js/live-schema.mjs`.
- Produces:
  - `formatTime(iso: string, opts?: { timeZone?: string, locale?: string }): string` — `HH:MM` plus short zone name; returns `''` for an unparseable date.
  - `renderLiveBoardHTML(live, opts?): string` — status panel: LIVE marker with `data-state="<state>"` on the root element, headline inside an `aria-live="polite"` wrapper, instruction, optional button (`<a class="btn btn--primary btn--lg" target="_blank" rel="noopener">`), and `<p class="live__updated">Updated <time>…</time> <span class="live__note" data-live-note hidden>Reconnecting…</span></p>`.
  - `renderLiveAnnouncementsHTML(live, opts?): string` — pinned first, then newest first; `''` when none.
  - `renderLiveInfoHTML(live, opts?): string` — rooms table, links list, schedule (ascending by time); each subsection omitted when empty; `''` when all empty.
  - All `opts` are `{ timeZone?, locale? }`, passed to `formatTime`.

- [ ] **Step 1: Write failing tests** in `js/live-render.test.mjs` using `timeZone: 'Asia/Singapore', locale: 'en-GB'`: `formatTime('2026-11-21T14:32:00+08:00', …)` starts with `14:32`; `formatTime('garbage')` is `''`; board HTML contains `data-state="round"`, the headline, `aria-live="polite"`; headline `<script>alert(1)</script>` appears escaped and no raw `<script>` is in output; button with `javascript:` URL renders no `href="javascript:`; no `button` → no `<a class="btn`; announcements: pinned item precedes a newer unpinned one, and unpinned are newest-first; announcement text `a & <b>` is escaped; an announcement with a bad `time` does not throw and still renders its text; announcements empty → `''`; info: empty everything → `''`; rooms only → contains table/rows but not the words "Schedule" or "Links"; schedule rendered in ascending time order.
- [ ] **Step 2: Run** `node --test js/live-render.test.mjs` — expect FAIL.
- [ ] **Step 3: Implement** the four functions. Copy the `escapeHTML` approach from `js/results-render.mjs` (it is not exported, so duplicate the 5-line helper rather than refactoring). Use `Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short', timeZone })`; wrap in try/catch to return `''`. Class names: `live`, `live__headline`, `live__instruction`, `live__updated`, `live__note`, `live-announcements`, `live-info`.
- [ ] **Step 4: Run** the test — expect PASS.
- [ ] **Step 5: Commit** — `git add js/live-render.mjs js/live-render.test.mjs && git commit -m "Add live board renderers"`

### Task 3: Page wiring, poller and styling

**Files:**
- Modify: `index.html` (hero section at line 32, `<main>` at line 31), `js/app.js:93-96`, `style.css` (append a "Live board" section)
- Create: `js/live.mjs`

**Interfaces:**
- Consumes: `validateLive`, `renderLiveBoardHTML`, `renderLiveAnnouncementsHTML`, `renderLiveInfoHTML`.
- Produces: `initLive(): void` — starts polling; no-op if the containers are missing.

- [ ] **Step 1: index.html** — immediately before the `<section id="hero">`, add `<section id="live-board" class="live" hidden aria-label="Live competition status"><div class="container" id="live-board-root"></div></section>`; immediately after the hero's closing `</section>` and before the `ornament-divider` div add `<section id="live-info" class="live-details" hidden><div class="container container--narrow" id="live-info-root"></div></section>`. Leave hero markup unchanged (poller hides it via `hidden`).
- [ ] **Step 2: Implement `initLive` in `js/live.mjs`.** Behaviour:
  - `poll()`: `fetch('data/live.json?t=' + Date.now(), { cache: 'no-store' })`; require `res.ok`; read text; if text equals the last applied raw text, only clear the reconnecting note and return; else `JSON.parse` + `validateLive`; on any failure call `setReconnecting(true)` if a board has already rendered, otherwise do nothing (normal homepage stays).
  - `apply(data)`: if `!data.enabled` → hide board/info, un-hide `#hero`; else render board into `#live-board-root`, announcements + info into `#live-info-root`, un-hide both sections, hide `#hero`, set `document.title` to `<headline> · UWC Ethics Invitational 2026`.
  - Schedule `setInterval(poll, 20000)`; skip while `document.hidden`; on `visibilitychange` to visible call `poll()` immediately; first `poll()` runs on init.
  - `setReconnecting(on)` toggles `hidden` on `[data-live-note]`.
- [ ] **Step 3: app.js** — `import { initLive } from './live.mjs';` and call `initLive();` after `initRegistrationCTA();`.
- [ ] **Step 4: CSS** appended to `style.css`, using existing tokens: `[hidden]` safeguard (`.live[hidden], .live-details[hidden], .hero[hidden] { display: none; }`); `.live` full-bleed panel with large `.live__headline` (`clamp(2.4rem, 8vw, 5rem)`, `--font-display`), readable `.live__instruction`, centered, min-height ≈ 70vh on desktop and no horizontal overflow at 360px; per-state accent via `.live[data-state="round"|"main-room"|"break"|"info"|"finished"]` setting a local `--live-accent` (round = gold, main-room = a distinct attention colour that is not gold, finished = silver/calm); pulsing "LIVE" dot, disabled under `@media (prefers-reduced-motion: reduce)`; styles for announcements list, rooms table, links, schedule, and `.live__note`.
- [ ] **Step 5: Verify in browser.** From the repo root run `python3 -m http.server 8000`. With `enabled: false`: homepage is unchanged. Temporarily set `enabled: true` and cycle through every `state` value with realistic content (announcements incl. a pinned one, rooms, links, schedule): confirm board replaces hero, headline readable at 375px and 1280px widths, info block appears below, rest of site intact. Edit the JSON while the page is open and confirm it updates within ~20s without reload. Introduce a trailing comma and confirm the board stays and "Reconnecting…" appears; fix it and confirm the note clears. Revert `data/live.json` to the shipped disabled sample afterwards.
- [ ] **Step 6: Run** `node --test js/` — all tests pass.
- [ ] **Step 7: Commit** — `git add index.html js/live.mjs js/app.js style.css && git commit -m "Wire live board into homepage with polling and styles"`

### Task 4: Day-of cheat sheet

**Files:**
- Create: `docs/live-day-cheatsheet.md`

- [ ] **Step 1: Write the cheat sheet** with: the 4-step day-of workflow (edit `data/live.json` → `node js/live-validate.mjs` → `python3 -m http.server 8000` and check `http://localhost:8000` → `git add data/live.json && git commit -m "Live update" && git push`); one paste-ready, valid JSON block per state — before start, heat in progress, heat ended / return to the main room, between-heats break, announcements, finished (each carrying the full schedule and Zoom link above) — each with the full set of fields (comment lines noting which are optional, kept outside the JSON blocks since JSON has no comments); a field reference table; a note that pushes take ~30–90s to reach participants and that `"enabled": false` returns the site to normal.
- [ ] **Step 2: Verify** every JSON block in the sheet passes the validator: paste each into `data/live.json` in turn and run `node js/live-validate.mjs` (expect `live.json OK`), then restore the shipped sample.
- [ ] **Step 3: Commit** — `git add docs/live-day-cheatsheet.md && git commit -m "Add live day cheat sheet"`

---

## Self-Review

- **Spec coverage:** schema/validate command → Task 1; rendering, pinning, escaping, empty sections, time zone → Task 2; replace-hero, polling, pause when hidden, reconnecting, aria-live, reduced motion, state styling → Task 3; cheat sheet/day-of workflow → Task 4. Spec's "brief flash of hero accepted" requires no work.
- **Types:** `validateLive`, `isHttpUrl`, `formatTime`, `renderLive*HTML`, `initLive` are named identically wherever consumed.
- **Proportion:** plan is a few times the spec's length, but each step records decisions (names, assertions, behaviours), not code bodies.
