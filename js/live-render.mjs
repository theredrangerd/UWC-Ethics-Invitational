// js/live-render.mjs
// Pure HTML renderers for the live competition board (data/live.json).
import { isHttpUrl } from './live-schema.mjs';

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * @param {string} iso
 * @param {{ timeZone?: string, locale?: string }} [opts] viewer's zone/locale by default
 * @returns {string} e.g. "14:32 GMT+8", or '' if the date or zone is invalid
 */
export function formatTime(iso, { timeZone, locale } = {}) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
      timeZone,
    }).format(date);
  } catch {
    return '';
  }
}

function timestamp(iso) {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function timeTag(iso, opts) {
  const text = formatTime(iso, opts);
  return text ? `<time class="live__time" datetime="${escapeHTML(iso)}">${escapeHTML(text)}</time>` : '';
}

function safeLink(url, label, className = '') {
  if (!isHttpUrl(url)) return escapeHTML(label);
  const cls = className ? ` class="${className}"` : '';
  return `<a${cls} href="${escapeHTML(url)}" target="_blank" rel="noopener">${escapeHTML(label)}</a>`;
}

/** @returns {string} */
export function renderLiveBoardHTML(live, opts = {}) {
  const button =
    live.button && isHttpUrl(live.button.url)
      ? `<a class="btn btn--primary btn--lg" href="${escapeHTML(live.button.url)}" target="_blank" rel="noopener">${escapeHTML(live.button.label)}</a>`
      : '';
  const instruction = live.instruction
    ? `<p class="live__instruction">${escapeHTML(live.instruction)}</p>`
    : '';

  return `
    <div class="live__panel" data-state="${escapeHTML(live.state)}">
      <p class="live__badge"><span class="live__dot" aria-hidden="true"></span>LIVE</p>
      <div class="live__status" aria-live="polite">
        <h1 class="live__headline">${escapeHTML(live.headline)}</h1>
        ${instruction}
      </div>
      ${button ? `<div class="live__cta">${button}</div>` : ''}
      <p class="live__updated">Updated ${timeTag(live.updated, opts)}
        <span class="live__note" data-live-note hidden>Reconnecting…</span></p>
    </div>`;
}

/** @returns {string} pinned first, then newest first; '' when none */
export function renderLiveAnnouncementsHTML(live, opts = {}) {
  const items = (live.announcements || []).slice().sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    return timestamp(b.time) - timestamp(a.time);
  });
  if (items.length === 0) return '';

  const rows = items
    .map(
      (a) => `
      <li class="live-announcements__item${a.pinned ? ' live-announcements__item--pinned' : ''}">
        ${a.pinned ? '<span class="live-announcements__pin">Pinned</span>' : ''}
        ${timeTag(a.time, opts)}
        <p>${escapeHTML(a.text)}</p>
      </li>`
    )
    .join('');

  return `
    <div class="live-announcements">
      <h2>Announcements</h2>
      <ul class="live-announcements__list">${rows}</ul>
    </div>`;
}

/** @returns {string} rooms / links / schedule; each omitted when empty, '' when all are */
export function renderLiveInfoHTML(live, opts = {}) {
  const rooms = live.rooms || [];
  const links = live.links || [];
  const schedule = (live.schedule || []).slice().sort((a, b) => timestamp(a.time) - timestamp(b.time));
  const sections = [];

  if (rooms.length) {
    const rows = rooms
      .map(
        (r) => `
        <tr>
          <td>${escapeHTML(r.team)}</td>
          <td>${escapeHTML(r.school || '')}</td>
          <td>${escapeHTML(r.room)}</td>
        </tr>`
      )
      .join('');
    sections.push(`
      <div class="live-info__block">
        <h3>Team rooms</h3>
        <table class="live-info__rooms">
          <thead><tr><th>Team</th><th>School</th><th>Room</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`);
  }

  if (links.length) {
    const items = links.map((l) => `<li>${safeLink(l.url, l.label)}</li>`).join('');
    sections.push(`
      <div class="live-info__block">
        <h3>Links</h3>
        <ul class="live-info__links">${items}</ul>
      </div>`);
  }

  if (schedule.length) {
    const items = schedule
      .map((s) => `<li>${timeTag(s.time, opts)}<span>${escapeHTML(s.label)}</span></li>`)
      .join('');
    sections.push(`
      <div class="live-info__block">
        <h3>Schedule</h3>
        <ul class="live-info__schedule">${items}</ul>
      </div>`);
  }

  if (sections.length === 0) return '';
  return `<div class="live-info"><h2>Competition info</h2>${sections.join('')}</div>`;
}
