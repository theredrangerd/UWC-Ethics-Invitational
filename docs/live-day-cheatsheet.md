# Live board — competition day cheat sheet

The homepage shows a live status board when `data/live.json` has `"enabled": true`. Set it to `false` and the site returns to normal.

## Day-of workflow

1. Edit `data/live.json` (or tell Claude the gist and Claude edits it).
2. Check it: `node js/live-validate.mjs` — must print `live.json OK`.
3. Preview: `python3 -m http.server 8000`, then open <http://localhost:8000>.
4. Publish: `git add data/live.json && git commit -m "Live update" && git push`.

Pushes reach participants in about 30–90 seconds. Open pages re-check every 20 seconds, so nobody needs to reload. If a published edit is broken, participants keep seeing the last good board with a small "Reconnecting…" note.

## Fields

| Field | Required | Notes |
|---|---|---|
| `enabled` | yes | `true` shows the board and hides the normal hero; `false` = normal site |
| `state` | yes | `round`, `main-room`, `break`, `info`, `finished` — only changes colour |
| `headline` | yes | Big text. Free wording. |
| `instruction` | no | Line under the headline: where to go / what to do |
| `button` | no | `{ "label", "url" }` (http/https) or `null` |
| `updated` | yes | When you made this edit, ISO format with `+08:00` for Singapore |
| `announcements` | no | `{ "time", "text", "pinned" }`; pinned first, then newest first |
| `schedule` | no | `{ "time", "label" }`; shown in each viewer's local time |
| `links` | no | `{ "label", "url" }` |
| `rooms` | no | `{ "team", "school", "room" }` |

Empty lists are fine; empty sections are hidden. Times are shown to each viewer in their own time zone. The organisers call the sessions **Heats**; the final one (Heat 4) starts 23:50 SGT on 21 Nov and runs past midnight.

## Paste-ready states

Each block below is a complete, validated `data/live.json`. Replace the whole file, then change `updated` (and the heat number / times) to suit.

### 1. Before the competition starts

```json
{
  "enabled": true,
  "state": "info",
  "headline": "WELCOME — WE START AT 7:00 PM SGT",
  "instruction": "Join the Zoom main room by 7:00 PM Singapore Time.",
  "button": {
    "label": "Open Zoom",
    "url": "https://us06web.zoom.us/j/86251388707?pwd=oaUyUbQxPxph14EGvAWgoWaNagFeke.1"
  },
  "updated": "2026-11-21T19:32:00+08:00",
  "announcements": [],
  "schedule": [
    {
      "time": "2026-11-21T19:00:00+08:00",
      "label": "Registration & Opening Ceremony / Briefing"
    },
    {
      "time": "2026-11-21T19:30:00+08:00",
      "label": "Heat 1"
    },
    {
      "time": "2026-11-21T20:55:00+08:00",
      "label": "Heat 2"
    },
    {
      "time": "2026-11-21T22:20:00+08:00",
      "label": "Heat 3"
    },
    {
      "time": "2026-11-21T23:35:00+08:00",
      "label": "Announcements (between Heat 3 and Heat 4)"
    },
    {
      "time": "2026-11-21T23:50:00+08:00",
      "label": "Heat 4"
    }
  ],
  "links": [
    {
      "label": "Join Zoom — Meeting ID 862 5138 8707 · Passcode 123456",
      "url": "https://us06web.zoom.us/j/86251388707?pwd=oaUyUbQxPxph14EGvAWgoWaNagFeke.1"
    }
  ],
  "rooms": []
}
```

### 2. A heat is in progress

```json
{
  "enabled": true,
  "state": "round",
  "headline": "HEAT 1 IN PROGRESS",
  "instruction": "Stay in your team breakout room.",
  "button": null,
  "updated": "2026-11-21T19:32:00+08:00",
  "announcements": [
    {
      "time": "2026-11-21T19:00:00+08:00",
      "text": "Please keep mics muted unless presenting.",
      "pinned": true
    },
    {
      "time": "2026-11-21T19:30:00+08:00",
      "text": "Example announcement — newest first."
    }
  ],
  "schedule": [
    {
      "time": "2026-11-21T19:00:00+08:00",
      "label": "Registration & Opening Ceremony / Briefing"
    },
    {
      "time": "2026-11-21T19:30:00+08:00",
      "label": "Heat 1"
    },
    {
      "time": "2026-11-21T20:55:00+08:00",
      "label": "Heat 2"
    },
    {
      "time": "2026-11-21T22:20:00+08:00",
      "label": "Heat 3"
    },
    {
      "time": "2026-11-21T23:35:00+08:00",
      "label": "Announcements (between Heat 3 and Heat 4)"
    },
    {
      "time": "2026-11-21T23:50:00+08:00",
      "label": "Heat 4"
    }
  ],
  "links": [
    {
      "label": "Join Zoom — Meeting ID 862 5138 8707 · Passcode 123456",
      "url": "https://us06web.zoom.us/j/86251388707?pwd=oaUyUbQxPxph14EGvAWgoWaNagFeke.1"
    }
  ],
  "rooms": []
}
```

### 3. Heat ended — back to the main room

