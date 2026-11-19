import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTime,
  renderLiveBoardHTML,
  renderLiveAnnouncementsHTML,
  renderLiveInfoHTML,
} from './live-render.mjs';

const OPTS = { timeZone: 'Asia/Singapore', locale: 'en-GB' };

const live = (patch = {}) => ({
  enabled: true,
  state: 'round',
  headline: 'HEAT 1 IN PROGRESS',
  instruction: 'Stay in your team breakout room.',
  updated: '2026-11-21T19:32:00+08:00',
  ...patch,
});

test('formatTime gives HH:MM in the requested zone', () => {
  assert.ok(formatTime('2026-11-21T14:32:00+08:00', OPTS).startsWith('14:32'));
});

test('formatTime includes a zone name', () => {
  assert.match(formatTime('2026-11-21T14:32:00+08:00', OPTS), /GMT\+8|SGT/);
});

test('formatTime returns empty string for an unparseable date', () => {
  assert.equal(formatTime('garbage', OPTS), '');
});

test('formatTime returns empty string for an invalid time zone', () => {
  assert.equal(formatTime('2026-11-21T14:32:00+08:00', { timeZone: 'Nope/Zone' }), '');
});

test('board shows state, headline and live region', () => {
  const html = renderLiveBoardHTML(live(), OPTS);
  assert.ok(html.includes('data-state="round"'));
  assert.ok(html.includes('HEAT 1 IN PROGRESS'));
  assert.ok(html.includes('aria-live="polite"'));
  assert.ok(html.includes('Stay in your team breakout room.'));
});

test('board shows updated time and a hidden reconnecting note', () => {
  const html = renderLiveBoardHTML(live(), OPTS);
  assert.ok(html.includes('Updated'));
  assert.ok(html.includes('19:32'));
  assert.match(html, /data-live-note[^>]*hidden/);
  assert.ok(html.includes('Reconnecting…'));
});

test('board escapes HTML in the headline', () => {
  const html = renderLiveBoardHTML(live({ headline: '<script>alert(1)</script>' }), OPTS);
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
});

test('board renders the button with safe link attributes', () => {
  const html = renderLiveBoardHTML(
    live({ button: { label: 'Open Zoom', url: 'https://zoom.us/j/1' } }),
    OPTS
  );
  assert.ok(html.includes('<a class="btn btn--primary btn--lg"'));
  assert.ok(html.includes('href="https://zoom.us/j/1"'));
  assert.ok(html.includes('rel="noopener"'));
  assert.ok(html.includes('Open Zoom'));
});

test('board never renders a javascript: href', () => {
  const html = renderLiveBoardHTML(
    live({ button: { label: 'Go', url: 'javascript:alert(1)' } }),
    OPTS
  );
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(!html.includes('<a class="btn'));
});

test('board without a button renders no button link', () => {
  assert.ok(!renderLiveBoardHTML(live({ button: null }), OPTS).includes('<a class="btn'));
});

test('announcements: pinned first, then newest first', () => {
  const html = renderLiveAnnouncementsHTML(
    live({
      announcements: [
        { time: '2026-11-21T19:10:00+08:00', text: 'OLDER' },
        { time: '2026-11-21T19:40:00+08:00', text: 'NEWER' },
        { time: '2026-11-21T19:00:00+08:00', text: 'PINNED', pinned: true },
      ],
    }),
    OPTS
  );
  const order = ['PINNED', 'NEWER', 'OLDER'].map((t) => html.indexOf(t));
  assert.ok(order.every((i) => i >= 0), 'all present');
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
});

test('announcement text is escaped', () => {
  const html = renderLiveAnnouncementsHTML(
    live({ announcements: [{ time: '2026-11-21T19:00:00+08:00', text: 'a & <b>bold</b>' }] }),
    OPTS
  );
  assert.ok(html.includes('a &amp; &lt;b&gt;bold&lt;/b&gt;'));
  assert.ok(!html.includes('<b>'));
});

test('announcement with a bad time does not throw and keeps its text', () => {
  const html = renderLiveAnnouncementsHTML(
    live({ announcements: [{ time: 'x', text: 'STILL SHOWN' }] }),
    OPTS
  );
  assert.ok(html.includes('STILL SHOWN'));
});

test('no announcements renders nothing', () => {
  assert.equal(renderLiveAnnouncementsHTML(live({ announcements: [] }), OPTS), '');
  assert.equal(renderLiveAnnouncementsHTML(live(), OPTS), '');
});

test('info with nothing to show renders nothing', () => {
  assert.equal(renderLiveInfoHTML(live({ rooms: [], links: [], schedule: [] }), OPTS), '');
  assert.equal(renderLiveInfoHTML(live(), OPTS), '');
});

test('info with only rooms omits the schedule and links headings', () => {
  const html = renderLiveInfoHTML(
    live({ rooms: [{ team: 'Team A', school: 'UWC SEA', room: 'Room 4' }] }),
    OPTS
  );
  assert.ok(html.includes('Team A'));
  assert.ok(html.includes('Room 4'));
  assert.ok(!html.includes('Schedule'));
  assert.ok(!html.includes('Links'));
});

test('info lists schedule in ascending time order', () => {
  const html = renderLiveInfoHTML(
    live({
      schedule: [
        { time: '2026-11-21T20:55:00+08:00', label: 'SECOND' },
        { time: '2026-11-21T19:30:00+08:00', label: 'FIRST' },
      ],
    }),
    OPTS
  );
  assert.ok(html.includes('Schedule'));
  assert.ok(html.indexOf('FIRST') < html.indexOf('SECOND'));
});

test('info links render http(s) only and escape labels', () => {
  const html = renderLiveInfoHTML(
    live({
      links: [
        { label: 'Zoom <1>', url: 'https://zoom.us/j/1' },
        { label: 'EVIL', url: 'javascript:alert(1)' },
      ],
    }),
    OPTS
  );
  assert.ok(html.includes('href="https://zoom.us/j/1"'));
  assert.ok(html.includes('Zoom &lt;1&gt;'));
  assert.ok(!html.includes('href="javascript:'));
});
