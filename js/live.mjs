// js/live.mjs
// Polls data/live.json and swaps the hero for the live competition board
// while `enabled` is true. Failures never blank the page: the last good
// render stays and a "Reconnecting…" note appears.
import { validateLive } from './live-schema.mjs';
import {
  renderLiveBoardHTML,
  renderLiveAnnouncementsHTML,
  renderLiveInfoHTML,
} from './live-render.mjs';

const POLL_MS = 20000;
const BASE_TITLE = 'UWC Ethics Invitational 2026';

export function initLive() {
  const board = document.getElementById('live-board');
  const boardRoot = document.getElementById('live-board-root');
  const info = document.getElementById('live-info');
  const infoRoot = document.getElementById('live-info-root');
  const hero = document.getElementById('hero');
  if (!board || !boardRoot || !info || !infoRoot) return;

  let lastRaw = null;
  let rendered = false;

  function setReconnecting(on) {
    const note = boardRoot.querySelector('[data-live-note]');
    if (note) note.hidden = !on;
  }

  function apply(data) {
    if (!data.enabled) {
      board.hidden = true;
      info.hidden = true;
      if (hero) hero.hidden = false;
      document.title = BASE_TITLE;
      rendered = false;
      return;
    }
    boardRoot.innerHTML = renderLiveBoardHTML(data);
    const infoHTML = renderLiveAnnouncementsHTML(data) + renderLiveInfoHTML(data);
    infoRoot.innerHTML = infoHTML;
    board.hidden = false;
    info.hidden = infoHTML === '';
    if (hero) hero.hidden = true;
    document.title = `${data.headline} · ${BASE_TITLE}`;
    rendered = true;
  }

  async function poll() {
    if (document.hidden) return;
    try {
      const res = await fetch(`data/live.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.text();
      if (raw === lastRaw) {
        setReconnecting(false);
        return;
      }
      const data = JSON.parse(raw);
      const { ok } = validateLive(data);
      if (!ok) throw new Error('invalid live.json');
      lastRaw = raw;
      apply(data);
    } catch {
      if (rendered) setReconnecting(true);
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) poll();
  });
  setInterval(poll, POLL_MS);
  poll();
}