```json
{
  "enabled": true,
  "state": "main-room",
  "headline": "HEAT 1 ENDED — RETURN TO THE MAIN ROOM",
  "instruction": "Leave your breakout room and rejoin the main Zoom room now.",
  "button": {
    "label": "Open Zoom",
    "url": "https://us06web.zoom.us/j/86251388707?pwd=oaUyUbQxPxph14EGvAWgoWaNagFeke.1"
  },
  "updated": "2026-11-21T19:32:00+08:00",
  "announcements": [],
  "schedule": [
    {
      "time": "2026-11-21T19:00:00+08:00",
      "label": "Registration & Opening Ceremony / Briefing"
    },
    {
      "time": "2026-11-21T19:30:00+08:00",
      "label": "Heat 1"
    },
    {
      "time": "2026-11-21T20:55:00+08:00",
      "label": "Heat 2"
    },
    {
      "time": "2026-11-21T22:20:00+08:00",
      "label": "Heat 3"
    },
    {
      "time": "2026-11-21T23:35:00+08:00",
      "label": "Announcements (between Heat 3 and Heat 4)"
    },
    {
      "time": "2026-11-21T23:50:00+08:00",
      "label": "Heat 4"
    }
  ],
  "links": [
    {
      "label": "Join Zoom — Meeting ID 862 5138 8707 · Passcode 123456",
      "url": "https://us06web.zoom.us/j/86251388707?pwd=oaUyUbQxPxph14EGvAWgoWaNagFeke.1"
    }
  ],
  "rooms": []
}
```

### 4. Break between heats

```json
{
  "enabled": true,
  "state": "break",
  "headline": "BREAK — HEAT 2 STARTS AT 8:55 PM SGT",
  "instruction": "Stay in the main room. We'll announce when rooms open.",
  "button": null,
  "updated": "2026-11-21T19:32:00+08:00",
  "announcements": [],
  "schedule": [
    {
      "time": "2026-11-21T19:00:00+08:00",
      "label": "Registration & Opening Ceremony / Briefing"
    },
    {
      "time": "2026-11-21T19:30:00+08:00",
      "label": "Heat 1"
    },
    {
      "time": "2026-11-21T20:55:00+08:00",
      "label": "Heat 2"
    },
    {
      "time": "2026-11-21T22:20:00+08:00",
      "label": "Heat 3"
    },
    {
      "time": "2026-11-21T23:35:00+08:00",
      "label": "Announcements (between Heat 3 and Heat 4)"
    },
    {
      "time": "2026-11-21T23:50:00+08:00",
      "label": "Heat 4"
    }
  ],
  "links": [
    {
      "label": "Join Zoom — Meeting ID 862 5138 8707 · Passcode 123456",
      "url": "https://us06web.zoom.us/j/86251388707?pwd=oaUyUbQxPxph14EGvAWgoWaNagFeke.1"
    }
  ],
  "rooms": []
}
```

### 5. Announcements (between Heat 3 and Heat 4)

```json
{
  "enabled": true,
  "state": "info",
  "headline": "ANNOUNCEMENTS — STAY IN THE MAIN ROOM",
  "instruction": "Heat 4 starts shortly after.",
  "button": null,
  "updated": "2026-11-21T19:32:00+08:00",
  "announcements": [],
  "schedule": [
    {
      "time": "2026-11-21T19:00:00+08:00",
      "label": "Registration & Opening Ceremony / Briefing"
    },
    {
      "time": "2026-11-21T19:30:00+08:00",
      "label": "Heat 1"
    },
    {
      "time": "2026-11-21T20:55:00+08:00",
      "label": "Heat 2"
    },
    {
      "time": "2026-11-21T22:20:00+08:00",
      "label": "Heat 3"
    },
    {
      "time": "2026-11-21T23:35:00+08:00",
      "label": "Announcements (between Heat 3 and Heat 4)"
    },
    {
      "time": "2026-11-21T23:50:00+08:00",
      "label": "Heat 4"
    }
  ],
  "links": [
    {
      "label": "Join Zoom — Meeting ID 862 5138 8707 · Passcode 123456",
      "url": "https://us06web.zoom.us/j/86251388707?pwd=oaUyUbQxPxph14EGvAWgoWaNagFeke.1"
    }
  ],
  "rooms": []
}
```

### 6. Finished

```json
{
  "enabled": true,
  "state": "finished",
  "headline": "THANK YOU — THE COMPETITION HAS ENDED",
  "instruction": "Results will be posted on the Results page.",
  "button": null,
  "updated": "2026-11-21T19:32:00+08:00",
  "announcements": [],
  "schedule": [
    {
      "time": "2026-11-21T19:00:00+08:00",
      "label": "Registration & Opening Ceremony / Briefing"
    },
    {
      "time": "2026-11-21T19:30:00+08:00",
      "label": "Heat 1"
    },
    {
      "time": "2026-11-21T20:55:00+08:00",
      "label": "Heat 2"
    },
    {
      "time": "2026-11-21T22:20:00+08:00",
      "label": "Heat 3"
    },
    {
      "time": "2026-11-21T23:35:00+08:00",
      "label": "Announcements (between Heat 3 and Heat 4)"
    },
    {
      "time": "2026-11-21T23:50:00+08:00",
      "label": "Heat 4"
    }
  ],
  "links": [
    {
      "label": "Join Zoom — Meeting ID 862 5138 8707 · Passcode 123456",
      "url": "https://us06web.zoom.us/j/86251388707?pwd=oaUyUbQxPxph14EGvAWgoWaNagFeke.1"
    }
  ],
  "rooms": []
}
```

