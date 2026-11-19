# Live Competition Board — Design

Date: 2026-11-16. Competition: 21–22 Nov 2026 (Zoom). Size: a project, small-to-medium.

## Intent and why

During the competition the homepage becomes the single source of truth for participants.
The first thing they see is a large status ("ROUND 1 IN PROGRESS", "ROUND 1 ENDED — RETURN TO
THE MAIN ROOM") with where to go. Below it: announcements, then secondary material (team
rooms, Zoom links, schedule), then the rest of the existing site.

Everything is built and tested **before** the day. On the day the owner edits one JSON file
(or tells Claude the gist and Claude edits it), previews on localhost, and pushes.

## Goals

- Status + "where to go" is unmissable in the first second, on phones too.
- Participants see changes within ~1 minute of a push without reloading.
- Updating takes seconds: edit one file, preview, push.
- Safe against typos: a bad edit never blanks or breaks the page for participants.

## Non-goals

- Instant (sub-minute) updates, a backend, auth, or an admin UI (option C, rejected).
- A CLI helper (option B, not chosen). Editing is by hand / by Claude.
- Per-team personalised views.

## Anti-goals

- A broken or empty board mid-round because of a malformed edit.
- The board showing stale info with no sign that it is stale.
- Having to touch HTML/CSS/JS on the day.

## Constraints

- Static site on GitHub Pages; push → live in ~30–90s. No new dependencies or build step.
- Follow existing patterns: ES modules in `js/*.mjs` with `node:test` tests, wired up from
  `js/app.js`, styling in `style.css` using existing tokens.

## Approaches considered

- **A. One `data/live.json`, hand-edited (chosen).** Simplest, nothing to break.
  Weakness: easy to make a JSON typo → mitigated by page-side resilience + a validate command.
- B. `live.json` plus a Node CLI (`live round-start 1`). Fewer typos, more to build/maintain.
  Not chosen.
- C. Firebase/Apps Script admin page. Instant, but new backend and a failure point during the
  event. Not chosen.

The owner accepted ~1 minute of latency.

## Design

### Data: `data/live.json`

```json
{
  "enabled": false,
  "state": "round",
  "headline": "ROUND 1 IN PROGRESS",
  "instruction": "Stay in your team breakout room.",
  "button": { "label": "Open Zoom", "url": "https://zoom.us/j/..." },
  "updated": "2026-11-21T14:32:00+08:00",
  "announcements": [
    { "time": "2026-11-21T14:30:00+08:00", "text": "Judges are joining the rooms.", "pinned": false }
  ],
  "schedule": [{ "time": "2026-11-21T14:00:00+08:00", "label": "Round 1" }],
  "links": [{ "label": "Main room (Zoom)", "url": "https://..." }],
  "rooms": [{ "team": "Team name", "school": "School", "room": "Room 4" }]
}
```

- `enabled: false` → site looks exactly as today. `true` → live board takes over the top.
- `state` is one of `round`, `main-room`, `break`, `info`, `finished`. It drives colour/icon
  only; `headline` and `instruction` are free text, so Claude/owner can word anything.
- `button`, `announcements`, `schedule`, `links`, `rooms` are all optional; empty sections
  are not rendered.

### Page behaviour

- When enabled, the live board **replaces the hero**; below it come announcements
  (newest first, pinned on top), then a "Competition info" block (rooms, links, schedule),
  then the existing sections unchanged.
- `js/live.mjs` (pure render + validation) and a small poller in `js/app.js`.
- Poll `data/live.json?t=<timestamp>` every 20s; pause while the tab is hidden and refetch
  immediately on becoming visible.
- On fetch/parse/validation failure: keep the last good render, show a quiet "Reconnecting…"
  next to the updated time. On first load failure: show the normal homepage.
- Shows "Updated HH:MM" (viewer's local time zone, with the zone abbreviation). Announcement
  and schedule times likewise render in the viewer's local zone.
- Headline changes are announced to screen readers (`aria-live="polite"`); the LIVE dot
  animation respects `prefers-reduced-motion`.
- Visual: reuses the existing palette/type; large display headline; state colours (e.g.
  round = accent, main-room = attention colour, finished = calm). Final look verified in the
  browser at phone and desktop widths.

### Day-of workflow

1. Edit `data/live.json` (or tell Claude the gist).
2. `node js/live-validate.mjs` — fails loudly on any schema error.
3. Preview on localhost (`python3 -m http.server`).
4. `git commit` + `git push`.

`docs/live-day-cheatsheet.md` holds ready-to-paste JSON blocks for every state (before start,
round N in progress, round ended / return to main room, break, finished), plus these steps.

### Testing

`node:test` for: validation (good/bad files), render output per state, escaping of
announcement text (no HTML injection), ordering/pinning, empty-section omission, time
formatting. Manual browser check of all states on localhost before the day.

## Calls made by Claude (not discussed — please check)

1. Live board replaces the hero (register CTAs are irrelevant during the event) rather than
   sitting above it.
2. `state` is a small fixed set controlling style only; wording is free text.
3. Times render in the viewer's local time zone (participants are worldwide).
4. 20s polling, paused when the tab is hidden.
5. Added a small validate command (`js/live-validate.mjs`) despite choosing A, because it is
   cheap insurance against typos. No other tooling.
6. Rooms/links/schedule come from the same JSON and are hidden when empty; the owner fills
   them in beforehand.
7. A brief flash of the normal hero before the board appears on first load is accepted.

## Left to the builder

Exact CSS, colours per state, markup details, test file layout, and the precise validation
error messages.
